import { db, json, unwrap } from "../db";
import type { Tables } from "../../types/db";
export async function buildSupplierPayables(
  serviceId: string,
): Promise<Tables<"ops_supplier_payables">[]> {
  return unwrap(await db.rpc("build_supplier_payables", { p_id: serviceId }));
}
export async function computeRealMargin(serviceId: string): Promise<Tables<"ops_services">> {
  return unwrap(await db.rpc("compute_real_margin", { p_id: serviceId }));
}
const messages: Record<string, string[]> = {
  es: [
    "Hola {name}, tu viaje está confirmado. ¡Bienvenido a Uyuni Adventure! Estamos a tu disposición para preparar la experiencia.",
    "Tu viaje comienza en 48 horas. Te confirmaremos el horario y punto de recogida por este medio.",
    "Tu viaje comienza mañana. Confirma tus datos de llegada; te compartiremos el formulario migratorio oficial cuando corresponda.",
    "Hola {name}, ¿cómo va todo en este primer día? Estamos disponibles para ayudarte.",
    "Gracias por viajar con Uyuni Adventure. ¿Cómo valorarías la experiencia del 1 al 5? Nos encantará recibir tus comentarios.",
  ],
  en: [
    "Hello {name}, your trip is confirmed. Welcome to Uyuni Adventure! We are here to help you prepare.",
    "Your trip starts in 48 hours. We will confirm your pickup time and location here.",
    "Your trip starts tomorrow. Please confirm your arrival details; we will share the official immigration form if needed.",
    "Hello {name}, how is your first day going? We are here to help.",
    "Thank you for travelling with Uyuni Adventure. How would you rate the experience from 1 to 5? We welcome your feedback.",
  ],
  it: [
    "Ciao {name}, il tuo viaggio è confermato. Benvenuto con Uyuni Adventure! Siamo a disposizione per i preparativi.",
    "Il viaggio inizia tra 48 ore. Ti confermeremo qui l'orario e il luogo di incontro.",
    "Il viaggio inizia domani. Conferma i dettagli di arrivo; ti invieremo il modulo ufficiale per l'immigrazione se necessario.",
    "Ciao {name}, come sta andando il primo giorno? Siamo a disposizione per aiutarti.",
    "Grazie per aver viaggiato con Uyuni Adventure. Come valuteresti l'esperienza da 1 a 5? Ci farà piacere ricevere i tuoi commenti.",
  ],
};
export async function generateCommunicationPlan(
  serviceId: string,
): Promise<Tables<"ops_communications">[]> {
  const s = unwrap(
    await db.from("ops_services").select("language,client_name").eq("id", serviceId).single(),
  );
  const localized = messages[s.language.split("-")[0] ?? ""];
  if (!localized) throw new Error(`Communication templates required for language ${s.language}`);
  return unwrap(
    await db.rpc("generate_communication_plan", {
      p_id: serviceId,
      p_messages: json(localized.map((m) => m.replace("{name}", s.client_name ?? ""))),
    }),
  );
}
