import {
  approveDayBlocks,
  approveImportReviewItems,
  approveTemplates,
  previewCatalogApproval,
} from "./index";

export type ImportReviewApprovalKind =
  | "services"
  | "activity_modules"
  | "day_blocks"
  | "itinerary_templates";

export type ConfirmWarningAcceptance = (
  kind: "day_blocks" | "itinerary_templates",
  warningCount: number,
) => boolean | Promise<boolean>;

export function bulkApprovalNotice(approved: number, pending: number) {
  if (pending === 0) return { level: "success" as const, message: `${approved} aprobados.` };
  if (approved === 0) {
    return {
      level: "error" as const,
      message: `0 aprobados; ${pending} continúan pendientes. Revisa las advertencias guardadas.`,
    };
  }
  return {
    level: "warning" as const,
    message: `${approved} aprobados y ${pending} pendientes; revisa sus advertencias.`,
  };
}

export async function approveImportReviewSelection(
  kind: ImportReviewApprovalKind,
  ids: string[],
  confirmWarningAcceptance: ConfirmWarningAcceptance,
) {
  if (kind === "services" || kind === "activity_modules") {
    return approveImportReviewItems(kind, ids);
  }

  const catalogKind = kind === "day_blocks" ? "day_blocks" : "templates";
  const preview = await previewCatalogApproval(catalogKind, ids);
  let acceptWarnings = false;
  if (preview.with_warnings > 0) {
    acceptWarnings = await confirmWarningAcceptance(kind, preview.with_warnings);
    if (!acceptWarnings) return null;
  }

  return kind === "day_blocks"
    ? approveDayBlocks(ids, { acceptWarnings })
    : approveTemplates(ids, { acceptWarnings });
}
