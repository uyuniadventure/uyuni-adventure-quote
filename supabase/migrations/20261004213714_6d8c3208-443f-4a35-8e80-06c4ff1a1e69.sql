begin;
alter table public.itinerary_templates add column import_warnings jsonb not null default '[]';
alter table public.activity_module_translations add column reviewed boolean not null default false;
alter table public.day_block_items
  add column multi_day_span integer not null default 1 check (multi_day_span > 0),
  add column coverage_key text,
  add column coverage_start_day integer,
  add column pricing_config jsonb not null default '{}';
alter table public.quotes
  add column tour_sku text,
  add column pricing_config jsonb not null default '{}',
  add column calculation jsonb,
  add column document_snapshot jsonb not null default '{}';
alter table public.quote_items
  add column pricing_snapshot jsonb not null default '{}',
  add column supplier_id uuid references public.suppliers(id),
  add column total_cost_usd numeric(18,4),
  add column total_cost_local numeric(18,4);
create index quote_items_supplier_idx on public.quote_items(supplier_id);
-- Copies promoted from a quote retain their frozen service/rate configuration.
alter table public.day_block_items add column item_snapshot jsonb;
alter table public.quote_emails add column idempotency_key text unique;
commit;