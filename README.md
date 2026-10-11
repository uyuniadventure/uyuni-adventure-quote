# Uyuni Adventure Quote

Crea una web app interna llamada "Cotizador Uyuni Adventure" para una agencia de viajes (DMC) que cotiza tours multi-día en Bolivia y Chile.

IMPORTANTE: no actives Lovable Cloud ni ningún backend. Voy a conectar mi propio Supabase después.

En esta primera versión construye SOLO la estructura visual:

- Interfaz en español, diseño sobrio y profesional, colores: azul marino #1E2A44 y naranja #F28C28.

- Sidebar con: Dashboard, Nueva cotización, Cotizaciones, Plantillas, Bloques diarios, Módulos de actividad, Tarifario, Proveedores, Clientes, Media, Revisión de importación, Operación, Admin.

- Cada sección muestra un título y "En construcción".

- Página de login de solo diseño.

Stack: React + Vite + TypeScript + Tailwind + shadcn/ui.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6561123e-1b54-4a5b-8e60-0ee5263e4911).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Importación de presupuestos y casos reales

Requiere Bun y `bun install --frozen-lockfile`. El piloto autorizado lee únicamente
`SPAUYU-3D2N-MP`, 2 pagantes y 0 TC, de `data/import/presupuestos.xlsx`.

```sh
bun run import:presupuesto --sku SPAUYU-3D2N-MP --pax 2
bun run import:presupuesto --sku SPAUYU-3D2N-MP --pax 2 --apply
bun run test:references
bun run compare:presupuestos --write-report
```

La primera orden es un **dry-run**: imprime enlaces actuales/propuestos, cantidades,
habitaciones, tramo del vehículo, SKU no encontrados y comparación por celda. No escribe
archivos. `--apply` guarda el fixture, el informe y un **seed SQL local**; nunca conecta
con Cloud. Si hay datos ambiguos, SKU ausentes o discrepancias, no publica el seed.
Las fórmulas compuestas y otros escenarios requieren revisión, no se deducen precios
ni unidades a partir de los totales. Los SKU desconocidos aparecen en una lista aparte.

Para Lovable: aplicar las migraciones fechadas en orden, después los seeds históricos
de `supabase/seed/applied/report.json` y `blocks-report.json` si faltan, y por último
`supabase/seed/04_spauyu_mp_2pax.sql`. El seed crea bloques propios de esta plantilla,
conserva los anteriores y las cotizaciones existentes, y no modifica tarifas. Repetirlo
no sobrescribe ediciones posteriores. Un cambio de fuente exige una nueva revisión.
La plantilla permanece pendiente de revisión y limitada a 2+0 pasajeros.

El fixture de SPA-UYU compara **costo**, porque la venta está vacía en el Excel:
USD 1.939,00, con FX congelado CLP/USD 925,92. El markup 25 % produce USD 2.423,75
de venta. Para reproducirlo en una cotización se debe usar ese FX; no se cambia el
tipo de cambio global ni se demuestra que las tarifas actuales de Cloud sean iguales.
El test de integración aplica el seed en PostgreSQL local, crea, calcula, busca y
reabre el borrador usando las funciones reales de la aplicación.

Los tres tests históricos están activos y leen `tests/fixtures`. Bolivia 9+1 y el
caso sustituido por WE ROAD 10D fallan de forma visible hasta completar los datos
indicados en sus fixtures. No usan `skip`, `test.fails`, costos inventados ni porcentajes
obtenidos despejando el total esperado. El informe completo queda en
`docs/pendientes/comparacion_presupuestos.txt`; `N/D` significa que no hay un dato
verificable, no que el costo sea cero. Estos dos fallos también hacen fallar `bun run test`.
