import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, renderHook, screen, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as catalog from "@/lib/catalog";
import { CatalogSelectionBar, useCatalogActions, type CatalogRecord } from "./catalog-actions";
import { readFilteredCatalogRecords, useCatalogSelection } from "./catalog-selection";

const auth = vi.hoisted(() => ({ role: "admin" }));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => auth, canManageCatalog: (role: string) => role === "admin" || role === "operacion" }));
vi.mock("@/lib/catalog", () => ({ previewCatalogApproval: vi.fn(), approveTemplates: vi.fn(), approveDayBlocks: vi.fn(), deleteTemplates: vi.fn(), deleteDayBlocks: vi.fn(), previewTemplateDeletion: vi.fn(), archiveTemplates: vi.fn(), archiveDayBlocks: vi.fn() }));
const records: CatalogRecord[] = [{ id: "b1", code: "B1", name: "Día vacío" }];
const preview = { items: [{ id: "b1", code: "B1", name: "Día vacío", reasons: ["0 servicios vinculados al tarifario."] }], eligible: 0, with_warnings: 1 };
function Harness({ kind = "day_blocks", saved = vi.fn() }: { kind?: "templates" | "day_blocks"; saved?: () => void }) {
  const actions = useCatalogActions(kind, saved);
  return <><CatalogSelectionBar records={records} actions={actions} />{actions.dialog}</>;
}
function show(kind: "templates" | "day_blocks" = "day_blocks", saved = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><Harness kind={kind} saved={saved} /></QueryClientProvider>);
  return saved;
}
beforeEach(() => { vi.resetAllMocks(); auth.role = "admin"; vi.mocked(catalog.previewCatalogApproval).mockResolvedValue(preview); });
afterEach(cleanup);

