// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const admin = "74000000-0000-0000-0000-000000000001";
const seller = "74000000-0000-0000-0000-000000000002";
const ops = "74000000-0000-0000-0000-000000000003";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;

beforeAll(async () => {
  pg = await createDatabase();
  for (const [id, role] of [
    [admin, "admin"],
    [seller, "vendedor"],
    [ops, "operacion"],
  ]) {
    await pg.query("insert into auth.users(id,email) values($1,$2)", [id, `${role}@scenario.test`]);
    await pg.query("update profiles set role=$2 where id=$1", [id, role]);
  }
  await pg.exec("insert into currencies(code,name) values('USD','Dólar') on conflict do nothing");
}, 30000);
afterAll(async () => pg?.close());

describe("consolidated tour scenario schema", () => {
  it("preserves blank seasons and missing costs instead of inventing ALL or zero", async () => {
    const service = await one<{ id: string }>(
      "insert into services(sku,name,type,pricing_unit,currency) values('RATE-NULL','Pendiente','extra','per_unit','USD') returning id",
    );
    const rate = await one<{ season: string | null; price_net: number | null }>(
      "insert into service_rates(service_id,season,rate_year,import_key,pricing_enabled) values($1,null,2027,'rate-null',false) returning season,price_net",
      [service.id],
    );
    expect(rate).toEqual({ season: null, price_net: null });
    await expect(
      pg.query(
        "insert into service_rates(service_id,season,rate_year,import_key,price_rack) values($1,'ALL',2027,'rack-only',999)",
        [service.id],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("allows DRY/RAIN, 2026/2027 and pax 1-5 with the requested visible codes", async () => {
    for (const year of [2026, 2027]) for (const season of ["DRY", "RAIN"]) for (const pax of [1, 2, 3, 4, 5]) {
      const scenario = await one<{ id: string }>(
        `insert into tour_cost_scenarios(tour_sku,rate_year,season,pax,status,import_key,import_fingerprint)
         values('UYUUYU-3D2N-PTd',$1,$2,$3,'activo',$4,$4) returning id`,
        [year, season, pax, `${year}-${season}-${pax}`],
      );
      await pg.query(
        "insert into tour_cost_scenario_days(scenario_id,day_number,visible_code) values($1,1,$2)",
        [scenario.id, `UYUUYU-3D2N-PTd-P${pax}-D1`],
      );
    }
    expect(
      (
        await pg.query(
          "select id from tour_cost_scenario_days where visible_code='UYUUYU-3D2N-PTd-P3-D1'",
        )
      ).rows,
    ).toHaveLength(4);
  });

  it("keeps ordered services, unresolved references and explicit date exclusions", async () => {
    const scenario = await one<{ id: string }>(
      `insert into tour_cost_scenarios(tour_sku,rate_year,season,pax,status,import_key,import_fingerprint)
       values('ORDERED',2027,'DRY',2,'activo','ordered','ordered') returning id`,
    );
    for (const day of [2, 1]) {
      const row = await one<{ id: string }>(
        "insert into tour_cost_scenario_days(scenario_id,day_number,visible_code) values($1,$2,$3) returning id",
        [scenario.id, day, `ORDERED-P2-D${day}`],
      );
      await pg.query(
        `insert into tour_cost_scenario_lines(scenario_day_id,line_key,unresolved_service_ref,description,quantity,billing_unit,cost_basis,original_amount,original_currency,resolution_issue)
         values($1,$2,'EXCEL-SIN-SKU','Referencia conservada',1,'PER_SERVICE','LINE_TOTAL',null,'USD','Servicio no resuelto')`,
        [row.id, `line-${day}`],
      );
    }
    expect(
      (
        await pg.query(
          "select day_number from tour_cost_scenario_days where scenario_id=$1 order by day_number",
          [scenario.id],
        )
      ).rows,
    ).toEqual([{ day_number: 1 }, { day_number: 2 }]);
    const service = await one<{ id: string }>(
      "insert into services(sku,name,type,pricing_unit,currency) values('EXCLUSION','Exclusión','extra','per_unit','USD') returning id",
    );
    const rate = await one<{ exclusion_text: string; date_exclusions: unknown }>(
      `insert into service_rates(service_id,season,rate_year,import_key,price_net,exclusion_text,date_exclusions)
       values($1,'ALL',2027,'excluded',100,'EXCLUYE AÑO NUEVO Y CARNAVALES','[{"from":"2027-01-01","to":"2027-01-01"}]')
       returning exclusion_text,date_exclusions`,
      [service.id],
    );
    expect(rate.exclusion_text).toMatch(/CARNAVALES/);
    expect(rate.date_exclusions).toEqual([{ from: "2027-01-01", to: "2027-01-01" }]);
  });

  it("enforces stable idempotency keys without touching manual catalog records", async () => {
    await expect(
      pg.query(`insert into tour_cost_scenarios(tour_sku,rate_year,season,pax,import_key,import_fingerprint)
        values('OTHER',2028,'DRY',1,'ordered','different')`),
    ).rejects.toMatchObject({ code: "23505" });
    const block = await one<{ id: string }>(
      "insert into day_blocks(code,catalog_origin,status) values('MANUAL-STILL-HERE','manual','activo') returning id",
    );
    expect(await one("select code,catalog_origin from day_blocks where id=$1", [block.id])).toEqual(
      { code: "MANUAL-STILL-HERE", catalog_origin: "manual" },
    );
  });

  it("enforces day-code, immutable identity and same-scenario issue references", async () => {
    const ordered = await one<{ id: string }>(
      "select id from tour_cost_scenarios where import_key='ordered'",
    );
    await expect(
      pg.query(
        "insert into tour_cost_scenario_days(scenario_id,day_number,visible_code) values($1,3,'WRONG')",
        [ordered.id],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      pg.query("update tour_cost_scenarios set pax=3 where id=$1", [ordered.id]),
    ).rejects.toMatchObject({ code: "23514" });
    const other = await one<{ id: string }>(
      `insert into tour_cost_scenarios(tour_sku,rate_year,season,pax,import_key,import_fingerprint)
       values('OTHER-ISSUE',2027,'DRY',1,'other-issue','other-issue') returning id`,
    );
    const foreignDay = await one<{ id: string }>(
      "select id from tour_cost_scenario_days where scenario_id=$1 order by day_number limit 1",
      [ordered.id],
    );
    await expect(
      pg.query(
        "insert into tour_cost_scenario_issues(scenario_id,scenario_day_id,code,detail) values($1,$2,'CROSS','Inválida')",
        [other.id, foreignDay.id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("does not reintroduce economic_status as an activation gate", async () => {
    const template = await one<{ status: string; economic_status: string }>(
      `insert into itinerary_templates(sku,name,route_type,days,nights,category,status,economic_status,economic_issues)
       values('ECON-HISTORY','Histórica','ONEWAY',1,0,'BUDGET','activo','blocked',array['Dato histórico'])
       returning status,economic_status`,
    );
    expect(template).toEqual({ status: "activo", economic_status: "blocked" });
  });

  it("lets sellers read active scenarios but not mutate them through RLS", async () => {
    const pending = await one<{ id: string }>(
      `insert into tour_cost_scenarios(tour_sku,rate_year,season,pax,import_key,import_fingerprint,created_by)
       values('PRIVATE',2027,'DRY',1,'private','private',$1) returning id`,
      [admin],
    );
    await pg.exec("set role authenticated");
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [seller]);
    expect(
      (await pg.query("select tour_sku from tour_cost_scenarios where import_key='ordered'")).rows,
    ).toEqual([{ tour_sku: "ORDERED" }]);
    expect(
      (
        await pg.query(
          "update tour_cost_scenarios set pax=4 where import_key='ordered' returning id",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (await pg.query("select id from tour_cost_scenarios where id=$1", [pending.id])).rows,
    ).toEqual([]);
    expect(
      (
        await pg.query(
          `select l.id from tour_cost_scenario_lines l join tour_cost_scenario_days d on d.id=l.scenario_day_id
           join tour_cost_scenarios s on s.id=d.scenario_id where s.import_key='ordered'`,
        )
      ).rows.length,
    ).toBeGreaterThan(0);
    await expect(
      pg.query(
        "insert into tour_cost_scenario_days(scenario_id,day_number,visible_code) values($1,3,'ORDERED-P2-D3')",
        [(await one<{ id: string }>("select id from tour_cost_scenarios where import_key='ordered'")).id],
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [ops]);
    expect(
      (
        await pg.query(
          "update tour_cost_scenarios set status='activo' where id=$1 returning status",
          [pending.id],
        )
      ).rows,
    ).toEqual([{ status: "activo" }]);
    await pg.exec("reset role");
  });

  it("enables RLS, grants authenticated access through policies and adds lookup indexes", async () => {
    const tables = [
      "tour_cost_scenarios",
      "tour_cost_scenario_days",
      "tour_cost_scenario_lines",
      "tour_cost_scenario_issues",
    ];
    expect(
      (
        await pg.query(
          "select relname,relrowsecurity from pg_class where relname=any($1) order by relname",
          [tables],
        )
      ).rows,
    ).toEqual(
      [...tables].sort().map((relname) => ({ relname, relrowsecurity: true })),
    );
    expect(
      (
        await one<{ count: number }>(
        "select count(*)::int count from pg_indexes where schemaname='public' and indexname like 'tour_cost_%_idx'",
        )
      ).count,
    ).toBeGreaterThanOrEqual(8);
    expect(
      await one<{ economic_constraints: number }>(
        `select count(*)::int economic_constraints from pg_constraint c
         join pg_class t on t.oid=c.conrelid where t.relname='tour_cost_scenarios'
         and pg_get_constraintdef(c.oid) ilike '%economic_status%'`,
      ),
    ).toEqual({ economic_constraints: 0 });
  });
});
