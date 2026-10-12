begin;
alter table public.quotes add column cancel_reason text;

-- Enforce the same rules for RPCs, payments, email delivery and direct SQL writes.
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
    if new.status='vendida' and not exists(select 1 from public.quote_payments
      where quote_id=new.id and type='deposito' and amount>0) then
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

create or replace function public.transition_quote(p_id uuid,p_to public.quote_status,p_note text default null) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; previous_note text:=current_setting('app.transition_note',true);
begin
  select * into strict q from public.quotes where id=p_id for update;
  if p_to is null or p_to=q.status then raise exception 'Invalid quote transition: % -> %',q.status,p_to; end if;
  perform set_config('app.transition_note',coalesce(nullif(btrim(p_note),''),''),true);
  update public.quotes set status=p_to,
    lost_reason=case when p_to='perdida' then nullif(btrim(p_note),'') else lost_reason end,
    cancel_reason=case when p_to='cancelada' then nullif(btrim(p_note),'') else cancel_reason end,
    next_followup_at=case when p_to='enviada' then coalesce(next_followup_at,now()+interval '2 days') else next_followup_at end
    where id=p_id returning * into q;
  perform set_config('app.transition_note',coalesce(previous_note,''),true);
  return q;
end; $$;

create or replace function public.record_quote_state() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' or new.status is distinct from old.status then
    insert into public.quote_status_history(quote_id,old_status,new_status,changed_by,note)
      values(new.id,case when tg_op='UPDATE' then old.status else null end,new.status,
        coalesce(auth.uid(),
          (select e.sent_by from public.quote_emails e where e.quote_id=new.id and e.status='pendiente'
            and e.pdf_path=new.pdf_path and new.status='enviada' order by e.created_at desc limit 1),new.seller_id),
        case when new.status='perdida' then new.lost_reason
          when new.status='cancelada' then new.cancel_reason
          else nullif(btrim(current_setting('app.transition_note',true)),'') end);
  end if;
  return new;
end; $$;

-- Errors block review/delivery/sale, but never prevent recording a loss/cancellation.
create or replace function public.guard_quote_pricing_errors() returns trigger
language plpgsql set search_path='' as $$
begin
  if not public.calculation_has_errors(new.calculation) then return new; end if;
  if new.status in ('enviada','vendida') or
    (tg_op='UPDATE' and new.status='revisada' and new.status is distinct from old.status) then
    raise exception 'Cotización con errores de cálculo: corrige las tarifas sin costo neto ni rack';
  end if;
  if tg_op='UPDATE' and (
    (new.pdf_path is not null and new.pdf_path is distinct from old.pdf_path) or
    (new.pdf_url is not null and new.pdf_url is distinct from old.pdf_url)) then
    raise exception 'Cotización con errores de cálculo: no se puede guardar un PDF';
  end if;
  new.calculation:=new.calculation || jsonb_build_object('status','error',
    'total_cost_usd',null,'total_margin_usd',null,'total_price_usd',null,
    'price_per_pax_usd',null,'single_supplement_pp',null);
  new.total_cost_usd:=null; new.total_margin_usd:=null; new.total_price_usd:=null;
  new.price_per_pax_usd:=null; new.single_supplement_pp:=null;
  new.pdf_path:=null; new.pdf_url:=null;
  return new;
end; $$;

-- The AFTER INSERT trigger sees the real payment row inside the same transaction.
create or replace function public.payment_confirms_quote() returns trigger
language plpgsql security definer set search_path='' as $$
declare q public.quotes; previous_note text:=current_setting('app.transition_note',true);
begin
  if new.registered_by is distinct from auth.uid() then raise exception 'Payment actor must be the authenticated user'; end if;
  select * into strict q from public.quotes where id=new.quote_id for update;
  if public.current_role() is null or (q.seller_id<>auth.uid() and public.current_role()<>'admin') then raise exception 'Quote not accessible'; end if;
  if q.archived_at is not null then raise exception 'Archived quote'; end if;
  if q.status in ('perdida','cancelada') then raise exception 'Closed quote cannot receive payments'; end if;
  if new.type='deposito' then
    if q.status not in ('enviada','vendida') then raise exception 'Deposit requires a sent quote'; end if;
    if q.status='enviada' then
      perform set_config('app.transition_note','Depósito registrado: '||new.id,true);
      update public.quotes set status='vendida' where id=q.id;
      perform set_config('app.transition_note',coalesce(previous_note,''),true);
    end if;
  end if;
  return new;
