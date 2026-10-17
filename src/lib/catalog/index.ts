import { db, unwrap } from "../db";

export interface BlockTemplateDependency {
  block_id: string;
  templates: { id: string; sku: string }[];
}

export interface DeleteTemplatesCounts {
  templates: number;
  template_days: number;
  quotes_detached: number;
}

export interface PurgeCatalogCounts extends Omit<DeleteTemplatesCounts, "quotes_detached"> {
  day_blocks: number;
  day_block_translations: number;
  day_block_items: number;
  day_block_modules: number;
  templates_updated: number;
}

export type CatalogKind = "day_blocks" | "templates";
export interface CatalogApprovalPreview {
  items: { id: string; code: string; name: string; reasons: string[] }[];
  eligible: number;
  with_warnings: number;
}
export interface CatalogApprovalResult extends CatalogApprovalPreview {
  approved: number;
  pending: number;
  accept_warnings: boolean;
}

/** Read only: populate the warning dialog before asking the user to approve.
 * The mutation checks current warnings again under a database lock. */
export async function previewCatalogApproval(kind: CatalogKind, ids: string[]) {
  return unwrap(
    await db.rpc("review_catalog_approval", { kind, ids }),
  ) as unknown as CatalogApprovalPreview;
}

export async function approveDayBlocks(ids: string[], { acceptWarnings = false } = {}) {
  return unwrap(
    await db.rpc("approve_day_blocks", { ids, accept_warnings: acceptWarnings }),
  ) as unknown as CatalogApprovalResult;
}

export async function approveTemplates(ids: string[], { acceptWarnings = false } = {}) {
  return unwrap(
    await db.rpc("approve_templates", { ids, accept_warnings: acceptWarnings }),
  ) as unknown as CatalogApprovalResult;
}

/** Counts only; does not expose another seller's quote content to Operation.
 * The result of deleteTemplates is authoritative if the count changes later. */
export async function previewTemplateDeletion(ids: string[]) {
  return unwrap(
    await db.rpc("preview_template_deletion", { ids }),
  ) as unknown as DeleteTemplatesCounts;
}

/** The existing catalog status for archived records is inactivo. */
export async function archiveDayBlocks(ids: string[]) {
  return unwrap(await db.rpc("archive_catalog", { kind: "day_blocks", ids })) as unknown as {
    archived: number;
  };
}

export async function archiveTemplates(ids: string[]) {
  return unwrap(await db.rpc("archive_catalog", { kind: "templates", ids })) as unknown as {
    archived: number;
  };
}

/** After user confirmation. [] = deleted/no remaining IDs; nonempty = NOTHING
 * deleted. Show these dependencies and ask before retrying with force:true.
 * This is a mutation, never a preview: unreferenced blocks are deleted at once. */
export async function deleteDayBlocks(ids: string[], { force = false } = {}) {
  return unwrap(
    await db.rpc("delete_day_blocks", { ids, force }),
  ) as unknown as BlockTemplateDependency[];
}

/** Deletes templates and their day links; existing quotation snapshots survive. */
export async function deleteTemplates(ids: string[]) {
  return unwrap(await db.rpc("delete_templates", { ids })) as unknown as DeleteTemplatesCounts;
}

/** Requires exact BORRAR on the server, after exporting respaldo_catalogo.sql. */
export async function purgeImportedCatalog(confirm: string) {
  return unwrap(
    await db.rpc("purge_imported_catalog", { confirm }),
  ) as unknown as PurgeCatalogCounts;
}
