begin;

alter table public.services add column approval_issues text[] not null default '{}';
alter table public.itinerary_templates add column approval_issues text[] not null default '{}';
comment on column public.services.approval_issues is 'Reasons from the last applied bulk review; simulation never persists them.';
comment on column public.itinerary_templates.approval_issues is 'Reasons from the last applied bulk review; original import warnings are preserved.';

create function public.approve_valid_imports(
  p_dry_run boolean default true,
  p_expected_fingerprint text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  review_date date := (now() at time zone 'America/Santiago')::date;
  fingerprint text;
  result jsonb;
begin
  if public.current_role() is distinct from 'admin' then
    raise exception 'Solo Admin puede aprobar la importación en bloque.' using errcode = '42501';
  end if;
  if p_dry_run is null then
    raise exception 'Indica simulación o aplicación.' using errcode = '22023';
  end if;

  -- Serialize reviews and prevent edits of rates/dependencies between validation
  -- and updates. Ordinary catalog reads remain available. No persistent writes
  -- occur in simulation. Any exception rolls back the entire apply RPC.
  lock table public.services, public.service_rates, public.itinerary_templates,
    public.template_days, public.day_blocks, public.day_block_items,
    public.day_block_modules, public.activity_modules, public.activity_module_items
    in share row exclusive mode;

  select md5(jsonb_build_array(review_date, auth.uid(),
    (select jsonb_agg(s order by s.id) from public.services s),
    (select jsonb_agg(r order by r.id) from public.service_rates r),
    (select jsonb_agg(t order by t.id) from public.itinerary_templates t),
    (select jsonb_agg(d order by d.id) from public.template_days d),
    (select jsonb_agg(b order by b.id) from public.day_blocks b),
    (select jsonb_agg(i order by i.id) from public.day_block_items i),
    (select jsonb_agg(m order by m.id) from public.day_block_modules m),
    (select jsonb_agg(m order by m.id) from public.activity_modules m),
    (select jsonb_agg(i order by i.id) from public.activity_module_items i)
  )::text) into fingerprint;
  if not p_dry_run and p_expected_fingerprint is distinct from fingerprint then
    raise exception 'La simulación falta o el catálogo cambió. Vuelve a simular antes de confirmar.'
      using errcode = '22023';
  end if;

  with service_review as (
    select s.id, s.sku as code, s.name,
      array_remove(array[
        case when s.pricing_unit is null then 'Sin unidad de cobro.' end,
        case when s.currency is null then 'Sin moneda.' end,
        case when not exists (
          select 1 from public.service_rates r where r.service_id = s.id
            and (r.valid_from is null or r.valid_from <= review_date)
            and (r.valid_to is null or r.valid_to >= review_date)
            -- Rack is a valid cost per Andrea, 2026-10-11. Explicit zero is valid.
            and coalesce(r.price_net, r.price_rack) >= 0
            and coalesce(r.price_net, r.price_rack) < 'Infinity'::numeric
        ) then 'Sin tarifa vigente con costo neto o rack.' end
      ], null) as reasons
    from public.services s where s.status = 'pendiente'
  ), approved_services as (
    select id from public.services where status = 'activo'
    union select id from service_review where cardinality(reasons) = 0
  ), block_services as (
    select block_id, service_id from public.day_block_items
    union select block_id, i.service_id from public.day_block_modules m
      join public.activity_module_items i on i.module_id = m.module_id
    union select id, hotel_service_id from public.day_blocks where hotel_service_id is not null
  ), template_review as (
    select t.id, t.sku as code, t.name, array(
      select reason from (
        select 'Los días deben cubrir del 1 al ' || t.days || ' sin huecos ni días extra.' as reason
        where (select count(*) from public.template_days d where d.template_id = t.id) <> t.days
          or exists (select 1 from public.template_days d where d.template_id = t.id and d.day_number > t.days)
        union all
        select 'Día ' || d.day_number || ': sin servicios.'
        from public.template_days d where d.template_id = t.id
          and not exists (select 1 from block_services bs where bs.block_id = d.block_id)
        union all
        select 'Día ' || d.day_number || ': bloque inactivo (' || b.code || ').'
        from public.template_days d join public.day_blocks b on b.id = d.block_id
        where d.template_id = t.id and b.status = 'inactivo'
        union all
        select 'Día ' || d.day_number || ': módulo inactivo o vacío (' || a.code || ').'
        from public.template_days d join public.day_block_modules m on m.block_id = d.block_id
        join public.activity_modules a on a.id = m.module_id
        where d.template_id = t.id and (a.status = 'inactivo' or not exists (
          select 1 from public.activity_module_items i where i.module_id = a.id))
        union all
        select 'Día ' || d.day_number || ': servicio no aprobado (' || s.sku || ').'
        from public.template_days d join block_services bs on bs.block_id = d.block_id
        join public.services s on s.id = bs.service_id
        where d.template_id = t.id and not exists (select 1 from approved_services a where a.id = s.id)
      ) reasons order by reason
    ) as reasons
    from public.itinerary_templates t where t.status = 'pendiente'
  )
  select jsonb_build_object(
    'dry_run', p_dry_run, 'review_date', review_date, 'fingerprint', fingerprint,
    'services', (select jsonb_build_object(
      'pending', count(*), 'eligible', count(*) filter (where cardinality(reasons) = 0),
      'remaining', count(*) filter (where cardinality(reasons) > 0),
      'items', coalesce(jsonb_agg(to_jsonb(s) order by code), '[]'::jsonb)) from service_review s),
    'templates', (select jsonb_build_object(
      'pending', count(*), 'eligible', count(*) filter (where cardinality(reasons) = 0),
      'remaining', count(*) filter (where cardinality(reasons) > 0),
      'items', coalesce(jsonb_agg(to_jsonb(t) order by code), '[]'::jsonb)) from template_review t)
  ) into result;

  if not p_dry_run then
    update public.services s set
      status = case when cardinality(r.reasons) = 0 then 'activo' else 'pendiente' end::public.catalog_status,
      approval_issues = r.reasons
    from jsonb_to_recordset(result #> '{services,items}') as r(id uuid, reasons text[])
    where s.id = r.id;
    update public.itinerary_templates t set
      status = case when cardinality(r.reasons) = 0 then 'activo' else 'pendiente' end::public.catalog_status,
      approval_issues = r.reasons
    from jsonb_to_recordset(result #> '{templates,items}') as r(id uuid, reasons text[])
    where t.id = r.id;
  end if;
  return result;
end;
$$;
revoke all on function public.approve_valid_imports(boolean, text) from public, anon;
grant execute on function public.approve_valid_imports(boolean, text) to authenticated;

-- An approved template must remain readable all the way down to its items by a
-- seller who did not create it. Do not promote blocks/modules or change texts.
create policy approved_template_blocks_read on public.day_blocks for select to authenticated
using (public.current_role() = 'vendedor' and exists (
  select 1 from public.template_days d join public.itinerary_templates t on t.id = d.template_id
  where d.block_id = day_blocks.id and t.status = 'activo'
));
create policy approved_template_modules_read on public.activity_modules for select to authenticated
using (public.current_role() = 'vendedor' and exists (
  select 1 from public.day_block_modules m
  join public.template_days d on d.block_id = m.block_id
  join public.itinerary_templates t on t.id = d.template_id
  where m.module_id = activity_modules.id and t.status = 'activo'
));

commit;
