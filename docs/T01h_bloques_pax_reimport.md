# T01h · T01i · T01j — Bloques con opciones, reimportación y recálculo

Especificación de Andrea, 16-10-2026; separación de T01k confirmada el 17-10-2026. Estas tareas van después de T01g/T01k y antes de T02. T01d sigue siendo «Editor de textos del PDF». T01j absorbe T06; T01i reemplaza la parte de plantillas del importador de T04, que queda para fixtures de presupuestos. T13 se adelanta antes de T11/T12.

## Por qué

Las líneas importadas como «Por grupo» usan el valor de la hoja de 1 pax, por lo que cambiar pax no cambia el total. El hotel como variante (`hotel_service_id`) duplica bloques. Servicios de varios días con precio solo en el primero se importaron por día. Falta distinguir TC gratuito de TC excluido, y recalcular cantidades y tramos.

## D7: la app propone, el vendedor elige

Las habitaciones salen de la distribución elegida (por ejemplo, 2 DBL + 1 TPL + 1 SGL), nunca automáticamente de pax ÷ 2. El vendedor elige proveedor y vehículos; la app propone capacidad suficiente y nunca sustituye una elección manual. Los bloques tienen puestos con alternativas: «Transporte día 1» puede ofrecer 4x4 Leo (5 plazas), Sprinter Diego (12), Bus X (20); «Alojamiento», los tipos de habitación del hotel.

## T01h · Modelo de bloque v2

Migración fechada:

- `services`: `capacity int null` (obligatoria por vehículo); `room_type`, `occupancy int` (SGL 1, DBL/TWN/MAT 2, TPL 3).
- `day_block_items` y espejo snapshot en `quote_items`: `slot_key text not null` agrupa alternativas; `is_default bool`; `billing` en `per_day | per_service` (default per_day); `span_days int default 1`. Multi-día se cobra en el primer día; los siguientes muestran «incluido en Día N» sin costo.
- `tc_policy` en `charged | free | excluded`, default free: charged cuenta y cobra TC; free cobra solo pagantes pero pide pax + TC al proveedor; excluded no participa. Separar `qty_cost` y `qty_supplier`; Operación usa qty_supplier.
- `margin_mode` en `inherit | custom | none`, default inherit; `margin_pct numeric null` admite negativos (descuento). Sustituye Sí/No.
- `quote_items`: `selected bool`, `selection_source` auto/manual (default auto), `qty_override numeric null`.
- `quote_rooming(quote_id, night int null, room_type, count, for_tc bool default false)`, RLS como quote_items. Night null aplica todas las noches; una fila con night sobrescribe esa noche.
- `day_blocks.hotel_service_id` obsoleto: convertir a puesto ALOJAMIENTO con tipos de habitación del mismo hotel/proveedor/lugar/régimen y dejar null. `pax_min/pax_max` opcionales solo sugieren; no filtran ni eligen líneas.
- Lugares: RPC `create_location(code, name, country)`, código único de 3 letras mayúsculas (adaptar al nombre real del catálogo).

Lógica en `src/lib/quotes/selection.ts`:

- `proposeTransport(slot, paxTotal, { supplierId? })`: filtra proveedor si se indica, propone combinación de menor costo que cubre pax (admite mezcla Sprinter + 4x4), devuelve las demás opciones con costo.
- `selectAlternatives(quoteId, dayId, slotKey, [{serviceId, qty}])`: RPC atómica, selection_source manual. Admite servicio del tarifario fuera del bloque, del mismo tipo.
- `proposeRooming(pax, tc)`: DBL hasta donde alcance, SGL si impar, SGL por TC. Solo propuesta.
- `setRooming(quoteId, rows)`: RPC atómica; alojamiento toma cantidades desde rooming.
- Avisos bloquean revisada, no edición: «Faltan n plazas en el transporte del día N» (pax + TC + staff); «La distribución suma n personas, la cotización tiene m»; hotel sin tipo elegido muestra disponibles.

Borrado, aprobación y selección masiva se resuelven antes en [T01k](T01k_catalogo.md).
T01h reutiliza sus RPC, API y acciones de pantalla; no los vuelve a implementar.

Módulos de actividad: ocultar menú y pestaña mediante flag en pricing_settings (D9). Traducción: diagnosticar nombre de Edge Function frente a supabase/functions/, secretos y despliegue; error en español con causa. Incluir despliegue en prompt Lovable.

Tests: 7 pax con Leo 4x4 de 5 → 2 vehículos; Sprinter más barata disponible → Sprinter. Elección manual de un 4x4 Leo, luego 9 pax → conserva y avisa faltan 4 plazas. Rooming 2 DBL + 1 TPL para 7 cobra esas habitaciones; suma 6 avisa. Per_service 3 días cobra una vez; comida free 6 + 1 TC → costo 6 / proveedor 7; margen custom −10 % reduce línea. Conservar en verde la suite de catálogo de T01k al migrar el modelo.

