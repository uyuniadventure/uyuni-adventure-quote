import { db, unwrap } from "../db";
/** Hotel codes are the client-owned identities; suppliers remain independent. */
export async function listHotels() {
  const [suppliers, codes] = await Promise.all([
    db.from("suppliers").select("*").order("name").then(unwrap),
    db.from("hotel_codes").select("*").then(unwrap),
  ]);
  return codes.map((hotel) => {
    const supplier = suppliers.find((s) => s.id === hotel.supplier_id);
    return {
      ...hotel,
      label: [hotel.name, hotel.code, supplier?.name].filter(Boolean).join(" · "),
      code_pending: !hotel.code,
    };
  });
}
export async function eligibleHotelRooms(blockId: string) {
  const block = unwrap(await db.from("day_blocks").select("*").eq("id", blockId).single());
  if (!block.hotel_id) return [];
  const hotel = unwrap(
    await db.from("hotel_codes").select("supplier_id").eq("id", block.hotel_id).single(),
  );
  if (!hotel.supplier_id) return [];
  const [rooms, links] = await Promise.all([
    db
      .from("services")
      .select("*")
      .eq("supplier_id", hotel.supplier_id)
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
