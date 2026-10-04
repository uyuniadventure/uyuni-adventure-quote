import { createFileRoute } from "@tanstack/react-router";
import { Compass, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Cotizador Uyuni Adventure" },
      {
        name: "description",
        content: "Acceso interno al cotizador de Uyuni Adventure DMC.",
      },
      { property: "og:title", content: "Iniciar sesión — Cotizador Uyuni Adventure" },
      {
        property: "og:description",
        content: "Acceso interno al cotizador de Uyuni Adventure DMC.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-[0.08]"
          style={{ background: "var(--brand-orange)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full opacity-[0.06]"
          style={{ background: "var(--brand-orange)" }}
        />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Compass className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-white">
              Uyuni Adventure
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              Cotizador DMC — Acceso interno
            </p>
          </div>
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Cotiza tours multi-día en Bolivia y Chile con precisión.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            Arma itinerarios con bloques diarios y módulos de actividad,
            aplica tarifas por temporada y genera propuestas profesionales en
            minutos.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()} Uyuni Adventure DMC
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navy">
              <Compass className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">
                Uyuni Adventure
              </p>
              <p className="text-xs text-muted-foreground">
                Cotizador DMC — Acceso interno
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Ingresa con tu cuenta del equipo.
          </p>

          <form className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@uyuniadventure.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-brand-orange-deep hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button
              type="button"
              className="w-full bg-brand-orange text-brand-navy hover:bg-brand-orange-deep hover:text-white"
            >
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Acceso interno — solo para el equipo de Uyuni Adventure.
          </p>
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al cotizador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
