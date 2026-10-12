# SPEC — Cotizador por bloques · Uyuni Adventure

> Documento maestro del proyecto. Guardarlo en la raíz del repo como `SPEC.md` y referenciarlo desde `AGENTS.md` (Codex) y desde el Knowledge del proyecto en Lovable. Toda tarea de desarrollo debe respetar este documento.

---

## 1. Objetivo

Web app interna, en línea y multiusuario, para que el equipo de Uyuni Adventure cree cotizaciones de tours multi-día (Bolivia, Chile, Perú, Argentina, Ecuador) en el menor tiempo posible a partir de los datos básicos del cliente.

La app:
1. Mantiene un **tarifario maestro** de servicios con SKU, multi-divisa y por temporada.
2. Arma itinerarios con **bloques diarios** reutilizables, con descripción en el idioma del cliente.
3. Mantiene una **biblioteca de plantillas** de itinerarios buscable por SKU y por parámetros.
4. Genera **cotizaciones** independientes (snapshot) que no modifican plantillas ni tarifario.
5. Calcula precios con pasajeros pagantes + acompañante (TC), margen variable y conversión a USD.
6. Genera un **PDF** (formato B2C o B2B) y lo **envía por email** desde la app.
7. Registra **estados, pagos del cliente, seguimiento y costo** de cada cotización (histórico de ventas).
8. (Fase 2) Al venderse, crea un **SERVICIO** para Operación.

Proyecto nuevo e independiente: no comparte base de datos con otros sistemas existentes.

---

## 2. Stack y reparto de trabajo

| Capa | Tecnología |
|---|---|
| Frontend | TanStack Start (React, rutas basadas en archivos en src/routes) + TypeScript + Tailwind + shadcn/ui (generado con Lovable) |
| Backend | Supabase: Postgres, Auth, Row Level Security, Storage, Edge Functions |
| Repo | GitHub, sincronizado con Lovable |
| PDF | `@react-pdf/renderer` (generado en cliente, subido a Storage) |
| Email | Edge Function + Resend con dominio `uyuniadventure.com` verificado |
| IA | Edge Functions que llaman a un LLM para traducción de bloques y extracción desde archivos históricos |
| Hosting | Lovable hosting (o Vercel desde el mismo repo) |

**Reparto:**
- **Lovable:** pantallas, navegación, formularios, tablas, autenticación, CRUD básico.
- **Codex** (sobre el mismo repo): esquema SQL y migraciones, políticas RLS, motor de cálculo (`/src/lib/pricing`), generación de PDF, Edge Functions (email, IA, recordatorios), scripts de migración de datos (Fase 0) y tests.
- **Regla:** la lógica de cálculo vive en un módulo puro con tests, nunca dentro de componentes de UI.

---

## 3. Roles y permisos

| Acción | Admin | Operación | Vendedor |
|---|---|---|---|
| Ver costos y márgenes | ✔ | ✔ | ✔ |
| Crear producto nuevo en tarifario | ✔ (activo) | ✔ (activo) | ✔ (queda `pendiente`) |
| Modificar tarifas del tarifario | ✔ | ✔ | ✘, solo **sugerir cambio** |
| Aprobar o rechazar sugerencias y productos pendientes | ✔ | ✔ | ✘ |
| Crear y editar bloques y plantillas | ✔ | ✔ | ✔ (pendiente de aprobación) |
| Crear, editar y enviar cotizaciones | ✔ | ✔ | ✔ (solo las propias, salvo admin) |
| Registrar pagos del cliente | ✔ | ✔ | ✔ |
| Gestionar SERVICIO (Fase 2) | ✔ | ✔ | lectura |
| Gestionar usuarios, divisas, T&C | ✔ | ✘ | ✘ |

Implementar con tabla `profiles.role` y políticas RLS en Supabase. Un producto `pendiente` creado por un vendedor **se puede usar en su cotización** de inmediato, pero no aparece como activo para los demás hasta que se apruebe.

La aprobación masiva de importación es exclusiva de **Admin** mediante `approve_valid_imports`.
Primero simula sin escrituras, devuelve conteos y motivos, y requiere confirmación explícita
con la misma revisión del catálogo antes de aplicar. Servicios y plantillas se actualizan
en una sola transacción; si el catálogo cambia hay que repetir la simulación.

---

## 4. Modelo de datos

### 4.1 Tarifario
- **`currencies`**: código (USD, CLP, BOB, ARS, PEN, EUR).
- **`exchange_rates`**: currency, rate_to_usd, valid_from. La mantiene el admin.
- **`suppliers`**: proveedores (nombre, país, contacto, notas).
- **`services`** (tarifario maestro; se importa desde la hoja `TARIFARIO_MAESTRO` actual, ver `fase0/tarifario_normalizado.csv`):
  - `sku` (único): se conserva el `TariffCode` existente (ej. `HTL_MALLKU_VILLAMAR_SGL_2026`, `TOUR_UYU_LEO_3D2N_LOOP`). Para servicios nuevos, el código no lleva el año: la vigencia va en `service_rates`.
  - `name` (ETIQUETA), `location`, `country` (`BOLIVIA | CHILE | CHILE_BOLIVIA | …`), `supplier_id`.
  - `type`: `transporte | alojamiento | comida | guia | entrada | actividad | paquete | extra`.
  - `pricing_unit`: `per_person | per_group | per_room | per_vehicle | per_staff | per_unit`.
  - `currency` (moneda nativa del proveedor; un servicio existe en **una sola** moneda).
  - `room_type` (solo alojamiento: `SGL | DBL_MAT | DBL_TWN | TPL | QUAD | SUITE…`), `vehicle_type` (solo transporte: `4X4 | H1_VITO | SPRINTER | SUBURBAN | BUS…`), `vehicle_max_pax`.
  - `meal_plan` (alojamiento: `NONE | BB | HB | FB`).
  - `multi_day_span` (int, default 1): servicios que cubren varios días con un solo precio (ej. transporte 4x4 3D2N). Se cobran una vez y aparecen en todos los días que cubren.
  - `applies_tc_default` (bool): si el TC genera costo en este servicio. Por defecto `true` en comidas y en algunos transportes, `false` en el resto.
  - `margin_applicable_default` (bool, default `true`).
  - `modality`: `privado | compartido | ambos`.
  - `status`: `activo | pendiente | inactivo`; `created_by`; `source` (de dónde viene la tarifa: PDF del proveedor, correo…).
