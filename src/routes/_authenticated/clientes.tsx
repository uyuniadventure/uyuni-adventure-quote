import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { SECTIONS, sectionHead } from "@/components/section";
import { db } from "@/lib/db";
import type { Enums, Tables } from "@/types/db";
import { useCurrentUser } from "@/hooks/use-auth";
import { ALL, Field, Filter, LANGS, PageHeader, ilikeTerm, primaryBtn, useDebounced } from "@/components/catalog/kit";
import { CrudTable } from "@/components/admin/crud-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const s = SECTIONS.clientes;

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => sectionHead(s),
  component: ClientsPage,
});

type Client = Tables<"clients">;
type Terms = Tables<"terms_conditions">;
const NONE = "__none__";
const LANG_LABEL = Object.fromEntries(LANGS) as Record<string, string>;
const SCOPE_LABELS: Record<Enums<"terms_scope">, string> = {
  B2C_general: "B2C general",
  B2B_general: "B2B general",
  B2B_cliente: "B2B por cliente",
};

/** Valores por defecto de SPEC §4.6; se aplican al crear la cotización. */
const PAYMENT_DEFAULTS: Record<Enums<"client_type">, { deposit: string; balance: string; card: string }> = {
  B2C: { deposit: "30 %", balance: "5 días antes del inicio", card: "3 %" },
  B2B: { deposit: "30 %", balance: "Según acuerdo con la agencia (ej. 45 días)", card: "3 %" },
};

function ClientsPage() {
  const { role } = useCurrentUser();
  const isAdmin = role === "admin";
  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Agencias (B2B) y pasajeros directos (B2C), con sus términos y condiciones." />
      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          {isAdmin && <TabsTrigger value="tyc">Términos y condiciones</TabsTrigger>}
        </TabsList>
        <TabsContent value="clientes" className="mt-4"><ClientsList isAdmin={isAdmin} /></TabsContent>
        {isAdmin && <TabsContent value="tyc" className="mt-4"><TermsPanel /></TabsContent>}
      </Tabs>
    </div>
  );
}

/** T&C es solo-admin por RLS; para el resto la lista llega vacía. */
function useTerms(enabled: boolean) {
  return useQuery({
    queryKey: ["crud", "terms_conditions"],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from("terms_conditions").select("*").order("scope").order("lang");
      if (error) throw error;
      return data;
    },
  });
}

function termsLabel(t: Terms, clients?: { id: string; name: string }[]) {
  const who = t.client_id ? ` · ${clients?.find((c) => c.id === t.client_id)?.name ?? "cliente"}` : "";
  return `${SCOPE_LABELS[t.scope]} (${t.lang})${who}`;
}

