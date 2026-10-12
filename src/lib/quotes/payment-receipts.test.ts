import { beforeEach, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() }));
vi.mock("../db", () => ({
  db: { storage: { from: () => storage } },
  json: (x: unknown) => x,
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  },
}));
import { uploadPaymentReceipt, paymentReceiptUrl } from "./payments";
const quote = "73000000-0000-0000-0000-000000000001",
  payment = "73000000-0000-0000-0000-000000000002";
beforeEach(() => {
  vi.resetAllMocks();
});
it.each(["Duplicate", "ResourceAlreadyExists"])(
  "reuses an immutable receipt after an uncertain upload (%s)",
  async (code) => {
    storage.upload.mockResolvedValue({
      error: { name: "StorageApiError", code, statusCode: "400" },
    });
    const file = new File(["receipt"], "bank.pdf", { type: "application/pdf" });
    const path = await uploadPaymentReceipt(quote, payment, file);
    expect(path).toBe(`${quote}/${payment}/receipt.pdf`);
    expect(storage.upload).toHaveBeenCalledExactlyOnceWith(path, file, { upsert: false });
  },
);
it("rejects unsupported files and does not turn access failures into successful uploads", async () => {
  await expect(
    uploadPaymentReceipt(quote, payment, new File(["html"], "receipt.html", { type: "text/html" })),
  ).rejects.toThrow(/PDF/);
  expect(storage.upload).not.toHaveBeenCalled();
  storage.upload.mockResolvedValue({
    error: { name: "StorageApiError", code: "AccessDenied", message: "denied" },
  });
  await expect(
    uploadPaymentReceipt(
      quote,
      payment,
      new File(["pdf"], "receipt.pdf", { type: "application/pdf" }),
    ),
  ).rejects.toMatchObject({ code: "AccessDenied" });
  storage.createSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://example.invalid/receipt" },
    error: null,
  });
  expect(await paymentReceiptUrl("quote/payment/receipt.pdf")).toBe(
    "https://example.invalid/receipt",
  );
  expect(storage.createSignedUrl).toHaveBeenCalledWith("quote/payment/receipt.pdf", 60);
});
