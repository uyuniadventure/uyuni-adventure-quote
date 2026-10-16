import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { unreviewedDays } from "@/lib/quotes";
import { resetDayField, updateDayContent } from "@/lib/quotes/days";
import type { DayContent } from "@/lib/quotes/day-content";
import {
  listDocSections,
  saveItemLabel,
  saveQuoteDocument,
  updateSectionText,
  type DocSection,
} from "@/lib/quotes/document";
import {
  buildQuoteDocumentModel,
  type DocumentContent,
  type DocumentContentPatch,
} from "@/lib/quotes/document-model";
import type { Tables } from "@/types/db";
import type { useQuoteActions } from "./quote-workspace";
import { ProposalTextEditor } from "./proposal-text-editor";

type Actions = ReturnType<typeof useQuoteActions>;
type Status = "idle" | "saving" | "saved" | "error";

/** Campo con guardado al salir: conserva lo escrito si falla. */
function AutoField({
  label,
  value,
  multiline = false,
  disabled,
  onCommit,
  badge,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  disabled: boolean;
  onCommit: (v: string) => Promise<boolean>;
  badge?: React.ReactNode;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const shown = draft ?? value;
  const commit = async () => {
    if (draft === null || draft === value) {
      setDraft(null);
      return;
    }
    setStatus("saving");
    const ok = await onCommit(draft);
    setStatus(ok ? "saved" : "error");
    if (ok) setDraft(null);
  };
  const cls = "field-sizing-content min-h-9";
  return (
    <label className="block space-y-1 text-sm">
      <span className="flex items-center gap-2 font-medium">
        {label}
        {badge}
        <span className="ml-auto text-xs font-normal">
          {status === "saving" && <span className="text-muted-foreground">Guardando…</span>}
          {status === "saved" && <span className="text-muted-foreground">Guardado</span>}
          {status === "error" && <span className="text-destructive">No se guardó</span>}
        </span>
      </span>
      {multiline ? (
        <Textarea
          className={cls}
          value={shown}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
        />
      ) : (
        <Input
          value={shown}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
        />
      )}
    </label>
  );
}

const DAY_FIELDS = [
  ["title", "Título", false],
  ["description", "Descripción", true],
  ["accommodation_text", "Alojamiento", true],
  ["meals", "Comidas", false],
  ["transport_text", "Transporte", true],
  ["includes", "Incluye", true],
  ["excludes", "No incluye", true],
  ["client_note", "Nota para el cliente", true],
] as const;

export function QuoteTexts({
  quote,
  days,
  items,
  actions,
  onGeneratePdf,
}: {
  quote: Tables<"quotes">;
  days: Tables<"quote_days">[];
  items: Tables<"quote_items">[];
  actions: Actions;
  onGeneratePdf: () => void;
}) {
  const editable = quote.status === "borrador" && !quote.archived_at;
  const disabled = !editable;
  const langs = useMemo(() => {
    const set = new Set<string>([quote.language]);
    for (const d of days) {
      const t = (d.block_snapshot as { content?: { title?: Record<string, string> } })?.content
        ?.title;
      Object.keys(t ?? {}).forEach((k) => set.add(k));
    }
    return [...set];
  }, [days, quote.language]);
  const [lang, setLang] = useState(quote.language);
  const content = (quote.document_snapshot ?? {}) as DocumentContent;
  const model = buildQuoteDocumentModel(
    { quote, days: days as never, items: items as never, content },
    lang,
  );
  const sections = useQuery({
    queryKey: ["doc-sections", quote.id],
    queryFn: () => listDocSections(quote.id),
    retry: false,
  });
  const builderActive = !!sections.data?.length;
  const statics = (sections.data ?? []).filter((s) => s.snapshot.kind === "static" && !s.hidden);
  const [editing, setEditing] = useState<DocSection | null>(null);
  const pending = new Set(unreviewedDays(days).map((d) => d.id));

  const run = (fn: () => Promise<unknown>) => actions.act(fn, undefined, false);
  const saveDoc = (patch: DocumentContentPatch) => run(() => saveQuoteDocument(quote.id, patch));
  const saveDay = (day: Tables<"quote_days">, key: string, value: string) => {
    if (key === "meals")
      return run(() =>
        updateDayContent(day.id, {
          meals: value.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      );
    const prev = ((day.overrides ?? {}) as Record<string, Record<string, string> | undefined>)[key];
    return run(() =>
      updateDayContent(day.id, { [key]: { ...(prev ?? {}), [lang]: value } } as DayContent),
    );
  };
  const info = model.document.info;
  const sectionTitle = (s: DocSection) =>
    s.override_lang === lang && s.title_override !== null
      ? s.title_override
      : s.snapshot.translations.find((t) => t.lang === lang)?.title || s.snapshot.code;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {langs.length > 1 && (
          <label className="text-sm">
            Idioma
            <select
              className="ml-2 rounded border bg-background p-2"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              {langs.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        )}
        {!editable && (
          <p className="text-sm text-muted-foreground">Solo lectura: la cotización no es un borrador.</p>
        )}
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Documento</h3>
        <AutoField label="Cliente" value={model.document.client_name} disabled={disabled}
          onCommit={(v) => saveDoc({ client_name: v })} />
        {!builderActive && (
          <AutoField label="Introducción" multiline value={model.document.introduction}
            disabled={disabled} onCommit={(v) => saveDoc({ introduction: v })} />
        )}
        <AutoField label="Guía" multiline value={model.document.guide} disabled={disabled}
          onCommit={(v) => saveDoc({ guide: v })} />
      </Card>

      {builderActive && (
        <Card className="space-y-2 p-4">
          <h3 className="font-semibold">Textos del constructor</h3>
          <p className="text-xs text-muted-foreground">
            Introducción, notas y T&C se editan en su bloque de la propuesta.
          </p>
          {statics.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{sectionTitle(s)}</span>
              <Badge variant="outline">{s.reviewed ? "Revisado" : "Sin revisar"}</Badge>
              <Button size="sm" variant="outline" disabled={disabled} onClick={() => setEditing(s)}>
                Editar bloque
              </Button>
            </div>
          ))}
        </Card>
      )}

      {model.days.map((d) => {
        const day = days.find((x) => x.id === d.id)!;
        return (
          <Card key={d.id} id={`texts-day-${d.day_number}`} className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Día {d.day_number}</h3>
              {d.date && <span className="text-xs text-muted-foreground">{d.date}</span>}
              <Badge variant={pending.has(d.id) ? "destructive" : "secondary"} className="ml-auto">
                {pending.has(d.id) ? "Texto sin revisar" : "Revisado"}
              </Badge>
            </div>
            {DAY_FIELDS.map(([key, label, multi]) => {
              const f = d[key];
              const value = Array.isArray(f.value) ? f.value.join(", ") : (f.value as string);
              return (
                <AutoField key={`${key}-${lang}`} label={label} multiline={multi} value={value}
                  disabled={disabled} onCommit={(v) => saveDay(day, key, v)}
                  badge={f.overridden && (
                    <>
                      <Badge variant="outline">Modificado</Badge>
                      <Button type="button" size="sm" variant="ghost" className="h-6 px-2"
                        disabled={disabled}
                        onClick={(e) => { e.preventDefault(); void run(() => resetDayField(d.id, key)); }}>
                        <RotateCcw className="mr-1 h-3 w-3" />Restaurar
                      </Button>
                    </>
                  )} />
              );
            })}
          </Card>
        );
      })}

      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Servicios</h3>
        {model.services.length === 0 && <p className="text-sm text-muted-foreground">Sin servicios.</p>}
        {model.services.map((s) => (
          <AutoField key={s.item_id} label={items.find((i) => i.id === s.item_id)?.sku ?? "Servicio"}
            value={s.label} disabled={disabled}
            onCommit={(v) => run(() => saveItemLabel(quote.id, s.item_id, v))} />
        ))}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Pago y cancelación</h3>
        <AutoField label="Pago" multiline value={model.document.payment_text} disabled={disabled}
          onCommit={(v) => saveDoc({ payment_text: v })} />
        <AutoField label="Cancelación" multiline value={model.document.cancellation}
          disabled={disabled} onCommit={(v) => saveDoc({ cancellation: v })} />
      </Card>

      {!builderActive && (
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Información práctica</h3>
          {info.map((b, i) => (
            <div key={i} className="space-y-2 rounded border p-3">
              <AutoField label="Título" value={b.title} disabled={disabled}
                onCommit={(v) => saveDoc({ info: info.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
              <AutoField label="Contenido" multiline value={b.content} disabled={disabled}
                onCommit={(v) => saveDoc({ info: info.map((x, j) => (j === i ? { ...x, content: v } : x)) })} />
              <Button size="sm" variant="ghost" disabled={disabled}
                onClick={() => void saveDoc({ info: info.filter((_, j) => j !== i) })}>
                <Trash2 className="mr-1 h-4 w-4" />Quitar bloque
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" disabled={disabled}
            onClick={() => void saveDoc({ info: [...info, { title: "Nuevo bloque", content: "" }] })}>
            <Plus className="mr-1 h-4 w-4" />Agregar bloque
          </Button>
          <AutoField label="Enlace a T&C" value={model.document.terms_url} disabled={disabled}
            onCommit={(v) => saveDoc({ terms_url: v })} />
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onGeneratePdf}>Generar PDF</Button>
      </div>

      {editing && (
        <ProposalTextEditor
          key={editing.id}
          title={sectionTitle(editing)}
          html={
            editing.override_lang === lang
              ? (editing.body_override_html ?? "")
              : (editing.snapshot.translations.find((t) => t.lang === lang)?.body_html ?? "")
          }
          disabled={disabled}
          onClose={() => setEditing(null)}
          onSave={(t, html) => run(() => updateSectionText(quote.id, editing.id, t, html))}
        />
      )}
    </div>
  );
}