function ClientsList({ isAdmin }: { isAdmin: boolean }) {
  const [term, setTerm] = useState("");
  const [type, setType] = useState(ALL);
  const [lang, setLang] = useState(ALL);
  const [open, setOpen] = useState<Client | "new" | null>(null);
  const t = useDebounced(term.trim());
  const q = useQuery({
    queryKey: ["clients", t, type, lang],
    queryFn: async () => {
      let query = db.from("clients").select("*").order("name").limit(200);
      if (t) query = query.or(`name.ilike.%${ilikeTerm(t)}%,email.ilike.%${ilikeTerm(t)}%,contact.ilike.%${ilikeTerm(t)}%`);
      if (type !== ALL) query = query.eq("type", type as Enums<"client_type">);
      if (lang !== ALL) query = query.eq("language", lang);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  const terms = useTerms(isAdmin);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar nombre, contacto o email" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <Filter value={type} onChange={setType} placeholder="Tipo" options={[["B2B", "B2B"], ["B2C", "B2C"]]} />
        <Filter value={lang} onChange={setLang} placeholder="Idioma" options={LANGS.map(([v, l]) => [v, l])} />
        <Button className={`ml-auto ${primaryBtn}`} onClick={() => setOpen("new")}><Plus className="mr-1 h-4 w-4" />Nuevo cliente</Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead><TableHead>País</TableHead><TableHead>Idioma</TableHead><TableHead>T&C</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={7} className="text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground">Sin clientes.</TableCell></TableRow>}
            {q.data?.map((c) => {
              const tc = terms.data?.find((x) => x.id === c.terms_id);
              return (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpen(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant={c.type === "B2B" ? "default" : "secondary"}>{c.type}</Badge></TableCell>
                  <TableCell>{c.contact || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.country || "—"}</TableCell>
                  <TableCell>{LANG_LABEL[c.language] ?? c.language}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tc ? termsLabel(tc, q.data) : c.terms_id ? "Asignado" : "General por tipo"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {open && <ClientSheet client={open === "new" ? null : open} isAdmin={isAdmin} terms={terms.data ?? []} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ClientSheet({ client, isAdmin, terms, onClose }: { client: Client | null; isAdmin: boolean; terms: Terms[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [v, setV] = useState({
    type: client?.type ?? ("B2C" as Enums<"client_type">),
    name: client?.name ?? "",
    contact: client?.contact ?? "",
    email: client?.email ?? "",
    country: client?.country ?? "",
    language: client?.language ?? "es",
    terms_id: client?.terms_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));

  // Opciones de T&C compatibles con el tipo: B2C → B2C_general; B2B → general o específicos de este cliente.
  const options = terms.filter((t) =>
    v.type === "B2C" ? t.scope === "B2C_general" : t.scope === "B2B_general" || (t.scope === "B2B_cliente" && t.client_id === client?.id),
  );
  const pay = PAYMENT_DEFAULTS[v.type];

  const save = async () => {
    if (!v.name.trim()) { toast.error("El nombre es obligatorio."); return; }
    setSaving(true);
    const payload = {
      type: v.type, name: v.name.trim(), contact: v.contact.trim() || null, email: v.email.trim() || null,
      country: v.country.trim() || null, language: v.language,
      ...(isAdmin ? { terms_id: v.terms_id || null } : {}),
    };
    const { error } = client
      ? await db.from("clients").update(payload).eq("id", client.id)
      : await db.from("clients").insert({ ...payload, created_by: user.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente guardado.");
    qc.invalidateQueries({ queryKey: ["clients"] });
    onClose();
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{client ? client.name : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>Datos de contacto, idioma y condiciones comerciales.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Tipo">
            <Select value={v.type} onValueChange={(x) => { set("type", x as Enums<"client_type">); set("terms_id", ""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="B2B">B2B · Agencia</SelectItem><SelectItem value="B2C">B2C · Directo</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Idioma">
            <Select value={v.language} onValueChange={(x) => set("language", x)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map(([l, n]) => <SelectItem key={l} value={l}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={v.type === "B2B" ? "Agencia *" : "Nombre *"} className="sm:col-span-2">
            <Input value={v.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Contacto"><Input value={v.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="País"><Input value={v.country} onChange={(e) => set("country", e.target.value)} /></Field>
          <Field label="Términos y condiciones" className="sm:col-span-2">
            {isAdmin ? (
              <Select value={v.terms_id || NONE} onValueChange={(x) => set("terms_id", x === NONE ? "" : x)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>General según tipo</SelectItem>
                  {options.map((t) => <SelectItem key={t.id} value={t.id}>{termsLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{v.terms_id ? "Asignados por Admin." : "General según tipo."} Solo Admin gestiona T&C.</p>
            )}
          </Field>
        </div>
        <div className="mt-6 rounded-md border bg-muted/40 p-4">
          <h3 className="text-sm font-semibold">Condiciones de pago por defecto</h3>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Depósito</dt><dd>{pay.deposit}</dd>
            <dt className="text-muted-foreground">Saldo</dt><dd>{pay.balance}</dd>
            <dt className="text-muted-foreground">Recargo tarjeta</dt><dd>{pay.card}</dd>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Se aplican al crear la cotización y se ajustan en cada una.</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className={primaryBtn} onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TermsPanel() {
  const [scope, setScope] = useState(ALL);
  const [lang, setLang] = useState(ALL);
  const clients = useQuery({
    queryKey: ["clients-b2b"],
    queryFn: async () => {
      const { data, error } = await db.from("clients").select("id, name").eq("type", "B2B").order("name");
      if (error) throw error;
      return data;
    },
  });
  const clientOpts: [string, string][] = (clients.data ?? []).map((c) => [c.id, c.name]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Filter value={scope} onChange={setScope} placeholder="Tipo" options={Object.entries(SCOPE_LABELS)} />
        <Filter value={lang} onChange={setLang} placeholder="Idioma" options={LANGS.map(([v, l]) => [v, l])} />
      </div>
      <CrudTable
        table="terms_conditions"
        title="Textos de términos y condiciones"
        orderBy={[{ column: "scope" }, { column: "lang" }]}
        defaults={{ scope: "B2C_general", lang: "es" }}
        filter={(r) => (scope === ALL || r['scope'] === scope) && (lang === ALL || r['lang'] === lang)}
        columns={[
          { key: "scope", label: "Tipo", type: "select", options: Object.entries(SCOPE_LABELS), required: true },
          { key: "lang", label: "Idioma", type: "select", options: LANGS.map(([v, l]) => [v, l]), required: true },
          { key: "client_id", label: "Cliente (solo B2B por cliente)", type: "select", options: clientOpts },
          { key: "content", label: "Contenido", type: "textarea", required: true,
            render: (r) => <span className="text-xs text-muted-foreground">{String(r['content']).slice(0, 90)}…</span> },
        ]}
      />
    </div>
  );
}
