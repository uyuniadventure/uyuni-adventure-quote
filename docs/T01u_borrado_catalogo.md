# T01u · Borrado de bloques y plantillas

Backend listo para las pantallas de Lovable. No se ejecutan borrados ni migraciones
en Cloud desde Codex. Rama `codex/t01u-borrar-catalogo`, base `071b16c`.

## Aplicación y respaldo

1. Con las migraciones anteriores ya aplicadas, ejecutar únicamente
   `supabase/migrations/20261017000100_catalog_deletion.sql`. El espejo
   `drizzle/migrations/0022_catalog_deletion.sql` es idéntico: no ejecutar ambas
   copias. Regenerar tipos de Supabase. No requiere seeds ni Edge Functions.
2. Antes de usar la purga, ejecutar cada SELECT de
   [respaldo_catalogo.sql](consultas/respaldo_catalogo.sql) y exportar los once
   resultados a CSV fuera del repositorio. Incluye los días eliminados, los
   renumerados y los vínculos que quedarán nulos. Pausar ediciones/importaciones
   entre respaldo y purga para que el respaldo corresponda al catálogo borrado.
3. La migración solo añade capacidad de borrado; nunca ejecuta una purga.

## Contrato de src/lib/catalog

| Función | Resultado |
|---|---|
| `deleteDayBlocks(ids, {force: false})` | `[]`: borrado completado (o IDs ya ausentes). Array no vacío: **no se borró nada**, con `{block_id, templates:[{id,sku}]}` por bloque utilizado. |
| `deleteDayBlocks(ids, {force: true})` | Quita enlaces, renumera por plantilla en orden original, marca pendiente y borra los bloques. Devuelve `[]`. |
| `deleteTemplates(ids)` | `{templates, template_days}` con cantidades efectivamente eliminadas. Conserva los bloques, incluso si quedan huérfanos. |
| `purgeImportedCatalog(confirm)` | Exige exactamente `BORRAR`; devuelve `{templates, day_blocks, template_days, day_block_translations, day_block_items, day_block_modules, templates_updated}`. |

Las tres funciones llaman exclusivamente RPC. Errores de permisos y validación
se propagan para mostrarlos. IDs repetidos no duplican acciones ni conteos; listas
vacías y IDs ausentes son inocuos; `null` no selecciona todo. **Borrar sin force
no es una simulación:** elimina inmediatamente los bloques sin referencias.
No llamarlo al abrir un diálogo, desde un `useQuery` ni para cargar una vista previa.

Las RPC son SECURITY DEFINER, con `search_path=''`, rol comprobado en servidor y
EXECUTE reservado a authenticated. Vendedor y sesión sin perfil permitido reciben
42501. Bloquean escrituras de las tablas de catálogo durante la transacción para
que no se inserten nuevas referencias entre validación y borrado; lecturas siguen
disponibles. Todo fallo revierte el lote completo. No se modifican permisos de
gestión de usuarios, tarifas o configuración.

La relación `template_days.block_id` conserva NO ACTION; únicamente la RPC quita
esos enlaces. `quotes.template_id` pasa a SET NULL. Los controles de cotizaciones
aceptan solo la desvinculación causada por una FK anidada, con padre ya eliminado
y ninguna otra diferencia en la fila; conservan incluso timestamps, cálculos,
PDF y snapshots. No se usan flags de sesión ni se desactivan triggers en producción.

La duración comercial `days/nights` y SKU de una plantilla mutilada se conservan
para revisión. Su nueva lista empieza en 1; una vacía queda pendiente sin inventar
un día. La validación existente impide usarla/aprobarla hasta completar sus días.

## Qué significa importado

`catalog_origin` es `manual` por defecto. El backfill usa 42 IDs de plantillas y
155 IDs de bloques procedentes de los seeds 02, recuperación y presupuestos 03/04;
actualiza solo los que existan en esa base. Los conteos de purga salen de las filas
reales, nunca de esos números. Conserva una plantilla con `source_quote_id` si un
usuario reemplazó el contenido importado al guardar su cotización como plantilla.

