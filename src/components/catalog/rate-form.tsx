import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SEASONS, type RateValues } from "./shared";

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const UNKNOWN_SEASON = "__UNKNOWN__";

export function RateForm({
  initial, submitLabel, withReason, busy, onSubmit,
}: {
  initial: RateValues;
  submitLabel: string;
  withReason?: boolean;
  busy?: boolean;
  onSubmit: (values: RateValues, reason: string) => void;
}) {
  const [v, setV] = useState(initial);
  const [reason, setReason] = useState("");
  const set = <K extends keyof RateValues>(k: K, val: RateValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(v, reason.trim());
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Temporada</Label>
          <Select value={v.season ?? UNKNOWN_SEASON} onValueChange={(x) => set("season", x === UNKNOWN_SEASON ? null : x as RateValues["season"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={UNKNOWN_SEASON}>Sin definir</SelectItem>{SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Field label="Vigente desde"><Input type="date" value={v.valid_from ?? ""} onChange={(e) => set("valid_from", e.target.value || null)} /></Field>
        <Field label="Vigente hasta"><Input type="date" value={v.valid_to ?? ""} onChange={(e) => set("valid_to", e.target.value || null)} /></Field>
        <Field label="Pax mínimo"><Input type="number" min={1} value={v.pax_min ?? ""} onChange={(e) => set("pax_min", num(e.target.value))} /></Field>
        <Field label="Pax máximo"><Input type="number" min={1} value={v.pax_max ?? ""} onChange={(e) => set("pax_max", num(e.target.value))} /></Field>
        <Field label="Precio neto"><Input type="number" step="0.01" min={0} value={v.price_net ?? ""} onChange={(e) => set("price_net", num(e.target.value))} /></Field>
        <Field label="Precio rack"><Input type="number" step="0.01" min={0} value={v.price_rack ?? ""} onChange={(e) => set("price_rack", num(e.target.value))} /></Field>
        <div className="col-span-2 space-y-1.5">
          <Label>Notas</Label>
          <Input value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
        </div>
        {withReason && (
          <div className="col-span-2 space-y-1.5">
            <Label>Motivo del cambio *</Label>
            <Textarea required value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ej.: el proveedor envió tarifa 2027 por correo" />
          </div>
        )}
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Guardando…" : submitLabel}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
