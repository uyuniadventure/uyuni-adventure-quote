import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db, unwrap } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentSettings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () =>
      unwrap(await db.from("pricing_settings").select("id, deposit_pct").single()),
  });
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!query.data) return;
        const pct = Number(value ?? query.data.deposit_pct);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
          toast.error("El depósito debe estar entre 0 y 100 %.");
          return;
        }
        setSaving(true);
        try {
          unwrap(
            await db
              .from("pricing_settings")
              .update({ deposit_pct: pct })
              .eq("id", query.data.id)
              .select("id")
              .single(),
          );
          await qc.invalidateQueries({ queryKey: ["payment-settings"] });
          setValue(null);
          toast.success("Depósito global guardado.");
        } catch (error) {
          toast.error((error as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2 className="font-semibold">Depósito global</h2>
      {query.isError && (
        <p role="alert" className="text-destructive">
          {query.error.message}
        </p>
      )}
      <Label htmlFor="admin-deposit">Porcentaje de depósito</Label>
      <Input
        id="admin-deposit"
        type="number"
        min="0"
        max="100"
        step="0.0001"
        required
        value={value ?? query.data?.deposit_pct ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="text-sm text-muted-foreground">
        Se usa en cotizaciones nuevas cuando el cliente no tiene un porcentaje propio. Las
        cotizaciones existentes conservan sus condiciones.
      </p>
      <Button disabled={saving || !query.data}>{saving ? "Guardando…" : "Guardar depósito"}</Button>
    </form>
  );
}
