import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — Cotizador Uyuni Adventure" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta del cotizador." },
      { property: "og:title", content: "Restablecer contraseña — Cotizador Uyuni Adventure" },
      { property: "og:description", content: "Define una nueva contraseña para tu cuenta del cotizador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contraseña actualizada.");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Contraseña</Label>
          <Input id="pw" type="password" required minLength={6} value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <Button type="submit" disabled={busy} className="w-full">Guardar</Button>
      </form>
    </div>
  );
}
