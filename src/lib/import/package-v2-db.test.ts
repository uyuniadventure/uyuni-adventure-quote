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
import { costPackageTemplate, costTemplate } from "../pricing/template-cost";
import {
  assessPackageTemplates,
  controlPackageCosts,
  stageImportPackage,
  discardImportBatch,
  loadImportBatch,
} from "./index";
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
  const v = validatePackageV2(p);
  const templates = assessPackageTemplates(p);
  const control = controlPackageCosts(p);
  const changes = diffPackageV2(p, c, templates);
  const r = await pg.query<{ id: string }>(
    "select public.stage_import_package('fixture.zip',$1,$2,$3) id",
    [JSON.stringify(p), JSON.stringify(changes), JSON.stringify({ ...v, templates, control })],
  );
  return { id: r.rows[0]!.id, changes };
}
function packageWithValidatedControls() {
  const p = structuredClone(pkg);
  p.tariffs[0]!["PRECIO_USD"] = "801";
  p.controls = p.controls
    .filter((row) => !(row["sku"] === "SPASPA-4D3N-AB" && row["pax"] === "1"))
    .map((row) => ({
      ...row,
      costo_hoja: String(
        costPackageTemplate(
          { pkg: p, sku: row["sku"]! },
          { pax: Number(row["pax"]), tc: Number(row["tc"] || 0) },
        ).total_cost_usd,
      ),
    }));
  return p;
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
function bulkLocationRows(count: number, existing: Set<string>, idOffset = 0) {
  const rows: Array<{
    table_name: string;
    natural_key: string;
    action: "insert";
    payload: { id: string; code: string; name: string; country: string };
    before: null;
  }> = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of alphabet) {
    for (const b of alphabet) {
      for (const c of alphabet) {
        const code = `${a}${b}${c}`;
        if (existing.has(code)) continue;
        const serial = (idOffset + rows.length + 1).toString(16).padStart(12, "0");
        rows.push({
          table_name: "location_codes",
          natural_key: code,
          action: "insert",
          payload: {
            id: `92000000-0000-4000-8000-${serial}`,
            code,
            name: `Ubicación de carga ${idOffset + rows.length + 1}`,
            country: "BOLIVIA",
          },
          before: null,
        });
        existing.add(code);
        if (rows.length === count) return rows;
      }
    }
  }
  throw new Error(`No hay ${count} códigos de ubicación disponibles`);
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
    expect(
      (
        await pg.query<{ sku: string; economic_status: string; economic_issues: string[] }>(
          "select sku,economic_status,economic_issues from itinerary_templates where import_v2_route is not null order by sku",
        )
      ).rows,
    ).toEqual([
      expect.objectContaining({ sku: "SPASPA-4D3N-AB", economic_status: "pending" }),
      expect.objectContaining({
        sku: "UYUUYU-3D2N-AB",
        economic_status: "validated",
        economic_issues: [],
      }),
      expect.objectContaining({ sku: "UYUUYU-3D2N-SOLO-TEXTO", economic_status: "pending" }),
    ]);
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
    expect(
      changed.changes.filter((r) => r.table_name === "service_rates" && r.action === "update"),
    ).toHaveLength(1);
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
    ).toBe(2);
  });
  it("crea la cotización con habitaciones fuera de bloques y un solo cargo de tramo", async () => {
    const staged = await stage(pkg);
    expect((await commit(staged.id)).status).toBe("committed");
    const template = (
      await pg.query<{ id: string }>(
        "select id from itinerary_templates where sku='UYUUYU-3D2N-AB'",
      )
    ).rows[0]!.id;
    const client = (
      await pg.query<{ id: string }>(
        "insert into clients(type,name) values('B2C','Import sintético') returning id",
      )
    ).rows[0]!.id;
    expect(
      (
        await pg.query<{ economic_status: string }>(
          "select economic_status from itinerary_templates where id=$1",
          [template],
        )
      ).rows[0]!.economic_status,
    ).toBe("validated");
    expect((await costTemplate(template, { pax: 2 })).total_cost_usd).toBe(1230);
    const q = await createQuoteFromTemplate(template, {
      client_id: client,
      language: "es",
      start_date: "2026-11-01",
      pax_paying: 2,
      category: "COMFORT",
      fx_snapshot: { USD: 1, CLP: 900, BOB: 7 },
    });
    expect(Number(q.total_cost_usd)).toBeCloseTo(1230, 2);
    const saved = await loadQuote(q.id);
    expect(resolveDay(saved.days[0]!).accommodation_text?.["es"]).toBe("Hotel A");
    const segment = saved.items.filter((i) => i.sku === "T_4X4_3D");
    expect(segment).toHaveLength(1);
    expect(includedSegmentsForDay(saved.items, 2)[0]?.label).toBe("incluido en Día 1");
    expect((await proposeSegmentForBlocks("SPASPA", 4, 7))[0]?.qty).toBe(2);
    expect(segment.every((i) => i.billing === "per_service" && i.span_days === 3)).toBe(true);
    expect(segment.filter((i) => Number(i.total_cost_usd) > 0)).toHaveLength(1);
    expect(saved.items.filter((i) => i.slot_key === "ALOJAMIENTO").length).toBeGreaterThan(0);
  });
  it("crea los cinco escenarios validados y rechaza la plantilla pendiente", async () => {
    const client = (
      await pg.query<{ id: string }>(
        "insert into clients(type,name) values('B2C','Control de importación') returning id",
      )
    ).rows[0]!.id;
    for (const sku of ["UYUUYU-3D2N-AB"]) {
      const template = (
        await pg.query<{ id: string }>("select id from itinerary_templates where sku=$1", [sku])
      ).rows[0]!.id;
      expect(
        (
          await pg.query<{ economic_status: string }>(
            "select economic_status from itinerary_templates where id=$1",
            [template],
          )
        ).rows[0]!.economic_status,
      ).toBe("validated");
      for (let pax = 1; pax <= 5; pax++) {
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
    const pending = (
      await pg.query<{ id: string; economic_status: string }>(
        "select id,economic_status from itinerary_templates where sku='SPASPA-4D3N-AB'",
      )
    ).rows[0]!;
    expect(pending.economic_status).toBe("pending");
    await expect(
      createQuoteFromTemplate(pending.id, {
        client_id: client,
        language: "es",
        start_date: "2026-11-01",
        pax_paying: 2,
        category: "COMFORT",
        fx_snapshot: { USD: 1, CLP: 900, BOB: 7 },
      }),
    ).rejects.toThrow(/validación económica/);
  });
  it("mantiene Sky Dream por persona al pasar de staging a commit", async () => {
    const p = packageWithValidatedControls();
    const lodging = p.lodging.find(
      (row) => row["sku"] === "UYUUYU-3D2N-AB" && row["slot"] === "ALOJAMIENTO",
    )!;
    const base = p.tariffs.find((row) => row["TariffCode"] === "H_A_DBL")!;
    p.tariffs.push({
      ...base,
      TariffCode: "HTL_SKYDREAM_POLQUES_PP_2026",
      Supplier: "SKY DREAM (DON CALIXTO)",
      ServiceName: "Sky Dream",
      UnitType: "PER_PAX_PER_NIGHT",
      RoomType: "STD",
      PRECIO_USD: "43.42",
    });
    p.tariffs.push({
      ...base,
      TariffCode: "MEAL_SKYDREAM_DINNER_2026",
      Supplier: "SKY DREAM (DON CALIXTO)",
      ServiceType: "meal",
      UnitType: "PER_PERSON_PER_NIGHT",
      PRECIO_USD: "1",
    });
    lodging["TariffCode"] = "";
    lodging["proveedor"] = "SKY DREAM (DON CALIXTO)";
    lodging["hotel"] = "Sky Dream";
    lodging["unidad"] = "PER_ROOM_PER_NIGHT";
    p.controls = p.controls
      .filter((row) => row["sku"] === "UYUUYU-3D2N-AB")
      .map((row) => ({
        ...row,
        costo_hoja: String(
          costPackageTemplate(
            { pkg: p, sku: row["sku"]! },
            { pax: Number(row["pax"]), tc: Number(row["tc"] || 0) },
          ).total_cost_usd,
        ),
      }));
    const staged = await stage(p);
    expect((await commit(staged.id)).status).toBe("committed");
    const template = (
      await pg.query<{ id: string; economic_status: string }>(
        "select id,economic_status from itinerary_templates where sku='UYUUYU-3D2N-AB'",
      )
    ).rows[0]!;
    expect(template.economic_status).toBe("validated");
    for (const pax of [1, 2, 3, 5]) {
      const result = await costTemplate(template.id, { pax });
      const sky = result.lines.find((line) => line.sku === "HTL_SKYDREAM_POLQUES_PP_2026")!;
      expect(sky.qty).toBe(pax);
      expect(sky.cost_usd).toBeCloseTo(43.42 * pax, 2);
      expect(result.lines.some((line) => line.sku === "MEAL_SKYDREAM_DINNER_2026")).toBe(false);
    }
  });
  it("protege el estado económico importado y no restringe plantillas manuales", async () => {
    const imported = (
      await pg.query<{ id: string }>(
        "select id from itinerary_templates where sku='UYUUYU-3D2N-AB'",
      )
    ).rows[0]!.id;
    await expect(
      pg.query(
        "update itinerary_templates set economic_status='pending',economic_issues=array['forzado'] where id=$1",
        [imported],
      ),
    ).rejects.toThrow(/solo puede cambiar mediante una importación validada/);
    const manual = (
      await pg.query<{ id: string }>(
        "insert into itinerary_templates(sku,name,route_type,days,nights,status,catalog_origin) values('MANUAL-ECON','Manual','ROUNDTRIP',1,0,'pendiente','manual') returning id",
      )
    ).rows[0]!.id;
    await pg.query(
      "update itinerary_templates set economic_status='pending',economic_issues=array['revisión manual'] where id=$1",
      [manual],
    );
    expect(
      (
        await pg.query<{ economic_status: string }>(
          "select economic_status from itinerary_templates where id=$1",
          [manual],
        )
      ).rows[0]!.economic_status,
    ).toBe("pending");
  });
  it("el servidor rechaza validated si falta un escenario económico evaluado", async () => {
    const c = await catalog();
    const validation = validatePackageV2(pkg);
    const templates = assessPackageTemplates(pkg);
    const changes = diffPackageV2(pkg, c, templates);
    const control = controlPackageCosts(pkg).filter(
      (row) => !(row.sku === "UYUUYU-3D2N-AB" && row.pax === 5),
    );
    const id = (
      await pg.query<{ id: string }>(
        "select stage_import_package('economic-forgery.zip',$1,$2,$3) id",
        [
          JSON.stringify(pkg),
          JSON.stringify(changes),
          JSON.stringify({ ...validation, templates, control }),
        ],
      )
    ).rows[0]!.id;
    expect(await commit(id)).toMatchObject({
      status: "staged",
      error: "Hay errores de validación.",
    });
  });
  it("persiste blocked cuando el alojamiento no puede resolverse", async () => {
    const p = structuredClone(pkg);
    p.tariffs[0]!["PRECIO_USD"] = "801";
    const lodging = p.lodging.find(
      (row) => row["sku"] === "UYUUYU-3D2N-AB" && row["slot"] === "ALOJAMIENTO",
    )!;
    lodging["TariffCode"] = "";
    lodging["proveedor"] = "HOTEL SIN TARIFA";
    lodging["hotel"] = "HOTEL SIN TARIFA";
    const staged = await stage(p);
    expect((await commit(staged.id)).status).toBe("committed");
    expect(
      (
        await pg.query<{ economic_status: string; economic_issues: string[] }>(
          "select economic_status,economic_issues from itinerary_templates where sku='UYUUYU-3D2N-AB'",
        )
      ).rows[0],
    ).toMatchObject({
      economic_status: "blocked",
      economic_issues: expect.arrayContaining([expect.stringMatching(/^BLOQUEADO:/)]),
    });
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
  it("procesa miles de filas bajo el timeout real y revierte íntegro un lote masivo inválido", async () => {
    const existing = new Set(
      (await pg.query<{ code: string }>("select code from location_codes")).rows.map(
        (row) => row.code,
      ),
    );
    const c = await catalog();
    const validation = validatePackageV2(pkg);
    const templates = assessPackageTemplates(pkg);
    const control = controlPackageCosts(pkg);
    const base = diffPackageV2(pkg, c, templates);
    const bulk = bulkLocationRows(3340, existing);
    await pg.exec("set statement_timeout='10s'");
    try {
      const staged = (
        await pg.query<{ id: string }>("select stage_import_package('bulk-3340.zip',$1,$2,$3) id", [
          JSON.stringify(pkg),
          JSON.stringify([...base, ...bulk]),
          JSON.stringify({ ...validation, templates, control }),
        ])
      ).rows[0]!.id;
      expect(await commit(staged)).toMatchObject({ status: "committed" });
      expect(
        (
          await pg.query<{ n: number }>(
            "select count(*)::int n from location_codes where id::text like '92000000-0000-4000-8000-%'",
          )
        ).rows[0]!.n,
      ).toBe(3340);

      const rollbackRows = bulkLocationRows(2000, existing, 10000);
      const rollbackBatch = (
        await pg.query<{ id: string }>(
          "select stage_import_package('bulk-rollback.zip',$1,$2,$3) id",
          [
            JSON.stringify(pkg),
            JSON.stringify([...diffPackageV2(pkg, await catalog(), templates), ...rollbackRows]),
            JSON.stringify({ ...validation, templates, control }),
          ],
        )
      ).rows[0]!.id;
      await pg.exec("reset role");
      await pg.query(
        `update import_rows set payload=jsonb_set(payload,'{code}','"INVALID"')
         where batch_id=$1 and table_name='location_codes' and natural_key=$2`,
        [rollbackBatch, rollbackRows.at(-1)!.natural_key],
      );
      await as(admin);
      expect(await commit(rollbackBatch)).toMatchObject({ status: "staged" });
      expect(
        (
          await pg.query<{ n: number }>(
            "select count(*)::int n from location_codes where id::text like '92000000-0000-4000-8000-%'",
          )
        ).rows[0]!.n,
      ).toBe(3340);
      expect(
        (
          await pg.query<{ n: number }>(
            "select count(*)::int n from location_codes where id=any($1::uuid[])",
            [rollbackRows.map((row) => row.payload.id)],
          )
        ).rows[0]!.n,
      ).toBe(0);
    } finally {
      await pg.exec("set statement_timeout=0");
      await as(admin);
    }
  }, 120000);
});
