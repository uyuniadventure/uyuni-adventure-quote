# Fundaciones: aplicaciÃ³n y verificaciÃ³n

## Estado al 6 de octubre de 2026

La base de datos está en **Lovable Cloud**. Las migraciones 000100–000500 y los seeds ya fueron aplicados, según confirmación del responsable del proyecto. El historial de `main` también registra la aplicación de 000600 y 000700 (commit `1f77641`). Codex no tiene acceso directo a la base y no realizó una verificación remota.

Esta limpieza no requiere ejecutar SQL. No volver a aplicar las migraciones ni los seeds históricos.

Se eliminaron únicamente estas cinco copias UUID, cuyo contenido coincide con los archivos canónicos salvo finales de línea:

| Archivo eliminado | Migración canónica conservada |
|---|---|
| `20261004185337_8c3001a9-e151-41d1-b16c-d5d8a09c8c24.sql` | `20261004000100_foundation_schema.sql` |
| `20261004185426_93033aae-da70-47f9-aaa0-864f94cbc222.sql` | `20261004000200_security.sql` |
| `20261004213714_6d8c3208-443f-4a35-8e80-06c4ff1a1e69.sql` | `20261004000300_snapshot_fields.sql` |
| `20261004213938_6758ad2c-d611-4410-aaae-dec14305ede3.sql` | `20261004000400_quote_workflows.sql` |
| `20261004214018_b09c38cb-0a45-40fa-9201-65508122c648.sql` | `20261004000500_sales_operations.sql` |

**Actualización del 11 de octubre de 2026:** los archivos `20261006092542_72b5a0a6-914a-40b7-a948-015194573dd2.sql` y `20261006092618_6729399b-244b-4656-aa81-11f72c6e4b7c.sql` se reconciliaron como comprobaciones de los objetos creados por 000600/000700. Conservan las versiones históricas sin repetir el DDL. El directorio completo ya se reproduce sobre una base vacía y las pruebas de BD pasan. No se requiere ejecutar esos alias ni reparar el historial en Cloud. La nueva migración y el seed LTd sí están pendientes; véase el [orden de aplicación de LTd](VALIDACION_LTD.md).

## Preparación local

Repositorio: `uyuniadventure/uyuni-adventure-quote`. Script: `npm install -g bun && bun install` (también disponible en `scripts/setup.sh`). Usar la configuración autorizada de Lovable Cloud; no sustituirla por la URL del proyecto externo mencionada en la propuesta inicial. No se modifican `.env` ni `src/integrations`.

No se requieren claves para las pruebas locales con PGlite. Los cambios futuros de base deben entregarse como nuevas migraciones o seeds, con orden de aplicación en el PR para Lovable.

## Esquema y permisos

Todas las tablas tienen UUID, timestamps con trigger y RLS; todas las claves forÃ¡neas estÃ¡n indexadas. Las tablas existentes en el esquema de esta entrega que requieren referencias circulares se completan con `ALTER TABLE`. Las tres vistas de operaciÃ³n usan `security_invoker`, sin datos de pasajeros.

`profiles` se crea con el alta en `auth.users`; los usuarios preexistentes tambiÃ©n reciben perfil. `info@uyuniadventure.com` obtiene `admin` cuando su correo estÃ¡ confirmado; los demÃ¡s obtienen `vendedor`. No se acepta el rol desde metadatos del usuario. El admin puede asignar `operacion` desde `profiles`. Los usuarios pueden leer su propio perfil para conocer su rol, pero solo admin administra perfiles.

`public.current_role()` debe escribirse con el esquema, porque `CURRENT_ROLE` es tambiÃ©n palabra reservada SQL. Cotizaciones y sus hijos son accesibles por su vendedor o admin; operaciÃ³n mantiene la misma restricciÃ³n para cotizaciones ajenas (SPEC Â§3). OperaciÃ³n y admin administran el tarifario y Fase 2; solo ellos acceden a pasajeros. Divisas, cambios, T&C, textos fijos y datos bancarios quedan restringidos a admin, segÃºn el pedido. Las futuras funciones de PDF tendrÃ¡n que obtener esos datos mediante un flujo autorizado; no se abriÃ³ acceso general.

Vendedores crean servicios pendientes y solicitudes de cambio, pero no escriben tarifas. Para dar precio inicial a un servicio nuevo, pueden proponerlo en `service_change_requests`. Pueden editar sus propios mÃ³dulos, bloques, plantillas y sus hijos solo mientras estÃ©n pendientes; operaciÃ³n/admin aprueban. Servicios pendientes de otros vendedores quedan ocultos.

## Seeds: orden exacto en SQL Editor

DespuÃ©s de ambas migraciones, ejecutar:

1. `supabase/seed/applied/00_base.sql`
2. `supabase/seed/applied/01_tarifario_001.sql`
3. `supabase/seed/applied/01_tarifario_002.sql`
4. `supabase/seed/applied/01_tarifario_003.sql`
5. `supabase/seed/applied/01_tarifario_004.sql`
6. `supabase/seed/applied/01_tarifario_005.sql`
7. `supabase/seed/applied/01_tarifario_006.sql`
8. `supabase/seed/applied/01_tarifario_007.sql`
9. `supabase/seed/applied/01_tarifario_008.sql`
10. `supabase/seed/applied/01_tarifario_009.sql`
11. `supabase/seed/applied/01_tarifario_010.sql`
12. `supabase/seed/applied/01_tarifario_011.sql`

