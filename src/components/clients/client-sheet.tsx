import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { normalizeOptionalEmail } from "@/lib/clients";
import { useCurrentUser } from "@/hooks/use-auth";
import { Field, LANGS, primaryBtn } from "@/components/catalog/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Enums, Tables } from "@/types/db";

type Client = Tables<"clients">;
type Terms = Tables<"terms_conditions">;
const NONE = "__none__";
const SCOPE_LABELS: Record<Enums<"terms_scope">, string> = { B2C_general: "B2C general", B2B_general: "B2B general", B2B_cliente: "B2B por cliente" };
const PAYMENT_DEFAULTS: Record<Enums<"client_type">, { balance: string; card: string }> = {
  B2C: { balance: "5 días antes del inicio", card: "3 %" },
  B2B: { balance: "Según acuerdo con la agencia (ej. 45 días)", card: "3 %" },
};
const termsLabel = (term: Terms) => `${SCOPE_LABELS[term.scope]} (${term.lang})`;

export function ClientSheet({ client, onClose, onSaved }: { client: Client | null; onClose: () => void; onSaved?: (client: Client) => void }) {
  const qc = useQueryClient();
  const { user, role } = useCurrentUser();
  const isAdmin = role === "admin";
  const terms = useQuery({
    queryKey: ["crud", "terms_conditions"], enabled: isAdmin,
    queryFn: async () => { const { data, error } = await db.from("terms_conditions").select("*").order("scope").order("lang"); if (error) throw error; return data; },
  });
  const [v, setV] = useState({
    type: client?.type ?? ("B2C" as Enums<"client_type">), name: client?.name ?? "",
    contact: client?.contact ?? "", email: client?.email ?? "", country: client?.country ?? "",
    language: client?.language ?? "es", terms_id: client?.terms_id ?? "",
    deposit_pct: client?.deposit_pct == null ? "" : String(client.deposit_pct),
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((old) => ({ ...old, [key]: value }));
  const options = (terms.data ?? []).filter((term) => v.type === "B2C" ? term.scope === "B2C_general" : term.scope === "B2B_general" || (term.scope === "B2B_cliente" && term.client_id === client?.id));
  const save = async () => {
    if (!v.name.trim()) { toast.error("El nombre es obligatorio."); return; }
    let email: string | null;
    try { email = normalizeOptionalEmail(v.email); } catch (error) { toast.error(error instanceof Error ? error.message : "El email no es válido."); return; }
    const deposit = v.deposit_pct === "" ? null : Number(v.deposit_pct);
    if (deposit !== null && (!Number.isFinite(deposit) || deposit < 0 || deposit > 100)) { toast.error("El depósito debe estar entre 0 y 100 %."); return; }
    setSaving(true);
    const payload = { type: v.type, name: v.name.trim(), contact: v.contact.trim() || null, email, country: v.country.trim() || null, language: v.language, deposit_pct: deposit, ...(isAdmin ? { terms_id: v.terms_id || null } : {}) };
    const result = client
      ? await db.from("clients").update(payload).eq("id", client.id).select("*").single()
      : await db.from("clients").insert({ ...payload, created_by: user.id }).select("*").single();
    setSaving(false);
    if (result.error) { toast.error(`No se pudo guardar el cliente: ${result.error.message}`); return; }
    toast.success("Cliente guardado.");
    await Promise.all([qc.invalidateQueries({ queryKey: ["clients"] }), qc.invalidateQueries({ queryKey: ["client", result.data.id] }), qc.invalidateQueries({ queryKey: ["client-email", result.data.id] })]);
    onSaved?.(result.data);
    onClose();
  };
  const pay = PAYMENT_DEFAULTS[v.type];
  return <Sheet open onOpenChange={(open) => !open && onClose()}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader><SheetTitle>{client ? client.name : "Nuevo cliente"}</SheetTitle><SheetDescription>Datos de contacto, idioma y condiciones comerciales.</SheetDescription></SheetHeader>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Tipo"><Select value={v.type} onValueChange={(value) => { set("type", value as Enums<"client_type">); set("terms_id", ""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="B2B">B2B · Agencia</SelectItem><SelectItem value="B2C">B2C · Directo</SelectItem></SelectContent></Select></Field>
        <Field label="Idioma"><Select value={v.language} onValueChange={(value) => set("language", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label={v.type === "B2B" ? "Agencia *" : "Nombre *"} className="sm:col-span-2"><Input aria-label="Nombre del cliente" value={v.name} onChange={(event) => set("name", event.target.value)} /></Field>
        <Field label="Contacto"><Input value={v.contact} onChange={(event) => set("contact", event.target.value)} /></Field>
        <Field label="Email"><Input aria-label="Email del cliente" type="email" value={v.email} onChange={(event) => set("email", event.target.value)} /></Field>
        <Field label="País"><Input value={v.country} onChange={(event) => set("country", event.target.value)} /></Field>
        <Field label="Depósito % (vacío = global de Admin)"><Input aria-label="Depósito del cliente" type="number" min="0" max="100" step="0.0001" value={v.deposit_pct} onChange={(event) => set("deposit_pct", event.target.value)} /></Field>
        <Field label="Términos y condiciones" className="sm:col-span-2">{isAdmin ? <Select value={v.terms_id || NONE} onValueChange={(value) => set("terms_id", value === NONE ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>General según tipo</SelectItem>{options.map((term) => <SelectItem key={term.id} value={term.id}>{termsLabel(term)}</SelectItem>)}</SelectContent></Select> : <p className="text-sm text-muted-foreground">{v.terms_id ? "Asignados por Admin." : "General según tipo."} Solo Admin gestiona T&C.</p>}</Field>
      </div>
      <div className="mt-6 rounded-md border bg-muted/40 p-4 text-sm"><p className="font-semibold">Condiciones de pago por defecto</p><p className="mt-2 text-muted-foreground">Saldo: {pay.balance} · Recargo tarjeta: {pay.card}</p><p className="mt-2 text-xs text-muted-foreground">Cambiar estos datos no modifica cotizaciones existentes.</p></div>
      <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button className={primaryBtn} onClick={() => void save()} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button></div>
    </SheetContent>
  </Sheet>;
}
