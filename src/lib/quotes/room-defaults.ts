import { occupancyType, resolveRooming } from '../pricing/config';
import type { Rooming } from '../pricing';
import type { QuoteItemInput } from './index';

/** Choose room types within the block's hotel, once when copying the catalog.
 * Quantities still come from rooming; later calculations keep manual selections. */
export function initialRoomAlternatives<T extends QuoteItemInput>(
  items: T[], rooming: Rooming, pax: number, tc: number, date: string,
): T[] {
  const resolved = resolveRooming(rooming,pax,tc).rooming;
  const rooms = items.filter(i=>i.slot_key==='ALOJAMIENTO' && i.pricing_unit==='per_room');
  if (!rooms.length) return items;
  const data = (i:T) => i.pricing_snapshot as unknown as {
    room_type?: string; pricing_config?: {room_type?:string};
    rates?: {valid_from:string|null;valid_to:string|null;price_net:number|null;price_rack?:number|null}[];
  };
  const type = (i:T) => occupancyType(data(i).pricing_config?.room_type ?? data(i).room_type);
  const generic = rooms.find(i=>i.is_default && !type(i));
  const chosen = new Set<T>();
  if (generic) chosen.add(generic);
  else {
    const requested = new Set([...Object.keys(resolved.paying), ...Object.keys(resolved.tc)]
      .filter(t=>(resolved.paying[t] ?? 0)+(resolved.tc[t] ?? 0)>0).map(t=>occupancyType(t) ?? t));
    for (const t of requested) {
      const candidates=rooms.filter(i=>type(i)===t);
      const valid=candidates.filter(i=>data(i).rates?.some(r=>(!r.valid_from || r.valid_from<=date) && (!r.valid_to || r.valid_to>=date) && (r.price_net ?? r.price_rack)!=null));
      const available=valid.length?valid:candidates;
      const candidate=available.find(i=>i.is_default) ?? available[0];
      if (candidate) chosen.add(candidate);
    }
    // A missing requested type remains a visible draft error in the pricing engine.
    if (!chosen.size) rooms.filter(i=>i.is_default).forEach(i=>chosen.add(i));
  }
  return items.map(i=>rooms.includes(i)?{...i,selected:chosen.has(i),selection_source:'auto'}:i);
}
