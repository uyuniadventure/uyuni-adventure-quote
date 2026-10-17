# T01h · T01i · T01j — Bloques con opciones, reimportación y recálculo

Especificación de Andrea, 16-10-2026; separación de T01k confirmada el 17-10-2026. Estas tareas van después de T01g/T01k y antes de T02. T01d sigue siendo «Editor de textos del PDF». T01j absorbe T06; T01i reemplaza la parte de plantillas del importador de T04, que queda para fixtures de presupuestos. T13 se adelanta antes de T11/T12.

**Corrección del 17-10-2026:** aplicar el modelo de hotel descrito aquí en **T01h-1**
y su UI en el prompt de **T01h-2**. Este documento define trabajo pendiente;
registrar la corrección no ejecuta su migración ni implementa todavía las pantallas.

## Por qué

Las líneas importadas como «Por grupo» usan el valor de la hoja de 1 pax, por lo que cambiar pax no cambia el total. Usar un servicio de habitación (`hotel_service_id`) como identidad duplica bloques del mismo hotel. **El hotel sí define el bloque; el tipo de habitación es una alternativa del mismo bloque.** Servicios de varios días con precio solo en el primero se importaron por día. Falta distinguir TC gratuito de TC excluido, y recalcular cantidades y tramos.

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
- Conservar el hotel: reemplazar `day_blocks.hotel_service_id` por `hotel_id uuid null references public.suppliers(id)`, siguiendo el backfill y la validación de T01h-1 detallados abajo. Las habitaciones quedan como alternativas del puesto `ALOJAMIENTO`. `pax_min/pax_max` opcionales solo sugieren; no filtran ni eligen líneas.
- Lugares: RPC `create_location(code, name, country)`, código único de 3 letras mayúsculas (adaptar al nombre real del catálogo).

### T01h-1 · Hotel del bloque: diagnóstico, migración y regla

Diagnóstico sobre `main` en `f48f2a7`, con `rg` (equivalente a grep):

```text
rg -n 'create table public.(suppliers|hotel_codes|services)|supplier_id|room_type|meal_plan|hotel_service_id' supabase/migrations/20261004000100_foundation_schema.sql
rg -n 'hotel_codes' supabase/migrations scripts/db/generate_seed.py
rg -n 'hotel_service_id|services\(id, name\)|Sin hotel' src/routes/_authenticated/bloques-diarios.tsx src/components/catalog/block-editor.tsx
```

- `suppliers` existe desde foundation_schema, línea 48: contiene `id`, `name` y
  metadatos del proveedor. `services.supplier_id` (línea 79) apunta a esa tabla;
  sus campos `location`, `room_type`, `meal_plan` permiten agrupar habitaciones.
- `hotel_codes` (líneas 67–72) tiene `code`, `name` y `supplier_id` nullable hacia
  `suppliers`. El código es único; `supplier_id` no tiene restricción UNIQUE.
  `generate_seed.py:185` carga códigos sin asignar proveedor. No asumir que el
  enlace está completo ni que hay exactamente un código por hotel.
- La lista/filtro actuales leen `services(id,name)` y filtran `hotel_service_id`;
  el editor también selecciona un servicio de alojamiento. T01h-2 debe pasar a
  proveedores; el nombre de la habitación no es el nombre del hotel.

Contrato obligatorio de la migración nueva de T01h-1:

1. Añadir `day_blocks.hotel_id`, FK a `suppliers.id`. Para cada bloque con
   `hotel_service_id`, leer el servicio actual y asignar **su `supplier_id`**.
   No usar `hotel_codes.id` ni deducir el hotel del nombre o del tipo de habitación.
2. Tras crear los puestos, trasladar el servicio actual a `ALOJAMIENTO` como
   alternativa predeterminada. Si ya está en los ítems del bloque, reutilizar
   el enlace y sus valores en lugar de duplicarlo. Añadir las demás habitaciones
   de alojamiento con el mismo `supplier_id`, `location` y `meal_plan` que el
   servicio original; comparar los campos opcionales de forma explícita, sin
   tratar un null como comodín. Las tarifas siguen perteneciendo a sus servicios.
