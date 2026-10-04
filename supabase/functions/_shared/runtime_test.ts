import { authenticated, base64, resend } from "./runtime.ts";
function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}
Deno.test("rejects missing authentication without network access", async () => {
  let rejected = false;
  try {
    await authenticated(new Request("https://example.invalid"));
  } catch {
    rejected = true;
  }
  assert(rejected, "Missing authentication must fail");
});
Deno.test("Resend retries preserve idempotency key and attachment bytes", async () => {
  const original = globalThis.fetch;
  const old = Deno.env.get("RESEND_API_KEY");
  Deno.env.set("RESEND_API_KEY", "test-only-placeholder");
  const requests: { key: string | null; body: unknown }[] = [];
  globalThis.fetch = (_url, options) => {
    requests.push({
      key: new Headers(options?.headers).get("Idempotency-Key"),
      body: JSON.parse(String(options?.body)),
    });
    return Promise.resolve(
      new Response(JSON.stringify({ id: "provider-receipt" }), { status: 200 }),
    );
  };
  try {
    const payload = {
      to: ["fixture@example.invalid"],
      attachments: [{ filename: "quote.pdf", content: base64(new Uint8Array([0, 127, 255])) }],
    };
    assert((await resend(payload, "same-outbox-id")) === "provider-receipt", "Provider receipt");
    await resend(payload, "same-outbox-id");
    assert(
      requests.every((x) => x.key === "same-outbox-id"),
      "Stable idempotency key",
    );
    assert(
      JSON.stringify(requests[0]?.body) === JSON.stringify(requests[1]?.body),
      "Stable payload",
    );
    assert(payload.attachments[0].content === "AH//", "Binary attachment encoding");
  } finally {
    globalThis.fetch = original;
    if (old) Deno.env.set("RESEND_API_KEY", old);
    else Deno.env.delete("RESEND_API_KEY");
  }
});
Deno.test("Resend failure never returns a success receipt", async () => {
  const original = globalThis.fetch;
  const old = Deno.env.get("RESEND_API_KEY");
  Deno.env.set("RESEND_API_KEY", "test-only-placeholder");
  globalThis.fetch = () => Promise.resolve(new Response("{}", { status: 429 }));
  try {
    let rejected = false;
    try {
      await resend({}, "test");
    } catch {
      rejected = true;
    }
    assert(rejected, "Rate limiting must preserve retryability");
  } finally {
    globalThis.fetch = original;
    if (old) Deno.env.set("RESEND_API_KEY", old);
    else Deno.env.delete("RESEND_API_KEY");
  }
});
