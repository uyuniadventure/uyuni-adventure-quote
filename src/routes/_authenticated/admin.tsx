import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SECTIONS, sectionHead } from "@/components/section";
import { db } from "@/lib/db";
import { listAdminUsers } from "@/lib/admin/users";
import type { Enums } from "@/types/db";
import { ROLE_LABELS, useCurrentUser, type AppRole } from "@/hooks/use-auth";
import { PageHeader, LANGS } from "@/components/catalog/kit";
import { CrudTable } from "@/components/admin/crud-table";
import { PaymentSettings } from "@/components/admin/payment-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const s = SECTIONS.admin;

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => sectionHead(s),
  component: AdminPage,
});

const LANG_OPTS: [string, string][] = LANGS.map(([v, l]) => [v, l]);

function AdminPage() {
  const { role } = useCurrentUser();
  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-brand-orange" />
        <h1 className="mt-3 text-lg font-semibold">Acceso restringido</h1>
        <p className="mt-1 text-sm text-muted-foreground">Esta sección es solo para el rol Admin.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Admin" subtitle="Usuarios, divisas, códigos, textos fijos y datos bancarios." />
      <Tabs defaultValue="usuarios">
        <TabsList className="flex-wrap">
          <TabsTrigger value="usuarios">Usuarios y roles</TabsTrigger>
          <TabsTrigger value="fx">Tipos de cambio</TabsTrigger>
          <TabsTrigger value="locations">Códigos de ubicación</TabsTrigger>
          <TabsTrigger value="hotels">Códigos de hotel</TabsTrigger>
          <TabsTrigger value="info">Textos fijos</TabsTrigger>
          <TabsTrigger value="bank">Datos bancarios</TabsTrigger>
          <TabsTrigger value="payments">Depósito</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-4"><UsersPanel /></TabsContent>
        <TabsContent value="fx" className="mt-4"><FxPanel /></TabsContent>
        <TabsContent value="locations" className="mt-4">
          <CrudTable table="location_codes" title="Códigos de ubicación" orderBy={[{ column: "code" }]} columns={[
            { key: "code", label: "Código", required: true, placeholder: "UYU" },
            { key: "name", label: "Nombre", required: true },
            { key: "country", label: "País" },
          ]} />
        </TabsContent>
        <TabsContent value="hotels" className="mt-4"><HotelCodesPanel /></TabsContent>
        <TabsContent value="info" className="mt-4">
          <CrudTable table="info_blocks" title="Textos fijos por destino e idioma" orderBy={[{ column: "destination" }, { column: "lang" }, { column: "order" }]}
            defaults={{ lang: "es", order: 0 }}
            columns={[
              { key: "destination", label: "Destino", required: true, placeholder: "Bolivia" },
              { key: "lang", label: "Idioma", type: "select", options: LANG_OPTS, required: true },
              { key: "order", label: "Orden", type: "number", required: true },
              { key: "title", label: "Título", required: true },
              { key: "content", label: "Contenido", type: "textarea", required: true, formOnly: true },
            ]} />
        </TabsContent>
        <TabsContent value="bank" className="mt-4"><BankPanel /></TabsContent>
        <TabsContent value="payments" className="mt-4"><PaymentSettings /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const me = useCurrentUser();
  const q = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: listAdminUsers,
  });
  const setRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Enums<"app_role"> }) => {
      const { error } = await db.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rol actualizado."); qc.invalidateQueries({ queryKey: ["admin-profiles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Los usuarios se registran desde la pantalla de acceso y quedan como Vendedor; aquí se asigna su rol.</p>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>ID</TableHead><TableHead>Alta</TableHead><TableHead className="w-48">Rol</TableHead></TableRow></TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={5} className="text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.error && <TableRow><TableCell colSpan={5} role="alert">{q.error.message}</TableCell></TableRow>}
            {q.data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name || "—"}{p.id === me.user.id && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}</TableCell>
                <TableCell>{p.email || "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleDateString("es")}</TableCell>
                <TableCell>
                  <Select value={p.role} disabled={p.id === me.user.id} onValueChange={(v) => setRole.mutate({ id: p.id, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function useCurrencyOptions() {
  return useQuery({
    queryKey: ["crud", "currencies"],
    queryFn: async () => {
      const { data, error } = await db.from("currencies").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });
}

function FxPanel() {
  const cur = useCurrencyOptions();
  const qc = useQueryClient();
  const opts: [string, string][] = (cur.data ?? []).map((c) => [c.code, `${c.code} · ${c.name}`]);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <CrudTable table="currencies" title="Divisas" orderBy={[{ column: "code" }]}
        onSaved={() => qc.invalidateQueries({ queryKey: ["crud", "currencies"] })}
        columns={[
          { key: "code", label: "Código ISO", required: true, placeholder: "BOB" },
          { key: "name", label: "Nombre", required: true },
        ]} />
      <CrudTable table="exchange_rates" title="Tipos de cambio (unidades por 1 USD)"
        orderBy={[{ column: "valid_from", ascending: false }, { column: "currency" }]}
        defaults={{ valid_from: new Date().toISOString().slice(0, 10) }}
        columns={[
          { key: "currency", label: "Divisa", type: "select", options: opts, required: true },
          { key: "rate_to_usd", label: "Tasa", type: "number", required: true },
          { key: "valid_from", label: "Vigente desde", type: "date", required: true },
        ]} />
    </div>
  );
}

function HotelCodesPanel() {
  const sup = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const opts: [string, string][] = (sup.data ?? []).map((x) => [x.id, x.name]);
  return (
    <CrudTable table="hotel_codes" title="Códigos de hotel" orderBy={[{ column: "code" }]} columns={[
      { key: "code", label: "Código", required: true },
      { key: "name", label: "Nombre", required: true },
      { key: "supplier_id", label: "Proveedor", type: "select", options: opts },
    ]} />
  );
}

function BankPanel() {
  const cur = useCurrencyOptions();
  const opts: [string, string][] = (cur.data ?? []).map((c) => [c.code, c.code]);
  return (
    <CrudTable table="bank_accounts" title="Cuentas bancarias" orderBy={[{ column: "entity" }]} defaults={{ entity: "Ando Libre LLC", currency: "USD" }}
      columns={[
        { key: "entity", label: "Entidad", required: true },
        { key: "bank_name", label: "Banco", required: true },
        { key: "account_holder", label: "Titular", required: true },
        { key: "account_number", label: "N° de cuenta", required: true },
        { key: "currency", label: "Divisa", type: "select", options: opts, required: true },
        { key: "swift", label: "SWIFT" },
        { key: "routing_number", label: "Routing", formOnly: true },
        { key: "iban", label: "IBAN", formOnly: true },
        { key: "instructions", label: "Instrucciones", type: "textarea", formOnly: true },
      ]} />
  );
}
