import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useState } from "react";
import { useRequestedClientEditor } from "./use-requested-client-editor";

it("opens a direct client once and does not reopen while its URL parameter is being cleared", () => {
  const clearRequestedId = vi.fn();
  const client = { id: "client-1" };
  const { result, rerender } = renderHook(
    ({ requestedId }: { requestedId: string | undefined }) => {
      const [open, setOpen] = useState<typeof client | "new" | null>(null);
      const close = useRequestedClientEditor({ requestedId, requestedClient: client, open, setOpen, clearRequestedId });
      return { open, close };
    },
    { initialProps: { requestedId: "client-1" as string | undefined } },
  );
  expect(result.current.open).toEqual(client);
  act(() => result.current.close());
  expect(result.current.open).toBeNull();
  expect(clearRequestedId).toHaveBeenCalledOnce();
  rerender({ requestedId: "client-1" });
  expect(result.current.open).toBeNull();
  rerender({ requestedId: undefined });
  rerender({ requestedId: "client-1" });
  expect(result.current.open).toEqual(client);
});
