begin;
grant select,insert,update on public.quote_emails,public.activity_module_translations,public.day_block_translations to service_role;
alter table public.quote_emails add column provider_id text, add column last_error text, add column pdf_path text;
-- Pending outbox rows freeze the exact quote while an external delivery is uncertain.
create function public.guard_quote_delivery() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.quote_emails where quote_id=old.id and status='pendiente') then
  if tg_op='DELETE' or
   (to_jsonb(new)-array['status','next_followup_at','updated_at']) is distinct from
   (to_jsonb(old)-array['status','next_followup_at','updated_at']) or new.status<>'enviada' then
   raise exception 'Email delivery pending: retry or reconcile before editing';
  end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end; $$;
create trigger guard_quote_delivery before update or delete on public.quotes for each row execute function public.guard_quote_delivery();
revoke insert,update,delete on public.quote_emails from authenticated;

create function public.claim_quote_email(p_id uuid,p_recipient text,p_subject text,p_body text) returns public.quote_emails
language plpgsql security definer set search_path='' as $$
declare q public.quotes; e public.quote_emails; key text;
begin
 select * into strict q from public.quotes where id=p_id for update;
 if public.current_role() is null or (q.seller_id<>auth.uid() and public.current_role()<>'admin') then raise exception 'Quote not accessible'; end if;
 if q.status not in ('revisada','enviada') or q.archived_at is not null or q.calculation is null or q.pdf_path is null then raise exception 'Reviewed quote with current PDF required'; end if;
 if nullif(btrim(p_subject),'') is null or nullif(btrim(p_body),'') is null or p_recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Email fields required'; end if;
 key:=q.id::text||':'||q.pdf_path;
 insert into public.quote_emails(quote_id,recipient,subject,body,pdf_url,pdf_path,sent_by,idempotency_key)
 values(q.id,p_recipient,p_subject,p_body,q.pdf_url,q.pdf_path,auth.uid(),key) on conflict(idempotency_key) do nothing;
 select * into strict e from public.quote_emails where idempotency_key=key;
 if (e.recipient,e.subject,e.body) is distinct from (p_recipient,p_subject,p_body) then raise exception 'Retry must use the original email payload'; end if;
 if e.status<>'enviado' and e.created_at<now()-interval '23 hours' then raise exception 'Delivery needs manual provider reconciliation after 23 hours'; end if;
 if e.status='fallido' then update public.quote_emails set status='pendiente',last_error=null where id=e.id returning * into e; end if;
 return e;
end; $$;
create function public.finish_quote_email(p_id uuid,p_provider_id text) returns void
language plpgsql security definer set search_path='' as $$
declare e public.quote_emails; q public.quotes;
begin
 select * into strict e from public.quote_emails where id=p_id;
 select * into strict q from public.quotes where id=e.quote_id for update;
 if e.status='enviado' then return; end if;
 if q.pdf_path<>e.pdf_path or q.status not in ('revisada','enviada') then raise exception 'Quote changed during delivery'; end if;
 if nullif(p_provider_id,'') is null then raise exception 'Provider confirmation required'; end if;
 perform set_config('app.transition_note','Email aceptado por Resend: '||p_provider_id,true);
 update public.quotes set status='enviada',next_followup_at=coalesce(next_followup_at,now()+interval '2 days') where id=q.id;
 update public.quote_emails set status='enviado',sent_at=now(),provider_id=p_provider_id,last_error=null where id=e.id;
end; $$;
revoke all on function public.guard_quote_delivery(),public.claim_quote_email(uuid,text,text,text),public.finish_quote_email(uuid,text) from public;
grant execute on function public.claim_quote_email(uuid,text,text,text) to authenticated;
grant execute on function public.finish_quote_email(uuid,text) to service_role;

create table public.followup_email_runs(
 id uuid primary key default gen_random_uuid(),seller_id uuid not null references public.profiles(id),day date not null,
 recipient text not null,body text not null,status public.email_status not null default 'pendiente',provider_id text,last_error text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(seller_id,day));
alter table public.followup_email_runs enable row level security;
create policy followup_runs_admin on public.followup_email_runs for select to authenticated using(public.current_role()='admin');
grant select on public.followup_email_runs to authenticated;
grant all on public.followup_email_runs to service_role;
create trigger set_updated_at before update on public.followup_email_runs for each row execute function public.set_updated_at();
-- Unique(seller_id,day) is also the leading FK index.
create function public.due_followups() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(t),'[]') from (
  select q.seller_id,q.id quote_id,q.code,q.next_followup_at scheduled_at,'Seguimiento de cotización' note
   from public.quotes q where q.status='enviada' and q.archived_at is null and
   q.next_followup_at<((now() at time zone 'America/Santiago')::date+1)::timestamp at time zone 'America/Santiago'
  union all
  select f.responsible_id,q.id,q.code,f.scheduled_at,f.note from public.quote_followups f join public.quotes q on q.id=f.quote_id
   where not f.done and q.archived_at is null and q.status='enviada' and
   f.scheduled_at<((now() at time zone 'America/Santiago')::date+1)::timestamp at time zone 'America/Santiago'
 ) t;
$$;
revoke all on function public.due_followups() from public;
grant execute on function public.due_followups() to service_role;
commit;