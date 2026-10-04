import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useState, type FormEvent } from "react";
import { redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
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

          <AuthForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Acceso interno — solo para el equipo de Uyuni Adventure.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/", replace: true });
        else setNotice("Te enviamos un correo para confirmar tu cuenta. Después podrás iniciar sesión.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(
        msg.includes("Invalid login") ? "Correo o contraseña incorrectos."
        : msg.includes("Email not confirmed") ? "Debes confirmar tu correo antes de entrar."
        : msg.includes("already registered") ? "Ese correo ya tiene una cuenta."
        : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email) return toast.error("Escribe tu correo primero.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Te enviamos un enlace para restablecer tu contraseña.");
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {mode === "signin" ? "Ingresa con tu cuenta del equipo." : "Las cuentas nuevas reciben el rol Vendedor."}
      </p>

      {notice ? (
        <div className="mt-8 rounded-md border border-border bg-muted p-4 text-sm text-foreground">{notice}</div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" required autoComplete="email" placeholder="nombre@uyuniadventure.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              {mode === "signin" && (
                <button type="button" onClick={resetPassword} className="text-xs font-medium text-brand-orange-deep hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <Input id="password" type="password" required minLength={6} placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy}
            className="w-full bg-brand-orange text-brand-navy hover:bg-brand-orange-deep hover:text-white">
            {busy ? "Procesando…" : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <button type="button" className="font-medium text-brand-orange-deep hover:underline"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}>
          {mode === "signin" ? "Regístrate" : "Inicia sesión"}
        </button>
      </p>
    </>
  );
}