`generate_blocks.py` e `import-presupuesto.ts` marcan explícitamente las nuevas
importaciones. No volver a ejecutar seeds históricos archivados después de esta
migración como mecanismo de reimportación: no incluyen ese campo. Cualquier
importador de T01i debe escribir `catalog_origin='importacion'`. No se consideran
importados los registros desconocidos solo por tener autor nulo o código DAY/IMPORT.
Los bloques derivados desde una cotización son manuales y sobreviven a la purga;
si su padre se borra, solo `parent_block_id` queda nulo.

Los módulos de actividad y sus ítems son catálogo independiente: se conservan;
solo se borran los enlaces `day_block_modules` de los bloques eliminados.
No existen traducciones propias de plantillas en el esquema actual.

## Pantallas para Lovable

- `src/routes/_authenticated/bloques-diarios.tsx` y `plantillas.tsx`: checkbox por
  fila, «Seleccionar todo» sobre la lista filtrada cargada (dejar ese alcance
  visible), y barra «Eliminar (n)». Limpiar IDs obsoletos al refrescar y desactivar
  envíos mientras está pendiente la mutación.
- Diálogo de confirmación con los registros seleccionados. Al confirmar bloques,
  llamar `deleteDayBlocks(ids,{force:false})`. Si devuelve dependencias, mantener
  abierto el diálogo, mostrar SKU de todas las plantillas afectadas y ofrecer
  «Quitar también de las plantillas»; una nueva confirmación explícita llama
  con `force:true`. Nunca reintentar automáticamente con force.
- `src/components/catalog/block-editor.tsx` y `template-editor.tsx`: «Eliminar»
  para un registro guardado, usando el mismo flujo. Cerrar el editor únicamente
  tras éxito; conservar selección y mostrar el motivo si falla.
- `src/routes/_authenticated/admin.tsx`: tarjeta «Vaciar catálogo importado»,
  explicación del alcance, campo BORRAR, confirmación y resultado con conteos
  etiquetados. No ejecutar purga durante el despliegue o una prueba automática
  contra Cloud. La acción la confirma Andrea después del respaldo.
- Controles visibles solo si `canManageCatalog(role)`. La ruta Admin actualmente
  rechaza Operación: permitirle ver **solo esta tarjeta**, manteniendo usuarios,
  divisas y demás ajustes exclusivos de Admin. Revisar acceso del menú en el shell.
- Invalidar consultas de bloques, plantillas, revisión y sugerencias tras éxito;
  refrescar el editor de plantilla afectada. La UI no escribe tablas para borrar
  y no recalcula cotizaciones. Mantener diseño y tokens de `src/styles.css`.

## Comprobación manual

1. Admin/Operación: seleccionar un bloque libre y otro usado; confirmar sin force.
   Ver lista de SKU y comprobar que ambos permanecen. Confirmar force; verificar
   días restantes 1…n y estado pendiente en todas las plantillas afectadas.
2. Eliminar una plantilla utilizada por una cotización: al reabrirla conserva
   días, servicios y total; solo se pierde el vínculo a la plantilla. Probar
   también una enviada/archivada y el borrado desde los editores.
3. Vendedor: controles ocultos y RPC denegadas. Operación: tarjeta de purga visible
   sin acceso a las otras funciones de Admin. Confirmación distinta de BORRAR falla.
4. Tras exportar el respaldo, Andrea puede confirmar BORRAR; comprobar conteos,
   conservación de manuales, tarifario/clientes/cotizaciones y que repetir devuelve
   ceros. Plantillas manuales que usaban bloques importados sobreviven pendientes.

Las pruebas locales usan PGlite con todas las migraciones y RLS reales. No simulan
concurrencia entre conexiones de Cloud; los bloqueos se implementan en PostgreSQL.
