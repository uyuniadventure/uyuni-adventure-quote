// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadQuote: vi.fn(),
  sections: vi.fn(),
  render: vi.fn(),
  upload: vi.fn(),
  signed: vi.fn(),
  rpc: vi.fn(),
  toBlob: vi.fn(),
}));

vi.mock("@react-pdf/renderer", async (original) => ({
  ...(await original<typeof import("@react-pdf/renderer")>()),
  pdf: () => ({ toBlob: mocks.toBlob }),
}));
vi.mock("../quotes", async (original) => ({
  ...(await original<typeof import("../quotes")>()),
  loadQuote: mocks.loadQuote,
  unreviewedDaysMessage: () => null,
}));
vi.mock("../quotes/document", () => ({
  listDocSections: mocks.sections,
  renderProposal: mocks.render,
}));
vi.mock("../db", () => ({
  db: {
    storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.signed }) },
    rpc: mocks.rpc,
  },
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    if (data == null) throw new Error("Record not found or inaccessible");
    return data;
  },
}));

import { generateQuotePdf } from "./index";

const quote = {
  id: "b8a970d7-9299-4562-b1b6-0eecdb522c0c",
  updated_at: "2026-10-28T12:00:00Z",
  language: "es",
  calculation: {
    status: "ok", items: [], scenarios: [], selection_issues: [],
    total_cost_usd: 2166, total_margin_usd: 834, total_price_usd: 3000,
    price_per_pax_usd: 1500, single_supplement_pp: 0,
  },
  total_cost_usd: 2166,
  total_price_usd: 3000,
};

describe("generateQuotePdf con propuesta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadQuote.mockResolvedValue({ quote: structuredClone(quote), days: [{ id: "day", snapshot: { reviewed: true } }], items: [] });
    mocks.sections.mockResolvedValue([{ id: "TYC" }, { id: "VALIDEZ" }]);
    mocks.render.mockResolvedValue({ html: "<p>Propuesta válida</p>", avisos: [], frozen: false });
    mocks.toBlob.mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
    mocks.upload.mockResolvedValue({ data: { path: "pdf" }, error: null });
    mocks.signed.mockResolvedValue({ data: { signedUrl: "https://example.invalid/pdf" }, error: null });
    // This is the real successful shape of an RPC declared RETURNS void.
    mocks.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("genera, guarda y devuelve el PDF aunque save_quote_pdf retorne data null", async () => {
    const result = await generateQuotePdf(quote.id);
    expect(result).toBeInstanceOf(Blob);
    expect(mocks.rpc).toHaveBeenCalledWith("save_quote_pdf", expect.objectContaining({ p_id: quote.id }));
    expect((await mocks.loadQuote.mock.results[0]!.value).quote).toMatchObject({ total_cost_usd: 2166, total_price_usd: 3000 });
  });

  it.each([
    ["Record not found or inaccessible", "Verifica que exista y que tengas permiso"],
    ["permission denied for table quotes", "Verifica que exista y que tengas permiso"],
  ])("explica cotización inexistente o inaccesible: %s", async (cause, expected) => {
    mocks.loadQuote.mockRejectedValue(new Error(cause));
    await expect(generateQuotePdf(quote.id)).rejects.toThrow(expected);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("identifica un fallo al recuperar las secciones", async () => {
    mocks.sections.mockRejectedValue(new Error("permission denied for quote_doc_sections"));
    await expect(generateQuotePdf(quote.id)).rejects.toThrow("No se pudieron recuperar las secciones de la propuesta");
  });

  it("mantiene los bloqueos documentales de T&C y validez", async () => {
    mocks.render.mockResolvedValue({
      html: "",
      avisos: [
        { level: "error", message: "Falta un enlace web válido a los términos y condiciones." },
        { level: "error", message: "Indica hasta cuándo es válida la propuesta." },
      ],
      frozen: false,
    });
    await expect(generateQuotePdf(quote.id)).rejects.toThrow("Falta un enlace web válido");
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("informa el error real del RPC sin convertir data null en un registro inexistente", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "PDF object not accessible" } });
    await expect(generateQuotePdf(quote.id)).rejects.toThrow("No se pudo asociar el PDF a la cotización. PDF object not accessible");
  });
});
