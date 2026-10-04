begin;
alter table public.ops_services add column language text not null default 'es', add column client_name text;
create unique index ops_items_quote_unique on public.ops_items(service_id,quote_item_id);
create function public.quote_sold_operations() returns trigger
language plpgsql security definer set search_path='' as $$
declare opid uuid; last_day date; clientname text; booking text;
begin
  if new.status<>'vendida' or old.status='vendida' then return new; end if;
  select coalesce(max(date),new.start_date) into last_day from public.quote_days where quote_id=new.id;
  select name into clientname from public.clients where id=new.client_id;
  booking:=to_char(new.start_date,'YYYYMMDD')||'-'||to_char(last_day,'DD')||' '||upper(clientname)||' x'||new.pax_paying;
  -- Same client/dates may have multiple confirmed bookings; preserve recognizable code.
  if exists(select 1 from public.ops_services where booking_code=booking) then booking:=booking||' ['||new.code||']'; end if;
  insert into public.ops_services(booking_code,quote_id,client_type,tour_sku,start_date,end_date,pax,responsible_id,quoted_cost_usd,sale_price_usd,language,client_name)
  values(booking,new.id,case when new.client_type='B2B' then 'GRUPO'::public.ops_client_type else 'PRIVADO'::public.ops_client_type end,
    new.tour_sku,new.start_date,last_day,new.pax_paying+new.tc_count,new.seller_id,new.total_cost_usd,new.total_price_usd,new.language,clientname)
  on conflict(quote_id) do nothing returning id into opid;
  if opid is not null then
    insert into public.ops_items(service_id,quote_item_id,item_snapshot,date,type,description,supplier_id,cost_usd,cost_local,currency,check_in,check_out,room_distribution,meal_plan)
    select opid,i.id,to_jsonb(i),d.date,i.type,i.description,i.supplier_id,i.total_cost_usd,i.total_cost_local,i.currency,i.check_in,i.check_out,i.room_distribution,i.meal_plan
    from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=new.id and i.included
     and exists(select 1 from jsonb_array_elements(new.calculation->'items') r where r->>'id'=i.id::text and
       ((r->>'quantity')::numeric>0 or coalesce((r->>'covered')::boolean,false)));
  end if;
  return new;
end; $$;
create function public.generate_communication_plan(p_id uuid,p_messages jsonb) returns setof public.ops_communications
language plpgsql set search_path='' as $$
declare s public.ops_services; n integer; scheduled timestamptz;
begin
 if public.current_role() not in ('admin','operacion') or public.current_role() is null then raise exception 'Operations role required'; end if;
 select * into strict s from public.ops_services where id=p_id for update;
 if jsonb_array_length(p_messages)<>5 then raise exception 'Five messages required'; end if;
 for n in 1..5 loop
  if nullif(btrim(p_messages->>(n-1)),'') is null then raise exception 'Empty message'; end if;
  scheduled:=case n when 1 then now() when 2 then (s.start_date-2+time '09:00') at time zone 'America/Santiago'
   when 3 then (s.start_date-1+time '09:00') at time zone 'America/Santiago'
   when 4 then (s.start_date+time '17:00') at time zone 'America/Santiago'
   when 5 then (s.end_date+time '19:00') at time zone 'America/Santiago' end;
  insert into public.ops_communications(service_id,milestone,channel,scheduled_at,message)
   values(s.id,n,'whatsapp',scheduled,p_messages->>(n-1)) on conflict(service_id,milestone) do nothing;
 end loop;
 return query select * from public.ops_communications where service_id=p_id order by milestone;
end; $$;
create trigger quote_sold_operations after update of status on public.quotes for each row execute function public.quote_sold_operations();

create function public.payment_confirms_quote() returns trigger
language plpgsql security definer set search_path='' as $$
declare q public.quotes;
begin
  if new.registered_by<>auth.uid() then raise exception 'Payment actor must be the authenticated user'; end if;
  select * into strict q from public.quotes where id=new.quote_id for update;
  if public.current_role() is null or (q.seller_id<>auth.uid() and public.current_role()<>'admin') then raise exception 'Quote not accessible'; end if;
  if q.archived_at is not null then raise exception 'Archived quote'; end if;
  if new.type='deposito' then
    if q.status not in ('enviada','vendida') then raise exception 'Deposit requires a sent quote'; end if;
    if q.status='enviada' then
      perform set_config('app.transition_note','Depósito registrado: '||new.id,true);
      update public.quotes set status='vendida' where id=q.id;
    end if;
  end if;
  return new;