- **`service_rates`**: service_id, `season` (`ALL | DRY | RAIN | BAJA | MEDIA | ALTA | FESTIVO`), `valid_from`, `valid_to`, `pax_min`, `pax_max`, `price_net` (costo), `price_rack` (referencia pública).
  - **Tramos por pax:** hoy un mismo servicio aparece en varias filas por rango de pax (ej. transfer 1-2 / 3-6 / 7-9 pax). En la app es **un servicio con varias tarifas** según `pax_min`–`pax_max`, y el motor elige el tramo automáticamente.
  - Si solo existe `price_rack`, ese valor se adopta como costo neto y se conserva el rack (decisión de Andrea, 2026-10-11). El aviso de falta de costo corresponde solo a tarifas sin neto y sin rack; no se asume un costo cero.
- **`hotel_codes`**: letra o sigla de cada hotel según la hoja `INDEX HOTELS` actual (P = Palacio de Sal, Td = Tayka del Desierto, M = Mallku Cueva, L = Luna Salada, F = Los Flamencos, K = Kachi, J = Jardines de Uyuni, Ñ = Coscaña, S = Sky Dream…). Se usan para componer el SKU de plantilla (§5).
- **`service_change_requests`**: service_id o rate_id, valores propuestos, motivo, solicitante, estado (`pendiente | aprobado | rechazado`), aprobador.

### 4.2 Lugares y fotos
- **`places`**: nombre, país, slug (ej. `salar-uyuni`, `laguna-colorada`).
- **`media`**: archivo en Supabase Storage, `place_id` o `service_id` (para fotos de hoteles), tipo (`highlight | alojamiento`), orden.

### 4.3 Bloques: tres niveles

Los datos reales muestran que la unidad mínima reutilizable no es el día sino la **actividad** (la hoja `BLOQUES SPA` ya lo hace: "Valle de la Luna" = transporte + guía + entrada + snack). Por eso el modelo tiene tres niveles:

```
servicio (tarifario) → módulo de actividad → bloque diario → plantilla de itinerario
```

- **`activity_modules`**: `code`, `name`, `place_id`, `duration` (`HD_AM | HD_PM | FD | NOCHE | TRASLADO`), `default_time` (ej. 07:00), `modality`, `status`.
- **`activity_module_translations`**: module_id, `lang`, `title`, `description` (texto para el cliente).
- **`activity_module_items`**: module_id, service_id, `qty`, `applies_tc`, `margin_applicable`.
  Ej.: `MOD_SPA_VALLE_LUNA_HD` = TOUR_MAS_VDLL_SPR_7_13 + GUIDE_MAS_VDLL_HD + entrada + snack.

**Bloques diarios:**
- **`day_blocks`**:
  - `code` (único), `route_from`, `route_to`, `places[]`, `modality` (`privado | compartido | grupo`).
  - `hotel_service_id`: el hotel define la variante. Un mismo día con distinto hotel es **otro bloque** (otra ruta u otra descripción).
  - `default_day_position` (sugerencia de orden: día 1, día 4, etc.).
  - `status` (`activo | pendiente`).
- **`day_block_translations`**: block_id, `lang`, `title`, `description` (narrativa para el cliente), `includes`, `excludes`, `reviewed` (bool).
- **`day_block_modules`**: block_id, module_id, `order`, `time`.
- **`day_block_items`**: block_id, service_id, `qty` (por defecto 1), `applies_tc` (override), `margin_applicable` (override), `is_optional`, `included` (bool). Son los ítems sueltos del día: alojamiento, comidas, traslados. Los ítems con `included = false` alimentan el "no incluye" (ej. "Cena libre").
  - `pricing_config` se valida con Zod en `src/lib/pricing/config.ts`: habitación (`room_type`: SGL, DBL, TPL o MAT; `nights`), vehículo (`vehicle_segment` y tramo opcional `rate_band`: pax_min/pax_max), persona/grupo (`{}`). Los campos ausentes se resuelven al calcular y generan avisos; se conservan los metadatos de importación fuera de esa configuración. La misma validación se aplica a enlaces de módulos.

### 4.4 Plantillas (biblioteca)
- **`itinerary_templates`**:
  - `sku` (componible, ver §5), `name`, `route_from`, `route_to`, `route_type` (`ROUNDTRIP | ONEWAY`), `days`, `nights`, `modality`, `category` (`BUDGET | COMFORT | VIP | MIXTO`), `hotel_combo` (ej. `MP`), `countries[]`, `main_places[]`, `meals_summary` (ej. `2B,3L,2D`), `includes_guide`, `guide_language`, `includes_staff_lodging_meals`.
  - `status`, `source_quote_id` (si se promovió desde una cotización).
- **`template_days`**: template_id, `day_number`, block_id.

**Aprobación masiva de pendientes:** un servicio necesita unidad, moneda y al menos
una tarifa vigente en la fecha de Santiago con costo neto o rack; cero explícito es válido.
Una plantilla necesita todos sus días numerados del 1 a su duración, con servicios
aprobados (incluidos hoteles y servicios dentro de módulos, también los aprobables en
la misma operación). Días vacíos, módulos vacíos y bloques/módulos inactivos impiden
aprobarla. Un ítem sin vínculo a un servicio del catálogo tampoco se considera
aprobado, aunque tenga un snapshot con precio. Los motivos se guardan en
`approval_issues` al aplicar, sin sustituir las
advertencias de importación. Los registros activos o inactivos no se modifican.
El vendedor puede leer los bloques y módulos de una plantilla activa sin cambiar
el estado propio de esos bloques/módulos ni ganar permisos de edición.

