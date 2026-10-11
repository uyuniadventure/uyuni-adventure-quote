begin;

alter table public.quote_items
  add column adjustment_pct numeric not null default 0
    check(adjustment_pct >= -100 and adjustment_pct < 'Infinity'::numeric),
  add column adjustment_note text;
comment on column public.quote_items.adjustment_pct is
  'Quote-only percent points: 6.4 means +6.4%. Replaces prior adjustment. Margin stays on base cost (Andrea, 2026-10-11).';

create or replace function public.insert_quote_item(p_day uuid,p_item jsonb,p_promote boolean default false) returns public.quote_items
language plpgsql set search_path='' as $$
declare i public.quote_items; sid uuid;
begin
  -- Ignore caller-provided ownership, IDs and computed totals.
  i:=jsonb_populate_record(null::public.quote_items,
    '{"qty":1,"adjustment_pct":0,"unit_cost_original":0,"unit_cost_usd":0,"applies_tc":false,"margin_applicable":true,"included":true,"day_span":1,"price_overridden":false,"pricing_snapshot":{}}'::jsonb||p_item);
  if p_promote then
    insert into public.services(sku,name,type,pricing_unit,currency,status,created_by)
    values(i.sku,i.description,i.type,i.pricing_unit,i.currency,
      case when public.current_role()='vendedor' then 'pendiente'::public.catalog_status else 'activo'::public.catalog_status end,auth.uid()) returning id into sid;
    i.service_id:=sid;
  end if;
  i.id:=gen_random_uuid(); i.quote_day_id:=p_day; i.created_at:=now(); i.updated_at:=now(); i.promote_to_master:=p_promote;
  i.total_cost_usd:=null; i.total_cost_local:=null;
  insert into public.quote_items select i.*;
  return i;
end; $$;

create or replace function public.edit_quote_item(p_id uuid,p_changes jsonb,p_add boolean default false,p_promote boolean default false) returns jsonb
language plpgsql set search_path='' as $$
declare qid uuid; newqid uuid; did uuid; dayno int; i public.quote_items; old_item public.quote_items; purchase text; n int; covered_day uuid;
begin
  if p_add then
    select quote_id,id,day_number into strict qid,did,dayno from public.quote_days where id=p_id;
  else
    select * into strict old_item from public.quote_items where id=p_id;
    select quote_id,id,day_number into strict qid,did,dayno from public.quote_days where id=old_item.quote_day_id;
  end if;
  newqid:=public.version_quote(qid);
  if newqid<>qid then select id into strict did from public.quote_days where quote_id=newqid and day_number=dayno; end if;
  if p_add then
    if coalesce((p_changes->>'day_span')::int,1)>1 then
      p_changes:=jsonb_set(p_changes,'{pricing_snapshot}',coalesce(p_changes->'pricing_snapshot','{}')||jsonb_build_object('coverage_key',gen_random_uuid()::text,'coverage_start_day',dayno));
    end if;
    i:=public.insert_quote_item(did,p_changes,p_promote);
    if i.day_span>1 then
      for n in dayno+1..dayno+i.day_span-1 loop
        select id into strict covered_day from public.quote_days where quote_id=newqid and day_number=n;
        perform public.insert_quote_item(covered_day,to_jsonb(i),false);
      end loop;
    end if;
  else
    -- Copy mapping based on stable source ID stored during this transaction is unnecessary:
    -- locate the corresponding row by its original immutable content, then require exactly one.
    if newqid<>qid then
      select * into strict i from public.quote_items x where quote_day_id=did and pricing_snapshot->>'_version_source_id'=old_item.id::text;
    else i:=old_item; end if;
    if p_changes ?| array['id','quote_day_id','created_at','updated_at','total_cost_usd','total_cost_local','service_id','supplier_id','promote_to_master'] then raise exception 'Immutable item fields'; end if;
    purchase:=i.pricing_snapshot->>'coverage_key';
    old_item:=jsonb_populate_record(i,p_changes);
    update public.quote_items set sku=old_item.sku,description=old_item.description,type=old_item.type,
      pricing_unit=old_item.pricing_unit,qty=old_item.qty,unit_cost_original=old_item.unit_cost_original,currency=old_item.currency,
      applies_tc=old_item.applies_tc,margin_applicable=old_item.margin_applicable,included=old_item.included,day_span=old_item.day_span,
      adjustment_pct=old_item.adjustment_pct,adjustment_note=old_item.adjustment_note,price_overridden=old_item.price_overridden,override_note=old_item.override_note,pricing_snapshot=old_item.pricing_snapshot,
      airline=old_item.airline,flight_no=old_item.flight_no,route=old_item.route,dep_time=old_item.dep_time,arr_time=old_item.arr_time,
      fare_notes=old_item.fare_notes,check_in=old_item.check_in,check_out=old_item.check_out,room_distribution=old_item.room_distribution,meal_plan=old_item.meal_plan
    where id=i.id returning * into i;
    if i.day_span>1 and purchase is not null then
      -- Every display row belongs to the same purchase; propagate billing edits.
      update public.quote_items x set pricing_unit=i.pricing_unit,qty=i.qty,currency=i.currency,
       unit_cost_original=i.unit_cost_original,applies_tc=i.applies_tc,margin_applicable=i.margin_applicable,
       included=i.included,day_span=i.day_span,adjustment_pct=i.adjustment_pct,adjustment_note=i.adjustment_note,price_overridden=i.price_overridden,override_note=i.override_note,
       pricing_snapshot=i.pricing_snapshot
      where x.id<>i.id and x.pricing_snapshot->>'coverage_key'=purchase and
       x.quote_day_id in(select id from public.quote_days where quote_id=newqid);
    end if;
  end if;
  return jsonb_build_object('quote_id',newqid,'item',to_jsonb(i));
