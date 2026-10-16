import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import * as doc from "@/lib/quotes/document";
import type { Tables } from "@/types/db";
import { proposalFixture } from "@/test/proposal-fixture";
import { ProposalBuilder } from "./proposal-builder";

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ role: "vendedor", user: { id: "seller" } }),
  canManageCatalog: () => false,
}));
vi.mock("@/lib/quotes/document", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/document")>()),
  listDocSections: vi.fn(),
  listDocBlocks: vi.fn().mockResolvedValue([]),
  listDocLayouts: vi.fn().mockResolvedValue([]),
  renderProposal: vi.fn(),
  reorderDocSections: vi.fn().mockResolvedValue(undefined),
  updateSectionText: vi.fn().mockResolvedValue(undefined),
  ensureDocSections: vi.fn().mockResolvedValue(undefined),
}));
beforeEach(() => {
  vi.mocked(doc.listDocSections).mockResolvedValue(proposalFixture().sections);
  vi.mocked(doc.renderProposal).mockResolvedValue({
    html: "<p>Propuesta</p>",
    avisos: [],
    sourceHash: "rev",
    frozen: false,
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function setup() {
  const ctx = proposalFixture();
  const actions = {
    busy: false,
    act: vi.fn(async (fn: () => Promise<unknown>) => {
      await fn();
      return true;
    }),
    result: null,
    calcError: null,
  };
  const quote = {
    ...ctx.quote,
    status: "borrador",
    archived_at: null,
    updated_at: "revision",
    document_snapshot: { ...ctx.quote.document_snapshot, client_email: "client@example.invalid" },
  } as unknown as Tables<"quotes">;
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ProposalBuilder
        quote={quote}
        actions={actions}
        days={ctx.days as unknown as Tables<"quote_days">[]}
      />
    </QueryClientProvider>,
  );
  return actions;
}
it("permite editar T&C al vendedor y mantiene ocultar y quitar bloqueados", async () => {
  setup();
  await screen.findByText("TYC");
  const card = document.getElementById("section-TYC")!;
  expect(within(card).getByRole("button", { name: "Ocultar" })).toBeDisabled();
  expect(within(card).getByRole("button", { name: "Quitar" })).toBeDisabled();
  fireEvent.click(within(card).getByRole("button", { name: "Editar texto" }));
  const editor = screen.getByRole("textbox", { name: "Contenido del bloque" });
  expect(editor).toHaveAttribute("contenteditable", "true");
  editor.innerHTML = "<p>Condiciones nuevas</p>";
  fireEvent.click(screen.getByRole("button", { name: "Guardar y marcar revisado" }));
  await waitFor(() =>
    expect(doc.updateSectionText).toHaveBeenCalledWith(
      "quote",
      "TYC",
      "TYC",
      "<p>Condiciones nuevas</p>",
    ),
  );
});
it("mueve Precio antes de Itinerario y actualiza la vista previa sin recalcular", async () => {
  const actions = setup();
  await screen.findByText("PRECIO");
  const card = document.getElementById("section-PRECIO")!;
  fireEvent.click(within(card).getByRole("button", { name: "Subir sección" }));
  await waitFor(() =>
    expect(doc.reorderDocSections).toHaveBeenCalledWith("quote", [
      "INTRO",
      "PRECIO",
      "ITINERARIO",
      "TYC",
      "VALIDEZ",
    ]),
  );
  expect(actions.act).toHaveBeenCalledWith(expect.any(Function), "Propuesta guardada.", false);
});
it("deshabilita PDF y correo cuando el render devuelve errores y enlaza la sección", async () => {
  vi.mocked(doc.renderProposal).mockResolvedValue({
    html: "",
    avisos: [{ code: "review", level: "error", message: "Revisa T&C.", sectionId: "TYC" }],
    sourceHash: "rev",
    frozen: false,
  });
  setup();
  await screen.findByText("Revisa T&C.");
  expect(screen.getByRole("button", { name: "Generar PDF" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Enviar por email" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Revisa T&C." })).toHaveAttribute("href", "#section-TYC");
});