3. Solo después de conservar hotel y alternativa predeterminada, dejar
   `hotel_service_id = null`. Actualizar los lectores/escritores del modelo v2
   y mantener compatibles los snapshots históricos, sin reescribir cotizaciones.
   Un proveedor ausente no debe convertirse silenciosamente en «Sin hotel»:
   diagnosticar el bloque/servicio y rechazar la migración en español hasta resolver
   ese dato, conservando la referencia original. Los bloques que ya carecen de
   hotel y alojamiento mantienen `hotel_id = null`.
4. Comprobar en servidor que **todas** las alternativas de `ALOJAMIENTO` son del
   `hotel_id` del bloque. Una habitación de otro hotel falla, por ejemplo:
   «La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel,
   usa otro bloque». Un bloque sin hotel no acepta habitaciones hasta asignarlo.
   Cubrir inserciones/actualizaciones de alternativas, cambios de `slot_key`,
   `hotel_id` y del proveedor del servicio; no dejar un bypass por escritura directa.
   Cambiar de hotel en un bloque ya definido requiere otro bloque, no mezclar
   proveedores en un mismo puesto. Conservar RLS y atomicidad de los guardados.
5. Exponer el hotel y las habitaciones elegibles desde `src/lib` para el selector,
   filtro y editor; reutilizar `hotel_codes.supplier_id` para mostrar códigos.
   Si falta el enlace de un código, mostrar el nombre del proveedor sin inventarlo
   y señalar el dato pendiente; si hay varios, mostrarlos sin duplicar el hotel.

Pruebas obligatorias de la corrección (backend en T01h-1, firma compartida con T01i):

- Dos bloques con igual ruta, hotel, resto de servicios y texto ES, que solo cambian
  SGL por DBL/TWN del mismo lugar/régimen, tienen la misma firma; también si cambia
  el servicio de habitación predeterminado. No se fusionan físicamente bloques
  históricos al registrar esta regla.
- Cambiar únicamente el hotel produce una firma distinta, aunque ambos hoteles
  ofrezcan los mismos tipos de habitación y el texto ES sea igual.
- Insertar o actualizar `ALOJAMIENTO` con una habitación de otro hotel falla
  en español y no guarda parcialmente; modificar el proveedor del servicio no
  debe eludir la regla. Una habitación del hotel correcto sí se puede guardar.
- El backfill conserva el hotel y el servicio predeterminado, evita duplicados,
  limita alternativas al mismo lugar/régimen y deja `hotel_service_id` nulo.
  Cubrir proveedor ausente y bloques sin hotel, y conservar snapshots de cotizaciones.

### Resto de lógica de T01h

Lógica en `src/lib/quotes/selection.ts`:

- `proposeTransport(slot, paxTotal, { supplierId? })`: filtra proveedor si se indica, propone combinación de menor costo que cubre pax (admite mezcla Sprinter + 4x4), devuelve las demás opciones con costo.
- `selectAlternatives(quoteId, dayId, slotKey, [{serviceId, qty}])`: RPC atómica, selection_source manual. Admite servicio del tarifario fuera del bloque, del mismo tipo; en `ALOJAMIENTO` debe respetar el hotel del bloque y el mismo lugar/régimen. Cambiar hotel exige elegir otro bloque, sin alterar el catálogo de origen.
- `proposeRooming(pax, tc)`: DBL hasta donde alcance, SGL si impar, SGL por TC. Solo propuesta.
- `setRooming(quoteId, rows)`: RPC atómica; alojamiento toma cantidades desde rooming.
- Avisos bloquean revisada, no edición: «Faltan n plazas en el transporte del día N» (pax + TC + staff); «La distribución suma n personas, la cotización tiene m»; hotel sin tipo elegido muestra disponibles.

Borrado, aprobación y selección masiva se resuelven antes en [T01k](T01k_catalogo.md).
T01h reutiliza sus RPC, API y acciones de pantalla; no los vuelve a implementar.

Módulos de actividad: ocultar menú y pestaña mediante flag en pricing_settings (D9). Traducción: diagnosticar nombre de Edge Function frente a supabase/functions/, secretos y despliegue; error en español con causa. Incluir despliegue en prompt Lovable.

