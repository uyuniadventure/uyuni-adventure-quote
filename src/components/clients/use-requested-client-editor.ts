import { useCallback, useEffect, useRef } from "react";

export function useRequestedClientEditor<T>({
  requestedId,
  requestedClient,
  open,
  setOpen,
  clearRequestedId,
}: {
  requestedId: string | undefined;
  requestedClient: T | undefined;
  open: T | "new" | null;
  setOpen: (client: T | "new" | null) => void;
  clearRequestedId: () => void;
}) {
  const dismissedRequestedId = useRef<string | null>(null);

  useEffect(() => {
    if (!requestedId) {
      dismissedRequestedId.current = null;
      return;
    }
    if (!open && requestedClient && dismissedRequestedId.current !== requestedId) setOpen(requestedClient);
  }, [open, requestedClient, requestedId, setOpen]);

  return useCallback(() => {
    dismissedRequestedId.current = requestedId ?? null;
    setOpen(null);
    if (requestedId) clearRequestedId();
  }, [clearRequestedId, requestedId, setOpen]);
}
