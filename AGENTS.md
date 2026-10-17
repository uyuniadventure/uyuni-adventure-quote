<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

## Reglas del proyecto

- TanStack Start v1 con rutas file-based en `src/routes/`; todas las pantallas internas van bajo `src/routes/_authenticated/` (gate `ssr:false` que redirige a `/login` y expone `auth` = usuario + rol de `profiles`); el shell (sidebar + header) vive en `_authenticated/route.tsx`, así login y reset-password quedan sin sidebar.
- Permisos de UI por rol se leen con `useCurrentUser()`/`canManageCatalog()` de `src/hooks/use-auth.ts`; la autorización real la hace RLS.
- Los datos de navegación (secciones, grupos, metadata head de cada sección) se definen una sola vez en `src/components/section.tsx` (`SECTIONS`, `SECTION_GROUPS`, `sectionHead`, `SectionShell`); el sidebar y las rutas consumen de ahí para evitar divergencia.
- Las pantallas de catálogo (módulos, bloques, plantillas, revisión) reutilizan `src/components/catalog/kit.tsx` (filtros, buscador, permisos de fila, panel de traducciones que invoca la Edge Function `translate-block`) y un editor en Sheet por entidad; así la revisión de importación abre el mismo editor que cada sección.
- Nueva cotización vive en `/nueva-cotizacion?quote=<id>` (`src/components/quote/`): toda escritura + `recalculateQuote` pasa por una cola serializada (`useQuoteActions`) porque `save_quote_calculation` exige `updated_at` vigente; las operaciones de días que `src/lib` no expone están aisladas en `quote-ops.ts` para migrarlas a `src/lib/quotes`.
- Las tablas de configuración simples (Admin, T&C) usan el CRUD genérico `src/components/admin/crud-table.tsx` (config de columnas, cliente sin tipar, RLS decide el acceso) para no duplicar formularios por tabla.
- Media sube a un bucket privado de Storage `media` (rutas `places/<id>/…` y `hotels/<id>/…`) y muestra URLs firmadas.
- Todos los colores van por tokens semánticos en `src/styles.css` (`@theme inline` + `:root`); nada de colores hardcodeados en componentes.
- Selected catalog approval, deletion and archiving use shared catalog action dialogs backed only by `src/lib/catalog`; filtered selection reads every ID page so bulk actions cannot silently truncate the catalog.

## Reglas para Codex

### Contexto
Web app interna de cotización y operación para Uyuni Adventure. La especificación completa y obligatoria está en SPEC.md. Léela antes de cada tarea.

### Stack
TanStack Start (React, rutas basadas en archivos en src/routes) + TypeScript + Tailwind + shadcn/ui (frontend generado por Lovable), Supabase (Postgres, Auth, RLS, Storage, Edge Functions).

### Reglas
1. Trabaja siempre en una rama nueva (`codex/<tarea>`) y entrega un Pull Request. Nunca hagas push directo a main.
2. Todo cambio de esquema se hace como migración SQL en /supabase/migrations, con nombre fechado. Nunca modifiques tablas desde el código de la app.
3. Toda tabla nueva lleva políticas RLS según la sección 3 de SPEC.md.
4. La lógica de negocio va en /src/lib (pricing, sku, states). Los componentes de UI no calculan precios.
5. /src/lib/pricing es TypeScript puro con tests (Vitest). Todo cambio en pricing requiere tests que pasen.
6. No modifiques el diseño visual de los componentes creados por Lovable salvo que la tarea lo pida.
7. Nunca pongas claves secretas en el frontend. La service_role key solo se usa en Edge Functions.
8. Moneda de venta: USD. Los costos se guardan en su moneda original y se convierten con el tipo de cambio congelado en la cotización.
9. Al terminar, resume en el PR qué cambió, qué migraciones hay que aplicar y cómo probarlo.
10. La base de datos es Lovable Cloud y Codex no tiene acceso directo. Todo cambio de base se entrega como migración o seed SQL en `supabase/`; el PR debe indicar el orden exacto de ejecución para que Lovable lo aplique. No ejecutar cambios contra una base remota.
11. Código compartido entre la app y Edge Functions (p. ej. los módulos de `supabase/functions/_shared/` importados desde `src/`): no introduzcas especificadores `npm:`/`jsr:` directos en imports, reexports ni imports dinámicos. Declara la resolución de Deno en `supabase/functions/deno.json` e importa por el nombre del paquete en el archivo compartido. Ejemplo: `from "parse5"` en TypeScript y `"parse5": "npm:parse5@7.3.0"` en el import map; la app instala la misma versión en `package.json`.

Compatibilidad existente confirmada por Andrea (16-10-2026): conservar el plugin
`deno-npm-parse5` de `vite.config.ts`, que resuelve a una ruta real con
`createRequire().resolve("parse5")`, la declaración `src/@types/npm-parse5.d.ts`
y el alias de `vitest.config.ts`. Cubren el import actual de `proposal-html.ts`;
no son el patrón para dependencias compartidas nuevas. No retirarlos como parte
de una sincronización ni devolver únicamente `"parse5"` desde el plugin de Vite.
Vitest tiene configuración propia y no hereda los plugins de `vite.config.ts`.
Al cambiar esta integración, comprobar `bunx tsc --noEmit`, `bunx vitest run`
y `bun run build`; al cambiar imports de Edge, comprobar también Deno usando
`--config supabase/functions/deno.json`.