end; $$;

create or replace function public.save_quote_calculation(p_id uuid,p_updated_at timestamptz,p_result jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; x jsonb;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at<>p_updated_at then raise exception 'Quote changed; recalculate again' using errcode='40001'; end if;
  if q.status not in ('borrador','revisada') then raise exception 'Cannot recalculate a sent quote'; end if;
  if jsonb_typeof(p_result->'items') is distinct from 'array' then raise exception 'Incomplete calculation'; end if;
  if (select count(distinct entry.value->>'id') from jsonb_array_elements(p_result->'items') as entry(value)) <> jsonb_array_length(p_result->'items') then raise exception 'Duplicate calculation items'; end if;
  for x in select value from jsonb_array_elements(p_result->'items') loop
    if coalesce((x->>'adjustment_pct')::numeric,0) is distinct from (
      select i.adjustment_pct from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
      where i.id=(x->>'id')::uuid and d.quote_id=p_id) then
      raise exception 'Calculation adjustment does not match saved item';
    end if;
    if x->>'status'='error' then
      -- Keep the frozen source/override intact; missing costs are NULL, never zero.
      update public.quote_items set total_cost_usd=null,total_cost_local=null
        where id=(x->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=p_id);
    else
      update public.quote_items set
        unit_cost_original=case when coalesce((x->>'covered')::boolean,false) then unit_cost_original else (x->>'unit_cost_original')::numeric end,
        unit_cost_usd=(x->>'unit_cost_usd')::numeric,total_cost_usd=(x->>'total_cost_usd')::numeric,
        total_cost_local=(x->>'quantity')::numeric*(x->>'unit_cost_original')::numeric*(1+adjustment_pct/100)
        where id=(x->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=p_id);
    end if;
    if not found then raise exception 'Calculation contains an unknown item'; end if;
  end loop;
  if jsonb_array_length(p_result->'items')<>(select count(*) from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=p_id) then raise exception 'Incomplete calculation'; end if;
  update public.quotes set calculation=p_result,total_cost_usd=(p_result->>'total_cost_usd')::numeric,
    total_margin_usd=(p_result->>'total_margin_usd')::numeric,total_price_usd=(p_result->>'total_price_usd')::numeric,
    price_per_pax_usd=(p_result->>'price_per_pax_usd')::numeric,single_supplement_pp=(p_result->>'single_supplement_pp')::numeric
    where id=p_id returning * into q;
  return q;
end; $$;

create or replace function public.promote_quote_template(p_id uuid) returns uuid
language plpgsql set search_path='' as $$
declare q public.quotes; d public.quote_days; i public.quote_items; tid uuid; bid uuid; count_days int;
begin
  select * into strict q from public.quotes where id=p_id for update;
  select count(*) into count_days from public.quote_days where quote_id=q.id;
  insert into public.itinerary_templates(sku,name,route_type,days,nights,category,status,source_quote_id)
  values(coalesce(q.tour_sku,q.code)||'-COPY-'||left(q.id::text,8),q.code,'ONEWAY',count_days,greatest(0,count_days-1),q.category,'pendiente',q.id) returning id into tid;
  for d in select * from public.quote_days where quote_id=q.id order by day_number loop
    insert into public.day_blocks(code,status,default_day_position) values('SNAP-'||tid||'-'||d.day_number,'pendiente',d.day_number) returning id into bid;
    insert into public.day_block_translations(block_id,lang,title,description,includes,excludes,reviewed)
    values(bid,q.language,d.title,d.description,d.includes,d.excludes,coalesce((d.snapshot->>'reviewed')::boolean,false));
    insert into public.template_days(template_id,day_number,block_id) values(tid,d.day_number,bid);
    for i in select * from public.quote_items where quote_day_id=d.id loop
      insert into public.day_block_items(block_id,service_id,qty,applies_tc,margin_applicable,included,multi_day_span,item_snapshot)
      values(bid,i.service_id,greatest(i.qty,0.0001),i.applies_tc,i.margin_applicable,i.included,i.day_span,to_jsonb(i)||jsonb_build_object('adjustment_pct',0,'adjustment_note',null,'total_cost_usd',null,'total_cost_local',null));
    end loop;
  end loop;
  return tid;
end; $$;

-- The pure TypeScript calculator prepares the result without writes. This RPC
-- validates its revision/selection and commits adjustments + totals together.
-- Invoker security preserves quote ownership/RLS (seller or Admin).
create function public.apply_quote_adjustment_bulk(
  p_id uuid, p_filter jsonb, p_pct numeric, p_note text,
  p_updated_at timestamptz, p_result jsonb
) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; matched uuid[]; affected uuid[]; listed uuid[]; total_name text;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió; vuelve a calcular el ajuste.' using errcode='40001';
  end if;
  if q.archived_at is not null or q.status not in ('borrador','revisada') then
    raise exception 'Crea una nueva versión antes de ajustar una cotización enviada.';
  end if;
  if p_pct is null or not (p_pct >= -100 and p_pct < 'Infinity'::numeric) then
    raise exception 'Porcentaje de ajuste inválido (mínimo -100).' using errcode='22023';
  end if;
  if p_filter is null or jsonb_typeof(p_filter)<>'object' or p_filter='{}'::jsonb then
    raise exception 'Indica al menos un filtro.' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_object_keys(p_filter) k
      where k not in ('type','supplier_id','day_number','item_ids'))
    or exists(select 1 from jsonb_each(p_filter) e where e.value='null'::jsonb) then
    raise exception 'Filtro desconocido o nulo.' using errcode='22023';
  end if;
  -- Casts reject malformed enums/UUIDs/numbers even when an empty selection
  -- would otherwise let a bad filter silently through.
  if p_filter ? 'type' then perform (p_filter->>'type')::public.service_type; end if;
  if p_filter ? 'supplier_id' then perform (p_filter->>'supplier_id')::uuid; end if;
  if p_filter ? 'day_number' and ((p_filter->>'day_number')::int <= 0
      or jsonb_typeof(p_filter->'day_number')<>'number') then
    raise exception 'Día inválido.' using errcode='22023';
  end if;
  if p_filter ? 'item_ids' then
    if jsonb_typeof(p_filter->'item_ids')<>'array' or p_filter->'item_ids'='[]'::jsonb then
      raise exception 'La lista de ítems está vacía o es inválida.' using errcode='22023';
    end if;
    select array_agg(value::uuid) into listed from jsonb_array_elements_text(p_filter->'item_ids');
    if exists(select 1 from unnest(listed) as requested(item_id) where requested.item_id is null or not exists (
      select 1 from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
      where i.id=requested.item_id and d.quote_id=p_id)) then
      raise exception 'La lista contiene ítems ajenos a esta cotización.' using errcode='22023';
    end if;
  end if;
  select array_agg(i.id) into matched
    from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
    where d.quote_id=p_id
      and (not p_filter ? 'type' or i.type=(p_filter->>'type')::public.service_type)
      and (not p_filter ? 'supplier_id' or i.supplier_id=(p_filter->>'supplier_id')::uuid)
      and (not p_filter ? 'day_number' or d.day_number=(p_filter->>'day_number')::int)
      and (listed is null or i.id=any(listed));
  if coalesce(cardinality(matched),0)=0 then
    raise exception 'El filtro no coincide con ningún ítem.' using errcode='22023';
  end if;
  select array_agg(i.id) into affected
    from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
    where d.quote_id=p_id and (i.id=any(matched) or (i.day_span>1 and exists (
      select 1 from public.quote_items selected where selected.id=any(matched)
      and selected.day_span>1 and selected.pricing_snapshot->>'coverage_key'=i.pricing_snapshot->>'coverage_key'
    )));
  if p_result is null or p_result->>'status' is distinct from 'ok'
    or jsonb_typeof(p_result->'items') is distinct from 'array'
    or public.calculation_has_errors(p_result) then
    raise exception 'No se puede aplicar un ajuste sin cálculo completo.' using errcode='22023';
  end if;
  foreach total_name in array array['total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd'] loop
    if p_result->>total_name is null or not ((p_result->>total_name)::numeric >= 0
        and (p_result->>total_name)::numeric < 'Infinity'::numeric) then
      raise exception 'Faltan totales válidos en el cálculo.' using errcode='22023';
    end if;
  end loop;
  update public.quote_items set adjustment_pct=p_pct, adjustment_note=nullif(btrim(p_note),'')
    where id=any(affected);
  -- Child triggers touch updated_at and invalidate calculation/PDF. Use the new
  -- revision inside this same transaction, never a second network request.
  select * into strict q from public.quotes where id=p_id;
  return public.save_quote_calculation(p_id,q.updated_at,p_result);
end;
$$;
revoke all on function public.apply_quote_adjustment_bulk(uuid,jsonb,numeric,text,timestamptz,jsonb) from public,anon;
grant execute on function public.apply_quote_adjustment_bulk(uuid,jsonb,numeric,text,timestamptz,jsonb) to authenticated;
commit;
