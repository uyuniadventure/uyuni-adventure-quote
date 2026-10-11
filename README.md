# Uyuni Adventure Quote

Crea una web app interna llamada "Cotizador Uyuni Adventure" para una agencia de viajes (DMC) que cotiza tours multi-día en Bolivia y Chile.

IMPORTANTE: no actives Lovable Cloud ni ningún backend. Voy a conectar mi propio Supabase después.

En esta primera versión construye SOLO la estructura visual:

- Interfaz en español, diseño sobrio y profesional, colores: azul marino #1E2A44 y naranja #F28C28.

- Sidebar con: Dashboard, Nueva cotización, Cotizaciones, Plantillas, Bloques diarios, Módulos de actividad, Tarifario, Proveedores, Clientes, Media, Revisión de importación, Operación, Admin.

- Cada sección muestra un título y "En construcción".

- Página de login de solo diseño.

Stack: React + Vite + TypeScript + Tailwind + shadcn/ui.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6561123e-1b54-4a5b-8e60-0ee5263e4911).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Importación de presupuestos y casos reales

Requiere Bun y `bun install --frozen-lockfile`. El piloto autorizado lee únicamente
`SPAUYU-3D2N-MP`, 2 pagantes y 0 TC, de `data/import/presupuestos.xlsx`.

```sh
bun run import:presupuesto --sku SPAUYU-3D2N-MP --pax 2
bun run import:presupuesto --sku SPAUYU-3D2N-MP --pax 2 --apply
bun run test:references
bun run compare:presupuestos --write-report
```

La primera orden es un **dry-run**: imprime enlaces actuales/propuestos, cantidades,
habitaciones, tramo del vehículo, SKU no encontrados y comparación por celda. No escribe
archivos. `--apply` guarda el fixture, el informe y un **seed SQL local**; nunca conecta
con Cloud. Si hay datos ambiguos, SKU ausentes o discrepancias, no publica el seed.
Las fórmulas compuestas y otros escenarios requieren revisión, no se deducen precios
ni unidades a partir de los totales. Los SKU desconocidos aparecen en una lista aparte.

Para Lovable: aplicar las migraciones fechadas en orden, después los seeds históricos
de `supabase/seed/applied/report.json` y `blocks-report.json` si faltan, y por último
`supabase/seed/04_spauyu_mp_2pax.sql`. El seed crea bloques propios de esta plantilla,
conserva los anteriores y las cotizaciones existentes, y no modifica tarifas. Repetirlo
no sobrescribe ediciones posteriores. Un cambio de fuente exige una nueva revisión.
La plantilla permanece pendiente de revisión y limitada a 2+0 pasajeros.

El fixture de SPA-UYU compara **costo**, porque la venta está vacía en el Excel:
USD 1.939,00, con FX congelado CLP/USD 925,92. El markup 25 % produce USD 2.423,75
de venta. Para reproducirlo en una cotización se debe usar ese FX; no se cambia el
tipo de cambio global ni se demuestra que las tarifas actuales de Cloud sean iguales.
El test de integración aplica el seed en PostgreSQL local, crea, calcula, busca y
reabre el borrador usando las funciones reales de la aplicación.

Los tres tests históricos están activos y leen `tests/fixtures`. Bolivia 9+1 y el
caso sustituido por WE ROAD 10D fallan de forma visible hasta completar los datos
indicados en sus fixtures. No usan `skip`, `test.fails`, costos inventados ni porcentajes
obtenidos despejando el total esperado. El informe completo queda en
`docs/pendientes/comparacion_presupuestos.txt`; `N/D` significa que no hay un dato
verificable, no que el costo sea cero. Estos dos fallos también hacen fallar `bun run test`.

## Aprobación masiva de importación

1. En Lovable, aplicar las migraciones pendientes en orden hasta
   `supabase/migrations/20261011000500_bulk_catalog_approval.sql` (después de
   `20261011000400_margin_and_agency_commission.sql`). La nueva migración instala
   la RPC, columnas de motivos y permisos de lectura; **no aprueba registros**.
2. Desplegar el frontend de esta rama después de la migración. Como Admin, abrir
   `/revision-importacion` y pulsar **Aprobar todo lo válido**. Esto llama a
   `approve_valid_imports()` en simulación: muestra todos los pendientes y sus
   motivos, sin el límite de 500 filas de las listas. No guarda cambios.
