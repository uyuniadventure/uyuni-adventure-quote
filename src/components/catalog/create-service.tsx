import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { TablesInsert } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, MODALITIES, PRICING_UNITS, PRICING_UNIT_LABELS, SERVICE_TYPES, cap } from "./shared";

export function CreateServiceDialog({
  open, onOpenChange, suppliers, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  suppliers: { id: string; name: string }[];
  onCreated: (id: string) => void;
}) {
  const { user, role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const qc = useQueryClient();
  const empty = {
    sku: "", name: "", type: "actividad", pricing_unit: "per_person", currency: "USD",
    country: "", location: "", supplier_id: "none", modality: "ambos",
  };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const row: TablesInsert<"services"> = {
        sku: f.sku.trim(),
        name: f.name.trim(),
        type: f.type as TablesInsert<"services">["type"],
        pricing_unit: f.pricing_unit as TablesInsert<"services">["pricing_unit"],
        currency: f.currency,
        country: f.country.trim() || null,
        location: f.location.trim() || null,
        supplier_id: f.supplier_id === "none" ? null : f.supplier_id,
        modality: f.modality as TablesInsert<"services">["modality"],
        status: manager ? "activo" : "pendiente",
        created_by: user.id,
      };
      const { data, error } = await db.from("services").insert(row).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      toast.success(manager ? "Servicio creado." : "Servicio creado como pendiente de aprobación.");
      qc.invalidateQueries({ queryKey: ["services"] });
      setF(empty);
      onOpenChange(false);
      onCreated(id);
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "Ya existe un servicio con ese SKU." : e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo servicio</DialogTitle>
          <DialogDescription>
            {manager ? "Se creará como activo." : "Quedará pendiente hasta que Operación o Admin lo apruebe; puedes usarlo en tus cotizaciones."}
            {" "}Las tarifas se agregan desde la ficha.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5"><Label>SKU *</Label><Input required value={f.sku} onChange={(e) => set("sku")(e.target.value)} placeholder="TOUR_UYU_..." className="font-mono" /></div>
          <div className="col-span-2 space-y-1.5"><Label>Nombre *</Label><Input required value={f.name} onChange={(e) => set("name")(e.target.value)} /></div>
          <Pick label="Tipo" value={f.type} onChange={set("type")} options={SERVICE_TYPES.map((t) => [t, cap(t)])} />
          <Pick label="Unidad de cobro" value={f.pricing_unit} onChange={set("pricing_unit")} options={PRICING_UNITS.map((u) => [u, PRICING_UNIT_LABELS[u]])} />
          <Pick label="Moneda" value={f.currency} onChange={set("currency")} options={CURRENCIES.map((c) => [c, c])} />
          <Pick label="Modalidad" value={f.modality} onChange={set("modality")} options={MODALITIES.map((m) => [m, cap(m)])} />
          <div className="space-y-1.5"><Label>País</Label><Input value={f.country} onChange={(e) => set("country")(e.target.value.toUpperCase())} placeholder="BOLIVIA" /></div>
          <div className="space-y-1.5"><Label>Ubicación</Label><Input value={f.location} onChange={(e) => set("location")(e.target.value)} /></div>
          <div className="col-span-2">
            <Pick label="Proveedor" value={f.supplier_id} onChange={set("supplier_id")}
              options={[["none", "Sin proveedor"], ...suppliers.map((s) => [s.id, s.name] as [string, string])]} />
          </div>
          <Button type="submit" className="col-span-2" disabled={create.isPending}>{create.isPending ? "Creando…" : "Crear servicio"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Pick({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
