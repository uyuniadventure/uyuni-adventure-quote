import { db, json, unwrap } from "../db";
import {
  publicImportPayload,
  type ConsolidatedWorkbookPreview,
} from "./consolidated-workbook";

export interface ConsolidatedDatabasePreview {
  services: { new: number; existing: number; protected: number };
  rates: { new: number; existing: number; modified: number };
  scenarios: { new: number; existing: number; modified: number };
  scenario_days: { total: number };
  templates: { new: number; existing: number; protected: number };
  issues: number;
  pending_services: number;
}

export interface ConsolidatedImportResult {
  dry_run: boolean;
  idempotent?: boolean;
  run_id?: string;
  source_sha256?: string;
  preview: ConsolidatedDatabasePreview;
  processed?: Record<string, number>;
}

export async function previewConsolidatedImport(
  preview: ConsolidatedWorkbookPreview,
): Promise<ConsolidatedDatabasePreview> {
  const result = unwrap(
    await db.rpc("preview_consolidated_workbook", {
      p_payload: json(publicImportPayload(preview)),
    }),
  );
  return result as unknown as ConsolidatedDatabasePreview;
}

export async function commitConsolidatedImport(
  fileName: string,
  preview: ConsolidatedWorkbookPreview,
): Promise<ConsolidatedImportResult> {
  const result = unwrap(
    await db.rpc("import_consolidated_workbook", {
      p_file_name: fileName,
      p_source_sha256: preview.sourceSha256,
      p_payload: json(publicImportPayload(preview)),
      p_confirm: true,
    }),
  );
  return result as unknown as ConsolidatedImportResult;
}
