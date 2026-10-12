# Pruebas de cotización en navegador

Requieren Bun, Node 22 y Docker. Usan un proyecto Supabase **local y efímero**, con Auth, PostgREST, RLS, Storage y RPC reales. No hay credenciales de Cloud ni acceso a datos de clientes reales. El único doble de prueba es el transporte de Resend: el handler de producción descarga el PDF real y ejecuta sus RPC de outbox y transición; el doble valida el adjunto y entrega un recibo `e2e-mock-*`, sin enviar correo.

Desde la raíz del repositorio:

```sh
bun install --frozen-lockfile
bunx playwright install --with-deps chromium
node tests/e2e/prepare-functions.mjs
bunx supabase start --workdir tests/e2e
bun run e2e:setup
bunx supabase functions serve send-quote-email --workdir tests/e2e --env-file tests/e2e/.local/functions.env
```

En otra terminal, `bun run test:e2e`. Playwright inicia Vite en 127.0.0.1:4173 con las claves locales, realiza login por UI como vendedor y ejecuta **dos repeticiones, sin retries**. Al terminar: `bunx supabase stop --workdir tests/e2e --no-backup`. El setup rechaza una base existente y cualquier host remoto. No usar `supabase link`, `db push` ni `deploy`.

El CI ejecuta lo mismo en cada push y PR. El reporte HTML, capturas, videos, traces y PDF quedan siete días en el artefacto `playwright-report`. Las credenciales efímeras no se incluyen en el artefacto; las trazas pueden contener sesiones de la base local, que se destruye al finalizar.

## Datos y límites de la validación

- Se aplican todas las migraciones originales en orden y los seeds históricos. Las precondiciones históricas de migraciones se preparan con `scripts/db/migration-fixtures.mjs`, igual que en las pruebas de BD. No se omite ninguna migración ni se cambia su SQL.
- Se importa el seed SPA de 2 pax. Solo en esta base local se simula la aprobación del catálogo/textos y se vacían sus avisos de importación. Tarifas, servicios, cantidades, habitaciones y referencias monetarias se conservan. Esto **no certifica la revisión de textos ni aprueba datos en Cloud**.
- El costo SPA esperado es USD 1.939,000864, tolerancia USD 1. Sheets no proporciona una venta; el test comprueba por separado la regla acordada de markup 25 % (USD 2.423,75108). No la presenta como una venta publicada en Sheets.
- El camino de bloques añade los tres códigos `IMPORT_SPAUYU_MP_2PAX_D1/2/3` desde la UI. Actualmente `addBlockDay` y su RPC rechazan servicios multi-día. El test debe fallar hasta implementar ese camino correctamente; no se sustituye por crear otra plantilla.
- Bolivia conserva `input: null`: faltan el mapeo SKU, cantidades/rooming y la decisión sobre los USD 3.000 fijos de venta. El test falla con `bolivia-diferencias.md`, sin `skip`, `test.fail` ni importes inventados. Para habilitar el recorrido completo hace falta completar el fixture, declarar `template_sku` e incorporar el seed revisado de esa plantilla al setup; entonces se verifican costo USD 9.179 y venta USD 12.179 por la UI.

Los tres casos deben pasar dos veces para cumplir la aceptación; instalar Playwright o tener solo SPA en verde no la cumple.