### 4.5 Clientes y condiciones
- **`clients`**: `type` (`B2B | B2C`), nombre o agencia, contacto, email, país, `language` (es, it, en, …), `terms_id`.
  - `margin_pct` opcional: se hereda si la cotización no especifica un porcentaje. Cero es un valor explícito.
  - Comisión de agencias B2B: `commission_mode` (`none`, predeterminado, o `gross`) y `commission_pct` (0 por defecto, siempre menor que 100).
  - `deposit_pct` opcional (0–100): porcentaje de depósito; vacío hereda el global de Admin. Cero es explícito.
- **`pricing_settings`**: configuración global única; `margin_mode` (`markup` por defecto, confirmado por Andrea el 2026-10-11) y `margin_pct` (25 por defecto). El equipo puede leerla para cotizar; solo Admin puede modificarla.
  Incluye `deposit_pct` (30 por defecto), editable en Admin → Depósito.
- **`terms_conditions`**: `scope` (`B2C_general | B2B_general | B2B_cliente`), client_id (si es B2B específico), `lang`, contenido.
- **`info_blocks`**: textos fijos por destino e idioma para el PDF (efectivo y entradas, salud y altitud, sobre la experiencia, notas importantes, métodos de pago).
- **`bank_accounts`**: datos bancarios por entidad (Ando Libre LLC); se insertan en el PDF.

### 4.6 Cotizaciones
- **`quotes`**:
  - `code` (ver §5), `version`, `parent_quote_id` (para versiones), `template_id` (nullable), `client_id`, `client_type`, `language`, `seller_id`.
  - `start_date`, `pax_paying`, `tc_count`, `rooming` (json: habitaciones por tipo, incluido el TC; ej. `7 TWN + 1 SGL`).
  - `staff` (json: número de choferes y guías que generan costo de alojamiento y comida; ej. `{drivers: 4, guides: 1}`).
  - `vehicles` (json por tramo: tipo y cantidad, definidos por el vendedor; ej. `4 × 4x4` en Bolivia).
  - `category` (`BUDGET | COMFORT | VIP | MIXTO`).
  - **Condiciones de pago:** `deposit_pct` se copia del cliente o, si está vacío, de Admin (inicialmente 30). Se congela al crear y se conserva en las versiones; cambios posteriores no modifican acuerdos existentes. `balance_due_days` (default 5 días antes en B2C; en grupos se define por cliente, ej. 45), `card_surcharge_pct` (default 3), `payment_schedule` (json opcional con hitos y penalidades específicas, como en el programa SIVOLA).
  - `single_supplement_pp` (calculado, ver §6).
  - `fx_snapshot` (json con las tasas usadas), `margin_pct`, `margin_mode`, `commission_mode`, `commission_pct`, `rounding_rule`. La política efectiva se congela al crear la cotización; las versiones la conservan. Los cambios posteriores en cliente o Admin afectan solo a nuevas cotizaciones.
  - Totales calculados: `total_cost_usd`, `total_margin_usd`, `total_price_usd`, `price_per_pax_usd`.
  - `pax_scenarios` (json opcional para tabla B2B: lista de pax, por ejemplo [2,4,6,10], con su configuración de vehículos y habitaciones por escenario).
  - `status`, `lost_reason`, `cancel_reason`, `next_followup_at`.
- **`quote_days`**: `quote_id`, `day_number`, `date`; `source_block_id` nullable y
  `block_snapshot` completo, con todos los idiomas, módulos y enlaces del bloque al copiarlo.
  `overrides` contiene solo diferencias de contenido: title/description por idioma,
  meals, accommodation_text, transport_text, schedule, start_point, end_point,
  internal_notes y photo_ids. Resolver un día nunca consulta la biblioteca viva.
  Restaurar un campo al valor del snapshot elimina su override.
  `link_type`: chained por defecto, independent, o grouped con `group_id` y
  `group_position`. Al copiar una plantilla, una compra multi-día agrupa todos
  sus días; se cobra una vez. Mover/borrar un miembro afecta al grupo completo.
  Desagrupar conserva la compra; se rechazan operaciones que la partan.
  Desde la biblioteca se pueden seleccionar varios bloques en orden y añadirlos
  juntos mediante `addBlockDays` / `edit_quote_days(add_blocks)`. La inserción y
  el recálculo son atómicos; un servicio multi-día exige su tramo completo.
  Cada inserción recibe una identidad de compra nueva, para cobrar una sola vez
  dentro del tramo sin confundirlo con otro tramo igual de la misma cotización.
  Días encadenados adyacentes con puntos conocidos incompatibles generan avisos
  (normalización de caja, espacios y tildes); independent omite esa comparación.
  Edición, agrupación, movimientos y borrado guardan el recálculo atómicamente.
  Al versionar se copian snapshots/overrides y se asignan nuevos IDs de grupo.
- **Bloques derivados:** `day_blocks.parent_block_id`, `name`, `start_point`,
  `end_point` y `content` conservan el nombre y contenido del nuevo bloque.
  `saveDayAsNewBlock` copia contenido efectivo de todos los idiomas y servicios
  actuales del día, con estado pendiente y vínculo al bloque original intacto.
- **Trazabilidad de ítems:** `quote_items.source_block_service_id` identifica el
  enlace original de bloque o módulo; null en ítems añadidos a mano. Los servicios
  se modifican únicamente en `quote_items`, nunca mediante overrides.
- **`quote_items`**: quote_day_id, service_id (nullable si es ítem nuevo), sku, descripción, `type`, `pricing_unit`, `qty`, `unit_cost_original`, `currency`, `unit_cost_usd`, `applies_tc`, `margin_applicable`, `included` (bool), `day_span` (para servicios multi-día), `price_overridden` (bool), `override_note`, `promote_to_master` (bool).
  - `adjustment_pct`: fracción entre -0.5 y 1 (0.064 significa +6,4 %; límites -50 % y +100 %), no nula y por defecto 0. `adjustment_note`: nota interna opcional. Vive solo en la cotización, se copia al versionar y no se hereda al promover una plantilla. No se usa `fuel_surcharge`.
  - Campos de vuelo (si `type = vuelo`): `airline`, `flight_no`, `route`, `dep_time`, `arr_time`, `fare_notes`. Alimentan el resumen de vuelos del PDF.
  - Campos de alojamiento: `check_in`, `check_out`, `room_distribution`, `meal_plan`. Alimentan el resumen de alojamientos.
