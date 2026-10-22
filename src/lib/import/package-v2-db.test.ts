// @vitest-environment node
import { afterAll, beforeAll, describe, it, expect, vi } from "vitest";
import { pgliteSupabase } from "../../test/pglite-supabase";
const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({
  db: {
    from: (...a: Parameters<ReturnType<typeof pgliteSupabase>["from"]>) =>
      transport.client!.from(...a),
    rpc: (...a: Parameters<ReturnType<typeof pgliteSupabase>["rpc"]>) =>
      transport.client!.rpc(...a),
  },
  json: (v: unknown) => JSON.parse(JSON.stringify(v)),
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  },
}));
import { createQuoteFromTemplate, loadQuote } from "../quotes";
import { costTemplate } from "../pricing/template-cost";
import { stageImportPackage, discardImportBatch, loadImportBatch } from "./index";
import { includedSegmentsForDay, proposeSegmentForBlocks } from "../quotes/import-segments";
import { resolveDay } from "../quotes/day-content";
import { readFile } from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import {
  parsePackageV2,
  packageFiles,
  validatePackageV2,
  type ImportCatalog,
  type PackageV2,
} from "./package-v2";
import { diffPackageV2, importTables } from "./plan-v2";
let pg: Awaited<ReturnType<typeof createDatabase>>, pkg: PackageV2;
const admin = "91000000-0000-0000-0000-000000000001",
  seller = "91000000-0000-0000-0000-000000000002";
