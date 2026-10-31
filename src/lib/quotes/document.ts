import { db, json, unwrap } from "../db";
import { z } from "zod";
import { documentContentPatchSchema, type DocumentContentPatch } from "./document-model";
import { sanitizeProposalHtml } from "../../../supabase/functions/_shared/proposal-html";
import type { DocSection, ProposalRender } from "../../../supabase/functions/_shared/proposal";
export { PROPOSAL_VARIABLES } from "../../../supabase/functions/_shared/proposal";
export type {
  DocSection,
  DocSnapshot,
  DocTranslation,
  ProposalRender,
} from "../../../supabase/functions/_shared/proposal";

export async function listDocBlocks({
  channel,
  kind,
  search = "",
}: { channel?: string; kind?: string; search?: string } = {}) {
  let query = db.from("doc_blocks").select("*,doc_block_translations(*)").order("code");
  if (channel) query = query.in("channel", ["all", channel.toLowerCase()]);
  if (kind) query = query.eq("kind", kind);
  if (search) query = query.ilike("code", `%${search.replace(/[%,()]/g, " ")}%`);
  return unwrap(await query);
}
export async function listDocSections(quoteId: string): Promise<DocSection[]> {
  return unwrap(
    await db.from("quote_doc_sections").select("*").eq("quote_id", quoteId).order("sort"),
  ) as unknown as DocSection[];
}
export async function listDocLayouts(channel: string) {
  return unwrap(
    await db.from("doc_layouts").select("*").eq("channel", channel.toLowerCase()).order("name"),
  );
}
export async function ensureDocSections(quoteId: string, layoutId?: string): Promise<void> {
  const { error } = await db.rpc("ensure_quote_doc_sections", {
    p_quote_id: quoteId,
    ...(layoutId ? { p_layout_id: layoutId } : {}),
  });
  // The SQL function returns void: null data is a successful response.
  if (error) throw new Error(error.message);
}
async function edit(quoteId: string, action: string, sectionId?: string, data: unknown = {}) {
  return unwrap(
    await db.rpc("edit_quote_doc_section", {
      p_quote_id: quoteId,
      p_action: action,
      ...(sectionId ? { p_section_id: sectionId } : {}),
      p_data: json(data),
    }),
  );
}
export async function reorderDocSections(id: string, ids: string[]): Promise<void> {
  const { error } = await db.rpc("reorder_quote_doc_sections", {
    p_quote_id: id,
    p_ids: ids,
  });
  // The SQL function returns void: only a Supabase error means failure.
  if (error) throw new Error(error.message);
}
export const setSectionHidden = (id: string, sectionId: string, hidden: boolean) =>
  edit(id, "hide", sectionId, { hidden });
export const updateSectionText = (
  id: string,
  sectionId: string,
  title: string,
  bodyHtml: string,
  reviewed = true,
) => edit(id, "text", sectionId, { title, body_html: sanitizeProposalHtml(bodyHtml), reviewed });
export const setSectionOptions = (
  id: string,
  sectionId: string,
  options: Record<string, unknown>,
) => edit(id, "options", sectionId, options);
export const resetSection = (id: string, sectionId: string) => edit(id, "reset", sectionId);
export const addSection = (id: string, blockId: string, sort?: number) =>
  edit(id, "add", undefined, { block_id: blockId, ...(sort !== undefined ? { sort } : {}) });
export const removeSection = (id: string, sectionId: string) => edit(id, "remove", sectionId);
export async function saveSectionAsBlock(id: string, sectionId: string, code: string) {
  return unwrap(
    await db.rpc("save_doc_section_as_block", {
      p_quote_id: id,
      p_section_id: sectionId,
      p_code: code,
    }),
  );
}
export async function saveAsLayout(id: string, name: string) {
  return unwrap(await db.rpc("save_quote_doc_as_layout", { p_quote_id: id, p_name: name }));
}
export async function renderProposal(
  quoteId: string,
  options: { target: "pdf" | "email"; lang: string },
): Promise<ProposalRender | null> {
  const { data, error } = await db.functions.invoke("proposal-document", {
    body: { quoteId, ...options },
  });
  if (error) {
    let message =
      "No se pudo preparar la propuesta. Comprueba el despliegue de proposal-document y vuelve a intentar.";
    if (error.context instanceof Response) {
      try {
        const detail = await error.context.json();
        if (typeof detail.error === "string") message = detail.error;
      } catch {
        /* Keep Spanish connection error. */
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as ProposalRender | null;
}
export async function validateProposal(
  quoteId: string,
  options: { target: "pdf" | "email"; lang: string },
) {
  return (await renderProposal(quoteId, options))?.avisos ?? [];
}
export async function createDocBlock(code: string, channel: string) {
  const parsed = z
    .object({
      code: z.string().regex(/^[A-Z][A-Z0-9_]{2,59}$/),
      channel: z.enum(["all", "b2b", "b2c"]),
    })
    .parse({ code, channel });
  return unwrap(
    await db
      .from("doc_blocks")
      .insert({ ...parsed, kind: "static", status: "pendiente" })
      .select("*")
      .single(),
  );
}
export async function setDocBlockStatus(id: string, status: string) {
  return unwrap(
    await db
      .from("doc_blocks")
      .update({ status: z.enum(["activo", "pendiente", "archivado"]).parse(status) })
      .eq("id", id)
      .select("*")
      .single(),
  );
}
export async function saveDocTranslation(
  blockId: string,
  lang: string,
  title: string,
  html: string,
) {
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Vuelve a iniciar sesión para guardar.");
  const user = data.user;
  return unwrap(
    await db.from("doc_block_translations").upsert(
      {
        block_id: blockId,
        lang,
        title: title.trim(),
        body_html: sanitizeProposalHtml(html),
        reviewed: true,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "block_id,lang" },
    ),
  );
}
export async function translateDocBlock(id: string, language: string) {
  const { data, error } = await db.functions.invoke("translate-block", {
    body: { kind: "doc_block", id, language },
  });
  if (error) {
    let message =
      "No se pudo conectar con translate-block. Comprueba que esté desplegada y que tenga LLM_API_KEY y LLM_MODEL.";
    if (error.context instanceof Response) {
      try {
        const d = await error.context.json();
        if (d.error) message = d.error;
      } catch {
        /* connection error */
      }
    }
    throw new Error(message);
  }
  return data;
}
export async function listProposalMedia() {
  return unwrap(
    await db.from("media").select("id,type,places(name),services(name)").order("order").limit(200),
  );
}

async function quoteRevision(quoteId: string) {
  const quote = unwrap(await db.from("quotes").select("updated_at").eq("id", quoteId).single());
  return quote.updated_at;
}

/** Save editable document text in one guarded database transaction. */
export async function saveQuoteDocument(quoteId: string, patch: DocumentContentPatch) {
  const validated = documentContentPatchSchema.parse(patch);
  const updatedAt = await quoteRevision(quoteId);
  return unwrap(
    await db.rpc("save_quote_document", {
      p_quote_id: quoteId,
      p_updated_at: updatedAt,
      p_patch: json(validated),
    }),
  );
}

const itemLabelSchema = z.string().trim().max(200);

/** Store a client-facing service label by quote item id, leaving the tariff intact. */
export async function saveItemLabel(quoteId: string, itemId: string, label: string) {
  const validated = itemLabelSchema.parse(label.trim());
  const updatedAt = await quoteRevision(quoteId);
  return unwrap(
    await db.rpc("save_quote_item_label", {
      p_quote_id: quoteId,
      p_item_id: itemId,
      p_updated_at: updatedAt,
      p_label: validated,
    }),
  );
}
