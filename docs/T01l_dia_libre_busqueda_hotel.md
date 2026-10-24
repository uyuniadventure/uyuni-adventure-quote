# T01l · Día desde cero, búsqueda de bloques y elección de alojamiento con rooming mixto

> Depende de T01h (`quote_rooming`, `room_type`/`occupancy`, `proposeRooming`, `tc_policy`). Lovable: sí.
> Absorbe de T09 el "día libre" (`null` = día sin bloque) y de T10 "Guardar como nuevo bloque". Si ya están hechos en `main`, reutilízalos y no los dupliques.
> Identificador comprobado el 24-10-2026: T01l libre. Rama: `codex/T01l-dia-libre-busqueda-hotel`.
> Andrea confirmó en esta sesión: **implementar también**, además de registrar la especificación.
> **Estado de esta entrega documental: implementación pendiente de completar y verificar.** El entorno local se desconectó durante el trabajo; este PR no incorpora las funciones ni migraciones descritas abajo. No aplicar todavía el prompt de Lovable.

## Problema (capturas del 24-10-2026, cotización XXXXXX-1D0N-ES-26-0012)

1. "Agregar día N" solo deja elegir un bloque existente. No se puede crear un día en blanco.
2. El buscador de bloques solo busca por nombre/código (BA-001…). No encuentra por ciudad, proveedor ni tipo de servicio.
3. "Cambiar hotel del día": un solo buscador de hotel y "marca los tipos de habitación" (casillas). No se puede filtrar por ciudad ni indicar **cuántas** habitaciones de cada tipo. Casos reales:
   - 5 pax → 1 TPL + 1 DBL (o 2 DBL + 1 SGL si el hotel no tiene TPL);
   - 13 pax → 6 DBL + 1 SGL;
   - el mismo grupo puede cambiar de combinación según la noche (hotel sin TPL).

Codex: antes de empezar, buscar "Ítem nuevo", "Cambiar hotel", `replaceDayHotel`, `quote_rooming`, `proposeRooming`, `saveDayAsNewBlock`, `addBlockDay` y documentar en el PR qué ya existe.

## 1. Día desde cero

**Lógica (`src/lib/quotes/days.ts`)**

- RPC atómica `add_blank_day(p_quote_id, p_position, p_title, p_from_location, p_to_location, p_lang)`:
  - crea `quote_days` con `source_block_id = null`, `link_type = 'independent'`, sin servicios;
  - `snapshot` con título y descripción vacía (o la que se pase), `reviewed = true` (lo escribe una persona, regla T01b);
  - renumera días y recalcula. Solo en `borrador`.
- `addBlankDay(quoteId, { position, title, fromLocationId, toLocationId })`.
- `saveDayAsNewBlock` (T10) funciona igual para un día en blanco: crea bloque `pendiente` con textos y servicios del día. Los ítems libres del día van al bloque solo si se guardaron antes en el tarifario (punto 2); si no, aviso "n ítems libres no se copian al bloque".

**Ítem libre (`src/lib/quotes/items.ts`)**

- Si "Ítem nuevo" ya crea líneas sin `service_id`, ampliarlo; si no, crear: `addFreeItem(dayId, { label, supplierName?, serviceType, unit ('per_person'|'per_vehicle'|'per_room'|'per_group'), qty?, unitCost, currency ('USD'|'CLP'|'BOB'), included, tcPolicy, marginMode, marginPct?, note })`.
- `quote_items.service_id null` + `is_free_item bool default false` (migración si falta). La cantidad sigue las reglas de unidad de T01j igual que una línea del tarifario.
- Conversión a USD con `latestFx` y FX congelado en la línea.
- Opción "Guardar también en el tarifario" → crea `services` + `service_rates` en `pendiente` (solo roles que editan catálogo) y enlaza la línea (`service_id`, `is_free_item = false`).
- Validación (bloquea `revisada`, no la edición): ítem libre sin costo o sin unidad.
- En el catálogo (`/bloques-diarios` → "Nuevo bloque"): un ítem libre **siempre** crea el servicio `pendiente` (los bloques no guardan líneas sin servicio).