async function catalog(): Promise<ImportCatalog> {
  return Object.fromEntries(
    await Promise.all(
      importTables.map(async (t) => [
        t,
        (
          await pg.query<{ data: Record<string, unknown> }>(
            `select to_jsonb(t) data from public.${t} t`,
          )
        ).rows.map((r) => r.data),
      ]),
    ),
  );
}
async function stage(p = pkg) {
  const c = await catalog();
  const changes = diffPackageV2(p, c);
  const v = validatePackageV2(p);
  const r = await pg.query<{ id: string }>(
    "select public.stage_import_package('fixture.zip',$1,$2,$3) id",
    [JSON.stringify(p), JSON.stringify(changes), JSON.stringify(v)],
  );
  return { id: r.rows[0]!.id, changes };
}
async function commit(id: string) {
  return (
    await pg.query<{ result: { status: string; error?: string } }>(
      "select public.commit_import_batch($1) result",
      [id],
    )
  ).rows[0]!.result;
}
async function as(user: string) {
  await pg.exec("reset role;set role authenticated");
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
}
beforeAll(async () => {
  pg = await createDatabase();
  transport.client = pgliteSupabase(pg);
  const files = Object.fromEntries(
    await Promise.all(
      packageFiles.map(async (name) => [
        `${name}.csv`,
        await readFile(
          new URL(`../../test/fixtures/import-v2-sintetico/${name}.csv`, import.meta.url),
          "utf8",
        ),
      ]),
    ),
  );
  pkg = parsePackageV2(files);
  await pg.exec(
    `insert into currencies(code,name) values('USD','USD'),('CLP','CLP'),('BOB','BOB') on conflict do nothing;insert into auth.users(id) values('${admin}'),('${seller}');insert into profiles(id,role) values('${admin}','admin'),('${seller}','vendedor') on conflict(id) do update set role=excluded.role;`,
  );
  await as(admin);
}, 120000);
afterAll(async () => {
  await pg?.close();
});
describe.sequential("staging y commit reales con RLS", () => {
  it("previsualiza sin escribir y confirma todas las filas del fixture", async () => {
    const before = (await pg.query<{ n: number }>("select count(*) n from public.services"))
      .rows[0]!.n;
    const s = await stage();
    expect(
      s.changes
        .filter((r) => r.table_name !== "location_codes")
        .every((r) => r.action === "insert"),
    ).toBe(true);
    expect(
      (await pg.query<{ n: number }>("select count(*) n from public.services")).rows[0]!.n,
    ).toBe(before);
    expect(await commit(s.id)).toMatchObject({ status: "committed" });
    await pg.exec("reset role");
    for (const change of s.changes) {
      const actual = (
        await pg.query<{ data: unknown }>("select public._import_current($1,$2) data", [
          change.table_name,
          JSON.stringify(change.payload),
        ])
      ).rows[0]!.data;
      expect(actual, change.table_name + ":" + change.natural_key).toEqual(change.payload);
    }
    await as(admin);
    expect(
      (await pg.query<{ n: number }>("select count(*)::int n from template_segment_items")).rows[0]!
        .n,
    ).toBe(2);
    expect(
      (
        await pg.query<{ capacities: number[] }>(
          "select array_agg(vehicle_max_pax_override order by slot_key) capacities from template_segment_items",
        )
      ).rows[0]!.capacities,
    ).toEqual([6, 6]);
    expect(
      (
        await pg.query<{ n: number }>(
          "select count(*)::int n from itinerary_templates where import_v2_route is not null",
        )
      ).rows[0]!.n,
    ).toBe(3);
    expect(
      (
        await pg.query<{ n: number }>(
          "select count(*)::int n from day_block_items i join services s on s.id=i.service_id where s.sku like 'T_4X4%' ",
        )
      ).rows[0]!.n,
    ).toBe(0);
    expect(
      (await pg.query<{ n: number }>("select count(*)::int n from template_day_items")).rows[0]!.n,
    ).toBe(pkg.lodging.length);
  });
  it("repetir el zip es todo skip y cambiar un precio es un update", async () => {
    const s = await stage();
    expect(
      s.changes.every((r) => r.action === "skip"),
      JSON.stringify(s.changes.filter((r) => r.action !== "skip")),
    ).toBe(true);
    expect((await commit(s.id)).status).toBe("committed");
    const p = structuredClone(pkg);
    p.tariffs[0]!["PRECIO_USD"] = "801";
    const changed = await stage(p);
    expect(changed.changes.filter((r) => r.action === "update")).toHaveLength(1);
    expect((await commit(changed.id)).status).toBe("committed");
  });
  it("aceptar avisos no activa plantillas sin validación económica", async () => {
    const template = (
      await pg.query<{ id: string }>(
        "select id from itinerary_templates where economic_status='pending' order by sku limit 1",
      )
    ).rows[0]!.id;
    const selected = (
      await pg.query<{ result: { approved: number; pending: number } }>(
        "select public.approve_templates(array[$1]::uuid[],true) result",
        [template],
      )
    ).rows[0]!.result;
    expect(selected).toMatchObject({ approved: 0, pending: 1 });
    expect(
      (
        await pg.query<{ status: string }>("select status from itinerary_templates where id=$1", [
          template,
        ])
      ).rows[0]!.status,
    ).toBe("pendiente");
    const bulk = (
      await pg.query<{ result: { fingerprint: string; templates: { eligible: number } } }>(
        "select public.approve_valid_imports(true,null,true) result",
      )
    ).rows[0]!.result;
    await pg.query("select public.approve_valid_imports(false,$1,true)", [bulk.fingerprint]);
    expect(
      (
        await pg.query<{ n: number }>(
          "select count(*)::int n from itinerary_templates where import_v2_route is not null and economic_status<>'validated' and status='pendiente'",
        )
      ).rows[0]!.n,
    ).toBe(3);
  });
  it("crea la cotización con habitaciones fuera de bloques y un solo cargo de tramo", async () => {
    const template = (
      await pg.query<{ id: string }>(
        "select id from itinerary_templates where sku='SPASPA-4D3N-AB'",
      )
    ).rows[0]!.id;
    const client = (
      await pg.query<{ id: string }>(
        "insert into clients(type,name) values('B2C','Import sintético') returning id",
      )
    ).rows[0]!.id;
    await pg.query("update itinerary_templates set economic_status='validated' where id=$1", [
      template,
    ]);
    // The preceding test changed the first segment to 801 USD.
    expect((await costTemplate(template, { pax: 2 })).total_cost_usd).toBe(1861);
    await expect(costTemplate(template, { pax: 1 })).rejects.toThrow(/sin tramo de pasajeros/);
    const q = await createQuoteFromTemplate(template, {
      client_id: client,
      language: "es",
      start_date: "2026-11-01",
      pax_paying: 2,
      fx_snapshot: { USD: 1, CLP: 900, BOB: 7 },
    });
    expect(Number(q.total_cost_usd)).toBeCloseTo(1861, 2);
    const saved = await loadQuote(q.id);
    expect(resolveDay(saved.days[1]!).client_note?.["es"]).toContain("lluvia");
    expect(resolveDay(saved.days[0]!).accommodation_text?.["es"]).toBe("Hotel A");
    const segment = saved.items.filter((i) => i.sku === "T_4X4_4D");
    expect(segment).toHaveLength(1);
    expect(includedSegmentsForDay(saved.items, 2)[0]?.label).toBe("incluido en Día 1");
    expect((await proposeSegmentForBlocks("SPASPA", 4, 7))[0]?.qty).toBe(2);
    expect(segment.every((i) => i.billing === "per_service" && i.span_days === 4)).toBe(true);
    expect(segment.filter((i) => Number(i.total_cost_usd) > 0)).toHaveLength(1);
    expect(saved.items.filter((i) => i.slot_key === "ALOJAMIENTO").length).toBeGreaterThan(0);
  });
  it("las diez cotizaciones importadas reproducen el control, incluido el tramo 5–9", async () => {
    const client = (
      await pg.query<{ id: string }>(
        "insert into clients(type,name) values('B2C','Control de importación') returning id",
      )
    ).rows[0]!.id;
    for (const sku of ["SPASPA-4D3N-AB", "UYUUYU-3D2N-AB"]) {
      const template = (
        await pg.query<{ id: string }>("select id from itinerary_templates where sku=$1", [sku])
      ).rows[0]!.id;
      await pg.query("update itinerary_templates set economic_status='validated' where id=$1", [
        template,
      ]);
      for (let pax = 1; pax <= 5; pax++) {
        if (sku === "SPASPA-4D3N-AB" && pax === 1) {
          await expect(costTemplate(template, { pax })).rejects.toThrow(/sin tramo de pasajeros/);
          continue;
        }
        const expected = (await costTemplate(template, { pax })).total_cost_usd;
        const q = await createQuoteFromTemplate(template, {
          client_id: client,
          language: "es",
          start_date: "2026-11-01",
          pax_paying: pax,
          category: "COMFORT",
          fx_snapshot: { USD: 1, CLP: 900, BOB: 7 },
        });
        expect(Number(q.total_cost_usd), sku + " " + pax).toBeCloseTo(expected, 2);
        expect((await loadQuote(q.id)).roomingRows.length).toBeGreaterThan(0);
      }
    }
  });
  it("error a mitad revierte todo y conserva el lote staged con diagnóstico", async () => {
    const p = structuredClone(pkg);
    p.tariffs[0]!["PRECIO_USD"] = "999";
    const s = await stage(p);
    await pg.exec("reset role");
    await pg.query(
      "update import_rows set payload=jsonb_set(payload,'{day_to}','0') where batch_id=$1 and table_name='template_segment_items'",
      [s.id],
    );
    // Force a later write; rates are earlier in the fixed dependency order.
    await pg.query(
      "update import_rows set action='update' where batch_id=$1 and table_name='template_segment_items'",
      [s.id],
    );
    await as(admin);
    const r = await commit(s.id);
    expect(r.status).toBe("staged");
    expect(r.error).toBeTruthy();
    expect(
      (
        await pg.query<{ price_net: string }>(
          "select price_net from service_rates r join services s on s.id=r.service_id where s.sku='T_4X4_4D'",
        )
      ).rows[0]!.price_net,
    ).toBe("801.0000");
    expect(
      (await pg.query<{ status: string }>("select status from import_batches where id=$1", [s.id]))
        .rows[0]!.status,
    ).toBe("staged");
  });
  it("cambios después de la vista previa bloquean el commit", async () => {
    const s = await stage();
    await pg.exec("reset role;update services set name='Editado después' where sku='T_ALM'");
    await as(admin);
    expect(await commit(s.id)).toMatchObject({ status: "staged" });
  });
  it("vendedor no lee lotes ni ejecuta stage/commit/purga de v2", async () => {
    await as(seller);
    expect((await pg.query("select * from import_batches")).rows).toEqual([]);
    await expect(
      pg.query("select stage_import_package('x','{}','[]','{\"errors\":[]}')"),
    ).rejects.toThrow("Solo Admin");
    await expect(pg.query("select commit_import_batch(gen_random_uuid())")).rejects.toThrow(
      "Solo Admin",
    );
    await as(admin);
  });
  it("la API de ZIP prepara, pagina y descarta sin cambiar el catálogo", async () => {
    const bytes = zipSync(
      Object.fromEntries(
        await Promise.all(
          packageFiles.map(async (name) => [
            `${name}.csv`,
            strToU8(
              await readFile(
                new URL(`../../test/fixtures/import-v2-sintetico/${name}.csv`, import.meta.url),
                "utf8",
              ),
            ),
          ]),
        ),
      ),
    );
    const s = await stageImportPackage(new File([bytes], "paquete-v2-sintetico.zip"));
    expect(s.validation.errors).toEqual([]);
    expect(s.control).toHaveLength(10);
    expect((await loadImportBatch(s.batchId)).rows.length).toBeGreaterThan(100);
    await discardImportBatch(s.batchId);
    expect((await loadImportBatch(s.batchId)).batch.status).toBe("discarded");
    await expect(commit(s.batchId)).rejects.toThrow("descartado");
  });
  it("valida en servidor aunque el cliente omita sus errores", async () => {
    const broken = structuredClone(pkg);
    broken.tariffs[0]!["VehicleMaxPax"] = "";
    broken.tariffs[0]!["PaxMax"] = "";
    const id = (
      await pg.query<{ id: string }>(
        "select stage_import_package('invalid.zip',$1,'[]','{\"errors\":[]}') id",
        [JSON.stringify(broken)],
      )
    ).rows[0]!.id;
    expect(await commit(id)).toMatchObject({
      status: "staged",
      error: "Hay errores de validación.",
    });
  });
  it("acepta en servidor PaxMax como capacidad y enteros decimales del CSV", async () => {
    const withFallback = structuredClone(pkg);
    withFallback.tariffs[0]!["VehicleMaxPax"] = "";
    withFallback.tariffs[0]!["PaxMax"] = "6.0";
    withFallback.tariffs[1]!["VehicleMaxPax"] = "6.0";
    await pg.exec("reset role");
    const errors = (
      await pg.query<{ errors: unknown[] }>("select _validate_import_package($1) errors", [
        JSON.stringify(withFallback),
      ])
    ).rows[0]!.errors;
    await as(admin);
    expect(errors).toEqual([]);
  });
  it("no confirma una vista previa vacía de un paquete válido", async () => {
    const id = (
      await pg.query<{ id: string }>(
        "select stage_import_package('incomplete.zip',$1,'[]','{\"errors\":[]}') id",
        [JSON.stringify(pkg)],
      )
    ).rows[0]!.id;
    expect(await commit(id)).toMatchObject({
      status: "staged",
      error: "Hay errores de validación.",
    });
  });
  it("importa y reimporta filas STAFF independientes sin fusionarlas", async () => {
    const p = structuredClone(pkg);
    const staff = p.tariffs.find((t) => t["TariffCode"] === "H_A_STAFF")!;
    p.tariffs.push({ ...staff, TariffCode: "H_A_STAFF_DINNER", PRECIO_USD: "5" });
    p.lodging.push({
      ...p.lodging.find(
        (n) => n["sku"] === "SPASPA-4D3N-AB" && n["noche"] === "1" && n["slot"] === "STAFF",
      )!,
      TariffCode: "H_A_STAFF_DINNER",
      servicio: "CENA CONDUCTOR",
    });
    expect(validatePackageV2(p).errors).toEqual([]);
    const first = await stage(p);
    expect(first.changes.some((r) => r.natural_key.includes("H_A_STAFF_DINNER"))).toBe(true);
    expect((await commit(first.id)).status).toBe("committed");
    expect(
      (
        await pg.query<{ n: number }>(
          `select count(*)::int n from template_day_items i
           join itinerary_templates t on t.id=i.template_id
           where t.sku='SPASPA-4D3N-AB' and i.day_number=1 and i.slot_key='STAFF'`,
        )
      ).rows[0]!.n,
    ).toBe(2);
    const second = await stage(p);
    expect(second.changes.every((r) => r.action === "skip")).toBe(true);
    expect((await commit(second.id)).status).toBe("committed");
  });
  it("resuelve un TariffCode histórico por alias sin duplicar ni sobrescribir el servicio", async () => {
    const primary = "HIST_PRIMARY_X";
    const alias = "HIST_ALIAS_X";
    const serviceId = (
      await pg.query<{ id: string }>(
        `insert into services(sku,name,type,pricing_unit,currency,source,status)
         values($1,'Servicio histórico','extra','per_unit','USD','manual','pendiente') returning id`,
        [primary],
      )
    ).rows[0]!.id;
    await pg.query("insert into service_sku_aliases(sku,service_id) values($1,$2)", [
      alias,
      serviceId,
    ]);
    const p = structuredClone(pkg);
    p.tariffs[0]!["PRECIO_USD"] = "801";
    p.tariffs.push({ ...p.tariffs[1]!, TariffCode: alias, PRECIO_USD: "321.45" });
    expect(validatePackageV2(p).errors).toEqual([]);
    const first = await stage(p);
    expect(
      first.changes.some(
        (r) => r.table_name === "services" && r.natural_key === alias && r.action !== "skip",
      ),
    ).toBe(false);
    expect(
      first.changes.filter(
        (r) => r.table_name === "service_rates" && r.payload["service_id"] === serviceId,
      ),
    ).toHaveLength(1);
    const firstResult = await commit(first.id);
    expect(firstResult.status, JSON.stringify(firstResult)).toBe("committed");
    expect((await pg.query("select id from services where sku=$1", [alias])).rows).toEqual([]);
    expect(
      (
        await pg.query<{ n: number }>(
          "select count(*)::int n from service_rates where service_id=$1 and price_net=321.45",
          [serviceId],
        )
      ).rows[0]!.n,
    ).toBe(1);
    const before = (
      await pg.query<{ n: number }>(
        "select count(*)::int n from service_rates where service_id=$1",
        [serviceId],
      )
    ).rows[0]!.n;
    const second = await stage(p);
    expect(second.changes.every((r) => r.action === "skip")).toBe(true);
    expect((await commit(second.id)).status).toBe("committed");
    expect(
      (
        await pg.query<{ n: number }>(
          "select count(*)::int n from service_rates where service_id=$1",
          [serviceId],
        )
      ).rows[0]!.n,
    ).toBe(before);
  });
});
