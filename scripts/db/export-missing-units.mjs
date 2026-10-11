import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createDatabase, seedDatabase, root } from "./local-db.mjs";

// Reconstruct the archived catalog locally. This does not query or change Cloud.
const db = await createDatabase();
try {
  await seedDatabase(db);
  const { rows } = await db.query(`select s.sku, s.name, p.name supplier
    from public.services s left join public.suppliers p on p.id=s.supplier_id
    where s.pricing_unit is null order by s.sku`);
  console.log(`Servicios sin unidad de cobro: ${rows.length} (esperados: 11)`);
  assert.equal(rows.length, 11, "El recuento cambió; revisar antes de exportar");
  const field = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv =
    [
      "SKU,nombre,proveedor,unidad",
      ...rows.map((r) => [r.sku, r.name, r.supplier, ""].map(field).join(",")),
    ].join("\r\n") + "\r\n";
  await mkdir(new URL("docs/pendientes/", root), { recursive: true });
  await writeFile(new URL("docs/pendientes/servicios_sin_unidad.csv", root), csv, "utf8");
} finally {
  await db.close();
}
