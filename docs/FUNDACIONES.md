# Fundaciones: aplicación y verificación

La base del repositorio no contenía migraciones y `src/integrations/supabase/types.ts` describía un esquema vacío. Estas migraciones crean el esquema de SPEC §4.1–4.7; no se aplicaron a un proyecto remoto. Si el proyecto remoto tiene tablas no reflejadas en Git, comparar primero su esquema: la migración transaccional falla ante nombres existentes y no los sobrescribe.

## Preparación de Codex

Repositorio: `uyuniadventure/uyuni-adventure-quote`. Script de preparación: `npm install -g bun && bun install` (también disponible en `scripts/setup.sh`).

Configurar `SUPABASE_URL=https://vmehmmkyevttkgshpqnd.supabase.co` y `SUPABASE_ANON_KEY` con la clave pública **de ese proyecto**, fuera de Git. `.env.example` contiene únicamente nombres y un marcador vacío. El `.env` existente de Lovable apunta a otro proyecto y no se ha modificado. La anon key del proyecto solicitado no fue proporcionada. No se requiere ninguna clave para generar seeds, tipos ni ejecutar las pruebas locales. Este cambio no configura automáticamente un entorno de Codex Cloud.

## Migraciones: orden exacto en SQL Editor

Ejecutar cada archivo completo, como propietario de la base, una sola vez:

1. `supabase/migrations/20261004000100_foundation_schema.sql`
2. `supabase/migrations/20261004000200_security.sql`

Todas las tablas tienen UUID, timestamps con trigger y RLS; todas las claves foráneas están indexadas. Las tablas existentes en el esquema de esta entrega que requieren referencias circulares se completan con `ALTER TABLE`. Las tres vistas de operación usan `security_invoker`, sin datos de pasajeros.

`profiles` se crea con el alta en `auth.users`; los usuarios preexistentes también reciben perfil. `info@uyuniadventure.com` obtiene `admin` cuando su correo está confirmado; los demás obtienen `vendedor`. No se acepta el rol desde metadatos del usuario. El admin puede asignar `operacion` desde `profiles`. Los usuarios pueden leer su propio perfil para conocer su rol, pero solo admin administra perfiles.

`public.current_role()` debe escribirse con el esquema, porque `CURRENT_ROLE` es también palabra reservada SQL. Cotizaciones y sus hijos son accesibles por su vendedor o admin; operación mantiene la misma restricción para cotizaciones ajenas (SPEC §3). Operación y admin administran el tarifario y Fase 2; solo ellos acceden a pasajeros. Divisas, cambios, T&C, textos fijos y datos bancarios quedan restringidos a admin, según el pedido. Las futuras funciones de PDF tendrán que obtener esos datos mediante un flujo autorizado; no se abrió acceso general.

Vendedores crean servicios pendientes y solicitudes de cambio, pero no escriben tarifas. Para dar precio inicial a un servicio nuevo, pueden proponerlo en `service_change_requests`. Pueden editar sus propios módulos, bloques, plantillas y sus hijos solo mientras estén pendientes; operación/admin aprueban. Servicios pendientes de otros vendedores quedan ocultos.

## Seeds: orden exacto en SQL Editor

Después de ambas migraciones, ejecutar:

1. `supabase/seed/00_base.sql`
2. `supabase/seed/01_tarifario_001.sql`
3. `supabase/seed/01_tarifario_002.sql`
4. `supabase/seed/01_tarifario_003.sql`
5. `supabase/seed/01_tarifario_004.sql`
6. `supabase/seed/01_tarifario_005.sql`
7. `supabase/seed/01_tarifario_006.sql`
8. `supabase/seed/01_tarifario_007.sql`
9. `supabase/seed/01_tarifario_008.sql`
10. `supabase/seed/01_tarifario_009.sql`
11. `supabase/seed/01_tarifario_010.sql`
12. `supabase/seed/01_tarifario_011.sql`

Cada archivo contiene como máximo 300 filas a insertar, con `ON CONFLICT DO NOTHING`. Los UUID son determinísticos; se puede repetir la ejecución sin duplicar registros. Estos seeds están diseñados para la base inicial de esta entrega: no reemplazan ni actualizan datos existentes.

