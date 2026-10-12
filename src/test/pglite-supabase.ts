import type { PGlite } from "@electric-sql/pglite";

/** Test transport only: execute the application's Supabase queries against real
 * local PostgreSQL, with production migrations, RLS and snapshot RPCs. No pricing
 * or snapshot business logic is implemented here. Unsupported queries fail. */
export function pgliteSupabase(pg: PGlite) {
  const ident = (s: string) => {
    if (!/^[a-z_]+$/.test(s)) throw new Error(`Unsupported identifier: ${s}`);
    return `"${s}"`;
  };
  return {
    from(table: string) {
      const conditions: string[] = [];
      const params: unknown[] = [];
      const orders: string[] = [];
      let joinClient = false,
        single = false,
        exactCount = false;
      let from = 0,
        limit: number | null = null;
      const field = (column: string) =>
        column === "clients.name" ? 'c."name"' : `t.${ident(column)}`;
      const bind = (value: unknown) => {
        params.push(value);
        return `$${params.length}`;
      };
      const query = {
        select(columns = "*", options?: { count?: string }) {
          joinClient = columns.includes("clients!inner");
          exactCount = options?.count === "exact";
          return query;
        },
        eq(column: string, value: unknown) {
          conditions.push(`${field(column)} = ${bind(value)}`);
          return query;
        },
        in(column: string, values: unknown[]) {
          // Bind scalar values so PostgreSQL also infers custom enum types.
          conditions.push(
            values.length ? `${field(column)} in (${values.map(bind).join(",")})` : "false",
          );
          return query;
        },
        ilike(column: string, value: string) {
          conditions.push(`${field(column)} ilike ${bind(value)}`);
          return query;
        },
        order(column: string, options?: { ascending?: boolean }) {
          orders.push(`${field(column)} ${options?.ascending === false ? "desc" : "asc"}`);
          return query;
        },
        range(start: number, end: number) {
          from = start;
          limit = end - start + 1;
          return query;
        },
        single() {
          single = true;
          return query;
        },
        async then(resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) {
          try {
            const base = `from public.${ident(table)} t ${joinClient ? "join public.clients c on c.id=t.client_id" : ""} ${conditions.length ? `where ${conditions.join(" and ")}` : ""}`;
            const count = exactCount
              ? Number(
                  (await pg.query<{ n: number }>(`select count(*)::int n ${base}`, params)).rows[0]!
                    .n,
                )
              : null;
            const { rows } = await pg.query<{ data: unknown }>(
              `select to_jsonb(t) ${joinClient ? "|| jsonb_build_object('clients',jsonb_build_object('name',c.name))" : ""} as data ${base} ${orders.length ? `order by ${orders.join(",")}` : ""} ${limit == null ? "" : `limit ${limit} offset ${from}`}`,
              params,
            );
            if (single && rows.length !== 1)
              return resolve({
                data: null,
                error: { message: "Record not found or inaccessible" },
                count,
              });
            return resolve({
              data: single ? rows[0]!.data : rows.map((r) => r.data),
              error: null,
              count,
            });
          } catch (e) {
            return reject(e);
          }
        },
      };
      return query;
    },
    async rpc(name: string, args: Record<string, unknown>) {
      const signatures: Record<string, [string, string][]> = {
        quote_payment_summary: [["p_id", "uuid"]],
        register_quote_payment: [
          ["p_quote_id", "uuid"],
          ["p_payment_id", "uuid"],
          ["p_payment", "jsonb"],
        ],
        transition_quote: [
          ["p_id", "uuid"],
          ["p_to", "public.quote_status"],
          ["p_note", "text"],
        ],
        version_quote: [["p_id", "uuid"]],
        snapshot_day_block: [["p_id", "uuid"]],
        edit_quote_days: [
          ["p_id", "uuid"],
          ["p_operation", "text"],
          ["p_payload", "jsonb"],
          ["p_updated_at", "timestamptz"],
          ["p_result", "jsonb"],
        ],
        create_quote_from_template: [
          ["p_template", "uuid"],
          ["p_quote", "jsonb"],
          ["p_days", "jsonb"],
          ["p_source", "jsonb"],
          ["p_result", "jsonb"],
        ],
        create_quote_snapshot: [
          ["p_quote", "jsonb"],
          ["p_days", "jsonb"],
        ],
        save_quote_calculation: [
          ["p_id", "uuid"],
          ["p_updated_at", "timestamptz"],
          ["p_result", "jsonb"],
        ],
        apply_quote_adjustment_bulk: [
          ["p_id", "uuid"],
          ["p_filter", "jsonb"],
          ["p_pct", "numeric"],
          ["p_note", "text"],
          ["p_updated_at", "timestamptz"],
          ["p_result", "jsonb"],
        ],
        edit_quote_item: [
          ["p_id", "uuid"],
          ["p_changes", "jsonb"],
        ],
      };
      const signature = signatures[name];
      if (!signature) throw new Error(`Unsupported RPC: ${name}`);
      try {
        const values = signature.map(([key, type]) =>
          args[key] == null ? null : type === "jsonb" ? JSON.stringify(args[key]) : args[key],
        );
        const placeholders = signature.map(([, type], i) => `$${i + 1}::${type}`);
        const { rows } = await pg.query<{ data: unknown }>(
          `select to_jsonb(public.${ident(name)}(${placeholders.join(",")})) as data`,
          values,
        );
        return { data: rows[0]!.data, error: null };
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } };
      }
    },
  };
}