- **`quote_status_history`**: estado anterior y nuevo, usuario, fecha, nota.
- **`quote_payments`**: monto, divisa, fecha, método, banco opcional, tipo (`deposito | saldo | otro`), registrado_por, comprobante privado (Storage `payment-receipts`). `fx_rate` copia la tasa congelada de la cotización (unidades por USD); `amount_usd` se calcula en Postgres. Los registros y comprobantes son inmutables.
  La pestaña Pagos usa `register_quote_payment`: bloquea la cotización y confirma pago,
  estado, historial y operación en una sola transacción. Un UUID por intento permite
  reintentar sin duplicar pagos. El archivo se sube antes; la RPC comprueba que exista
  y pertenezca a esa cotización y pago. No se registran pagos si falla esa validación.
  El saldo descuenta todos los pagos; únicamente los de tipo `deposito` cuentan para
  confirmar la venta. El objetivo es `round(total_price_usd × deposit_pct / 100, 2)`.
  Si hay pagos históricos sin tasa, se muestra el pendiente y no se asume conversión.
- **`quote_followups`**: fecha, nota, hecho (bool), responsable.
- **`quote_emails`**: destinatario, asunto, cuerpo, pdf_url, enviado_at, enviado_por, estado de envío.

### 4.7 Operación: SERVICIO (Fase 2)

Basado en el archivo `UA_2026 - GESTION RESERVA-OPERACION` (fichas por reserva, `TEMPLATE`, `RESERVAS ACTIVAS`, `SERVICIOS TERMINADOS`, `RESUMEN2026`, `CONTACTO PROVEEDORES`).

- **`ops_services`** (la ficha): se crea al pasar la quote a `vendida`.
  Conserva `quote_snapshot` y `days_snapshot` inmutables: todos los días (también libres),
  pax pagantes/TC, staff, rooming, vehículos, tipos de cambio y costos del acuerdo.
  La pestaña Itinerario cotizado lee esta copia, sin consultar la biblioteca viva.
  - `booking_code` (formato actual `AAAAMMDD-DD NOMBRE xN`, ej. `20261205-08KATHRIN x2`), quote_id, `client_type` (`PRIVADO | GRUPO`), `tour_sku`, `start_date`, `end_date`, `pax`, `responsible_id`.
  - `status` (`activo | en_curso | terminado | cancelado`).
  - Totales: `quoted_cost_usd`, `real_cost_usd`, `sale_price_usd`, `real_margin_usd`.
- **`ops_items`**: copia de cada quote_item con fecha real, más:
  - `place`, `pickup_time`, `supplier_id`, `cost_usd`, `cost_local`, `currency`.
  - `booking_status` (`pendiente | cotizacion_solicitada | reservado | confirmado | cancelado`).
  - `followup_notes`, `extra_notes`.
- **`ops_supplier_payables`** (costos a proveedores): service_id, supplier_id, `detail`, `cost_usd`, `cost_local`, `paid_usd`, `balance_usd`, `due_date`, `paid_date`, `status` (`pendiente | parcial | pagado`). Se agrupa automáticamente por proveedor desde `ops_items`.
- **`ops_passengers`**: service_id, nombre completo, nacionalidad, pasaporte, fecha de nacimiento, restricciones alimentarias, tipo de cama, teléfono o email, notas (ej. luna de miel).
  - **Datos sensibles:** acceso solo para operación y admin (RLS); no se incluyen en exportaciones ni PDFs al cliente.
- **`ops_communications`**: plan de mensajes por servicio con hitos estándar, generados automáticamente desde una plantilla:
  1. Después de la confirmación (mensaje de bienvenida en estilo personalizado).
  2. 48 h antes (horarios).
  3. 24 h antes (confirmación y formulario de inmigración).
  4. Día 1 por la tarde ("¿cómo va todo?").
  5. Fin del viaje (encuesta de satisfacción en el idioma del cliente).
  Cada hito tiene `channel` (WhatsApp o email), `scheduled_at`, `message`, `status` (`pendiente | enviado`).
- **`suppliers`** (ampliado): correo, teléfono, tipo de servicio, agente a cargo, lugar.

**Vistas transversales (reemplazan hojas actuales):**
- **Reservas de alojamiento activas:** todas las noches de hotel de todos los servicios, con hotel, check-in/out, distribución, estado, fecha de pago y correo del hotel (reemplaza `RESERVAS ACTIVAS PRIVADOS / GRUPOS`).
- **Resumen de servicios:** fecha, pax, código, costo, precio, margen, estado (reemplaza `RESUMEN2026` y `SERVICIOS TERMINADOS`).
- **Pagos a proveedores pendientes**, ordenados por fecha de vencimiento.

---

## 5. SKU componible y códigos

Se adopta la convención **que ya se usa** en `TARIFARIO PUBLICO` y en las hojas de presupuesto:

**SKU de plantilla:**
```
{ORIGEN}{DESTINO}-{N}D{N}N-{COMBO HOTELES}[-{SUFIJOS}]
UYUSPA-3D2N-PTd        Uyuni → San Pedro, 3D2N, Palacio de Sal + Tayka del Desierto
SPASPA-4D3N-MPF        San Pedro roundtrip, 4D3N, Mallku + Palacio + Flamencos
SPASPA-4D3N-MPF-ENG    + guía en inglés
```
- ORIGEN y DESTINO: código de 3 letras (SPA = San Pedro de Atacama, UYU = Uyuni, CJC = Calama, LPB = La Paz, SRE = Sucre, STG = Santiago…), en tabla `location_codes`.
- Combo de hoteles: letras de `hotel_codes`, una por noche en orden.
- Sufijos opcionales: idioma de guía (`ENG`, `ITA`), extras (`PHOTO`), modalidad cuando no es privado (`SHR` compartido, `GRP` grupo).
- La categoría (`BUDGET | COMFORT | VIP`) y el tipo de ruta (`ROUNDTRIP | ONEWAY`) son atributos de la plantilla, no parte del SKU.
- Grupos: prefijo `UAG-` como hoy (ej. `UAG-SPB08170823`).

