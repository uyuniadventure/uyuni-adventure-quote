begin;
-- State/history are authoritative even when a client bypasses the TypeScript API.
create function public.guard_quote_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='DELETE' then
    if old.status<>'borrador' then raise exception 'Only drafts can be deleted'; end if;
    return old;
  end if;
  if tg_op='INSERT' then
    if new.status<>'borrador' then raise exception 'New quotes must be drafts'; end if;
    return new;
  end if;
  if old.archived_at is not null then raise exception 'Archived quote is immutable'; end if;
  if old.status in ('enviada','vendida','perdida') and
    (to_jsonb(new)-array['status','lost_reason','archived_at','next_followup_at','updated_at']) is distinct from
    (to_jsonb(old)-array['status','lost_reason','archived_at','next_followup_at','updated_at']) then
    raise exception 'Create a new version before editing a sent quote';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status='borrador' and new.status='revisada') or
      (old.status='revisada' and new.status='enviada') or
      (old.status='enviada' and new.status in ('vendida','perdida'))) then
      raise exception 'Invalid quote transition: % -> %',old.status,new.status;
    end if;
    if new.status in ('revisada','enviada','vendida') and new.calculation is null then
      raise exception 'Recalculate quote before transition';
    end if;
    if new.status='perdida' and nullif(btrim(new.lost_reason),'') is null then raise exception 'Lost reason required'; end if;
    if new.status='revisada' and exists(select 1 from public.quote_days where quote_id=new.id and
      (snapshot->>'reviewed')::boolean is distinct from true) then raise exception 'Review all translated days first'; end if;
    if new.status='revisada' and coalesce(new.pricing_config->'unresolved','[]') <> '[]'::jsonb then
      raise exception 'Resolve source import warnings first';
    end if;
  end if;
  if (to_jsonb(new)-array['updated_at','status','lost_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url']) is distinct from
     (to_jsonb(old)-array['updated_at','status','lost_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url']) then
    new.calculation:=null; new.pdf_url:=null;
  end if;
  return new;
end; $$;
create trigger guard_quote_state before insert or update or delete on public.quotes for each row execute function public.guard_quote_state();

create function public.record_quote_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' or new.status is distinct from old.status then
    insert into public.quote_status_history(quote_id,old_status,new_status,changed_by,note)
      values(new.id,case when tg_op='UPDATE' then old.status else null end,new.status,
        coalesce(auth.uid(),new.seller_id),coalesce(nullif(current_setting('app.transition_note',true),''),new.lost_reason));
  end if;
  return new;
end; $$;
create trigger record_quote_state after insert or update on public.quotes for each row execute function public.record_quote_state();
revoke insert,update,delete on public.quote_status_history from authenticated;

create function public.guard_quote_child() returns trigger
language plpgsql set search_path='' as $$
declare qid uuid; q public.quotes;
begin
  if tg_table_name='quote_items' then
    if tg_op='UPDATE' and new.quote_day_id<>old.quote_day_id then raise exception 'Cannot reparent snapshot items'; end if;
    select quote_id into qid from public.quote_days where id=case when tg_op='DELETE' then old.quote_day_id else new.quote_day_id end;
  else
    if tg_op='UPDATE' and new.quote_id<>old.quote_id then raise exception 'Cannot reparent snapshot days'; end if;
    qid:=case when tg_op='DELETE' then old.quote_id else new.quote_id end;
  end if;
  select * into q from public.quotes where id=qid for update;
  if not found then
    if tg_op='DELETE' then return old; end if;
    raise exception 'Quote not accessible';
  end if;
  if q.status not in ('borrador','revisada') or q.archived_at is not null then raise exception 'Snapshot is immutable; create a version'; end if;
  -- Child writes invalidate totals/PDF and serialize against payment/transition.
  update public.quotes set calculation=null,pdf_url=null where id=qid;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;
create trigger guard_quote_day before insert or update or delete on public.quote_days for each row execute function public.guard_quote_child();
create trigger guard_quote_item before insert or update or delete on public.quote_items for each row execute function public.guard_quote_child();

create function public.transition_quote(p_id uuid,p_to public.quote_status,p_note text default null) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes;
begin
  perform set_config('app.transition_note',coalesce(p_note,''),true);
  select * into strict q from public.quotes where id=p_id for update;
  update public.quotes set status=p_to,lost_reason=case when p_to='perdida' then p_note else lost_reason end,
    next_followup_at=case when p_to='enviada' then coalesce(next_followup_at,now()+interval '2 days') else next_followup_at end
    where id=p_id returning * into q;
  return q;
end; $$;

