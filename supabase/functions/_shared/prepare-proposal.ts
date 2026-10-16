import { admin, must, base64, type authenticated } from "./runtime.ts";
import { renderProposalContent, type ProposalContext } from "./proposal.ts";

type Client = Awaited<ReturnType<typeof authenticated>>["client"];
/** Authoritative preparation: ownership under caller RLS; only the Edge service can store HTML. */
export async function prepareProposal(
  client: Client,
  quoteId: string,
  target: "pdf" | "email",
  lang?: string,
) {
  const ctx = must(
    await client.rpc("quote_proposal_context", { p_id: quoteId }),
  ) as ProposalContext;
  if (!ctx.sections.length) return null; // Existing proposals keep the legacy delivery contract.
  if (!ctx.frozen) {
    const ids = [
      ...new Set(
        ctx.sections
          .filter((s) => !s.hidden)
          .flatMap((s) =>
            Array.isArray(s.options["media_ids"])
              ? s.options["media_ids"].filter((id): id is string => typeof id === "string")
              : [],
          ),
      ),
    ];
    if (ids.length > 10) throw new Error("La propuesta admite hasta 10 imágenes de Media.");
    ctx.media = {};
    let totalBytes = 0;
    if (ids.length) {
      const rows = must(await client.from("media").select("id,storage_path").in("id", ids));
      for (const row of rows) {
        if (!/^(places|hotels)\//.test(row.storage_path)) continue;
        const downloaded = await client.storage.from("media").download(row.storage_path);
        if (downloaded.error || !downloaded.data) continue;
        const file = downloaded.data;
        totalBytes += file.size;
        if (totalBytes > 4000000)
          throw new Error("Las imágenes superan 4 MB. Elige imágenes más pequeñas en Media.");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mime =
          bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
            ? "image/png"
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
              ? "image/jpeg"
              : null;
        if (mime)
          ctx.media[row.id] = {
            data: `data:${mime};base64,${base64(bytes)}`,
            label: "Uyuni Adventure",
          };
      }
    }
  }
  const rendered = renderProposalContent(ctx, { target, lang: lang ?? ctx.quote.language });
  if (!rendered.frozen && !rendered.avisos.some((a) => a.level === "error"))
    must(
      await admin()
        .rpc("store_rendered_proposal", {
          p_id: quoteId,
          p_hash: ctx.source_hash,
          p_lang: lang ?? ctx.quote.language,
          p_html: rendered.html,
        })
        .then((r) => ({ ...r, data: r.error ? null : true })),
    );
  return rendered;
}
