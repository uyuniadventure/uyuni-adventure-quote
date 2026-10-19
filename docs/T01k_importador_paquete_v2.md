# T01k · Importador del paquete v2 (tarifario + plantillas + bloques + textos PDF) — ALTO

> Guardar en `docs/T01k_importador_paquete_v2.md`. Agregar la fila a la tabla de `docs/PLAN_CODEX.md` después de T01j.
> **Reemplaza a T01i**: el parser de pestañas de presupuesto ya no hace falta, los datos llegan normalizados. De T01i se mantienen staging, commit atómico, purga y tabla de control.
> **Depende de T01h** (modelo de bloque v2: `slot_key`, `is_default`, `billing`/`span_days`, `tc_policy`, `services.capacity`/`room_type`/`occupancy`, `quote_rooming`). Si T01h no está en `main`, hazla primero y detente.
> Esquema de columnas: `docs/import/esquema_paquete_v2.md`. Fixture: `src/test/fixtures/import-v2-sintetico/`.

## Por qué
Los datos ya están corregidos fuera de la app (tarifario 2026-2027 normalizado, 46 itinerarios de la guía, 93 textos de día, 102 bloques de servicios cruzados con los presupuestos de 1–5 pax, 33 textos de PDF). Falta cargarlos en la app sin volver a interpretar hojas.

## Regla clave: servicios de varios días
En las hojas el 4x4 de 3–4 días se cobraba entero en el Día 1. Ahora es un **tramo de la plantilla** (`03_itinerario_tramos.csv`) y **no pertenece a ningún bloque de día**. Así el mismo bloque sirve en tours de distinta duración. Al crear la cotización el tramo se convierte en un `quote_item` del `dia_desde` con `billing = 'per_service'` y `span_days`. Al crear desde bloques (T09) el tramo se propone con `07_reglas_tramo.csv` (ruta + días).

Lo que depende del hotel (habitación, cena del hotel, cama/cena del chofer) va en el **día de la plantilla**, puesto `ALOJAMIENTO`/`CENA`/`STAFF` (`04_itinerario_alojamiento.csv`), tampoco dentro del bloque reutilizable.

## 1. Migración fechada
- `template_segment_items(id, template_id fk, slot_key, service_id fk, day_from int, day_to int, created_at)` con RLS igual a las tablas de plantillas; `check (day_to >= day_from)`.
- `template_day_items(id, template_id fk, day_number int, slot_key, service_id fk null, supplier_id fk null, tc_policy, is_default bool, sort)` para ALOJAMIENTO/CENA/STAFF por noche. Si el repo ya tiene una tabla equivalente para ítems de día de plantilla, úsala y explícalo en el PR (no dupliques).
- `day_block_items`: si falta, `variant_key text null` (la letra de `BD-xxx/A`). Un bloque de texto puede tener varias variantes de servicios.
- `segment_rules(route text, days int, slot_key, service_id fk, day_from, day_to)` con RLS (admin edita, todos leen).
- `pdf_text_blocks`: si ya existe la tabla de textos fijos de T13, agrega lo que falte (`code unique`, `kind`, `lang`, `sort`, `required`). Si no existe, créala.
- `import_batches(id, kind text default 'paquete_v2', status ('staged','committed','discarded'), file_name, created_by, created_at, summary jsonb)` y `import_rows(id, batch_id, table_name, natural_key, action ('insert','update','skip','error'), payload jsonb, message text)`. Solo admin.

## 2. Parser puro `src/lib/import/package-v2.ts`
- `parsePackageV2(files: Record<string,string>)`: CSV → objetos tipados. Usa una librería CSV que soporte campos con saltos de línea (papaparse ya está o agrégala). Quita el BOM.
- `validatePackageV2(pkg, catalog)` devuelve errores y avisos, sin tocar la base:
  - errores: `TariffCode` repetido; FK rota (día → bloque, bloque → TariffCode, tramo → TariffCode, plantilla → bloque PDF incluye); `PER_VEHICLE` sin capacidad; días de una plantilla ≠ `dias`; moneda fuera de USD/CLP/BOB; `day_to < day_from`.
  - avisos: plantilla sin servicios; `estado = sin_textos`; bloque usado 0 veces; servicio del catálogo actual que no viene en el paquete (no se borra, solo se informa).
- `diffPackageV2(pkg, catalog)` → por tabla: insert / update / skip con clave natural (`TariffCode`, `sku`, `sku+dia`, `bloque_texto_id`, `bloque_servicios_id+slot`, `code` de PDF). Update solo si cambió algún campo.

