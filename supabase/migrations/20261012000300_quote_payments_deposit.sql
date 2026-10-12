begin;

alter table public.clients add column deposit_pct numeric(7,4) check(deposit_pct between 0 and 100);
alter table public.pricing_settings add column deposit_pct numeric(7,4) not null default 30 check(deposit_pct between 0 and 100);

-- Resolve on creation, including both quote creators. Versions keep their agreement.
create function public.apply_quote_payment_defaults() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.parent_quote_id is null then
    select coalesce(c.deposit_pct,s.deposit_pct) into strict new.deposit_pct
      from public.clients c cross join public.pricing_settings s where c.id=new.client_id;
  end if;
  return new;
end; $$;
create trigger a_quote_payment_defaults before insert on public.quotes
  for each row execute function public.apply_quote_payment_defaults();
revoke all on function public.apply_quote_payment_defaults() from public,anon;

alter table public.quote_payments
  add column bank text,
  add column fx_rate numeric check(fx_rate>0 and fx_rate<'Infinity'::numeric),
  add column amount_usd numeric generated always as (round(amount/fx_rate,4)) stored,
  add constraint payment_finite_amount check(amount<'Infinity'::numeric);
-- Never assume a rate for historical foreign-currency payments. Missing rates
-- remain explicitly unresolved in the summary and prevent automatic sale.
update public.quote_payments p set fx_rate=case when p.currency='USD' then 1
  when (q.fx_snapshot->>p.currency)::numeric>0 and (q.fx_snapshot->>p.currency)::numeric<'Infinity'::numeric
    then (q.fx_snapshot->>p.currency)::numeric end
  from public.quotes q where q.id=p.quote_id;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('payment-receipts','payment-receipts',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy payment_receipt_read on storage.objects for select to authenticated using (
  bucket_id='payment-receipts' and exists(select 1 from public.quotes q where q.id::text=split_part(name,'/',1)));
create policy payment_receipt_insert on storage.objects for insert to authenticated with check (
  bucket_id='payment-receipts' and exists(select 1 from public.quotes q where q.id::text=split_part(name,'/',1)
    and q.status in ('enviada','vendida') and q.archived_at is null)
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/receipt\.(pdf|jpg|png|webp)$');
-- Receipts are immutable, like payments. No UPDATE/DELETE policies.

create function public.quote_deposit_reached(p_id uuid) returns boolean
language sql stable set search_path='' as $$
  select q.total_price_usd is not null
    and count(p.id) filter(where p.type='deposito')>0
    and count(p.id) filter(where p.amount_usd is null)=0
    and coalesce(sum(p.amount_usd) filter(where p.type='deposito'),0)>=round(q.total_price_usd*q.deposit_pct/100,2)
  from public.quotes q left join public.quote_payments p on p.quote_id=q.id
  where q.id=p_id group by q.id
$$;
revoke all on function public.quote_deposit_reached(uuid) from public,anon;
grant execute on function public.quote_deposit_reached(uuid) to authenticated;

create function public.prepare_quote_payment() returns trigger
language plpgsql set search_path='' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id=new.quote_id for update;
  if not found then raise exception 'Quote not accessible' using errcode='42501'; end if;
  if new.registered_by is distinct from auth.uid() then raise exception 'Payment actor must be the authenticated user'; end if;
  if q.archived_at is not null then raise exception 'Archived quote'; end if;
  if q.status in ('perdida','cancelada') then raise exception 'Closed quote cannot receive payments'; end if;
  if new.type='deposito' and q.status not in ('enviada','vendida') then raise exception 'Deposit requires a sent quote'; end if;
  if new.type='deposito' and (q.total_price_usd is null or public.calculation_has_errors(q.calculation)) then
    raise exception 'Cotización sin cálculo válido';
  end if;
  if exists(select 1 from public.quote_payments where quote_id=q.id and amount_usd is null) then
    raise exception 'Hay pagos históricos sin tipo de cambio confirmado';
  end if;
  new.fx_rate:=case when new.currency='USD' then 1 else (q.fx_snapshot->>new.currency)::numeric end;
  if new.fx_rate is null or new.fx_rate<=0 or new.fx_rate>='Infinity'::numeric then
    raise exception 'Falta tipo de cambio congelado para %',new.currency;
  end if;
  new.method:=nullif(btrim(new.method),'');
  if new.method is null then raise exception 'Método de pago obligatorio'; end if;
  new.bank:=nullif(btrim(new.bank),'');
  new.receipt_path:=nullif(btrim(new.receipt_path),'');
  if new.receipt_path is not null then
    if split_part(new.receipt_path,'/',1)<>q.id::text or split_part(new.receipt_path,'/',2)<>new.id::text then
      raise exception 'Comprobante ajeno al pago';
    end if;
    perform 1 from storage.objects where bucket_id='payment-receipts' and name=new.receipt_path;
    if not found then raise exception 'Comprobante no accesible'; end if;
  end if;
  return new;
end; $$;
create trigger prepare_quote_payment before insert on public.quote_payments
  for each row execute function public.prepare_quote_payment();
revoke all on function public.prepare_quote_payment() from public,anon;

create or replace function public.payment_confirms_quote() returns trigger
language plpgsql security definer set search_path='' as $$
declare q public.quotes; previous_note text:=current_setting('app.transition_note',true);
begin
  select * into strict q from public.quotes where id=new.quote_id for update;
  if public.current_role() is null or (q.seller_id<>auth.uid() and public.current_role()<>'admin') then raise exception 'Quote not accessible'; end if;
  if q.status='enviada' and new.type='deposito' and public.quote_deposit_reached(q.id) then
    perform set_config('app.transition_note','Depósito registrado: '||new.id,true);
    update public.quotes set status='vendida' where id=q.id;
    perform set_config('app.transition_note',coalesce(previous_note,''),true);
  end if;
  return new;
end; $$;

-- Preserve every day (including free days), pax, rooming, staff, FX and costs.
alter table public.ops_services add column quote_snapshot jsonb not null default '{}',
  add column days_snapshot jsonb not null default '[]';
update public.ops_services o set quote_snapshot=to_jsonb(q),
  days_snapshot=coalesce((select jsonb_agg(to_jsonb(d) order by d.day_number) from public.quote_days d where d.quote_id=q.id),'[]')
  from public.quotes q where q.id=o.quote_id;
create function public.freeze_operation_source() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    select to_jsonb(q) into strict new.quote_snapshot from public.quotes q where q.id=new.quote_id;
    select coalesce(jsonb_agg(to_jsonb(d) order by d.day_number),'[]') into new.days_snapshot
      from public.quote_days d where d.quote_id=new.quote_id;
  elsif new.quote_id is distinct from old.quote_id or new.quote_snapshot is distinct from old.quote_snapshot
    or new.days_snapshot is distinct from old.days_snapshot then
    raise exception 'El origen cotizado de operación es inmutable';
  end if;
  return new;
end; $$;
create trigger freeze_operation_source before insert or update on public.ops_services
  for each row execute function public.freeze_operation_source();
revoke all on function public.freeze_operation_source() from public,anon;

create function public.quote_payment_summary(p_id uuid) returns jsonb
language plpgsql stable set search_path='' as $$
declare q public.quotes; paid numeric; deposits numeric; unresolved int; required numeric;
begin
  select * into strict q from public.quotes where id=p_id;
  select coalesce(sum(amount_usd),0),coalesce(sum(amount_usd) filter(where type='deposito'),0),
    count(*) filter(where amount_usd is null) into paid,deposits,unresolved
    from public.quote_payments where quote_id=p_id;
  required:=round(q.total_price_usd*q.deposit_pct/100,2);
  return jsonb_build_object('quote_id',p_id,'status',q.status,'deposit_pct',q.deposit_pct,
    'total_price_usd',q.total_price_usd,'deposit_required_usd',required,
    'paid_usd',case when unresolved=0 then paid end,
    'deposits_usd',case when unresolved=0 then deposits end,
    'deposit_remaining_usd',case when unresolved=0 and required is not null then greatest(required-deposits,0) end,
    'balance_usd',case when unresolved=0 and q.total_price_usd is not null then greatest(q.total_price_usd-paid,0) end,
    'credit_usd',case when unresolved=0 and q.total_price_usd is not null then greatest(paid-q.total_price_usd,0) end,
    'unconverted_payments',unresolved,'operation_id',(select id from public.ops_services where quote_id=p_id));
end; $$;
revoke all on function public.quote_payment_summary(uuid) from public,anon;
grant execute on function public.quote_payment_summary(uuid) to authenticated;

-- Idempotent retries: same payment UUID + same fields returns the original payment.
-- The row lock serializes payments for this quote before checking the threshold.
create function public.register_quote_payment(p_quote_id uuid,p_payment_id uuid,p_payment jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare q public.quotes; p public.quote_payments; existing jsonb; requested jsonb;
begin
  select * into strict q from public.quotes where id=p_quote_id for update;
  requested:=jsonb_build_object('amount',(p_payment->>'amount')::numeric,'currency',p_payment->>'currency',
    'date',(p_payment->>'date')::date,'method',nullif(btrim(p_payment->>'method'),''),'type',p_payment->>'type',
    'bank',nullif(btrim(p_payment->>'bank'),''),'receipt_path',nullif(btrim(p_payment->>'receipt_path'),''));
  select * into p from public.quote_payments where id=p_payment_id;
  if found then
    existing:=jsonb_build_object('amount',p.amount,'currency',p.currency,'date',p.date,'method',p.method,
      'type',p.type,'bank',p.bank,'receipt_path',p.receipt_path);
    if p.quote_id<>p_quote_id or existing is distinct from requested then raise exception 'ID de pago ya utilizado con otros datos'; end if;
  else
    insert into public.quote_payments(id,quote_id,amount,currency,date,method,type,bank,receipt_path)
      values(p_payment_id,p_quote_id,(requested->>'amount')::numeric,requested->>'currency',(requested->>'date')::date,
        requested->>'method',(requested->>'type')::public.payment_type,requested->>'bank',requested->>'receipt_path')
      returning * into p;
  end if;
  return jsonb_build_object('payment',to_jsonb(p),'summary',public.quote_payment_summary(p_quote_id));
end; $$;
revoke all on function public.register_quote_payment(uuid,uuid,jsonb) from public,anon;
grant execute on function public.register_quote_payment(uuid,uuid,jsonb) to authenticated;

-- The state guard below also uses the accumulated threshold, preventing direct
-- SQL/RPC transitions from bypassing the deposit requirement with a partial payment.
create or replace function public.guard_quote_state() returns trigger
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
  if old.status in ('enviada','vendida','perdida','cancelada') and
    (to_jsonb(new)-array['status','lost_reason','cancel_reason','archived_at','next_followup_at','updated_at']) is distinct from
    (to_jsonb(old)-array['status','lost_reason','cancel_reason','archived_at','next_followup_at','updated_at']) then
    raise exception 'Create a new version before editing a sent quote';
  end if;
  -- Invalidate BEFORE checking transitions, including a single UPDATE that edits
  -- quote inputs and tries to send an already-reviewed calculation at once.
  if (to_jsonb(new)-array['updated_at','status','lost_reason','cancel_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url','pdf_path']) is distinct from
     (to_jsonb(old)-array['updated_at','status','lost_reason','cancel_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url','pdf_path']) then
    new.calculation:=null; new.pdf_url:=null; new.pdf_path:=null;
  end if;
  if new.status is distinct from old.status then
    if not ((old.status='borrador' and new.status='revisada') or
      (old.status='revisada' and new.status='enviada') or
      (old.status='enviada' and new.status='vendida') or new.status in ('perdida','cancelada')) then
      raise exception 'Invalid quote transition: % -> %',old.status,new.status;
    end if;
    if new.status='perdida' and nullif(btrim(new.lost_reason),'') is null then raise exception 'Lost reason required'; end if;
    if new.status='cancelada' and nullif(btrim(new.cancel_reason),'') is null then raise exception 'Cancellation reason required'; end if;
    if new.status in ('revisada','enviada','vendida') and new.calculation is null then
      raise exception 'Recalculate quote before transition';
    end if;
    if new.status in ('revisada','enviada') then
      if exists(select 1 from public.quote_days where quote_id=new.id and
        (snapshot->>'reviewed')::boolean is distinct from true) then raise exception 'Review all translated days first'; end if;
      if coalesce(new.pricing_config->'unresolved','[]') <> '[]'::jsonb then
        raise exception 'Resolve source import warnings first';
      end if;
    end if;
    if new.status='vendida' and not public.quote_deposit_reached(new.id) then
      if public.current_role() is distinct from 'admin' or
        nullif(btrim(current_setting('app.transition_note',true)),'') is null then
        raise exception 'Sale requires a registered deposit or an admin with a reason';
      end if;
    end if;
    if new.status in ('vendida','perdida','cancelada') then new.next_followup_at:=null; end if;
  elsif new.lost_reason is distinct from old.lost_reason or new.cancel_reason is distinct from old.cancel_reason then
    raise exception 'Reasons can only change with the quote status';
  end if;
  return new;
end; $$;
commit;
