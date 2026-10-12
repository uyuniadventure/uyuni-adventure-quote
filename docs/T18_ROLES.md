# T18 · Roles y permisos

Implementación sobre `main` `53610b5`. T00 sigue `[~]`, por lo que T18 es la
primera tarea `[ ]` sin dependencias. No se adelantan T01–T17.

Se reutilizan los commits `e82817e` y `6e91712` del PR #20: aquel PR se fusionó
en `codex/e2e-verificacion-final`, no en `main`. Se añade el seed exigido por T18
y se prueba la función `listAdminUsers` con el transporte real
`src/test/pglite-supabase.ts`. La consulta segura existente es una RPC
`SECURITY DEFINER` con validación de Admin, no una vista que exponga `auth.users`.

## Matriz de permisos

“Propia” significa que `quotes.seller_id = auth.uid()`. Operación también crea
sus propias cotizaciones; solo Admin accede a todas. Operación sí gestiona todas
las fichas vendidas. El permiso no evita las validaciones de estado, datos y pago.

| Acción | Vendedor | Operación | Admin |
|---|---|---|---|
| Ver costo y margen de su cotización | Sí | Sí | Sí |
| Crear, editar y enviar su cotización | Sí | Sí | Sí |
| Leer o editar cotizaciones ajenas, sus PDF y emails | No | No | Sí |
| Registrar pagos en su cotización | Sí | Sí | Sí |
| Registrar pagos en una cotización ajena | No | No | Sí |
| Crear servicios pendientes propios | Sí | Sí | Sí |
| Crear servicios activos | No | Sí | Sí |
| Leer sus propios servicios pendientes | Sí | Sí | Sí |
| Leer servicios pendientes de otro vendedor | No | Sí | Sí |
| Crear y editar sus bloques/plantillas pendientes | Sí | Sí | Sí |
| Editar bloques/plantillas activos o ajenos | No | Sí | Sí |
| Sugerir cambios de tarifa | Sí | Sí | Sí |
| Modificar tarifas maestras | No | Sí | Sí |
| Aprobar/rechazar sugerencias y productos | No | Sí | Sí |
| Aprobar importaciones en bloque (simulación previa) | No | No | Sí |
| Leer Operación de sus propias ventas | Sí | Sí | Sí |
| Leer Operación de ventas ajenas | No | Sí | Sí |
| Modificar fichas, reservas y costos de Operación | No | Sí | Sí |
| Consultar/editar pasajeros | No | Sí | Sí |
| Leer tipos de cambio para cotizar | Sí | Sí | Sí |
| Modificar divisas, tipos de cambio y T&C | No | No | Sí |
| Consultar emails en /admin y asignar roles | No | No | Sí |
| Leer directamente auth.users mediante la API | No | No | No |

Las políticas corregidas afectan `ops_services`, `ops_items`,
`ops_supplier_payables` y `ops_communications`. Las tres vistas de Operación
respetan RLS del usuario. Pasajeros siguen restringidos a Admin/Operación.
`admin_list_users` devuelve solo ID, email actual, nombre, rol y fecha de alta;
un cambio de email en Auth se refleja en la siguiente consulta.

## Aplicación en Lovable Cloud (manual)

1. Con las migraciones anteriores ya aplicadas hasta
   `20261012000400_quote_add_block_sequence.sql`, aplicar
   `20261012000500_role_permissions.sql` **solo si está pendiente**.
   Regenerar tipos de Supabase y desplegar el frontend del PR. Si el PR #20 ya se
   aplicó manualmente en Cloud, verificar su registro antes de repetir SQL.
2. En la administración de **Auth / Users**, crear dos cuentas con contraseña:
   `operacion@prueba.local` y `vendedor@prueba.local`. Confirmarlas manualmente
   (Auto confirm) y usar contraseñas distintas guardadas fuera del repositorio.
   Estos correos de prueba no reciben invitaciones ni recuperación por email;
   la entrada se prueba con email y contraseña. No activar usuarios reales ni
   cambiar su rol. Si una cuenta ya existe, reutilizarla.
3. Ejecutar como propietario de BD el archivo completo
   `supabase/seed/test_role_profiles.sql`, **después de crear ambas cuentas**.
   Es un seed opcional, no se registra como migración ni se ejecuta con el
   despliegue automático. Asigna Operación y Vendedor a esos dos IDs de Auth.
   Si falta una cuenta confirmada o una de ellas ya es Admin, cancela todo.
   Repetirlo conserva nombres existentes y no duplica perfiles; las cuentas
   reales y los alias `info+prueba-*` quedan intactos.
4. Entrar con Admin en `/admin`: comprobar ambos emails y roles. Abrir sesiones
   separadas con las cuentas de prueba: Vendedor crea su borrador, sugiere una
   tarifa y no puede aprobar ni entrar a Admin; Operación ve `/operacion`,
   modifica tarifas y aprueba. Crear una cotización de prueba con otro usuario
   y comprobar que Vendedor no la ve, tampoco su copia vendida en Operación.

El seed no crea cuentas en Auth ni contiene contraseñas. Codex no ejecuta estos
pasos contra Cloud. Las pruebas siguientes usan bases aisladas y datos ficticios.

## Evidencia automatizada

- `bun run test:roles`: 119 aserciones PGlite con todas las migraciones reales;
  incluye aislamiento de snapshots/vistas, creación y envío propio, denegación
  de tarifas/aprobación/escalada, modificaciones de Operación y acceso a emails.
- `src/lib/admin/users.test.ts`: 9 tests con el transporte PGlite de Supabase:
  seed idempotente, cuentas faltantes/no confirmadas, preservación de Admin,
  perfil faltante, emails actuales, campos devueltos y denegación por rol/anon.
- `bun run test:db`: además comprueba catálogo pendiente y publicado, pagos,
  permisos sobre hijos, aprobación de importaciones, FX y datos privados.
- `tests/e2e/roles.spec.ts`: sesiones reales de vendedor, operación y admin,
  consultas API sujetas a RLS, aprobación por la UI y columna Email en Admin.
  El CI ejecuta cada caso dos veces sin reintentos, junto a los casos de ventas.

Los dos fixtures incompletos Bolivia y SIVOLA/WE ROAD siguen siendo fallos
conocidos de T03–T04: no se omiten ni se cambian sus expectativas en T18.
La validación completa del flujo comercial corresponde a T19.

Verificación local de esta entrega: instalación congelada aprobada; TypeScript
de aplicación y E2E aprobado; Vitest **238/240**, con esos dos fallos previos y
ningún test omitido; las ocho suites de `test:db` aprobadas. No equivale a haber
aplicado la migración o creado las cuentas en Cloud.