## 2. Búsqueda de bloques por ciudad, proveedor y tipo de servicio

- RPC de solo lectura `search_day_blocks(p_q text, p_location_ids uuid[], p_supplier_ids uuid[], p_service_types text[], p_status text[] default '{activo,pendiente}', p_limit int default 50)`:
  - texto libre sobre: nombre y código del bloque, nombre de ciudad desde/hasta, nombre de proveedor y de servicio de sus `day_block_items` (sin tildes, `unaccent` + `ilike` o `pg_trgm`);
  - filtros con AND entre tipos y OR dentro del mismo tipo;
  - devuelve por bloque: id, código, nombre, ciudad desde → hasta, tipos de servicio, proveedores, estado y `match_reason` (`'nombre'|'ciudad'|'proveedor'|'servicio'`).
- `searchDayBlocks(params)` en `src/lib/quotes/suggestions.ts`. Mismo resultado en el editor de días, en T09 (biblioteca) y en `/bloques-diarios`.
- `listBlockFilterOptions()` → ciudades, proveedores y tipos de servicio que tienen al menos un bloque.

## 3. Elección de alojamiento: buscador + rooming por noche

**Búsqueda de hotel**

- `searchHotels({ q, locationId?, supplierId?, mealPlan?, date, nights })` en `src/lib/quotes/hotels.ts`:
  - un "hotel" = servicios de alojamiento del mismo proveedor + location + meal_plan (mismo emparejamiento que T07);
  - devuelve hotel, ciudad, régimen y sus tipos de habitación con `occupancy` y tarifa vigente para esa fecha (o "sin tarifa", regla T01c).
- Filtros: ciudad (por defecto la ciudad "hasta" del día), nombre del hotel, proveedor, régimen.

**Habitaciones con cantidad**

- Reemplazar las casillas por cantidades por tipo: `[{ serviceId, roomType, count, forTc }]`.
- `proposeRoomingOptions(pax, tc, availableTypes)` (puro, `src/lib/quotes/selection.ts`, extiende `proposeRooming` de T01h):
  - devuelve **varias** combinaciones válidas que suman exactamente pax (+ 1 SGL por TC), usando solo tipos que el hotel tiene, ordenadas por: menos habitaciones, luego menor costo;
  - nunca elige sola: el vendedor toca una opción o edita las cantidades.
- RPC atómica `set_day_hotel(p_quote_id, p_day_id, p_hotel_service_ids uuid[], p_rooms jsonb)`:
  - reemplaza el puesto `ALOJAMIENTO` del día (convierte `replaceDayHotel` de T02);
  - si la combinación es igual al rooming general de la cotización → no guarda override; si es distinta → fila de `quote_rooming` con `night = day_number` (override de esa noche);
  - `selection_source = 'manual'`, recalcula.
- Botón "Aplicar a todas las noches" → escribe el rooming general (`night = null`) y quita overrides iguales.
- Validaciones (aviso en el diálogo y bloqueo de `revisada`):
  - ocupación ≠ pax + TC → "La distribución suma n personas, la cotización tiene m";
  - tipo de habitación que el hotel no tiene → "Este hotel no tiene TPL. Opciones: …";
  - noche con override distinto del general → badge "rooming propio" en el día.

## 4. Tests

