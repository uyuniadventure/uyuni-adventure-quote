# T01k · Borrar plantillas y bloques, aprobar bloques

Tarea previa a T01h. Base: `origin/main` en `ff9ee99`, que integra T01u por
PR #35. T01k amplía ese backend; la UI se entrega mediante el prompt para Lovable.
No se ejecutan migraciones ni borrados en Cloud.

## Diagnóstico previo (rg)

Consultas reproducibles sobre el código de la base:

```text
rg -n 'catalog_seller_update|catalog_operations|parent_write' supabase/migrations/20261004000200_security.sql
rg -n 'references public.itinerary_templates|references public.day_blocks|source_block_id|quotes_template_id_fkey' supabase/migrations
rg -n 'approve_valid_imports|template_review|cardinality|approved_services|import_warnings' supabase/migrations/20261011000700_import_approval_unlinked_items.sql
rg -n 'delete|approve|Checkbox|Copy|limit\(500\)' src/routes/_authenticated/plantillas.tsx src/routes/_authenticated/bloques-diarios.tsx
```

| Tabla | DELETE | UPDATE / aprobación |
|---|---|---|
| itinerary_templates / day_blocks | `catalog_operations`, FOR ALL: Admin/Operación. Vendedor no tiene DELETE. | Admin/Operación pueden cambiar status. `catalog_seller_update` solo permite pendientes propios y exige que sigan pendientes; no puede aprobar. |
| template_days / day_block_items / day_block_translations | `parent_write`, FOR ALL: Admin/Operación; vendedor solo en padre pendiente propio. | Misma condición del padre; esas tablas no tienen status. Quitar un ítem/día propio no equivale a borrar o aprobar el padre. |

Evidencia: migración de seguridad, líneas 71–86. No falta permiso de Admin/Operación;
faltaban las acciones y el flujo seguro. Las políticas permanecen iguales.

| FK en main | Estado antes de T01k |
|---|---|
| quotes.template_id | SET NULL desde T01u (`20261017000100_catalog_deletion.sql`, líneas 4–6). |
| quote_days.source_block_id | SET NULL desde `20261011001000_quote_days_traceability.sql`, línea 10. |
| template_days.block_id | NO ACTION desde foundation_schema, línea 241. T01k lo declara RESTRICT explícitamente. |
| template_days.template_id | CASCADE desde foundation_schema, línea 239; borrar plantilla quita sus días, no bloques. |

T01u ya protege snapshots/cálculos/PDF al desvincular por FK, con pruebas de todos
los estados. También tiene RPC de borrado y purga. Se reutilizan; no se repiten
en T01h ni se vuelve a implementar la purga de T01i.

La aprobación existente es `approve_valid_imports` (versión final en
`20261011000700_import_approval_unlinked_items.sql`). Es exclusiva de Admin porque
aprueba **servicios y plantillas** juntos. Simula sin escribir y aplica con una
huella del catálogo. Un servicio pendiente necesita unidad, moneda y tarifa vigente
con neto/rack. Una plantilla exige días completos, días con servicios, bloques y
módulos no inactivos, módulos no vacíos y servicios aprobados o aprobables en el
mismo lote. Guarda los motivos en `approval_issues`; no cambia activos/inactivos.

No evalúa los textos ES ni utiliza `import_warnings` como condición de bloqueo.
Por tanto, no todas las importadas quedan pendientes por tener ese campo: las que
no pasan se bloquean por esas comprobaciones estructurales o de servicios. La UI
`BulkImportApproval` solo ofrece «Aprobar todo lo válido»; no existe aceptación de
avisos. Las listas tienen límite 500 y no tienen selección ni acciones de aprobación/
borrado. Plantillas solo añade crear cotización/duplicar a la apertura del editor.

T01k permite aprobar plantillas seleccionadas a Admin/Operación sin modificar
servicios. En la aprobación global de importación se añade el mismo consentimiento
para plantillas, conservando el permiso exclusivo de Admin y las validaciones de
tarifas para servicios.

## Migraciones y seguridad

Con las migraciones anteriores aplicadas, ejecutar en este orden:

1. `20261017000100_catalog_deletion.sql` (T01u), solo si falta.
2. **Nueva:** `20261017000200_catalog_approval_actions.sql` (T01k).

Regenerar tipos. El espejo Drizzle `0023_catalog_approval_actions.sql` es idéntico;
no ejecutar ambas copias. No requiere seeds ni despliegue de Edge Functions.
La migración habilita las acciones, no aprueba ni elimina registros.

