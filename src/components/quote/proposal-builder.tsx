import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LockKeyhole, FileText, Database, EyeOff } from "lucide-react";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import type { Tables } from "@/types/db";
import * as doc from "@/lib/quotes/document";
import { sendQuoteEmail } from "@/lib/quotes/delivery";
import { unreviewedDaysMessage } from "@/lib/quotes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProposalTextEditor } from "./proposal-text-editor";
import type { useQuoteActions } from "./quote-workspace";
import { safeLink } from "../../../supabase/functions/_shared/proposal-html";
import { currentClientEmail } from "@/lib/clients";

type Block = Awaited<ReturnType<typeof doc.listDocBlocks>>[number];
type Actions = ReturnType<typeof useQuoteActions>;
const required = (s: doc.DocSection) =>
  s.snapshot.required || ["TYC", "PRECIO", "ITINERARIO"].includes(s.snapshot.code);
const title = (s: doc.DocSection, lang: string) =>
  s.override_lang === lang && s.title_override !== null
    ? s.title_override
    : s.snapshot.translations.find((t) => t.lang === lang)?.title || s.snapshot.code;
function LibraryBlock({
  block,
  disabled,
  onAdd,
  lang,
}: {
  block: Block;
  disabled: boolean;
  onAdd: () => void;
  lang: string;
}) {
  const drag = useDraggable({ id: `library:${block.id}`, disabled });
  return (
    <div
      ref={drag.setNodeRef}
      className="flex items-center gap-1 rounded border bg-card p-2"
      style={{ opacity: drag.isDragging ? 0.5 : 1 }}
    >
      <button
        type="button"
        aria-label={`Arrastrar ${block.code}`}
        className="touch-none p-1"
        {...drag.attributes}
        {...drag.listeners}
        disabled={disabled}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 text-sm">
        {block.doc_block_translations.find((t) => t.lang === lang)?.title || block.code}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={onAdd}
        aria-label={`Añadir ${block.code}`}
      >
        +
      </Button>
    </div>
  );
}
function SectionCard({
  section,
  lang,
  disabled,
  onEdit,
  onHide,
  onReset,
  onRemove,
  onSave,
  onMove,
  onOptions,
}: {
  section: doc.DocSection;
  lang: string;
  disabled: boolean;
  onEdit: () => void;
  onHide: () => void;
  onReset: () => void;
  onRemove: () => void;
  onSave: () => void;
  onMove: (direction: number) => void;
  onOptions: () => void;
}) {
  const sort = useSortable({ id: section.id, disabled });
  const locked = required(section);
  const reviewed =
    section.override_lang === lang
      ? section.reviewed
      : section.snapshot.translations.find((t) => t.lang === lang)?.reviewed;
  return (
    <Card
      id={`section-${section.id}`}
      ref={sort.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sort.transform),
        transition: sort.transition,
        opacity: section.hidden ? 0.55 : 1,
      }}
      className="scroll-mt-24 space-y-2 p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...sort.attributes}
          {...sort.listeners}
          className="touch-none"
          aria-label={`Mover ${title(section, lang)}`}
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {section.snapshot.kind === "static" ? (
          <FileText className="h-4 w-4" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        <span className="flex-1 font-medium">{title(section, lang)}</span>
        {locked && <LockKeyhole className="h-4 w-4" aria-label="Obligatorio" />}
        {section.hidden && <EyeOff className="h-4 w-4" />}
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">
          {section.snapshot.kind === "dynamic" ? "Dato automático" : "Texto"}
        </Badge>
        {section.snapshot.kind === "static" && !reviewed && section.options["mode"] !== "link" && (
          <Badge variant="outline" className="text-brand-orange-deep">
            Texto sin revisar
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {section.snapshot.kind === "static" && (
          <Button variant="outline" size="sm" disabled={disabled} onClick={onEdit}>
            Editar texto
          </Button>
        )}
        <Button variant="outline" size="sm" disabled={disabled} onClick={onOptions}>
          Opciones
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled || locked} onClick={onHide}>
          {section.hidden ? "Mostrar" : "Ocultar"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onMove(-1)}
          aria-label="Subir sección"
        >
          ↑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onMove(1)}
          aria-label="Bajar sección"
        >
          ↓
        </Button>
        {section.snapshot.kind === "static" && (
          <>
            <Button variant="ghost" size="sm" disabled={disabled} onClick={onReset}>
              Restaurar
            </Button>
            <Button variant="ghost" size="sm" disabled={disabled} onClick={onSave}>
              Guardar como bloque
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" disabled={disabled || locked} onClick={onRemove}>
          Quitar
        </Button>
      </div>
      {section.snapshot.kind === "dynamic" && (
        <p className="text-xs text-muted-foreground">
          Los textos y datos se toman de la cotización.
        </p>
      )}
    </Card>
  );
}
function Canvas({ children }: { children: React.ReactNode }) {
  const drop = useDroppable({ id: "proposal-end" });
  return (
    <div ref={drop.setNodeRef} className="min-h-60 space-y-3 rounded-lg border border-dashed p-3">
      {children}
    </div>
  );
}
function previewPage(html: string) {
  const styles = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const background = styles?.getPropertyValue("--background") || "Canvas";
  const foreground = styles?.getPropertyValue("--foreground") || "CanvasText";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>body{font:14px/1.55 system-ui;margin:24px;background:${background};color:${foreground}}h2{font-size:20px;margin-top:28px}h3{font-size:16px}table{border-collapse:collapse;width:100%}td,th{padding:6px;border-bottom:1px solid currentColor;vertical-align:top}a{color:inherit}.align-center{text-align:center}.align-right{text-align:right}img{max-width:100%}</style></head><body>${html}</body></html>`;
}
export function ProposalBuilder({
  quote,
  actions,
  days,
}: {
  quote: Tables<"quotes">;
  actions: Actions;
  days: Tables<"quote_days">[];
}) {
  const { role } = useCurrentUser();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("static");
  const [target, setTarget] = useState<"pdf" | "email">("pdf");
  const [editing, setEditing] = useState<doc.DocSection | null>(null);
  const [options, setOptions] = useState<doc.DocSection | null>(null);
  const [optionFocus, setOptionFocus] = useState<"terms-url" | "valid-until" | null>(null);
  const [modal, setModal] = useState<{ kind: "block" | "layout" | "replace"; id?: string } | null>(
    null,
  );
  const [name, setName] = useState("");
  const editable = quote.status === "borrador" && !quote.archived_at;
  const disabled = !editable || actions.busy;
  const sections = useQuery({
    queryKey: ["doc-sections", quote.id],
    queryFn: () => doc.listDocSections(quote.id),
  });
  const library = useQuery({
    queryKey: ["doc-library", quote.client_type],
    queryFn: () => doc.listDocBlocks({ channel: quote.client_type }),
  });
  const layouts = useQuery({
    queryKey: ["doc-layouts", quote.client_type],
    queryFn: () => doc.listDocLayouts(quote.client_type),
  });
  const clientEmail = useQuery({
    queryKey: ["client-email", quote.client_id],
    queryFn: () => currentClientEmail(quote.client_id),
  });
  const ordered = sections.data ?? [];
  const preview = useQuery({
    queryKey: ["proposal", quote.id, quote.updated_at, ordered, target],
    queryFn: () => doc.renderProposal(quote.id, { target, lang: quote.language }),
    enabled: ordered.length > 0,
    retry: 1,
  });
  const page = useMemo(() => previewPage(preview.data?.html ?? ""), [preview.data?.html]);
  const run = useCallback(
    async (fn: () => Promise<unknown>, message = "Propuesta guardada.") =>
      actions.act(
        async () => {
          await fn();
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["doc-sections", quote.id] }),
            qc.invalidateQueries({ queryKey: ["proposal", quote.id] }),
            qc.invalidateQueries({ queryKey: ["doc-library"] }),
            qc.invalidateQueries({ queryKey: ["doc-layouts"] }),
          ]);
        },
        message,
        false,
      ),
    [actions, qc, quote.id],
  );
  const initialized = useRef<string | null>(null);
  useEffect(() => {
    if (editable && sections.data?.length === 0 && initialized.current !== quote.id) {
      initialized.current = quote.id;
      void run(() => doc.ensureDocSections(quote.id), "Documento preparado.");
    }
  }, [editable, sections.data, quote.id, run]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const move = (id: string, to: number) => {
    const from = ordered.findIndex((s) => s.id === id);
    if (to >= 0 && to < ordered.length && to !== from)
      void run(() =>
        doc.reorderDocSections(
          quote.id,
          arrayMove(ordered, from, to).map((s) => s.id),
        ),
      );
  };
  const drop = (event: DragEndEvent) => {
    if (!event.over || disabled) return;
    const source = String(event.active.id);
    const dest = ordered.findIndex((s) => s.id === event.over?.id);
    if (source.startsWith("library:"))
      void run(() =>
        doc.addSection(quote.id, source.slice(8), dest < 0 ? undefined : ordered[dest]!.sort),
      );
    else move(source, dest < 0 ? ordered.length - 1 : dest);
  };
  const notices = preview.data?.avisos ?? [];
  const dayMessage = preview.data?.frozen ? null : unreviewedDaysMessage(days, quote.language);
  const blocked =
    !!preview.error ||
    preview.isFetching ||
    !preview.data ||
    notices.some((n) => n.level === "error") ||
    !!dayMessage;
  const sectionForNotice = (notice: (typeof notices)[number]) => {
    if (notice.sectionId) return notice.sectionId;
    if (/términ|condiciones|T&C/i.test(notice.message))
      return ordered.find((section) => section.snapshot.code === "TYC")?.id;
    if (/validez|válida|valida_hasta/i.test(notice.message))
      return ordered.find((section) => section.snapshot.data_key === "validez")?.id;
    return undefined;
  };
  const openRequirement = (notice: (typeof notices)[number]) => {
    const sectionId = sectionForNotice(notice);
    const section = ordered.find((candidate) => candidate.id === sectionId);
    if (!section) return;
    setOptionFocus(
      section.snapshot.code === "TYC"
        ? "terms-url"
        : section.snapshot.data_key === "validez"
          ? "valid-until"
          : null,
    );
    setOptions(section);
  };
  const recipient = clientEmail.data ?? null;
  const generate = () =>
    actions.act(
      async () => {
        const { generateQuotePdf } = await import("@/lib/pdf");
        const blob = await generateQuotePdf(quote.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quote.code}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      "PDF generado.",
      false,
    );
  const send = () =>
    actions.act(
      async () => {
        await sendQuoteEmail(quote.id);
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["proposal", quote.id] }),
          qc.invalidateQueries({ queryKey: ["quote-history"] }),
          qc.invalidateQueries({ queryKey: ["quote-versions"] }),
        ]);
      },
      "Correo enviado.",
      false,
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-semibold">Constructor de propuesta</h2>
        <Label>
          Diseño
          <select
            aria-label="Diseño de documento"
            className="ml-2 rounded border bg-background p-2"
            disabled={disabled}
            value=""
            onChange={(e) => setModal({ kind: "replace", id: e.target.value })}
          >
            <option value="">Cambiar…</option>
            {layouts.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Label>
        {canManageCatalog(role) && (
          <Button
            variant="outline"
            disabled={disabled || !ordered.length}
            onClick={() => {
              setName("");
              setModal({ kind: "layout" });
            }}
          >
            Guardar diseño
          </Button>
        )}
      </div>
      <Card
        aria-label="Acciones de PDF y envío"
        className="sticky top-16 z-20 space-y-2 border-primary/30 bg-background/95 p-3 shadow-sm backdrop-blur"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={actions.busy || blocked} onClick={() => void generate()}>
            {preview.data?.frozen ? "Descargar propuesta enviada" : "Generar PDF"}
          </Button>
          <Button
            disabled={
              actions.busy ||
              blocked ||
              !!quote.archived_at ||
              !quote.pdf_path ||
              !recipient ||
              !["revisada", "enviada"].includes(quote.status)
            }
            onClick={() => void send()}
          >
            Enviar por email
          </Button>
          <span className="min-w-0 text-sm text-muted-foreground">
            {recipient || (clientEmail.isLoading ? "Consultando email del cliente…" : "Falta el email del cliente.")}
          </span>
        </div>
        {blocked && (
          <div className="space-y-1 text-sm" role="alert">
            <p className="font-medium text-destructive">Completa estos requisitos para generar el PDF:</p>
            {preview.isFetching && <p className="text-muted-foreground">Comprobando la propuesta…</p>}
            {preview.error && <p>{preview.error.message}</p>}
            {dayMessage && <p>{dayMessage}</p>}
            {notices.filter((notice) => notice.level === "error").map((notice, index) => {
              const sectionId = sectionForNotice(notice);
              return sectionId ? (
                <a
                  key={index}
                  className="block underline"
                  href={`#section-${sectionId}`}
                  onClick={(event) => { event.preventDefault(); openRequirement(notice); }}
                >
                  {notice.message} Ir al campo correspondiente.
                </a>
              ) : <p key={index}>{notice.message}</p>;
            })}
            {preview.error && (
              <Button size="sm" variant="outline" onClick={() => void preview.refetch()}>
                Reintentar
              </Button>
            )}
          </div>
        )}
        {!blocked && notices.some((notice) => notice.level !== "error") && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {notices.filter((notice) => notice.level !== "error").map((notice, index) => (
              <p key={index}>{notice.message}</p>
            ))}
          </div>
        )}
      </Card>
      {!ordered.length && (
        <Card className="space-y-3 p-4">
          <p>
            {sections.isLoading
              ? "Cargando propuesta…"
              : sections.error
                ? "No se pudo cargar el documento."
                : "Crea la propuesta con el diseño inicial de este canal."}
          </p>
          <Button
            disabled={disabled || sections.isLoading}
            onClick={() => void run(() => doc.ensureDocSections(quote.id))}
          >
            Crear propuesta
          </Button>
        </Card>
      )}
      {ordered.length > 0 && (
        <DndContext sensors={sensors} onDragEnd={drop}>
          <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(280px,1fr)_minmax(340px,1.2fr)]">
            <Card className="space-y-3 p-3">
              <h3 className="font-semibold">Biblioteca</h3>
              <Input
                aria-label="Buscar bloques del documento"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar bloque…"
              />
              <div className="flex gap-1">
                <Button
                  variant={kind === "static" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setKind("static")}
                >
                  Textos
                </Button>
                <Button
                  variant={kind === "dynamic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setKind("dynamic")}
                >
                  Datos
                </Button>
              </div>
              {library.error && <p role="alert">No se pudo cargar la biblioteca.</p>}
              {library.data
                ?.filter(
                  (b) =>
                    b.kind === kind &&
                    `${b.code} ${b.doc_block_translations.map((t) => t.title).join(" ")}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((b) => (
                  <LibraryBlock
                    key={b.id}
                    block={b}
                    lang={quote.language}
                    disabled={disabled}
                    onAdd={() => void run(() => doc.addSection(quote.id, b.id))}
                  />
                ))}
            </Card>
            <SortableContext
              items={ordered.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <Canvas>
                {ordered.map((s, i) => (
                  <SectionCard
                    key={s.id}
                    section={s}
                    lang={quote.language}
                    disabled={disabled}
                    onEdit={() => setEditing(s)}
                    onHide={() => void run(() => doc.setSectionHidden(quote.id, s.id, !s.hidden))}
                    onReset={() => void run(() => doc.resetSection(quote.id, s.id))}
                    onRemove={() => void run(() => doc.removeSection(quote.id, s.id))}
                    onSave={() => {
                      setName("");
                      setModal({ kind: "block", id: s.id });
                    }}
                    onMove={(d) => move(s.id, i + d)}
                    onOptions={() => { setOptionFocus(null); setOptions(s); }}
                  />
                ))}
              </Canvas>
            </SortableContext>
            <Card className="space-y-3 p-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={target === "pdf" ? "default" : "outline"}
                  onClick={() => setTarget("pdf")}
                >
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant={target === "email" ? "default" : "outline"}
                  onClick={() => setTarget("email")}
                >
                  Email
                </Button>
                {preview.isFetching && (
                  <span className="text-xs text-muted-foreground">Actualizando…</span>
                )}
                {preview.data?.frozen && (
                  <span className="text-xs text-muted-foreground">Versión enviada · fija</span>
                )}
              </div>
              <iframe
                title={`Vista previa ${target}`}
                sandbox=""
                className="h-[650px] w-full rounded border bg-background"
                srcDoc={page}
              />
            </Card>
          </div>
        </DndContext>
      )}
      {!editable && (
        <p className="text-sm text-muted-foreground">
          Para editar el documento, vuelve a borrador o crea una nueva versión de la cotización.
        </p>
      )}
      {editing && (
        <ProposalTextEditor
          key={editing.id}
          title={title(editing, quote.language)}
          html={
            editing.override_lang === quote.language
              ? (editing.body_override_html ?? "")
              : (editing.snapshot.translations.find((t) => t.lang === quote.language)?.body_html ??
                "")
          }
          disabled={disabled}
          onClose={() => setEditing(null)}
          onSave={(title, html) =>
            run(() => doc.updateSectionText(quote.id, editing.id, title, html))
          }
        />
      )}
      {options && (
        <SectionOptions
          key={options.id}
          section={options}
          initialFocus={optionFocus}
          disabled={disabled}
          onClose={() => { setOptions(null); setOptionFocus(null); }}
          onSave={(value) => run(() => doc.setSectionOptions(quote.id, options.id, value))}
        />
      )}
      <Dialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal?.kind === "replace"
                ? "Cambiar diseño"
                : modal?.kind === "block"
                  ? "Guardar como bloque"
                  : "Guardar diseño"}
            </DialogTitle>
            <DialogDescription>
              {modal?.kind === "replace"
                ? "Se reemplazarán todas las secciones y sus ediciones por una nueva copia del diseño."
                : modal?.kind === "block"
                  ? "Se crea un bloque pendiente de revisión; el original se conserva."
                  : "Guarda el orden y opciones. Los textos propios de esta cotización no se incorporan a la biblioteca."}
            </DialogDescription>
          </DialogHeader>
          {modal?.kind !== "replace" && (
            <Input
              aria-label={modal?.kind === "block" ? "Código del bloque" : "Nombre del diseño"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={modal?.kind === "block" ? "MI_BLOQUE" : "Nombre del diseño"}
            />
          )}
          <Button
            disabled={disabled || (modal?.kind !== "replace" && !name.trim())}
            onClick={async () => {
              if (!modal) return;
              const ok = await run(() =>
                modal.kind === "replace"
                  ? doc.ensureDocSections(quote.id, modal.id)
                  : modal.kind === "block"
                    ? doc.saveSectionAsBlock(quote.id, modal.id!, name)
                    : doc.saveAsLayout(quote.id, name),
              );
              if (ok) setModal(null);
            }}
          >
            Confirmar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function SectionOptions({
  section,
  initialFocus,
  disabled,
  onClose,
  onSave,
}: {
  section: doc.DocSection;
  initialFocus: "terms-url" | "valid-until" | null;
  disabled: boolean;
  onClose: () => void;
  onSave: (options: Record<string, unknown>) => Promise<boolean>;
}) {
  const [value, setValue] = useState(section.options);
  const media = useQuery({ queryKey: ["proposal-media"], queryFn: doc.listProposalMedia });
  const field = (key: string, v: unknown) => setValue((old) => ({ ...old, [key]: v }));
  const termsMode = String(value["mode"] ?? "full");
  const termsUrl = String(value["url"] ?? "").trim();
  const termsUrlValid = termsMode === "full" || Boolean(safeLink(termsUrl)?.startsWith("https://"));
  const validUntil = String(value["valid_until"] ?? "");
  const validUntilRequired = section.snapshot.data_key === "validez";
  const validUntilValid = !validUntilRequired || (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(validUntil) && !Number.isNaN(new Date(validUntil).getTime()));
  const valid = termsUrlValid && validUntilValid;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opciones · {section.snapshot.code}</DialogTitle>
          <DialogDescription>Se guardan solo en esta propuesta.</DialogDescription>
        </DialogHeader>
        {section.snapshot.code === "TYC" ? (
          <>
            <Label htmlFor="proposal-terms-mode">
              Presentación
              <select
                id="proposal-terms-mode"
                className="ml-2 rounded border bg-background p-2"
                value={String(value["mode"] ?? "full")}
                onChange={(e) => field("mode", e.target.value)}
              >
                <option value="full">Texto completo</option>
                <option value="link">Enlace</option>
                <option value="both">Texto y enlace</option>
              </select>
            </Label>
            <Label htmlFor="proposal-terms-url">
              Enlace web de términos y condiciones
              <Input
                id="proposal-terms-url"
                aria-describedby={!termsUrlValid ? "proposal-terms-url-error" : undefined}
                autoFocus={initialFocus === "terms-url"}
                type="url"
                placeholder="https://ejemplo.com/terminos"
                value={String(value["url"] ?? "")}
                onChange={(e) => field("url", e.target.value)}
              />
            </Label>
            {!termsUrlValid && <p id="proposal-terms-url-error" role="alert" className="text-sm text-destructive">Ingresa una URL HTTPS válida.</p>}
          </>
        ) : section.snapshot.data_key === "validez" ? (
          <Label htmlFor="proposal-valid-until">
            Propuesta válida hasta (fecha y hora)
            <Input
              id="proposal-valid-until"
              aria-describedby={!validUntilValid ? "proposal-valid-until-error" : undefined}
              autoFocus={initialFocus === "valid-until"}
              type="datetime-local"
              value={String(value["valid_until"] ?? "")}
              onChange={(e) => field("valid_until", e.target.value)}
            />
          </Label>
        ) : section.snapshot.data_key === "itinerario" ? (
          <>
            {[
              ["accommodation", "Mostrar alojamiento"],
              ["meals", "Mostrar comidas"],
            ].map(([key, label]) => (
              <Label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value[key!] !== false}
                  onChange={(e) => field(key!, e.target.checked)}
                />
                {label}
              </Label>
            ))}
          </>
        ) : section.snapshot.data_key === "precio" ? (
          <>
            <Label className="flex gap-2">
              <input
                type="checkbox"
                checked={value["per_person"] !== false}
                onChange={(e) => field("per_person", e.target.checked)}
              />
              Mostrar precio por persona
            </Label>
            <Label className="flex gap-2">
              <input
                type="checkbox"
                checked={value["tiers"] === true}
                onChange={(e) => field("tiers", e.target.checked)}
              />
              Mostrar tramos guardados (B2B)
            </Label>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este bloque utiliza los datos y textos de la cotización.
          </p>
        )}
        {!validUntilValid && <p id="proposal-valid-until-error" role="alert" className="text-sm text-destructive">Selecciona una fecha y hora válidas.</p>}
        <Label>
          Imágenes de Media
          <select
            multiple
            aria-label="Imágenes de Media"
            className="mt-2 block max-h-40 w-full rounded border bg-background p-2"
            value={Array.isArray(value["media_ids"]) ? (value["media_ids"] as string[]) : []}
            onChange={(e) =>
              field(
                "media_ids",
                Array.from(e.target.selectedOptions, (o) => o.value),
              )
            }
          >
            {media.data?.map((m, i) => (
              <option key={m.id} value={m.id}>
                {m.places?.name ?? m.services?.name ?? "Imagen"} ·{" "}
                {m.type === "alojamiento" ? "Alojamiento" : "Destino"} {i + 1}
              </option>
            ))}
          </select>
        </Label>
        <p className="text-xs text-muted-foreground">
          Hasta 10 fotos PNG/JPEG y 4 MB en total. Usa Ctrl para seleccionar varias.
        </p>
        <Button
          disabled={disabled || !valid}
          onClick={async () => {
            if (await onSave(value)) onClose();
          }}
        >
          Guardar opciones
        </Button>
      </DialogContent>
    </Dialog>
  );
}
