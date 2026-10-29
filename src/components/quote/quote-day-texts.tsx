import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resetDayField, updateDayContent } from "@/lib/quotes/days";
import type { DayContent } from "@/lib/quotes/day-content";
import { saveItemLabel, saveQuoteDocument } from "@/lib/quotes/document";
import { buildQuoteDocumentModel, type DocumentContent } from "@/lib/quotes/document-model";
import type { Tables } from "@/types/db";
import { loadClient } from "@/lib/clients";
import { ClientSheet } from "@/components/clients/client-sheet";
import type { useQuoteActions } from "./quote-workspace";
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

export function QuoteIdentityTexts({
  quote,
  actions,
}: {
  quote: Tables<"quotes">;
  actions: Actions;
}) {
  const [editingClient, setEditingClient] = useState(false);
  const client = useQuery({
    queryKey: ["client", quote.client_id],
    queryFn: () => loadClient(quote.client_id),
  });
  const content = (quote.document_snapshot ?? {}) as DocumentContent;
  const disabled = quote.status !== "borrador" || !!quote.archived_at;
  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">Cliente y guía del documento</summary>
      <div className="mt-3 space-y-3">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          disabled={client.isLoading || !client.data}
          onClick={() => setEditingClient(true)}
        >
          Editar datos y email del cliente
        </Button>
        {client.isError && <p className="text-sm text-destructive">No se pudieron cargar los datos actuales del cliente.</p>}
        <AutoField
          label="Cliente"
          value={content.client_name ?? ""}
          disabled={disabled}
          onCommit={(value) =>
            actions.act(() => saveQuoteDocument(quote.id, { client_name: value }), undefined, false)
          }
        />
        <AutoField
          label="Guía"
          multiline
          value={content.guide ?? ""}
          disabled={disabled}
          onCommit={(value) =>
            actions.act(() => saveQuoteDocument(quote.id, { guide: value }), undefined, false)
          }
        />
      </div>
      {editingClient && client.data && (
        <ClientSheet client={client.data} onClose={() => setEditingClient(false)} />
      )}
    </details>
  );
}

export function QuoteDayTexts({
  day,
  items,
  language,
  disabled,
  actions,
  content,
}: {
  day: Tables<"quote_days">;
  items: Tables<"quote_items">[];
  language: string;
  disabled: boolean;
  actions: Actions;
  content: DocumentContent;
}) {
  const [lang, setLang] = useState(language);
  const langs = [
    ...new Set([
      language,
      ...Object.keys((day.block_snapshot as { content?: DayContent })?.content?.title ?? {}),
    ]),
  ];
  const model = buildQuoteDocumentModel({ quote: {}, days: [day], items, content }, lang);
  const resolved = model.days[0]!;
  const run = (fn: () => Promise<unknown>) => actions.act(fn, undefined, false);
  const saveDay = (key: string, value: string) => {
    if (key === "meals")
      return run(() =>
        updateDayContent(day.id, {
          meals: value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      );
    const prev = ((day.overrides ?? {}) as Record<string, Record<string, string> | undefined>)[key];
    return run(() =>
      updateDayContent(day.id, { [key]: { ...(prev ?? {}), [lang]: value } } as DayContent),
    );
  };
  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">Textos del día</summary>
      <div className="mt-3 space-y-3">
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
        {DAY_FIELDS.map(([key, label, multiline]) => {
          const field = resolved[key];
          const value = Array.isArray(field.value) ? field.value.join(", ") : field.value;
          return (
            <AutoField
              key={key + lang}
              label={label}
              multiline={multiline}
              value={value}
              disabled={disabled}
              onCommit={(v) => saveDay(key, v)}
              badge={
                field.overridden && (
                  <>
                    <Badge variant="outline">Modificado</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      disabled={disabled || lang !== language}
                      title={
                        lang !== language
                          ? "Restaura en el idioma de la cotización"
                          : "Restaurar texto original"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        void run(() => resetDayField(day.id, key));
                      }}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Restaurar
                    </Button>
                  </>
                )
              }
            />
          );
        })}
        {model.services.map((service) => (
          <AutoField
            key={service.item_id}
            label={"Etiqueta · " + (items.find((i) => i.id === service.item_id)?.sku ?? "Servicio")}
            value={service.label}
            disabled={disabled}
            onCommit={(v) => run(() => saveItemLabel(day.quote_id, service.item_id, v))}
          />
        ))}
      </div>
    </details>
  );
}
