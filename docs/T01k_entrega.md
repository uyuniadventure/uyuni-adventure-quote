# T01k · Importador del paquete v2 · ALTO

Andrea autorizó el 19-10-2026 continuar T01k sobre la implementación de T01h
del PR #38, aunque todavía no estuviera integrada en main. Esta entrega va en
`codex/t01k-importador-paquete-v2`, separada de esa dependencia. Integrar primero
T01h y después el importador. No se ha importado el paquete real ni se han hecho
escrituras en Cloud.

## Modelo y reutilización comprobados

- `template_days.block_id` ya enlaza el texto reutilizable: se reutiliza en vez
  de agregar otro `source_block_id`. `variant_key` selecciona el set A/B del día.
- No existían equivalentes de `template_segment_items` ni `template_day_items`.
  Los tramos viven en la primera tabla; ALOJAMIENTO/CENA/STAFF, en la segunda.
  El 4x4 nunca se inserta en `day_block_items`. En la cotización existe **una sola
  fila**, en `day_from`, con `billing=per_service` y `span_days`. Los días cubiertos
  se representan mediante `includedSegmentsForDay`, sin filas ni cargos adicionales.
- Los textos PDF reutilizan `doc_blocks` y `doc_block_translations` de T13.
  `kind=static`, `import_kind` conserva el tipo del CSV, `import_sort` su orden,
  y `lang` sigue en la traducción. No se crea `pdf_text_blocks`.
- Se reutilizan proveedores, servicios y tarifas. El proveedor se busca sin
  distinguir mayúsculas; una coincidencia ambigua exige revisión. No se inventan
  códigos de hotel. Los códigos de ubicación salen del SKU, con nombres del CSV.
- La purga sigue siendo `purge_imported_catalog('BORRAR')`: conserva servicios,
  tarifas, módulos, clientes y cotizaciones. Los nuevos enlaces de plantilla se
  eliminan por CASCADE; el respaldo existente incorpora esas tablas y los textos.
  No se ejecutó ninguna purga.

## Migraciones

Después de las dos migraciones de T01h (`20261018000100_block_options_v2.sql`,
`20261018000200_quote_selection.sql`), aplicar en este orden:

1. `supabase/migrations/20261019000100_import_package_v2.sql`.
2. `supabase/migrations/20261019000200_import_template_snapshot.sql`.

Las copias Drizzle `0026` y `0027` son espejos; **no aplicar ambas copias**.
Regenerar tipos de Supabase. No hay Edge Function nueva ni secretos nuevos.
Todas las tablas nuevas tienen RLS, índices y marcas de creación/actualización.
Solo Admin puede preparar, confirmar, leer o descartar lotes. Las escrituras
directas a staging están revocadas, incluso para el cliente autenticado Admin.

## API lista para la pantalla

`src/lib/import/package-v2.ts`:

- `parsePackageV2(files)`: diez CSV, BOM, comillas y párrafos mediante Papa Parse.
- `validatePackageV2(pkg, catalog)`: errores y avisos sin escrituras.
- `diffPackageV2(pkg, catalog)`: claves naturales y comparación de campos gestionados;
  no borra servicios ausentes. Proveedores, tarifas y enlaces existentes conservan IDs.

`src/lib/import/index.ts`:

- `latestFx()` devuelve la configuración vigente, en unidades nativas por USD.
- `stageImportPackage(file, fx)` devuelve `{batchId, validation, rows, control}`.
  El ZIP se procesa localmente; la RPC recibe el paquete y sus filas preparadas.
  Persiste únicamente staging, nunca el catálogo. Las consultas están paginadas.
- `loadImportBatch(batchId)` recupera lote y todas las filas, también paginadas.
- `commitImportBatch(batchId)` llama a `commit_import_batch` y devuelve JSON:
  `status=committed`, o `status=staged` con `error`. **Comprobar status**, no asumir
  éxito por haber recibido una respuesta HTTP correcta. El lote se conserva para
  revisar el diagnóstico; un error revierte todas las escrituras del catálogo.
- `discardImportBatch(batchId)` cierra la vista previa sin alterar el catálogo.
- `controlPackageCosts(pkg, fx)` calcula hoja/app/diferencia/semáforo en `src/lib`.

`src/lib/pricing/template-cost.ts`:

- `costTemplate({pkg,sku}, {pax,tc,staff,fx,year})`, o `costTemplate(templateId, opciones)`.
  La variante por ID lee las tarifas nativas actuales y respeta la visibilidad
  de la plantilla, sin exponer otros programas del lote ni el staging privado.
- El cálculo puro está en `costPackageTemplate`. No usa PRECIO_USD ni un FX fijo.
  Los tests inyectan exclusivamente `fx.json` del fixture.
- Habitaciones DBL + SGL impar, TC separado, cena según política, staff por vehículo;
  traslado frontera por proveedor/ruta/rango, incluido 1 pasajero en la banda 2–4.

Cotizaciones:

- `createQuoteFromTemplate` copia la variante y los enlaces de la plantilla,
  propone habitaciones y vehículos, y guarda distribución/cálculo en la transacción
  existente. Alojamiento, comidas y nota del día entran en los overrides del documento.
- `addBlockDay` y `addBlockDays` admiten variantes opcionales; sin selección usan
  la primera variante disponible y nunca suman A y B a la vez.
- `proposeSegmentForBlocks(route,days,people)` lee `segment_rules` para T09; es
  una propuesta sin escrituras. `includedSegmentsForDay(items,day)` genera las etiquetas.
