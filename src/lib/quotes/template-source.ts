import { db, unwrap } from "../db";

/** Read only. The commit RPC checks this complete source again under locks. */
export async function loadTemplateSource(templateId: string, clientId: string) {
  const [template, client, settings, fx, templateDays] = await Promise.all([
    db.from("itinerary_templates").select("*").eq("id", templateId).single().then(unwrap),
    db.from("clients").select("*").eq("id", clientId).single().then(unwrap),
    db.from("pricing_settings").select("*").order("id").then(unwrap),
    db.from("exchange_rates").select("*").order("id").then(unwrap),
    db.from("template_days").select("*").eq("template_id", templateId).order("id").then(unwrap),
  ]);
  if (template.status !== "activo") throw new Error("La plantilla no está aprobada");
  const ids = [...new Set(templateDays.map((d) => d.block_id))];
  const [blocks, texts, items, links] = await Promise.all([
    db.from("day_blocks").select("*").in("id", ids).order("id").then(unwrap),
    db.from("day_block_translations").select("*").in("block_id", ids).order("id").then(unwrap),
    db.from("day_block_items").select("*").in("block_id", ids).order("id").then(unwrap),
    db.from("day_block_modules").select("*").in("block_id", ids).order("id").then(unwrap),
  ]);
  const moduleIds = [...new Set(links.map((l) => l.module_id))];
  const [modules, moduleTexts, moduleItems] = await Promise.all([
    db.from("activity_modules").select("*").in("id", moduleIds).order("id").then(unwrap),
    db
      .from("activity_module_translations")
      .select("*")
      .in("module_id", moduleIds)
      .order("id")
      .then(unwrap),
    db
      .from("activity_module_items")
      .select("*")
      .in("module_id", moduleIds)
      .order("id")
      .then(unwrap),
  ]);
  const serviceIds = [
    ...new Set(
      [
        ...items.map((i) => i.service_id),
        ...moduleItems.map((i) => i.service_id),
        ...blocks.map((b) => b.hotel_service_id),
      ].filter((id): id is string => id !== null),
    ),
  ];
  const [services, rates] = await Promise.all([
    db.from("services").select("*").in("id", serviceIds).order("id").then(unwrap),
    db.from("service_rates").select("*").in("service_id", serviceIds).order("id").then(unwrap),
  ]);
  return {
    template,
    client,
    settings,
    fx,
    templateDays,
    blocks,
    texts,
    items,
    links,
    modules,
    moduleTexts,
    moduleItems,
    services,
    rates,
  };
}
export type TemplateSource = Awaited<ReturnType<typeof loadTemplateSource>>;
