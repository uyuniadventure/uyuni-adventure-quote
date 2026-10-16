import {
  admin,
  authenticated,
  base64,
  must,
  resend,
  response,
  secret,
  serve,
} from "../_shared/runtime.ts";
import { prepareProposal } from "../_shared/prepare-proposal.ts";
serve(async (request) => {
  const { client } = await authenticated(request);
  const input = await request.json();
  const { quoteId } = input;
  const quote = must(
    await client
      .from("quotes")
      .select(
        "code,tour_sku,language,start_date,pax_paying,tc_count,total_price_usd,document_snapshot",
      )
      .eq("id", quoteId)
      .single(),
  );
  const language = String(quote.language).split("-")[0];
  const templates: Record<string, { subject: string; greeting: string; summary: string }> = {
    es: {
      subject: "Tu propuesta de viaje",
      greeting: "Hola",
      summary: "Adjuntamos tu programa de viaje. Quedamos disponibles para cualquier consulta.",
    },
    en: {
      subject: "Your travel proposal",
      greeting: "Hello",
      summary: "Your travel program is attached. We are happy to help with any questions.",
    },
    it: {
      subject: "La tua proposta di viaggio",
      greeting: "Ciao",
      summary:
        "In allegato trovi il programma di viaggio. Restiamo a disposizione per qualsiasi domanda.",
    },
  };
  const localized = templates[language];
  const recipient = input.recipient ?? quote.document_snapshot?.client_email;
  const subject = input.subject ?? (localized ? `${localized.subject} · ${quote.code}` : null);
  const proposal = await prepareProposal(client, quoteId, "email", quote.language);
  if (proposal?.avisos.some((a) => a.level === "error"))
    return response(
      {
        error: proposal.avisos
          .filter((a) => a.level === "error")
          .map((a) => a.message)
          .join(" "),
      },
      400,
    );
  const body =
    proposal?.html ??
    input.body ??
    (localized
      ? `${localized.greeting} ${quote.document_snapshot?.client_name ?? ""},\n\n${localized.summary}\n\n${quote.tour_sku}\n${quote.start_date} · ${quote.pax_paying} + ${quote.tc_count} TC\nUSD ${quote.total_price_usd}\n\nUyuni Adventure`
      : null);
  if (![quoteId, recipient, subject, body].every((v) => typeof v === "string" && v.length > 0))
    return response({ error: "quoteId, recipient, subject and body required" }, 400);
  const email = must(
    await client.rpc("claim_quote_email", {
      p_id: quoteId,
      p_recipient: recipient,
      p_subject: subject,
      p_body: body,
    }),
  );
  if (email.status === "enviado") return response({ id: email.id, status: email.status });
  const service = admin();
  try {
    // Download through caller RLS; no arbitrary URL fetch or cross-tenant attachment.
    const attachment = must(await client.storage.from("quote-pdfs").download(email.pdf_path));
    const receipt = await resend(
      {
        from: secret("RESEND_FROM"),
        to: [email.recipient],
        subject: email.subject,
        ...(proposal ? { html: email.body } : { text: email.body }),
        attachments: [
          {
            filename: `${quoteId}.pdf`,
            content: base64(new Uint8Array(await attachment.arrayBuffer())),
          },
        ],
      },
      email.id,
    );
    const finished = await service.rpc("finish_quote_email", {
      p_id: email.id,
      p_provider_id: receipt,
    });
    if (finished.error) throw finished.error;
    return response({ id: email.id, status: "enviado" });
  } catch (error) {
    // Keep pending: a timeout may mean Resend accepted the email. Same ID retries safely (<24h).
    const saved = await service
      .from("quote_emails")
      .update({ last_error: error instanceof Error ? error.message : "Delivery uncertain" })
      .eq("id", email.id);
    if (saved.error) console.error("Could not save email failure");
    return response(
      {
        id: email.id,
        status: "pendiente",
        error: "Delivery uncertain; retry this same payload within 23 hours.",
      },
      502,
    );
  }
});
