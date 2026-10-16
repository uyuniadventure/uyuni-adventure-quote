import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SECTIONS, sectionHead } from "@/components/section";
import { ALL, Filter, LANGS, PageHeader } from "@/components/catalog/kit";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import {
  listDocBlocks,
  createDocBlock,
  saveDocTranslation,
  setDocBlockStatus,
  translateDocBlock,
} from "@/lib/quotes/document";
import { ProposalTextEditor } from "@/components/quote/proposal-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/bloques-documento")({
  head: () => sectionHead(SECTIONS["bloques-documento"]),
  component: DocumentBlocks,
});
function DocumentBlocks() {
  const { role } = useCurrentUser();
  const manage = canManageCatalog(role);
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [channel, setChannel] = useState(ALL);
  const [lang, setLang] = useState("es");
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["doc-library", "catalog", channel],
    queryFn: () => listDocBlocks(channel === ALL ? {} : { channel }),
  });
  const selected = query.data?.find((b) => b.id === editing);
  const translation = selected?.doc_block_translations.find((t) => t.lang === lang);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["doc-library"] });
      toast.success("Biblioteca actualizada.");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Bloques de documento"
        subtitle="Textos reutilizables y bloques de datos para las propuestas."
        action={
          manage ? (
            <Button
              onClick={() => {
                setCode("");
                setCreating(true);
              }}
            >
              Nuevo texto
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          aria-label="Buscar bloque"
          placeholder="Buscar…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <Filter
          value={channel}
          onChange={setChannel}
          placeholder="Canal"
          options={[
            ["b2c", "B2C"],
            ["b2b", "B2B"],
          ]}
        />
        {LANGS.map(([key, label]) => (
          <Button
            key={key}
            variant={lang === key ? "default" : "outline"}
            onClick={() => setLang(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      {query.error && <p role="alert">{query.error.message}</p>}
      {query.isLoading && <p>Cargando biblioteca…</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {query.data
          ?.filter((b) =>
            `${b.code} ${b.doc_block_translations.map((t) => t.title).join(" ")}`
              .toLowerCase()
              .includes(term.toLowerCase()),
          )
          .map((b) => (
            <Card className="space-y-3 p-4" key={b.id}>
              <div className="flex items-center gap-2">
                <h2 className="mr-auto font-semibold">{b.code}</h2>
                <Badge variant="outline">{b.kind === "static" ? "Texto" : "Datos"}</Badge>
                <Badge variant="outline">{b.status}</Badge>
              </div>
              <div className="flex gap-2">
                {LANGS.map(([l]) => (
                  <span className="text-xs" key={l}>
                    {l.toUpperCase()}:{" "}
                    {b.kind === "dynamic"
                      ? "automático"
                      : b.doc_block_translations.find((t) => t.lang === l)?.reviewed
                        ? "revisado"
                        : "sin revisar"}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {b.kind === "static" && (
                  <Button variant="outline" onClick={() => setEditing(b.id)}>
                    {manage ? "Editar" : "Ver"} {lang.toUpperCase()}
                  </Button>
                )}
                {manage &&
                  b.kind === "static" &&
                  lang !== "es" &&
                  !b.doc_block_translations.find((t) => t.lang === lang)?.body_html && (
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() => void run(() => translateDocBlock(b.id, lang))}
                    >
                      Traducir
                    </Button>
                  )}
                {manage && (
                  <select
                    aria-label={`Estado ${b.code}`}
                    className="rounded border bg-background p-2 text-sm"
                    disabled={busy}
                    value={b.status}
                    onChange={(e) => void run(() => setDocBlockStatus(b.id, e.target.value))}
                  >
                    <option value="activo">Activo</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="archivado">Archivado</option>
                  </select>
                )}
              </div>
            </Card>
          ))}
      </div>
      {selected && (
        <ProposalTextEditor
          key={`${selected.id}-${lang}`}
          title={translation?.title ?? selected.code}
          html={translation?.body_html ?? ""}
          disabled={!manage || busy}
          onClose={() => setEditing(null)}
          onSave={(title, html) => run(() => saveDocTranslation(selected.id, lang, title, html))}
        />
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo bloque de texto</DialogTitle>
            <DialogDescription>
              Se crea pendiente, disponible para ambos canales. Completa y revisa sus traducciones
              antes de activarlo.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Código del bloque"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MI_BLOQUE"
          />
          <Button
            disabled={busy || !code}
            onClick={async () => {
              if (await run(() => createDocBlock(code, "all"))) setCreating(false);
            }}
          >
            Crear
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
