// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
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
import { selectAlternatives, setRooming } from "./selection";
import { loadQuote } from "./index";
let pg: Awaited<ReturnType<typeof createDatabase>>;
let hotel: string,
  other: string,
  hotelCode: string,
  otherCode: string,
  sgl: string,
  dbl: string,
  foreign: string,
  block: string,
  quote: string,
  day: string;
const admin = "81000000-0000-0000-0000-000000000001",
  seller = "81000000-0000-0000-0000-000000000002";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const id = async (sql: string, args: unknown[] = []) =>
  (await one<{ id: string }>(sql + " returning id", args)).id;
beforeAll(async () => {
  pg = await createDatabase();
  transport.client = pgliteSupabase(pg);
  await pg.exec(
    `insert into currencies(code,name) values('USD','Dólar') on conflict do nothing;insert into auth.users(id) values('${admin}'),('${seller}');insert into profiles(id,role) values('${admin}','admin'),('${seller}','vendedor') on conflict(id) do update set role=excluded.role;`,
  );
}, 120000);
afterAll(async () => {
  await pg?.close();
});
beforeEach(async () => {
  await pg.exec("reset role;begin");
  hotel = await id("insert into suppliers(name) values('Hotel A')");
  other = await id("insert into suppliers(name) values('Hotel B')");
  hotelCode = await id("insert into hotel_codes(code,name,supplier_id) values($1,'Hotel A',$2)", [
    crypto.randomUUID(),
    hotel,
  ]);
  otherCode = await id("insert into hotel_codes(code,name,supplier_id) values($1,'Hotel B',$2)", [
    crypto.randomUUID(),
    other,
  ]);
  async function room(type: string, supplier: string) {
    return id(
      "insert into services(sku,name,type,pricing_unit,currency,supplier_id,location,meal_plan,room_type,status) values($1,$1,'alojamiento','per_room','USD',$2,'Uyuni','BB',$3,'activo')",
      [crypto.randomUUID(), supplier, type],
    );
  }
  sgl = await room("SGL", hotel);
  dbl = await room("DBL", hotel);
  foreign = await room("DBL", other);
  await pg.query("insert into service_rates(service_id,price_net) values($1,50),($2,80),($3,80)", [
    sgl,
    dbl,
    foreign,
  ]);
  block = await id("insert into day_blocks(code,hotel_id) values($1,$2)", [
    crypto.randomUUID(),
    hotelCode,
  ]);
  await pg.query(
    "insert into day_block_items(block_id,service_id,slot_key) values($1,$2,'ALOJAMIENTO')",
    [block, sgl],
  );
  const client = await id("insert into clients(type,name) values('B2C','Cliente sintético')");
  quote = await id(
    "insert into quotes(code,client_id,client_type,start_date,pax_paying,tc_count,category,seller_id,fx_snapshot,rounding_rule) values($1,$2,'B2C','2026-11-01',3,0,'BUDGET',$3,'{\"USD\":1}','{\"mode\":\"none\",\"increment\":1}')",
    [crypto.randomUUID(), client, admin],
  );
  day = await id(
    "insert into quote_days(quote_id,day_number,title,source_block_id,block_snapshot) values($1,1,'Salar',$2,jsonb_build_object('block',jsonb_build_object('hotel_id',$3::text)))",
    [quote, block, hotelCode],
  );
  await pg.query(
    `insert into quote_items(quote_day_id,service_id,sku,description,type,pricing_unit,currency,unit_cost_original,unit_cost_usd,slot_key,pricing_snapshot)
 select $1,id,sku,name,type,pricing_unit,currency,0,0,'ALOJAMIENTO',jsonb_build_object('room_type',room_type,'rates',(select jsonb_agg(to_jsonb(r)) from service_rates r where r.service_id=s.id)) from services s where s.id in ($2,$3)`,
    [day, sgl, dbl],
  );
  await pg.exec("set role authenticated");
  await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [admin]);
});
// Each case is isolated without recreating the migration history.
import { afterEach } from "vitest";
afterEach(async () => {
  await pg.exec("rollback;reset role");
});
describe("hotel server invariants", () => {
  it("accepts a room of the hotel", async () => {
    await expect(
      pg.query(
        "insert into day_block_items(block_id,service_id,slot_key) values($1,$2,'ALOJAMIENTO')",
        [block, dbl],
      ),
    ).resolves.toBeDefined();
  });
  it("rejects a room of another hotel in Spanish", async () => {
    await expect(
      pg.query(
        "insert into day_block_items(block_id,service_id,slot_key) values($1,$2,'ALOJAMIENTO')",
        [block, foreign],
      ),
    ).rejects.toThrow("hotel del bloque");
  });
  it("rejects changing the service supplier", async () => {
    await expect(
      pg.query("update services set supplier_id=$1 where id=$2", [other, sgl]),
    ).rejects.toThrow("hotel del bloque");
  });
  it("rejects changing hotel on an existing block", async () => {
    await expect(
      pg.query("update day_blocks set hotel_id=$1 where id=$2", [otherCode, block]),
    ).rejects.toThrow("otro bloque");
  });
  it("rejects moving accommodation out of its slot", async () => {
    await expect(
      pg.query("update day_block_items set slot_key='CENA' where block_id=$1", [block]),
    ).rejects.toThrow("hotel del bloque");
  });
  it("rejects changing room location independently", async () => {
    await pg.query(
      "insert into day_block_items(block_id,service_id,slot_key) values($1,$2,'ALOJAMIENTO')",
      [block, dbl],
    );
    await expect(
      pg.query("update services set location='La Paz' where id=$1", [sgl]),
    ).rejects.toThrow("lugar y régimen");
  });
});
describe("atomic selections and rooming", () => {
  it("saves a manual selection with recalculated total", async () => {
    const result = await selectAlternatives(quote, day, "ALOJAMIENTO", [
      { serviceId: dbl, qty: 1 },
      { serviceId: sgl, qty: 1 },
    ]);
    expect(result).toBeTruthy();
    const data = await loadQuote(quote);
    expect(data.items.every((i) => i.selection_source === "manual")).toBe(true);
    expect(data.quote.total_cost_usd).toBe(130);
  });
  it("copies an eligible catalog room outside the original block", async () => {
    await pg.query("delete from quote_items where service_id=$1", [dbl]);
    await selectAlternatives(quote, day, "ALOJAMIENTO", [
      { serviceId: dbl, qty: 1 },
      { serviceId: sgl, qty: 1 },
    ]);
    expect((await loadQuote(quote)).items.find((i) => i.service_id === dbl)?.selection_source).toBe(
      "manual",
    );
  });
  it("rejects a foreign room without partial writes", async () => {
    await pg.exec("savepoint rejected");
    await expect(
      selectAlternatives(quote, day, "ALOJAMIENTO", [{ serviceId: foreign, qty: 1 }]),
    ).rejects.toThrow("hotel del bloque");
    await pg.exec("rollback to rejected");
    expect((await loadQuote(quote)).items.every((i) => i.selection_source === "auto")).toBe(true);
  });
  it("saves rooming and calculation together", async () => {
    await setRooming(quote, [{ room_type: "SGL", count: 3, for_tc: false }]);
    const data = await loadQuote(quote);
    expect(data.roomingRows).toHaveLength(1);
    expect(data.quote.rooming).toEqual({paying:{SGL:3},tc:{}});
    expect(data.items.every(i=>JSON.stringify(i.room_distribution)===JSON.stringify(data.quote.rooming))).toBe(true);
    expect(data.quote.total_cost_usd).toBe(150);
  });
  it("a seller cannot read or select another owner quote", async () => {
    await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [seller]);
    expect(
      (await pg.query("select * from quote_rooming where quote_id=$1", [quote])).rows,
    ).toHaveLength(0);
    await expect(
      selectAlternatives(quote, day, "ALOJAMIENTO", [{ serviceId: dbl, qty: 1 }]),
    ).rejects.toThrow();
  });
  it("a stale revision rolls back", async () => {
    const args = {
      p_id: quote,
      p_operation: "rooming",
      p_payload: { rows: [{ room_type: "SGL", count: 3, for_tc: false }] },
    };
    const prepared = await transport.client!.rpc("edit_quote_selection", args);
    await pg.query("update quotes set tour_sku='CHANGED' where id=$1", [quote]);
    await pg.exec("savepoint stale");
    const result = await transport.client!.rpc("edit_quote_selection", {
      ...args,
      p_updated_at: (prepared.data as { quote: { updated_at: string } }).quote.updated_at,
      p_result: { items: [] },
    });
    expect(result.error).toBeTruthy();
    await pg.exec("rollback to stale");
    expect((await loadQuote(quote)).roomingRows).toHaveLength(0);
  });
});

