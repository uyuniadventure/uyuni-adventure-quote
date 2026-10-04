# Kit de prompts — Cotizador Uyuni Adventure

Repo: `https://github.com/uyuniadventure/uyuniadventure.cotizador`

Usa un prompt a la vez, en el orden indicado. Después de cada uno, haz la **verificación** antes de seguir.

---

## 0. Conexiones (manuales: no se hacen con prompts)

Las integraciones entre cuentas requieren autorizar con un clic, así que ningún prompt puede hacerlas por ti. Codex y Lovable **no se conectan entre sí**: los dos trabajan sobre el **mismo repo de GitHub**, y ese es el punto de unión.

```
Lovable ──► GitHub (main) ◄── Codex (ramas + Pull Requests)
   │
   └──► Supabase (base de datos, auth, storage)
```

1. **Lovable → GitHub:** en el proyecto de Lovable, abre la integración de GitHub y autoriza la organización `uyuniadventure`.
   - Si Lovable permite vincular el repo existente `uyuniadventure.cotizador`, úsalo.
   - Si solo permite crear un repo nuevo, deja que lo cree y usa ese (el repo que creaste está vacío, así que no se pierde nada).
2. **Lovable → Supabase:** en la integración de Supabase, elige el proyecto **nuevo** del cotizador.
3. **Codex → GitHub:** en Codex, conecta tu cuenta de GitHub, da acceso a la organización y selecciona el repo que quedó vinculado a Lovable. Crea un entorno para ese repo.
4. **Variables de entorno en Codex:** agrega `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_DB_URL` (las encuentras en la configuración del proyecto Supabase). La clave `service_role` va solo como secreto de las Edge Functions, nunca en el código.
5. **Archivos base:** sube al repo (desde GitHub, "Add file"):
   - `SPEC.md`
   - `AGENTS.md` (contenido en la sección 1 de este documento)
   - `/docs/fase0/tarifario_normalizado.csv`
   - `/docs/fase0/extraccion_presupuestos_standard.json`
   - `/docs/fase0/guia_productos_extraida.json`

**Verificación:** en GitHub ves los archivos; en Lovable, el proyecto muestra Supabase y GitHub conectados.

---

## 1. Contenido de `AGENTS.md` (para Codex)

```markdown
# Reglas para agentes de código

## Contexto
Web app interna de cotización y operación para Uyuni Adventure. La especificación completa y obligatoria está en SPEC.md. Léela antes de cada tarea.

## Stack
React + Vite + TypeScript + Tailwind + shadcn/ui (frontend generado por Lovable), Supabase (Postgres, Auth, RLS, Storage, Edge Functions).

## Reglas
1. Trabaja siempre en una rama nueva (`codex/<tarea>`) y entrega un Pull Request. Nunca hagas push directo a main.
2. Todo cambio de esquema se hace como migración SQL en /supabase/migrations, con nombre fechado. Nunca modifiques tablas desde el código de la app.
3. Toda tabla nueva lleva políticas RLS según la sección 3 de SPEC.md.
4. La lógica de negocio va en /src/lib (pricing, sku, states). Los componentes de UI no calculan precios.
5. /src/lib/pricing es TypeScript puro con tests (Vitest). Todo cambio en pricing requiere tests que pasen.
6. No modifiques el diseño visual de los componentes creados por Lovable salvo que la tarea lo pida.
7. Nunca pongas claves secretas en el frontend. La service_role key solo se usa en Edge Functions.
8. Moneda de venta: USD. Los costos se guardan en su moneda original y se convierten con el tipo de cambio congelado en la cotización.
9. Al terminar, resume en el PR qué cambió, qué migraciones hay que aplicar y cómo probarlo.
```

---

## 2. Knowledge del proyecto en Lovable

Pega esto en el Knowledge (instrucciones del proyecto) de Lovable, junto con el contenido completo de `SPEC.md`:

```
Proyecto: Cotizador Uyuni Adventure. La especificación está en SPEC.md y es obligatoria.
Tu rol: construir pantallas, navegación, formularios y tablas.
Reglas:
- UI en español, diseño sobrio, rápido, pocos clics.
- No implementes cálculos de precios: usa las funciones de /src/lib/pricing (las escribe otro agente). Si aún no existen, deja un placeholder que muestre "pendiente".
- Después de la primera iteración, NO modifiques el esquema de la base de datos. Si una pantalla necesita un campo nuevo, avísame qué campo y en qué tabla, sin crearlo.
- No toques archivos en /src/lib ni /supabase/migrations.
```

