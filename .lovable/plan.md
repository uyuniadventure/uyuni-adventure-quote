# Plan: Cotizador Uyuni Adventure — Estructura visual v1

## Alcance
Solo UI. Sin Lovable Cloud, sin backend, sin Supabase. El usuario conectará su propio Supabase después. Login es de solo diseño (sin lógica de autenticación).

## Design system (src/styles.css)
- Azul marino `#1E2A44` → color primario (sidebar, encabezados, botones primarios)
- Naranja `#F28C28` → color de acento (acciones destacadas, ítems activos, CTAs)
- Interfaz clara, sobria, tipografía neutra profesional (Inter/Geist), español en toda la UI.
- Tokens definidos en `@theme inline` + `:root` en oklch; sin colores hardcodeados en componentes.

## Rutas (TanStack Start, file-based)
| Ruta | Archivo | Contenido |
|---|---|---|
| `/` | `index.tsx` | Dashboard (título + "En construcción") |
| `/login` | `login.tsx` | Página de login de diseño (form visual, botón inerte) |
| `/nueva-cotizacion` | | Título + "En construcción" |
| `/cotizaciones` | | ídem |
| `/plantillas` | | ídem |
| `/bloques-diarios` | | ídem |
| `/modulos-actividad` | | ídem |
| `/tarifario` | | ídem |
| `/proveedores` | | ídem |
| `/clientes` | | ídem |
| `/media` | | ídem |
| `/revision-importacion` | | ídem |
| `/operacion` | | ídem |
| `/admin` | | ídem |

Cada página con su propio `head()` (título y descripción únicos, og:title/og:description). Placeholder "En construcción" con un componente compartido reutilizable (ícono + texto + descripción corta por sección).

## Shell y navegación (src/routes/__root.tsx)
- Sidebar (shadcn/ui) colapsable, con trigger visible siempre.
- Ítems activos resaltados (Link + useRouterState).
- Marca "Uyuni Adventure" arriba del sidebar; footer del sidebar con versión/usuario placeholder.
- `/login` se muestra sin sidebar (pantalla completa).
- El navegador de la ruta `/` pasa a ser el Dashboard (se elimina el placeholder).

## Verificación
- Build OK (build-errors.log sin errores).
- Revisión visual con Playwright: sidebar renderiza en todas las rutas, ruta activa resaltada, login sin sidebar.
