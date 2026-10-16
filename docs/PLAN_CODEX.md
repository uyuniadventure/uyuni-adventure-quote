# PLAN_CODEX — Cotizador Uyuni Adventure

> Archivo de trabajo para Codex. Guardarlo en `docs/PLAN_CODEX.md`.
> Estado del repo revisado: `main` en `f54c82a` (12-10-2026).
> Primera ejecución del plan: base `main` en `186740c` (12-10-2026); ver comprobación de T00.
> Codex ejecuta **una tarea por vez, en orden**, y se detiene al final de cada una.

---

## 0. Cómo trabaja Codex con este archivo

1. Lee `AGENTS.md`, `SPEC.md` y este archivo completos antes de empezar.
2. Busca la **primera tarea con estado `[ ]`** cuyas dependencias estén en `[x]`. Haz solo esa.
3. Rama `codex/<id-tarea>-<nombre>` desde `main` actualizado. Nunca push a `main`, nunca force push, nunca rebase de commits publicados.
4. Al terminar la tarea, en el mismo PR, cambia su estado en este archivo de `[ ]` a `[~]` (en revisión). Andrea lo pasa a `[x]` al hacer merge.
5. Si la tarea tiene un **ALTO**, entrega lo pedido para revisión y no sigas hasta recibir "OK" de Andrea.
6. Si algo del plan no coincide con el código real, sigue el código real y explícalo en el PR. No inventes tablas ni funciones: busca primero con `grep`.
7. Codex no tiene acceso a la base. Todo cambio de base va como migración fechada en `supabase/migrations/` y debe aplicarse en Lovable Cloud (ver sección 2).
8. No subas al repo archivos con datos personales de pasajeros (nombres, nacimiento, pasaportes, teléfonos) ni datos bancarios. Si un archivo de referencia los tiene, bórralos de la copia antes de commitear.
9. Verificación mínima antes de abrir el PR: `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bunx vitest run`. Si la tarea toca la base, también `bun run test:db`.

---

## 1. Formato de entrega de cada tarea (obligatorio)

Al final de cada tarea, Codex responde **exactamente** con este formato:

```
=== RESULTADO TAREA <id> ===
Rama / PR: <nombre> / <enlace>
Qué cambió: <3 a 6 líneas>
Tests: <n en verde> / <n total> · tsc: OK|ERROR
Migraciones nuevas (en orden): <lista o "ninguna">
Decisiones pendientes para Andrea: <lista o "ninguna">

=== PROMPT PARA LOVABLE ===
<texto listo para pegar en Lovable, o "No hace falta Lovable en esta tarea">

=== SIGUIENTE TAREA ===
<id y nombre de la próxima tarea pendiente>
```

---

## 2. Plantilla del PROMPT PARA LOVABLE

Cuando la tarea necesita pantalla o migraciones aplicadas, Codex arma el prompt con esta estructura, usando nombres reales de archivos y funciones del PR ya mergeado:

```
[Lovable] Después del merge del PR <n> (<rama>).

PASO 1 · Base de datos (solo si hay migraciones)
Aplica en Lovable Cloud estas migraciones de supabase/migrations, en este orden, y confirma
cada una: <lista>. Si alguna ya estaba aplicada, dímelo y sigue con la siguiente.
Después regenera los tipos de Supabase.

PASO 2 · Pantalla
Archivo: <ruta del componente>.
<Qué ver y qué hacer, en lista corta.>
Funciones que debes usar (no calcules nada en la UI): <lista de funciones de src/lib>.
No cambies el resto del diseño. Colores solo por tokens de src/styles.css.

PASO 3 · Cómo lo pruebo
<2 a 4 pasos concretos que Andrea puede hacer en la vista previa.>
```

Reglas para ese prompt:
- Lovable solo hace UI. Toda lógica, cálculo o escritura atómica ya debe existir en `src/lib` antes de pedir la pantalla.
- Si no hace falta pantalla pero sí migraciones, el prompt solo lleva PASO 1 y PASO 3.

---

## 3. Lista de tareas en orden

| # | Tarea | Estado | Depende de | Lovable |
|---|---|---|---|---|
| T00 | Arreglar CI (bun.lock con registro privado) | [~] | — | no |
| T01 | Paso 2 de Nueva cotización no sugiere plantillas | [ ] | T00 | sí (migraciones) |
| T01b | Revisión de textos del día dentro de la cotización (PDF bloqueado) | [~] | T00 | sí |
| T01c | Crear cotización desde /plantillas | [ ] | T01 | sí |
| T02 | Sacar quote-ops.ts y limpiar migración con placeholder | [ ] | T00 | sí (migraciones) |
| T03 | Política de precio única (margen, imprevistos, canal B2B/B2C) | [ ] | T02 | sí |
| T04 | Importador con unidades inferidas + casos 9+1 y WE ROAD (ALTO) | [ ] | T03 | no |
| T05 | Fixtures de octubre: Melting, WeRoad x2, Pellegrini (ALTO) | [ ] | T04 | no |
| T06 | Reglas de cantidad por pax (vehículos, guía escalonada) | [ ] | T03 | sí |
| T07 | Suplemento single | [ ] | T03 | sí |
| T08 | Tabla de precios por tramo de pax | [ ] | T05, T06 | sí |
| T09 | Crear cotización desde bloques de día | [ ] | T02 | sí |
| T10 | Editor de días: ajuste masivo, enlaces, grupos, guardar bloque | [ ] | T09 | sí |
| T11 | Condiciones de pago, extras opcionales y resumen de pagos | [ ] | T03 | sí |
| T12 | Control de la propuesta antes de PDF y email | [ ] | T11 | sí |
| T13 | Plantilla de propuesta B2C y B2B (PDF + email) | [ ] | T11, T12 | sí |
| T14 | Moneda de presentación (EUR/CLP) | [ ] | T13 | sí |
| T15 | Programas automáticos por firma | [ ] | T09 | no |
| T16 | Seguimientos programados | [ ] | T13 | sí |
| T17 | Dashboard | [ ] | T11 | sí |
| T18 | Roles y permisos verificados | [~] | — | sí (si cambia /admin) |
| T19 | E2E de los dos caminos con las funciones nuevas | [ ] | T01–T17 | no |
| T20 | Inventario final | [ ] | todo | no |

