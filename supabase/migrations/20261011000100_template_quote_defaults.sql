begin;
-- Configuration for a verified reference scenario. Existing templates keep {}.
alter table public.itinerary_templates add column quote_defaults jsonb not null default '{}'
  check (jsonb_typeof(quote_defaults) = 'object');
commit;
