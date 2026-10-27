import { beforeEach, expect, it, vi } from "vitest";
import {
  approveDayBlocks,
  approveImportReviewItems,
  approveTemplates,
  previewCatalogApproval,
} from "./index";
import { approveImportReviewSelection, bulkApprovalNotice } from "./review-approval";

vi.mock("./index", () => ({
  approveDayBlocks: vi.fn(),
  approveImportReviewItems: vi.fn(),
  approveTemplates: vi.fn(),
  previewCatalogApproval: vi.fn(),
}));

const preview = vi.mocked(previewCatalogApproval);
const approveBlocks = vi.mocked(approveDayBlocks);
const approveImportItems = vi.mocked(approveImportReviewItems);
const approveTemplateItems = vi.mocked(approveTemplates);

beforeEach(() => {
  vi.clearAllMocks();
  preview.mockResolvedValue({ items: [], eligible: 1, with_warnings: 0 });
  approveBlocks.mockResolvedValue({
    items: [], eligible: 1, with_warnings: 0, approved: 1, pending: 0, accept_warnings: false,
  });
  approveTemplateItems.mockResolvedValue({
    items: [], eligible: 1, with_warnings: 0, approved: 1, pending: 0, accept_warnings: false,
  });
  approveImportItems.mockResolvedValue({ approved: 1, pending: 0 });
});

it.each([
  ["services", "services"],
  ["activity_modules", "activity_modules"],
] as const)("despacha %s mediante approve_import_items", async (kind, rpcKind) => {
  const confirm = vi.fn();
  await expect(approveImportReviewSelection(kind, ["id-1"], confirm)).resolves.toEqual({
    approved: 1,
    pending: 0,
  });
  expect(approveImportItems).toHaveBeenCalledWith(rpcKind, ["id-1"]);
  expect(preview).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});

it("cancela por completo bloques con advertencias sin ejecutar la aprobación", async () => {
  preview.mockResolvedValue({ items: [], eligible: 1, with_warnings: 2 });
  const rejected = vi.fn().mockReturnValue(false);
  await expect(approveImportReviewSelection("day_blocks", ["b1", "b2", "b3"], rejected))
    .resolves.toBeNull();
  expect(preview).toHaveBeenCalledWith("day_blocks", ["b1", "b2", "b3"]);
  expect(approveBlocks).not.toHaveBeenCalled();
  expect(approveTemplateItems).not.toHaveBeenCalled();
  expect(approveImportItems).not.toHaveBeenCalled();
});

it("acepta explícitamente advertencias y ejecuta approve_day_blocks", async () => {
  preview.mockResolvedValue({ items: [], eligible: 1, with_warnings: 2 });
  approveBlocks.mockResolvedValue({
    items: [], eligible: 1, with_warnings: 2, approved: 3, pending: 0, accept_warnings: true,
  });

  const accepted = vi.fn().mockReturnValue(true);
  await expect(approveImportReviewSelection("day_blocks", ["b1", "b2", "b3"], accepted))
    .resolves.toMatchObject({ approved: 3, pending: 0 });
  expect(approveBlocks).toHaveBeenLastCalledWith(["b1", "b2", "b3"], {
    acceptWarnings: true,
  });
});

it("aprueba bloques sin advertencias sin pedir confirmación", async () => {
  const confirm = vi.fn();
  await expect(approveImportReviewSelection("day_blocks", ["b1"], confirm))
    .resolves.toMatchObject({ approved: 1, pending: 0 });
  expect(confirm).not.toHaveBeenCalled();
  expect(approveBlocks).toHaveBeenCalledWith(["b1"], { acceptWarnings: false });
});

it("usa approve_templates y conserva el resultado administrativo devuelto para un bloqueo económico", async () => {
  preview.mockResolvedValue({ items: [], eligible: 0, with_warnings: 1 });
  approveTemplateItems.mockResolvedValue({
    items: [], eligible: 1, with_warnings: 1, approved: 1, pending: 0, accept_warnings: true,
  });
  const confirm = vi.fn().mockReturnValue(true);

  await expect(approveImportReviewSelection("itinerary_templates", ["t1"], confirm))
    .resolves.toMatchObject({ approved: 1, pending: 0 });
  expect(preview).toHaveBeenCalledWith("templates", ["t1"]);
  expect(confirm).toHaveBeenCalledWith("itinerary_templates", 1);
  expect(approveTemplateItems).toHaveBeenCalledWith(["t1"], { acceptWarnings: true });
});

it("informa los conteos reales y una aprobación individual pendiente nunca muestra éxito", () => {
  expect(bulkApprovalNotice(3, 0)).toEqual({ level: "success", message: "3 aprobados." });
  expect(bulkApprovalNotice(2, 1)).toEqual({
    level: "warning",
    message: "2 aprobados y 1 pendientes; revisa sus advertencias.",
  });
  expect(bulkApprovalNotice(0, 4)).toEqual({
    level: "error",
    message: "0 aprobados; 4 continúan pendientes. Revisa las advertencias guardadas.",
  });
});