Ya hecho en `main` (no repetir): rack como neto, defaults de habitación y vehículo, importador SPAUYU, aprobación masiva, días trazables con snapshot y overrides, creación atómica desde plantilla, ajuste % por línea (`applyAdjustmentBulk` en lib), listado, estados e historial, pagos con depósito y paso a Operación (`quote-payments.tsx`), botones PDF y email (`quote-delivery.tsx`), depósito % por cliente y en `pricing_settings`, E2E con Playwright (falla en CI, ver T00).

---

## T00 · Arreglar CI (bun.lock con registro privado)

**Problema.** El workflow "Cotización E2E" falla en `main` y en todas las ramas. `bun.lock` tiene 13 paquetes resueltos a `https://europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/...` (y uno a `europe-west1`), registro privado de Lovable, inaccesible desde GitHub Actions. Paquetes: `@supabase/*` (8), `@dnd-kit/*` (4), `iceberg-js`, `@lovable.dev/vite-tanstack-config`. Todos existen en npm público.

**Hacer.**
1. En `bun.lock`, reemplaza cada URL de `lovable-core-prod` por `""` sin tocar versiones ni hashes. Verifica `grep -c lovable-core-prod bun.lock` → 0.
2. En `.github/workflows/e2e.yml`, antes de `bun install`, agrega:
   ```yaml
   - name: Normalizar bun.lock (registro privado de Lovable)
     run: sed -i -E 's#"https://europe-west[0-9]+-npm\.pkg\.dev/lovable-core-prod/[^"]*"#""#g' bun.lock
   ```
3. Si el workflow sigue fallando en un paso posterior (`supabase start`, `e2e:setup`, `functions serve`, Playwright), lee el log de ese paso y corrígelo en la misma rama.

**Aceptación revisada por Andrea (12-10-2026).** Instalación e infraestructura de CI verificadas: 0 URLs privadas en `bun.lock`, normalización antes de instalar, `bun install --frozen-lockfile`, TypeScript, `supabase start`, `e2e:setup` y `functions serve` aprobados. Incluir el enlace al run y su resultado completo, aunque siga en rojo por los casos reales pendientes. Los fallos de datos de Bolivia y SIVOLA/WE ROAD se resuelven en T03–T04; la validación E2E completa queda en T19. No omitir tests ni convertir fallos en éxitos. Este criterio sustituye la exigencia original de todo el workflow en verde para T00 y elimina la dependencia circular.

### Comprobación T00 · 12-10-2026 · en revisión

