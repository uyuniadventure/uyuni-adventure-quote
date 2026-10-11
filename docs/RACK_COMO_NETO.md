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
2. Solo si devuelve **243**, confirmar ese recuento y listado antes de ejecutar `supabase/seed/04_rack_to_net.sql` completo. Si devuelve otra cifra, detener la copia y reconciliar la diferencia. No cambiar el número esperado ni ampliar la condición a registros con neto ya informado.
3. El script de copia vuelve a contar bajo bloqueo de escritura, exige exactamente 243 y copia `price_rack` a `price_net`, dejando `price_rack` intacto y desmarcando `net_cost_missing` solo en esas filas. Devuelve cuántas filas actualizó y verifica netos/racks. Un error revierte toda la transacción. No modifica notas, servicios o cotizaciones.
4. Repetir el preflight después de la copia: deben quedar 0 candidatas. El script de copia no se vuelve a ejecutar: el control de 243 lo rechazará con 0 candidatas.
5. Desplegar el frontend con la regla actualizada. No hay cambio de esquema en esta entrega. Esta rama parte del PR de Cotizaciones/LTd; su migración y seed mantienen su propio orden, documentado en `VALIDACION_LTD.md`.

## Cálculo e importaciones

El motor usa neto y, si está vacío, rack. El importe cero es válido. No emite el aviso antiguo por un `net_cost_missing=true` histórico cuando hay un precio disponible. Si faltan ambos precios en un servicio que debe cobrarse, detiene el cálculo con «sin costo neto ni rack»; no produce un total incompleto. El detalle del tarifario aplica la misma condición al aviso.

El generador de futuras importaciones copia rack a neto, preserva rack, registra la decisión y marca la falta de costo solo cuando faltan ambos. No se regeneran ni reejecutan los seeds ya aplicados. Los snapshots guardados no se reescriben; al recalcular un borrador se aplica la regla nueva.

## Pruebas

- `npm run test`: neto/rack, marcas históricas, importes cero, precio existente con precedencia, falta de ambos precios, y la referencia LTd del PR anterior.
- `npm run test:db`: incluye el preflight sobre datos históricos y pruebas aisladas que rechazan 0/242/244 candidatas sin cambios. Con **243 tarifas sintéticas**, verifica la copia, conservación del rack y notas, cero válido y que las demás tarifas quedan intactas. El caso sintético no confirma el recuento remoto.
- `npm run typecheck` y `npm run build`.