it("a block with zero services is left pending unless warnings are explicitly accepted", async () => {
  vi.mocked(catalog.approveDayBlocks).mockResolvedValue({ ...preview, approved: 0, pending: 1, accept_warnings: false });
  show(); fireEvent.click(screen.getByRole("button", { name: "Aprobar (1)" }));
  fireEvent.click(await screen.findByRole("button", { name: "Aprobar solo los sin avisos" }));
  await waitFor(() => expect(catalog.approveDayBlocks).toHaveBeenCalledWith(["b1"], { acceptWarnings: false }));
  expect(await screen.findByText("0 aprobados; 1 pendientes.")).toBeInTheDocument();
});
it("explicit acceptance approves the selected IDs with warnings", async () => {
  vi.mocked(catalog.approveDayBlocks).mockResolvedValue({ ...preview, approved: 1, pending: 0, accept_warnings: true });
  show(); fireEvent.click(screen.getByRole("button", { name: "Aprobar (1)" }));
  fireEvent.click(await screen.findByRole("button", { name: "Aprobar todos igual" }));
  await waitFor(() => expect(catalog.approveDayBlocks).toHaveBeenCalledWith(["b1"], { acceptWarnings: true }));
});
it("block deletion is never a preview and force requires a second confirmation", async () => {
  vi.mocked(catalog.deleteDayBlocks).mockResolvedValueOnce([{ block_id: "b1", templates: [{ id: "t1", sku: "SPASPA-4D3N-FJJ" }] }]).mockResolvedValueOnce([]);
  const saved = show();
  fireEvent.click(screen.getByRole("button", { name: "Eliminar (1)" }));
  await screen.findByRole("button", { name: "Confirmar eliminación" });
  expect(catalog.deleteDayBlocks).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  await screen.findByText("No se borró ningún bloque del lote.");
  expect(catalog.deleteDayBlocks).toHaveBeenCalledExactlyOnceWith(["b1"], { force: false });
  expect(saved).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Eliminar y quitar de las plantillas" }));
  await waitFor(() => expect(catalog.deleteDayBlocks).toHaveBeenLastCalledWith(["b1"], { force: true }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
});
it("template deletion previews quote detachment and reports actual returned counts", async () => {
  vi.mocked(catalog.previewTemplateDeletion).mockResolvedValue({ templates: 1, template_days: 4, quotes_detached: 2 });
  vi.mocked(catalog.deleteTemplates).mockResolvedValue({ templates: 1, template_days: 4, quotes_detached: 3 });
  show("templates"); fireEvent.click(screen.getByRole("button", { name: "Eliminar (1)" }));
  await screen.findByText(/2 cotizaciones quedarán/);
  expect(catalog.deleteTemplates).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  await waitFor(() => expect(catalog.deleteTemplates).toHaveBeenCalledExactlyOnceWith(["b1"]));
  expect(await screen.findByText(/3 cotizaciones sin plantilla de origen/)).toBeInTheDocument();
});
it("archiving uses the library and does not delete records", async () => {
  vi.mocked(catalog.archiveDayBlocks).mockResolvedValue({ archived: 1 });
  show(); fireEvent.click(screen.getByRole("button", { name: "Archivar (1)" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar archivado" }));
  await waitFor(() => expect(catalog.archiveDayBlocks).toHaveBeenCalledExactlyOnceWith(["b1"]));
  expect(catalog.deleteDayBlocks).not.toHaveBeenCalled();
});
it("sellers have no actions and cannot trigger an RPC", () => {
  auth.role = "vendedor"; show();
  expect(screen.queryByRole("button")).toBeNull();
  expect(catalog.previewCatalogApproval).not.toHaveBeenCalled();
});
it("operation can approve selected parents", async () => {
  auth.role = "operacion"; show(); fireEvent.click(screen.getByRole("button", { name: "Aprobar (1)" }));
  await waitFor(() => expect(catalog.previewCatalogApproval).toHaveBeenCalledWith("day_blocks", ["b1"]));
});
it("a rejected mutation retains the dialog and does not signal success", async () => {
  vi.mocked(catalog.archiveDayBlocks).mockRejectedValue(new Error("No tienes permiso."));
  const saved = show(); fireEvent.click(screen.getByRole("button", { name: "Archivar (1)" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar archivado" }));
  await screen.findByRole("alert");
  expect(saved).not.toHaveBeenCalled();
});
it("select-all pagination includes all 1201 filtered records beyond the 500 row limit", async () => {
  const all = Array.from({ length: 1201 }, (_, i) => ({ id: String(i), code: String(i), name: "Registro" }));
  const read = vi.fn(async (offset: number, end: number) => all.slice(offset, end + 1));
  const result = await readFilteredCatalogRecords(read);
  expect(result).toHaveLength(1201);
  expect(read.mock.calls).toEqual([[0, 499], [500, 999], [1000, 1499]]);
  expect(result[1200]?.id).toBe("1200");
});
it("changing filters clears selected IDs and a refreshed catalog removes vanished records", async () => {
  let rows = records;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, rerender } = renderHook(({ filter }) => useCatalogSelection(["test-catalog"], filter, true, async () => rows), { initialProps: { filter: "pending" }, wrapper });
  await waitFor(() => expect(result.current.ready).toBe(true));
  act(() => result.current.selectAll(true));
  expect(result.current.records.map((r) => r.id)).toEqual(["b1"]);
  rerender({ filter: "active" });
  expect(result.current.records).toEqual([]);
  await waitFor(() => expect(result.current.ready).toBe(true));
  act(() => result.current.selectAll(true));
  rows = [];
  await act(async () => { await client.invalidateQueries({ queryKey: ["test-catalog"] }); });
  await waitFor(() => expect(result.current.ids.size).toBe(0));
});
it("does not send a second deletion while the first request is pending", async () => {
  let finish: ((value: catalog.BlockTemplateDependency[]) => void) | undefined;
  vi.mocked(catalog.deleteDayBlocks).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  show(); fireEvent.click(screen.getByRole("button", { name: "Eliminar (1)" }));
  const button = await screen.findByRole("button", { name: "Confirmar eliminación" });
  fireEvent.click(button); fireEvent.click(button);
  expect(catalog.deleteDayBlocks).toHaveBeenCalledTimes(1);
  await act(async () => { finish?.([]); });
});