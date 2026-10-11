// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { resolveDay } from "./day-content";

it("backfills historical content without reading newer library translations or invalidating prices", async () => {
  const pg = await createDatabase({
    throughMigration: "20261011000900_adjustment_fraction_and_margin.sql",
  });
  const first = async <T>(sql: string, args: unknown[] = []) =>
    (await pg.query<T>(sql, args)).rows[0]!;
  try {
    const admin = "60000000-0000-0000-0000-000000000001";
    await pg.query("insert into auth.users(id,email) values($1,'days-migration@test.invalid')", [
      admin,
    ]);
    await pg.query("update profiles set role='admin' where id=$1", [admin]);
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
    const client = await first<{ id: string }>(
      "insert into clients(type,name) values('B2C','Migration') returning id",
    );
    const block = await first<{ id: string }>(
      "insert into day_blocks(code) values('LEGACY-DAY') returning id",
    );
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description) values($1,'es','Texto posterior','Biblioteca actual'),($1,'it','Nuovo','Testo nuovo')",
      [block.id],
    );
    const { q } = await first<{ q: { id: string } }>(
      "select to_jsonb(create_quote_snapshot($1,$2)) q",
      [
        {
          client_id: client.id,
          client_type: "B2C",
          language: "es",
          tour_sku: "LEGACY",
          category: "COMFORT",
          start_date: "2026-10-11",
          pax_paying: 2,
          rooming: { paying: {}, tc: {} },
          vehicles: {},
          fx_snapshot: { USD: 1 },
          margin_pct: 25,
          rounding_rule: { mode: "none", increment: 1 },
        },
        [
          {
            day_number: 1,
            title: "Texto cotizado",
            description: "Descripción histórica",
            snapshot: { block_id: block.id, reviewed: true },
          },
        ],
      ],
    );
    await pg.query("select save_quote_calculation(id,updated_at,$2) from quotes where id=$1", [
      q.id,
      {
        status: "ok",
        warnings: [],
        items: [],
        total_cost_usd: 0,
        total_margin_usd: 0,
        total_price_usd: 0,
        price_per_pax_usd: 0,
        single_supplement_pp: 0,
      },
    ]);
    const before = await first<{ q: unknown }>("select to_jsonb(q) q from quotes q where id=$1", [
      q.id,
    ]);
    await pg.exec(
      await readFile(
        new URL(
          "../../../supabase/migrations/20261011001000_quote_days_traceability.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const day = await first<{ source_block_id: string; block_snapshot: object; overrides: object }>(
      "select * from quote_days where quote_id=$1",
      [q.id],
    );
    expect(day.source_block_id).toBe(block.id);
    expect(resolveDay(day as never)).toEqual({
      title: { es: "Texto cotizado" },
      description: { es: "Descripción histórica" },
      start_point: null,
      end_point: null,
    });
    expect(day.block_snapshot).toMatchObject({ legacy: true });
    expect(await first("select to_jsonb(q) q from quotes q where id=$1", [q.id])).toEqual(before);
    await pg.query(
      'update quote_days set overrides=\'{"title":{"es":"Cambio"}}\' where quote_id=$1',
      [q.id],
    );
    expect(
      (await first<{ calculation: unknown }>("select calculation from quotes where id=$1", [q.id]))
        .calculation,
    ).toBe(null);
  } finally {
    await pg.close();
  }
}, 60000);
