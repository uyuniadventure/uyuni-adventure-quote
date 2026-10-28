begin;

-- The consolidated workbook contains priced scenarios, not reusable manual day
-- blocks. Keep both models separate: a scenario day may link to a manual block,
-- but its visible code is only unique inside its exact year/season/pax scenario.
alter table public.service_rates alter column season drop not null;
alter table public.service_rates
  add column rate_year integer check (rate_year between 2000 and 9999),
  add column import_key text unique,
  add column source_sheet text,
  add column source_ref jsonb not null default '{}'::jsonb,
  add column source_currency text,
  add column source_price_usd numeric(18,4) check (source_price_usd >= 0),
  add column source_price_net numeric(18,4) check (source_price_net >= 0),
  add column exclusion_text text,
  add column date_exclusions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(date_exclusions) = 'array');
alter table public.service_rates add constraint consolidated_rate_requires_net
  check (import_key is null or price_net is not null or not pricing_enabled);

comment on column public.service_rates.season is
  'NULL means unknown/blank at source and MUST NOT be treated as ALL.';
comment on column public.service_rates.source_price_usd is
  'Original PRECIO_USD value. It has precedence when present.';
comment on column public.service_rates.source_price_net is
  'Original Price NETO value in source_currency; Valor RACK is never copied here.';
comment on column public.service_rates.date_exclusions is
  'Explicit date ranges only. Unparsed prose remains in exclusion_text and makes automatic applicability unsafe.';
comment on constraint consolidated_rate_requires_net on public.service_rates is
  'Consolidated imports with no selected net cost remain pending; price_rack alone can never activate them.';
create index service_rates_resolution_idx on public.service_rates
  (service_id, rate_year, season, pax_min, pax_max, valid_from, valid_to);

create table public.tour_cost_scenarios (
  id uuid primary key default gen_random_uuid(),
  tour_sku text not null check (nullif(btrim(tour_sku), '') is not null and tour_sku = btrim(tour_sku)),
  rate_year integer not null check (rate_year between 2000 and 9999),
  season text not null check (nullif(btrim(season), '') is not null and season = upper(btrim(season))),
  pax integer not null check (pax between 1 and 999),
  template_id uuid references public.itinerary_templates(id) on delete set null,
  status public.catalog_status not null default 'pendiente',
  import_key text not null unique check (nullif(btrim(import_key), '') is not null),
  source_revision text,
  source_ref jsonb not null default '{}'::jsonb check (jsonb_typeof(source_ref) = 'object'),
  import_fingerprint text not null check (nullif(btrim(import_fingerprint), '') is not null),
  manually_modified_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_sku, rate_year, season, pax)
);

create table public.tour_cost_scenario_days (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.tour_cost_scenarios(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  visible_code text not null check (nullif(btrim(visible_code), '') is not null),
  block_id uuid references public.day_blocks(id) on delete set null,
  route_from text,
  route_to text,
  places text[] not null default '{}',
  title text,
  description text,
  source_ref jsonb not null default '{}'::jsonb check (jsonb_typeof(source_ref) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_id, day_number),
  unique (scenario_id, visible_code),
  unique (id, scenario_id)
);

create table public.tour_cost_scenario_lines (
  id uuid primary key default gen_random_uuid(),
  scenario_day_id uuid not null references public.tour_cost_scenario_days(id) on delete cascade,
  line_key text not null check (nullif(btrim(line_key), '') is not null),
  service_id uuid references public.services(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete restrict,
  unresolved_service_ref text,
  description text not null,
  quantity numeric(12,4) not null check (quantity > 0),
  billing_unit text not null check (billing_unit in
    ('PER_PERSON','PER_GROUP','PER_ROOM','PER_ROOM_PER_DAY','PER_SERVICE','PER_UNIT')),
  cost_basis text not null check (cost_basis in ('UNIT_RATE','LINE_TOTAL')),
  reference_unit_cost numeric(18,4) check (reference_unit_cost >= 0),
  original_amount numeric(18,4) check (original_amount >= 0),
  original_currency text,
  amount_usd numeric(18,4) check (amount_usd >= 0),
  charge_once_key text,
  source_ref jsonb not null default '{}'::jsonb check (jsonb_typeof(source_ref) = 'object'),
  resolution_issue text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_day_id, line_key),
  check (service_id is not null or nullif(btrim(unresolved_service_ref), '') is not null),
  check (original_amount is not null or amount_usd is null)
);

create table public.tour_cost_scenario_issues (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.tour_cost_scenarios(id) on delete cascade,
  scenario_day_id uuid,
  line_key text,
  code text not null,
  detail text not null,
  source_ref jsonb not null default '{}'::jsonb check (jsonb_typeof(source_ref) = 'object'),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (scenario_day_id, scenario_id)
    references public.tour_cost_scenario_days(id, scenario_id) on delete cascade,
  check ((resolved_at is null) = (resolved_by is null))
);

comment on table public.tour_cost_scenarios is
  'Exact imported economic scenario. Identity is tour_sku + year + season + pax; no fallback is allowed.';
comment on column public.tour_cost_scenario_lines.cost_basis is
  'LINE_TOTAL preserves Andrea''s already-totalled amount. UNIT_RATE is multiplied only by the explicit billing unit.';
comment on column public.tour_cost_scenario_lines.charge_once_key is
  'Shared by appearances of one multi-day purchase so quote preparation charges it once.';
comment on column public.tour_cost_scenarios.manually_modified_at is
  'A future reimport must not overwrite this row without an explicit conflict workflow.';

create function public.validate_tour_scenario_day_code() returns trigger
language plpgsql set search_path = '' as $$
declare expected text;
begin
  select s.tour_sku || '-P' || s.pax || '-D' || new.day_number into expected
  from public.tour_cost_scenarios s where s.id = new.scenario_id;
  if new.visible_code is distinct from expected then
    raise exception 'Código de día inválido: se esperaba %.', expected using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_tour_scenario_day_code before insert or update
  on public.tour_cost_scenario_days for each row execute function public.validate_tour_scenario_day_code();
revoke all on function public.validate_tour_scenario_day_code() from public;

create function public.guard_tour_scenario_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.tour_sku, new.rate_year, new.season, new.pax) is distinct from
     (old.tour_sku, old.rate_year, old.season, old.pax)
     and exists (select 1 from public.tour_cost_scenario_days d where d.scenario_id = old.id) then
    raise exception 'No se puede cambiar la identidad de un escenario con días; crea otra revisión.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger guard_tour_scenario_identity before update of tour_sku, rate_year, season, pax
  on public.tour_cost_scenarios for each row execute function public.guard_tour_scenario_identity();
