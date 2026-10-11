-- Only after 04_rack_to_net_preflight.sql reports and lists exactly 243 candidates.
-- Andrea, 2026-10-11: rack-only prices are accepted as net costs; preserve rack.
-- No net prices, notes, quote snapshots or other rows are overwritten.
begin;
lock table public.service_rates in share row exclusive mode;
create temporary table rack_to_net_candidates on commit drop as
  select id, price_rack from public.service_rates
  where price_net is null and price_rack is not null;

do $$
declare candidate_count integer;
begin
  select count(*) into candidate_count from rack_to_net_candidates;
  raise notice 'Filas a copiar de rack a neto: % (esperadas: 243)', candidate_count;
  if candidate_count <> 243 then
    raise exception 'Recuento no confirmado: se esperaban 243 tarifas con neto vacío y rack informado; hay %. No se actualiza ninguna tarifa.', candidate_count;
  end if;
end $$;

do $$
declare updated_count integer;
begin
  update public.service_rates r
    set price_net = c.price_rack, net_cost_missing = false
    from rack_to_net_candidates c
    where r.id = c.id and r.price_net is null and r.price_rack = c.price_rack;
  get diagnostics updated_count = row_count;
  if updated_count <> 243 then
    raise exception 'Se actualizaron % tarifas en vez de 243; se revierte la transacción.', updated_count;
  end if;
end $$;

select count(*)::integer as filas_actualizadas,
  bool_and(r.price_net = c.price_rack) as netos_copiados,
  bool_and(r.price_rack = c.price_rack) as racks_conservados
from public.service_rates r join rack_to_net_candidates c on c.id = r.id;
commit;
