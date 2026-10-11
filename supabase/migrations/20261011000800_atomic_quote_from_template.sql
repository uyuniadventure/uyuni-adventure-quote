begin;

-- Sellers need to read the FX used for their frozen quote. Management remains
-- governed by the existing Admin policy; this grants no insert/update/delete.
create policy exchange_rates_quote_read on public.exchange_rates
  for select to authenticated using (public.current_role() is not null);

-- Private read model used to detect edits between read-only TS preparation and
-- the single write RPC. The calculator remains the pure TypeScript engine.
create function public.quote_template_source(p_template uuid, p_client uuid) returns jsonb
language sql stable set search_path='' as $$
with td as (select * from public.template_days where template_id=p_template),
b as (select * from public.day_blocks where id in (select block_id from td)),
bi as (select * from public.day_block_items where block_id in (select id from b)),
bm as (select * from public.day_block_modules where block_id in (select id from b)),
m as (select * from public.activity_modules where id in (select module_id from bm)),
mi as (select * from public.activity_module_items where module_id in (select id from m)),
s as (select * from public.services where id in (
  select service_id from bi union select service_id from mi union select hotel_service_id from b
))
select jsonb_build_object(
  'template',(select to_jsonb(t) from public.itinerary_templates t where id=p_template),
  'client',(select to_jsonb(c) from public.clients c where id=p_client),
  'settings',(select coalesce(jsonb_agg(x order by id),'[]') from public.pricing_settings x),
  'fx',(select coalesce(jsonb_agg(x order by id),'[]') from public.exchange_rates x),
  'templateDays',(select coalesce(jsonb_agg(x order by id),'[]') from td x),
  'blocks',(select coalesce(jsonb_agg(x order by id),'[]') from b x),
  'texts',(select coalesce(jsonb_agg(x order by id),'[]') from public.day_block_translations x where block_id in (select id from b)),
  'items',(select coalesce(jsonb_agg(x order by id),'[]') from bi x),
  'links',(select coalesce(jsonb_agg(x order by id),'[]') from bm x),
  'modules',(select coalesce(jsonb_agg(x order by id),'[]') from m x),
  'moduleTexts',(select coalesce(jsonb_agg(x order by id),'[]') from public.activity_module_translations x where module_id in (select id from m)),
  'moduleItems',(select coalesce(jsonb_agg(x order by id),'[]') from mi x),
  'services',(select coalesce(jsonb_agg(x order by id),'[]') from s x),
  'rates',(select coalesce(jsonb_agg(x order by id),'[]') from public.service_rates x where service_id in (select id from s))
);
$$;
revoke all on function public.quote_template_source(uuid,uuid) from public,anon,authenticated;