**Código de cotización:** `{SKU}-{IDIOMA}-{AA}-{correlativo}[-vN]`, ej. `UYUSPA-3D2N-LF-IT-26-0142-v2`.

**Código de reserva (al venderse):** se mantiene el formato operativo actual `AAAAMMDD-DD NOMBRE xN`.

**Búsqueda:** por SKU completo o parcial (`UYUSPA`, `3D2N`, `-PTd`) y por filtros: origen, destino, días, categoría, hoteles, lugares, comidas, guía, idioma, cliente, estado y fechas.

---

## 6. Motor de cálculo (`/src/lib/pricing`)

Módulo puro de TypeScript, sin dependencias de UI, con tests unitarios. Entrada: quote con días, ítems, pax, TC, rooming, fx_snapshot y margen. Salida: desglose por ítem, día y totales.

1. **Fecha por día:** `start_date + (day_number - 1)`. Se usa para elegir la tarifa de temporada correcta en `service_rates`.
2. **Tarifa:** busca el rate vigente para la fecha (y el room_type en alojamiento). Si `price_overridden`, usa el valor manual (solo en la cotización; no toca el tarifario).
3. **Conversión:** `unit_cost_usd = unit_cost_original / rate_to_usd` según `fx_snapshot`, que se congela al crear la cotización y se puede refrescar manualmente.
   **Tramo por pax:** si el servicio tiene varias tarifas por rango (`pax_min`–`pax_max`), se elige la que corresponde al total de personas que lo usan (pax + TC si aplica).
4. **Cantidad según `pricing_unit`:**
   - `per_person`: `pax_paying + (applies_tc ? tc_count : 0)`.
   - `per_group`: `qty` (normalmente 1). Ej.: guía local, se paga por grupo.
   - `per_vehicle`: la cantidad definida para el tramo en `vehicles` tiene prioridad. Si falta, se propone una unidad con el tramo vigente que cubre pagantes + TC + choferes + guías, con aviso. Si la tarifa no tiene límites ni capacidad informada, se avisa que hay que revisar la capacidad. No se sustituyen tarifas vencidas, ambiguas o con límites insuficientes por un precio inventado.
   - `per_room`: según el `rooming` propio de la cotización (habitaciones por tipo × noches). Si no hay distribución positiva: pagantes en DBL y un SGL si son impares; TC en SGL separado, cobrado solo si `applies_tc`. La distribución explícita sustituye esta regla (4 pax = 2 DBL; 5 pax = 1 TPL + 1 DBL). Sin noches configuradas, un enlace diario de hotel representa una noche. Las categorías como STANDARD no son ocupaciones: sin tipo, se usa la distribución con las tarifas disponibles y un aviso. Nunca se omite silenciosamente una variante solicitada que no tenga tarifa.
   - `per_staff`: número de choferes o guías según `staff` (ej. "cena chofer", "habitación compartida chofer").
   - `per_unit`: `qty` libre.
   - **Servicios multi-día** (`multi_day_span > 1`): se cobran una sola vez, en el primer día que cubren; en los días siguientes aparecen con costo 0 y el texto "incluido" (como hoy el transporte 3D2N).
5. **Costo base por línea** = cantidad × tarifa original ÷ FX congelado. **Costo ajustado** = costo base × (1 + `adjustment_pct`). **Costo total** = suma de costos ajustados. El resultado devuelve `costo_base`, `adjustment_pct`, `adjustment_usd` y `costo_ajustado` por línea (conserva también los nombres anteriores `base_cost_usd`, `adjustment_amount_usd` y `total_cost_usd`). `total_adjustments_usd` suma los ajustes, sin duplicar compras multi-día, y queda null si hay errores; también se devuelve por escenario. El PDF solo muestra precios finales y nunca notas ni porcentajes de ajuste.
6. **Margen:** porcentaje de la cotización; si falta, el del cliente; si falta, el global de Admin. Un cero explícito no se reemplaza. Se aplica **solo sobre ítems con `margin_applicable = true`**. Con `p = margin_pct / 100`: `markup` da venta = costo × (1 + p); `margin_on_price` da venta = costo ÷ (1 − p), con p menor que 1. El margen es venta menos costo. Los ítems no elegibles conservan su costo sin margen.
   **Comisión B2B:** `none` no añade comisión. Con `gross` y `c = commission_pct / 100`, la venta a la agencia = (costo + margen) ÷ (1 − c), con c menor que 1. La comisión es la diferencia respecto a costo + margen; se aplica al precio completo a la agencia, incluidos los ítems sin margen. B2C no tiene comisión.
   `calculateQuote` devuelve costo, margen, comisión, total USD y precio por pax pagante. El redondeo existente se aplica después; su diferencia se informa como `rounding_adjustment_usd`. Los escenarios y suplementos single usan la misma política.
   **Regla revisada por Andrea (2026-10-11):** en las fórmulas de margen anteriores, «costo» es el **costo ajustado**. Base 100 × (1 + 0.04) × 1.25 = venta 130 USD. Sustituye la regla anterior que dejaba el ajuste fuera del margen. La comisión B2B, si corresponde, conserva su aplicación sobre el precio completo.
7. **Precio por pasajero** = `precio_total / pax_paying` (el TC nunca divide).
8. **Redondeo** configurable (por ejemplo, al dólar o a 5 USD superiores).
9. **Suplemento single** (por persona) = (costo SGL − costo de media habitación doble) × noches, con margen aplicado. Se muestra cuando la base es twin.
10. **Escenarios B2B por pax** (como hoy en `RESUMEN COSTOS` y en las columnas 2-4-6-10… de los presupuestos grupales): para cada escenario de `pax_scenarios` se recalcula todo con su propia configuración de vehículos y habitaciones, y se devuelve una tabla pax → precio total → precio por pax.
11. El historial guarda siempre **costo, margen y precio**, para poder analizar la rentabilidad de lo vendido.
12. Si una tarifa que debe cobrarse no tiene neto ni rack, el ítem devuelve `status: error` y un aviso. Los totales de la cotización quedan sin calcular (`null`), nunca cero ni un subtotal parcial; el borrador conserva el error al reabrirse. Se debe resolver antes de revisar o emitir la cotización. Un precio cero informado sí es válido.
13. `applyAdjustmentBulk(quoteId, { filtro, pct, nota })` reemplaza el ajuste de los ítems filtrados por tipo, proveedor, número de día o lista de IDs; si se combinan filtros se exige cumplirlos todos. `pct` usa la misma fracción que `adjustment_pct`. Una compra multi-día seleccionada actualiza sus copias de visualización y sigue cobrándose una vez. Una RPC guarda los ajustes y el recálculo en una única transacción comprobando `updated_at`; devuelve los ítems guardados y sus IDs afectados. Cualquier error revierte todo. Cotizaciones enviadas requieren crear una versión antes de aplicar el lote. El tarifario permanece intacto.

