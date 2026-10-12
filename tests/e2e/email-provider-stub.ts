// This file runs ONLY in the isolated Supabase project's edge runtime.
// Auth, Storage, outbox RPCs and transitions execute the production handler.
const networkFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url === "https://api.resend.com/emails") {
    const body = await request.json();
    if (!body.to?.every((to: string) => to.endsWith("@example.invalid")))
      throw new Error("E2E refuses non-test recipients");
    if (body.attachments?.length !== 1 || !atob(body.attachments[0].content).startsWith("%PDF-"))
      throw new Error("Expected an actual PDF attachment");
    const id = request.headers.get("Idempotency-Key");
    if (!id) throw new Error("Missing email idempotency key");
    return Response.json({ id: `e2e-mock-${id}` });
  }
  const host = new URL(request.url).hostname;
  if (
    ![
      "kong",
      "supabase_kong_uyuni-quote-e2e",
      "127.0.0.1",
      "localhost",
      "host.docker.internal",
    ].includes(host)
  )
    throw new Error(`E2E refuses external network: ${host}`);
  return networkFetch(request);
};
