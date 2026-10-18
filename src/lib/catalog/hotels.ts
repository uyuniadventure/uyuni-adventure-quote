import { db, unwrap } from "../db";
/** Supplier is the hotel identity. Codes are labels, never invented identities. */
export async function listHotels() {
  const [suppliers, services, codes] = await Promise.all([
    db.from("suppliers").select("*").order("name").then(unwrap),
    db.from("services").select("*").eq("type", "alojamiento").eq("pricing_unit", "per_room").then(unwrap),
    db.from("hotel_codes").select("*").then(unwrap),
  ]);
  return suppliers
    .filter((s) => services.some((r) => r.supplier_id === s.id))
    .map((s) => {
      const labels = codes
        .filter((c) => c.supplier_id === s.id)
        .map((c) => c.code)
        .sort();
      return {
        ...s,
        codes: labels,
        label: [s.name, ...labels].join(" · "),
        code_pending: !labels.length,
      };
    });
}
export async function eligibleHotelRooms(blockId: string) {
  const block = unwrap(await db.from("day_blocks").select("*").eq("id", blockId).single());
  if (!block.hotel_id) return [];
  const [rooms, links] = await Promise.all([
    db
      .from("services")
      .select("*")
      .eq("supplier_id", block.hotel_id)
      .eq("type", "alojamiento").eq("pricing_unit", "per_room")
      .order("sku")
      .then(unwrap),
    db
      .from("day_block_items")
      .select("*")
      .eq("block_id", blockId)
      .eq("slot_key", "ALOJAMIENTO")
      .then(unwrap),
  ]);
  const anchor = rooms.find((r) => links.some((l) => l.service_id === r.id));
  return rooms.filter(
    (r) => !anchor || (r.location === anchor.location && r.meal_plan === anchor.meal_plan),
  );
}
export async function createLocation(code: string, name: string, country: string) {
  return unwrap(await db.rpc("create_location", { code, name, country }));
}