end; $$;
create trigger payment_confirms_quote after insert on public.quote_payments for each row execute function public.payment_confirms_quote();
-- Financial records/history are append-only. Corrections are explicit new records.
revoke update,delete on public.quote_payments from authenticated;

create function public.build_supplier_payables(p_id uuid) returns setof public.ops_supplier_payables
language plpgsql set search_path='' as $$
begin
  if public.current_role() not in ('admin','operacion') or public.current_role() is null then raise exception 'Operations role required'; end if;
  perform 1 from public.ops_services where id=p_id for update;
  if not found then raise exception 'Service not found'; end if;
  if exists(select 1 from public.ops_items where service_id=p_id and booking_status<>'cancelado' and (supplier_id is null or currency is null or cost_usd is null or cost_local is null)) then
    raise exception 'Assign supplier, currency and real costs to every active item first';
  end if;
  -- Keep existing payments even when items are cancelled or moved to another supplier.
  update public.ops_supplier_payables set cost_usd=0,cost_local=0,detail='Sin ítems activos',status=case when paid_usd>0 then 'pagado'::public.payable_status else 'pendiente'::public.payable_status end where service_id=p_id;
  insert into public.ops_supplier_payables(service_id,supplier_id,currency,detail,cost_usd,cost_local,status)
    select p_id,supplier_id,currency,string_agg(description,E'\n' order by date,id),sum(cost_usd),sum(cost_local),'pendiente'
    from public.ops_items where service_id=p_id and booking_status<>'cancelado' group by supplier_id,currency
  on conflict(service_id,supplier_id,currency) do update set detail=excluded.detail,cost_usd=excluded.cost_usd,cost_local=excluded.cost_local,
    status=case when public.ops_supplier_payables.paid_usd>=excluded.cost_usd then 'pagado'::public.payable_status
      when public.ops_supplier_payables.paid_usd>0 then 'parcial'::public.payable_status else 'pendiente'::public.payable_status end;
  return query select * from public.ops_supplier_payables where service_id=p_id;
end; $$;
create function public.compute_real_margin(p_id uuid) returns public.ops_services
language plpgsql set search_path='' as $$
declare result public.ops_services; cost numeric;
begin
  if public.current_role() not in ('admin','operacion') or public.current_role() is null then raise exception 'Operations role required'; end if;
  perform 1 from public.ops_services where id=p_id for update;
  if not found then raise exception 'Service not found'; end if;
  if exists(select 1 from public.ops_items where service_id=p_id and booking_status<>'cancelado' and cost_usd is null) then raise exception 'Real costs incomplete'; end if;
  select coalesce(sum(cost_usd),0) into cost from public.ops_items where service_id=p_id and booking_status<>'cancelado';
  update public.ops_services set real_cost_usd=cost,real_margin_usd=sale_price_usd-cost where id=p_id returning * into result;
  return result;
end; $$;

-- Read only the frozen client-facing context of ONE accessible quote, not admin catalogs.
create function public.quote_document_context(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.quotes; c public.clients; terms text;
begin
  select * into strict q from public.quotes where id=p_id;
  if public.current_role() is null or (q.seller_id<>auth.uid() and public.current_role()<>'admin') then raise exception 'Quote not accessible'; end if;
  select * into strict c from public.clients where id=q.client_id;
  select content into terms from public.terms_conditions where lang=q.language and
    ((id=c.terms_id and (client_id=c.id or client_id is null)) or (client_id is null and scope::text=q.client_type::text||'_general'))
    order by (id=c.terms_id) desc nulls last limit 1;
  return jsonb_build_object('client_name',c.name,'client_email',c.email,'terms',terms,
    'banks',(select coalesce(jsonb_agg(to_jsonb(b)-array['id','created_at','updated_at']),'[]') from public.bank_accounts b),
    'info',(select coalesce(jsonb_agg(jsonb_build_object('title',b.title,'content',b.content) order by b."order"),'[]') from public.info_blocks b where b.lang=q.language and
       exists(select 1 from public.quote_days d where d.quote_id=q.id and (d.route_from=b.destination or d.route_to=b.destination))));
end; $$;

do $$ declare f record; begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in
 ('quote_sold_operations','payment_confirms_quote','build_supplier_payables','compute_real_margin','quote_document_context','generate_communication_plan') loop
  execute format('revoke all on function %s from public',f.signature);
 end loop;
end; $$;
grant execute on function public.build_supplier_payables(uuid),public.compute_real_margin(uuid),public.quote_document_context(uuid) to authenticated;
grant execute on function public.generate_communication_plan(uuid,jsonb) to authenticated;
commit;