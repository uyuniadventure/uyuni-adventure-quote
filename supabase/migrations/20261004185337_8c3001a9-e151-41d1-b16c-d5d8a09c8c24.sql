-- SPEC §4.1–4.7. The repository baseline contains no existing tables/migrations.
-- Run as the database owner in Supabase SQL Editor, before the security migration.
begin;

create type public.app_role as enum ('admin', 'operacion', 'vendedor');
create type public.service_type as enum ('transporte', 'alojamiento', 'comida', 'guia', 'entrada', 'actividad', 'paquete', 'extra', 'vuelo');
create type public.pricing_unit as enum ('per_person', 'per_group', 'per_room', 'per_vehicle', 'per_staff', 'per_unit');
create type public.season as enum ('ALL', 'DRY', 'RAIN', 'BAJA', 'MEDIA', 'ALTA', 'FESTIVO');
create type public.catalog_status as enum ('activo', 'pendiente', 'inactivo');
create type public.service_modality as enum ('privado', 'compartido', 'ambos');
create type public.itinerary_modality as enum ('privado', 'compartido', 'grupo');
create type public.meal_plan as enum ('NONE', 'BB', 'HB', 'FB');
create type public.approval_status as enum ('pendiente', 'aprobado', 'rechazado');
create type public.media_type as enum ('highlight', 'alojamiento');
create type public.activity_duration as enum ('HD_AM', 'HD_PM', 'FD', 'NOCHE', 'TRASLADO');
create type public.route_type as enum ('ROUNDTRIP', 'ONEWAY');
create type public.tour_category as enum ('BUDGET', 'COMFORT', 'VIP', 'MIXTO');
create type public.client_type as enum ('B2B', 'B2C');
create type public.terms_scope as enum ('B2C_general', 'B2B_general', 'B2B_cliente');
create type public.quote_status as enum ('borrador', 'revisada', 'enviada', 'vendida', 'perdida');
create type public.payment_type as enum ('deposito', 'saldo', 'otro');
create type public.email_status as enum ('pendiente', 'enviado', 'fallido');
create type public.ops_client_type as enum ('PRIVADO', 'GRUPO');
create type public.ops_status as enum ('activo', 'en_curso', 'terminado', 'cancelado');
create type public.booking_status as enum ('pendiente', 'cotizacion_solicitada', 'reservado', 'confirmado', 'cancelado');
create type public.payable_status as enum ('pendiente', 'parcial', 'pagado');
create type public.communication_channel as enum ('whatsapp', 'email');
create type public.communication_status as enum ('pendiente', 'enviado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'vendedor',
  full_name text
);
create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{3}$'),
  name text not null
);
create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null references public.currencies(code),
  rate_to_usd numeric(18,6) not null check (rate_to_usd > 0),
  valid_from date not null,
  unique(currency, valid_from)
);
comment on column public.exchange_rates.rate_to_usd is 'Native currency units per 1 USD; divide native cost by this rate (SPEC §6).';
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  aliases text[] not null default '{}',
  country text,
  contact text,
  notes text,
  email text,
  phone text,
  service_type public.service_type,
  agent text,
  location text
);
create table public.location_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{3}$'),
  name text not null,
  country text
);
create table public.hotel_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  supplier_id uuid references public.suppliers(id)
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  location text,
  country text,
  supplier_id uuid references public.suppliers(id),
  type public.service_type not null,
  pricing_unit public.pricing_unit,
  currency text references public.currencies(code),
  room_type text,
  vehicle_type text,
  vehicle_max_pax integer check (vehicle_max_pax > 0),
  meal_plan public.meal_plan,
  multi_day_span integer not null default 1 check (multi_day_span > 0),
  applies_tc_default boolean not null default false,
  margin_applicable_default boolean not null default true,
  modality public.service_modality not null default 'ambos',
  status public.catalog_status not null default 'pendiente',
  created_by uuid default auth.uid() references public.profiles(id),
  source text,
  notes text,
  import_issues text,
  check (status <> 'activo' or (currency is not null and pricing_unit is not null))
);
-- A historical SKU still resolves after multiple passenger bands are grouped.
create table public.service_sku_aliases (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  service_id uuid not null references public.services(id) on delete cascade
);
create table public.service_rates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  season public.season not null default 'ALL',
  valid_from date,
  valid_to date,
  pax_min integer check (pax_min > 0),
  pax_max integer check (pax_max > 0),
  price_net numeric(18,4) check (price_net >= 0),
  price_rack numeric(18,4) check (price_rack >= 0),
  net_cost_missing boolean not null default false,
  notes text,
  source_row integer unique,
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (pax_max is null or pax_min is null or pax_max >= pax_min)
);
comment on column public.service_rates.net_cost_missing is 'True when price_net is the imported rack fallback, not a verified net cost.';
create table public.service_change_requests (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  rate_id uuid references public.service_rates(id) on delete cascade,
  proposed_values jsonb not null,
  reason text not null,
  requested_by uuid not null default auth.uid() references public.profiles(id),
  status public.approval_status not null default 'pendiente',
  approved_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  check (num_nonnulls(service_id, rate_id) = 1)
);
create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  slug text not null unique
);
create table public.media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  place_id uuid references public.places(id),
  service_id uuid references public.services(id),
  type public.media_type not null,
  "order" integer not null default 0,
  check (num_nonnulls(place_id, service_id) = 1)
);
create table public.activity_modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  place_id uuid references public.places(id),
  duration public.activity_duration not null,
  default_time time,
  modality public.service_modality not null default 'ambos',
  status public.catalog_status not null default 'pendiente',
  created_by uuid default auth.uid() references public.profiles(id)
);
create table public.activity_module_translations (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.activity_modules(id) on delete cascade,
  lang text not null,
  title text not null,
  description text not null,
  unique(module_id, lang)
);
create table public.activity_module_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.activity_modules(id) on delete cascade,
  service_id uuid not null references public.services(id),
  qty numeric(12,4) not null default 1 check (qty > 0),
  applies_tc boolean,
  margin_applicable boolean
);
create table public.day_blocks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  route_from text references public.location_codes(code),
  route_to text references public.location_codes(code),
  places text[] not null default '{}',
  modality public.itinerary_modality not null default 'privado',
  hotel_service_id uuid references public.services(id),
  default_day_position integer check (default_day_position > 0),
  status public.catalog_status not null default 'pendiente',
  created_by uuid default auth.uid() references public.profiles(id)
);
create table public.day_block_translations (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.day_blocks(id) on delete cascade,
  lang text not null,
  title text not null,
  description text not null,
  includes text,
  excludes text,
  reviewed boolean not null default false,
  unique(block_id, lang)
);
create table public.day_block_modules (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.day_blocks(id) on delete cascade,
  module_id uuid not null references public.activity_modules(id),
  "order" integer not null default 0,
  time time
);
create table public.day_block_items (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.day_blocks(id) on delete cascade,
  service_id uuid not null references public.services(id),
  qty numeric(12,4) not null default 1 check (qty > 0),
  applies_tc boolean,
  margin_applicable boolean,
  is_optional boolean not null default false,
  included boolean not null default true
);
create table public.itinerary_templates (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  route_from text references public.location_codes(code),
  route_to text references public.location_codes(code),
  route_type public.route_type not null,
  days integer not null check (days > 0),
  nights integer not null check (nights >= 0 and nights <= days),
  modality public.itinerary_modality not null default 'privado',
  category public.tour_category not null,
  hotel_combo text,
  countries text[] not null default '{}',
  main_places text[] not null default '{}',
  meals_summary text,
  includes_guide boolean not null default false,
  guide_language text,
  includes_staff_lodging_meals boolean not null default false,
  status public.catalog_status not null default 'pendiente',
  source_quote_id uuid,
  created_by uuid default auth.uid() references public.profiles(id)
);
create table public.template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.itinerary_templates(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  block_id uuid not null references public.day_blocks(id),
  unique(template_id, day_number)
);
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  type public.client_type not null,
  name text not null,
  contact text,
  email text,
  country text,
  language text not null default 'es',
  terms_id uuid,
  created_by uuid default auth.uid() references public.profiles(id)
);
create table public.terms_conditions (
  id uuid primary key default gen_random_uuid(),
  scope public.terms_scope not null,
  client_id uuid references public.clients(id),
  lang text not null,
  content text not null,
  check ((scope = 'B2B_cliente') = (client_id is not null))
);
alter table public.clients add constraint clients_terms_id_fkey foreign key (terms_id) references public.terms_conditions(id);
create table public.info_blocks (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  lang text not null,
  title text not null,
  content text not null,
  "order" integer not null default 0,
  unique(destination, lang, title)
);
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  bank_name text not null,
  account_holder text not null,
  account_number text not null,
  currency text not null references public.currencies(code),
  swift text,
  routing_number text,
  iban text,
  instructions text
);
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  version integer not null default 1 check (version > 0),
  parent_quote_id uuid references public.quotes(id),
  template_id uuid references public.itinerary_templates(id),
  client_id uuid not null references public.clients(id),
  client_type public.client_type not null,
  language text not null default 'es',
  seller_id uuid not null default auth.uid() references public.profiles(id),
  start_date date not null,
  pax_paying integer not null check (pax_paying > 0),
  tc_count integer not null default 0 check (tc_count >= 0),
  rooming jsonb not null default '{}',
  staff jsonb not null default '{}',
  vehicles jsonb not null default '{}',
  category public.tour_category not null,
  deposit_pct numeric(7,4) not null default 30 check (deposit_pct between 0 and 100),
  balance_due_days integer not null default 5 check (balance_due_days >= 0),
  card_surcharge_pct numeric(7,4) not null default 3 check (card_surcharge_pct between 0 and 100),
  payment_schedule jsonb,
  single_supplement_pp numeric(18,4),
  fx_snapshot jsonb not null default '{}',
  margin_pct numeric(9,4) not null default 0 check (margin_pct >= 0),
  rounding_rule jsonb not null default '{}',
  total_cost_usd numeric(18,4),
  total_margin_usd numeric(18,4),
  total_price_usd numeric(18,4),
  price_per_pax_usd numeric(18,4),
  pax_scenarios jsonb,
  status public.quote_status not null default 'borrador',
  lost_reason text,
  next_followup_at timestamptz,
  archived_at timestamptz,
  pdf_url text,
  check (status <> 'perdida' or nullif(btrim(lost_reason), '') is not null),
  check (parent_quote_id is null or parent_quote_id <> id)
);
alter table public.itinerary_templates add constraint itinerary_templates_source_quote_id_fkey foreign key(source_quote_id) references public.quotes(id);
create table public.quote_days (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  date date,
  title text not null,
  description text not null default '',
  includes text,
  excludes text,
  route_from text,
  route_to text,
  snapshot jsonb not null default '{}',
  unique(quote_id, day_number)
);
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_day_id uuid not null references public.quote_days(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  sku text,
  description text not null,
  type public.service_type not null,
  pricing_unit public.pricing_unit not null,
  qty numeric(12,4) not null default 1 check (qty >= 0),
  unit_cost_original numeric(18,4) not null check (unit_cost_original >= 0),
  currency text not null references public.currencies(code),
  unit_cost_usd numeric(18,4) not null check (unit_cost_usd >= 0),
  applies_tc boolean not null default false,
  margin_applicable boolean not null default true,
  included boolean not null default true,
  day_span integer not null default 1 check (day_span > 0),
  price_overridden boolean not null default false,
  override_note text,
  promote_to_master boolean not null default false,
  airline text,
  flight_no text,
  route text,
  dep_time timestamptz,
  arr_time timestamptz,
  fare_notes text,
  check_in date,
  check_out date,
  room_distribution jsonb,
  meal_plan public.meal_plan,
  check (not price_overridden or nullif(btrim(override_note), '') is not null),
  check (check_out is null or check_in is null or check_out >= check_in)
);
create table public.quote_status_history (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  old_status public.quote_status,
  new_status public.quote_status not null,
  changed_by uuid not null default auth.uid() references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);
