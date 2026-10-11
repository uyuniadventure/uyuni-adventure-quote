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
   Aplicar también `20261011000700_import_approval_unlinked_items.sql`: impide
   aprobar plantillas con ítems sin vínculo al catálogo, aunque tengan un snapshot
   con precio o compartan el día con servicios válidos. Solo sustituye la RPC;
   tampoco aprueba registros. Depende de `20261011000500`, no de la migración
   independiente de ajustes `20261011000600`.
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

Aplicar las migraciones en orden: `20261011000600_quote_item_adjustments.sql` (PR #11),
`20261011000700_import_approval_unlinked_items.sql` (PR #12, independiente),
`20261011000800_atomic_quote_from_template.sql` (PR #13) y luego
`20261011000900_adjustment_fraction_and_margin.sql`, antes de desplegar este frontend.
La 006 creó los campos y la edición/versionado; la 009 convierte los valores anteriores
de puntos porcentuales a fracciones (6.4 → 0.064), añade el límite [-0.5,1] y actualiza
el guardado de costos y la respuesta de la RPC. Si un valor anterior representa menos
de -50 % o más de +100 %, la migración se detiene con el conteo, sin recortarlo.
Los borradores/revisadas con ajustes quedan pendientes de recálculo, sin PDF ni totales
obsoletos. Las enviadas/archivadas conservan importes, notas y PDF; sus versiones nuevas
se recalculan con la regla vigente. No se ejecutó esta migración contra Cloud.
Desplegar migración y frontend juntos y recargar sesiones abiertas: cambió la unidad
del porcentaje y el contrato de respuesta. No se utiliza `fuel_surcharge`.

```ts
import { applyAdjustmentBulk } from "@/lib/quotes";
await applyAdjustmentBulk(quoteId, { filtro: { type: "transporte" }, pct: 0.064, nota: "combustible 2027" });
await applyAdjustmentBulk(quoteId, { filtro: { supplier_id: supplierId, day_number: 2 }, pct: -0.1 });
await applyAdjustmentBulk(quoteId, { filtro: { item_ids: [itemId] }, pct: 0 }); // quitar ajuste
```

`pct` usa fracciones entre -0.5 y 1, y **reemplaza** el ajuste
anterior; repetir +6,4 % no lo acumula. Los filtros se combinan con AND; un filtro
vacío, una lista vacía o IDs ajenos a la cotización se rechazan. La respuesta indica
IDs coincidentes, IDs afectados, las filas guardadas (`items`) y cálculo. Seleccionar una copia multi-día alcanza
la compra completa, que solo se cobra una vez. El método calcula sin escrituras y
la RPC valida la revisión/filtros y guarda todos los cambios con sus totales en una
transacción. Si el cálculo falla o hubo otra edición, no se guarda ningún ajuste.
Se usan las tarifas congeladas de la cotización; no se leen ni actualizan precios
del catálogo. Las cotizaciones enviadas se deben versionar antes del ajuste masivo.

Decisión revisada por Andrea (2026-10-11): **el margen se aplica al costo ajustado**.
Base USD 100, ajuste 4 % (`0.04`) y markup 25 % → costo ajustado USD 104,
margen USD 26, venta USD 130. Sustituye la regla previa de venta USD 129. La
comisión de agencia sigue su política existente. Desglose interno: costo base,
ajuste y costo ajustado (`costo_base`, `adjustment_pct`, `adjustment_usd`, `costo_ajustado`).
Los nombres anteriores del desglose se mantienen por compatibilidad. El resultado
incluye `total_adjustments_usd` para el total y los escenarios.
PDF: solo precios finales, sin nota ni costo internos.
Las versiones conservan el ajuste; las plantillas promovidas lo reinician en cero.

```sh
bunx vitest run src/lib/pricing/adjustment.test.ts src/lib/quotes/adjustments.test.ts src/lib/quotes/adjustment-migration.test.ts
bun run test:db
```

Las pruebas verifican +6,4 %, -10 %, límites -50/+100 %, margen sobre costo ajustado, FX/cantidades,
transporte del piloto SPA-UYU de 2 pax, filtros, permisos, conflictos, rollback,
versiones, conservación del tarifario y privacidad del PDF. Los dos casos reales
incompletos de Bolivia/WE ROAD siguen siendo fallos conocidos de la suite completa.

## Creación atómica desde una plantilla

La implementación está en `src/lib/quotes/from-template.ts`, exportada desde
`src/lib/quotes`. Las sugerencias muestran solo plantillas activas.

```ts
const quote = await createQuoteFromTemplate(templateId, {
  client_id: clientId, language: "es", start_date: "2026-10-14",
  pax_paying: 2, tc_count: 0,
  // Opcional: staff: { drivers: 1, guides: 0 }
  // Opcional: rooming: { paying: { DBL: 1 }, tc: {} }
});
// quote.calculation y sus totales ya están guardados.
```

Lee y calcula en TypeScript antes de escribir. La única RPC de escritura,
`create_quote_from_template`, valida de nuevo la plantilla y el origen completo
bajo bloqueos, guarda la copia y el resultado del motor en una transacción. No hay
un borrador intermedio ni un segundo guardado de totales. Si el catálogo cambia
durante la preparación, rechaza la operación; no aplica silenciosamente otra tarifa.
El código usa SKU de plantilla, idioma, año de creación en Santiago y correlativo.
Cada día usa su fecha real para la tarifa; las temporadas DRY/RAIN deben configurarse,
no se deducen de meses arbitrarios. FX, política comercial y rooming quedan congelados.
Si se omite staff, usa el de la plantilla; un cero explícito se respeta.

Una plantilla pendiente, día vacío, enlace incompleto o traducción ausente devuelve
un motivo sin crear filas. Las traducciones deben prepararse antes de crear: este
flujo no invoca la IA ni modifica el catálogo. Los snapshots incluyen bloques,
servicios, tarifas, cantidades y la configuración original de los enlaces.

Orden de despliegue: aplicar las migraciones hasta
`20261011000600_quote_item_adjustments.sql` (PR #11), después
`20261011000800_atomic_quote_from_template.sql`, y por último este frontend.
Si está pendiente la corrección independiente `20261011000700` del PR #12,
aplicarla en su orden; la 008 no depende de ella. No se ha escrito en Cloud ni
aprobado el catálogo. La 008 añade lectura de FX para vendedores sin permiso de
edición y bloquea el uso de la RPC antigua para copiar plantillas.

Prueba de aceptación: `bunx vitest run src/lib/quotes/creation.test.ts`.
SPAUYU-3D2N-MP de 2 pax guarda costo USD 1.939 (fixture: 1.939,000864; tolerancia
USD 1). Con markup 25 % guarda venta USD 2.423,75; la hoja no proporciona un precio
de venta de referencia. Esa comparación usa el FX del fixture (CLP 925,92 por USD).
Si no se proporciona FX, se usa el vigente en Admin para la fecha de inicio, que
puede dar otro importe. Las pruebas usan aprobación local explícita de la plantilla,
sin cambiar los seeds históricos ni los datos de Cloud.


### Días editables con trazabilidad (2026-10-11)

Aplicar las migraciones pendientes en orden de nombre. Este cambio requiere
`20261011000800_atomic_quote_from_template.sql`, después
`20261011000900_adjustment_fraction_and_margin.sql` y finalmente
`20261011001000_quote_days_traceability.sql` (incluye el bucket privado `media`).
No ejecutar nuevamente migraciones ya registradas ni los seeds históricos.
No se aplicó nada contra Lovable Cloud desde Codex.

- Se amplían `quote_days`, `quote_items` y `day_blocks`; no hay tablas paralelas.
  Los días nuevos conservan bloque, todos sus idiomas, módulos y enlaces de servicios
  en `block_snapshot`. Los datos históricos solo recuperan el contenido que ya estaba
  guardado: no se sustituyen por textos actuales de la biblioteca.
- `src/lib/quotes/days.ts`: `updateDayContent`, `validateContinuity`, `setDayLinkType`,
  `groupDays`, `ungroup`, `moveDay`, `deleteDay`, `saveDayAsNewBlock`, `addBlockDay`.
  `resolveDay` y el esquema Zod se exportan desde el mismo módulo.
  `title`, `description`, `accommodation_text`, `transport_text` son mapas idioma → texto;
  `meals`, `schedule`, `photo_ids` son listas de cadenas; puntos y notas son texto o null.
- La RPC `edit_quote_days` prepara un resultado sin escrituras cuando no recibe
  `p_result`. TypeScript calcula sobre ese resultado. La segunda llamada comprueba
  `updated_at`, vuelve a construir el plan y guarda días, servicios y cálculo en una
  transacción. Un fallo revierte todo. Las cotizaciones enviadas requieren versionar;
  la nueva versión conserva contenido y servicios, con nuevos identificadores de grupo.
- Continuidad: compara puntos efectivos, sin espacios, tildes ni diferencias de caja.
  Un enlace `independent` evita la comparación con sus vecinos. Si falta un punto no
  se inventa una desconexión. Los avisos se incorporan a los del cálculo existente.
- `moveDay(quoteId, dayId, targetDay)` mueve antes de un destino anterior o después de
  uno posterior, respetando ambos grupos completos. Mover o borrar un miembro actúa
  sobre todo el grupo. Los servicios multi-día conservan la identidad de compra;
  desagrupar no multiplica el cobro y no permite dividir esa compra por movimiento/borrado.
- Guardar como bloque crea un registro `pendiente` con `parent_block_id`, nombre,
  código técnico único `DER-<uuid>`, todos los idiomas efectivos y los servicios del día.
  No modifica el bloque original. Las tarifas manuales/congeladas quedan en el enlace.
  Los ajustes de cotización y sus notas se eliminan de los servicios del nuevo bloque.
  Un bloque que contiene una compra multi-día debe reutilizarse dentro de una plantilla
  que contenga el tramo completo, no como un único día suelto.
- `source_block_service_id` conserva el UUID del enlace original de bloque o módulo;
  el tipo y la copia del enlace viven en `pricing_snapshot._source_link`. No lleva FK
  porque hay dos tablas de origen y la trazabilidad debe sobrevivir a borrar un enlace.
- Storage `media`: lectura autenticada; escritura Admin/Operación; bucket privado,
  formatos JPEG/PNG/WebP/GIF. Ninguna carga ni borrado remoto realizado.

Verificación local: `bun run test -- src/lib/quotes/days.test.ts src/lib/quotes/day-migration.test.ts src/lib/quotes/creation.test.ts --maxWorkers=1`,
`bun run test:db`, `bun run typecheck`, `bun run build`.
La plantilla de aceptación es SPAUYU-3D2N-MP, 2 pagantes: costo USD 1.939.
Las discrepancias anteriores de los casos reales Bolivia/WE ROAD se mantienen
separadas de este cambio; no se ajustó el motor para ocultarlas.