## 3. Staging y commit
- Edge function o RPC `stage_import_package(file)` → guarda filas en `import_rows` con el diff. Nunca escribe en catálogo.
- RPC atómica `commit_import_batch(batch_id)`:
  - upsert proveedores por nombre → upsert `services` por `TariffCode` (moneda original; año → vigencia);
  - plantillas por `sku` (estado `pendiente`); días con `source_block_id` (texto) + variante de servicios;
  - bloques de día: texto por `bloque_texto_id`, servicios por variante con `slot_key`, `tc_policy`; `TRASLADO_FRONTERA` con `is_default` en la tarifa del paquete y alternativas = mismas rutas del proveedor (2-4 / 5-9 / 10-16);
  - `template_segment_items`, `template_day_items`, `segment_rules`, `pdf_text_blocks`;
  - todo o nada; si falla, `status` queda `staged` con el error.
- `purge_imported_catalog(confirm)` de T01i se mantiene (exige `BORRAR`). Antes de purgar, consulta de respaldo en `docs/consultas/`.

## 4. Cálculo (verificación de que el modelo cuadra)
`src/lib/pricing/template-cost.ts`: `costTemplate(templateId | pkgTemplate, { pax, tc = 0, fx })`:
- tramo: `precio × ceil((pax + tc + staff) / capacity)`, una sola vez;
- servicios de bloque: `PER_PERSON` × pax (+ tc según `tc_policy`), `PER_VEHICLE` × vehículos, `PER_GROUP` × 1; traslado frontera → tarifa del tramo de pax que corresponda;
- noche: habitaciones desde `proposeRooming(pax, tc)` de T01h (DBL + 1 SGL si impar) × tarifa del tipo de habitación del hotel; `CENA` × pax; `STAFF` × vehículos;
- conversión con el `fx` recibido (en tests, `fixture/fx.json`; en la app, `latestFx`).

## 5. Tests (vitest)
- `parsePackageV2` lee el zip `paquete-v2-sintetico.zip`: 16 tarifas (una de 2027), 3 plantillas, 10 días, 6 textos (uno con saltos de línea y comillas), 6 variantes de servicios, 2 tramos.
- validación: duplicar un `TariffCode` → error; borrar `VehicleMaxPax` de `T_4X4_4D` → error; plantilla `UYUUYU-3D2N-SOLO-TEXTO` → aviso "sin servicios".
- `BD-T02` tiene dos variantes (`/A` con cóctel, `/B` sin cóctel) y `BD-T03/A` se usa en 2 plantillas.
- `costTemplate` reproduce `expected_costs.csv` (±0,01) para las 2 plantillas × 1–5 pax con `fx.json`. Ejemplos: SPASPA-4D3N-AB 1 pax = 1570,00; 2 pax = 1860,00; 5 pax = 3030,00. UYUUYU-3D2N-AB 3 pax = 1520,00.
- el tramo 4x4 aparece una sola vez en el costo aunque cubra 4 días; el día 2–4 lo muestra como "incluido en Día 1".
- `commit_import_batch` (pglite, `bun run test:db`): importar dos veces el mismo zip → segunda vez todo `skip`; cambiar un precio → 1 `update`; error a mitad → nada escrito.

## 6. ALTO
Entrega: migraciones, parser, validación, staging, commit, `costTemplate`, tests en verde y la pantalla (prompt Lovable). **No ejecutes el commit con el paquete real.** Andrea sube `UA_IMPORT_ITINERARIOS_BLOQUES_v2_csv.zip` en la vista previa, revisa el diff y la tabla de control y responde "OK".

## Aceptación
- Fixture: 100 % de filas importadas, costos = `expected_costs.csv`.
- Paquete real (lo verifica Andrea): 1.197 tarifas, 47 plantillas, 160 días, 93 textos, 102 filas de servicios de bloque, 30 tramos, 33 textos PDF; 0 errores de validación; tabla de control con la diferencia por SKU y pax visible.
- Ningún archivo con costos reales en el repo.

## PROMPT PARA LOVABLE (plantilla; Codex lo completa con nombres reales)
```
[Lovable] Después del merge del PR <n> (codex/T01k-importador-paquete-v2).

PASO 1 · Base de datos
Aplica en Lovable Cloud, en este orden, las migraciones: <lista>. Confirma cada una. Regenera los tipos de Supabase.

PASO 2 · Pantalla /admin/importar (solo admin)
- Subir .zip → llama <stage fn>. Muestra resumen por tabla: nuevos / cambian / iguales / errores, con semáforo.
- Pestañas: Errores (rojo, bloquean), Avisos (ámbar), Diferencias (tabla filtrable por tabla y acción), Control de costos (09_control_costos: SKU × 1–5 pax, costo hoja vs costo app con costTemplate, verde ≤1 USD, ámbar ≤15, rojo >15).
- Botón "Confirmar importación" deshabilitado si hay errores → <commit fn>. Botón "Descartar".
- Funciones a usar: <lista de src/lib>. No calcules nada en la UI. Colores solo por tokens de src/styles.css.

PASO 3 · Cómo lo pruebo
1. Sube src/test/fixtures/import-v2-sintetico/paquete-v2-sintetico.zip → 0 errores, 1 aviso.
2. Confirma → aparecen 3 plantillas y el bloque "Día de salar" con 2 variantes.
3. Vuelve a subirlo → todo "iguales".
```
