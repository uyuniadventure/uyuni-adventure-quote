import { authenticated, response, serve } from "../_shared/runtime.ts";
import { prepareProposal } from "../_shared/prepare-proposal.ts";
serve(async (request) => {
  const { client } = await authenticated(request);
  const input = await request.json();
  if (
    typeof input.quoteId !== "string" ||
    !["pdf", "email"].includes(input.target) ||
    !["es", "en", "it"].includes(input.lang)
  )
    return response({ error: "Solicitud de propuesta inválida." }, 400);
  try {
    return response(await prepareProposal(client, input.quoteId, input.target, input.lang));
  } catch (e) {
    return response(
      { error: e instanceof Error ? e.message : "No se pudo preparar la propuesta." },
      400,
    );
  }
});