Todas las acciones nuevas usan SECURITY DEFINER, `search_path=''`, comprobación
de rol y EXECUTE limitado a authenticated; los auxiliares no son invocables por
clientes. Admin/Operación gestionan las selecciones. Vendedor recibe 42501 en
español. No cambian las políticas de acceso a cotizaciones privadas ni al tarifario.
La aprobación bloquea escrituras de las dependencias durante la transacción y
revisa los avisos otra vez al aplicar. Cualquier error revierte el lote entero.

## Contrato de src/lib/catalog

| Función | Resultado / efecto |
|---|---|
| `previewCatalogApproval(kind, ids)` | Lectura sin escrituras. `kind`: `day_blocks` o `templates`. Devuelve `{items:[{id,code,name,reasons}], eligible, with_warnings}`. |
| `approveDayBlocks(ids, {acceptWarnings:false})` | Activa los sin avisos y deja pendientes los demás. Devuelve la revisión más `{approved,pending,accept_warnings}`. |
| `approveDayBlocks(ids, {acceptWarnings:true})` | Activa todos los seleccionados existentes y conserva los motivos en `approval_issues`. |
| `approveTemplates(ids, {acceptWarnings})` | Mismo contrato, usando las validaciones de plantillas. No modifica bloques ni servicios. |
| `previewTemplateDeletion(ids)` | Lectura: `{templates,template_days,quotes_detached}`. Expone solo conteos, no contenido de cotizaciones privadas. |
| `deleteTemplates(ids)` | Borra plantillas y sus días; devuelve esos conteos reales, con filas bloqueadas durante la operación. |
| `deleteDayBlocks(ids, {force:false})` | Array no vacío `{block_id,templates:[{id,sku}]}`: no se modificó nada del lote. `[]`: borrado completado o IDs ya ausentes. Es una mutación, no una previsualización. |
| `deleteDayBlocks(ids, {force:true})` | Quita días afectados, renumera, ajusta duración, deja plantillas pendientes y borra bloques. Devuelve `[]`. |
| `archiveDayBlocks(ids)` / `archiveTemplates(ids)` | Estado `inactivo`, sin eliminar vínculos ni contenido. Devuelve `{archived}` con los registros que cambiaron de estado. |

Las opciones omitidas equivalen a `false`. IDs repetidos se procesan una vez;
listas vacías o IDs ausentes no seleccionan todo. `null` no es una lista válida.
Los errores se propagan a la UI. Solo se modifican los IDs seleccionados; aprobar
explícitamente un registro inactivo puede reactivarlo. Sin aceptar sus avisos,
el seleccionado queda pendiente. Cancelar la previsualización no cambia estados.

Los bloques avisan por: cero servicios vinculados al tarifario, falta de título
ES, ES sin revisar, servicio pendiente/inactivo o ítem sin vínculo. Se cuentan
servicios directos, de módulos y hotel. Aceptar avisos no marca traducciones como
revisadas, no aprueba servicios ni omite las validaciones de cotización/PDF.
Las plantillas conservan las comprobaciones estructurales anteriores y añaden
los avisos persistidos en `import_warnings`.

Al quitar un día de una plantilla de cuatro, quedan tres días numerados 1–3 y
`days=3` (3/3 en la lista). `nights` se limita a `days-1` y el SKU se conserva como
identidad, sin renombrarlo automáticamente. Si se eliminan todos los días, se
mantiene su duración anterior porque el esquema exige `days>0`; queda pendiente
y vacía para revisión. La purga T01u llama la misma RPC de bloques, por lo que
comparte este comportamiento para plantillas manuales que sobrevivan a la purga.
El resto del contrato de purga y su respaldo permanece en
[T01u_borrado_catalogo.md](T01u_borrado_catalogo.md).

`quotes_detached` del preview es orientativo hasta confirmar; el resultado de
`deleteTemplates` refleja el conteo real. Los días, ítems, total, cálculo, PDF y
timestamps de cotizaciones se conservan. Solo quedan nulas las FK de origen.
Duplicar manualmente una plantilla importada guarda `catalog_origin='manual'`.

### Aprobación global existente

`reviewImport(fingerprint?, {acceptWarnings:false})`, en `src/lib/import-review.ts`,
continúa llamando `approve_valid_imports`, exclusivo de Admin. Los llamadores
anteriores siguen funcionando por el valor predeterminado. Para aceptar avisos
de plantillas: simular con `reviewImport(undefined,{acceptWarnings:true})` y aplicar
con la huella devuelta y la misma opción. Cambiar la opción invalida la huella.
Las validaciones de servicios no se relajan; un servicio sin tarifa permanece
pendiente aunque su plantilla se apruebe con aceptación explícita.

## Pantallas para Lovable después del merge