- La corrección ya está en `main` mediante [PR #21](https://github.com/uyuniadventure/uyuni-adventure-quote/pull/21): las 13 URLs privadas fueron sustituidas por `""` y el paso `sed` se ejecuta antes de instalar. La comparación con `f54c82a` confirma que no cambiaron versiones, hashes ni dependencias. El recuento actual de `lovable-core-prod` en `bun.lock` es **0**. No se repite ese cambio.
- Verificación mínima de esta ejecución: `bun install --frozen-lockfile` y `bunx tsc --noEmit` aprobados; `bunx vitest run --maxWorkers=1` ejecutó **231 tests: 229 aprobados, 2 fallidos, 0 omitidos**. Los dos fallos son los fixtures de Bolivia y SIVOLA/WE ROAD con `input: null`, documentados en T04.
- El [run de main](https://github.com/uyuniadventure/uyuni-adventure-quote/actions/runs/38238953445) supera instalación, TypeScript, Supabase, setup y Edge Functions. SPA desde plantilla y desde bloques pasan dos veces (**4/6** E2E aprobados); las dos repeticiones de Bolivia fallan por el fixture incompleto. Las correcciones del recorrido SPA ya entraron con el PR #19.
- **La aceptación revisada de T00 está cumplida.** `[~]` registra esta entrega para revisión; Andrea la pasa a `[x]` al hacer merge. No certifica un CI completamente verde: siguen pendientes los casos reales. No se omiten tests ni se cambian importes para aparentar que pasan.
- Andrea confirmó el 12-10-2026: **«Sí: ajustar ese criterio de T00»**, aceptando cerrar T00 por instalación/infraestructura verificadas y mantener los fallos de datos explícitos hasta T03/T04 y la aceptación E2E de T19. Se elimina así el ciclo T00 → T04 → T03 → T02 → T00, sin adelantar la ejecución de ninguna tarea.
- No se ejecutan T01 ni T03/T04 en esta entrega. No hay migraciones nuevas ni cambios en Cloud. Los archivos de `referencias_para_repo.zip` siguen fuera del repositorio: D1 continúa pendiente y la visibilidad comprobada es pública.
- En la copia pública del plan se oculta el nombre completo de una pasajera en el título de una hoja de T05, conforme a §0.8. El archivo original entregado por Andrea permanece intacto fuera de Git.

---

## T01 · El paso 2 de Nueva cotización no sugiere plantillas

**Problema.** `TemplateStep` en `src/components/quote/quote-creator.tsx`:
- filtra `status = 'activo'`, pero la aprobación masiva deja en `pendiente` toda plantilla con advertencias (casi todas las importadas);
- filtra exacto por origen, destino y días ±1;
- si la consulta falla (por ejemplo, falta la columna `quote_defaults` de `20261011000100_template_quote_defaults.sql` en Lovable Cloud), reintenta y queda en blanco sin mensaje.

**Hacer.**
1. Mueve la consulta a `src/lib/quotes/suggestions.ts`: `suggestTemplates(basics)`. La UI solo la llama.
2. Incluye `activo` y `pendiente` (nunca `archivado`). Pendientes después de activas, con badge "Pendiente de revisión" y botón "Usar plantilla" habilitado; muestra `import_warnings` en la tarjeta.
3. Sin exclusión por ruta o duración: puntaje (origen +3, destino +3, días exactos +2, ±1 día +1, categoría +2, modalidad +1). Primero las de puntaje > 0; si no hay, todas.
4. Estado de error visible con botón "Reintentar" (`retry: 1`). Si el error es 42703 (columna inexistente), el mensaje dice qué migración falta aplicar.
5. Tests: 0 activas + 3 pendientes → aparecen las 3; UYU→SPA 3 días encuentra un UYUSPA 4D3N; error → mensaje + "Reintentar".

**Lovable.** PASO 1: pedir que aplique **todas** las migraciones de `supabase/migrations` que falten en Lovable Cloud, en orden de fecha, y liste cuáles aplicó. PASO 2 solo si el componente cambió de forma que requiera ajuste visual.

---

## T01b · Revisión de textos del día dentro de la cotización

Problema: "Generar PDF" falla con "Review translated texts before generating the client PDF" y no se puede resolver desde la cotización. generateQuotePdf (src/lib/pdf/index.tsx) exige quote_days.snapshot.reviewed === true en todos los días, y guard_quote_state exige lo mismo para pasar a revisada. Ese valor se copia de day_block_translations.reviewed al crear el día; las traducciones importadas tienen reviewed = false (también las de español) y los días sin bloque no tienen el campo. Ninguna pantalla de la cotización permite marcar un día como revisado, y corregir el bloque después no cambia el snapshot ya copiado.

Hacer:
1. RPC atómica review_quote_days(p_quote_id, p_day_ids uuid[] null): marca snapshot.reviewed = true, reviewed_by y reviewed_at en los días indicados (null = todos). Solo en borrador. No toca block_snapshot (es inmutable). Función reviewQuoteDays(quoteId, dayIds?) en src/lib/quotes/days.ts.
2. Opción alsoUpdateBlock: si el día tiene source_block_id y no tiene overrides de texto, marca también day_block_translations.reviewed = true para ese bloque e idioma (solo roles que pueden editar catálogo).
3. updateDayContent deja el día como revisado.
4. Mensajes en español y con detalle: "Faltan revisar los textos de los días 1, 3 (idioma ES)". El mismo texto en el trigger de estado.
5. Tests: un día sin revisar bloquea el PDF; reviewQuoteDays lo desbloquea; no funciona fuera de borrador; editar el texto marca el día revisado.

Lovable: en el editor, cada día con el badge "Texto sin revisar" lleva un botón "Marcar revisado" que abre el texto para leerlo y confirmar. Arriba de la lista de días, "Revisar todos (n)". En "PDF y envío", si hay días sin revisar, mostrar la lista con enlace a cada día en lugar del error genérico.

### Entrega T01b · 12-10-2026 · en revisión

Implementada por pedido explícito de Andrea. Migración nueva:
`20261012000700_quote_day_text_review.sql`; aplicar después de las anteriores y
regenerar tipos. `reviewQuoteDays` revisa selección o todos, con auditoría y RLS,
conserva el cálculo vigente y descarta el PDF anterior. La opción de catálogo se
ejecuta en la misma RPC, solo para Admin/Operación; devuelve los bloques omitidos
si hay overrides de texto o si la traducción cambió desde la copia. El snapshot
del bloque permanece inmutable. `updateDayContent` deja revisado el día.
`unreviewedDays` devuelve los días pendientes ordenados (con IDs para enlazarlos),
incluidos los que no tienen `reviewed`. Los controles visuales se entregan en el
prompt para Lovable y deben usar `useQuoteActions`.

Verificación: 16/16 pruebas nuevas de revisión; Vitest 269/271, sin omitidos.
Persisten únicamente los dos fixtures incompletos de Bolivia y WE ROAD (T03–T04).
Instalación congelada y ambos TypeScript aprobados. No se modificaron precios,
fixtures ni estados del resto del plan para ocultar esos fallos.

## T01c · Crear cotización desde /plantillas

Hoy solo se puede elegir una plantilla dentro del asistente de Nueva cotización. Andrea quiere elegirla en /plantillas y crear la cotización desde ahí.

Hacer:
1. Ruta /nueva-cotizacion?template=<id>: carga la plantilla y precarga el paso 1 con origen, destino, días, categoría y modalidad de la plantilla, y con pax y TC de quote_defaults si existen. El cliente y la fecha de inicio siguen siendo obligatorios.
2. Con template en la URL, el botón del paso 1 dice "Crear cotización con <SKU>" y llama directo a createQuoteFromTemplate, sin pasar por el paso 2. "Cambiar plantilla" vuelve al paso 2 normal.
3. Si la plantilla está pendiente o tiene import_warnings, muestra las advertencias antes de crear, pero deja crear igual. Archivadas no.
4. Si los pax no coinciden con quote_defaults, aplica la misma regla actual (aviso y opción de volver al escenario de referencia), sin bloquear en silencio.
5. La consulta de la plantilla va en src/lib/quotes (getTemplateForQuote(id)); la UI no consulta tablas directo.
6. Tests: la URL con template precarga los datos; crear desde ahí da el mismo total que crear desde el paso 2 con la misma plantilla; una plantilla archivada muestra error.
7. Ajusta T01: toda plantilla que se ve en /plantillas con estado activo o pendiente debe aparecer en el paso 2.

Lovable: en /plantillas, botón "Crear cotización" en cada fila (icono + texto, visible al pasar el mouse y siempre en móvil) y también dentro del editor de la plantilla. Navega a /nueva-cotizacion?template=<id>.

---

## T02 · Sacar quote-ops.ts y limpiar migración con placeholder

1. `src/components/quote/quote-ops.ts`: mueve `serviceToItem`, `removeDay`, `deleteItem`, `replaceDayHotel` y `latestFx` a `src/lib/quotes` (las de días a `days.ts`). `addBlockDay` y `moveDay` ya existen en `days.ts`: elimina los duplicados. Borra `quote-ops.ts`, actualiza imports y la línea de `AGENTS.md` que lo menciona.
2. `replaceDayHotel` y `deleteItem` hacen varias escrituras: conviértelas en RPC atómicas que recalculan.
3. `supabase/migrations/20261006092638_a1d679d8-...sql` contiene el placeholder `[TU EMAIL]`. Reemplaza su cuerpo por un comentario "histórica, sin efecto" y crea una migración nueva que asigne rol admin a `uyuniadventure.bolivia@gmail.com` solo si ese usuario existe en `auth.users`.
4. Sin cambios visuales.

**Aceptación.** tsc y tests en verde; el editor de días se comporta igual.

---

## T03 · Política de precio única (margen, imprevistos, canal)

Hoy `MarginMode = "markup" | "margin_on_price"`. Las planillas usan además monto fijo, imprevistos dentro o fuera del precio y dos recargos por canal sobre el mismo costo.

1. Migración fechada:
   - `quotes`: `margin_fixed_usd numeric default 0`, `contingency_pct numeric default 0`, `contingency_in_price boolean default false`, `channel text check (channel in ('b2b','b2c'))` con default desde `client_type`.
   - `pricing_channel_defaults(channel, markup_pct)` con RLS (solo admin edita; todos leen). Seed: b2b = 17, b2c = 25.
2. `src/lib/pricing/policy.ts`: `MarginMode = "markup" | "margin_on_price" | "fixed_amount"`.
   - `fixed_amount`: venta = costo + `margin_fixed_usd`, repartido entre ítems con margen en proporción al costo.
   - Imprevistos: si `contingency_in_price`, base de venta = costo × (1 + pct); si no, solo se informa.
   - El resultado siempre trae: costo, imprevistos, venta, `margen_real = venta − costo − imprevistos`, `margen_real_pct` sobre costo. Ninguna otra fórmula de "margen por pax".
3. Al crear una cotización, el % de margen por defecto sale de `pricing_channel_defaults` según el canal (editable en la cotización).
4. `save_quote_calculation` guarda los campos nuevos.
5. Tests:
   - costo 1000 + fijo 3000 → 4000; markup 19 % sobre 1000 → 1190; imprevistos 5 % fuera del precio no cambia la venta.
   - WE ROAD Highlights 10D Budget (hoja "WE ROAD BOLIVIA HIGHLIGHTS 10D"): 2 pax costo 3581, imprevistos 5 % fuera, ×1,19 → 4261,39 y margen_real 501,34. 20 pax: 19656 → 23390,64.
   - BOLIVIA 5D Budget 2 pax: costo 2018 → B2B 2361,06 / B2C 2522,50.

**Lovable.** En el panel de precio del editor: selector de modo de margen (markup / margen sobre venta / monto fijo), campo de imprevistos % con "incluir en el precio", selector Canal B2B/B2C. Tarjetas costo · imprevistos · venta · margen real con semáforo (< 12 % rojo, 12–18 % ámbar, > 18 % verde). En /admin, tabla editable de `pricing_channel_defaults`.

---

## T04 · Importador con unidades inferidas + casos 9+1 y WE ROAD — ALTO

Hoy fallan 2 tests de `src/lib/pricing/real-cases.test.ts`: "Bolivia 5D4N · 9+1" y "Caso SIVOLA sustituido por WE ROAD".

1. En el importador de presupuestos (`scripts/import-presupuesto*`), inferir la unidad de cada fila desde los tramos de pax (columnas 2, 4, 6, 10…):
   - valor ÷ pax constante → por persona; proporcional a vehículos → por vehículo; valor ÷ (pax/2) constante → por habitación DBL; igual en todos → por grupo; si no → "revisar".
   - Buscar SKU por nombre + proveedor; si no existe, proponer crearlo en `pendiente`.
2. `--dry-run` primero: tabla fila · servicio · unidad · tarifa · SKU sugerido · revisar sí/no.
3. Fixture `BOLIVIA-5D4N-9+1` (hoja "2.0 BOLIVIA 5D4N 9+1", columna de 10): 9 pagantes + 1 TC; rooming 4 DBL + 1 SGL pax + 1 SGL TC; costo esperado 9549 (9179 de la hoja + 370 por corregir Atipax a 6 habitaciones, documentarlo como error de la hoja); venta `fixed_amount` 3000 → 12549.
4. Fixture `SIVOLA-10D-14+1` → renombrar `WEROAD-10D-14` (hoja "WE ROAD BOLIVIA HIGHLIGHTS 10D", BACKPACKER, columna de 14): 14 pagantes, 0 TC, 3 vehículos; K71 = 266 (7 hab × 38); costo 14230; markup 19 % → 16933,70; imprevistos 5 % fuera del precio.

**ALTO:** entrega la tabla del dry-run y espera "OK". Después carga servicios/tarifas en `pendiente` (como seed SQL, no contra la base) y completa los fixtures. No ajustes tarifas ni fórmulas para forzar un total: si algo no cuadra, tabla línea por línea.

**Aceptación.** `real-cases.test.ts` con los 3 casos en verde; 0 tests fallando.

---

## T05 · Fixtures de octubre — ALTO

Fuentes: Google Sheet `1TLN4VVpfFl1_kV8b1H_bVp5jj3XDrSWt5j4ZjN4pRE8` y los archivos de `docs/referencias/` (si falta alguno, pídelo a Andrea en "Decisiones pendientes" y sigue con los demás).

| Fixture | Hoja | Pax | Costo | Venta | Regla |
|---|---|---|---|---|---|
| MELTING-9D-14+1 | "Melting Voyages BOLIVIA 9D" (no la 2.0) | 14 + 1 TC | 16915 | 19621 | markup 16 %; por pax ÷ 14 = 1402 |
| WEROAD-360-9D | "2.0 WE ROAD BOLIVIA 360° 10D", BACKPACKER fila 1 | 4,6,10,12,14,16,20 | fila "Costo TOT" | — | % por tramo de la fila de porcentajes |
| WEROAD-HIGHLIGHTS-8D | "2.0 WE ROAD BOLIVIA HIGHLIGHTS", BACKPACKER fila 1 | idem | idem | 3160, 4673, 7622, 8845, 10538, 11365, 14156 | % por tramo |
| PELLEGRINI-14D-2 | Hoja de 2 pax; nombre completo reservado en la referencia local | 2 | 7631 (si la hoja dice 7731: tabla de diferencias y esperar) | 9856 | imprevistos 5 % dentro del precio; markup 23 % |

**ALTO:** tabla por caso (fila, servicio, unidad inferida, SKU, revisar) y esperar "OK".

**Aceptación.** Fixtures nuevos en verde en `real-cases.test.ts` (los de tramos pueden quedar `todo` hasta T08, explícito en el PR).

---

## T06 · Reglas de cantidad por pax

1. Migración: `services.qty_rule jsonb null`:
   - `{"type":"per_vehicle","capacity":5}` → cantidad = ceil(pax_total / capacity)
   - `{"type":"step_pct","pct":20,"tiers":[10,14,16]}` → precio +20 % compuesto por cada tramo superado
   - `pax_total` incluye TC/staff en líneas de transporte.
2. `src/lib/pricing/qty-rules.ts` puro. La cantidad calculada siempre se puede sobrescribir en la línea (override visible).
3. Tests: 10 pax → 2 vehículos, 13 → 3, 17 → 4; guía 240 → 288 (> 10) → 345,60 (> 14) → 414,72 (> 16).

**Lovable.** En el editor del servicio (tarifario): campo "Regla de cantidad" con dos opciones guiadas. En la línea de la cotización: badge "auto" y botón para sobrescribir la cantidad.

---

## T07 · Suplemento single

Regla: `suplemento por noche = tarifa SGL − (tarifa DBL de habitación ÷ 2)`. Si el hotel no tiene tarifa SGL, se usa la habitación DBL como single → `DBL ÷ 2`.

En el catálogo, cada tipo de habitación es un servicio distinto (`room_type` SGL / DBL_TWN / DBL_MAT…). Empareja SGL con DBL del mismo hotel (mismo proveedor + location + meal_plan, o `hotel_codes`). Si no se puede emparejar, aviso.

1. Migración en `quotes`: `single_supplement_mode ('difference'|'full_room') default 'difference'`, `single_supplement_override numeric null`, `odd_pax_policy ('charge'|'absorb') default 'charge'`.
2. `src/lib/pricing/single-supplement.ts`: por noche con alojamiento incluido → costo; venta = costo × (1 + imprevistos si van en el precio) × (1 + markup de la cotización; con tramos, el del tramo más bajo); redondeo hacia arriba a USD entero. Negativo → 0 + aviso. Devuelve `{costo_por_noche[], costo_total, venta_por_persona, avisos}`.
3. La single del TC no es suplemento: va al costo del grupo. Pax impar: `charge` → paga el suplemento; `absorb` → se reparte en el grupo.
4. Salida: línea aparte "Suplemento single" por persona en editor, tramos, PDF y email.
5. Tests:
   - Don Tomás: twin 154, single 108 → 31/noche; 4 noches → 124. (La hoja MOBILTRAVEL suma 108 por noche: error de la hoja.)
   - Coreano 16+1 sin tarifa SGL: Mitru 110 ×2, Kachi 79, Polques 50 → costo 174,50; B2B ×1,17 → 205; B2C ×1,25 → 219.
   - Mismo caso con `full_room` → 349 (coincide con la hoja).

**Lovable.** Tarjeta "Suplemento single" en el panel de precio: tabla por noche, total, precio por persona, margen real, campo para sobrescribir y selector "Pax impar: cobrar / absorber".

---

## T08 · Tabla de precios por tramo de pax

1. Migración `quote_price_tiers(quote_id, pax, tc, vehicles, margin_pct, sort)` con RLS igual a `quote_items`.
2. `calculatePriceGrid(quoteId, tiers)` en `src/lib/pricing`: recalcula la cotización por tramo (tarifas por tramo, vehículos con T06, habitaciones) y devuelve costo, venta, por pax, depósito, saldo y suplemento single (T07).
3. Si la cotización tiene tramos y el interruptor está activo, el PDF usa la tabla en vez del precio único.
4. Tests: WEROAD-HIGHLIGHTS-8D reproduce los 7 precios (tolerancia 1 USD); WEROAD-360-9D idem.

**Lovable.** Pestaña "Tramos" en el editor: tabla editable (pax, TC, vehículos, % margen), botón "Recalcular tramos", columnas de resultado y el interruptor "Usar tabla de tramos en el PDF".

---

## T09 · Crear cotización desde bloques de día

1. RPC atómica `create_quote_from_blocks` (patrón de `create_quote_snapshot` / creación desde plantilla) + `createQuoteFromBlocks(basics, blockIds: (string|null)[])` en `src/lib/quotes`.
2. Cada bloque → día con snapshot (`source_block_id`, `link_type = chained`, servicios por defecto con tarifas congeladas, igual que `addBlockDay`). `null` = día libre (`independent`, sin servicios).
3. Bloques consecutivos que comparten un servicio que se cobra una vez (ej. 4x4 3D/2N) se agrupan con `groupDays`.
4. SKU: origen del primer bloque + destino del último + duración + sufijo `CUSTOM`. Nunca `XXX`.
5. Recalcula al crear y devuelve los avisos de `validateContinuity`.
6. `suggestBlocks(basics)` en `src/lib/quotes/suggestions.ts` (activos y pendientes, mismo criterio de T01).
7. Tests: SPAUYU-3D2N-MP con sus 3 bloques = mismo total que desde plantilla; día libre en medio sin aviso; bloques que no conectan → aviso, no error.

**Lovable.** En `/nueva-cotizacion`, paso 2 con dos tarjetas: "Desde plantilla" (lo actual) y "Desde bloques de día": biblioteca a la izquierda (buscador, filtros origen/destino/tipo), lista de días a la derecha (agregar, arrastrar, quitar, "Día libre"), línea ámbar entre días que no conectan, botón "Crear" → `createQuoteFromBlocks` → editor.

---

## T10 · Editor de días: ajuste masivo, enlaces, grupos, guardar bloque

La lógica existe en `src/lib/quotes` (`applyAdjustmentBulk`, `setDayLinkType`, `groupDays`, `ungroup`, `updateDayContent`, `saveDayAsNewBlock`) pero ninguna pantalla la usa.

Codex: revisa que cada función tenga test y que `useQuoteActions` las pueda encolar; agrega lo que falte. Luego entrega el prompt para Lovable.

**Lovable.** En `quote-workspace.tsx`:
1. Botón "Ajuste masivo" → diálogo (filtro por tipo / proveedor / día, %, nota) → `applyAdjustmentBulk`. Badge "+6,4 %" en líneas ajustadas y fila "Ajustes" en totales.
2. Por día: selector Encadenado / Independiente (`setDayLinkType`); "Agrupar con siguientes" (`groupDays`); "Desagrupar" (`ungroup`). Días agrupados como una tarjeta con borde común.
3. Panel de contenido del día (campos de `resolveDay`) → `updateDayContent`; campos modificados con punto y botón "restaurar".
4. "Guardar como nuevo bloque de día" → nombre → `saveDayAsNewBlock` → aviso con enlace a /bloques-diarios.

Prueba: +6,4 % al transporte cambia el total; agrupar 3 días y moverlos juntos; guardar un día como bloque y verlo en la biblioteca.

---

## T11 · Condiciones de pago, extras opcionales y resumen de pagos

Ya existe `deposit_pct` en `clients` y `pricing_settings`, y `quote_payments` con depósito. Ampliar:

1. Migración en `quotes`: `deposit_mode ('pct'|'fixed') default 'pct'`, `deposit_value numeric` (default desde cliente/ajustes), `balance_due_days int default 5` (B2B grupos: 45), `valid_hours int default 48`, `card_surcharge_pct numeric default 3`, `payment_link text null`.
2. `quote_optional_extras(quote_id, label, description, price, currency, sort)` con RLS. No suman al total. Seed de catálogo: Amanecer 04:00–06:00 USD 200; Sesión de fotos medio día + dron USD 450; Guía en inglés USD 350; Bicicleta USD 35.
3. `paymentSummary(quote)` en `src/lib/quotes/payments.ts` → total, depósito, pagado, saldo, fecha límite del saldo, vencimiento de la propuesta. Redondeo a USD entero.
4. Tests: 2960 → depósito 888; 1859 → 558; 420 con fijo 100 → 100; 2250 pagado 1998 → saldo 252.

**Lovable.** En la pestaña "Pagos" (`quote-payments.tsx`): bloque "Condiciones" (modo depósito, valor, días de saldo, validez 24/48 h, recargo tarjeta, enlace de pago) y barra Total · Pagado · Saldo. Nueva pestaña "Extras" con lista y "Agregar desde catálogo".

---

## T12 · Control de la propuesta antes de PDF y email

`validateProposal(quoteId)` en `src/lib/quotes`. Errores bloquean "Generar PDF" y "Enviar al cliente" en `quote-delivery.tsx`; avisos dejan seguir.

Errores:
- el precio mostrado ≠ total guardado de la versión actual;
- día sin título o descripción en el idioma de la cotización;
- orden de días del documento ≠ `day_number`;
- hotel del texto del día ≠ hotel de la distribución de esa noche (caso real: texto Coscaña, distribución Tayka);
- incluido menciona traslado a San Pedro / Hito Cajón y la ruta no cruza la frontera, o al revés;
- depósito ≠ regla de T11 o saldo negativo.

Avisos:
- texto con "regreso" / "return" cuando origen ≠ destino final;
- noche con alojamiento y el día siguiente sin desayuno;
- pax del bloque de precio ≠ pax de la cotización.

Tests con estructuras basadas en esos casos (sin datos de clientes).

**Lovable.** En `quote-delivery.tsx`: lista de errores (rojo) y avisos (ámbar) encima de los botones; botones deshabilitados con el motivo si hay errores.

---

## T13 · Plantilla de propuesta B2C y B2B (PDF + email)

**Depende de:** T11 y T12. **Lovable:** sí.

**Objetivo.** Igual que los días se arman con bloques diarios, el PDF y el email se arman con bloques de documento que se ordenan arrastrando, se editan y se guardan para reutilizar. Una sola fuente de render, en es / en / it.

**Modelo de documento.**

- Dos tipos de bloque: `static` (texto editable por idioma) y `dynamic` (datos automáticos de la cotización).
- Los bloques de dato no se editan como texto: solo se mueven, se ocultan y tienen opciones, por ejemplo itinerario "con fotos / sin fotos" o precio "total + por persona".
- Una plantilla de documento es una lista ordenada de bloques, como `template_days`. Hay una plantilla por defecto para B2C y otra para B2B.
- Al abrir "PDF y envío", la cotización copia la plantilla por defecto de su canal como snapshot, igual que `quote_days`. Editar después un bloque o una traducción del catálogo no cambia cotizaciones existentes.
- Al pasar a `enviada`, se congela el HTML renderizado en la versión. Reenviar o descargar después usa ese HTML.

**Editor y compatibilidad PDF/email.** El mismo bloque va al PDF y a clientes de correo como Gmail y Outlook. El editor solo permite este subconjunto, sanitizado tanto en servidor como en cliente:

`p`, `h2`, `h3`, `strong`, `em`, `u`, `a[href]`, `ul`, `ol`, `li`, `br`, `hr`, `table`, `tr`, `td`, `th`, más clase de alineación permitida. Sin `style`, `script`, `iframe`, atributos `on*` ni imágenes externas; las imágenes solo proceden de Media, no de HTML libre pegado en el editor.

Codex: comprobar con `rg` cómo genera hoy `src/lib/pdf/index.tsx`. **Comprobado al actualizar este plan (16-10-2026): usa `@react-pdf/renderer` y `pdf(...).toBlob()`.** Implementar `htmlToPdfNodes` para convertir el subconjunto permitido a nodos del motor actual. Si no se puede cubrir alguna parte, explicar la limitación en el PR; no cambiar de motor sin "OK" de Andrea.

**Variables.** Menú "Insertar variable" con esta lista cerrada: `{{cliente}}`, `{{vendedor}}`, `{{fecha_inicio}}`, `{{duracion}}`, `{{pax}}`, `{{total}}`, `{{por_persona}}`, `{{deposito}}`, `{{saldo}}`, `{{fecha_saldo}}`, `{{valida_hasta}}`, `{{sku}}`. Una variable desconocida es error en `validateProposal`. Nunca admitir variables de costo, margen, ajustes o imprevistos.

**Codex · Hacer.**

1. Migración fechada en `supabase/migrations/`:
   - `doc_blocks(id, code unique, kind 'static'|'dynamic', data_key text null, channel 'b2b'|'b2c'|'all', required bool default false, status 'activo'|'pendiente'|'archivado', created_by)`. `data_key` solo en `dynamic`: obligatorio en ese tipo, nulo en `static`, con valores de un enum cerrado validado por `CHECK`.
   - `doc_block_translations(block_id, lang, title, body_html, reviewed bool default false, reviewed_by, reviewed_at)`.
   - `doc_layouts(id, name, channel, is_default)` y `doc_layout_items(layout_id, block_id, sort, options jsonb)`. Un default por canal, con índice único parcial.
   - `quote_doc_sections(id, quote_id, block_id, sort, hidden bool, options jsonb, title_override, body_override_html, snapshot jsonb, reviewed bool)`. El snapshot conserva el bloque y sus traducciones/revisión por idioma; los overrides pertenecen a la cotización.
   - RLS en todas las tablas nuevas: catálogo (`doc_blocks`, `doc_layouts` y sus traducciones/ítems) editable por Admin y Operación y legible por todos los roles de la app; `quote_doc_sections`, igual que `quote_items`, editable solo en borrador. Las RPC de guardado como bloque/plantilla respetan el acceso a la cotización; guardar como bloque nuevo crea un pendiente, sin habilitar la edición directa del catálogo al vendedor.
   - Seed SQL de estructura, sin textos de clientes ni datos bancarios: todos los bloques `dynamic`, bloques `static` vacíos con códigos `TYC`, `FOOTER`, `SALUD_ALTITUD`, `NOTA_HOTELES`, `INTRO`, y las dos plantillas por defecto. El texto real lo carga Andrea desde la app.
   - Conservar como **orden inicial B2C** el de la T13 original: intro → ficha (destino, duración, servicio) → itinerario por día (texto, alojamiento, comidas, nota) → distribución de hoteles → incluido / no incluido → precio y condiciones (T11) → métodos de pago → extras opcionales (T11, fuera del total) → notas → salud y altitud → T&C → "Propuesta válida hasta <fecha hora>". El orden se puede cambiar en la cotización.
   - **B2B:** mismo orden inicial, más desglose diario de servicios y total neto; con tramos (T08) usa la tabla. Nunca costos, márgenes, ajustes ni imprevistos.
   - En ambos canales: datos bancarios desde `bank_accounts`; total del grupo y, si pax > 1, también por persona; suplemento single en línea aparte.
   - El campo actual "Enlace a términos y condiciones" pasa a ser opción del bloque `TYC`: enlace, texto completo o ambos. Itinerario, precio y T&C son obligatorios (`required`).
2. RPC atómicas:
   - `ensure_quote_doc_sections(quote_id, layout_id null)`: copia la plantilla por defecto solo si no existe el documento; con `layout_id` explícito reemplaza las secciones por un nuevo snapshot de esa plantilla.
   - `reorder_quote_doc_sections(quote_id, ids uuid[])`.
   - `save_doc_section_as_block(section_id, code, title)`: crea un bloque nuevo en `pendiente`.
   - `save_quote_doc_as_layout(quote_id, name, channel)`.
3. `src/lib/quotes/document.ts`: `listDocBlocks(filters)`, `ensureDocSections`, `reorderDocSections`, `setSectionHidden`, `updateSectionText` (sanitiza y marca revisado en el idioma editado), `resetSection` (restaura desde el snapshot), `addSection(blockId, position)`, `removeSection` (bloquea si `required`), `saveSectionAsBlock`, `saveAsLayout`. Las escrituras respetan el borrador y los permisos; los bloques `dynamic` no admiten edición de texto.
4. `renderProposal(quoteId, { target: 'pdf' | 'email', lang })`: única fuente de render para `send-quote-email` y `src/lib/pdf`. Recorre las secciones visibles en orden, resuelve bloques `dynamic` con las funciones existentes (`resolveDay`, `paymentSummary`, `calculatePriceGrid`), reemplaza variables y devuelve HTML + lista de avisos. Contenido de cada día desde `resolveDay`, nunca del bloque vivo. B2B nunca muestra costos, márgenes, ajustes ni imprevistos. El PDF consume ese HTML mediante `htmlToPdfNodes`.
5. Ampliar `validateProposal` (T12) con errores que bloquean PDF y envío:
   - bloque `required` oculto o ausente: itinerario, precio o T&C;
   - sección de texto vacía en el idioma de la cotización;
   - texto `static` sin revisar en ese idioma, con lista de secciones y enlaces para corregirlas, siguiendo el patrón de T01b;
   - variable desconocida;
   - tabla de tramos visible sin tramos calculados.
6. Congelar al enviar: al pasar a `enviada`, guardar en la versión el HTML renderizado y el snapshot de secciones. Reenviar o descargar después usa ese HTML congelado, sin volver a leer el catálogo vivo.
7. Tests:
   - mover "Precio" antes de "Itinerario" cambia el orden en el HTML de PDF y email por igual;
   - `{{total}}` se reemplaza; `{{costo}}` da error;
   - el sanitizado elimina `script`, `style`, `onclick` e `iframe`;
   - ocultar T&C (`required`) da error en `validateProposal`;
   - editar `doc_block_translations` después de copiar no cambia la cotización;
   - B2B con tramos: HTML sin palabras costo/margen/imprevistos;
   - snapshots del HTML: B2C 2 pax y B2B con tramos, con datos de prueba y sin clientes reales.

**Permiso por defecto para T&C.** Los vendedores pueden editar los textos de la cotización excepto T&C, cuyo texto queda bloqueado y solo lo puede editar Admin. Mover u ocultar no concede edición del texto; ocultar T&C produce el error de bloque obligatorio. Aplicar la restricción en servidor además de la UI.

**Lovable · PASO 1 · Base de datos.** Después del merge del PR de implementación, aplicar la migración nueva y el seed en el orden exacto indicado en ese PR; regenerar los tipos de Supabase. Codex entrega el SQL; Lovable lo aplica en Cloud.

**Lovable · PASO 2 · Pantalla.** En `src/components/quote/quote-delivery.tsx`, "PDF y envío" con tres columnas:

- **Izquierda · Biblioteca:** buscador, pestañas "Textos" / "Datos de la cotización" y tarjetas arrastrables desde `listDocBlocks`. Arrastrar al centro llama a `addSection`.
- **Centro · Documento:** lista de secciones con `@dnd-kit` (ya está en el repo), conectada a `reorderDocSections`. Cada tarjeta tiene asa de arrastre, título, badge "Dato automático" (azul) o "Texto" (gris), badge "Texto sin revisar" (ámbar), ojo (ocultar), lápiz (editar texto cuando corresponda) y menú ⋯ (restaurar, guardar como bloque). Bloques obligatorios con candado. Los datos automáticos muestran sus opciones, sin editor de texto.
- **Editor de texto en panel lateral:** barra limitada al subconjunto permitido (títulos, negrita, cursiva, subrayado, alineación, listas, enlace, tabla, separador) y botón "Insertar variable". "Guardar y marcar revisado" llama a `updateSectionText`; respetar el bloqueo de T&C por rol.
- **Derecha · Vista previa:** HTML de `renderProposal` en un iframe de vista previa, con interruptor "PDF / Email"; se actualiza al soltar o guardar. El iframe de la pantalla no forma parte del HTML editable permitido.
- **Arriba:** selector "Plantilla de documento" (cambiar pide confirmación y llama a `ensureDocSections` con `layoutId`) y botón "Guardar como plantilla" → `saveAsLayout`.
- Errores (rojo) y avisos (ámbar) de `validateProposal` encima de "Generar PDF" / "Enviar por email"; botones deshabilitados con el motivo si hay errores.
- Nueva página `/bloques-documento` en el menú "Diseño del viaje": tabla de bloques de texto con idiomas ES · EN · IT y punto de revisado, editor y botón "Traducir" igual que en bloques diarios.
- No calcular nada en la UI. Usar las funciones de `src/lib` y la cola `useQuoteActions` para las escrituras de la cotización. Colores solo por tokens de `src/styles.css`. Solo editable en borrador; en otros estados, solo lectura.

**Lovable · PASO 3 · Cómo lo pruebo.**

1. Abrir una cotización B2C en borrador → "PDF y envío": aparecen las secciones de la plantilla B2C.
2. Arrastrar "Precio y condiciones" arriba del itinerario: la vista previa cambia en PDF y en Email.
3. Editar "Intro", insertar `{{cliente}}` y guardar: en la vista previa aparece el nombre del cliente.
4. Ocultar "Términos y condiciones": aparece el error y "Generar PDF" queda deshabilitado.

---

## T14 · Moneda de presentación

`quotes.display_currency ('USD'|'EUR'|'CLP')` y `display_fx_rate` congelado al enviar. Cálculo siempre en USD; cambia solo la presentación. Test: 3200 USD × 0,87 → 2784 EUR.

**Lovable.** Selector de moneda en el panel de precio y en la vista previa.

---

## T15 · Programas automáticos por firma

**Decisión pendiente de Andrea:** crear el programa al pasar a `enviada` (por defecto) o a `vendida`. Implementa con un parámetro en `pricing_settings` (`auto_program_on`) con default `enviada`.

1. Migración: `itinerary_templates.signature text unique null`, `itinerary_templates.origin_quote_id`, `quotes.program_id`.
2. `computeProgramSignature(days, items)` en `src/lib/quotes/program.ts`: sha256 de [source_block_id, overrides de contenido normalizados, link_type, posición en grupo, SKUs ordenados]. Excluye fechas, pax, cantidades, precios, ajustes, imprevistos y cliente.
3. En `transition_quote`, al estado configurado: si la firma existe → `program_id`; si no → plantilla `pendiente` con `promote_quote_template`, nombre ruta + duración + "AUTO". Misma transacción; el índice único evita duplicados.
4. Tests: misma secuencia con distinto pax/fecha → un programa; cambiar el texto de un día → programa nuevo; borradores no generan programas.

**Lovable.** Solo PASO 1 (migraciones) y PASO 3 (prueba: enviar dos cotizaciones iguales y ver una sola plantilla AUTO en /plantillas).

---

## T16 · Seguimientos programados

Existen `quote_followups`, `followup_email_runs` y la Edge Function `followup-reminders`.

1. Al pasar a `enviada`: dos recordatorios (+3 y +7 días; en B2C con validez 24/48 h, +1 día y al vencer).
2. La función diaria avisa al vendedor por email de los vencidos en cotizaciones que siguen `enviada`; marca hechos al vender, perder o cancelar.
3. `listFollowups(quoteId)` y `completeFollowup(id)` en `src/lib/quotes`.
4. En el PR, pasos exactos para activar la tarea programada en Supabase.

**Lovable.** Pestaña Historial del editor: seguimientos con fecha, nota y botón "Hecho". En /cotizaciones, punto ámbar si hay uno vencido.

---

## T17 · Dashboard

Codex: `getDashboardStats()` en `src/lib/quotes/dashboard.ts` (solo lecturas; RLS filtra por vendedor): cotizaciones por estado, tasa de cierre del mes (vendidas ÷ enviadas), ventas del mes en USD, próximas salidas a 30 días, saldos por cobrar.

**Lovable.** Reemplaza el placeholder de `src/routes/_authenticated/index.tsx`: embudo por estado, tarjetas de tasa de cierre y ventas del mes, tabla de próximas salidas con enlace a /operacion, saldos por cobrar con semáforo (vence en < 7 días rojo).

---

## T18 · Roles y permisos verificados

1. Seed SQL (no migración) con perfiles de prueba `operacion@prueba.local` y `vendedor@prueba.local` + instrucciones para crearlos en Auth.
2. Tests con pglite (`src/test/pglite-supabase.ts`) por rol, según SPEC.md sección 3. Corrige políticas RLS que no cumplan.
3. En /admin, email de cada usuario (vista segura sobre `auth.users`, solo admin).
4. Entrega tabla rol × acción con sí/no.

**Lovable.** Solo si cambia /admin: columna email en la tabla de usuarios.

### Entrega T18 · 12-10-2026 · en revisión

T18 es la primera tarea habilitada: T00 sigue `[~]` y T18 no tiene dependencias.
Se recupera la corrección de roles del PR #20 (fusionado en otra rama, ausente de
`main`) y se añade el seed manual solicitado. La [matriz de permisos e
instrucciones de Auth](T18_ROLES.md) identifica las pruebas y el orden de aplicación.
Se conserva `admin_list_users` como consulta segura sobre Auth, con autorización
en la RPC; no se añade otra vista ni se expone `auth.users`.
No se ejecutaron escrituras en Cloud. Los fallos conocidos de fixtures Bolivia y
SIVOLA/WE ROAD permanecen asignados a T03–T04, sin omitir pruebas.
Verificación: instalación congelada y ambos TypeScript aprobados; Vitest
238/240 (los dos fallos previos); ocho suites de BD aprobadas, con 119 aserciones
de roles, más 9 tests nuevos de seed/emails incluidos en Vitest y CI.

---

## T19 · E2E de los dos caminos con las funciones nuevas

Ampliar `tests/e2e/quotes.spec.ts`:
1. Vendedor; camino plantilla SPAUYU-3D2N-MP 2 pax = fixture → ajuste +6,4 % al transporte → validateProposal sin errores → PDF → email simulado → `enviada` → programa AUTO creado.
2. Camino bloques con los mismos 3 bloques = mismo total antes del ajuste.
3. Depósito → `vendida` → aparece en /operacion; resumen de pagos correcto.
4. Bolivia 5D4N 9+1 con suplemento single y tabla de tramos.
5. Paso 2 de nueva cotización con 0 plantillas activas muestra las pendientes.

**Aceptación.** Pasa dos veces seguidas en CI.

---

## T20 · Inventario final

Mismo formato del inventario del 2026-10-11 (V/S, semáforo por pantalla y por paso del flujo, conteos reales que Andrea saque de Lovable Cloud con las consultas SQL que entregues, tests).

Terminado cuando: 0 tests fallando u omitidos · 0 plantillas aprobadas sin servicios · todos los pasos del flujo comercial en verde · 0 migraciones con placeholders · CI en verde. Lo que no esté en verde, tabla con causa.

---

## 4. Decisiones abiertas (Andrea)

| # | Decisión | Default si no responde |
|---|---|---|
| D1 | Repo privado en GitHub (contiene costos) | Bloquea subir archivos de referencia nuevos hasta confirmar |
| D2 | Imprevistos por defecto dentro o fuera del precio | Fuera (`contingency_in_price = false`), 0 % |
| D3 | Programa automático al pasar a `enviada` o `vendida` | `enviada` |
| D4 | Suplemento single: diferencia o habitación completa | Diferencia |
