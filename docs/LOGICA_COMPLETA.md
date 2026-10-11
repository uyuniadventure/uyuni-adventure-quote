# Lógica del cotizador: aplicación en Lovable Cloud

Continuación del PR #1. La base remota no se ha consultado ni modificado. Aplicar estos archivos desde Lovable; las verificaciones de SQL usan PostgreSQL local en memoria (PGlite).

## Orden de ejecución

Requisito: migraciones y seeds 00/01 del PR #1 ya aplicados. No volver a crear las tablas de fundaciones.

1. `supabase/migrations/20261004000300_snapshot_fields.sql`
2. `supabase/migrations/20261004000400_quote_workflows.sql`
3. `supabase/migrations/20261004000500_sales_operations.sql`
4. `supabase/migrations/20261004000600_quote_pdf_storage.sql`
5. `supabase/migrations/20261004000700_email_outbox.sql`
6. `supabase/seed/02_bloques_001.sql`
7. `supabase/seed/02_bloques_002.sql`
8. `supabase/seed/02_bloques_003.sql`
9. `supabase/seed/02_bloques_004.sql`

Completar todas las migraciones antes de usar las nuevas funciones: las RPC de snapshots llaman a las funciones de contexto y Storage incorporadas en las migraciones siguientes. Las migraciones se ejecutan una vez; los seeds tienen `ON CONFLICT DO NOTHING` y pueden repetirse. Los seeds contienen como máximo 300 INSERT de una fila por archivo.

Después, desplegar `translate-block`, `send-quote-email` y `followup-reminders`. Configurar los secretos indicados abajo y los dos valores de Vault antes de ejecutar `supabase/schedules/followup_reminders.sql`. Este último registra un trabajo diario a las 12:00 UTC (08:00/09:00 Santiago según horario de verano); requiere pg_cron, pg_net y Vault en Lovable Cloud. Volver a ejecutarlo actualiza el trabajo por nombre, sin duplicarlo.

## Datos importados y auditoría

Se importan 40 plantillas, 138 días de plantilla, 143 bloques, 143 traducciones españolas y 562 ítems diarios. Todos los catálogos nuevos quedan pendientes y las traducciones sin revisar. No se agregan proveedores ni tarifas: se reutilizan los del PR #1. Las habitaciones alternativas permanecen como variantes; el motor cobra únicamente los tipos ocupados según el rooming.

Los SKU explícitos en los nombres de las hojas se normalizan y se enlazan, incluso cuando `sku_tpl` está vacío. Se registra la discrepancia ÑÑF/MÑF de la fuente. Las columnas repetidas de pax se deduplican por día, SKU canónico e inclusión; los alias de tramos apuntan al mismo servicio. Los servicios multi-día se expanden con una clave de compra común. No se deducen precios ni proveedores de descripciones libres. Las rutas diarias solo incluyen el origen inicial y destino final conocidos; no se inventan paradas intermedias.

Faltan presupuestos para estas 12 plantillas:

`SPAUYU-3D2N-HK`, `SPASPA-4D3N-ScRF`, `SPASPA-4D3N-FJM`, `SPASPA-4D3N-FJJ`, `SPASPA-4D3N-ScLM`, `SPASPA-4D3N-ScJF`, `SPASPA-4D3N-ScJTd`, `UYUUYU-3D2N-PF`, `UYUUYU-3D2N-ÑF`, `UYUUYU-3D2N-CkHj`, `UYUSPA-3D2N-LM`, `UYUSPA-3D2N-KDr`.

Hay 234 filas de presupuesto con SKU vacío (incluyen notas de cobertura y exclusiones); ningún SKU no vacío del conjunto enlazado quedó sin encontrar en el tarifario. No se crea un servicio inventado para esas filas. La auditoría completa, con hoja e índice de ítem, está al final de `02_bloques_004.sql` y en `supabase/seed/blocks-report.json`. Se registran también seis programas duplicados, con SKU inválido o duración contradictoria, y dos presupuestos ambiguos descartados.

**BLOQUES SPA no aparece en las 75 hojas de la extracción suministrada.** Se deja constancia en ambos archivos de auditoría; no se fabrican activity_modules. El modelo, las RPC de cotización y la traducción sí admiten módulos y sus ítems cuando se cargue esa hoja.

Cada plantilla lleva `import_warnings`. Se copian a `quotes.pricing_config.unresolved`; un revisor debe resolver las carencias y vaciar esa lista antes de marcar la cotización revisada. Además debe aprobar los catálogos pendientes para que otros vendedores puedan usarlos, conforme a RLS.

