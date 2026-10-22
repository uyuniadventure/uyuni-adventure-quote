begin;
do $compatibility$
declare definition text;
begin
  definition:=replace(pg_get_functiondef('public.save_quote_calculation(uuid,timestamptz,jsonb)'::regprocedure),chr(13),'');
  if strpos(definition,'unit_cost_original=case')=0 then raise exception 'save_quote_calculation incompatible con T01h-2.';end if;
  definition:=replace(pg_get_functiondef('public.guard_quote_state()'::regprocedure),chr(13),'');
  if strpos(definition,E'begin\n')=0 then raise exception 'guard_quote_state incompatible con T01h-2.';end if;
  definition:=replace(pg_get_functiondef('public.version_quote(uuid)'::regprocedure),chr(13),'');
  if strpos(definition,'return next_id;')=0 then raise exception 'version_quote incompatible con T01h-2.';end if;
  definition:=replace(pg_get_functiondef('public.edit_quote_item(uuid,jsonb,boolean,boolean)'::regprocedure),chr(13),'');
  if strpos(definition,'set sku=old_item.sku')=0 or strpos(definition,'set pricing_unit=i.pricing_unit')=0 then
    raise exception 'edit_quote_item incompatible con T01h-2.';
  end if;
  definition:=replace(pg_get_functiondef('public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure),chr(13),'');
  if strpos(definition,'(p_result->>total_name)::numeric>=0 and')=0 then raise exception 'create_quote_from_template incompatible con T01h-2.';end if;
  definition:=replace(pg_get_functiondef('public.quote_sold_operations()'::regprocedure),chr(13),'');
  if strpos(definition,'to_jsonb(i),d.date')=0 or strpos(definition,'(r->>''quantity'')::numeric>0')=0 then
    raise exception 'quote_sold_operations incompatible con T01h-2.';
  end if;
  definition:=replace(pg_get_functiondef('public.save_quote_as_template(uuid,text,text,text,text,timestamptz,uuid,timestamptz)'::regprocedure),chr(13),'');
  if strpos(definition,'end_point,content,created_by)')=0 or strpos(definition,'pricing_config,item_snapshot)')=0 then
    raise exception 'save_quote_as_template incompatible con T01h-2.';
  end if;
  definition:=replace(pg_get_functiondef('public.edit_quote_days(uuid,text,jsonb,timestamptz,jsonb)'::regprocedure),chr(13),'');
  if strpos(definition,'default_day_position,hotel_service_id)')=0 or strpos(definition,'pricing_config,item_snapshot)')=0 then
    raise exception 'edit_quote_days incompatible con T01h-2.';
  end if;
end;
$compatibility$;

-- One JSON shape for legacy document/operation readers and the new nightly rows.
create function public.rooming_distribution(p_rows jsonb,p_night integer default null) returns jsonb
language sql immutable set search_path='' as $$
 with chosen as (
  select x from jsonb_array_elements(p_rows) x where
   case when p_night is not null and exists(select 1 from jsonb_array_elements(p_rows) r where (r->>'night')::int=p_night)
    then (x->>'night')::int=p_night else x->>'night' is null end
 ), grouped as (
  select x->>'room_type' room_type,coalesce((x->>'for_tc')::boolean,false) for_tc,sum((x->>'count')::int) qty from chosen group by 1,2
 ) select jsonb_build_object('paying',coalesce(jsonb_object_agg(room_type,qty) filter(where not for_tc),'{}'),
   'tc',coalesce(jsonb_object_agg(room_type,qty) filter(where for_tc),'{}')) from grouped;
$$;
revoke all on function public.rooming_distribution(jsonb,integer) from public,anon;
grant execute on function public.rooming_distribution(jsonb,integer) to authenticated;
-- Two-phase mutation: read proposal, calculate in src/lib, apply under revision lock.
-- SECURITY INVOKER retains the quote owner's RLS throughout.
create function public.edit_quote_selection(p_id uuid,p_operation text,p_payload jsonb,p_updated_at timestamptz default null,p_result jsonb default null)
returns jsonb language plpgsql set search_path='' as $$
declare q public.quotes; d public.quote_days; i public.quote_items; s public.services; ref public.services;
 row jsonb; requested jsonb; prepared jsonb:='[]'; dayrows jsonb; roomrows jsonb; payload_items jsonb; slot text; existing record;
begin
 select * into strict q from public.quotes where id=p_id for update;
 if q.status<>'borrador' or q.archived_at is not null then raise exception 'Solo se puede elegir en una cotización en borrador.'; end if;
 if p_updated_at is not null and p_updated_at is distinct from q.updated_at then raise exception 'La cotización cambió; vuelve a proponer.' using errcode='40001'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.day_number),'[]') into dayrows from public.quote_days x where quote_id=q.id;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]') into roomrows from public.quote_rooming x where quote_id=q.id;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]') into payload_items from public.quote_items x join public.quote_days y on y.id=x.quote_day_id where y.quote_id=q.id;
 if p_operation='rooming' then
  if jsonb_typeof(p_payload->'rows') is distinct from 'array' then raise exception 'Distribución inválida.'; end if;
  roomrows:=p_payload->'rows';
  -- Populate a typed row to reuse all CHECKs during the apply phase.
  for row in select value from jsonb_array_elements(roomrows) loop
   if jsonb_typeof(row->'count') is distinct from 'number' or (row->>'count')::numeric<>trunc((row->>'count')::numeric) or (row->>'night')::int>jsonb_array_length(dayrows) or row->>'room_type' not in ('SGL','DBL','TWN','MAT','TPL','QUAD') or (row->>'count')::int<0
    or row->>'count' is null or (row->>'night')::int<1 then raise exception 'Distribución inválida.'; end if;
  end loop;
  q.rooming:=public.rooming_distribution(roomrows);
  select coalesce(jsonb_agg(case when x->>'pricing_unit'='per_room' then x||jsonb_build_object('room_distribution',
   public.rooming_distribution(roomrows,(select (day_json->>'day_number')::int from jsonb_array_elements(dayrows) day_json where day_json->>'id'=x->>'quote_day_id'))) else x end),'[]')
   into payload_items from jsonb_array_elements(payload_items) x;
 elsif p_operation='alternatives' then
  select * into strict d from public.quote_days where id=(p_payload->>'day_id')::uuid and quote_id=q.id;
  slot:=p_payload->>'slot_key';
  select y.* into ref from public.quote_items x join public.services y on y.id=x.service_id where x.quote_day_id=d.id and x.slot_key=slot limit 1;
  if not found then raise exception 'Puesto inexistente.'; end if;
  if exists(select 1 from public.quote_items x where x.quote_day_id=d.id and x.slot_key=slot and x.day_span>1) then raise exception 'Selecciona el tramo completo antes de cambiar alternativas multi-día.'; end if;
  if jsonb_typeof(p_payload->'selections') is distinct from 'array' or jsonb_array_length(p_payload->'selections')=0 then raise exception 'Elige al menos una alternativa.'; end if;
  if (select count(distinct x->>'serviceId') from jsonb_array_elements(p_payload->'selections') x)<>jsonb_array_length(p_payload->'selections') then raise exception 'Alternativas repetidas.'; end if;
  for requested in select value from jsonb_array_elements(p_payload->'selections') loop
   if (requested->>'qty')::numeric<=0 or (requested->>'qty')::numeric>10000 or requested->>'qty' is null then raise exception 'Cantidad inválida.'; end if;
   select * into strict s from public.services where id=(requested->>'serviceId')::uuid and status in ('activo','pendiente');
   if s.type<>ref.type then raise exception 'La alternativa debe ser del mismo tipo de servicio.'; end if;
   if slot='ALOJAMIENTO' and (s.supplier_id is distinct from coalesce(
       (select h.supplier_id from public.hotel_codes h where h.id=(d.block_snapshot#>>'{block,hotel_id}')::uuid),
       ref.supplier_id)
     or s.location is distinct from ref.location or s.meal_plan is distinct from ref.meal_plan) then raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.'; end if;
  end loop;
  for row in select value from jsonb_array_elements(payload_items) loop
   if row->>'quote_day_id'=d.id::text and row->>'slot_key'=slot then
    select value into requested from jsonb_array_elements(p_payload->'selections') where value->>'serviceId'=row->>'service_id';
    row:=row||jsonb_build_object('selected',requested is not null,'selection_source','manual','qty',coalesce((requested->>'qty')::numeric,(row->>'qty')::numeric));
   end if;
   prepared:=prepared||jsonb_build_array(row);
  end loop;
  -- Outside-block alternatives are copied from the live catalog once; later prices use the snapshot.
  for requested in select value from jsonb_array_elements(p_payload->'selections') loop
   if exists(select 1 from jsonb_array_elements(prepared) x where x->>'quote_day_id'=d.id::text and x->>'slot_key'=slot and x->>'service_id'=requested->>'serviceId') then continue; end if;
   select * into strict s from public.services where id=(requested->>'serviceId')::uuid;
   select x.* into strict i from public.quote_items x where x.quote_day_id=d.id and x.slot_key=slot order by x.id limit 1;
   i.id:=(requested->>'id')::uuid;i.service_id:=s.id;i.supplier_id:=s.supplier_id;i.sku:=s.sku;i.description:=s.name;i.type:=s.type;
   i.pricing_unit:=s.pricing_unit;i.currency:=s.currency;i.qty:=(requested->>'qty')::numeric;i.qty_override:=null;
   i.selected:=true;i.selection_source:='manual';i.source_block_service_id:=null;i.price_overridden:=false;i.override_note:=null;i.adjustment_pct:=0;
   i.pricing_snapshot:=jsonb_build_object('rates',(select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') from public.service_rates r where r.service_id=s.id),
    'service',to_jsonb(s),'room_type',s.room_type,'capacity',s.capacity,'vehicle_max_pax',s.capacity,'nights',1,
    'lodging_key',i.pricing_snapshot->>'lodging_key','pricing_config','{}'::jsonb);
   prepared:=prepared||jsonb_build_array(to_jsonb(i));
  end loop;
  payload_items:=prepared;
 else raise exception 'Operación desconocida.';
 end if;
 if p_result is not null and p_payload->'expected' is distinct from jsonb_build_object('quote',to_jsonb(q),'days',dayrows,'items',payload_items,'roomingRows',roomrows) then raise exception 'La selección o el catálogo cambió; vuelve a proponer.' using errcode='40001'; end if;
 if p_result is null then return jsonb_build_object('quote',to_jsonb(q),'days',dayrows,'items',payload_items,'roomingRows',roomrows); end if;
 if p_updated_at is null then raise exception 'Falta revisión de la cotización.'; end if;
 if p_operation='rooming' then
  update public.quotes set rooming=q.rooming,pricing_config=pricing_config||jsonb_build_object('rooming_rows',roomrows) where id=q.id;
  delete from public.quote_rooming where quote_id=q.id;
  insert into public.quote_rooming(quote_id,night,room_type,count,for_tc)
   select q.id,(x->>'night')::int,x->>'room_type',(x->>'count')::int,coalesce((x->>'for_tc')::boolean,false) from jsonb_array_elements(roomrows) x;
  update public.quote_items target_item set room_distribution=x->'room_distribution'
   from jsonb_array_elements(payload_items) x,public.quote_days day_row
   where target_item.id=(x->>'id')::uuid and target_item.quote_day_id=day_row.id and day_row.quote_id=q.id and target_item.pricing_unit='per_room';
 else
  for row in select value from jsonb_array_elements(payload_items) loop
   i:=jsonb_populate_record(null::public.quote_items,row);
   if exists(select 1 from public.quote_items x where x.id=i.id and x.quote_day_id=d.id and x.slot_key=slot) then
    update public.quote_items set selected=i.selected,selection_source=i.selection_source,qty=i.qty where id=i.id;
   elsif i.quote_day_id=d.id and i.slot_key=slot then insert into public.quote_items select i.*; end if;
  end loop;
 end if;
 select * into strict q from public.quotes where id=p_id;
 perform public.save_quote_calculation(q.id,q.updated_at,p_result);
 return jsonb_build_object('quote_id',q.id,'calculation',p_result);
end; $$;
revoke all on function public.edit_quote_selection(uuid,text,jsonb,timestamptz,jsonb) from public,anon;
grant execute on function public.edit_quote_selection(uuid,text,jsonb,timestamptz,jsonb) to authenticated;

-- Persist the two quantities with the same result as costs, in the same transaction.
do $migration$ declare definition text;begin
 definition:=pg_get_functiondef('public.save_quote_calculation(uuid,timestamptz,jsonb)'::regprocedure);
 definition:=replace(definition,'unit_cost_original=case','qty_cost=coalesce((x->>''qty_cost'')::numeric,(x->>''quantity'')::numeric),qty_supplier=coalesce((x->>''qty_supplier'')::numeric,(x->>''quantity'')::numeric),unit_cost_original=case');
 execute definition;
end; $migration$;
-- Selection warnings block review, never draft edits.
do $migration$ declare definition text;begin
 definition:=replace(pg_get_functiondef('public.guard_quote_state()'::regprocedure),chr(13),'');
 definition:=overlay(definition placing E'begin\n  if new.status=''revisada'' and old.status is distinct from new.status and jsonb_array_length(coalesce(new.calculation->''selection_issues'',''[]''::jsonb))>0 then raise exception ''Corrige las plazas y la distribución antes de revisar: %'',new.calculation->''selection_issues''; end if;\n'
  from strpos(definition,E'begin\n') for length(E'begin\n'));
 execute definition;
end; $migration$;
-- New versions retain rooming, alongside the existing frozen item metadata.
do $migration$ declare definition text;begin
 definition:=pg_get_functiondef('public.version_quote(uuid)'::regprocedure);
 definition:=replace(definition,'return next_id;',
  'insert into public.quote_rooming(quote_id,night,room_type,count,for_tc) select next_id,night,room_type,count,for_tc from public.quote_rooming where quote_id=original_id; return next_id;');
 execute definition;
end; $migration$;
-- Existing item editor persists v2 options and propagates them across one purchase.
do $migration$ declare definition text;begin
 definition:=pg_get_functiondef('public.edit_quote_item(uuid,jsonb,boolean,boolean)'::regprocedure);
 definition:=replace(definition,'set sku=old_item.sku','set slot_key=old_item.slot_key,is_default=old_item.is_default,billing=old_item.billing,span_days=old_item.span_days,tc_policy=old_item.tc_policy,margin_mode=old_item.margin_mode,margin_pct=old_item.margin_pct,selected=old_item.selected,selection_source=old_item.selection_source,qty_override=old_item.qty_override,sku=old_item.sku');
 definition:=replace(definition,'set pricing_unit=i.pricing_unit','set billing=i.billing,span_days=i.span_days,tc_policy=i.tc_policy,margin_mode=i.margin_mode,margin_pct=i.margin_pct,selected=i.selected,selection_source=i.selection_source,qty_override=i.qty_override,pricing_unit=i.pricing_unit');
 execute definition;
 -- A discount may make total margin negative; it must remain finite.
 definition:=pg_get_functiondef('public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure);
 definition:=replace(definition,'(p_result->>total_name)::numeric>=0 and','(total_name=''total_margin_usd'' or (p_result->>total_name)::numeric>=0) and');
 execute definition;
end; $migration$;
-- New operations reserve supplier quantities, including complimentary TC rooms.
-- Existing operations and their immutable snapshots are untouched.
do $migration$ declare definition text;begin
 definition:=pg_get_functiondef('public.quote_sold_operations()'::regprocedure);
 definition:=replace(definition,'to_jsonb(i),d.date','to_jsonb(i)||jsonb_build_object(''qty'',coalesce(i.qty_supplier,i.qty)),d.date');
 definition:=replace(definition,'(r->>''quantity'')::numeric>0','coalesce((r->>''qty_supplier'')::numeric,(r->>''quantity'')::numeric)>0');
 execute definition;
end; $migration$;
-- Retain hotel identity in the existing atomic day/template writers too.
create function public.quote_day_hotel(p_day uuid) returns uuid language plpgsql stable set search_path='' as $$
declare d public.quote_days; suppliers uuid[]; hotel uuid; matches integer;begin
 select * into strict d from public.quote_days where id=p_day;
 select array_agg(distinct s.supplier_id) filter(where s.supplier_id is not null) into suppliers
 from public.quote_items i join public.services s on s.id=i.service_id
 where i.quote_day_id=p_day and i.selected and i.included and s.type='alojamiento' and i.pricing_unit='per_room';
 if cardinality(suppliers)>1 then raise exception 'Para cambiar de hotel, usa otro bloque. No mezcles hoteles en un día.'; end if;
 hotel:=(d.block_snapshot#>>'{block,hotel_id}')::uuid;
 if hotel is not null then return hotel; end if;
 select min(id),count(*) into hotel,matches from public.hotel_codes where supplier_id=suppliers[1];
 return case when matches=1 then hotel else null end;
end; $$;
revoke all on function public.quote_day_hotel(uuid) from public,anon;
grant execute on function public.quote_day_hotel(uuid) to authenticated;
do $migration$ declare definition text;begin
 definition:=pg_get_functiondef('public.save_quote_as_template(uuid,text,text,text,text,timestamptz,uuid,timestamptz)'::regprocedure);
 definition:=replace(definition,'end_point,content,created_by)','end_point,content,hotel_id,created_by)');
 definition:=replace(definition,'content,auth.uid()) returning id into bid','content,public.quote_day_hotel(d.id),auth.uid()) returning id into bid');
 definition:=replace(definition,'pricing_config,item_snapshot)','pricing_config,item_snapshot,slot_key,is_default,billing,span_days,tc_policy,margin_mode,margin_pct)');
 definition:=replace(definition,$old$'total_cost_local',null));$old$,
  $new$'total_cost_local',null),case when exists(select 1 from public.services x where x.id=i.service_id and x.type='alojamiento' and i.pricing_unit='per_room') then 'ALOJAMIENTO' else i.slot_key end,i.selected,i.billing,i.span_days,coalesce(i.tc_policy,case when i.applies_tc then 'charged' else 'free' end),i.margin_mode,i.margin_pct);$new$);
 execute definition;
 definition:=replace(pg_get_functiondef('public.edit_quote_days(uuid,text,jsonb,timestamptz,jsonb)'::regprocedure),chr(13),'');
 definition:=replace(definition,'default_day_position,hotel_service_id)','default_day_position,hotel_id)');
 definition:=replace(definition,$old$(select (i->>'service_id')::uuid from jsonb_array_elements(its) i where i->>'quote_day_id'=selected->>'id'
          and i->>'service_id'=selected#>>'{block_snapshot,block,hotel_service_id}' limit 1)$old$,
  $new$public.quote_day_hotel((selected->>'id')::uuid)$new$);
 definition:=replace(definition,'pricing_config,item_snapshot)','pricing_config,item_snapshot,slot_key,is_default,billing,span_days,tc_policy,margin_mode,margin_pct)');
 definition:=replace(definition,$old$'total_cost_local',null));$old$,
  $new$'total_cost_local',null),case when exists(select 1 from public.services x where x.id=(it->>'service_id')::uuid and x.type='alojamiento' and it->>'pricing_unit'='per_room') then 'ALOJAMIENTO' else coalesce(it->>'slot_key','SERVICIO') end,coalesce((it->>'selected')::boolean,true),coalesce(it->>'billing','per_day'),coalesce((it->>'span_days')::int,1),coalesce(it->>'tc_policy',case when (it->>'applies_tc')::boolean then 'charged' else 'free' end),coalesce(it->>'margin_mode','inherit'),(it->>'margin_pct')::numeric);$new$);
 execute definition;
end; $migration$;
commit;