create or replace function public.create_quote_snapshot(p_quote jsonb,p_days jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; d jsonb; item jsonb; did uuid;
begin
  if p_quote->>'template_id' is not null then
    raise exception 'Usa create_quote_from_template para copiar una plantilla y guardar su cálculo atómicamente.';
  end if;
  insert into public.quotes(code,template_id,client_id,client_type,language,start_date,pax_paying,tc_count,category,
    tour_sku,rooming,vehicles,staff,fx_snapshot,margin_pct,margin_mode,rounding_rule,pricing_config,document_snapshot,pax_scenarios,
    deposit_pct,balance_due_days,card_surcharge_pct,payment_schedule)
  values(public.next_quote_code(p_quote->>'tour_sku',p_quote->>'language'),(p_quote->>'template_id')::uuid,
    (p_quote->>'client_id')::uuid,(p_quote->>'client_type')::public.client_type,p_quote->>'language',
    (p_quote->>'start_date')::date,(p_quote->>'pax_paying')::integer,coalesce((p_quote->>'tc_count')::integer,0),
    (p_quote->>'category')::public.tour_category,p_quote->>'tour_sku',p_quote->'rooming',p_quote->'vehicles',
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

create function public.create_quote_from_template(
  p_template uuid, p_quote jsonb, p_days jsonb, p_source jsonb, p_result jsonb
) returns public.quotes
language plpgsql security definer set search_path='' as $$
declare
  template public.itinerary_templates; q public.quotes; item public.quote_items;
  day jsonb; line jsonb; mapped jsonb := '[]'; total_name text; n int;
begin
  if auth.uid() is null or public.current_role() is null or
    public.current_role() not in ('admin','operacion','vendedor') then
    raise exception 'Usuario sin permiso para crear cotizaciones.' using errcode='42501';
  end if;
  -- A definer is needed for catalog locks, not for caller-chosen ownership.
  -- All rows inserted below belong to auth.uid(); the source must be exactly the
  -- catalog visible during preparation. No writes are made to that catalog.
  lock table public.itinerary_templates, public.template_days, public.day_blocks,
    public.day_block_translations, public.day_block_items, public.day_block_modules,
    public.activity_modules, public.activity_module_translations, public.activity_module_items,
    public.services, public.service_rates, public.clients, public.pricing_settings,
    public.exchange_rates in share mode;
  select * into template from public.itinerary_templates where id=p_template;
  if not found or template.status<>'activo' then
    raise exception 'La plantilla no está aprobada.' using errcode='22023';
  end if;
  if p_source is distinct from public.quote_template_source(p_template,(p_quote->>'client_id')::uuid) then
    raise exception 'La plantilla, las tarifas o las condiciones cambiaron; vuelve a crear la cotización.' using errcode='40001';
  end if;
  if p_source->'client' = 'null'::jsonb then raise exception 'Cliente no disponible.'; end if;
  if public.current_role()='vendedor' and exists (
    select 1 from jsonb_to_recordset(p_source->'services') s(status text,created_by uuid)
    where s.status<>'activo' and s.created_by is distinct from auth.uid()
  ) then raise exception 'Servicio no accesible.' using errcode='42501'; end if;
  if (select count(*) from public.template_days where template_id=p_template)<>template.days
    or exists(select 1 from generate_series(1,template.days) as expected(day_number) where not exists (
      select 1 from public.template_days d where d.template_id=p_template and d.day_number=expected.day_number)) then
    raise exception 'La plantilla no tiene todos sus días consecutivos.';
  end if;
  if jsonb_typeof(p_days) is distinct from 'array' or jsonb_array_length(p_days)<>template.days then
    raise exception 'Copia de días incompleta.';
  end if;
  if (select count(distinct (x->>'day_number')::int) from jsonb_array_elements(p_days) x)<>template.days then
    raise exception 'Días duplicados.';
  end if;
  for day in select value from jsonb_array_elements(p_days) loop
    n:=(day->>'day_number')::int;
    if not exists(select 1 from public.template_days d join public.day_blocks b on b.id=d.block_id
      where d.template_id=p_template and d.day_number=n and b.status<>'inactivo'
        and (day->'snapshot'->'source_day')=to_jsonb(d) and (day->'snapshot'->'block')=to_jsonb(b)) then
      raise exception 'Día %: bloque no disponible o copia distinta del origen.',n;
    end if;
    if jsonb_typeof(day->'items') is distinct from 'array' or jsonb_array_length(day->'items')=0
      or not exists (
        select 1 from public.template_days d join public.day_blocks b on b.id=d.block_id
        where d.template_id=p_template and d.day_number=n and (
          b.hotel_service_id is not null or exists(select 1 from public.day_block_items i where i.block_id=b.id)
          or exists(select 1 from public.day_block_modules l join public.activity_module_items i on i.module_id=l.module_id where l.block_id=b.id))) then
      raise exception 'Día %: sin servicios.',n;
    end if;
    if exists(select 1 from public.template_days d join public.day_block_modules l on l.block_id=d.block_id
      join public.activity_modules m on m.id=l.module_id where d.template_id=p_template and d.day_number=n
      and (m.status='inactivo' or not exists(select 1 from public.activity_module_items i where i.module_id=m.id))) then
      raise exception 'Día %: módulo vacío o no disponible.',n;
    end if;
    -- Do not silently omit a catalog link, including optional/excluded services.
    if exists (
      select 1 from (
        select to_jsonb(i) source from public.template_days d join public.day_block_items i on i.block_id=d.block_id
          where d.template_id=p_template and d.day_number=n
        union all
        select to_jsonb(i) source from public.template_days d join public.day_block_modules l on l.block_id=d.block_id
          join public.activity_module_items i on i.module_id=l.module_id
          where d.template_id=p_template and d.day_number=n
      ) links where not exists (
        select 1 from jsonb_array_elements(day->'items') copied
        where copied->'pricing_snapshot'->'_source_link'=links.source
          and (copied->>'qty')::numeric=(links.source->>'qty')::numeric
      )
    ) then raise exception 'Día %: faltan servicios o sus cantidades no coinciden.',n; end if;
    if exists(select 1 from public.template_days d join public.day_blocks b on b.id=d.block_id
      where d.template_id=p_template and d.day_number=n and b.hotel_service_id is not null
      and not exists(select 1 from jsonb_array_elements(day->'items') copied
        where (copied->>'service_id')::uuid=b.hotel_service_id)) then
      raise exception 'Día %: falta el alojamiento.',n;
    end if;
  end loop;
  if p_result->>'status' is distinct from 'ok' or public.calculation_has_errors(p_result)
    or jsonb_typeof(p_result->'items') is distinct from 'array' then
    raise exception 'El cálculo no está completo.';
  end if;
  foreach total_name in array array['total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp'] loop
    if p_result->>total_name is null or not ((p_result->>total_name)::numeric>=0 and (p_result->>total_name)::numeric<'Infinity'::numeric) then
      raise exception 'Falta un total válido: %.',total_name;
    end if;
  end loop;
  -- The existing low-level constructor only accepts free-form quotes after this
  -- migration. Assign provenance here, inside this transaction, after validation.
  p_quote := (p_quote - 'template_id') || jsonb_build_object('tour_sku',template.sku,
    'category',template.category,'client_type',p_source->'client'->>'type');
  q:=public.create_quote_snapshot(p_quote,p_days);
  update public.quotes set template_id=p_template where id=q.id returning * into q;
  if (p_result->'pricing_policy'->>'margin_pct')::numeric is distinct from q.margin_pct
    or p_result->'pricing_policy'->>'margin_mode' is distinct from q.margin_mode::text
    or (p_result->'pricing_policy'->>'commission_pct')::numeric is distinct from q.commission_pct
    or p_result->'pricing_policy'->>'commission_mode' is distinct from q.commission_mode::text then
    raise exception 'La política de precio no coincide con el cálculo.';
  end if;
  for line in select value from jsonb_array_elements(p_result->'items') loop
    select i.* into strict item from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
      where d.quote_id=q.id and i.pricing_snapshot->>'_creation_item_id'=line->>'id';
    if not exists(select 1 from public.quote_days d where d.id=item.quote_day_id
      and d.day_number=(line->>'day_number')::int and d.date=(line->>'date')::date) then
      raise exception 'La fecha del cálculo no coincide con el día.';
    end if;
    mapped:=mapped || jsonb_build_array(line || jsonb_build_object('id',item.id));
  end loop;
  p_result:=jsonb_set(p_result,'{items}',mapped);
  select * into strict q from public.quotes where id=q.id;
  return public.save_quote_calculation(q.id,q.updated_at,p_result);
end;
$$;
revoke all on function public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb) to authenticated;

commit;
