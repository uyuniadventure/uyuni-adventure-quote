# T01h · Puestos, alternativas y hotel

IMPORT solicitó ejecutar T01h y detenerse si faltaba en main. `origin/main`
en `e3fe1f5` no contiene el modelo. Esta entrega prepara esa dependencia;
el importador T01k queda pendiente. El T01k de catálogo ya integrado conserva
su registro histórico y no se confunde con el nuevo importador.

## Base y reutilización

Se buscaron equivalentes con `rg` en `src/` y `supabase/migrations/` antes
de crear tablas. Se reutilizan `suppliers` como identidad del hotel,
`hotel_codes.supplier_id` como códigos opcionales, `services.room_type`,
las filas de `day_block_items` y `quote_items`, sus snapshots y los guardados
atómicos existentes. No existía `quote_rooming` y se crea con RLS por propietario
de cotización, igual que los ítems. No se crea otra tabla de hoteles.

Para T01k: los textos de T13 ya viven en `doc_blocks` y
`doc_block_translations`; no crear un catálogo PDF paralelo. La búsqueda no
encontró una tabla de ítems de día de plantilla. Volver a comprobar al iniciar
el importador por si main cambió.

## Migraciones y datos existentes

Aplicar solo las copias Supabase, después de las anteriores:

1. `20261018000100_block_options_v2.sql`.
2. `20261018000200_quote_selection.sql`.

Espejos Drizzle `0024` y `0025`: contienen el mismo SQL; no aplicar ambas copias.
No se ejecutan seeds ni migraciones contra Cloud desde Codex.

El backfill toma el proveedor de `hotel_service_id`, reutiliza el enlace de la
habitación actual con sus cantidades/configuración, agrega habitaciones del mismo
proveedor/lugar/régimen y después limpia la referencia anterior. Si falta proveedor,
revierte con el bloque y SKU en el diagnóstico; no inventa un hotel ni pierde la
referencia. Un bloque sin hotel y con alojamiento también requiere corregir su
referencia antes de migrar. Un bloque sin alojamiento conserva «Sin hotel».

Los triggers verifican inserciones/ediciones de enlaces, cambios de puesto,
hotel, proveedor, tipo, lugar y régimen del servicio. Una habitación ajena falla
en español. No se fusionan bloques históricos ni se actualizan sus cotizaciones.
La firma pura excluye ID/SKU/tipo de habitación y la elección predeterminada;
conserva hotel, lugar/régimen, servicios ajenos a alojamiento, ruta y texto ES.

La carga local de seeds archivados utiliza `execArchivedSeed`: carga el fixture
anterior y reproduce el **mismo SQL de backfill**, habilitando todos los controles
antes de probar acciones de negocio. Los archivos de costos históricos no cambian.
Esta utilidad solo existe en `scripts/db/` para pruebas locales.

## API y cálculo

- `src/lib/quotes/selection-model.ts`: `proposeRooming`, `proposeTransport`,
  `roomingForNight`, `roomingWarnings`, `transportWarning`, `blockSignature`.
  Transporte recibe alternativas con costo ya convertido a USD y capacidad;
  encuentra la combinación de menor costo que cubre la demanda, incluso mixta.
- `src/lib/quotes/selection.ts`: `selectAlternatives`, `setRooming`. Preparan
  sin escribir, calculan con el motor existente y confirman mediante
  `edit_quote_selection`, bajo revisión y bloqueo de la cotización. Un cambio
  de catálogo o revisión exige repetir; cualquier fallo revierte todo.
- `src/lib/quotes/room-defaults.ts`: elige las habitaciones necesarias al copiar,
  respetando hotel, distribución y vigencia; conserva las demás como alternativas.
- `src/lib/catalog/hotels.ts`: `listHotels`, `eligibleHotelRooms`, `createLocation`.
  Los códigos ausentes se indican como pendientes; varios códigos no duplican hotel.
- `src/lib/catalog/features.ts`: `getCatalogFeatures` lee
  `pricing_settings.activity_modules_enabled`, inicialmente falso. Oculta menú
  y pestaña; conserva los módulos existentes en snapshots y cálculos.
- `calculateQuote` conserva elecciones manuales, usa rooming por noche,
  devuelve `qty_cost` y `qty_supplier`, respeta `charged/free/excluded`, margen
  `inherit/custom/none`, cantidades sobrescritas y compras `per_service`.
  Las insuficiencias de capacidad/distribución permiten guardar borrador y
  bloquean revisión/PDF. Los errores de habitación no producen totales parciales.
  Operación recibe las cantidades a reservar; las versiones conservan rooming.

T01j hará la nueva propuesta automática al cambiar pax/TC. T01h no sustituye
una selección manual por ejecutar el motor. La selección de una compra multi-día
debe mantener su tramo completo: la RPC rechaza cambios parciales de alternativas.
Los tramos independientes de plantilla se implementan en T01k, no dentro de días.

