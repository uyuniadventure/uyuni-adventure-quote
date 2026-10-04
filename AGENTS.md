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

- TanStack Start v1 con rutas file-based en `src/routes/`; el shell (sidebar + header) vive en `src/routes/__root.tsx` y `/login` se renderiza sin sidebar (check de pathname en `RootComponent`).
- Los datos de navegación (secciones, grupos, metadata head de cada sección) se definen una sola vez en `src/components/section.tsx` (`SECTIONS`, `SECTION_GROUPS`, `sectionHead`, `SectionShell`); el sidebar y las rutas consumen de ahí para evitar divergencia.
- Todos los colores van por tokens semánticos en `src/styles.css` (`@theme inline` + `:root`); nada de colores hardcodeados en componentes.

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
