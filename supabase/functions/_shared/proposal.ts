import {
  buildQuoteDocumentModel,
  type DocumentContent,
  type DocumentDay,
  type DocumentItem,
} from "./document-model.ts";
import { escapeHtml as e, safeLink, sanitizeProposalHtml, plainText } from "./proposal-html.ts";

export const PROPOSAL_VARIABLES = [
  "cliente",
  "vendedor",
  "fecha_inicio",
  "duracion",
  "pax",
  "total",
  "por_persona",
  "deposito",
  "saldo",
  "fecha_saldo",
  "valida_hasta",
  "sku",
] as const;
export interface DocTranslation {
  lang: string;
  title: string;
  body_html: string;
  reviewed: boolean;
}
export interface DocSnapshot {
  code: string;
  kind: "static" | "dynamic";
  data_key: string | null;
  required: boolean;
  channel: string;
  translations: DocTranslation[];
}
export interface DocSection {
  id: string;
  sort: number;
  hidden: boolean;
  options: Record<string, unknown>;
  snapshot: DocSnapshot;
  title_override: string | null;
  body_override_html: string | null;
  override_lang: string | null;
  reviewed: boolean;
}
export interface ProposalQuote {
  id: string;
  language: string;
  client_type: string;
  start_date: string | null;
  pax_paying: number;
  tc_count: number;
  total_price_usd: number | null;
  price_per_pax_usd: number | null;
  balance_due_days: number;
  tour_sku: string | null;
  single_supplement_pp?: number | null;
  rooming?: unknown;
  valid_until?: string | null;
  document_snapshot: DocumentContent & { valid_until?: string };
  calculation: {
    status?: string;
    selection_issues?: string[];
    scenarios?: {
      status?: string;
      pax_paying: number;
      total_price_usd: number | null;
      price_per_pax_usd: number | null;
    }[];
  } | null;
}
export interface ProposalContext {
  quote: ProposalQuote;
  days: (DocumentDay & {
    snapshot?: { reviewed?: boolean; source_ref?: { hotel?: unknown; meals?: unknown } };
  })[];
  items: DocumentItem[];
  sections: DocSection[];
  seller: string;
  payments: {
    deposit_required_usd: number;
    deposits_usd: number;
    paid_usd: number;
    unconverted: number;
  };
  source_hash: string;
  frozen?: { html: string; lang: string; frozen_at: string } | null;
  media?: Record<string, { data: string; label: string }>;
}
export interface ProposalNotice {
  level: "error" | "warning";
  code: string;
  message: string;
  sectionId?: string;
}
export interface ProposalRender {
  html: string;
  avisos: ProposalNotice[];
  sourceHash: string;
  frozen: boolean;
}
const translations = {
  es: {
    ficha: "Tu viaje",
    itinerario: "Itinerario",
    hoteles: "Alojamientos",
    incluye: "Incluido / no incluido",
    precio: "Precio y condiciones",
    pagos: "Métodos de pago",
    extras: "Extras opcionales",
    servicios: "Servicios por día",
    validez: "Validez de la propuesta",
    day: "Día",
    start: "Inicio",
    duration: "Duración",
    pax: "Pasajeros",
    total: "Total",
    net: "Total neto agencia",
    per: "Por persona",
    deposit: "Depósito requerido",
    paid: "Depósitos registrados",
    balance: "Saldo",
    due: "Fecha del saldo",
    included: "Incluido",
    excluded: "No incluido",
    terms: "Términos y condiciones",
    valid: "Propuesta válida hasta",
    days: "días",
    tc: "acompañantes",
  },
  en: {
    ficha: "Your trip",
    itinerario: "Itinerary",
    hoteles: "Accommodation",
    incluye: "Included / not included",
    precio: "Price and conditions",
    pagos: "Payment methods",
    extras: "Optional extras",
    servicios: "Daily services",
    validez: "Proposal validity",
    day: "Day",
    start: "Start",
    duration: "Duration",
    pax: "Travelers",
    total: "Total",
    net: "Agency net total",
    per: "Per person",
    deposit: "Required deposit",
    paid: "Recorded deposits",
    balance: "Balance",
    due: "Balance due date",
    included: "Included",
    excluded: "Not included",
    terms: "Terms and conditions",
    valid: "Proposal valid until",
    days: "days",
    tc: "tour leaders",
  },
  it: {
    ficha: "Il tuo viaggio",
    itinerario: "Itinerario",
    hoteles: "Alloggi",
    incluye: "Incluso / non incluso",
    precio: "Prezzo e condizioni",
    pagos: "Metodi di pagamento",
    extras: "Extra facoltativi",
    servicios: "Servizi giornalieri",
    validez: "Validità della proposta",
    day: "Giorno",
    start: "Inizio",
    duration: "Durata",
    pax: "Viaggiatori",
    total: "Totale",
    net: "Totale netto agenzia",
    per: "A persona",
    deposit: "Acconto richiesto",
    paid: "Acconti registrati",
    balance: "Saldo",
    due: "Scadenza del saldo",
    included: "Incluso",
    excluded: "Non incluso",
    terms: "Termini e condizioni",
    valid: "Proposta valida fino al",
    days: "giorni",
    tc: "accompagnatori",
  },
};
const paragraph = (v: unknown) => (v ? `<p>${e(v).replace(/\r?\n/g, "<br>")}</p>` : "");
const list = (values: string[]) =>
  values.filter(Boolean).length
    ? `<ul>${values
        .filter(Boolean)
        .map((v) => `<li>${e(v)}</li>`)
        .join("")}</ul>`
    : "";