---

## 7. Flujo de una cotización

**Creación rápida (pantalla principal):**
1. Datos básicos: cliente (o nuevo), tipo B2B/B2C, idioma, fecha de inicio, pax pagantes, TC, modalidad, origen, destino y días disponibles.
2. La app sugiere plantillas que coinciden. El vendedor elige una o parte desde cero.
3. **Editor por días:** reordenar, quitar o agregar bloques; cambiar hotel (al seleccionar un hotel se muestran sus tipos de habitación y tarifas disponibles); agregar o quitar servicios; cambiar comidas; sobrescribir un precio solo en esta cotización; crear un ítem nuevo (con opción "agregar al tarifario" → queda `pendiente` si lo crea un vendedor).
4. Panel lateral con el cálculo en vivo: costo, margen, total, precio por pax y (si es B2B) la tabla por escenarios.

**Creación desde plantilla:** `src/lib/quotes/createQuoteFromTemplate` requiere una
plantilla activa y días consecutivos con servicios. Recibe cliente, idioma, fecha,
pagantes, TC, staff y rooming opcional; SKU/categoría proceden de la plantilla y la
política de precios del cliente/Admin. La preparación lee y calcula sin escrituras
ni traducciones automáticas. Una sola RPC `create_quote_from_template` bloquea y
comprueba el origen, copia los días y los servicios con cantidades y configuración,
asigna código/fechas y guarda el cálculo en la misma transacción. Un fallo revierte
también historial y correlativo. Si cambió el origen, hay que repetir la creación.
Cada día elige su tarifa por fecha real, temporada configurada y tramo de pasajeros.
La cotización conserva los textos, los datos de los servicios, las tarifas y la
configuración copiados: editar el catálogo después no la modifica. Falta de aprobación,
días vacíos o traducción ausente devuelven un motivo sin crear un borrador parcial.
El vendedor puede leer los tipos de cambio, pero solo Admin puede administrarlos.

**Estados:**
```
borrador → revisada → enviada → vendida
Desde cualquier estado distinto del destino: perdida o cancelada (motivo obligatorio)
```
- `revisada`: control interno; el mismo vendedor puede marcarla y enviarla.
- `transitionQuote` llama a `transition_quote`: Postgres bloquea la cotización,
  valida estado, permisos y motivo, y escribe el historial en la misma transacción.
  No se permiten saltos, retrocesos ni transiciones al mismo estado. Perdida y
  cancelada pueden convertirse entre sí con motivo, pero no reabrirse como borrador.
- `enviada`: se genera el PDF, se envía el email y queda registrado.
- Antes de revisar o enviar: cálculo vigente, sin errores en cotización, ítems
  o escenarios; textos revisados y sin pendientes de importación. Los avisos
  informativos (por ejemplo, continuidad) no bloquean el envío.
- Editar una cotización `enviada` crea una **nueva versión** (`-v2`); la anterior queda archivada.
  `beginQuoteEdit` usa `version_quote`; los ítems también versionan automáticamente
  mediante `edit_quote_item`. La copia empieza en borrador y conserva snapshots,
  servicios y ajustes, con grupos propios; no copia pagos ni historial. La anterior
  conserva su cálculo y contenido y queda de solo lectura.
- `vendida`: solo desde enviada, cuando los pagos positivos de tipo `deposito` acumulados
  alcanzan el depósito requerido en USD (Andrea, 2026-10-12),
  o por Admin con motivo explícito (Andrea, 2026-10-12). Saldo/otro no confirman venta.
  Depósito, venta, historial y creación de Operación son atómicos; depósitos
  adicionales no duplican la venta. Un depósito parcial no vende; la RPC de estados
  y las escrituras directas también verifican el umbral. Perdidas/canceladas no reciben nuevos pagos.
- Cada cambio registra `quote_status_history`: usuario, fecha/hora, estado anterior,
  nuevo y motivo. El historial y los pagos son de solo adición. La pérdida guarda
  `lost_reason`, la cancelación `cancel_reason`; ambos exigen motivo no vacío.
- **Recordatorios de seguimiento:** cada cotización enviada tiene `next_followup_at`. Un dashboard muestra las pendientes de hoy y las vencidas; opcionalmente, un email diario al vendedor (Edge Function programada).
- Al pasar a `vendida`: se crea el registro en `services_ops` (Fase 2).

---

## 8. Salidas: PDF y email

El idioma de todo el PDF y del email es el **idioma del cliente**. Si un bloque no tiene traducción en ese idioma, la IA la genera, se guarda en `day_block_translations` con `reviewed = false` y se avisa al vendedor para que la revise antes de enviar.

**PDF B2C** (modelo de referencia: el correo "TOUR PRIVADO 3 días / 2 noches" y los programas visuales en Canva):
- Portada con marca Uyuni Adventure y foto principal.
- Introducción breve del programa.
- Itinerario día por día con narrativa, **fotos de highlights y del alojamiento** de cada día, alojamiento con tipo de habitación y comidas incluidas.
- Extras opcionales con precio (guía en idioma, amanecer en el salar, sesión de fotos, upgrade de habitación), tomados de módulos marcados como `optional`.
- Precio total y por persona; depósito (% y monto) y saldo con su fecha límite.
- Medios de pago (transferencia USD con datos bancarios de Ando Libre LLC, enlace EUR, tarjeta con recargo).
- Información práctica fija por destino (efectivo y entradas, salud y altitud, sobre la experiencia, notas importantes), editable como `info_blocks` por destino e idioma.
- Enlace a T&C B2C.

