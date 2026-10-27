
begin;

-- Administrative approval is independent from economic completeness.
-- This is the exact constraint created with public.services.
-- All other checks remain.
-- Existing rows are not updated by this migration.
alter table public.services drop constraint services_check;

-- ============================================================
-- 1. Individual and selected bulk approval
-- ============================================================

create or replace function public.approve_import_items(
  kind text,
  ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  review jsonb;
  n integer;
begin
  perform public._check_catalog_action(ids);
  perform public._lock_catalog_approval();

  review := public.review_import_items(kind, ids);

  if kind = 'services' then

    -- Services are approved regardless of economic warnings.
    -- Missing currency, pricing unit and rates remain unchanged.
    update public.services s
    set
      status = 'activo'::public.catalog_status,
      approval_issues = r.reasons
    from jsonb_to_recordset(review->'items')
      r(id uuid, reasons text[])
    where s.id = r.id;

    get diagnostics n = row_count;

  elsif kind = 'activity_modules' then

    -- Preserve the existing module approval rules.
    update public.activity_modules m
    set
      status = case
        when cardinality(r.reasons) = 0 then 'activo'
        else 'pendiente'
      end::public.catalog_status
    from jsonb_to_recordset(review->'items')
      r(id uuid, reasons text[])
    where m.id = r.id;

    n := (review->>'eligible')::int;

  else
    raise exception 'Tipo de revisión inválido.'
      using errcode = '22023';
  end if;

  return review || jsonb_build_object(
    'eligible', n,
    'approved', n,
    'pending', jsonb_array_length(review->'items') - n
  );
end;
$$;

revoke all
on function public.approve_import_items(text, uuid[])
from public, anon;

grant execute
on function public.approve_import_items(text, uuid[])
to authenticated;


-- ============================================================
-- 2. Global import approval
-- ============================================================

create or replace function public.approve_valid_imports(
  p_dry_run boolean default true,
  p_expected_fingerprint text default null,
  p_accept_warnings boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  review_date date :=
    (now() at time zone 'America/Santiago')::date;

  fingerprint text;
  result jsonb;
begin

  -- Only Admin can approve the entire import.
  if public.current_role() is distinct from 'admin' then
    raise exception
      'Solo Admin puede aprobar la importación en bloque.'
      using errcode = '42501';
  end if;

  if p_dry_run is null or p_accept_warnings is null then
    raise exception
      'Indica simulación/aplicación y si aceptas los avisos.'
      using errcode = '22023';
  end if;

  perform public._lock_catalog_approval();

  -- Fingerprint v4 invalidates confirmations from older policies.
  select md5(
    jsonb_build_array(
      'import-approval-v4',
      p_accept_warnings,
      review_date,
      auth.uid(),

      (
        select jsonb_agg(s order by s.id)
        from public.services s
      ),

      (
        select jsonb_agg(r order by r.id)
        from public.service_rates r
      ),

      (
        select jsonb_agg(t order by t.id)
        from public.itinerary_templates t
      ),

      (
        select jsonb_agg(t order by t.id)
        from public.template_day_items t
      ),

      (
        select jsonb_agg(t order by t.id)
        from public.template_segment_items t
      ),

      (
        select jsonb_agg(d order by d.id)
        from public.template_days d
      ),

      (
        select jsonb_agg(b order by b.id)
        from public.day_blocks b
      ),

      (
        select jsonb_agg(i order by i.id)
        from public.day_block_items i
      ),

      (
        select jsonb_agg(m order by m.id)
        from public.day_block_modules m
      ),

      (
        select jsonb_agg(m order by m.id)
        from public.activity_modules m
      ),

      (
        select jsonb_agg(i order by i.id)
        from public.activity_module_items i
      )
    )::text
  )
  into fingerprint;

  -- Applying changes requires a valid previous simulation.
  if not p_dry_run
     and p_expected_fingerprint is distinct from fingerprint then

    raise exception
      'La simulación falta o el catálogo cambió. Vuelve a simular antes de confirmar.'
      using errcode = '22023';

  end if;

  -- ==========================================================
  -- 3. Review pending services without blocking approval
  -- ==========================================================

  with service_review as (

    select
      s.id,
      s.sku as code,
      s.name,

      array_remove(
        array[

          case
            when s.pricing_unit is null
            then 'Sin unidad de cobro.'
          end,

          case
            when s.currency is null
            then 'Sin moneda.'
          end,

          -- Keep the warning used by individual approval.
          case
            when s.source = 'paquete_v2'
              and s.currency <> 'USD'
            then 'El paquete importado debe cotizarse en USD.'
          end,

          -- A disabled rate does not count as an available rate.
          case
            when not exists (

              select 1
              from public.service_rates r
              where r.service_id = s.id

                and r.pricing_enabled

                and (
                  r.valid_from is null
                  or r.valid_from <= review_date
                )

                and (
                  r.valid_to is null
                  or r.valid_to >= review_date
                )

                and coalesce(
                  r.price_net,
                  r.price_rack
                ) >= 0

                and coalesce(
                  r.price_net,
                  r.price_rack
                ) < 'Infinity'::numeric

            )
            then 'Sin tarifa vigente con costo neto o rack.'
          end

        ],
        null
      ) as reasons

    from public.services s
    where s.status = 'pendiente'

  ),

  -- Preserve the previous economic eligibility criterion
  -- exclusively for the template review.
  approved_services as (

    select id
    from public.services
    where status = 'activo'

    union

    select id
    from service_review
    where cardinality(reasons) = 0

  ),

  template_review as (

    select *
    from public._template_approval_rows(

      array(
        select id
        from public.itinerary_templates
        where status = 'pendiente'
      ),

      array(
        select id
        from approved_services
      )

    )

  )

  select jsonb_build_object(

    'dry_run', p_dry_run,
    'accept_warnings', p_accept_warnings,
    'review_date', review_date,
    'fingerprint', fingerprint,

    -- All pending services are eligible for approval,
    -- including services with missing economic data.
    'services', (

      select jsonb_build_object(

        'pending', count(*),
        'eligible', count(*),
        'remaining', 0,

        'items',
        coalesce(
          jsonb_agg(to_jsonb(s) order by code),
          '[]'::jsonb
        )

      )
      from service_review s

    ),

    -- Preserve the existing template approval protections.
    'templates', (

      select jsonb_build_object(

        'pending', count(*),

        'eligible', count(*) filter (

          where cardinality(reasons) = 0

          or (
            p_accept_warnings

            and not exists (

              select 1
              from unnest(reasons) reason
              where reason like 'Validación económica:%'

            )
          )

        ),

        'remaining', count(*) filter (

          where not (

            cardinality(reasons) = 0

            or (
              p_accept_warnings

              and not exists (

                select 1
                from unnest(reasons) reason
                where reason like 'Validación económica:%'

              )
            )

          )

        ),

        'items',
        coalesce(
          jsonb_agg(to_jsonb(t) order by code),
          '[]'::jsonb
        )

      )
      from template_review t

    )

  )
  into result;

  -- ==========================================================
  -- 4. Apply approval only after fingerprint validation
  -- ==========================================================

  if not p_dry_run then

    -- Approve every pending service.
    -- Preserve warnings without modifying economic data.
    update public.services s
    set
      status = 'activo'::public.catalog_status,
      approval_issues = r.reasons

    from jsonb_to_recordset(
      result #> '{services,items}'
    ) as r(
      id uuid,
      reasons text[]
    )

    where s.id = r.id;

    -- Templates retain their separate economic rules.
    update public.itinerary_templates t
    set

      status = case

        when cardinality(r.reasons) = 0

          or (

            p_accept_warnings

            and not exists (

              select 1
              from unnest(r.reasons) reason
              where reason like 'Validación económica:%'

            )

          )

        then 'activo'

        else 'pendiente'

      end::public.catalog_status,

      approval_issues = r.reasons

    from jsonb_to_recordset(
      result #> '{templates,items}'
    ) as r(
      id uuid,
      reasons text[]
    )

    where t.id = r.id;

  end if;

  return result;

end;
$$;

revoke all
on function public.approve_valid_imports(boolean, text, boolean)
from public, anon;

grant execute
on function public.approve_valid_imports(boolean, text, boolean)
to authenticated;

commit;
