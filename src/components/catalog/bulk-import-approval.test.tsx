import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reviewImport, type ImportApprovalResult } from "@/lib/import-review";
import { BulkImportApproval } from "./bulk-import-approval";

const auth = vi.hoisted(() => ({ role: "admin" }));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => auth }));
vi.mock("@/lib/import-review", () => ({ reviewImport: vi.fn() }));
const review = vi.mocked(reviewImport);
const preview: ImportApprovalResult = {
  dry_run: true,
  accept_warnings: false,
  review_date: "2026-10-11",
  fingerprint: "catalog-snapshot",
  services: {
    pending: 2,
    eligible: 2,
    remaining: 0,
    items: [
      { id: "20000000-0000-0000-0000-000000000001", code: "VALID", name: "Válido", reasons: [] },
      {
        id: "20000000-0000-0000-0000-000000000002",
        code: "PENDING",
        name: "Pendiente",
        reasons: ["Sin unidad de cobro."],
      },
    ],
  },
  templates: {
    pending: 1,
    eligible: 1,
    remaining: 0,
    items: [
      { id: "20000000-0000-0000-0000-000000000003", code: "TOUR", name: "Tour", reasons: [] },
    ],
  },
};
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <BulkImportApproval />
    </QueryClientProvider>,
  );
  return invalidate;
}
beforeEach(() => {
  auth.role = "admin";
  review.mockReset();
});
afterEach(cleanup);

describe("Aprobación masiva", () => {
  it("simulates first and only applies the reviewed fingerprint after confirmation", async () => {
    review.mockResolvedValueOnce(preview).mockResolvedValueOnce({ ...preview, dry_run: false });
    const invalidate = show();
    fireEvent.click(screen.getByRole("button", { name: "Revisar aprobación masiva" }));
    expect(await screen.findByText("Se aprobarían")).toBeInTheDocument();
    expect(screen.getByText("Se aprobará con advertencias: Sin unidad de cobro.")).toBeInTheDocument();
    expect(review.mock.calls).toEqual([[undefined, { acceptWarnings: false }]]);
    expect(invalidate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprobación" }));
    expect(await screen.findByText("Resultado de la aprobación")).toBeInTheDocument();
    expect(review.mock.calls).toEqual([[undefined, { acceptWarnings: false }], [preview.fingerprint, { acceptWarnings: false }]]);
    expect(screen.queryByRole("button", { name: "Confirmar aprobación" })).not.toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["services"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["itinerary_templates"] });
  });
  it("cancel does not approve anything and reopening makes a fresh simulation", async () => {
    review.mockResolvedValue(preview);
    show();
    fireEvent.click(screen.getByRole("button", { name: "Revisar aprobación masiva" }));
    await screen.findByText("Se aprobarían");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Revisar aprobación masiva" }));
    await waitFor(() => expect(review.mock.calls).toEqual([[undefined, { acceptWarnings: false }], [undefined, { acceptWarnings: false }]]));
  });
  it("clears a rejected preview and requires another simulation", async () => {
    review
      .mockResolvedValueOnce(preview)
      .mockRejectedValueOnce(new Error("El catálogo cambió. Vuelve a simular."));
    show();
    fireEvent.click(screen.getByRole("button", { name: "Revisar aprobación masiva" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar aprobación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El catálogo cambió");
    expect(screen.queryByRole("button", { name: "Confirmar aprobación" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver a simular" })).toBeInTheDocument();
  });
  it.each(["vendedor", "operacion"])("does not offer bulk approval to %s", (role) => {
    auth.role = role;
    show();
    expect(
      screen.queryByRole("button", { name: "Revisar aprobación masiva" }),
    ).not.toBeInTheDocument();
    expect(review).not.toHaveBeenCalled();
  });
  it("changing warning consent discards the fingerprint and requires a matching simulation", async () => {
    review.mockResolvedValueOnce(preview).mockResolvedValueOnce({ ...preview, accept_warnings: true, fingerprint: "accepted" }).mockResolvedValueOnce({ ...preview, dry_run: false, accept_warnings: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Revisar aprobación masiva" }));
    await screen.findByRole("button", { name: "Confirmar aprobación" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Aceptar avisos de plantillas" }));
    expect(screen.queryByRole("button", { name: "Confirmar aprobación" })).toBeNull();
    expect(review).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Volver a simular" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar aprobación" }));
    await waitFor(() => expect(review).toHaveBeenLastCalledWith("accepted", { acceptWarnings: true }));
  });
});
