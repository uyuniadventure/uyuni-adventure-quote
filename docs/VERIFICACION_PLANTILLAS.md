# Verificación de plantillas — 6 de octubre de 2026

## Alcance y resultado

Auditoría reproducible de la guía y de los seeds archivados como aplicados. No es una consulta a Lovable Cloud: Codex no tiene acceso directo. Los datos actuales editados en la nube pueden diferir; se incluye una consulta de solo lectura para verificarlos allí.

La guía contiene **46 entradas y 43 SKU distintos**. La importación creó 40 plantillas. No hay entradas con `sku_norm` vacío; sí hay contenido de otros programas sin SKU propio mezclado dentro de entradas. El importador agrupa en una sola razón los descartes por SKU inválido, duplicado o duración, por lo que el reporte anterior no explicaba cada caso.

| Entrada (base 1) | SKU de origen | Causa y resolución |
|---|---|---|
| 28 | SPAUYU-3D3N-FTL | Rechazada por duración: contiene días 1–4, con el cuarto opcional. Se recupera como **SPAUYU-4D3N-FTL**, conservando toda la narrativa y marcando la duración comercial y la letra T del combo para revisión. No se transforma T a Ts sin aprobación. |
| 44 | UYUUYU-2D1N-L | Rechazada porque tiene seis entradas de día (1,2,1,2,3,4). Los primeros dos pertenecen al programa 2D1N; los otros cuatro son Uyuni–Arica, sin SKU propio. Se recuperan solo los primeros dos; los textos generales mezclados no se copian. |
| 46 | SPA4D/ | SKU inválido y extracción mezclada. **Excluida por decisión expresa del usuario.** El título del primer día contiene los días 2–4 recuperables; las otras entradas pertenecen a SPA2D-TATIO-CEJAR-LUNA. Requiere corregir la fuente y definir SKU. |
| 6 | SPAUYU-3D2N-FL | SKU duplicado de la entrada 4; ya existe, no se crea otra plantilla. Los textos no son necesariamente idénticos. |
| 24 | SPASPA-4D3N-MRF | SKU duplicado de la entrada 9; ya existe. |
| 45 | UYUSPA-3D2N-JTd | SKU duplicado de la entrada 39 y días mezclados 1,2,3,1,2,3; ya existe. El segundo itinerario no tiene SKU propio. |

`SPASPA4D3N-ÑLTd` (entrada 13) sí fue importada como `SPASPA-4D3N-ÑLTd`: la normalización del guion funcionó; no es una plantilla faltante.

**Resultado esperado: 40 → 42 plantillas**, no 43, por la exclusión solicitada. La migración agrega dos plantillas, seis bloques, seis traducciones ES y seis enlaces de día. Todo queda pendiente y las traducciones `reviewed=false`; las advertencias viajan con la plantilla. No actualiza ni elimina plantillas existentes.

## Servicios y límites de las fuentes

Ninguna de las dos recuperadas tiene presupuesto enlazable por SKU en las 75 hojas suministradas (tampoco el SKU original 3D3N-FTL). Por ello se insertan **cero day_block_items nuevos**. No se inventan SKU, costos, habitaciones, proveedores ni se toma el presupuesto de otra ruta. Los nombres narrativos de hoteles no determinan una variante tarifaria inequívoca. Asignar sus servicios y aprobarlos requiere revisión humana.

Los **562 ítems existentes** tienen `service_id` válido; **cero referencias huérfanas**. Para los presupuestos enlazables, todos los SKU explícitos resuelven por `services.sku` o `service_sku_aliases`; **cero SKU explícitos no encontrados**. Esto no significa que el catálogo esté completo: hay **234 filas de presupuesto con SKU nulo**, registradas individualmente con plantilla, hoja, número de ítem y descripción en `docs/fase0/verificacion_plantillas.json`.

Plantillas con días sin servicios (incluye búsqueda de ítems de módulos):

| Plantilla | Días sin servicios |
|---|---|
| SPASPA-4D3N-FJJ | 1, 2, 3, 4 |
| SPASPA-4D3N-FJM | 1, 2, 3, 4 |
| SPASPA-4D3N-ScJF | 1, 2, 3, 4 |
| SPASPA-4D3N-ScJTd | 1, 2, 3, 4 |
| SPASPA-4D3N-ScLM | 1, 2, 3, 4 |
| SPASPA-4D3N-ScRF | 1, 2, 3, 4 |
| SPAUYU-3D2N-HK | 1, 2, 3 |
| SPAUYU-4D3N-FTL | 1, 2, 3, 4 |
| UYUSPA-3D2N-KDr | 1, 2, 3 |
| UYUSPA-3D2N-LM | 1, 2, 4 |
| UYUUYU-2D1N-L | 1, 2 |
| UYUUYU-3D2N-CkHj | 1, 2, 3 |
| UYUUYU-3D2N-PF | 1, 2, 3 |
| UYUUYU-3D2N-ÑF | 1, 2, 3 |