Reutilizar los componentes de catálogo y `canManageCatalog()`/`useCurrentUser()`.
Todas las acciones seleccionadas solo aparecen para Admin/Operación. La aprobación
global de servicios/plantillas sigue reservada a Admin. Colores por tokens y
diseño existente. Toda escritura de estas acciones pasa por `src/lib/catalog`.

- `src/routes/_authenticated/plantillas.tsx` y `bloques-diarios.tsx`: checkbox por
  fila, «Seleccionar todo» para **todos los resultados filtrados**, barra «Aprobar
  (n)», «Eliminar (n)», «Archivar (n)» y menú ⋯ por fila con Aprobar/Eliminar.
  Paginar la lectura de IDs si excede los 500 actuales, con orden estable; no
  truncar silenciosamente la selección. Limpiarla al cambiar filtros y quitar
  IDs ausentes al refrescar. Deshabilitar envíos repetidos durante la mutación.
- Aprobar: cargar `previewCatalogApproval` y mostrar nombre/código y cada motivo.
  Con avisos, ofrecer «Aprobar solo los sin avisos» (`acceptWarnings:false`) y
  «Aprobar todos igual» (`true`), sobre la selección confirmada. Sin avisos,
  confirmar normalmente. Mostrar conteos devueltos y avisos nuevos si cambiaron
  entre vista previa y aplicación; nunca aceptar automáticamente.
- Eliminar bloques: confirmar primero los seleccionados y llamar con
  `force:false`. Si vuelve una lista no vacía, explicar que no se borró nada,
  mostrar bloque → todas sus plantillas y pedir una segunda confirmación con
  «Eliminar y quitar de las plantillas» (`force:true`). No usar el borrado para
  cargar el diálogo ni reintentar con force automáticamente.
- Eliminar plantillas: llamar `previewTemplateDeletion` y mostrar cuántas
  cotizaciones quedarán sin origen, conservando sus días y total. Tras confirmar,
  llamar `deleteTemplates` y mostrar el conteo final real.
- Archivar: confirmar y llamar `archiveDayBlocks`/`archiveTemplates`. El estado
  es `inactivo`; no crear un enum `archivado` ni borrar registros.
- Reutilizar los mismos flujos para el botón Eliminar de un registro guardado en
  `src/components/catalog/block-editor.tsx` y `template-editor.tsx` (pedido T01u).
  Cerrar editor solo tras éxito. Refrescar listas, detalles y cotizaciones con
  origen afectado; conservar selección/diálogo y mostrar el motivo si falla.
- `src/components/catalog/bulk-import-approval.tsx`: añadir aceptación explícita
  de avisos de plantillas usando `reviewImport` como se describe arriba. Conservar
  simulación, confirmación y restricción Admin. No saltar requisitos de tarifas.

La tarjeta de purga en `/admin` es la de T01u; T01k no necesita ejecutar ninguna
purga. T01h reutiliza estas acciones, sin repetir su implementación.

## Validación

43/43 pruebas de catálogo con PGlite (18 nuevas). Incluyen avisos, aceptación,
simulación sin escrituras, permisos, archivado, rollback, bloqueo del lote sin
force, renumeración y snapshots íntegros al borrar en todos los estados de
cotización. Caso sintético `SPASPA-4D3N-FJJ`: borrar un bloque deja 3/3 días.
Nueve suites históricas de base de datos aprobadas. Suite completa: 386/388;
solo fallan los dos fixtures incompletos existentes de Bolivia/WE ROAD (T03–T04).
No se omiten pruebas ni se modifican esos presupuestos.
Instalación congelada, TypeScript de app/E2E, build y ESLint de los archivos
TypeScript modificados aprobados. Build conserva el aviso existente de
`fontkit.open`; no se modificó la compatibilidad de parse5 ni las Edge Functions.

Prueba manual posterior al despliegue (a realizar por Andrea/Lovable, no ejecutada
en Cloud por Codex):

1. Filtrar Pendiente, seleccionar todo, Aprobar y Aprobar todos igual; verificar
   estados y conteos. Sin aceptar, un bloque con cero servicios sigue pendiente.
2. Borrar un bloque utilizado una vez en `SPASPA-4D3N-FJJ`: mostrar dependencias;
   tras confirmar, plantilla pendiente con 3/3 días.
3. Borrar `SPASPA-4D3N-MJF` ("- VIP"): confirmar número de cotizaciones afectadas
   y comprobar que conservan días/total. Usar una copia si ya no existe ese SKU.
4. Archivar una selección y verificar estado Inactivo. Con Vendedor, no aparecen
   acciones y las RPC de borrado/aprobación devuelven permiso denegado.