it("migration preserves hotel/default link and limits room alternatives", async () => {
  // Dedicated pre-migration database exercises the actual migration, not a reimplementation.
  const legacy = await createDatabase({
    throughMigration: "20261017000200_catalog_approval_actions.sql",
  });
  try {
    await legacy.exec(`insert into suppliers(id,name) values('82000000-0000-0000-0000-000000000001','Hotel sintético');
   insert into hotel_codes(id,code,name,supplier_id) values('82000000-0000-0000-0000-000000000007','SYN-H','Hotel sintético','82000000-0000-0000-0000-000000000001');
   insert into services(id,sku,name,type,pricing_unit,supplier_id,location,meal_plan,room_type) values
   ('82000000-0000-0000-0000-000000000002','SYN-SGL','SGL','alojamiento','per_room','82000000-0000-0000-0000-000000000001','Uyuni','BB','SGL'),
   ('82000000-0000-0000-0000-000000000003','SYN-DBL','DBL','alojamiento','per_room','82000000-0000-0000-0000-000000000001','Uyuni','BB','DBL'),
   ('82000000-0000-0000-0000-000000000004','SYN-OTHER','Otra ciudad','alojamiento','per_room','82000000-0000-0000-0000-000000000001','La Paz','BB','DBL');
   insert into day_blocks(id,code,hotel_service_id) values('82000000-0000-0000-0000-000000000005','SYN-DAY','82000000-0000-0000-0000-000000000002');
   insert into day_block_items(block_id,service_id,qty) values('82000000-0000-0000-0000-000000000005','82000000-0000-0000-0000-000000000002',2);`);
    await legacy.exec(`insert into day_blocks(code) values('SYN-NO-HOTEL');
    insert into services(id,sku,name,type,pricing_unit) values('82000000-0000-0000-0000-000000000006','SYN-MISSING-SUPPLIER','Sin proveedor','alojamiento','per_room');
    insert into day_blocks(code,hotel_service_id) values('SYN-BAD-HOTEL','82000000-0000-0000-0000-000000000006');`);
    const migration = await readFile(
      "supabase/migrations/20261018000100_block_options_v2.sql",
      "utf8",
    );
    await expect(legacy.exec(migration)).rejects.toThrow("Falta proveedor del hotel");
    await legacy.exec("rollback");
    expect(
      (
        await legacy.query<{ hotel_service_id: string }>(
          "select hotel_service_id from day_blocks where code='SYN-BAD-HOTEL'",
        )
      ).rows[0]!.hotel_service_id,
    ).toBe("82000000-0000-0000-0000-000000000006");
    await legacy.exec(
      "delete from day_blocks where code='SYN-BAD-HOTEL';delete from services where sku='SYN-MISSING-SUPPLIER'",
    );
    await legacy.exec(migration);
    expect(
      (
        await legacy.query<{ hotel_id: null }>(
          "select hotel_id from day_blocks where code='SYN-NO-HOTEL'",
        )
      ).rows[0]!.hotel_id,
    ).toBeNull();
    const b = (
      await legacy.query<{ hotel_id: string; hotel_service_id: string }>(
        "select hotel_id,hotel_service_id from day_blocks where code='SYN-DAY'",
      )
    ).rows[0]!;
    expect(b.hotel_id).toBe("82000000-0000-0000-0000-000000000007");
    expect(b.hotel_service_id).toBe("82000000-0000-0000-0000-000000000002");
    const items = (
      await legacy.query<{ service_id: string; qty: number; is_default: boolean }>(
        "select service_id,qty,is_default from day_block_items where block_id='82000000-0000-0000-0000-000000000005'",
      )
    ).rows;
    expect(items).toHaveLength(1);
    expect(items[0]?.service_id).toBe("82000000-0000-0000-0000-000000000002");
    expect(Number(items.find((i) => i.is_default)?.qty)).toBe(2);
  } finally {
    await legacy.close();
  }
}, 120000);
