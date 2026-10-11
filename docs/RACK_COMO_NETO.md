# Rack como costo neto

Decisión de Andrea, 2026-10-11: «Si una tarifa solo trae rack, ese valor es el costo neto». El rack se conserva; un neto existente, incluso cero, no se sustituye.

## Recuento previo

**Andrea confirmó el 2026-10-11 que Lovable Cloud tiene 243 tarifas con neto vacío y rack informado.** Ese es el recuento esperado para la copia. Se trata de una confirmación del responsable, no de una consulta remota realizada por Codex; el preflight y el script lo vuelven a comprobar en la base de destino antes de escribir.

La base local reconstruida con los seeds históricos contiene 1.169 tarifas:

| Condición | Filas |
|---|---:|
| Neto vacío y rack informado: candidatas a la copia | **0** |
| Rack ya copiado a neto, con marca histórica `net_cost_missing` | 238 |
| Neto y rack vacíos | 5 |

Las 238 más las 5 locales suman 243, pero las últimas 5 no tienen rack para copiar. Andrea aclaró que el recuento de Cloud no corresponde a esa suma. El CSV fuente conserva 248 filas solo con rack; 10 fueron omitidas en la importación por los motivos de su reporte histórico. No se confunden filas fuente, tarifas importadas y datos actuales de Cloud.

**La copia remota no se ha ejecutado.** Según AGENTS.md §10, el SQL se entrega para ejecución en Lovable Cloud. Los seeds históricos y el CSV permanecen intactos.

## Orden de aplicación

1. Ejecutar `supabase/seed/04_rack_to_net_preflight.sql` en el SQL Editor de Lovable Cloud. Es de solo lectura: devuelve `filas_a_copiar`, `confirma_243`, otros recuentos y el listado de IDs/SKU, precios originales y netos propuestos.
2. Mostrar el recuento y listado. Solo si devuelve **243**, ejecutar la migración nueva `supabase/migrations/20261011000200_rack_to_net.sql` completa. Si devuelve otra cifra, detener la copia y reconciliar la diferencia. No cambiar el número esperado ni ampliar la condición a registros con neto ya informado. Esta migración sustituye al seed `04_rack_to_net.sql` de la versión anterior del PR: no ejecutar ambos.
3. El script de copia vuelve a contar bajo bloqueo de escritura, exige exactamente 243 y copia `price_rack` a `price_net`, dejando `price_rack` intacto y desmarcando `net_cost_missing` solo en esas filas. Devuelve cuántas filas actualizó y verifica netos/racks. Un error revierte toda la transacción. No modifica notas, servicios o cotizaciones.
4. Repetir el preflight después de la copia: deben quedar 0 candidatas. El script de copia no se vuelve a ejecutar: el control de 243 lo rechazará con 0 candidatas.
5. Aplicar `supabase/migrations/20261011000300_quote_pricing_errors.sql`, que adapta la persistencia de cálculos incompletos y bloquea revisión/emisión mientras tengan errores. Usa el JSON de cálculo y las columnas existentes; no agrega tablas.
6. Desplegar el código actualizado. No hay cambios de pantallas. Esta rama parte del PR de Cotizaciones/LTd; su migración `20261011000100_template_quote_defaults.sql` y seed deben aplicarse antes, según `VALIDACION_LTD.md`.

## Cálculo e importaciones

El motor usa neto y, si está vacío, rack. El importe cero es válido. No emite el aviso de cálculo por un `net_cost_missing=true` histórico cuando hay un precio disponible. Si faltan ambos precios en un servicio que debe cobrarse, devuelve ese ítem con `status: error` y el aviso «sin costo neto ni rack». Sus importes, los del día afectado y los totales de la cotización son `null`; los demás ítems conservan su desglose. Un escenario de pasajeros con errores también impide publicar un total parcial.

El borrador guarda el error y el aviso en `calculation`, y se recuperan al reabrirlo mediante los avisos existentes. No se puede pasar a revisada ni generar/guardar un PDF con ese cálculo. Al resolver el precio con el mecanismo de sobrescritura documentada existente, recalcular recupera los totales. No se asigna cero a un precio desconocido ni se inventan unidades de cobro.

El generador de futuras importaciones copia rack a neto, preserva rack, registra la decisión y marca la falta de costo solo cuando faltan ambos. No se regeneran ni reejecutan los seeds ya aplicados. Los snapshots guardados no se reescriben; al recalcular un borrador se aplica la regla nueva.

## Pruebas

- `npm run test`: neto/rack, marcas históricas, importes cero, precio existente con precedencia, ítems y escenarios sin ambos precios, persistencia/reapertura del error y corrección, y la referencia LTd del PR anterior. Tres casos históricos distintos de LTd siguen omitidos por falta de datos fuente exactos; no se presentan como validados.
- `npm run test:db`: incluye el preflight sobre datos históricos y pruebas aisladas que rechazan 0/242/244 candidatas sin cambios. Con **243 tarifas sintéticas**, verifica la copia, conservación del rack y notas, cero válido y que las demás tarifas quedan intactas. El caso sintético no confirma el recuento remoto.
- `npm run typecheck` y `npm run build`.

La reconstrucción de una BD vacía para tests utiliza una precondición explícita de 243 tarifas sintéticas antes de ejecutar la migración real, verifica la copia y elimina esa fixture. No debilita el control de producción ni certifica el conteo de Cloud. Las pruebas negativas parten del esquema anterior y ejecutan la misma migración con recuentos distintos.

## Servicios sin unidad

`docs/pendientes/servicios_sin_unidad.csv` contiene los **11 servicios sin unidad** del catálogo reconstruido con los seeds históricos: SKU, nombre, proveedor y columna `unidad` vacía. Conserva los nombres de la fuente; no asigna unidades a partir del nombre ni del precio. Es un listado local para completar por el responsable, no una extracción del estado actual de Cloud.

Se puede regenerar con `node scripts/db/export-missing-units.mjs`. El exportador comprueba que sean 11 antes de escribir. El CSV histórico original contiene 13 filas sin unidad; ese recuento de origen no sustituye el de servicios importados.