**Anomalía existente:** `UYUSPA-3D2N-LM` tiene bloques enlazados en días 1, 2 y 4; falta el día 3 y sobra el 4 respecto a su duración. Se reproduce la numeración de la fuente y se reporta para corregirla, sin renumerar una plantilla que pudo haber sido editada en Cloud. Las otras 41 plantillas tras la recuperación cubren sus días 1…N con bloques.

Filas de presupuesto sin SKU por plantilla:

| Plantilla | Filas sin SKU |
|---|---|
| SPASPA-4D3N-LLTd | 9 |
| SPASPA-4D3N-MJF | 10 |
| SPASPA-4D3N-MLF | 10 |
| SPASPA-4D3N-MLTd | 10 |
| SPASPA-4D3N-MPF | 9 |
| SPASPA-4D3N-MPTd | 10 |
| SPASPA-4D3N-MRF | 11 |
| SPASPA-4D3N-MÑF | 10 |
| SPASPA-4D3N-PPTd | 9 |
| SPASPA-4D3N-ScKS | 10 |
| SPASPA-4D3N-ÑLTd | 9 |
| SPASPA-4D3N-ÑÑF | 10 |
| SPAUYU-3D2N-FJ | 6 |
| SPAUYU-3D2N-FL | 6 |
| SPAUYU-3D2N-FP | 6 |
| SPAUYU-3D2N-ML | 9 |
| SPAUYU-3D2N-MP | 9 |
| SPAUYU-3D2N-ScK | 7 |
| UYUSPA-3D2N-JTd | 7 |
| UYUSPA-3D2N-KS | 8 |
| UYUSPA-3D2N-LTd | 7 |
| UYUSPA-3D2N-PTd | 7 |
| UYUSPA-3D2N-ÑTd | 7 |
| UYUUYU-3D2N-JTd | 7 |
| UYUUYU-3D2N-KS | 9 |
| UYUUYU-3D2N-LTd | 7 |
| UYUUYU-3D2N-PTd | 8 |
| UYUUYU-3D2N-ÑTd | 7 |

## Verificación por plantilla

Los enlaces cuentan las apariciones por día; un ítem multi-día puede aparecer en más de uno.