También se archivaron `02_bloques_001.sql` a `02_bloques_004.sql` y `blocks-report.json`, aplicados después del tarifario. Véase `supabase/seed/README.md`.

Cada archivo contiene como mÃ¡ximo 300 filas a insertar, con `ON CONFLICT DO NOTHING`. Los UUID son determinÃ­sticos; se puede repetir la ejecuciÃ³n sin duplicar registros. Estos seeds estÃ¡n diseÃ±ados para la base inicial de esta entrega: no reemplazan ni actualizan datos existentes.

Resultado: **857 servicios, 1.169 tarifas, 69 proveedores y 1.159 alias SKU**. Los 1.206 registros CSV se distribuyen en 1.169 tarifas importadas, 35 filas omitidas por los problemas indicados y 2 registros de divisas trasladados a `00_base.sql` (filas 1138 y 1139). Las tasas iniciales son 1 USD, 885 CLP y 6,91 BOB por USD, con fecha base 2026-01-01; no representan una consulta de mercado actual. No se inventaron tasas de ARS, PEN ni EUR.

Decisiones de importaciÃ³n:

- Los 857 servicios quedan `pendiente` para revisiÃ³n humana (SPEC Â§9). Las 238 tarifas con solo rack usan ese importe en `price_net`, conservan `price_rack`, `net_cost_missing=true` y la nota literal `sin costo neto`.
- Se agrupan 125 conjuntos de tramos de pasajeros. Se conserva el primer SKU original como SKU canÃ³nico; cada SKU original sigue resolviendo mediante `service_sku_aliases`. Se separan monedas, tipos de vehÃ­culo, habitaciones y demÃ¡s atributos de producto. No se fusionan etiquetas similares sin evidencia del tramo en el SKU.
- Proveedores normalizados por mayÃºsculas, espacios y acentos; los nombres originales se conservan como alias. No se fusionan empresas por coincidencia difusa.
- Diez filas sin SKU reciben `IMPORT_REVIEW_<fila>`; la unidad desconocida queda NULL, sin asumir cÃ³mo se cobra. Un servicio no puede activarse sin unidad y moneda. Etiquetas vacÃ­as usan el SKU como nombre provisional y se marcan en `import_issues`.
- RegÃ­menes de comida no reconocidos quedan NULL con el original en notas. `PaxMin=1`/`PaxMax=5` se leen como nÃºmeros; fechas `DD/MM/AAAA` se convierten a ISO. Duraciones de medio dÃ­a ocupan un dÃ­a calendario, conservando el original en notas. El valor invÃ¡lido `PER_PERSON` en capacidad del vehÃ­culo queda NULL y anotado.
- Las filas sin precio conservan ambos precios NULL y permanecen pendientes. No se convierten a costo cero.

`supabase/seed/applied/report.json` contiene las omisiones, la agrupaciÃ³n completa y problemas de origen. El Ãºltimo SQL tambiÃ©n lista las filas omitidas en comentarios. Los nÃºmeros son registros CSV contando el encabezado como fila 1.

## Correlativo anual y alcance

`select public.next_quote_code('UYUSPA-3D2N-PTd', 'it');` devuelve, por ejemplo, `UYUSPA-3D2N-PTd-IT-26-0001`. Requiere usuario autenticado con perfil. El incremento es atÃ³mico, usa el aÃ±o de Santiago y no trunca valores superiores a 9999. Se admiten huecos si no se guarda la cotizaciÃ³n. Las versiones reutilizan el cÃ³digo base y agregan `-vN`; no consumen otro correlativo.

Esta entrega prepara el esquema de Fase 2 y sus vistas. La mÃ¡quina de estados, la creaciÃ³n automÃ¡tica de operaciÃ³n al vender, las agrupaciones de pagos, el motor de precios y el envÃ­o de mensajes corresponden a las tareas posteriores C4â€“C10. No hay llamadas ni cambios en interfaz o `src/integrations/supabase/`.

## VerificaciÃ³n local

```sh
bun install
bun run test:db
bun run db:types
bunx tsc --noEmit
bun run test
```

**Actualizado el 11 de octubre de 2026:** `test:db` pasa tras reconciliar los duplicados. No se ocultan ni se saltan migraciones en el runner. Ejecuta las migraciones reales en PostgreSQL con PGlite, emula únicamente el contrato mínimo de Auth de Supabase y verifica la repetición de los seeds históricos. Comprueba permisos mediante `SET ROLE authenticated` y distintos `auth.uid()`: escalamiento de roles, servicios pendientes, tarifas, hijos de módulos aprobados, cotizaciones ajenas, pagos, reasignación de ítems, pasajeros, anon y correlativo. También prueba snapshots, estados y entrega. La referencia LTd y su seed se verifican con `npm run test`. Son pruebas locales; no validan la configuración de Auth/Storage/red del proyecto remoto.

`bun run db:seed:generate` regenera SQL y reporte desde el CSV con Python 3 (biblioteca estÃ¡ndar). `bun run db:types` genera `src/types/db.ts` consultando el catÃ¡logo del esquema migrado local, incluidos nullabilidad, defaults, columnas generadas, relaciones, vistas y enums. No modifica los tipos gestionados por Lovable.