## API TypeScript

`Tables<T>` y `Enums<T>` proceden de `src/types/db.ts`, generado desde el catálogo de todas las migraciones locales. Las escrituras usan el cliente y la sesión de Lovable, con tipos extendidos en `src/lib/db.ts`. No se modifica `src/integrations`.

```ts
// src/lib/pricing (puro)
calculateQuote(input: QuoteInput): QuoteResult
dateForDay(start: string, day: number): string
selectRate(item: PricingItem, date: string, pax: number,
  seasons?: QuoteInput["seasons"]): Rate

// src/lib/quotes
createQuoteFromTemplate(templateId: string, basics: QuoteBasics): Promise<Tables<"quotes">>
createEmptyQuote(basics: QuoteBasics): Promise<Tables<"quotes">>
updateQuoteItem(itemId: string, changes: QuoteItemChanges): Promise<{
  quote_id: string; item: Tables<"quote_items">
}>
addQuoteItem(quoteDayId: string, item: QuoteItemInput, promoteToMaster: boolean): Promise<{
  quote_id: string; item: Tables<"quote_items">
}>
recalculateQuote(quoteId: string): Promise<QuoteResult>
generateQuoteCode(quote: { tour_sku: string; language: string }): Promise<string>
promoteQuoteToTemplate(quoteId: string): Promise<string>
loadQuote(quoteId: string): Promise<{
  quote: Tables<"quotes">; days: Tables<"quote_days">[]; items: Tables<"quote_items">[]
}>
quotePricingInput(data: Awaited<ReturnType<typeof loadQuote>>): QuoteInput

// src/lib/states
transitionQuote(quoteId: string, to: Enums<"quote_status">,
  note?: string): Promise<Tables<"quotes">>

// src/lib/pdf
generateQuotePdf(quoteId: string): Promise<Blob>
QuoteDocument(props: { data: QuotePdfData }): React.JSX.Element

// src/lib/ops
buildSupplierPayables(serviceId: string): Promise<Tables<"ops_supplier_payables">[]>
computeRealMargin(serviceId: string): Promise<Tables<"ops_services">>
generateCommunicationPlan(serviceId: string): Promise<Tables<"ops_communications">[]>

// Adaptador interno src/lib/db
json(value: unknown): Json
unwrap<T>(result: { data: T; error: { message: string } | null }): NonNullable<T>
// db: SupabaseClient<Database>
```

Tipos exportados: `Rate`, `Rooming`, `PricingItem`, `PaxScenario`, `QuoteInput`, `ItemResult`, `QuoteTotals`, `QuoteResult`, `QuoteBasics`, `QuoteItemInput`, `QuoteItemChanges`, `DocumentContent` y `QuotePdfData`.

### Contrato del cálculo y del editor