-- Called only by the edit RPC; callers cannot overwrite the sent snapshot.
create function public.version_quote(p_id uuid) returns uuid
language plpgsql set search_path='' as $$
declare q public.quotes; d public.quote_days; i public.quote_items; original_id uuid; next_id uuid:=gen_random_uuid(); did uuid;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.archived_at is not null then raise exception 'Archived version'; end if;
  if q.status in ('borrador','revisada') then return q.id; end if;
  if q.status<>'enviada' then raise exception 'Only sent quotes can be versioned'; end if;
  original_id:=q.id;
  update public.quotes set archived_at=now() where id=original_id;
  q.id:=next_id; q.parent_quote_id:=original_id; q.version:=q.version+1;
  q.code:=regexp_replace(q.code,'-v[0-9]+$','')||'-v'||q.version;
  q.status:='borrador'; q.archived_at:=null; q.pdf_url:=null; q.calculation:=null;
  q.total_cost_usd:=null; q.total_margin_usd:=null; q.total_price_usd:=null; q.price_per_pax_usd:=null;
  q.created_at:=now(); q.updated_at:=now();
  insert into public.quotes select q.*;
  for d in select * from public.quote_days where quote_id=original_id order by day_number loop
    did:=d.id; d.id:=gen_random_uuid(); d.quote_id:=next_id; d.created_at:=now(); d.updated_at:=now();
    insert into public.quote_days select d.*;
    for i in select * from public.quote_items where quote_day_id=did loop
      i.pricing_snapshot:=i.pricing_snapshot||jsonb_build_object('_version_source_id',i.id);
      i.id:=gen_random_uuid(); i.quote_day_id:=d.id; i.created_at:=now(); i.updated_at:=now();
      insert into public.quote_items select i.*;
    end loop;
  end loop;
  return next_id;
end; $$;