Resultado: **857 servicios, 1.169 tarifas, 69 proveedores y 1.159 alias SKU**. Los 1.206 registros CSV se distribuyen en 1.169 tarifas importadas, 35 filas omitidas por los problemas indicados y 2 registros de divisas trasladados a `00_base.sql` (filas 1138 y 1139). Las tasas iniciales son 1 USD, 885 CLP y 6,91 BOB por USD, con fecha base 2026-01-01; no representan una consulta de mercado actual. No se inventaron tasas de ARS, PEN ni EUR.

Decisiones de importación:

- Los 857 servicios quedan `pendiente` para revisión humana (SPEC §9). Las 238 tarifas con solo rack usan ese importe en `price_net`, conservan `price_rack`, `net_cost_missing=true` y la nota literal `sin costo neto`.
- Se agrupan 125 conjuntos de tramos de pasajeros. Se conserva el primer SKU original como SKU canónico; cada SKU original sigue resolviendo mediante `service_sku_aliases`. Se separan monedas, tipos de vehículo, habitaciones y demás atributos de producto. No se fusionan etiquetas similares sin evidencia del tramo en el SKU.
- Proveedores normalizados por mayúsculas, espacios y acentos; los nombres originales se conservan como alias. No se fusionan empresas por coincidencia difusa.
- Diez filas sin SKU reciben `IMPORT_REVIEW_<fila>`; la unidad desconocida queda NULL, sin asumir cómo se cobra. Un servicio no puede activarse sin unidad y moneda. Etiquetas vacías usan el SKU como nombre provisional y se marcan en `import_issues`.
- Regímenes de comida no reconocidos quedan NULL con el original en notas. `PaxMin=1`/`PaxMax=5` se leen como números; fechas `DD/MM/AAAA` se convierten a ISO. Duraciones de medio día ocupan un día calendario, conservando el original en notas. El valor inválido `PER_PERSON` en capacidad del vehículo queda NULL y anotado.
- Las filas sin precio conservan ambos precios NULL y permanecen pendientes. No se convierten a costo cero.

`supabase/seed/report.json` contiene las omisiones, la agrupación completa y problemas de origen. El último SQL también lista las filas omitidas en comentarios. Los números son registros CSV contando el encabezado como fila 1.

## Correlativo anual y alcance

`select public.next_quote_code('UYUSPA-3D2N-PTd', 'it');` devuelve, por ejemplo, `UYUSPA-3D2N-PTd-IT-26-0001`. Requiere usuario autenticado con perfil. El incremento es atómico, usa el año de Santiago y no trunca valores superiores a 9999. Se admiten huecos si no se guarda la cotización. Las versiones reutilizan el código base y agregan `-vN`; no consumen otro correlativo.

Esta entrega prepara el esquema de Fase 2 y sus vistas. La máquina de estados, la creación automática de operación al vender, las agrupaciones de pagos, el motor de precios y el envío de mensajes corresponden a las tareas posteriores C4–C10. No hay llamadas ni cambios en interfaz o `src/integrations/supabase/`.

## Verificación local

```sh
bun install
bun run test:db
bun run db:types
bunx tsc --noEmit
bun run test
```

`test:db` ejecuta las migraciones reales en PostgreSQL con PGlite, emula únicamente el contrato mínimo de Auth de Supabase y aplica todos los seeds dos veces. Verifica permisos mediante `SET ROLE authenticated` y distintos `auth.uid()`: escalamiento de roles, servicios pendientes, tarifas, hijos de módulos aprobados, cotizaciones ajenas, pagos, reasignación de ítems, pasajeros, anon y correlativo. Es una prueba local; no valida configuración de Auth/Storage/red del proyecto remoto.

`bun run db:seed:generate` regenera SQL y reporte desde el CSV con Python 3 (biblioteca estándar). `bun run db:types` genera `src/types/db.ts` consultando el catálogo del esquema migrado local, incluidos nullabilidad, defaults, columnas generadas, relaciones, vistas y enums. No modifica los tipos gestionados por Lovable.
