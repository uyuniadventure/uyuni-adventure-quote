import { cp, mkdir, writeFile } from "node:fs/promises";

// Only the local test project imports this bootstrap. Production is unchanged.
const target = new URL("./supabase/functions/", import.meta.url);
await cp(new URL("../../supabase/functions/", import.meta.url), target, { recursive: true });
await cp(
  new URL("./email-provider-stub.ts", import.meta.url),
  new URL("./provider-stub.ts", target),
);
await cp(
  new URL("../../supabase/functions/send-quote-email/index.ts", import.meta.url),
  new URL("./send-quote-email/handler.ts", target),
);
await writeFile(
  new URL("./send-quote-email/index.ts", target),
  'import "../provider-stub.ts";\nawait import("./handler.ts");\n',
);
await mkdir(new URL("./.local/", import.meta.url), { recursive: true });
await writeFile(
  new URL("./.local/functions.env", import.meta.url),
  "RESEND_API_KEY=e2e-never-a-real-key\nRESEND_FROM=Uyuni E2E <sender@example.invalid>\n",
);