Lovable:

- Bloque / Datos: quitar «Hotel (define la variante)»; Desde/Hasta «+ Nuevo lugar» usa create_location.
- Bloque / Servicios: puestos, alternativas con estrella predeterminada y «+ Alternativa». Columnas Servicio (Proveedor · Tipo de servicio · Tipo debajo), Cant., Unidad, Plazas/Ocupación, Precio USD, Incluido. Más opciones: Opcional, TC, Margen, Cubre n días.
- Pasajeros: tabla Distribución de habitaciones SGL/DBL/TWN/MAT/TPL + TC, botón Proponer, suma vs pax verde/rojo.
- Transporte por día: proveedor/vehículos, cantidades y costos, badge auto/elegido, Proponer cuando falten plazas.

## T01i · Reimportación de bloques e itinerarios — ALTO

Fuente: Google Sheet «UA_TARIFARIO y PRESUPUESTOS_STANDARD_3.0» (pestaña por SKU) y tarifario maestro (Supplier, ServiceType, Type, PRECIO_USD, UnitType). Corre dentro de la app: los costos no van al repo público. Codex entrega parser/pantalla; Andrea sube .xlsx en Revisión de importación.

Parser puro `src/lib/import/budget-tabs.ts`, fixture sintético:

- Pestaña → plantilla; N. PAX de cabecera. DÍA n → bloque por día. Columnas TIPO, INCLUSIVE, SERVICIO, PROVEEDOR, USD, BOB.
- Coincidencia servicio por nombre + proveedor en tarifario; unidad, capacidad y habitación salen del tarifario, nunca de hoja. Sin coincidencia → revisar con propuesta pendiente.
- TIPO → slot_key: TRANSPORTE, ALIMENTACIÓN según comida, ALOJAMIENTO, TICKET… Alojamiento incorpora todos los tipos del hotel como alternativas desde tarifario.
- Mismo servicio/proveedor consecutivo, precio solo primero → per_service/span_days. NOT INCLUDED → no incluido.
- Firma ruta + puestos/servicios normalizados + texto ES: idénticas firmas reutilizan un bloque.
- D8: exportar traducciones antes de borrar por (SKU tour, día) y reasignar; sin encaje → Texto sin revisar.
- Staging `import_batches`, `import_rows`, solo Admin: pestaña/día/puesto/servicio/proveedor/unidad/precio/estado ok-revisar-nuevo. Confirmación `commit_import_batch(batch_id)` atómica.
- Reutilizar `purge_imported_catalog(confirm text)` de T01u, sin reimplementarlo: exige BORRAR, conserva tarifario, cotizaciones y bloques manuales. Respaldo previo `docs/consultas/respaldo_catalogo.sql`. Toda fila importada nueva debe escribir `catalog_origin='importacion'`.
- Control: calcular cada plantilla con N. PAX, rooming y vehículos de su hoja; comparar COSTO (ejemplo UYUUYU-3D2N-KS = 901). Tabla SKU, costo hoja, costo app, diferencia, líneas explicativas.

**ALTO:** entregar parser + pantalla + control con fixture. Andrea sube archivo real, revisa y responde **OK antes del commit de importación**. Aceptación: 100 % pestañas, diferencia ±1 USD o explicada, cero líneas Por grupo si tarifario indica por persona.

## T01j · Recálculo al cambiar pax o TC (absorbe T06)

Migración `services.qty_rule jsonb null`: `{"type":"step_pct","pct":20,"tiers":[10,14,16]}`; vehículos usan capacity. Motor puro `src/lib/pricing/qty-rules.ts`: persona → pagantes y TC según política; habitación → rooming; vehículo → selección; grupo → 1.

RPC atómica `reapply_pax(quote_id, pax_paying, tc_count)`, solo borrador, invocada al cambiar Pax/TC mediante useQuoteActions: recalcula persona y tarifa por tramo; selection_source auto vuelve a proponer transporte y rooming si nunca editado; manual conserva y avisa insuficiencia. qty_override se conserva con aviso si no cuadra.

Tests: 2 → 3 pax rooming auto propone DBL + SGL; manual avisa. 5 → 6 transporte auto propone otra opción; manual avisa falta 1 plaza. Guía 240 → 288 (>10) → 345,60 (>14) → 414,72 (>16).

Lovable: recálculo inmediato, avisos ámbar junto al puesto + Proponer; badges auto/elegido/manual y «pide n al proveedor» si qty_supplier ≠ qty_cost.

## Decisiones confirmadas

| ID | Decisión | Respuesta |
|---|---|---|
| D6 | Vendedor edita T&C | Sí, bloque obligatorio; no puede ocultarlo |
| D7 | Pax como discriminante | Vendedor elige rooming y vehículo/proveedor; app propone |
| D8 | Textos actuales | Reasignar (default) |
| D9 | Módulos de actividad | Ocultos (default) |
