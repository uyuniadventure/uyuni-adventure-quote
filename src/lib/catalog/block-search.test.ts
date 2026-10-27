import { beforeEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("../db", () => ({ db: { from: transport.from } }));

import { fetchBlockRowsByIds, searchDayBlockIds } from "./block-search";
import { readFilteredCatalogRecords } from "../../components/catalog/catalog-selection";

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
let failure: string | null = null;

function query(table: string) {
  const filters: ((row: Row) => boolean)[] = [];
  const orders: string[] = [];
  let start = 0;
  let end = Number.MAX_SAFE_INTEGER;
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return builder;
    },
    neq: (column: string, value: unknown) => {
      filters.push((row) => row[column] !== value);
      return builder;
    },
    ilike: (column: string, value: string) => {
      const needle = value.replaceAll("%", "").toLocaleLowerCase();
      filters.push((row) =>
        String(row[column] ?? "")
          .toLocaleLowerCase()
          .includes(needle),
      );
      return builder;
    },
    or: (expression: string) => {
      const alternatives = expression.split(",").map((part) => {
        const [column, operator, ...raw] = part.split(".");
        const needle = raw.join(".").replaceAll("%", "").toLocaleLowerCase();
        if (operator !== "ilike") throw new Error(`Operador de prueba no soportado: ${operator}`);
        return (row: Row) =>
          String(row[column!] ?? "")
            .toLocaleLowerCase()
            .includes(needle);
      });
      filters.push((row) => alternatives.some((alternative) => alternative(row)));
      return builder;
    },
    in: (column: string, values: unknown[]) => {
      filters.push((row) => values.includes(row[column]));
      return builder;
    },
    overlaps: (column: string, values: unknown[]) => {
      filters.push((row) => (row[column] as unknown[]).some((value) => values.includes(value)));
      return builder;
    },
    contains: (column: string, values: unknown[]) => {
      filters.push((row) => values.every((value) => (row[column] as unknown[]).includes(value)));
      return builder;
    },
    is: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return builder;
    },
    order: (column: string) => {
      orders.push(column);
      return builder;
    },
    range: (from: number, to: number) => {
      start = from;
      end = to;
      return builder;
    },
    then: (
      resolve: (value: { data: Row[] | null; error: { message: string } | null }) => unknown,
    ) => {
      if (failure === table)
        return Promise.resolve(resolve({ data: null, error: { message: "fallo simulado" } }));
      const rows = (tables[table] ?? [])
        .filter((row) => filters.every((filter) => filter(row)))
        .sort((a, b) => {
          for (const column of orders) {
            const compared = String(a[column] ?? "").localeCompare(String(b[column] ?? ""));
            if (compared) return compared;
          }
          return 0;
        })
        .slice(start, end + 1);
      return Promise.resolve(resolve({ data: rows, error: null }));
    },
  };
  return builder;
}

beforeEach(() => {
  failure = null;
  tables["day_blocks"] = [
    {
      id: "title-place",
      code: "BLOCK_001",
      name: null,
      route_from: "UYU",
      route_to: "SPA",
      places: ["salar-uyuni"],
      status: "activo",
      hotel_service_id: null,
    },
    {
      id: "code",
      code: "SALAR_CODE_002",
      name: "Otro",
      route_from: "LPB",
      route_to: "UYU",
      places: [],
      status: "activo",
      hotel_service_id: "hotel",
    },
    {
      id: "pending",
      code: "PENDING_003",
      name: null,
      route_from: "UYU",
      route_to: "SPA",
      places: [],
      status: "pendiente",
      hotel_service_id: null,
    },
  ];
  tables["day_block_translations"] = [
    { block_id: "title-place", lang: "es", title: "Visita al Salar de Uyuni" },
    { block_id: "code", lang: "es", title: "Programa alternativo" },
    { block_id: "pending", lang: "es", title: "Salar pendiente" },
  ];
  tables["location_codes"] = [
    { code: "UYU", name: "Uyuni" },
    { code: "SPA", name: "San Pedro de Atacama" },
    { code: "LPB", name: "La Paz" },
  ];
  tables["places"] = [{ name: "Salar de Uyuni", slug: "salar-uyuni" }];
  transport.from.mockImplementation(query);
});

describe("searchDayBlockIds", () => {
  it("encuentra por título ES aunque el código no contenga la palabra y elimina duplicados", async () => {
    const result = await searchDayBlockIds("salar");
    expect(result.map((row) => row.id)).toEqual(["code", "pending", "title-place"]);
    expect(new Set(result.map((row) => row.id)).size).toBe(result.length);
  });

  it.each(["SALAR_CODE_002", "code_00", "SaLaR_cOdE"])(
    "encuentra código exacto, parcial y sin distinguir mayúsculas: %s",
    async (term) => {
      expect((await searchDayBlockIds(term)).map((row) => row.id)).toContain("code");
    },
  );

  it("encuentra por nombre de lugar y por los nombres de origen/destino", async () => {
    expect((await searchDayBlockIds("Salar de Uyuni")).map((row) => row.id)).toContain(
      "title-place",
    );
    expect((await searchDayBlockIds("San Pedro")).map((row) => row.id)).toEqual([
      "title-place",
      "pending",
    ]);
  });

  it("combina la búsqueda con los filtros de biblioteca", async () => {
    expect(
      (await searchDayBlockIds("salar", { from: "UYU", to: "SPA", status: "activo" })).map(
        ({ id, code }) => ({ id, code }),
      ),
    ).toEqual([{ id: "title-place", code: "BLOCK_001" }]);
  });

  it("la selección masiva contiene exactamente todos los resultados filtrados", async () => {
    const matches = await searchDayBlockIds("salar", { from: "UYU", to: "SPA" });
    const selected = await readFilteredCatalogRecords(async (offset, end) =>
      (
        await fetchBlockRowsByIds<Row>(
          matches.slice(offset, end + 1).map((match) => match.id),
          "id,code,name",
        )
      ).map((row) => ({
        id: String(row["id"]),
        code: String(row["code"]),
        name: String(row["name"] ?? row["code"]),
      })),
    );
    expect(selected.map((row) => row.id)).toEqual(["pending", "title-place"]);
  });

  it("pagina más allá de 500 coincidencias sin perder ni duplicar resultados", async () => {
    tables["day_blocks"] = Array.from({ length: 521 }, (_, index) => ({
      id: `block-${index.toString().padStart(3, "0")}`,
      code: `BLOCK_${index.toString().padStart(3, "0")}`,
      name: null,
      route_from: null,
      route_to: null,
      places: [],
      status: "activo",
      hotel_service_id: null,
    }));
    tables["day_block_translations"] = tables["day_blocks"].map((row) => ({
      block_id: row["id"],
      lang: "es",
      title: `Visita Salar ${row["code"]}`,
    }));
    const result = await searchDayBlockIds("salar");
    expect(result).toHaveLength(521);
    expect(new Set(result.map((row) => row.id)).size).toBe(521);
    expect(
      await fetchBlockRowsByIds(
        result.map((row) => row.id),
        "id,code",
      ),
    ).toHaveLength(521);
  });

  it("propaga los errores de Supabase en lugar de convertirlos en lista vacía", async () => {
    failure = "day_block_translations";
    await expect(searchDayBlockIds("salar")).rejects.toMatchObject({
      message: "fallo simulado",
    });
  });
});