| SKU | Días enlazados | Días sin bloque | Fuera de duración | Enlaces de ítems |
|---|---|---|---|---|
| SPASPA-4D3N-FJJ | 1, 2, 3, 4 | — | — | 0 |
| SPASPA-4D3N-FJM | 1, 2, 3, 4 | — | — | 0 |
| SPASPA-4D3N-LLTd | 1, 2, 3, 4 | — | — | 25 |
| SPASPA-4D3N-MJF | 1, 2, 3, 4 | — | — | 24 |
| SPASPA-4D3N-MLF | 1, 2, 3, 4 | — | — | 24 |
| SPASPA-4D3N-MLTd | 1, 2, 3, 4 | — | — | 24 |
| SPASPA-4D3N-MPF | 1, 2, 3, 4 | — | — | 23 |
| SPASPA-4D3N-MPTd | 1, 2, 3, 4 | — | — | 23 |
| SPASPA-4D3N-MRF | 1, 2, 3, 4 | — | — | 23 |
| SPASPA-4D3N-MÑF | 1, 2, 3, 4 | — | — | 24 |
| SPASPA-4D3N-PPTd | 1, 2, 3, 4 | — | — | 23 |
| SPASPA-4D3N-ScJF | 1, 2, 3, 4 | — | — | 0 |
| SPASPA-4D3N-ScJTd | 1, 2, 3, 4 | — | — | 0 |
| SPASPA-4D3N-ScKS | 1, 2, 3, 4 | — | — | 21 |
| SPASPA-4D3N-ScLM | 1, 2, 3, 4 | — | — | 0 |
| SPASPA-4D3N-ScRF | 1, 2, 3, 4 | — | — | 0 |
| SPASPA-4D3N-ÑLTd | 1, 2, 3, 4 | — | — | 25 |
| SPASPA-4D3N-ÑÑF | 1, 2, 3, 4 | — | — | 26 |
| SPAUYU-3D2N-FJ | 1, 2, 3 | — | — | 18 |
| SPAUYU-3D2N-FL | 1, 2, 3 | — | — | 18 |
| SPAUYU-3D2N-FP | 1, 2, 3 | — | — | 16 |
| SPAUYU-3D2N-HK | 1, 2, 3 | — | — | 0 |
| SPAUYU-3D2N-ML | 1, 2, 3 | — | — | 19 |
| SPAUYU-3D2N-MP | 1, 2, 3 | — | — | 16 |
| SPAUYU-3D2N-ScK | 1, 2, 3 | — | — | 19 |
| SPAUYU-4D3N-FTL | 1, 2, 3, 4 | — | — | 0 |
| UYUSPA-3D2N-JTd | 1, 2, 3 | — | — | 18 |
| UYUSPA-3D2N-KDr | 1, 2, 3 | — | — | 0 |
| UYUSPA-3D2N-KS | 1, 2, 3 | — | — | 16 |
| UYUSPA-3D2N-LM | 1, 2, 4 | 3 | 4 | 0 |
| UYUSPA-3D2N-LTd | 1, 2, 3 | — | — | 19 |
| UYUSPA-3D2N-PTd | 1, 2, 3 | — | — | 16 |
| UYUSPA-3D2N-ÑTd | 1, 2, 3 | — | — | 18 |
| UYUUYU-2D1N-L | 1, 2 | — | — | 0 |
| UYUUYU-3D2N-CkHj | 1, 2, 3 | — | — | 0 |
| UYUUYU-3D2N-JTd | 1, 2, 3 | — | — | 17 |
| UYUUYU-3D2N-KS | 1, 2, 3 | — | — | 15 |
| UYUUYU-3D2N-LTd | 1, 2, 3 | — | — | 18 |
| UYUUYU-3D2N-PF | 1, 2, 3 | — | — | 0 |
| UYUUYU-3D2N-PTd | 1, 2, 3 | — | — | 16 |
| UYUUYU-3D2N-ÑF | 1, 2, 3 | — | — | 0 |
| UYUUYU-3D2N-ÑTd | 1, 2, 3 | — | — | 18 |

## Aplicación en Lovable Cloud

Ejecutar **solo** `supabase/migrations/20261006100000_recover_missing_templates.sql`, después del esquema y los seeds 00/01/02 ya aplicados. No ejecutar otra vez migraciones ni seeds históricos. No hay nuevos secretos, tablas ni cambios de RLS.

La migración es transaccional, usa UUID determinísticos y `ON CONFLICT DO NOTHING`, no sobrescribe ediciones humanas y comprueba la cobertura de días de las dos plantillas. Si un SKU o código ya existe con otro UUID, puede abortar por conflicto de referencias: reconciliar ese registro antes de reintentar, sin borrar datos.

Para verificar el estado remoto después de aplicar, ejecutar la consulta de solo lectura `scripts/db/verify-template-import.sql` en el SQL Editor. Devuelve cobertura, días vacíos y referencias de servicio inválidas por cada plantilla del catálogo actual. El total 42 presupone los mismos 40 registros iniciales del seed, sin altas ni bajas manuales posteriores.

## Prueba local

```sh
node scripts/db/test-template-recovery.mjs
# Regenerar el reporte verificable:
node scripts/db/test-template-recovery.mjs --report
```

La prueba reconstruye explícitamente el esquema canónico 000100–000700 y los seeds aplicados, comprueba la diferencia de SKU, todos los enlaces, estado pendiente, traducciones sin revisar, conservación de las 40 plantillas, repetición sin duplicados y preservación de una edición humana.

Integración con `main` del 11 de octubre de 2026: el preparador local conserva `migrationFiles` para esta reconstrucción histórica, `throughMigration` para las pruebas de rack y las fixtures necesarias para ejecutar la migración real que exige 243 tarifas. Antes de la recuperación carga los códigos de ubicación del seed 00, que ya existen en Cloud y son necesarios para las claves foráneas. Por defecto ejecuta todas las migraciones actuales. `test:db` incluye también la prueba de recuperación y comprueba 42 plantillas, 149 bloques, 149 traducciones, 144 enlaces de día y los mismos 562 ítems tras reproducir los seeds. Los reportes históricos mantienen sus cifras originales; la resolución del conflicto no reescribe migraciones ni seeds.

`scripts/db/recover_templates.py` documenta y genera la nueva migración desde la guía. No ejecutar para reescribirla después de aplicada; futuras correcciones necesitan una migración nueva.
