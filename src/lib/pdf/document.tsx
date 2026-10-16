import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CompleteQuoteResult } from "../pricing";
import type { Tables } from "../../types/db";
import type { QuoteDocumentModel } from "../quotes/document-model";
export interface QuotePdfData {
  quote: Tables<"quotes">;
  days: Tables<"quote_days">[];
  items: Tables<"quote_items">[];
  model: QuoteDocumentModel;
  calculation: CompleteQuoteResult;
  optional_prices: Record<string, number>;
}
const labels = {
  es: {
    program: "PROGRAMA DE VIAJE",
    client: "Cliente",
    dates: "Fechas",
    pax: "Participantes",
    rooms: "Habitaciones",
    vehicles: "Vehículos",
    guide: "Guía",
    operator: "Operador",
    day: "Día",
    included: "Servicios incluidos",
    excluded: "No incluido",
    hotel: "Alojamiento",
    flights: "Vuelos internos",
    hotels: "Resumen de alojamientos",
    quote: "Cotización",
    total: "Precio total",
    per: "Por persona pagante",
    single: "Suplemento single",
    deposit: "Depósito",
    balance: "Saldo",
    due: "Fecha límite",
    payment: "Pago y cancelación",
    card: "Recargo tarjeta",
    terms: "Términos y condiciones",
    optional: "Extras opcionales",
    info: "Información práctica",
    covered: "incluido",
    scenario: "Escenarios por pasajeros",
    night: "noches",
    meals: "Comidas",
    transport: "Transporte",
    note: "Nota",
  },
  en: {
    program: "TRAVEL PROGRAM",
    client: "Client",
    dates: "Dates",
    pax: "Participants",
    rooms: "Room basis",
    vehicles: "Vehicles",
    guide: "Guiding",
    operator: "Operator",
    day: "Day",
    included: "Services included",
    excluded: "Not included",
    hotel: "Overnight",
    flights: "Domestic flights",
    hotels: "Accommodation summary",
    quote: "Quotation",
    total: "Total price",
    per: "Per paying participant",
    single: "Single supplement",
    deposit: "Deposit",
    balance: "Balance",
    due: "Due date",
    payment: "Payment and cancellation",
    card: "Card surcharge",
    terms: "Terms and conditions",
    optional: "Optional extras",
    info: "Practical information",
    covered: "included",
    scenario: "Passenger scenarios",
    night: "nights",
    meals: "Meals",
    transport: "Transport",
    note: "Note",
  },
  it: {
    program: "PROGRAMMA DI VIAGGIO",
    client: "Cliente",
    dates: "Date",
    pax: "Partecipanti",
    rooms: "Sistemazione",
    vehicles: "Veicoli",
    guide: "Guida",
    operator: "Operatore",
    day: "Giorno",
    included: "Servizi inclusi",
    excluded: "Non incluso",
    hotel: "Pernottamento",
    flights: "Voli interni",
    hotels: "Riepilogo alloggi",
    quote: "Preventivo",
    total: "Valore totale",
    per: "Quota per partecipante pagante",
    single: "Supplemento singola",
    deposit: "Acconto",
    balance: "Saldo",
    due: "Scadenza",
    payment: "Pagamento e cancellazione",
    card: "Supplemento carta",
    terms: "Termini e condizioni",
    optional: "Extra facoltativi",
    info: "Informazioni pratiche",
    covered: "incluso",
    scenario: "Scenari per partecipanti",
    night: "notti",
    meals: "Pasti",
    transport: "Trasporto",
    note: "Nota",
  },
};
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1d2941",
    lineHeight: 1.45,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#e69831",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  tag: { fontSize: 8, color: "#ac6012" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8 },
  h3: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 5 },
  row: {
    flexDirection: "row",
    backgroundColor: "#f4ecdf",
    padding: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2d7c7",
  },
  label: { width: "30%", fontFamily: "Helvetica-Bold" },
  value: { width: "70%" },
  section: {
    backgroundColor: "#1d2941",
    color: "white",
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 7,
  },
  item: {
    padding: 5,
    backgroundColor: "#faf7f2",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e9e3da",
  },
  photo: { width: "100%", height: 210, objectFit: "cover", marginVertical: 12 },
  photoRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallPhoto: { width: "48%", height: 135, objectFit: "cover" },
  footer: {
    height: 22,
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    fontSize: 8,
    color: "#756e65",
    borderTopWidth: 0.5,
    borderTopColor: "#d7c5ad",
    paddingTop: 7,
  },
  paragraph: { marginBottom: 8 },
});
function safeLink(url: string) {
  if (!/^https:\/\//i.test(url)) throw new Error("PDF links must use HTTPS");
  return url;
}
export function QuoteDocument({ data }: { data: QuotePdfData }) {
  const { quote: q, items, model, calculation: totals } = data;
  const c = model.document;
  const days = model.days;
  const itemLabels = new Map(model.services.map((service) => [service.item_id, service.label]));
  const isIncluded = (i: Tables<"quote_items">) => {
    const priced = totals.items.find((r) => r.id === i.id);
    return i.included && (!priced || priced.quantity > 0 || priced.covered);
  };
  const language = q.language.split("-")[0] as keyof typeof labels;
  const l = labels[language];
  if (!l) throw new Error(`PDF labels required for language ${q.language}`);
  const money = (n: number) =>
    new Intl.NumberFormat(q.language, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  const date = (d: string) =>
    new Intl.DateTimeFormat(q.language, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(d));
  const text = (i: Tables<"quote_items">) => {
    return itemLabels.get(i.id) ?? "";
  };
  const config = (v: unknown): string =>
    Object.entries((v ?? {}) as Record<string, unknown>)
      .map(([k, n]) =>
        typeof n === "object"
          ? config(n)
          : `${n} ${k.replace("DBL_TWN", "TWIN").replace("DBL_MAT", "DBL")}`,
      )
      .filter(Boolean)
      .join(" + ");
  const row = (title: string, value: string) => (
    <View style={styles.row}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
  const deposit = (totals.total_price_usd * q.deposit_pct) / 100;
  const due = new Date(Date.parse(q.start_date + "T00:00:00Z") - q.balance_due_days * 86400000)
    .toISOString()
    .slice(0, 10);
  return (
    <Document title={q.code} author="Uyuni Adventure — Ando Libre LLC" language={q.language}>
      <Page size="A4" style={styles.page}>
        <View fixed style={styles.footer}>
          <Text>Uyuni Adventure · Ando Libre LLC · {q.code}</Text>
        </View>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>UYUNI ADVENTURE</Text>
            <Text style={styles.tag}>{l.program}</Text>
          </View>
          <Text>{q.code}</Text>
        </View>
        <Text style={styles.title}>{q.tour_sku ?? q.code}</Text>
        {c.cover_photo && <Image src={c.cover_photo} style={styles.photo} />}
        {row(l.client, c.client_name)}
        {row(l.dates, `${date(q.start_date)} — ${date(days.at(-1)?.date ?? q.start_date)}`)}
        {row(l.pax, `${q.pax_paying} + ${q.tc_count} TC`)}
        {row(l.rooms, config(q.rooming))}
        {row(l.vehicles, config(q.vehicles))}
        {c.guide && row(l.guide, c.guide)}
        {row(l.operator, "Ando Libre LLC · Uyuni Adventure")}
        {q.client_type === "B2B" && (
          <>
            {row(l.total, money(totals.total_price_usd))}
            {row(l.per, money(totals.price_per_pax_usd))}
          </>
        )}
        {c.introduction && <Text style={styles.paragraph}>{c.introduction}</Text>}
        {days.map((d) => (
          <View key={d.id}>
            <View wrap={false}>
              <Text style={styles.h2} minPresenceAhead={65}>
                {l.day} {d.day_number} · {date(d.date ?? q.start_date)} · {d.title.value}
              </Text>
              {(d.route.value.from || d.route.value.to) && (
                <Text>
                  {d.route.value.from} — {d.route.value.to}
                </Text>
              )}
              <Text style={styles.paragraph}>{d.description.value}</Text>
              {d.accommodation_text.value && (
                <Text style={styles.paragraph}>{d.accommodation_text.value}</Text>
              )}
              {d.meals.value.length > 0 && (
                <Text style={styles.paragraph}>
                  {l.meals}: {d.meals.value.join(", ")}
                </Text>
              )}
              {d.transport_text.value && (
                <Text style={styles.paragraph}>
                  {l.transport}: {d.transport_text.value}
                </Text>
              )}
            </View>
            <Text style={styles.section} minPresenceAhead={25}>
              {l.included}
            </Text>
            {items
              .filter((i) => i.quote_day_id === d.id && isIncluded(i))
              .map((i) => (
                <Text key={i.id} style={styles.item}>
                  {text(i)}
                  {totals.items.find((x) => x.id === i.id)?.covered ? ` (${l.covered})` : ""}
                </Text>
              ))}
            {d.includes.value && <Text style={styles.item}>{d.includes.value}</Text>}
            <Text style={styles.h3}>{l.excluded}</Text>
            {items
              .filter((i) => i.quote_day_id === d.id && !i.included)
              .map((i) => (
                <Text key={i.id}>{text(i)}</Text>
              ))}
            {d.excludes.value && <Text>{d.excludes.value}</Text>}
            {d.client_note.value && (
              <Text style={styles.paragraph}>
                {l.note}: {d.client_note.value}
              </Text>
            )}
            {items
              .filter((i) => i.quote_day_id === d.id && i.type === "alojamiento" && isIncluded(i))
              .map((i) => (
                <Text key={i.id} style={styles.item}>
                  {l.hotel}: {text(i)} · {i.meal_plan ?? ""} ·{" "}
                  {config(i.room_distribution ?? q.rooming)}
                </Text>
              ))}
            {q.client_type === "B2C" && d.photos.length > 0 && (
              <View style={styles.photoRow}>
                {d.photos.slice(0, 2).map((src, n) => (
                  <Image key={n} src={src} style={styles.smallPhoto} />
                ))}
              </View>
            )}
          </View>
        ))}
        {items.some((i) => i.type === "vuelo") && (
          <>
            <Text style={styles.h2}>{l.flights}</Text>
            {items
              .filter((i) => i.type === "vuelo")
              .map((i) => (
                <Text style={styles.item} key={i.id}>
                  {i.route} · {i.airline} {i.flight_no} · {i.dep_time} — {i.arr_time} ·{" "}
                  {i.included ? l.included : l.excluded} {i.fare_notes}
                </Text>
              ))}
          </>
        )}
        {items.some((i) => i.type === "alojamiento" && isIncluded(i)) && (
          <Text style={styles.h2}>{l.hotels}</Text>
        )}
        {items
          .filter((i) => i.type === "alojamiento" && isIncluded(i))
          .map((i) => (
            <Text key={i.id} style={styles.item}>
              {text(i)} · {i.check_in ?? ""} — {i.check_out ?? ""} · {i.meal_plan ?? ""} ·{" "}
              {i.check_in && i.check_out
                ? `${Math.round((Date.parse(i.check_out) - Date.parse(i.check_in)) / 86400000)} ${l.night} · `
                : ""}
              {config(i.room_distribution ?? q.rooming)}
            </Text>
          ))}
        <View break>
          <Text style={styles.h2}>{l.quote}</Text>
          {row(l.total, money(totals.total_price_usd))}
          {row(l.per, money(totals.price_per_pax_usd))}
          {row(l.single, money(totals.single_supplement_pp))}
          {totals.scenarios.length > 0 && (
            <>
              <Text style={styles.h3}>{l.scenario}</Text>
              {totals.scenarios.map((s, n) => (
                <Text style={styles.item} key={n}>
                  {s.pax_paying} + {s.tc_count} TC · {l.total}: {money(s.total_price_usd)} · {l.per}
                  : {money(s.price_per_pax_usd)}
                </Text>
              ))}
            </>
          )}
          {Object.keys(data.optional_prices).length > 0 && (
            <>
              <Text style={styles.h3}>{l.optional}</Text>
              {items
                .filter((i) => data.optional_prices[i.id] !== undefined)
                .map((i) => (
                  <Text key={i.id}>
                    {text(i)} · {money(data.optional_prices[i.id]!)}
                  </Text>
                ))}
            </>
          )}
          <Text style={styles.h2}>{l.payment}</Text>
          {row(`${l.deposit} (${q.deposit_pct}%)`, money(deposit))}
          {row(l.balance, money(totals.total_price_usd - deposit))}
          {row(l.due, date(due))}
          {row(l.card, `${q.card_surcharge_pct}%`)}
          {c.payment_text && <Text style={styles.paragraph}>{c.payment_text}</Text>}
          {Array.isArray(q.payment_schedule) &&
            q.payment_schedule.map((entry, n) => {
              const milestone = entry as {
                date?: string;
                amount_pct?: number;
                note?: string;
                penalty?: string;
              };
              return (
                <Text key={n} style={styles.item}>
                  {milestone.date ? date(milestone.date) : ""} ·{" "}
                  {milestone.amount_pct !== undefined ? `${milestone.amount_pct}%` : ""}{" "}
                  {milestone.note ?? ""} {milestone.penalty ?? ""}
                </Text>
              );
            })}
          {c.cancellation && <Text style={styles.paragraph}>{c.cancellation}</Text>}
          {(c.banks ?? []).map((b, n) => (
            <View key={n} style={styles.item}>
              <Text>
                {b.entity} · {b.bank_name} · {b.currency}
              </Text>
              <Text>
                {b.account_holder} · {b.account_number}
              </Text>
              <Text>
                {b.swift} {b.routing_number} {b.iban}
              </Text>
              {b.instructions && <Text>{b.instructions}</Text>}
            </View>
          ))}
          {c.eur_payment_url && <Link src={safeLink(c.eur_payment_url)}>EUR</Link>}
          {c.info?.length && <Text style={styles.h2}>{l.info}</Text>}
          {c.info?.map((info, n) => (
            <View key={n}>
              <Text style={styles.h3}>{info.title}</Text>
              <Text style={styles.paragraph}>{info.content}</Text>
            </View>
          ))}
          <Text style={styles.h2}>{l.terms}</Text>
          {q.client_type === "B2B" ? (
            <Text>{c.terms}</Text>
          ) : (
            c.terms_url && <Link src={safeLink(c.terms_url)}>{l.terms}</Link>
          )}
        </View>
      </Page>
    </Document>
  );
}