create table public.quote_payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  amount numeric(18,4) not null check (amount > 0),
  currency text not null references public.currencies(code),
  date date not null,
  method text not null,
  type public.payment_type not null,
  registered_by uuid not null default auth.uid() references public.profiles(id),
  receipt_path text
);
create table public.quote_followups (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  scheduled_at timestamptz not null,
  note text not null,
  done boolean not null default false,
  responsible_id uuid not null default auth.uid() references public.profiles(id)
);
create table public.quote_emails (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  recipient text not null,
  subject text not null,
  body text not null,
  pdf_url text,
  sent_at timestamptz,
  sent_by uuid not null default auth.uid() references public.profiles(id),
  status public.email_status not null default 'pendiente'
);
create table public.ops_services (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  quote_id uuid not null unique references public.quotes(id),
  client_type public.ops_client_type not null,
  tour_sku text,
  start_date date not null,
  end_date date not null,
  pax integer not null check (pax > 0),
  responsible_id uuid references public.profiles(id),
  status public.ops_status not null default 'activo',
  quoted_cost_usd numeric(18,4),
  real_cost_usd numeric(18,4),
  sale_price_usd numeric(18,4),
  real_margin_usd numeric(18,4),
  check (end_date >= start_date)
);
create table public.ops_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.ops_services(id) on delete cascade,
  quote_item_id uuid references public.quote_items(id) on delete set null,
  item_snapshot jsonb not null,
  date date not null,
  type public.service_type not null,
  description text not null,
  place text,
  pickup_time time,
  supplier_id uuid references public.suppliers(id),
  cost_usd numeric(18,4) check (cost_usd >= 0),
  cost_local numeric(18,4) check (cost_local >= 0),
  currency text references public.currencies(code),
  booking_status public.booking_status not null default 'pendiente',
  followup_notes text,
  extra_notes text,
  check_in date,
  check_out date,
  room_distribution jsonb,
  meal_plan public.meal_plan,
  check (check_out is null or check_in is null or check_out >= check_in)
);
create table public.ops_supplier_payables (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.ops_services(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  detail text,
  currency text not null references public.currencies(code),
  cost_usd numeric(18,4) not null check (cost_usd >= 0),
  cost_local numeric(18,4) not null check (cost_local >= 0),
  paid_usd numeric(18,4) not null default 0 check (paid_usd >= 0),
  balance_usd numeric(18,4) generated always as (cost_usd - paid_usd) stored,
  due_date date,
  paid_date date,
  status public.payable_status not null default 'pendiente',
  unique(service_id, supplier_id, currency)
);
create table public.ops_passengers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.ops_services(id) on delete cascade,
  full_name text not null,
  nationality text,
  passport text,
  birth_date date,
  dietary_restrictions text,
  bed_type text,
  phone text,
  email text,
  notes text
);
create table public.ops_communications (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.ops_services(id) on delete cascade,
  milestone integer not null check (milestone between 1 and 5),
  channel public.communication_channel not null,
  scheduled_at timestamptz not null,
  message text not null,
  status public.communication_status not null default 'pendiente',
  unique(service_id, milestone)
);
create table public.quote_year_counters (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year between 2000 and 9999),
  last_value bigint not null check (last_value > 0)
);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

