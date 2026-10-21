# Paquete de importación v2 — esquema

Un `.zip` con un CSV por tabla. UTF-8 con BOM, separador coma, comillas dobles, saltos de línea dentro de campos entre comillas (los textos tienen párrafos). Vacío = null.

El paquete real (`UA_IMPORT_ITINERARIOS_BLOQUES_v2_csv.zip`) tiene costos: **no va al repo**. Andrea lo sube en la pantalla de importación. En el repo solo va el fixture sintético `src/test/fixtures/import-v2-sintetico/`.

## 00_tarifario_servicios.csv — servicios del tarifario (1 fila = 1 tarifa)
| Columna | Tipo | Nota |
|---|---|---|
| TariffCode | text, único | clave natural del servicio (SKU de tarifa). Upsert por esta columna |
| Year | int | 2026 o 2027 |
| Supplier | text | nombre del proveedor; crear proveedor si no existe (match exacto, sin mayúsculas/minúsculas) |
| ServiceType | text | hotel, hotel_extra, transfer, transport, tour, meal, guide, ticket, package, experience, camping, flight, service |
| Type | text | categoría libre (COMFORT, HOSTALES…) |
| ETIQUETA | text | nombre del servicio |
| Location, Pais | text | Pais ∈ BOLIVIA, CHILE |
| Currency | text | USD, CLP, BOB. El precio se guarda en su moneda; la conversión la hace la app |
| Valor RACK | numeric | |
| Price NETO | numeric | **costo** que usa la app |
| PRECIO_USD | numeric | solo referencia (885 CLP / 6,91 BOB). No usar para calcular |
| UnitType | text | PER_PERSON, PER_GROUP, PER_VEHICLE, PER_ROOM_PER_NIGHT, PER_PERSON_PER_NIGHT, PER_ROOM_PER_USE |
| VehicleMaxPax | int | plazas; obligatorio si UnitType = PER_VEHICLE → `services.capacity` |
| RoomType | text | SGL, DBL, MAT, TWN, TPL, QUAD, DORM, SUITE, FAM, PAX (por persona), EXTRA |
| Occupancy | int | personas por habitación → `services.occupancy` |
| RoomDetail | text | detalle original (vista, temporada) |
| IncludesMeals | text | NONE, BB, HB, FB, LUNCH |
| DaysCount | numeric | 0,5 = medio día |
| PaxMin, PaxMax | int | tramo de pax de la tarifa |
| Season | text | ALL, DRY, RAIN, LOW, MID, HIGH, HOLIDAYS |
| ValidFrom, ValidTo | date | |
| Notes, LINK TARIFARIO | text | |

## 01_itinerarios.csv — plantillas
sku (único) · nombre · origen · destino · dias · noches · categoria · idioma (ES/EN/IT) · temporada · hoteles_codigo · bloque_incluye / bloque_no_incluye (→ 08.id) · presupuesto_pestana · linea_guia · estado (borrador / sin_textos) · servicios (si/no).

## 02_itinerario_dias.csv — días de cada plantilla (clave sku + dia)
bloque_texto_id (→ 05, puede ser vacío) · bloque_servicios_id (→ 06, vacío = día sin servicios cargados) · titulo · alojamiento (texto para el cliente) · comidas · comidas_origen (guía / presupuesto) · nota_dia.

## 03_itinerario_tramos.csv — servicios que cubren varios días
sku · slot · TariffCode · unidad · dia_desde · dia_hasta · se_cobra (siempre "una vez").
**No pertenecen a ningún bloque de día.** Al crear la cotización: un `quote_item` en `dia_desde` con `billing = 'per_service'` y `span_days = dia_hasta − dia_desde + 1`; los días siguientes lo muestran "incluido en Día N" sin costo. Cantidad por vehículo: `ceil((pax + tc + staff) / capacity)`.

## 04_itinerario_alojamiento.csv — lo que depende del hotel de cada noche (clave sku + noche + slot)
- `slot = ALOJAMIENTO`: hotel de la noche (proveedor). TariffCode vacío: las alternativas son **todos los tipos de habitación de ese proveedor** del año de la cotización; la cantidad sale de `quote_rooming`.
- `slot = CENA`: cena del hotel, por pasajero (`tc_policy` free).
- `slot = STAFF`: cama o cena del conductor, 1 por vehículo, `tc_policy = excluded`.
Van en el día de la plantilla (noche N = día N), no en el bloque reutilizable.

## 05_bloques_texto.csv — textos de día reutilizables
bloque_texto_id (BD-xxx día de tour, BA-xxx actividad suelta) · tipo · idioma · titulo · texto · notas · veces_usado · usado_en (informativo).

## 06_bloques_servicios.csv — servicios del día (clave bloque_servicios_id + slot)
bloque_servicios_id = `<bloque_texto_id>/<letra>`: variantes del mismo texto con distinto set de servicios. Slots: ALMUERZO, COCTEL, ENTRADAS, TRASLADO_FRONTERA, GUIA. `tc_policy` free.
TRASLADO_FRONTERA trae la tarifa de 2-4 pax; la app elige el tramo por pax (2-4 / 5-9 / 10-16) entre las tarifas del mismo proveedor y ruta (`proposeTransport`).

## 07_reglas_tramo.csv — tramo que se propone al crear desde bloques
ruta (SPASPA, UYUUYU, SPAUYU, UYUSPA, UYUUYU-UTURUNKU) + dias → TariffCode, dia_desde, dia_hasta.

## 08_bloques_pdf.csv — textos fijos del PDF y del email
id · titulo · tipo (itinerario, pago, info, migracion, tyc, incluye) · idioma · orden · obligatorio (sí/no) · texto (markdown simple: `**negrita**`, listas `- `, enlaces `[texto](url)`).

## 09_control_costos.csv — control (solo paquete real y fixture)
sku · pax · costo_hoja · costo_referencia · diferencia · habitaciones_hoja. Para la tabla de control después de importar; no se guarda en el catálogo.