- `margin_pct: 20` significa recargo del 20% sobre costos elegibles. `fx_snapshot` contiene unidades nativas por USD, incluido `USD: 1`; los importes siempre se dividen por ese tipo de cambio. El caller suministra la configuración congelada al crear la cotización; recalcular nunca consulta FX ni tarifas vivas.
- `rooming: { paying: { DBL_TWN: 7 }, tc: { SGL: 1 } }`; `vehicles: { bolivia: 4 }`; el ítem de vehículo indica `pricing_snapshot.vehicle_segment: "bolivia"`. No se elige automáticamente cantidad ni vehículo. El editor debe confirmar este campo para cada tramo. Los servicios importados conservan `vehicle_type` como clave inicial.
- `staff: { drivers: 4, guides: 1 }`; cada ítem `per_staff` indica `staff_type: "drivers" | "guides"`. `nights` multiplica habitaciones; usar una noche para un alojamiento que ya aparece cada día.
- `pricing_snapshot.rates` congela todas las tarifas del servicio. El motor selecciona fecha, habitación y tramo de usuarios efectivos. Acepta temporadas con fechas explícitas o el calendario `seasons: [{from,to,season}]`; rechaza tarifas ausentes o ambiguas. No inventa fechas para DRY/RAIN sin un calendario.
- Un precio manual necesita `price_overridden`, `unit_cost_original` y `override_note`. Para ítems nuevos sin tarifa, facilitar esos campos o una tarifa congelada. Promover al maestro crea un servicio pendiente si el autor es vendedor; no concede permiso para escribir tarifas maestras.
- Una compra multi-día comparte `coverage_key` y `coverage_start_day`. El primer día paga; los demás son copias incluidas de costo cero. Las altas de ítems y la creación desde módulos expanden esas copias. Cambiar su precio propaga los campos de cálculo a las copias de esa compra.
- `single_supplements` contiene costos SGL/DBL, moneda, noches y elegibilidad de margen. Se calcula `(SGL - DBL / 2) * noches` convertido a USD y con el margen correspondiente.
- `rounding_rule: {mode: "ceil" | "nearest" | "none", increment: 1, per_pax?: boolean}`. `per_pax: true` redondea la cuota y reconstruye el total. Los escenarios llevan su propio rooming, TC, vehículos y opcionalmente staff.
- `createEmptyQuote` crea la cabecera; el CRUD autorizado de `quote_days` permite agregar días antes de `addQuoteItem`. Leer `quote_id` devuelto por las mutaciones: puede ser una versión nueva.
- Las cotizaciones enviadas son inmutables. La RPC clona cabecera/días/ítems, archiva la anterior y asigna `-vN` dentro de una transacción. La edición directa se rechaza e indica usar una versión. Las vendidas/perdidas no se versionan.
- `recalculateQuote` usa control optimista por `updated_at`. Editar cabecera, días o ítems invalida cálculo y PDF. Los triggers y RLS se aplican también si el caller evita la biblioteca.
- `generateQuoteCode` reserva un correlativo; la creación normal ya lo reserva atómicamente. No llamarlo antes de `createQuoteFromTemplate`/`createEmptyQuote`, pues dejaría un hueco innecesario.
- `promoteQuoteToTemplate` copia textos e ítems congelados a una plantilla pendiente con sufijo `COPY-<id>` para evitar colisiones. Revisar su SKU comercial antes de aprobarla.
- Registrar un depósito requiere `enviada`, convierte a `vendida` y crea una sola ficha con sus costos por ítem. Los pagos y el historial son append-only. Operación puede actualizar costos reales y reservas; las cuentas por proveedor preservan los pagos ya registrados al recalcular y contemplan cancelaciones.

### PDF y traducciones

El diseño usa la jerarquía azul/arena/naranja de los PDF en `docs/referencias`. Exporta únicamente datos de cotización; nunca consulta pasajeros operativos. Los PDFs se guardan en el bucket privado `quote-pdfs`, con nombres inmutables. `pdf_url` es un enlace firmado de siete días; `pdf_path` permite descargar el archivo desde Storage con la sesión correspondiente, incluso después de que expire el enlace. No sobreescribir objetos.

`document_snapshot` admite introducción, guía, foto de portada, fotos por día (`day_photos["1"]`), etiquetas de ítems (`item_labels[sku]`), enlace de T&C B2C, pago EUR y texto de pago/cancelación. El contexto de cliente, T&C seleccionados, bancos e información por destino se copia al crear la cotización mediante una RPC restringida al dueño/admin; los catálogos administrativos mantienen su RLS. Usar URLs de fotos inmutables y accesibles al generador. El repositorio no contiene fotos ni datos bancarios reales para completar esos valores.

Etiquetas y mensajes predefinidos: español, inglés e italiano. Otros idiomas requieren añadir sus etiquetas; no hay fallback silencioso a español. Las traducciones faltantes de bloques/módulos se solicitan a `translate-block`, se guardan sin revisión y bloquean el PDF hasta que el vendedor las revise. Para nombres de servicios en inglés/italiano, suministrar `item_labels` traducidos; el PDF rechaza etiquetas faltantes. T&C y los textos libres también deben estar en el idioma del cliente.

Los hitos de `payment_schedule` se representan con `{ date, amount_pct, note, penalty }`; `note` y `penalty` son texto localizado. Se muestran depósito, saldo y fecha límite; los ítems excluidos con `pricing_snapshot.is_optional = true` y precio se cotizan aparte. Las fotos de portada/día/hotel se muestran cuando existen en el snapshot. Los cinco hitos operativos se crean como mensajes pendientes, sin enviarlos; Operación completa horarios/enlaces oficiales antes del envío.

## Edge Functions y secretos

| Variable | Uso |
| --- | --- |
| `RESEND_API_KEY` | Clave de Resend, solo en Edge |
| `RESEND_FROM` | Remitente del dominio verificado, por ejemplo `Uyuni Adventure <info@uyuniadventure.com>` |
| `LLM_API_KEY` | Clave de Anthropic para la API Messages; nunca frontend |
| `LLM_MODEL` | ID de modelo habilitado en esa cuenta, configurado por el administrador |
| `FOLLOWUP_CRON_SECRET` | Token aleatorio exclusivo para el cron; mismo valor en Vault `uyuni_followup_cron_secret` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Variables del proyecto suministradas por Lovable/Supabase a Edge; verificar disponibilidad, no copiar al frontend |

