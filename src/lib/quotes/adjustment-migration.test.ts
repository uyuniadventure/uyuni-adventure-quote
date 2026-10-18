// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { createDatabase, seedDatabase } from "../../../scripts/db/local-db.mjs";

it("converts legacy percentages, preserves issued prices, invalidates drafts and restores guards", async () => {
  const pg = await createDatabase({
    throughMigration: "20261011000800_atomic_quote_from_template.sql",
  });
  const migration = await readFile(
    new URL(
      "../../../supabase/migrations/20261011000900_adjustment_fraction_and_margin.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const scalar = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
    Object.values((await pg.query(sql, args)).rows[0]!)[0] as T;
  try {
    await seedDatabase(pg);
    const admin = "50000000-0000-0000-0000-000000000001";
    await pg.query("insert into auth.users(id,email) values($1,'migration@test.invalid')", [admin]);
    await pg.query("update profiles set role='admin' where id=$1", [admin]);
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
    const client = await scalar<string>(
      "insert into clients(type,name) values('B2C','Legacy migration') returning id",
    );
    const legacy = async (pct: number) => {
      const q = await scalar<{ id: string }>("select to_jsonb(create_quote_snapshot($1,$2))", [
        {
          client_id: client,
          client_type: "B2C",
          language: "es",
          tour_sku: "LEGACY",
          category: "COMFORT",
          start_date: "2026-10-11",
          pax_paying: 1,
          tc_count: 0,
          rooming: { paying: {}, tc: {} },
          vehicles: {},
          fx_snapshot: { USD: 1 },
          margin_pct: 25,
          rounding_rule: { mode: "none", increment: 1 },
        },
        [
          {
            day_number: 1,
            title: "Legacy",
            snapshot: { reviewed: true },
            items: [
              {
                sku: "LEGACY",
                description: "Legacy item",
                type: "extra",
                pricing_unit: "per_group",
                currency: "USD",
                qty: 1,
                adjustment_pct: pct,
                adjustment_note: "Preserve note",
                unit_cost_original: 100,
                unit_cost_usd: 100,
              },
            ],
          },
        ],
      ]);
      const item = await scalar<string>(
        "select i.id from quote_items i join quote_days d on d.id=i.quote_day_id where d.quote_id=$1",
        [q.id],
      );
      const cost = 100 * (1 + pct / 100);
      const result = {
        status: "ok",
        warnings: [],
        scenarios: [],
        total_cost_usd: cost,
        total_margin_usd: 25,
        total_price_usd: cost + 25,
        price_per_pax_usd: cost + 25,
        single_supplement_pp: 0,
        items: [
          {
            id: item,
            status: "ok",
            quantity: 1,
            unit_cost_original: 100,
            unit_cost_usd: 100,
            adjustment_pct: pct,
            base_cost_usd: 100,
            adjustment_amount_usd: cost - 100,
            total_cost_usd: cost,
            total_margin_usd: 25,
          },
        ],
      };
      await pg.query("select save_quote_calculation(id,updated_at,$2) from quotes where id=$1", [
        q.id,
        result,
      ]);
      return { id: q.id, item };
    };
    const draft = await legacy(6.4),
      sent = await legacy(4),
      archived = await legacy(4),
      zero = await legacy(0);
    for (const q of [sent, archived]) {
      await pg.query("select transition_quote($1,'revisada')", [q.id]);
      await pg.query(
        "update quotes set pdf_path='issued.pdf',pdf_url='https://example.com/issued.pdf' where id=$1",
        [q.id],
      );
      await pg.query("select transition_quote($1,'enviada')", [q.id]);
    }
    const versionId = await scalar<string>("select version_quote($1)", [archived.id]);
    const bad = await legacy(200);
    const snapshot = () =>
      pg.query("select id,adjustment_pct,adjustment_note from quote_items order by id");
    const before = await snapshot();
    await expect(pg.exec(migration)).rejects.toThrow("fuera de");
    await pg.exec("rollback");
    expect(await snapshot()).toEqual(before);
    await pg.query("delete from quotes where id=$1", [bad.id]);
    await pg.exec(migration);
    expect(
      await scalar("select to_jsonb(i) from quote_items i where id=$1", [draft.item]),
    ).toMatchObject({ adjustment_pct: 0.064, adjustment_note: "Preserve note" });
    expect(await scalar("select to_jsonb(q) from quotes q where id=$1", [draft.id])).toMatchObject({
      calculation: null,
      total_price_usd: null,
    });
    expect(await scalar("select calculation from quotes where id=$1", [zero.id])).not.toBeNull();
    for (const q of [sent, archived]) {
      const saved = await scalar("select to_jsonb(q) from quotes q where id=$1", [q.id]);
      expect(saved).toMatchObject({
        status: "enviada",
        total_price_usd: 129,
        total_margin_usd: 25,
        pdf_path: "issued.pdf",
        calculation: {
          items: [{ adjustment_pct: 0.04, adjustment_amount_usd: 4 }],
          total_price_usd: 129,
        },
      });
      await expect(
        pg.query("update quote_items set adjustment_pct=0 where id=$1", [q.item]),
      ).rejects.toThrow("immutable");
      await expect(
        pg.query("update quotes set total_price_usd=0 where id=$1", [q.id]),
      ).rejects.toThrow();
    }
    expect(
      await scalar(
        "select adjustment_pct::float8 from quote_items i join quote_days d on d.id=i.quote_day_id where d.quote_id=$1",
        [versionId],
      ),
    ).toBe(0.04);
    for (const pct of [-0.500001, 1.000001, "NaN", "Infinity"]) {
      await expect(
        pg.query("select edit_quote_item($1,$2)", [draft.item, { adjustment_pct: pct }]),
      ).rejects.toThrow("check constraint");
      await expect(
        pg.query("update quote_items set adjustment_pct=$1 where id=$2", [pct, draft.item]),
      ).rejects.toThrow("check constraint");
    }
    expect(
      (await pg.query("select tgname from pg_trigger where not tgisinternal and tgenabled='D'"))
        .rows,
    ).toEqual([]);
  } finally {
    await pg.close();
  }
}, 120000);
