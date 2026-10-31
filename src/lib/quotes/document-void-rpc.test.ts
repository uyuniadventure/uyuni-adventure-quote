// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({
  db: { rpc },
  json: (value: unknown) => JSON.parse(JSON.stringify(value)),
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    if (data == null) throw new Error("Record not found or inaccessible");
    return data;
  },
}));

import { ensureDocSections, reorderDocSections } from "./document";

describe("document RPCs returning void", () => {
  beforeEach(() => rpc.mockReset());

  it("accepts successful null response when creating document sections", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(ensureDocSections("quote-1")).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("ensure_quote_doc_sections", {
      p_quote_id: "quote-1",
    });
  });

  it("passes an explicitly selected layout", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(ensureDocSections("quote-1", "layout-1")).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("ensure_quote_doc_sections", {
      p_quote_id: "quote-1",
      p_layout_id: "layout-1",
    });
  });

  it("accepts successful null response when reordering sections", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(reorderDocSections("quote-1", ["section-b", "section-a"])).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("reorder_quote_doc_sections", {
      p_quote_id: "quote-1",
      p_ids: ["section-b", "section-a"],
    });
  });

  it.each([
    ["ensure", () => ensureDocSections("quote-1")],
    ["reorder", () => reorderDocSections("quote-1", ["section-a"])],
  ])("propagates real Supabase errors for %s", async (_name, call) => {
    rpc.mockResolvedValue({ data: null, error: { message: "Permission denied" } });
    await expect(call()).rejects.toThrow("Permission denied");
  });
});