## Traducción

La UI llama `translate-block` y existe `supabase/functions/translate-block/index.ts`:
los nombres coinciden. La función usa `LLM_API_KEY` y `LLM_MODEL` únicamente en
servidor. No se ha comprobado su despliegue ni los secretos de Cloud. La UI
identifica un 404 como falta de despliegue y conserva el diagnóstico devuelto
en los demás errores, con mensaje en español y referencia a los registros.

## PROMPT PARA LOVABLE

Después del merge de `codex/t01h-bloques-v2`, aplica este alcance T01h.

PASO 1 · Base de datos

Aplica las migraciones pendientes anteriores y luego, en este orden,
`20261018000100_block_options_v2.sql` y `20261018000200_quote_selection.sql`.
Confirma cada una y regenera tipos. Si el backfill diagnostica un proveedor u hotel
ausente, conserva el diagnóstico completo y corrige ese vínculo antes de repetir;
no retires los controles. No ejecutes las copias Drizzle ni seeds archivados.
Despliega `translate-block` con `supabase/functions/deno.json`; comprueba la
configuración de `LLM_API_KEY` y `LLM_MODEL` sin imprimir sus valores.

PASO 2 · Pantallas T01h

- En `/bloques-diarios`, Datos → Hotel selecciona proveedor con «Sin hotel».
  El hotel ya asignado requiere crear otro bloque para cambiarlo. Usa `listHotels`
  para nombre y códigos; conserva la marca de código pendiente. Lista y filtro
  usan `hotel_id`, nunca el servicio de habitación.
- Servicios: agrupa por `slot_key`; estrella `is_default` y «+ Alternativa».
  Alojamiento usa exclusivamente `eligibleHotelRooms`; sin hotel, exige elegirlo.
  Columnas: Servicio (proveedor, tipo), cantidad, unidad, capacidad/ocupación,
  precio USD e incluido. Opciones: opcional, `tc_policy`, `margin_mode`, porcentaje
  personalizado (incluidos negativos), `billing` y `span_days`.
- Pasajeros: distribución SGL/DBL/TWN/MAT/TPL y TC; botón Proponer llama
  `proposeRooming`. Permite distribución general o por noche, con suma vs pagantes
  y TC. Guarda mediante `setRooming` en `useQuoteActions`.
- Transporte: proveedor, vehículos, cantidades y costos, badges auto/elegido y
  Proponer. Pasa alternativas del puesto con costo USD a `proposeTransport`, y
  pagantes + TC + staff como demanda. Confirma con `selectAlternatives`, también
  para servicios del catálogo del mismo tipo. No cambia una elección manual al
  modificar pax; muestra el aviso de plazas y ofrece Proponer.
- Muestra `qty_supplier` como «pide n al proveedor» cuando difiere de `qty_cost`.
  Los días cubiertos por una compra única muestran «incluido en Día N».
  Conserva los bloqueos de revisión, PDF y envío. Operación usa
  `ops_items.item_snapshot.qty_supplier`, con respaldo `qty` para históricos.
- Respeta `getCatalogFeatures` para ocultar módulos y usa las API de catálogo
  T01k ya existentes para aprobar/borrar. No dupliques esas acciones.
- Toda escritura de cotización pasa por `useQuoteActions`. No calcules precios
  en la UI. Colores solo por tokens de `src/styles.css`.

PASO 3 · Cómo lo pruebo

1. Un hotel con SGL y DBL aparece una sola vez; otro hotel queda separado.
   Alojamiento no ofrece habitaciones ajenas. Guardar otra habitación del mismo
   hotel funciona; intentar mezclar hoteles falla en español sin cambios parciales.
2. Proponer transporte para 7 personas con vehículos de 5 plazas devuelve 2;
   una Sprinter más económica se propone si está disponible. Elegir manualmente
   un 4x4 y subir a 9 conserva uno y avisa que faltan 4 plazas.
3. Guardar 2 DBL + 1 TPL para 7 cobra esas habitaciones; una distribución para 6
   deja guardar borrador con aviso y bloquea revisión. Comida free con 6 + 1 TC
   cobra 6 y reserva 7. Margen custom −10 % reduce la venta.
4. Una compra per_service de 3 días se cobra una vez; las copias de los otros
   días aparecen incluidas. Una nueva versión conserva la distribución y elecciones.

ALTO: detenerse aquí. El prompt de `/admin/importar`, parser, validación,
staging, commit atómico y `costTemplate` se entregarán con T01k después de
integrar T01h. Andrea subirá el paquete real y responderá «OK» antes de su commit
de importación. En esta entrega solo se copia el fixture sintético al repositorio.