---

## 3. Prompts para Lovable (en orden)

### L1 — Esqueleto, auth y tarifario
```
Lee SPEC.md. Construye la primera iteración del "Cotizador Uyuni Adventure":
1) Auth con Supabase (email y contraseña) y tabla profiles con role: admin, operacion, vendedor. Un usuario sin rol no ve nada.
2) Layout con sidebar y todas las pantallas de la sección 10 (las que no se construyen ahora muestran "En construcción").
3) Esquema inicial de la sección 4.1 (currencies, exchange_rates, suppliers, services, service_rates, service_change_requests, hotel_codes, location_codes).
4) Pantalla Tarifario: tabla paginada con búsqueda por SKU y nombre, filtros por tipo, país, proveedor y estado; ficha de servicio con sus tarifas por temporada y tramo de pax.
5) Pantalla Proveedores: lista y ficha.
Permisos: vendedor puede ver y crear servicios (quedan "pendiente"), pero no editar tarifas; en su lugar ve un botón "Sugerir cambio".
```
**Verificación:** entras con 3 usuarios de distinto rol y cada uno ve y puede hacer lo que indica la sección 3.

### L2 — Módulos, bloques y plantillas
```
Construye las pantallas de la sección 4.3 y 4.4 de SPEC.md (las tablas ya existen o las creará Codex; si falta alguna, avísame en lugar de crearla):
1) Módulos de actividad: lista, ficha con pestañas por idioma (ES, EN, IT) y lista de servicios del tarifario que lo componen.
2) Bloques diarios: lista con filtros (ruta, lugar, hotel, estado), ficha con pestañas por idioma, módulos ordenados con hora, y servicios sueltos marcados como incluido / no incluido.
3) Plantillas: lista con búsqueda por SKU parcial y filtros (origen, destino, días, categoría, hoteles); editor de días con drag & drop de bloques; acciones duplicar, editar y crear desde cero.
4) Pantalla "Revisión de importación": lista de elementos en estado pendiente con vista previa y botones Aprobar / Editar / Rechazar.
```
**Verificación:** puedes armar una plantilla de 3 días a mano arrastrando bloques.

### L3 — Pantalla Nueva cotización (solo interfaz)
```
Construye la interfaz de la sección 7 de SPEC.md:
1) Paso 1, datos básicos: cliente (buscar o crear), B2B/B2C, idioma, fecha de inicio, pax pagantes, TC, modalidad, origen, destino, días, categoría.
2) Paso 2, plantillas sugeridas según los datos, o "empezar desde cero".
3) Paso 3, editor por días: bloques, hotel (al elegir hotel, mostrar sus tipos de habitación y tarifas), servicios con interruptores "incluido", "aplica TC", "aplica margen", sobrescribir precio con nota, crear ítem nuevo con opción "agregar al tarifario".
4) Panel lateral con: rooming, vehículos, staff (choferes, guías), margen %, tipo de cambio, escenarios de pax para B2B.
5) Los totales del panel llaman a calculateQuote() de /src/lib/pricing. Si no existe aún, muestra "cálculo pendiente".
```
**Verificación:** puedes armar una cotización completa en pantalla (aún sin precios).

### L4 — Detalle de cotización, dashboard y clientes
```
Construye:
1) Detalle de cotización: pestañas Itinerario, Precios, Versiones, Pagos, Seguimientos, Emails, Historial. Botones según estado (sección 7): Marcar revisada, Enviar, Registrar pago, Marcar perdida (motivo obligatorio), Nueva versión, Promover a plantilla.
2) Lista de cotizaciones con búsqueda por código o SKU y filtros por estado, vendedor, cliente y fechas.
3) Dashboard: cotizaciones por estado, seguimientos de hoy y vencidos, ventas del mes (precio, costo, margen).
4) Clientes y T&C: CRUD de clientes (B2B/B2C, idioma) y textos de términos por tipo, cliente e idioma; info_blocks y datos bancarios (solo admin).
5) Media: subir fotos a Supabase Storage y asignarlas a un lugar o a un hotel.
```
**Verificación:** flujo completo de estados probado con una cotización de prueba.