-- Atomic insertion: either the full snapshot is saved or nothing is.
create function public.create_quote_snapshot(p_quote jsonb,p_days jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; d jsonb; item jsonb; did uuid; i public.quote_items;
begin
  insert into public.quotes(code,template_id,client_id,client_type,language,start_date,pax_paying,tc_count,category,
    tour_sku,rooming,vehicles,staff,fx_snapshot,margin_pct,rounding_rule,pricing_config,document_snapshot,pax_scenarios,
    deposit_pct,balance_due_days,card_surcharge_pct,payment_schedule)
  values(public.next_quote_code(p_quote->>'tour_sku',p_quote->>'language'),(p_quote->>'template_id')::uuid,
    (p_quote->>'client_id')::uuid,(p_quote->>'client_type')::public.client_type,p_quote->>'language',
    (p_quote->>'start_date')::date,(p_quote->>'pax_paying')::integer,coalesce((p_quote->>'tc_count')::integer,0),
    (p_quote->>'category')::public.tour_category,p_quote->>'tour_sku',p_quote->'rooming',p_quote->'vehicles',
    coalesce(p_quote->'staff','{}'),p_quote->'fx_snapshot',(p_quote->>'margin_pct')::numeric,p_quote->'rounding_rule',
    coalesce(p_quote->'pricing_config','{}'),coalesce(p_quote->'document_snapshot','{}'),p_quote->'pax_scenarios',
    coalesce((p_quote->>'deposit_pct')::numeric,30),coalesce((p_quote->>'balance_due_days')::integer,5),
    coalesce((p_quote->>'card_surcharge_pct')::numeric,3),p_quote->'payment_schedule') returning * into q;
  for d in select value from jsonb_array_elements(p_days) loop
    insert into public.quote_days(quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,snapshot)
    values(q.id,(d->>'day_number')::int,q.start_date+(d->>'day_number')::int-1,d->>'title',coalesce(d->>'description',''),
      d->>'includes',d->>'excludes',d->>'route_from',d->>'route_to',coalesce(d->'snapshot','{}')) returning id into did;
    for item in select value from jsonb_array_elements(coalesce(d->'items','[]')) loop
      perform public.insert_quote_item(did,item,false);
    end loop;
  end loop;
  update public.quotes set document_snapshot=coalesce(p_quote->'document_snapshot','{}')||public.quote_document_context(q.id)
    where id=q.id returning * into q;
  return q;
end; $$;

create function public.insert_quote_item(p_day uuid,p_item jsonb,p_promote boolean default false) returns public.quote_items
language plpgsql set search_path='' as $$
declare i public.quote_items; sid uuid;
begin
  -- Ignore caller-provided ownership, IDs and computed totals.
  i:=jsonb_populate_record(null::public.quote_items,
    '{"qty":1,"unit_cost_original":0,"unit_cost_usd":0,"applies_tc":false,"margin_applicable":true,"included":true,"day_span":1,"price_overridden":false,"pricing_snapshot":{}}'::jsonb||p_item);
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

create function public.edit_quote_item(p_id uuid,p_changes jsonb,p_add boolean default false,p_promote boolean default false) returns jsonb
language plpgsql set search_path='' as $$
declare qid uuid; newqid uuid; did uuid; dayno int; i public.quote_items; old_item public.quote_items;
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
    i:=public.insert_quote_item(did,p_changes,p_promote);
  else
    -- Copy mapping based on stable source ID stored during this transaction is unnecessary:
    -- locate the corresponding row by its original immutable content, then require exactly one.
    if newqid<>qid then
      select * into strict i from public.quote_items x where quote_day_id=did and pricing_snapshot->>'_version_source_id'=old_item.id::text;
    else i:=old_item; end if;
    if p_changes ?| array['id','quote_day_id','created_at','updated_at','total_cost_usd','total_cost_local','service_id','supplier_id','promote_to_master'] then raise exception 'Immutable item fields'; end if;
    old_item:=jsonb_populate_record(i,p_changes);
    update public.quote_items set sku=old_item.sku,description=old_item.description,type=old_item.type,
      pricing_unit=old_item.pricing_unit,qty=old_item.qty,unit_cost_original=old_item.unit_cost_original,currency=old_item.currency,
      applies_tc=old_item.applies_tc,margin_applicable=old_item.margin_applicable,included=old_item.included,day_span=old_item.day_span,
      price_overridden=old_item.price_overridden,override_note=old_item.override_note,pricing_snapshot=old_item.pricing_snapshot,
      airline=old_item.airline,flight_no=old_item.flight_no,route=old_item.route,dep_time=old_item.dep_time,arr_time=old_item.arr_time,
      fare_notes=old_item.fare_notes,check_in=old_item.check_in,check_out=old_item.check_out,room_distribution=old_item.room_distribution,meal_plan=old_item.meal_plan
    where id=i.id returning * into i;
  end if;
  return jsonb_build_object('quote_id',newqid,'item',to_jsonb(i));
end; $$;

create function public.save_quote_calculation(p_id uuid,p_updated_at timestamptz,p_result jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; x jsonb;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at<>p_updated_at then raise exception 'Quote changed; recalculate again' using errcode='40001'; end if;
  if q.status not in ('borrador','revisada') then raise exception 'Cannot recalculate a sent quote'; end if;
  for x in select value from jsonb_array_elements(p_result->'items') loop
    update public.quote_items set unit_cost_original=(x->>'unit_cost_original')::numeric,unit_cost_usd=(x->>'unit_cost_usd')::numeric,
      total_cost_usd=(x->>'total_cost_usd')::numeric,total_cost_local=(x->>'quantity')::numeric*(x->>'unit_cost_original')::numeric
      where id=(x->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=p_id);
    if not found then raise exception 'Calculation contains an unknown item'; end if;
  end loop;
  if jsonb_array_length(p_result->'items')<>(select count(*) from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=p_id) then raise exception 'Incomplete calculation'; end if;
  update public.quotes set calculation=p_result,total_cost_usd=(p_result->>'total_cost_usd')::numeric,
    total_margin_usd=(p_result->>'total_margin_usd')::numeric,total_price_usd=(p_result->>'total_price_usd')::numeric,
    price_per_pax_usd=(p_result->>'price_per_pax_usd')::numeric,single_supplement_pp=(p_result->>'single_supplement_pp')::numeric
  where id=p_id returning * into q;
  return q;
end; $$;

-- Snapshots without a catalog service can still become pending template items.
alter table public.day_block_items alter column service_id drop not null;
alter table public.day_block_items add constraint block_item_source check(service_id is not null or item_snapshot is not null);
create function public.promote_quote_template(p_id uuid) returns uuid
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
      values(bid,i.service_id,greatest(i.qty,0.0001),i.applies_tc,i.margin_applicable,i.included,i.day_span,to_jsonb(i));
    end loop;
  end loop;
  return tid;
end; $$;

-- Functions are invoker-security except the small audited state/history triggers.
do $$ declare f record; begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in
 ('guard_quote_state','record_quote_state','guard_quote_child','transition_quote','version_quote','create_quote_snapshot','insert_quote_item','edit_quote_item','save_quote_calculation','promote_quote_template') loop
  execute format('revoke all on function %s from public',f.signature);
 end loop;
end; $$;
grant execute on function public.transition_quote(uuid,public.quote_status,text),public.version_quote(uuid),
 public.create_quote_snapshot(jsonb,jsonb),public.insert_quote_item(uuid,jsonb,boolean),public.edit_quote_item(uuid,jsonb,boolean,boolean),
 public.save_quote_calculation(uuid,timestamptz,jsonb),public.promote_quote_template(uuid) to authenticated;
commit;
