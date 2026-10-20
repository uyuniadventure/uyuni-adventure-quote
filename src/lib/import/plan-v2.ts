import {
  diffRows,
  numberCell,
  routeFamily,
  routeOf,
  type PackageV2,
  type ImportCatalog,
  type CatalogRow,
  validatePackageV2,
} from "./package-v2";

export const importTables = [
  "location_codes",
  "suppliers",
  "services",
  "service_rates",
  "day_blocks",
  "day_block_translations",
  "day_block_items",
  "doc_blocks",
  "doc_block_translations",
  "itinerary_templates",
  "template_days",
  "template_segment_items",
  "template_day_items",
  "segment_rules",
] as const;
const unit: Record<string, string> = {
  PER_PERSON: "per_person",
  PER_GROUP: "per_group",
  PER_VEHICLE: "per_vehicle",
  PER_ROOM_PER_NIGHT: "per_room",
  PER_PERSON_PER_NIGHT: "per_person",
  PER_ROOM_PER_USE: "per_room",
};
const type: Record<string, string> = {
  hotel: "alojamiento",
  hotel_extra: "extra",
  transfer: "transporte",
  transport: "transporte",
  tour: "actividad",
  meal: "comida",
  guide: "guia",
  ticket: "entrada",
  package: "paquete",
  experience: "actividad",
  camping: "alojamiento",
  flight: "vuelo",
  service: "extra",
};
const season: Record<string, string> = {
  LOW: "BAJA",
  MID: "MEDIA",
  HIGH: "ALTA",
  HOLIDAYS: "FESTIVO",
};
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
/** The imported subset is deliberately small and produces only T13-safe HTML. */
export function markdownHtml(text: string) {
  const inline = (s: string) =>
    escape(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return text
    .split(/\r?\n\s*\r?\n/)
    .filter(Boolean)
    .map((p) =>
      p.split(/\r?\n/).every((l) => l.startsWith("- "))
        ? `<ul>${p
            .split(/\r?\n/)
            .map((l) => `<li>${inline(l.slice(2))}</li>`)
            .join("")}</ul>`
        : `<p>${inline(p).replace(/\r?\n/g, "<br>")}</p>`,
    )
    .join("");
}
/** IDs resolve natural keys against the current catalogue; existing IDs survive updates. */
export function diffPackageV2(pkg: PackageV2, catalog: ImportCatalog = {}) {
  const warnings = validatePackageV2(pkg).warnings;
  const records: { table_name: string; natural_key: string; payload: CatalogRow }[] = [];
  const known: ImportCatalog = Object.fromEntries(
    Object.entries(catalog).map(([k, v]) => [k, [...v]]),
  );
  const add = (
    table_name: string,
    natural_key: string,
    fields: CatalogRow,
    match: (v: CatalogRow) => boolean,
  ) => {
    const table = (known[table_name] ??= []);
    const matches = table.filter(match);
    if (matches.length > 1)
      throw new Error(`Clave ambigua en catálogo: ${table_name} ${natural_key}`);
    const old = matches[0];
    const payload = {
      ...(table_name === "doc_block_translations"
        ? {}
        : { id: old?.["id"] ?? crypto.randomUUID() }),
      ...fields,
    };
    records.push({ table_name, natural_key, payload });
    if (!old) table.push(payload);
    return payload;
  };
  const locations = new Set<string>();
  for (const t of pkg.templates) {
    const route = routeOf(t);
    for (const [code, name] of [
      [route.slice(0, 3), t["origen"]],
      [route.slice(3, 6), t["destino"]],
    ]) {
      if (!code || locations.has(code)) continue;
      locations.add(code);
      add("location_codes", code!, { code, name: name || code }, (r) => r["code"] === code);
    }
  }
  const suppliers = new Map<string, string>();
  for (const t of pkg.tariffs) {
    const key = t["Supplier"]!.toLowerCase();
    if (suppliers.has(key)) continue;
    const row = add(
      "suppliers",
      t["Supplier"]!,
      {
        name:
          catalog["suppliers"]?.find((s) => String(s["name"]).toLowerCase() === key)?.["name"] ??
          t["Supplier"],
      },
      (s) => String(s["name"]).toLowerCase() === key,
    );
    suppliers.set(key, String(row["id"]));
  }
  const services = new Map<string, string>();
  for (const t of pkg.tariffs) {
    const row = add(
      "services",
      t["TariffCode"]!,
      {
        sku: t["TariffCode"],
        name: t["ETIQUETA"],
        supplier_id: suppliers.get(t["Supplier"]!.toLowerCase()),
        type: type[t["ServiceType"]!] ?? "extra",
        pricing_unit: unit[t["UnitType"]!],
        currency: t["Currency"],
        location: t["Location"] || null,
        country: t["Pais"] || null,
        capacity: numberCell(t["VehicleMaxPax"]),
        vehicle_max_pax: numberCell(t["VehicleMaxPax"]),
        room_type: t["RoomType"] || null,
        occupancy: numberCell(t["Occupancy"]),
        meal_plan: ["NONE", "BB", "HB", "FB"].includes(t["IncludesMeals"]!)
          ? t["IncludesMeals"]
          : null,
        source: "paquete_v2",
        notes:
          [t["Notes"], t["RoomDetail"], t["LINK TARIFARIO"]].filter(Boolean).join("\n") || null,
        multi_day_span: 1,
        status: "pendiente",
        import_v2_route: routeFamily(t),
      },
      (s) => s["sku"] === t["TariffCode"],
    );
    services.set(t["TariffCode"]!, String(row["id"]));
    const dates = {
      valid_from: t["ValidFrom"] || `${t["Year"]}-01-01`,
      valid_to: t["ValidTo"] || `${t["Year"]}-12-31`,
    };
    add(
      "service_rates",
      t["TariffCode"]!,
      {
        service_id: row["id"],
        ...dates,
        season: season[t["Season"]!] ?? (t["Season"] || "ALL"),
        pax_min: numberCell(t["PaxMin"]),
        pax_max: numberCell(t["PaxMax"]),
        price_net: numberCell(t["Price NETO"]) ?? numberCell(t["Valor RACK"]),
        price_rack: numberCell(t["Valor RACK"]),
        net_cost_missing: numberCell(t["Price NETO"]) == null,
      },
      (r) =>
        r["service_id"] === row["id"] &&
        r["valid_from"] === dates["valid_from"] &&
        r["valid_to"] === dates["valid_to"] &&
        r["season"] === (season[t["Season"]!] ?? (t["Season"] || "ALL")) &&
        (r["pax_min"] ?? null) === numberCell(t["PaxMin"]) &&
        (r["pax_max"] ?? null) === numberCell(t["PaxMax"]),
    );
  }
  const blocks = new Map<string, string>();
  for (const t of pkg.texts) {
    let id = blocks.get(t["bloque_texto_id"]!);
    if (!id) {
      id = String(
        add(
          "day_blocks",
          t["bloque_texto_id"]!,
          { code: t["bloque_texto_id"], status: "pendiente", catalog_origin: "importacion" },
          (b) => b["code"] === t["bloque_texto_id"],
        )["id"],
      );
      blocks.set(t["bloque_texto_id"]!, id);
    }
    add(
      "day_block_translations",
      `${t["bloque_texto_id"]}:${t["idioma"]}`,
      {
        block_id: id,
        lang: t["idioma"]!.toLowerCase(),
        title: t["titulo"],
        description: t["texto"],
        reviewed: false,
      },
      (r) => r["block_id"] === id && r["lang"] === t["idioma"]!.toLowerCase(),
    );
  }
  for (const b of pkg.blockItems) {
    const id = blocks.get(b["bloque_texto_id"]!)!,
      variant = b["bloque_servicios_id"]!.split("/")[1]!;
    let candidates = [pkg.tariffs.find((t) => t["TariffCode"] === b["TariffCode"])!];
    if (b["slot"] === "TRASLADO_FRONTERA") {
      const s = candidates[0]!;
      candidates = pkg.tariffs.filter(
        (t) =>
          t["Supplier"] === s["Supplier"] &&
          routeFamily(t) === routeFamily(s) &&
          t["UnitType"] === s["UnitType"],
      );
    }
    for (const t of candidates)
      add(
        "day_block_items",
        `${b["bloque_servicios_id"]}:${b["slot"]}:${t["TariffCode"]}`,
        {
          block_id: id,
          service_id: services.get(t["TariffCode"]!),
          slot_key: b["slot"],
          variant_key: variant,
          is_default: t["TariffCode"] === b["TariffCode"],
          tc_policy: b["tc_policy"] || "free",
          qty: 1,
          billing: "per_day",
          span_days: 1,
        },
        (r) =>
          r["block_id"] === id &&
          r["variant_key"] === variant &&
          r["slot_key"] === b["slot"] &&
          r["service_id"] === services.get(t["TariffCode"]!),
      );
  }
  const docs = new Map<string, string>();
  for (const p of pkg.pdf) {
    let id = docs.get(p["id"]!);
    if (!id) {
      id = String(
        add(
          "doc_blocks",
          p["id"]!,
          {
            code: p["id"],
            kind: "static",
            data_key: null,
            required: ["si", "sí", "yes"].includes(p["obligatorio"]?.toLowerCase() ?? ""),
            status: "pendiente",
            import_kind: p["tipo"],
            import_sort: Number(p["orden"] || 0),
          },
          (d) => d["code"] === p["id"],
        )["id"],
      );
      docs.set(p["id"]!, id);
    }
    add(
      "doc_block_translations",
      `${p["id"]}:${p["idioma"]}`,
      {
        block_id: id,
        lang: p["idioma"]!.toLowerCase(),
        title: p["titulo"],
        body_html: markdownHtml(p["texto"]!),
        reviewed: false,
      },
      (r) => r["block_id"] === id && r["lang"] === p["idioma"]!.toLowerCase(),
    );
  }
  const templates = new Map<string, string>();
  for (const t of pkg.templates) {
    const route = routeOf(t);
    const from = route.slice(0, 3),
      to = route.slice(3, 6);
    const row = add(
      "itinerary_templates",
      t["sku"]!,
      {
        sku: t["sku"],
        name: t["nombre"],
        route_from: from,
        route_to: to,
        days: +t["dias"]!,
        nights: +t["noches"]!,
        route_type: from === to ? "ROUNDTRIP" : "ONEWAY",
        category: t["categoria"] || "MIXTO",
        status: "pendiente",
        catalog_origin: "importacion",
        hotel_combo: t["hoteles_codigo"] || null,
        import_v2_route: route,
        import_warnings: warnings.filter((w) => w.key === t["sku"]).map((w) => w.message),
        import_includes_id: docs.get(t["bloque_incluye"]!) ?? null,
        import_excludes_id: docs.get(t["bloque_no_incluye"]!) ?? null,
      },
      (r) => r["sku"] === t["sku"],
    );
    templates.set(t["sku"]!, String(row["id"]));
  }
  for (const d of pkg["days"]) {
    const tid = templates.get(d["sku"]!)!;
    // A day without a reusable text gets its own empty block, never another day's text.
    let bid = blocks.get(d["bloque_texto_id"]!);
    if (!bid) {
      const code = `V2:${d["sku"]}:${d["dia"]}`;
      bid = String(
        add(
          "day_blocks",
          code,
          { code, status: "pendiente", catalog_origin: "importacion" },
          (r) => r["code"] === code,
        )["id"],
      );
      add(
        "day_block_translations",
        code + ":es",
        {
          block_id: bid,
          lang: "es",
          title: d["titulo"] || "Día " + d["dia"],
          description: "",
          reviewed: false,
        },
        (r) => r["block_id"] === bid && r["lang"] === "es",
      );
    }
    add(
      "template_days",
      `${d["sku"]}:${d["dia"]}`,
      {
        template_id: tid,
        day_number: +d["dia"]!,
        block_id: bid,
        variant_key: d["bloque_servicios_id"]?.split("/")[1] ?? null,
        import_title: d["titulo"] || null,
        import_lodging: d["alojamiento"] || null,
        import_meals: d["comidas"] || null,
        import_note: d["nota_dia"] || null,
      },
      (r) => r["template_id"] === tid && r["day_number"] === +d["dia"]!,
    );
  }
  for (const s of pkg.segments) {
    const tid = templates.get(s["sku"]!)!;
    add(
      "template_segment_items",
      `${s["sku"]}:${s["slot"]}:${s["dia_desde"]}`,
      {
        template_id: tid,
        slot_key: s["slot"],
        service_id: services.get(s["TariffCode"]!),
        day_from: +s["dia_desde"]!,
        day_to: +s["dia_hasta"]!,
      },
      (r) =>
        r["template_id"] === tid &&
        r["slot_key"] === s["slot"] &&
        r["day_from"] === +s["dia_desde"]!,
    );
  }
  for (const n of pkg.lodging) {
    const tid = templates.get(n["sku"]!)!;
    add(
      "template_day_items",
      `${n["sku"]}:${n["noche"]}:${n["slot"]}`,
      {
        template_id: tid,
        day_number: +n["noche"]!,
        slot_key: n["slot"],
        service_id: services.get(n["TariffCode"]!) ?? null,
        supplier_id: suppliers.get(n["proveedor"]!.toLowerCase()) ?? null,
        tc_policy: n["tc_policy"] || "free",
        is_default: true,
        sort: n["slot"] === "ALOJAMIENTO" ? 0 : n["slot"] === "CENA" ? 1 : 2,
      },
      (r) =>
        r["template_id"] === tid && r["day_number"] === +n["noche"]! && r["slot_key"] === n["slot"],
    );
  }
  for (const r of pkg.rules)
    add(
      "segment_rules",
      `${r["ruta"]}:${r["dias"]}:${r["slot"]}`,
      {
        route: r["ruta"],
        days: +r["dias"]!,
        slot_key: r["slot"],
        service_id: services.get(r["TariffCode"]!),
        day_from: +r["dia_desde"]!,
        day_to: +r["dia_hasta"]!,
      },
      (v) => v["route"] === r["ruta"] && v["days"] === +r["dias"]! && v["slot_key"] === r["slot"],
    );
  return diffRows(records, catalog);
}
