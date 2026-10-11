# Seeds: historial y referencia pendiente

Todos los seeds archivados en `applied/` ya fueron aplicados en **Lovable Cloud**, según el estado confirmado por el responsable del proyecto al 6 de octubre de 2026.

Se conservan los SQL y sus reportes originales como historial y para pruebas en bases locales vacías. No volver a ejecutarlos en Lovable Cloud como parte de esta entrega.

## Pendiente de aplicar: LTd, 2 pasajeros

1. Aplicar `supabase/migrations/20261011000100_template_quote_defaults.sql`.
2. Ejecutar `supabase/seed/03_uyuuyu_ltd_2pax.sql` completo.
3. Desplegar el frontend de esta entrega y comprobar el flujo como admin según [VALIDACION_LTD.md](../../docs/VALIDACION_LTD.md).

El seed agrega tres bloques exclusivos y configura únicamente `UYUUYU-3D2N-LTd` para 2 pagantes, 0 TC y costo de referencia USD 1.475. No modifica tarifas maestras, cotizaciones previas ni otros programas. No aprueba automáticamente los textos o productos. Repetirlo no sobrescribe cambios posteriores en esa configuración.

## Historial aplicado

Orden histórico: `00_base.sql`, `01_tarifario_001.sql` a `01_tarifario_011.sql`, luego `02_bloques_001.sql` a `02_bloques_004.sql`. Los reportes JSON documentan los datos importados y las omisiones; no son archivos ejecutables.

Aplicado no significa aprobado: los productos y bloques importados como `pendiente` conservan su flujo de revisión humana. Esta limpieza no cambia datos remotos ni verifica su estado mediante conexión a la base.