**PDF B2B** (modelo de referencia: "Bolivia 5D4N Program" y "Programma SIVOLA"):
- Encabezado con ficha: cliente, fechas, participantes (+ TC), sistemación (ej. `7 TWIN + 1 SGL`), logística (ej. `4 × 4x4, 4 pax por vehículo`), guía, valor total y cuota por persona, operador.
- Por cada día: título con fecha y ruta, narrativa breve, tabla **"Servicios incluidos"** (cada ítem incluido), **"No incluido"** (ítems con `included = false`) y **pernoctación** (hotel + régimen).
- **Resumen de vuelos internos** (auto desde ítems tipo vuelo: fecha, tramo, compañía, vuelo, horarios, estado incluido/no incluido).
- **Resumen de alojamientos** (auto: localidad, hotel, check-in, check-out, noches, régimen, distribución).
- **Cotización:** base de cálculo, valor total, cuota por persona, suplemento single y, si se pidió, tabla por escenarios de pax.
- **Modalidades de pago y cancelación** (desde `payment_schedule` de la cotización o del cliente).
- Datos bancarios.
- T&C completos (los generales B2B o los específicos del cliente), en el idioma del cliente.
- Fotos: opcional, solo portada.

**Email:** se envía desde la app (Edge Function + Resend) con el PDF adjunto. El cuerpo es una plantilla editable por idioma y tipo de cliente, con el resumen esencial: tour, fechas, pax y precio. Todo envío queda en `quote_emails`.

---

## 9. IA

1. **Traducción de bloques y módulos** al idioma del cliente (ver §8).
2. **Extracción desde históricos (Fase 0):** ver §13. La IA solo se usa donde no hay SKU; todo lo que se puede leer por fórmula se extrae sin IA. Todo entra como `pendiente` y se aprueba en una pantalla de revisión. Nunca se publica nada sin aprobación humana.

---

## 10. Pantallas

1. Login.
2. Dashboard: cotizaciones por estado, seguimientos de hoy, ventas del mes (precio, costo y margen).
3. Nueva cotización (§7).
4. Lista de cotizaciones con búsqueda (§5) y filtros.
5. Detalle de cotización: editor, cálculo, versiones, pagos, seguimientos, emails, historial de estados.
6. Biblioteca de plantillas: búsqueda, ver, duplicar, editar, crear.
7. Bloques diarios: lista, editor con traducciones e ítems.
8. Tarifario: servicios, tarifas por temporada, sugerencias de cambio, productos pendientes.
9. Media: subir fotos y asignarlas a lugares u hoteles.
10. Clientes y T&C.
11. Admin: usuarios y roles, divisas y tipos de cambio, códigos de ubicación y de hoteles, textos fijos (`info_blocks`), datos bancarios.
12. Revisión de importación (Fase 0).
13. (Fase 2) Ficha de SERVICIO: ítems con estado de reserva, costos y pagos a proveedores, pasajeros, plan de comunicación.
14. (Fase 2) Reservas de alojamiento activas, pagos a proveedores pendientes y resumen de servicios.

UI en español. Interfaz rápida, con pocos clics para el caso típico.

---

## 11. Fases y criterios de aceptación

**Fase 0, datos:** ver §13.
- Esquema SQL completo con RLS.
- Tarifario limpio e importado (0 duplicados, 0 servicios sin costo neto activos).
- Plantillas de los presupuestos estándar con SKU extraídas y aprobadas.
- Carga de fotos por lugar y hotel.

**Fase 1, cotizador:**
- Se puede crear una cotización B2C desde una plantilla y enviarla con PDF en **menos de 5 minutos**.
- El cálculo con TC, margen parcial, multi-divisa y temporadas coincide con los presupuestos Excel de referencia (tests con 3 casos reales).
- Cambiar un precio o hotel en una cotización **no altera** el tarifario ni la plantilla.
- Los estados, versiones, pagos y seguimientos funcionan; el depósito marca `vendida`.
- Los permisos por rol se cumplen (probado con 3 usuarios de prueba).

**Fase 2, operación** (§4.7):
- Al registrar el depósito se crea la ficha de SERVICIO con todos los ítems, fechas reales y proveedores.
- Operación puede marcar el estado de cada reserva, registrar costos reales y pagos a proveedores, cargar pasajeros y seguir el plan de comunicación.
- La vista de reservas de alojamiento activas reemplaza las hojas `RESERVAS ACTIVAS`.
- El margen real (precio − costo real) queda visible por servicio y en el resumen.

---

## 12. Supuestos por confirmar

- Las fotos se almacenan en Supabase Storage, organizadas por lugar y hotel (se migran desde la carpeta actual).
- Los productos y bloques creados por vendedores quedan `pendiente` hasta aprobación de admin u operación.
- Remitente de email: dirección de `uyuniadventure.com` (por definir).
- Tarifa solo con rack: ese valor es el costo neto (Andrea, 2026-10-11).

---

## 13. Migración de datos (Fase 0)

**Inventario de fuentes:**