-- Apply common metadata, RLS (deny until migration 2), and FK indexes consistently.
do $$
declare t record; fk record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now()', t.tablename);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t.tablename);
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
  for fk in
    select c.conrelid::regclass as tbl, a.attname as col
    from pg_constraint c join pg_namespace n on n.oid = c.connamespace
    cross join lateral unnest(c.conkey) k(attnum)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.contype = 'f' and n.nspname = 'public'
  loop
    execute format('create index on %s (%I)', fk.tbl, fk.col);
  end loop;
end;
$$;
create index services_status_type_idx on public.services(status, type);
create index quotes_status_start_date_idx on public.quotes(status, start_date);
create index quote_followups_pending_idx on public.quote_followups(responsible_id, scheduled_at) where not done;
create index ops_payables_due_idx on public.ops_supplier_payables(due_date) where status <> 'pagado';

-- Unverified signups never claim the bootstrap administrator's identity.
create function public.handle_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles(id, role)
    values (new.id, case when lower(new.email) = 'info@uyuniadventure.com'
      and new.email_confirmed_at is not null then 'admin'::public.app_role else 'vendedor'::public.app_role end);
  elsif old.email_confirmed_at is null and new.email_confirmed_at is not null
    and lower(new.email) = 'info@uyuniadventure.com' then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_auth_user();
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users for each row execute function public.handle_auth_user();
insert into public.profiles(id, role)
select id, case when lower(email) = 'info@uyuniadventure.com' and email_confirmed_at is not null
  then 'admin'::public.app_role else 'vendedor'::public.app_role end
from auth.users on conflict do nothing;
revoke all on function public.handle_auth_user() from public;
revoke all on function public.set_updated_at() from public;
commit;