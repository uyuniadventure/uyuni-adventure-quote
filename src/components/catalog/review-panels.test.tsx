import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { approveImportReviewItems } from "@/lib/catalog";
import { PendingServicesPanel } from "./review-panels";

const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: database }));
vi.mock("@/lib/catalog", () => ({ approveImportReviewItems: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => ({ user: { id: "admin" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const approve = vi.mocked(approveImportReviewItems);

beforeEach(() => {
  approve.mockReset();
  approve.mockResolvedValue({
    approved: 1,
    pending: 0,
  });
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn().mockResolvedValue({
      data: [
        {
          id: "service-1",
          sku: "INC",
          name: "Incompleto",
          type: "extra",
          country: null,
          currency: null,
          pricing_unit: null,
          created_at: "2026-10-26T00:00:00Z",
          import_issues: "Revisar",
          suppliers: null,
        },
      ],
      error: null,
    }),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  database.from.mockReset().mockReturnValue(chain);
});

afterEach(cleanup);

it("aprueba desde el panel mediante la RPC compartida, no con un update directo", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PendingServicesPanel onOpenService={vi.fn()} />
    </QueryClientProvider>,
  );

  fireEvent.click(await screen.findByRole("button", { name: "Aprobar" }));
  await waitFor(() =>
    expect(approve).toHaveBeenCalledWith("services", ["service-1"]),
  );
});
