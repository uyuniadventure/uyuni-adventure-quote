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
vi.mock("@/lib/clients", () => ({ currentClientEmail: vi.fn().mockResolvedValue("client@example.invalid") }));
vi.mock("@/lib/quotes/document", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/document")>()),
  listDocSections: vi.fn(),
  listDocBlocks: vi.fn().mockResolvedValue([]),
  listDocLayouts: vi.fn().mockResolvedValue([]),
  renderProposal: vi.fn(),
  reorderDocSections: vi.fn().mockResolvedValue(undefined),
  updateSectionText: vi.fn().mockResolvedValue(undefined),
  setSectionOptions: vi.fn().mockResolvedValue(undefined),
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
  await screen.findByRole("link", { name: /Revisa T&C\./ });
  expect(screen.getByRole("button", { name: "Generar PDF" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Enviar por email" })).toBeDisabled();
  expect(screen.getByText("Completa estos requisitos para generar el PDF:")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Revisa T&C\./ })).toHaveAttribute("href", "#section-TYC");
});

it("ubica una única barra sticky de PDF y envío antes de la biblioteca", async () => {
  setup();
  await screen.findByText("Biblioteca");
  const actions = screen.getByLabelText("Acciones de PDF y envío");
  expect(actions).toHaveClass("sticky", "top-16");
  expect(screen.getAllByRole("button", { name: "Generar PDF" })).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Enviar por email" })).toHaveLength(1);
  expect(actions.compareDocumentPosition(screen.getByText("Biblioteca")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("enlaza requisitos de términos y validez aunque el render no incluya sectionId", async () => {
  vi.mocked(doc.renderProposal).mockResolvedValue({
    html: "",
    avisos: [
      { code: "terms_link", level: "error", message: "Falta un enlace web válido a los términos y condiciones." },
      { code: "variable_empty", level: "error", message: "Falta el valor de {{valida_hasta}}." },
    ],
    sourceHash: "rev",
    frozen: false,
  });
  setup();
  expect(await screen.findByRole("link", { name: /enlace web válido/ })).toHaveAttribute("href", "#section-TYC");
  expect(screen.getByRole("link", { name: /valida_hasta/ })).toHaveAttribute("href", "#section-VALIDEZ");
});

it("abre, enfoca y persiste las opciones exactas de T&C y validez desde los avisos", async () => {
  const ctx = proposalFixture();
  const terms = ctx.sections.find((section) => section.id === "TYC")!;
  const validity = ctx.sections.find((section) => section.id === "VALIDEZ")!;
  terms.options = { mode: "link", url: "" };
  validity.options = { valid_until: "" };
  vi.mocked(doc.listDocSections).mockResolvedValue(ctx.sections);
  vi.mocked(doc.setSectionOptions).mockImplementation(async (_quoteId, sectionId, options) => {
    ctx.sections.find((section) => section.id === sectionId)!.options = options;
    return sectionId;
  });
  vi.mocked(doc.renderProposal).mockImplementation(async () => ({
    html: "<p>Propuesta</p>",
    avisos: [
      ...(!terms.options["url"] ? [{ code: "terms_link", level: "error" as const, message: "Falta un enlace web válido a los términos y condiciones.", sectionId: "TYC" }] : []),
      ...(!validity.options["valid_until"] ? [{ code: "validity", level: "error" as const, message: "Indica hasta cuándo es válida la propuesta.", sectionId: "VALIDEZ" }] : []),
    ],
    sourceHash: "rev",
    frozen: false,
  }));
  setup();

  fireEvent.click(await screen.findByRole("link", { name: /enlace web válido/ }));
  const url = screen.getByRole("textbox", { name: "Enlace web de términos y condiciones" });
  expect(url).toHaveFocus();
  fireEvent.change(url, { target: { value: "https://uyuniadventure.com/es/terminos-y-condiciones/" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar opciones" }));
  await waitFor(() => expect(doc.setSectionOptions).toHaveBeenCalledWith("quote", "TYC", expect.objectContaining({ url: "https://uyuniadventure.com/es/terminos-y-condiciones/" })));

  fireEvent.click(await screen.findByRole("link", { name: /Indica hasta cuándo/ }));
  const date = screen.getByLabelText("Propuesta válida hasta (fecha y hora)");
  expect(date).toHaveFocus();
  fireEvent.change(date, { target: { value: "2026-12-20T18:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar opciones" }));
  await waitFor(() => expect(doc.setSectionOptions).toHaveBeenCalledWith("quote", "VALIDEZ", expect.objectContaining({ valid_until: "2026-12-20T18:00" })));
  await waitFor(() => expect(screen.queryByText("Completa estos requisitos para generar el PDF:")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Generar PDF" })).toBeEnabled();

  fireEvent.click(within(document.getElementById("section-TYC")!).getByRole("button", { name: "Opciones" }));
  expect(screen.getByRole("textbox", { name: "Enlace web de términos y condiciones" })).toHaveValue("https://uyuniadventure.com/es/terminos-y-condiciones/");
});

it("mantiene bloqueado el guardado ante URL HTTPS o fecha inválidas", async () => {
  const ctx = proposalFixture();
  ctx.sections.find((section) => section.id === "TYC")!.options = { mode: "link", url: "" };
  vi.mocked(doc.listDocSections).mockResolvedValue(ctx.sections);
  setup();
  fireEvent.click(within(await screen.findByText("TYC").then((node) => node.closest("#section-TYC") as HTMLElement)).getByRole("button", { name: "Opciones" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Enlace web de términos y condiciones" }), { target: { value: "http://uyuniadventure.com/terminos" } });
  expect(screen.getByText("Ingresa una URL HTTPS válida.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Guardar opciones" })).toBeDisabled();
});