### L5 — Operación (solo cuando el cotizador esté estable)
```
Construye las pantallas de la sección 4.7 de SPEC.md: ficha de SERVICIO (ítems con estado de reserva y pick-up, costos y pagos a proveedores, pasajeros, plan de comunicación), vista de reservas de alojamiento activas, pagos a proveedores pendientes y resumen de servicios. Los datos de pasajeros solo son visibles para operación y admin.
```

---

## 4. Prompts para Codex (en orden)

Cada prompt genera un Pull Request. Revísalo, mézclalo en `main` y aplica las migraciones en Supabase antes de pasar al siguiente.

### C1 — Revisión del esquema y seguridad (después de L1)
```
Lee SPEC.md y AGENTS.md. Revisa el esquema creado por Lovable contra la sección 4 completa (4.1 a 4.7). Crea como migraciones todas las tablas, campos, enums e índices faltantes, incluidas las de Fase 2. Escribe las políticas RLS según la sección 3 para todas las tablas (ops_passengers solo operacion y admin). Agrega tipos TypeScript generados desde el esquema en /src/types/db.ts. Entrega un PR con la lista de migraciones y cómo aplicarlas.
```

### C2 — Importación del tarifario (después de limpiar el CSV)
```
Implementa en /scripts/import un script de importación (Node + TypeScript, ejecutable con npm run import:tarifario) según la sección 13 de SPEC.md:
- Lee docs/fase0/tarifario_normalizado.csv.
- Crea suppliers únicos normalizando nombres (mayúsculas, espacios) y guarda los alias.
- Agrupa las filas que son tramos de pax del mismo servicio en un solo service con varias service_rates.
- Omite filas cuya columna issues contenga sku_dup o mismo_servicio_en_2_monedas, y escríbelas en un reporte /scripts/import/report.csv.
- Marca como "sin costo neto" las tarifas que solo tienen price_rack.
- Carga hotel_codes (sección 4.1) y location_codes (sección 5).
- Es idempotente (se puede correr varias veces sin duplicar), usando sku como clave.
```

### C3 — Módulos, bloques y plantillas desde la Guía y los presupuestos
```
Implementa npm run import:bloques según la sección 13 de SPEC.md:
1) Crea activity_modules desde los grupos de la hoja BLOQUES SPA (incluidos en extraccion_presupuestos_standard.json o, si no, déjalo como tarea pendiente en el PR).
2) Desde docs/fase0/guia_productos_extraida.json, crea un day_block por cada elemento de bloques_candidatos (traducción ES), con variantes por hotel cuando el mismo texto aparece con alojamientos distintos.
3) Crea itinerary_templates desde programas: SKU normalizado (sección 5), días en orden con su bloque, incluye / no incluye.
4) Une cada plantilla con su presupuesto por SKU en extraccion_presupuestos_standard.json y crea los day_block_items con los SKU del tarifario. Los servicios multi-día (transporte 3D2N, 4D3N) se cargan una vez con multi_day_span.
5) Todo queda en estado pendiente. Genera un reporte de plantillas sin presupuesto y de SKU no encontrados en el tarifario.
```

### C4 — Motor de cálculo
```
Implementa /src/lib/pricing según la sección 6 de SPEC.md, en TypeScript puro, con la función calculateQuote(input): QuoteResult y los tipos exportados.
Debe cubrir: tarifa por fecha y temporada, tramos de pax, conversión con fx_snapshot, unidades per_person / per_group / per_vehicle / per_room / per_staff / per_unit, TC por ítem, servicios multi-día, margen solo en ítems con margin_applicable, precio por pax pagante, redondeo, suplemento single y escenarios por pax.
Escribe tests con Vitest usando 3 fixtures en /src/lib/pricing/__fixtures__ que reproduzcan estos casos reales:
- Estándar: SPA UYU 3D2N MP, 2 pax.
- Grupal: Bolivia 5D4N, 9 pax + 1 TC, base twin (total esperado USD 12.924, por persona USD 1.436, suplemento single USD 550).
- Grupal: SIVOLA Chile-Bolivia 10D, 14 pax + 1 TC gratuito, 7 TWN + 1 SGL, 4 vehículos 4x4 (total esperado USD 28.057, por persona USD 2.004).
Los costos de los fixtures los tomaré de los Excel; deja los fixtures con la estructura lista y marca con TODO los valores que debo completar.
```
Completa tú los costos de los fixtures desde tus Excel y pide a Codex que haga pasar los tests.

