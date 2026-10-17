import { db, unwrap } from "../db";

export interface BlockTemplateDependency {
  block_id: string;
  templates: { id: string; sku: string }[];
}

export interface DeleteTemplatesCounts {
  templates: number;
  template_days: number;
}

export interface PurgeCatalogCounts extends DeleteTemplatesCounts {
  day_blocks: number;
  day_block_translations: number;
  day_block_items: number;
  day_block_modules: number;
  templates_updated: number;
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
