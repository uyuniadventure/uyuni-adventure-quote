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
                error: { code: "PGRST116", message: "Record not found or inaccessible" },
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
        delete_day_blocks: [
          ["ids", "uuid[]"],
          ["force", "boolean"],
        ],
        delete_templates: [["ids", "uuid[]"]],
        purge_imported_catalog: [["confirm", "text"]],
        review_catalog_approval: [
          ["kind", "text"],
          ["ids", "uuid[]"],
        ],
        approve_day_blocks: [
          ["ids", "uuid[]"],
          ["accept_warnings", "boolean"],
        ],
        approve_templates: [
          ["ids", "uuid[]"],
          ["accept_warnings", "boolean"],
        ],
        preview_template_deletion: [["ids", "uuid[]"]],
        archive_catalog: [
          ["kind", "text"],
          ["ids", "uuid[]"],
        ],
        approve_valid_imports: [
          ["p_dry_run", "boolean"],
          ["p_expected_fingerprint", "text"],
          ["p_accept_warnings", "boolean"],
        ],
        prepare_quote_template: [
          ["p_id", "uuid"],
          ["p_route_from", "text"],
          ["p_route_to", "text"],
        ],
        save_quote_as_template: [
          ["p_id", "uuid"],
          ["p_mode", "text"],
          ["p_route_from", "text"],
          ["p_route_to", "text"],
          ["p_expected_sku", "text"],
          ["p_updated_at", "timestamptz"],
          ["p_replace_id", "uuid"],
          ["p_replace_updated_at", "timestamptz"],
        ],
        admin_list_users: [],
        review_quote_days: [
          ["p_quote_id", "uuid"],
          ["p_day_ids", "uuid[]"],
          ["p_also_update_block", "boolean"],
        ],
        save_quote_pdf: [
          ["p_id", "uuid"],
          ["p_updated_at", "timestamptz"],
          ["p_path", "text"],
          ["p_url", "text"],
        ],
        save_quote_document: [
          ["p_quote_id", "uuid"],
          ["p_updated_at", "timestamptz"],
          ["p_patch", "jsonb"],
        ],
        save_quote_item_label: [
          ["p_quote_id", "uuid"],
          ["p_item_id", "uuid"],
          ["p_updated_at", "timestamptz"],
          ["p_label", "text"],
        ],
        reset_quote_day_field: [
          ["p_day_id", "uuid"],
          ["p_field", "text"],
          ["p_updated_at", "timestamptz"],
        ],
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
      const knownSignature = signatures[name];
      if (!knownSignature) throw new Error(`Unsupported RPC: ${name}`);
      // Omitted named arguments use PostgreSQL defaults, exactly like PostgREST.
      const signature = knownSignature.filter(([key]) => Object.hasOwn(args, key));
      try {
        const values = signature.map(([key, type]) =>
          args[key] == null ? null : type === "jsonb" ? JSON.stringify(args[key]) : args[key],
        );
        const placeholders = signature.map(
          ([key, type], i) => `${ident(key)} => $${i + 1}::${type}`,
        );
        const { rows } = await pg.query<{ data: unknown }>(
          `select to_jsonb(public.${ident(name)}(${placeholders.join(",")})) as data`,
          values,
        );
        return { data: rows[0]!.data, error: null };
      } catch (e) {
        const error = e as Error & { code?: string; hint?: string };
        return {
          data: null,
          error: { message: error.message, code: error.code, hint: error.hint },
        };
      }
    },
  };
}