revoke all on function public.guard_tour_scenario_identity() from public;

create index tour_cost_scenarios_template_idx on public.tour_cost_scenarios(template_id);
create index tour_cost_scenarios_created_by_idx on public.tour_cost_scenarios(created_by);
create index tour_cost_scenario_days_block_idx on public.tour_cost_scenario_days(block_id);
create index tour_cost_scenario_lines_service_idx on public.tour_cost_scenario_lines(service_id);
create index tour_cost_scenario_lines_supplier_idx on public.tour_cost_scenario_lines(supplier_id);
create index tour_cost_scenario_lines_charge_once_idx on public.tour_cost_scenario_lines(charge_once_key)
  where charge_once_key is not null;
create index tour_cost_scenario_issues_day_idx on public.tour_cost_scenario_issues(scenario_day_id)
  where scenario_day_id is not null;
create index tour_cost_scenario_issues_resolved_by_idx on public.tour_cost_scenario_issues(resolved_by)
  where resolved_by is not null;

create trigger set_updated_at before update on public.tour_cost_scenarios
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tour_cost_scenario_days
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tour_cost_scenario_lines
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tour_cost_scenario_issues
  for each row execute function public.set_updated_at();

alter table public.tour_cost_scenarios enable row level security;
alter table public.tour_cost_scenario_days enable row level security;
alter table public.tour_cost_scenario_lines enable row level security;
alter table public.tour_cost_scenario_issues enable row level security;

create policy scenario_read on public.tour_cost_scenarios for select to authenticated
using (public.current_role() in ('admin','operacion') or status = 'activo' or created_by = auth.uid());
create policy scenario_manage on public.tour_cost_scenarios for all to authenticated
using (public.current_role() in ('admin','operacion') or (created_by = auth.uid() and status = 'pendiente'))
with check (public.current_role() in ('admin','operacion') or (created_by = auth.uid() and status = 'pendiente'));

create policy scenario_days_read on public.tour_cost_scenario_days for select to authenticated
using (exists (select 1 from public.tour_cost_scenarios s where s.id = scenario_id));
create policy scenario_days_manage on public.tour_cost_scenario_days for all to authenticated
using (exists (select 1 from public.tour_cost_scenarios s where s.id = scenario_id and
  (public.current_role() in ('admin','operacion') or (s.created_by = auth.uid() and s.status = 'pendiente'))))
with check (exists (select 1 from public.tour_cost_scenarios s where s.id = scenario_id and
  (public.current_role() in ('admin','operacion') or (s.created_by = auth.uid() and s.status = 'pendiente'))));

create policy scenario_lines_read on public.tour_cost_scenario_lines for select to authenticated
using (exists (select 1 from public.tour_cost_scenario_days d join public.tour_cost_scenarios s on s.id=d.scenario_id
  where d.id = scenario_day_id));
create policy scenario_lines_manage on public.tour_cost_scenario_lines for all to authenticated
using (exists (select 1 from public.tour_cost_scenario_days d join public.tour_cost_scenarios s on s.id=d.scenario_id
  where d.id = scenario_day_id and (public.current_role() in ('admin','operacion') or
    (s.created_by = auth.uid() and s.status = 'pendiente'))))
with check (exists (select 1 from public.tour_cost_scenario_days d join public.tour_cost_scenarios s on s.id=d.scenario_id
  where d.id = scenario_day_id and (public.current_role() in ('admin','operacion') or
    (s.created_by = auth.uid() and s.status = 'pendiente'))));

create policy scenario_issues_read on public.tour_cost_scenario_issues for select to authenticated
using (exists (select 1 from public.tour_cost_scenarios s where s.id = scenario_id));
create policy scenario_issues_manage on public.tour_cost_scenario_issues for all to authenticated
using (public.current_role() in ('admin','operacion'))
with check (public.current_role() in ('admin','operacion'));

grant select, insert, update, delete on public.tour_cost_scenarios,
  public.tour_cost_scenario_days, public.tour_cost_scenario_lines,
  public.tour_cost_scenario_issues to authenticated;

commit;