- `add_blank_day` en posición 2 renumera; el día queda revisado; fuera de `borrador` falla.
- Ítem libre 45 USD por persona, 4 pax → 180; en CLP convierte con el FX congelado; sin costo → aviso; "guardar en tarifario" crea servicio `pendiente` y enlaza.
- Guardar día en blanco con 1 ítem libre no guardado → bloque creado + aviso.
- `searchDayBlocks`: "uyuni" encuentra bloques con destino Uyuni; filtro proveedor Leo devuelve solo bloques con servicios de Leo; "Leo" + tipo TRANSPORTE = intersección; "atacama" sin tilde encuentra "Atacama".
- `searchHotels` por ciudad devuelve hoteles con sus tipos y tarifa de la fecha.
- `proposeRoomingOptions`: 5 pax con SGL/DBL/TPL → incluye `1 TPL + 1 DBL` y `2 DBL + 1 SGL`; 5 pax sin TPL → solo `2 DBL + 1 SGL`; 13 pax sin TPL → primera opción `6 DBL + 1 SGL`; 13 pax con TPL → incluye `3 TPL + 2 DBL`; 2 pax + 1 TC → `1 DBL` + `1 SGL (TC)`.
- `set_day_hotel` con 1 TPL + 1 DBL para 5 pax → costo noche = tarifa TPL + tarifa DBL; suma 4 → aviso; combinación distinta del general → override solo en esa noche; "aplicar a todas" → sin overrides.

## PROMPT PARA LOVABLE (plantilla; Codex completa nombres reales)

**Pendiente de implementación y verificación.** Sustituir los marcadores por el PR de código y las migraciones verificadas antes de usar este prompt. El PR documental no habilita estas funciones.

```text
[Lovable] Después del merge del PR <n de implementación> (codex/T01l-dia-libre-busqueda-hotel).

PASO 1 · Base de datos
Aplica en Lovable Cloud, en orden: <migraciones verificadas>. Confirma cada una. Regenera los tipos.

PASO 2 · Pantallas
A) src/components/quote/quote-workspace.tsx · "Agregar día N":
- Primera opción del combo: "+ Crear día desde cero" → diálogo (título, desde, hasta) → addBlankDay.
- Buscador de bloques: campo de texto + 3 filtros (Ciudad, Proveedor, Tipo de servicio) con listBlockFilterOptions → searchDayBlocks.
  Cada resultado: nombre, código, "Ciudad A → Ciudad B", chips de tipos de servicio, proveedores en gris y chip de por qué coincidió.
- "Ítem nuevo": formulario (descripción, proveedor opcional, tipo, unidad, cantidad, costo, moneda, incluido, TC, margen, nota)
  + casilla "Guardar también en el tarifario" → addFreeItem. Badge "libre" en la línea.
- En el menú del día: "Guardar como bloque" → saveDayAsNewBlock.

B) Diálogo "Cambiar hotel del día":
- Arriba: filtros Ciudad (predeterminada la del día), Nombre, Proveedor, Régimen → searchHotels. Lista de hoteles con ciudad y régimen.
- Al elegir hotel: tabla de tipos de habitación (Tipo · Ocupación · Tarifa/noche · Cantidad con − / +), fila aparte para TC.
- Debajo: "Opciones sugeridas" (proposeRoomingOptions) como chips clicables, ej. "1 TPL + 1 DBL · 2 hab · 230 USD".
- Barra de suma: "5 de 5 personas" en verde o en rojo si no cuadra.
- Botones: "Usar en esta noche" → set_day_hotel; "Aplicar a todas las noches".
- En la tarjeta del día: hotel + "1 TPL · 1 DBL" y badge "rooming propio" si es override.

C) src/routes/_authenticated/bloques-diarios.tsx: mismo buscador y filtros;
botón "Nuevo bloque" con ítem libre (crea servicio pendiente).
Reutiliza src/components/catalog/block-editor.tsx.

Toda escritura de cotización pasa por useQuoteActions.
No calcules nada en la UI. Colores solo por tokens de src/styles.css.

PASO 3 · Cómo lo pruebo
1. Cotización 5 pax → "Crear día desde cero" → agrega un ítem libre de 45 USD por persona: costo del día 225.
2. Buscador: filtra Ciudad = Uyuni y Proveedor = Leo: solo bloques con servicios de Leo en Uyuni.
3. Cambiar hotel → filtra Uyuni → elige un hotel con TPL → toca "1 TPL + 1 DBL": suma 5/5 en verde, total cambia.
4. Cambia pax a 13 y elige un hotel sin TPL → la primera opción sugerida es "6 DBL + 1 SGL".
```

## Decisión para Andrea (D10)