### C5 — Conectar el cotizador al motor (después de L3)
```
Conecta la pantalla Nueva cotización (creada por Lovable) con calculateQuote(). Implementa en /src/lib/quotes:
- Creación de la cotización como snapshot: copiar bloques, textos traducidos e ítems a quote_days y quote_items (sección 4.6). Los cambios en la cotización nunca modifican plantillas ni tarifario.
- Overrides de precio con nota, ítems nuevos y "agregar al tarifario" (queda pendiente si lo crea un vendedor).
- Generación del código de cotización (sección 5) con correlativo por año.
- Recalcular y guardar totales (costo, margen, precio, por pax) en cada cambio.
No cambies el diseño de las pantallas.
```

### C6 — Estados, versiones, pagos y seguimientos (después de L4)
```
Implementa la máquina de estados de la sección 7 en /src/lib/states con validación también en base de datos (función o trigger): borrador → revisada → enviada → vendida | perdida. Editar una enviada crea nueva versión (-v2). Registrar un pago tipo deposito pasa a vendida y crea el registro de ops_services con sus ops_items (sección 4.7). Guarda cada cambio en quote_status_history.
```

### C7 — PDF B2C y B2B
```
Implementa la generación de PDF con @react-pdf/renderer según la sección 8 de SPEC.md, en /src/lib/pdf, con dos plantillas (B2C y B2B) y el idioma del cliente. Incluye: resumen de vuelos y de alojamientos automáticos (B2B), fotos desde Storage por lugar y hotel (B2C), condiciones de pago, datos bancarios, info_blocks y T&C. El PDF se sube a Storage y se guarda su URL en la cotización. Usa como referencia visual los programas en /docs/referencias (los subiré ahí).
```
Antes de este prompt, sube a `/docs/referencias/` los PDF de ejemplo: el 5D4N, el de SIVOLA y el correo de Laura.

### C8 — Email y traducción IA
```
Implementa dos Edge Functions de Supabase:
1) send-quote-email: envía con Resend el email (plantilla por idioma y tipo de cliente) con el PDF adjunto, registra en quote_emails y pasa la cotización a enviada.
2) translate-block: traduce un day_block o activity_module al idioma pedido con un LLM, guarda la traducción con reviewed = false. Las claves van como secretos de Supabase.
Documenta en el PR qué secretos hay que configurar.
```

### C9 — Recordatorios de seguimiento
```
Implementa una Edge Function programada (diaria) que envíe a cada vendedor un email con sus seguimientos del día y los vencidos, según quote_followups y next_followup_at.
```

### C10 — Operación (después de L5)
```
Implementa la lógica de la sección 4.7: agrupación automática de ops_supplier_payables por proveedor desde ops_items, cálculo de costo real y margen real, generación del plan de comunicación con los 5 hitos estándar según las fechas del servicio, y las vistas de reservas de alojamiento activas y pagos pendientes.
```

---

## 5. Orden completo resumido

| # | Herramienta | Prompt | Antes de seguir |
|---|---|---|---|
| 1 | Manual | Sección 0 | Conexiones listas, archivos en el repo |
| 2 | Lovable | L1 | Login y roles funcionan |
| 3 | Codex | C1 | PR mezclado, migraciones aplicadas |
| 4 | Tú | Limpiar CSV y Guía | Columna `issues` resuelta |
| 5 | Codex | C2 | Tarifario visible en la app |
| 6 | Lovable | L2 | Pantallas de bloques y plantillas |
| 7 | Codex | C3 | Revisas y apruebas los 10 tours más vendidos |
| 8 | Codex | C4 | Tests con los 3 casos reales en verde |
| 9 | Lovable | L3 | Interfaz de cotización |
| 10 | Codex | C5 | Cotización real cuadra con el Excel |
| 11 | Lovable | L4 | Detalle, dashboard, clientes |
| 12 | Codex | C6 | Flujo de estados completo |
| 13 | Codex | C7 + C8 + C9 | Envías un PDF real a tu correo |
| 14 | Tú | Prueba en paralelo con Excel (1-2 semanas) | Precios coinciden |
| 15 | Lovable + Codex | L5 + C10 | Operación |