3. Revisar los conteos reales de Cloud y **esperar el OK de Andrea**. Solo entonces
   pulsar **Confirmar aprobación**. La RPC recibe `p_dry_run: false` y la huella
   devuelta por esa simulación. Si el catálogo cambió o pasó el día, rechaza la
   aplicación y exige otra simulación. No se permite aplicar sin una huella vigente.
4. Abrir Tarifario y Plantillas con un vendedor distinto del autor: los registros
   aprobados y el contenido de sus días deben ser visibles. Los que no cumplen
   siguen pendientes con `approval_issues` guardado. Los bloques/módulos no cambian
   de estado; solo se permite leer los relacionados con plantillas activas.

La RPC valida unidad, moneda y alguna tarifa vigente con neto o rack (incluido costo
cero explícito). Para plantillas comprueba días completos, servicios directos,
hoteles y servicios de módulos, sin aprobar vacíos ni dependencias inactivas. Puede
usar servicios aprobados en el mismo lote. Tarifas, traducciones y cotizaciones no
se modifican. La operación se revierte entera si falla cualquier escritura.

Pruebas y simulación **local**, sin conexión con Cloud:

```sh
node scripts/db/test-import-approval.mjs
bunx vitest run src/components/catalog/bulk-import-approval.test.tsx
bun run simulate:import-approval --report
```

El informe `docs/pendientes/aprobacion_importacion_simulacion.json` reconstruye los
seeds archivados y las migraciones: el 2026-10-11 daría 792/857 servicios y 26/42
plantillas aprobables; quedan 65 servicios y 16 plantillas pendientes. No incluye
el seed piloto SPA-UYU ni acredita los conteos de Cloud. **No se han aplicado
aprobaciones de catálogo**; las aplicaciones de prueba usan una BD aislada y datos
sintéticos que se descartan al terminar.

## Ajustes de costo por cotización

Aplicar `supabase/migrations/20261011000600_quote_item_adjustments.sql` después de
`20261011000500_bulk_catalog_approval.sql`, antes de desplegar el frontend. Añade
porcentaje/nota en `quote_items`, adapta creación/edición/cálculo y añade la RPC
atómica. Las cotizaciones anteriores parten de ajuste 0; el tarifario no cambia.
No se ha ejecutado esta migración contra Cloud.

```ts
import { applyAdjustmentBulk } from "@/lib/quotes";
await applyAdjustmentBulk(quoteId, { type: "transporte" }, 6.4, "combustible 2027");
await applyAdjustmentBulk(quoteId, { supplier_id: supplierId, day_number: 2 }, -10);
await applyAdjustmentBulk(quoteId, { item_ids: [itemId] }, 0); // quitar ajuste
```

`pct` usa puntos porcentuales, admite negativos hasta -100 y **reemplaza** el ajuste
anterior; repetir +6,4 % no lo acumula. Los filtros se combinan con AND; un filtro
vacío, una lista vacía o IDs ajenos a la cotización se rechazan. La respuesta indica
IDs coincidentes, IDs afectados y cálculo. Seleccionar una copia multi-día alcanza
la compra completa, que solo se cobra una vez. El método calcula sin escrituras y
la RPC valida la revisión/filtros y guarda todos los cambios con sus totales en una
transacción. Si el cálculo falla o hubo otra edición, no se guarda ningún ajuste.
Se usan las tarifas congeladas de la cotización; no se leen ni actualizan precios
del catálogo. Las cotizaciones enviadas se deben versionar antes del ajuste masivo.

Decisión confirmada por Andrea: **el margen se aplica al costo base, sin margen
sobre el ajuste**. Base USD 100, ajuste 4 % y markup 25 % → costo ajustado USD 104,
margen USD 25, venta USD 129 (sustituye los USD 162,50 del ejemplo inicial). La
comisión de agencia sigue su política existente. Desglose interno: costo base,
ajuste y costo ajustado. PDF: solo precios finales, sin nota ni costo internos.
Las versiones conservan el ajuste; las plantillas promovidas lo reinician en cero.

```sh
bunx vitest run src/lib/pricing/adjustment.test.ts src/lib/quotes/adjustments.test.ts
bun run test:db
```

Las pruebas verifican +6,4 %, -10 %, margen sin recargo al ajuste, FX/cantidades,
transporte del piloto SPA-UYU de 2 pax, filtros, permisos, conflictos, rollback,
versiones, conservación del tarifario y privacidad del PDF. Los dos casos reales
incompletos de Bolivia/WE ROAD siguen siendo fallos conocidos de la suite completa.