Tests: 7 pax con Leo 4x4 de 5 → 2 vehículos; Sprinter más barata disponible → Sprinter. Elección manual de un 4x4 Leo, luego 9 pax → conserva y avisa faltan 4 plazas. Rooming 2 DBL + 1 TPL para 7 cobra esas habitaciones; suma 6 avisa. Per_service 3 días cobra una vez; comida free 6 + 1 TC → costo 6 / proveedor 7; margen custom −10 % reduce línea. Conservar en verde la suite de catálogo de T01k al migrar el modelo.

### T01h-2 · Contenido obligatorio del prompt para Lovable

- Bloque / Datos: conservar el campo y cambiarlo a **«Hotel»**, selector de hoteles por proveedor (`hotel_id`), con «Sin hotel». Para cambiar el hotel de un bloque existente se usa otro bloque. Desde/Hasta «+ Nuevo lugar» usa create_location.
- Bloque / Servicios: puestos, alternativas con estrella predeterminada y «+ Alternativa». **Alojamiento solo ofrece habitaciones del hotel del bloque**, del mismo lugar/régimen; sin hotel, indicar que debe elegirse antes de añadir habitaciones. Columnas Servicio (Proveedor · Tipo de servicio · Tipo debajo), Cant., Unidad, Plazas/Ocupación, Precio USD, Incluido. Más opciones: Opcional, TC, Margen, Cubre n días.
- `/bloques-diarios`: columna y filtro **«Hotel»** muestran el nombre del hotel/proveedor más su código existente (ej. «Tayka del Desierto · TD»), nunca el servicio de habitación. Filtrar por `hotel_id` y conservar «Sin hotel». No duplicar opciones por habitación; no inventar códigos cuando falte el enlace.
- Pasajeros: tabla Distribución de habitaciones SGL/DBL/TWN/MAT/TPL + TC, botón Proponer, suma vs pax verde/rojo.
- Transporte por día: proveedor/vehículos, cantidades y costos, badge auto/elegido, Proponer cuando falten plazas.

En el prompt final de T01h-2, indicar las funciones reales entregadas por T01h-1
y el orden de sus migraciones; no inventar nombres de API antes de implementarlas.
Prueba visual: SGL y DBL del mismo hotel aparecen bajo un único hotel en el filtro,
otro hotel aparece separado y el selector de Alojamiento no ofrece sus habitaciones.

## T01i · Reimportación de bloques e itinerarios — ALTO

Fuente: Google Sheet «UA_TARIFARIO y PRESUPUESTOS_STANDARD_3.0» (pestaña por SKU) y tarifario maestro (Supplier, ServiceType, Type, PRECIO_USD, UnitType). Corre dentro de la app: los costos no van al repo público. Codex entrega parser/pantalla; Andrea sube .xlsx en Revisión de importación.

Parser puro `src/lib/import/budget-tabs.ts`, fixture sintético:

- Pestaña → plantilla; N. PAX de cabecera. DÍA n → bloque por día. Columnas TIPO, INCLUSIVE, SERVICIO, PROVEEDOR, USD, BOB.
- Coincidencia servicio por nombre + proveedor en tarifario; unidad, capacidad y habitación salen del tarifario, nunca de hoja. Sin coincidencia → revisar con propuesta pendiente.
- TIPO → slot_key: TRANSPORTE, ALIMENTACIÓN según comida, ALOJAMIENTO, TICKET… Alojamiento incorpora los tipos de habitación del `hotel_id` del bloque y del mismo lugar/régimen, usando el tarifario. Otro hotel corresponde a otro bloque.
- Mismo servicio/proveedor consecutivo, precio solo primero → per_service/span_days. NOT INCLUDED → no incluido.
- Firma **ruta + `hotel_id` + puestos/servicios normalizados + texto ES**: idénticas firmas reutilizan un bloque. El tipo de habitación no entra en la firma. Normalizar `ALOJAMIENTO` por hotel/proveedor, lugar y régimen: excluir `room_type`, ID/SKU del servicio de habitación y la elección predeterminada como discriminantes, también si aparecen dentro de `pricing_config`. Los demás servicios mantienen su identidad. Reutilizar en T01i la función pura y los tests de firma de T01h-1; cambiar solo habitación da el mismo bloque, cambiar hotel da otro.
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
