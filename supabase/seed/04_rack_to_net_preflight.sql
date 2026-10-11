-- READ ONLY. Run in Lovable Cloud SQL Editor BEFORE 20261011000200_rack_to_net.sql.
-- Andrea's requested count is 243. A legacy flag is NOT an empty net price.
select
  count(*) filter (where price_net is null and price_rack is not null)::integer as filas_a_copiar,
  count(*) filter (where price_net is null and price_rack is not null) = 243 as confirma_243,
  count(*) filter (where net_cost_missing and price_net = price_rack)::integer as rack_ya_copiado_con_marca_historica,
  count(*) filter (where price_net is null and price_rack is null)::integer as sin_neto_ni_rack
from public.service_rates;

select r.id as tarifa_id, s.sku, s.name as servicio, s.currency,
  r.season, r.valid_from, r.valid_to, r.pax_min, r.pax_max,
  r.price_net as neto_actual, r.price_rack as rack_conservado,
  r.price_rack as neto_propuesto
from public.service_rates r join public.services s on s.id = r.service_id
where r.price_net is null and r.price_rack is not null
order by s.sku, r.id;
