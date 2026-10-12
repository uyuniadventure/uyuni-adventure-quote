begin;

create type public.margin_mode as enum ('markup','margin_on_price');
create type public.commission_mode as enum ('none','gross');

-- One global configuration, readable by the team and editable only by Admin.
create table public.pricing_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'
    check(id='00000000-0000-0000-0000-000000000001'),
  margin_pct numeric(9,4) not null default 25 check(margin_pct>=0 and margin_pct<'Infinity'::numeric),
  margin_mode public.margin_mode not null default 'markup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(margin_mode<>'margin_on_price' or margin_pct<100)
);
alter table public.pricing_settings enable row level security;
create policy pricing_settings_read on public.pricing_settings for select to authenticated
  using(public.current_role() is not null);
create policy pricing_settings_admin on public.pricing_settings for update to authenticated
  using(public.current_role()='admin') with check(public.current_role()='admin');
grant select,update on public.pricing_settings to authenticated;
revoke all on public.pricing_settings from anon;
create trigger set_updated_at before update on public.pricing_settings
  for each row execute function public.set_updated_at();
insert into public.pricing_settings default values;

alter table public.clients
  add column margin_pct numeric(9,4) check(margin_pct>=0 and margin_pct<'Infinity'::numeric),
  add column commission_pct numeric(7,4) not null default 0 check(commission_pct>=0 and commission_pct<100),
  add column commission_mode public.commission_mode not null default 'none',
  add constraint clients_b2b_commission check(type='B2B' or (commission_mode='none' and commission_pct=0));

-- Existing quotes remain markup/no commission. Future inserts resolve defaults
-- atomically, while version_quote copies the existing frozen fields unchanged.
alter table public.quotes
  add column margin_mode public.margin_mode not null default 'markup',
  add column commission_mode public.commission_mode not null default 'none',
  add column commission_pct numeric(7,4) not null default 0 check(commission_pct>=0 and commission_pct<100),
  add constraint quotes_price_margin_range check(margin_mode<>'margin_on_price' or margin_pct<100),
  add constraint quotes_b2b_commission check(client_type='B2B' or (commission_mode='none' and commission_pct=0));
alter table public.quotes alter column margin_pct drop default,
  alter column margin_mode drop default, alter column commission_mode drop default,
  alter column commission_pct drop default;

create function public.apply_quote_pricing_defaults() returns trigger
language plpgsql set search_path='' as $$
declare c public.clients; settings public.pricing_settings;
begin
  select * into strict c from public.clients where id=new.client_id;
  select * into strict settings from public.pricing_settings;
  new.margin_pct:=coalesce(new.margin_pct,c.margin_pct,settings.margin_pct);
  new.margin_mode:=coalesce(new.margin_mode,settings.margin_mode);
  new.commission_mode:=coalesce(new.commission_mode,
    case when new.client_type='B2B' and c.type='B2B' then c.commission_mode else 'none'::public.commission_mode end);
  new.commission_pct:=coalesce(new.commission_pct,
    case when new.commission_mode='gross' and c.type='B2B' then c.commission_pct else 0 end);
  return new;
end; $$;
create trigger a_quote_pricing_defaults before insert on public.quotes
  for each row execute function public.apply_quote_pricing_defaults();
revoke all on function public.apply_quote_pricing_defaults() from public,anon;
grant execute on function public.apply_quote_pricing_defaults() to authenticated;

-- The existing quote creator can omit margin_pct to inherit client/Admin.
-- Agency commission comes from the client; the caller can choose margin_mode.
create or replace function public.create_quote_snapshot(p_quote jsonb,p_days jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; d jsonb; item jsonb; did uuid;
begin
  insert into public.quotes(code,template_id,client_id,client_type,language,start_date,pax_paying,tc_count,category,
    tour_sku,rooming,vehicles,staff,fx_snapshot,margin_pct,margin_mode,rounding_rule,pricing_config,document_snapshot,pax_scenarios,
    deposit_pct,balance_due_days,card_surcharge_pct,payment_schedule)
  values(public.next_quote_code(p_quote->>'tour_sku',p_quote->>'language'),(p_quote->>'template_id')::uuid,
    (p_quote->>'client_id')::uuid,(p_quote->>'client_type')::public.client_type,p_quote->'language',
    (p_quote->>'start_date')::date,(p_quote->>'pax_paying')::integer,coalesce((p_quote->>'tc_count')::integer,0),
    (p_quote->>'category')::public.tour_category,p_quote->'tour_sku',p_quote->'rooming',p_quote->'vehicles',
    coalesce(p_quote->'staff','{}'),p_quote->'fx_snapshot',(p_quote->>'margin_pct')::numeric,
    (p_quote->>'margin_mode')::public.margin_mode,p_quote->'rounding_rule',
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

commit;