/** Closed projection: no cost, margin, adjustment, staff or contingency fields enter HTML. */
export function renderProposalContent(
  ctx: ProposalContext,
  { lang }: { target: "pdf" | "email"; lang: string },
): ProposalRender {
  if (ctx.frozen)
    return { html: ctx.frozen.html, avisos: [], sourceHash: ctx.source_hash, frozen: true };
  const avisos: ProposalNotice[] = [];
  const issue = (
    code: string,
    message: string,
    sectionId?: string,
    level: "error" | "warning" = "error",
  ) => avisos.push({ code, message, level, ...(sectionId ? { sectionId } : {}) });
  const labels = translations[lang as keyof typeof translations];
  if (!labels) {
    issue("language", "El documento solo admite ES, EN o IT.");
    return { html: "", avisos, sourceHash: ctx.source_hash, frozen: false };
  }
  if (lang !== ctx.quote.language)
    issue("language", "El idioma debe coincidir con el de la cotización.");
  const q = ctx.quote;
  const model = buildQuoteDocumentModel(
    { quote: q, days: ctx.days, items: ctx.items, content: q.document_snapshot ?? {} },
    lang,
  );
  const money = (v: number | null | undefined) => `USD ${Number(v ?? 0).toFixed(2)}`;
  const date = (v: string | null | undefined) => v ?? "";
  const due = q.start_date ? new Date(`${q.start_date}T12:00:00Z`) : null;
  if (due && !Number.isNaN(due.getTime())) due.setUTCDate(due.getUTCDate() - q.balance_due_days);
  const valid = String(
    ctx.sections.find((s) => s.snapshot.data_key === "validez")?.options["valid_until"] ??
      q.valid_until ??
      q.document_snapshot?.valid_until ??
      "",
  );
  const variables: Record<string, string> = {
    cliente: model.document.client_name,
    vendedor: ctx.seller,
    fecha_inicio: date(q.start_date),
    duracion: String(model.days.length),
    pax: String(q.pax_paying),
    total: money(q.total_price_usd),
    por_persona: money(q.price_per_pax_usd),
    deposito: money(ctx.payments.deposit_required_usd),
    saldo: money(Math.max(0, (q.total_price_usd ?? 0) - ctx.payments.paid_usd)),
    fecha_saldo: due && !Number.isNaN(due.getTime()) ? due.toISOString().slice(0, 10) : "",
    valida_hasta: valid,
    sku: q.tour_sku ?? "",
  };
  if (!model.document.client_name) issue("client", "Falta el nombre del cliente.");
  if (q.total_price_usd === null || !q.calculation)
    issue("total", "Guarda el cálculo de la cotización antes de generar la propuesta.");
  if (q.calculation?.status === "error")
    issue("calculation", "El cálculo guardado tiene errores. Revisa la cotización.");
  for (const message of q.calculation?.selection_issues ?? [])
    issue("selection", message);
  const pending = ctx.days.filter((d) => d.snapshot?.reviewed !== true);
  if (pending.length)
    issue(
      "days_review",
      `Faltan revisar los textos de los días ${pending.map((d) => d.day_number).join(", ")} (idioma ${lang.toUpperCase()}).`,
    );
  if (ctx.payments.unconverted)
    issue("payments", "Hay pagos sin conversión a USD. Revisa los pagos.");
  for (const code of ["ITINERARIO", "PRECIO", "TYC"])
    if (!ctx.sections.some((s) => s.snapshot.code === code && !s.hidden))
      issue("required", `Falta la sección obligatoria ${code}.`);
  // T12 TODO: complete tariff coverage, occupancy, capacity, document-wide language and price-grid validations.
  // T11 TODO: richer commercial summary, optional extra prices and cancellation/payment schedules.
  const replaceVariables = (html: string, id: string) =>
    html.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, key: string) => {
      if (!PROPOSAL_VARIABLES.includes(key as (typeof PROPOSAL_VARIABLES)[number])) {
        issue("variable", `Variable desconocida: {{${key}}}.`, id);
        return "";
      }
      if (!variables[key]) issue("variable_empty", `Falta el valor de {{${key}}}.`, id);
      return e(variables[key]);
    });
  const table = (rows: string[][]) =>
    `<table><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${e(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const roomingText = (value: unknown): string => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    const record = value as Record<string, unknown>;
    const parts = Object.entries(record)
      .filter(
        ([key, count]) =>
          ["SGL", "DBL", "DBL_TWN", "DBL_MAT", "TWN", "MAT", "TPL", "QUAD", "SUITE"].includes(
            key,
          ) &&
          typeof count === "number" &&
          count > 0,
      )
      .map(([key, count]) => `${count} ${key}`);
    return [...parts, ...["paying", "tc"].map((key) => roomingText(record[key]))]
      .filter(Boolean)
      .join(" + ");
  };
  const servicesFor = (dayId: string, included: boolean) =>
    model.services
      .filter(
        (v) =>
          v.day_id === dayId &&
          ctx.items.some((i) => i.id === v.item_id && i.included === included),
      )
      .map((v) => v.label);
  const pieces = [...ctx.sections]
    .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
    .filter((s) => !s.hidden)
    .map((s) => {
      const b = s.snapshot;
      if (b.channel !== "all" && b.channel !== q.client_type.toLowerCase()) {
        issue("channel", "Este bloque no corresponde al canal de la cotización.", s.id);
        return "";
      }
      let title = "",
        body = "";
      if (b.kind === "static") {
        const tr = b.translations.find((t) => t.lang === lang);
        const overridden = s.override_lang === lang && s.body_override_html !== null;
        title = overridden ? (s.title_override ?? tr?.title ?? "") : (tr?.title ?? "");
        const text = overridden ? (s.body_override_html ?? "") : (tr?.body_html ?? "");
        const mode =
          b.code === "TYC"
            ? String(s.options["mode"] ?? (q.client_type === "B2C" ? "link" : "full"))
            : "full";
        if (!["full", "link", "both"].includes(mode))
          issue("terms_mode", "Elige enlace, texto completo o ambos para T&C.", s.id);
        if (mode !== "link") {
          if (!(overridden ? s.reviewed : tr?.reviewed))
            issue("review", `Revisa ${title || b.code} en ${lang.toUpperCase()}.`, s.id);
          body = sanitizeProposalHtml(replaceVariables(text, s.id));
          if (!plainText(body))
            issue("empty", `Falta el texto de ${title || b.code} en ${lang.toUpperCase()}.`, s.id);
        }
        if (b.code === "TYC" && mode !== "full") {
          const url = safeLink(String(s.options["url"] ?? ""));
          if (!url || !/^https?:/i.test(url))
            issue("terms_link", "Falta un enlace web válido a los términos y condiciones.", s.id);
          else body += `<p><a href="${e(url)}">${e(labels.terms)}</a></p>`;
        }
        title = plainText(replaceVariables(e(title), s.id));
      } else {
        title = labels[b.data_key as keyof typeof labels] ?? b.code;
        switch (b.data_key) {
          case "ficha":
            body =
              table([
                [labels.start, variables["fecha_inicio"]!],
                [labels.duration, `${model.days.length} ${labels.days}`],
                [labels.pax, `${q.pax_paying} + ${q.tc_count} ${labels.tc}`],
              ]) + paragraph(model.document.guide);
            break;
          case "itinerario":
            if (!model.days.length) issue("days", "El itinerario está vacío.", s.id);
            body = model.days
              .map(
                (d) =>
                  `<h3>${e(labels.day)} ${d.day_number} · ${e(d.title.value)}</h3>${paragraph(d.description.value)}${s.options["accommodation"] === false ? "" : paragraph(d.accommodation_text.value)}${s.options["meals"] === false ? "" : paragraph(d.meals.value.join(", "))}${paragraph(d.transport_text.value)}${paragraph(d.client_note.value)}`,
              )
              .join("");
            break;
          case "hoteles":
            body = table(
              model.days.flatMap((d) => {
                const hotels = ctx.items.filter(
                  (i) => i.quote_day_id === d.id && i.type === "alojamiento" && i.included,
                );
                return hotels.length
                  ? hotels.map((h) => [
                      `${labels.day} ${d.day_number}`,
                      model.services.find((v) => v.item_id === h.id)?.label ?? "",
                      h.check_in ?? d.date ?? "",
                      h.check_out ?? "",
                      h.meal_plan ?? "",
                      roomingText(h.room_distribution ?? q.rooming),
                    ])
                  : d.accommodation_text.value
                    ? [[`${labels.day} ${d.day_number}`, d.accommodation_text.value]]
                    : [];
              }),
            );
            break;
          case "incluye":
            body =
              `<h3>${e(labels.included)}</h3>` +
              list([
                ...new Set(
                  model.days.flatMap((d) => [d.includes.value, ...servicesFor(d.id, true)]),
                ),
              ]) +
              `<h3>${e(labels.excluded)}</h3>` +
              list([
                ...new Set(
                  model.days.flatMap((d) => [d.excludes.value, ...servicesFor(d.id, false)]),
                ),
              ]);
            break;
          case "precio":
            body =
              table([
                [q.client_type === "B2B" ? labels.net : labels.total, variables["total"]!],
                ...(q.pax_paying > 1 && s.options["per_person"] !== false
                  ? [[labels.per, variables["por_persona"]!]]
                  : []),
                ...(q.single_supplement_pp
                  ? [
                      [
                        lang === "es"
                          ? "Suplemento single"
                          : lang === "it"
                            ? "Supplemento singola"
                            : "Single supplement",
                        money(q.single_supplement_pp),
                      ],
                    ]
                  : []),
                [labels.deposit, variables["deposito"]!],
                [labels.paid, money(ctx.payments.deposits_usd)],
                [labels.balance, variables["saldo"]!],
                [labels.due, variables["fecha_saldo"]!],
              ]) +
              (q.document_snapshot.text_sections_migrated
                ? ""
                : paragraph(model.document.payment_text) + paragraph(model.document.cancellation));
            if (
              q.client_type === "B2B" &&
              s.options["tiers"] === true &&
              !q.calculation?.scenarios?.length
            )
              issue("tiers", "Calcula los tramos antes de mostrar su tabla.", s.id);
            if (
              q.client_type === "B2B" &&
              s.options["tiers"] !== false &&
              q.calculation?.scenarios?.length
            ) {
              if (
                q.calculation.scenarios.some(
                  (t) =>
                    t.status === "error" ||
                    t.total_price_usd === null ||
                    t.price_per_pax_usd === null,
                )
              )
                issue("tiers", "Hay tramos guardados sin precio válido.", s.id);
              body += table([
                [labels.pax, labels.total, labels.per],
                ...q.calculation.scenarios.map((t) => [
                  String(t.pax_paying),
                  money(t.total_price_usd),
                  money(t.price_per_pax_usd),
                ]),
              ]);
            }
            break;
          case "pagos":
            body = model.document.banks
              .map((b) =>
                paragraph(
                  [
                    b.entity,
                    b.bank_name,
                    b.account_holder,
                    b.account_number,
                    b.currency,
                    b.iban,
                    b.swift,
                    b.routing_number,
                    b.instructions,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                ),
              )
              .join("");
            if (model.document.eur_payment_url && safeLink(model.document.eur_payment_url))
              body += `<p><a href="${e(model.document.eur_payment_url)}">${e(labels.pagos)}</a></p>`;
            break;
          case "extras":
            body = list(
              model.services
                .filter((v) =>
                  ctx.items.some(
                    (i) =>
                      i.id === v.item_id &&
                      !i.included &&
                      (i.pricing_snapshot as { is_optional?: boolean })?.is_optional,
                  ),
                )
                .map((v) => v.label),
            );
            break;
          case "servicios":
            if (q.client_type !== "B2B")
              issue("channel", "Los servicios diarios solo corresponden a B2B.", s.id);
            else
              body = model.days
                .map(
                  (d) =>
                    `<h3>${e(labels.day)} ${d.day_number}</h3>` +
                    list(
                      model.services
                        .filter(
                          (v) =>
                            v.day_id === d.id &&
                            ctx.items.some((i) => i.id === v.item_id && i.included),
                        )
                        .map((v) => v.label),
                    ),
                )
                .join("");
            break;
          case "validez":
            if (!valid) issue("validity", "Indica hasta cuándo es válida la propuesta.", s.id);
            body = paragraph(`${labels.valid} ${valid}`);
            break;
          default:
            issue("data_key", "Bloque de datos desconocido.", s.id);
        }
      }
      const photoIds = Array.isArray(s.options["media_ids"])
        ? (s.options["media_ids"] as string[])
        : [];
      for (const id of photoIds) {
        const photo = ctx.media?.[id];
        if (!photo || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(photo.data))
          issue("media", "No se pudo cargar una imagen de Media. Vuelve a seleccionarla.", s.id);
        else body += `<p><img src="${photo.data}" alt="${e(photo.label)}"></p>`;
      }
      return `<h2>${e(title)}</h2>${body}`;
    });
  // Fixed renderer-owned styles keep alignment in mail clients. Editor-supplied styles were stripped above.
  const html = pieces
    .join("\n")
    .replace(
      /class="align-(left|center|right)"/g,
      (_match, alignment: string) => `class="align-${alignment}" style="text-align:${alignment}"`,
    );
  return { html, avisos, sourceHash: ctx.source_hash, frozen: false };
}