end; $$;

create or replace function public.version_quote(p_id uuid) returns uuid
language plpgsql set search_path='' as $$
declare q public.quotes; d public.quote_days; i public.quote_items; original_id uuid; next_id uuid:=gen_random_uuid(); did uuid;
  groups jsonb:='{}'; old_group text; previous_note text:=current_setting('app.transition_note',true);
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.archived_at is not null then raise exception 'Archived version'; end if;
  if q.status in ('borrador','revisada') then return q.id; end if;
  if q.status<>'enviada' then raise exception 'Only sent quotes can be versioned'; end if;
  original_id:=q.id;
  update public.quotes set archived_at=now() where id=original_id;
  perform set_config('app.transition_note','Nueva versión de '||q.code,true);
  q.id:=next_id; q.parent_quote_id:=original_id; q.version:=q.version+1;
  q.code:=regexp_replace(q.code,'-v[0-9]+$','')||'-v'||q.version;
  q.status:='borrador'; q.archived_at:=null; q.pdf_url:=null; q.pdf_path:=null; q.calculation:=null;
  q.lost_reason:=null; q.cancel_reason:=null; q.next_followup_at:=null;
  q.total_cost_usd:=null; q.total_margin_usd:=null; q.total_price_usd:=null; q.price_per_pax_usd:=null;
  q.created_at:=now(); q.updated_at:=now();
  insert into public.quotes select q.*;
  for d in select * from public.quote_days where quote_id=original_id order by day_number loop
    did:=d.id; d.id:=gen_random_uuid(); d.quote_id:=next_id; d.created_at:=now(); d.updated_at:=now();
    if d.group_id is not null then
      old_group:=d.group_id::text;
      if not groups ? old_group then groups:=groups || jsonb_build_object(old_group,gen_random_uuid()); end if;
      d.group_id:=(groups->>old_group)::uuid;
    end if;
    insert into public.quote_days select d.*;
    for i in select * from public.quote_items where quote_day_id=did loop
      i.pricing_snapshot:=i.pricing_snapshot||jsonb_build_object('_version_source_id',i.id);
      i.id:=gen_random_uuid(); i.quote_day_id:=d.id; i.created_at:=now(); i.updated_at:=now();
      insert into public.quote_items select i.*;
    end loop;
  end loop;
  perform set_config('app.transition_note',coalesce(previous_note,''),true);
  return next_id;
end; $$;

-- Preserve email audit notes without leaking them into another change in the transaction.
create or replace function public.finish_quote_email(p_id uuid,p_provider_id text) returns void
language plpgsql security definer set search_path='' as $$
declare e public.quote_emails; q public.quotes; previous_note text:=current_setting('app.transition_note',true);
begin
  select * into strict e from public.quote_emails where id=p_id;
  select * into strict q from public.quotes where id=e.quote_id for update;
  if e.status='enviado' then return; end if;
  if q.pdf_path<>e.pdf_path or q.status not in ('revisada','enviada') then raise exception 'Quote changed during delivery'; end if;
  if nullif(p_provider_id,'') is null then raise exception 'Provider confirmation required'; end if;
  perform set_config('app.transition_note','Email aceptado por Resend: '||p_provider_id,true);
  update public.quotes set status='enviada',next_followup_at=coalesce(next_followup_at,now()+interval '2 days') where id=q.id;
  update public.quote_emails set status='enviado',sent_at=now(),provider_id=p_provider_id,last_error=null where id=e.id;
  perform set_config('app.transition_note',coalesce(previous_note,''),true);
end; $$;

-- CREATE OR REPLACE preserves the existing grants; history/payments remain append-only.
commit;