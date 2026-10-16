import { z } from "zod";

const text = z.string().max(20_000);
const infoBlock = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().max(10_000),
  })
  .strict();

/** User-editable part of the quote's PDF document snapshot. */
export const documentContentPatchSchema = z
  .object({
    client_name: z.string().trim().min(1).max(200).optional(),
    introduction: text.optional(),
    guide: text.optional(),
    payment_text: text.optional(),
    cancellation: text.optional(),
    terms_url: z.string().max(2048).optional(),
    info: z.array(infoBlock).max(50).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Indica al menos un texto para guardar.");

export type DocumentContentPatch = z.infer<typeof documentContentPatchSchema>;

export { buildQuoteDocumentModel } from "../../../supabase/functions/_shared/document-model";
export type {
  DocumentContent,
  TextField,
  QuoteDocumentModel,
} from "../../../supabase/functions/_shared/document-model";