¿Un vendedor puede guardar un ítem libre en el tarifario (queda `pendiente`) o solo admin/operación?
Default: **sí puede, queda pendiente de aprobación**. Se usa este default sin solicitar otra autorización.

## Inventario previo y continuidad · 24-10-2026

Base remota verificada: `main` en `5bde7dd4b3145ea83f5add3cef79c4f109ecfd04`,
merge de PR #38. Contiene T01h y el importador T01k (PR #39, integrado primero
en la rama de T01h). La comparación de GitHub entre `660f81287e5277756ea0a7004ca72a80312e8423`
y ese main devuelve cero archivos diferentes. La copia local se leyó sobre ese contenido.
Esto acredita integración de código, no aplicación de las migraciones en Cloud.

Búsqueda ejecutada (rg no estaba instalado; se usó git grep):

```sh
git grep -n -E 'Ítem nuevo|Cambiar hotel|replaceDayHotel|quote_rooming|proposeRooming|saveDayAsNewBlock|addBlockDay' -- src supabase docs
```

| Elemento | Ya existe | Trabajo de T01l |
|---|---|---|
| Ítem nuevo | `NewItemDialog` en `src/components/quote/quote-workspace.tsx`; llama a `addQuoteItem` sin `service_id`. | Ampliar el flujo; crear la API `items.ts`, badge, política pendiente, costo/unidad incompletos y FX por línea. |
| Cambiar hotel | Diálogo y casillas en `quote-workspace.tsx`. | Búsqueda por ciudad/proveedor/régimen y cantidades con propuestas. |
| `replaceDayHotel` | `src/components/quote/quote-ops.ts`; borra y añade líneas en varias llamadas. | Convertir en transacción atómica con cálculo; actualizar sus consumidores. |
| `quote_rooming` | T01h: `20261018000100_block_options_v2.sql`, con RLS y night nullable. | Reutilizar tabla y preservar overrides de otras noches. |
| `proposeRooming` | `src/lib/quotes/selection-model.ts`, reexportada en `selection.ts`; DBL/SGL y TC. | Extender con varias opciones según tipos disponibles. |
| `saveDayAsNewBlock` | `src/lib/quotes/days.ts` y operación `save_block` en `edit_quote_days`. | Reutilizar; excluir líneas sin servicio, devolver aviso y usar el hotel efectivo. |
| `addBlockDay` | `src/lib/quotes/days.ts`; también `addBlockDays`. Hay un adaptador antiguo en `quote-ops.ts`. | Conservar inserción de bloques; añadir el día independiente sin inventar un bloque de catálogo. |
| Hoteles de catálogo | `src/lib/catalog/hotels.ts`: `listHotels`, `eligibleHotelRooms`. | Reutilizar identidad proveedor + location + meal_plan. |
| Tarifas y cálculo | `selectRate`, `calculateQuote`, `calculateSavedQuote`, `save_quote_calculation`. | Reutilizar fechas, errores de tarifa, TC, margen y guardado del resultado. |
| Ubicaciones | `location_codes.id` es UUID; rutas guardan `location_codes.code`. | Resolver los IDs de la API a códigos al guardar. |
| FX | `latestFx` en `quote-ops.ts`; el motor usa el snapshot de la cotización. | Extraer/reutilizar la lectura, excluir tasas futuras y congelar el FX de la línea. |

T01j sigue pendiente: T01l debe compartir las reglas de unidad del motor sin
dar por implementada la repropuesta general de pax/TC. T02 conserva el resto de
su limpieza; T09 y T10 conservan sus alcances no absorbidos.

Al reanudar: inspeccionar `git status` en la rama local antes de editar.
Se alcanzó a confirmar la escritura local de una migración de búsqueda,
un helper puro de propuestas y cambios en `selection.ts` y el cargador PGlite.
La escritura de la segunda migración estaba en curso al desconectarse el entorno;
su resultado no se pudo verificar. Esos cambios no están en este PR y no tienen
validación de TypeScript, base de datos ni pruebas. No se aplicó SQL remoto.