- Se extiende la aprobación existente a los servicios propios de la plantilla.
  Reemplazar una plantilla desde una cotización elimina sus enlaces importados
  anteriores para evitar cobrarlos otra vez junto al nuevo snapshot.

## Validación y límites

El fixture tiene una actividad independiente `BA-T01`, usada fuera de las tres
plantillas. Su `usado_en`/`veces_usado` evita un falso aviso de bloque huérfano.
Con catálogo vacío hay 0 errores y 1 aviso por la plantilla «sin servicios».
Con catálogo previo también se informa de los servicios ausentes del paquete,
como exige la tarea; se conservan y no se interpreta ese aviso como un borrado.

Los escenarios de aceptación son sintéticos. Las cifras del paquete real aún no
están verificadas: Andrea debe subirlo y revisar su vista previa. Los logs locales
de pruebas y el ZIP real no se agregan al repositorio.

El SPEC pegado por Andrea contiene únicamente un conflicto editorial frente al
SPEC del repositorio. Se conserva la versión resuelta: migración T01h entregada,
todavía pendiente de aplicar en Cloud. No se copian marcadores de conflicto.

## PROMPT PARA LOVABLE

```text
[Lovable] Después de integrar primero T01h (PR #38) y después el PR del
importador en la rama codex/t01k-importador-paquete-v2.

PASO 1 · Base de datos
Comprueba las dos migraciones de T01h. Después aplica en Lovable Cloud, en orden:
20261019000100_import_package_v2.sql
20261019000200_import_template_snapshot.sql
Confirma cada una y regenera los tipos de Supabase. Si ya estaba aplicada,
indícalo y sigue. No ejecutes los espejos Drizzle ni seeds históricos.

PASO 2 · Pantalla /admin/importar
Crea src/routes/_authenticated/admin_.importar.tsx para evitar anidar la pantalla
dentro del componente actual /admin. Usa el shell autenticado y acceso solo Admin
con useCurrentUser. Añade su metadata/navegación en src/components/section.tsx.
No cambies el resto del diseño; colores solo por tokens de src/styles.css.

Toda lógica está en src/lib/import/index.ts. Subir ZIP llama latestFx() y después
stageImportPackage(file, fx). Conserva batchId y muestra la validación guardada.
Pestañas: Errores, Avisos, Diferencias y Control de costos. La tabla de diferencias
es filtrable por tabla y acción; muestra clave natural, antes y después. Agrupa
los conteos nuevos/cambian/iguales/errores usando summary.tables del lote.
Control de costos usa el resultado de src/lib: SKU, pax, costo hoja, costo app,
diferencia y nivel. Verde hasta 1 USD; ámbar hasta 15; rojo por encima o error.
Muestra el FX aplicado. No calcules precios ni conversiones en componentes.

Al reabrir, usa loadImportBatch(batchId), incluidos summary.control y summary.fx.
Confirmar importación permanece deshabilitado si hay errores o el lote ya está
cerrado. La acción explícita llama commitImportBatch(batchId). Solo muestra éxito
si status es committed. Si vuelve staged/error, conserva la vista previa, muestra
el diagnóstico y ofrece preparar de nuevo; no reintentes automáticamente.
Descartar llama discardImportBatch(batchId) y no cambia el catálogo.

La purga existente no se ejecuta al subir ni al confirmar. Antes de usarla,
Andrea exporta los SELECT de docs/consultas/respaldo_catalogo.sql fuera del repo
y confirma BORRAR en el flujo existente.

En el editor, usa includedSegmentsForDay de src/lib/quotes/import-segments.ts
para mostrar «incluido en Día 1» en los días cubiertos, sin insertar otro ítem.
Los enlaces de hotel y tramos pertenecen a la plantilla, no a los bloques diarios.
En adición de bloques, conserva la selección de variante con los parámetros
opcionales de addBlockDay/addBlockDays. proposeSegmentForBlocks solo propone,
sin añadir ni cobrar automáticamente un 4x4. Las escrituras de cotización usan
la cola useQuoteActions y los guardados atómicos existentes.

PASO 3 · Cómo lo pruebo
1. En un catálogo de prueba, subir
src/test/fixtures/import-v2-sintetico/paquete-v2-sintetico.zip:
0 errores y 1 aviso propio del paquete. Los avisos por catálogo previo ausente
se muestran aparte. Ver 16 tarifas, 3 plantillas, 10 días, 6 textos y 2 tramos.
2. Confirmar SOLO el fixture: aparecen las plantillas pendientes y Día de salar
con variantes A y B, sin sumar el cóctel de A dentro de B.
3. Subirlo otra vez: todas las filas del paquete quedan iguales. Cambiar solo
un precio en el fixture: una tarifa cambia. Un error conserva todo sin cambios.
4. Controlar las diez filas de expected_costs.csv usando fx.json: diferencias
menores de 0,01 USD frente al costo esperado. Una cotización SPASPA 1 pax cuesta
1570 USD; 2 pax, 1860; 5 pax, 3030. UYUUYU 3 pax cuesta 1520.
5. El 4x4 de 4 días tiene un solo quote_item, per_service, span_days=4; días 2–4
muestran incluido en Día 1. Habitaciones/cena/staff no están en day_block_items.

ALTO: no subir datos reales al repositorio ni confirmar su importación durante
esta implementación. Andrea subirá el paquete real, revisará errores, avisos,
diff y control por SKU/pax, y responderá OK antes de confirmar ese lote.
```