Vault necesita además `uyuni_functions_url` (URL base `/functions/v1` del proyecto real). No usar la URL de otro proyecto ni sustituir la conexión que gestiona Lovable. El único endpoint sin verificación JWT de gateway es el cron, que valida su token dedicado; los otros además verifican la sesión mediante `auth.getUser()`.

Requests POST:

- `send-quote-email`: `{ quoteId, recipient?, subject?, body? }`. Los valores omitidos salen del snapshot y de plantillas es/en/it; asunto/cuerpo son editables. Requiere cotización revisada y PDF vigente. Crea un outbox duradero, adjunta el archivo autorizado por Storage RLS, usa el ID del outbox como clave de idempotencia de Resend y confirma estado/historial en SQL. Los reintentos deben conservar el mismo cuerpo/destinatario. Un timeout mantiene pendiente y congela la cotización; reintentar antes de 23 horas. Después se exige reconciliar el recibo en Resend mediante administración: no se intenta un nuevo envío a ciegas fuera de la ventana de idempotencia del proveedor.
- `translate-block`: `{ kind: "day_block" | "activity_module", id, language }`. Verifica acceso con el JWT antes de usar el LLM. Traduce solamente campos de texto, valida JSON, no reemplaza traducciones existentes/revisadas y guarda `reviewed: false`.
- `followup-reminders`: `{}`, cabecera `x-cron-secret`. Agrupa seguimientos de hoy/vencidos en Santiago, consulta el email de cada vendedor mediante Auth en servidor y persiste un resumen por vendedor/día. Repetir el cron no duplica el correo dentro de la ventana de reintento.

Firmas internas de `supabase/functions/_shared/runtime.ts`:

```ts
secret(name: string): string
response(value: unknown, status?: number): Response
serve(handler: (request: Request) => Promise<Response>): void
admin(): SupabaseClient
authenticated(request: Request): Promise<{ client: SupabaseClient; user: User }>
must<T>(result: {data: T; error: {message: string} | null}): NonNullable<T>
resend(payload: unknown, key: string): Promise<string>
base64(bytes: Uint8Array): string
```

## Verificación y pendientes

```sh
bun install
bun run typecheck
bun run test
bun run test:db
bun run build
# Deno 2 en PATH, o sustituir deno por bunx deno:
bun run check:edge
bun run test:edge
```

Las pruebas PostgreSQL cubren RLS, semillas idempotentes, snapshots, versiones con ítems idénticos, cálculo obsoleto, depósitos repetidos, márgenes reales, conservación de pagos, cinco hitos idempotentes, Storage privado y outbox. Las pruebas de transporte Edge simulan Resend: no se han enviado correos ni consumido el LLM real. Los PDF de prueba se generan en `tmp/pdfs` (ignorado por Git) y se revisaron visualmente.

Los tres tests históricos están activos en `src/lib/pricing/real-cases.test.ts`, con fixtures en `tests/fixtures`. SPA UYU MP (2 pax) coincide con el Excel: costo USD 1.939, FX CLP/USD 925,92. Bolivia 9+1 y el caso reemplazado por la hoja WE ROAD 10D siguen fallando por datos sin confirmar; muestran el detalle en `docs/pendientes/comparacion_presupuestos.txt`. La fuente actual de Bolivia muestra costo 9.179 y venta 12.179 (añade 3.000 fijos), frente a la antigua venta PDF 12.924. WE ROAD muestra 14 pax y 3 vehículos, sin acreditar TC; no valida el anterior programa SIVOLA 14+1, 4 vehículos, venta 28.057. No se inventaron costos ni se modificó el motor para igualar estos totales.

Pendientes externos: importación de BLOQUES SPA; revisión de los registros de importación; configuración verificable de los dos fixtures grupales; fotos, textos, T&C y datos bancarios reales; secretos, despliegue y cron en Lovable Cloud; prueba real de Storage/Resend/LLM en ese entorno. La conexión de estas funciones a la interfaz corresponde a Lovable; no se modificaron rutas, componentes ni integraciones.

Referencias de API: [react-pdf v4](https://react-pdf.org/docs/v4/advanced), [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email), [Anthropic Messages](https://platform.claude.com/docs/en/api/messages/create).
