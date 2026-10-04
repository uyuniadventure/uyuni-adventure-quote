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
