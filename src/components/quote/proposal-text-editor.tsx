import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PROPOSAL_VARIABLES } from "@/lib/quotes/document";
import {
  sanitizeProposalHtml,
  escapeHtml,
  safeLink,
} from "../../../supabase/functions/_shared/proposal-html";

export function ProposalTextEditor({
  title,
  html,
  onSave,
  onClose,
  disabled = false,
}: {
  title: string;
  html: string;
  onSave: (title: string, html: string) => Promise<boolean>;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState(title);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const remember = () => {
    const s = window.getSelection();
    if (s?.rangeCount && editor.current?.contains(s.anchorNode))
      selection.current = s.getRangeAt(0).cloneRange();
  };
  const command = (cmd: string, value?: string) => {
    editor.current?.focus();
    const s = window.getSelection();
    if (selection.current && s) {
      s.removeAllRanges();
      s.addRange(selection.current);
    }
    document.execCommand(cmd, false, value);
    remember();
  };
  const align = (value: string) => {
    const s = window.getSelection();
    let node = s?.anchorNode?.parentElement;
    while (node && node !== editor.current && !["P", "H2", "H3", "TD", "TH"].includes(node.tagName))
      node = node.parentElement;
    if (node && node !== editor.current) node.className = `align-${value}`;
  };
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Editar texto</SheetTitle>
          <SheetDescription>
            Este texto pertenece a la propuesta. La biblioteca conserva su versión.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <Label>
            Título
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              disabled={disabled || saving}
            />
          </Label>
          <div className="flex flex-wrap gap-1" aria-label="Formato del texto">
            {(
              [
                ["Párrafo", "formatBlock", "p"],
                ["Título", "formatBlock", "h2"],
                ["Subtítulo", "formatBlock", "h3"],
                ["Negrita", "bold"],
                ["Cursiva", "italic"],
                ["Subrayado", "underline"],
                ["Viñetas", "insertUnorderedList"],
                ["Numeración", "insertOrderedList"],
              ] as const
            ).map(([label, cmd, value]) => (
              <Button
                key={label}
                size="sm"
                variant="outline"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => command(cmd, value)}
              >
                {label}
              </Button>
            ))}
            {(["left", "center", "right"] as const).map((a, i) => (
              <Button
                key={a}
                variant="outline"
                size="sm"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => align(a)}
              >
                {["Izquierda", "Centro", "Derecha"][i]}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                command(
                  "insertHTML",
                  "<table><tbody><tr><td>…</td><td>…</td></tr><tr><td>…</td><td>…</td></tr></tbody></table><p><br></p>",
                )
              }
            >
              Tabla
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command("insertHTML", "<hr>")}
            >
              Separador
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              aria-label="Dirección del enlace"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
            />
            <Button
              variant="outline"
              disabled={disabled || !safeLink(url)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command("createLink", safeLink(url)!)}
            >
              Enlazar selección
            </Button>
          </div>
          <Label>
            Insertar variable
            <select
              className="ml-2 rounded border bg-background p-2"
              value=""
              disabled={disabled}
              onChange={(e) => command("insertText", `{{${e.target.value}}}`)}
            >
              <option value="">Elegir…</option>
              {PROPOSAL_VARIABLES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Label>
          <div
            ref={editor}
            role="textbox"
            aria-label="Contenido del bloque"
            aria-multiline
            contentEditable={!disabled && !saving}
            suppressContentEditableWarning
            className="document-prose min-h-72 rounded border bg-background p-4 outline-none focus:ring-2 focus:ring-ring"
            dangerouslySetInnerHTML={{ __html: sanitizeProposalHtml(html) }}
            onKeyUp={remember}
            onMouseUp={remember}
            onBlur={remember}
            onPaste={(e) => {
              e.preventDefault();
              command(
                "insertHTML",
                escapeHtml(e.clipboardData.getData("text/plain")).replace(/\n/g, "<br>"),
              );
            }}
          />
          <p className="text-xs text-muted-foreground">
            Se admite texto, listas, tablas y enlaces. Las imágenes de la propuesta se eligen desde
            Media.
          </p>
          <Button
            disabled={disabled || saving}
            onClick={async () => {
              setSaving(true);
              try {
                if (await onSave(name, sanitizeProposalHtml(editor.current?.innerHTML ?? "")))
                  onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Guardando…" : "Guardar y marcar revisado"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
