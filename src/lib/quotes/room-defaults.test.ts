import { expect,it } from 'vitest';
import { initialRoomAlternatives } from './room-defaults';
import type { QuoteItemInput } from './index';
const room=(type:string,isDefault:boolean,year=2026):QuoteItemInput=>({
 service_id:crypto.randomUUID(),description:type,type:'alojamiento',pricing_unit:'per_room',currency:'USD',qty:1,
 unit_cost_original:0,unit_cost_usd:0,slot_key:'ALOJAMIENTO',is_default:isDefault,selected:isDefault,
 pricing_snapshot:{room_type:type,rates:[{valid_from:`${year}-01-01`,valid_to:`${year}-12-31`,price_net:10}]},
});
const empty={paying:{},tc:{}};
it('selects DBL and the required SGL within the same hotel for odd pax',()=>{
 const result=initialRoomAlternatives([room('DBL',true),room('SGL',false)],empty,3,0,'2026-11-01');
 expect(result.map(i=>i.selected)).toEqual([true,true]);
});
it('keeps unused room alternatives unselected',()=>{
 const result=initialRoomAlternatives([room('DBL',true),room('SGL',false)],empty,2,0,'2026-11-01');
 expect(result.map(i=>i.selected)).toEqual([true,false]);
});
it('chooses an available year without changing the hotel or discarding TC rooming',()=>{
 const result=initialRoomAlternatives([room('DBL',true),room('DBL',false,2027),room('SGL',false,2027)],empty,2,1,'2027-11-01');
 expect(result.map(i=>i.selected)).toEqual([false,true,true]);
});