| Fuente | Qué contiene | Cómo se migra |
|---|---|---|
| `TARIFARIO_MAESTRO` (1.206 filas, 71 proveedores) | Servicios con código, unidad, moneda, tramos de pax, temporada | Script directo desde `fase0/tarifario_normalizado.csv`, después de limpiar la columna `issues` |
| `INDEX HOTELS` | Letras de hoteles y combos | Carga directa a `hotel_codes` |
| `TARIFARIO PUBLICO` | SKU de plantillas, categoría, ruta, combo, comidas, precios de venta por pax | Base del catálogo de `itinerary_templates` |
| `BLOQUES SPA` | Actividades de San Pedro ya agrupadas con SKU | Carga directa a `activity_modules` |
| Presupuestos estándar con SKU (~34 hojas, ~1.500 ítems vinculados) | Días y servicios por plantilla | Extracción **determinística** leyendo los SKU de las fórmulas `INDEX/MATCH` (`fase0/extraccion_presupuestos_standard.json`) |
| Presupuestos estándar sin SKU (~40 hojas) y presupuestos grupales (35 hojas, valores fijos por columna de pax) | Días y servicios sin vínculo al tarifario | **IA + revisión**: la IA propone el SKU más probable por nombre, proveedor y precio; el humano confirma |
| `GUIA_PRODUCTOS_2026_INTERNA.docx` (46 programas con SKU, 165 días, en español) | Título, descripción, alojamiento, comidas y notas por día; incluye / no incluye; distribución de hoteles | Extracción **determinística** ya hecha (`fase0/guia_productos_extraida.json`). Los 165 días se reducen a **59 textos únicos**, que son los bloques diarios base; 27 se reutilizan en varios programas |
| PDF de programas (B2B y correos B2C) | Narrativa por día en ES, EN, IT | IA extrae títulos y descripciones por día y las asocia a los bloques |
| Programas Canva (PDF de solo imágenes) | Narrativa visual | Exportar el texto desde Canva o pasar por OCR; prioridad baja |
| Archivo de operación | Fichas por reserva, proveedores, pasajeros | Solo `CONTACTO PROVEEDORES` se migra en Fase 0; las fichas históricas no se migran |

**Limpieza del tarifario (antes de importar):**

| Problema detectado | Filas | Acción |
|---|---|---|
| Solo precio rack, sin costo neto | 248 en la fuente histórica | Copiar rack a neto conservando rack (decisión de Andrea, 2026-10-11); contar las candidatas actuales antes de ejecutar |
| Etiqueta duplicada | 185 | Fusionar o renombrar (muchas son tramos de pax del mismo servicio: pasan a ser tarifas de un solo servicio) |
| SKU duplicado | 24 | Dejar uno y redirigir |
| Mismo servicio en dos monedas (`_CLP` y `_USD`) | 11 | Dejar solo la moneda nativa del proveedor |
| Comidas no reconocidas | 29 | Normalizar a `NONE / BB / HB / FB` |
| Sin unidad de cobro | 13 | Asignar unidad |
| Sin código | 10 | Asignar SKU |
| Nombres de proveedor inconsistentes (`LEONEL HUANCHACA`, `Leonel Huanchaca`, `LEO - UYUNI`) | — | Tabla `suppliers` única con alias |
| Tipo de vehículo mezclado en la columna de habitación | — | Ya separado en `vehicle_type` en el CSV normalizado |

**Orden de trabajo:**
1. Limpiar el tarifario usando la columna `issues` del CSV (1 a 2 sesiones de trabajo).
2. Importar proveedores, tarifario, `hotel_codes`, `location_codes` y `BLOQUES SPA`.
3. Importar las ~34 plantillas con SKU desde el JSON de extracción; revisar en la pantalla de revisión.
4. Correr la IA sobre las hojas sin SKU, empezando por las rutas más vendidas (`TARIFARIO PUBLICO`).
5. Crear los bloques diarios desde los 59 textos únicos de la Guía: cada texto es un bloque, y cuando el mismo texto aparece con hoteles distintos, se crea una variante por hotel. Revisar y corregir en la pantalla de revisión.
6. Unir cada programa de la Guía con su hoja de presupuesto por SKU: la Guía da los textos, el presupuesto da los servicios. Así cada plantilla queda completa (texto + ítems + costos).
7. Generar las traducciones EN e IT de los bloques con IA, usando los PDF de programas ya traducidos como referencia de estilo.
8. Validar el motor de cálculo con 3 casos reales: `SPA UYU - 3D2N - MP` (estándar), `2.0 BOLIVIA 5D4N 9+1` (grupal con TC) y el programa SIVOLA 14+1.

---

## Anexo A — Prompt inicial para Lovable

```
Crea una web app interna en español llamada "Cotizador Uyuni Adventure" conectada a Supabase y a GitHub.
Lee el archivo SPEC.md del repositorio: es la especificación completa y obligatoria.
En esta primera iteración construye SOLO:
1) Auth con Supabase y tabla profiles con role (admin, operacion, vendedor).
2) Layout con sidebar con las pantallas de la sección 10 (pueden quedar vacías salvo las siguientes).
3) CRUD de Tarifario (services y service_rates) con filtros por tipo, país, proveedor y búsqueda por SKU.
4) CRUD de Módulos de actividad y de Bloques diarios (sección 4.3), con pestañas por idioma (traducciones); un bloque se arma con módulos más ítems sueltos del tarifario.
5) CRUD de Plantillas: secuencia ordenada de bloques con drag & drop y SKU generado según la sección 5.
NO implementes el cálculo de precios, el PDF ni el email: los hará otro agente en el módulo /src/lib/pricing.
Usa shadcn/ui, tablas con paginación y un diseño sobrio y rápido.
```

## Anexo B — Tareas en orden para Codex

1. `AGENTS.md`: "Respeta SPEC.md. La lógica de negocio va en /src/lib. Todo cambio de esquema se hace como migración SQL en /supabase/migrations. Escribe tests para pricing."
2. Revisar el esquema creado por Lovable contra §4, completar las tablas faltantes y escribir las políticas RLS según §3.
3. Implementar `/src/lib/pricing` según §6, con tests usando 3 presupuestos reales como fixtures.
4. Pantalla "Nueva cotización" y editor por días conectados al motor de cálculo (§7).
5. Snapshot de bloques e ítems a quote_days y quote_items, overrides, ítems nuevos y "promover al tarifario".
6. Máquina de estados, versiones, pagos, seguimientos y historial.
7. PDF B2C y B2B con `@react-pdf/renderer` (§8).
8. Edge Function de email (Resend) y Edge Function de traducción IA de bloques.
9. Scripts de importación de Fase 0 (§13): tarifario normalizado, proveedores con alias, plantillas con SKU desde el JSON, y extracción IA de hojas sin SKU, con pantalla de revisión.
10. Edge Function programada de recordatorios de seguimiento.
11. (Fase 2) Ficha de SERVICIO, vistas de operación y plan de comunicación (§4.7).
