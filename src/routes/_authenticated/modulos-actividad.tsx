import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ruta heredada: los módulos no forman parte de la interfaz nueva. */
export const Route = createFileRoute("/_authenticated/modulos-actividad")({
  beforeLoad: () => {
    throw redirect({ to: "/bloques-diarios", replace: true });
  },
});
