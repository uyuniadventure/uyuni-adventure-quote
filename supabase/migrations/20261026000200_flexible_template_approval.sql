begin;

-- Administrative activation must not rewrite or validate imported economic data.
-- Keep every protection that prevents ordinary users from changing those fields.
create or replace function public.guard_template_economic_status() returns trigger
language plpgsql set search_path = '' as $$
declare
  trusted_import_write boolean := current_user not in ('authenticated','anon') and
    coalesce(current_setting('app.import_economic_write', true), '') = 'on';
  protected_new boolean;
  protected_old boolean := false;
begin
  protected_new := new.catalog_origin = 'importacion' and new.source_quote_id is null and (
    new.import_v2_route is not null or new.import_includes_id is not null or new.import_excludes_id is not null or
    exists (
      select 1 from public.import_rows r join public.import_batches b on b.id = r.batch_id
      where r.table_name = 'itinerary_templates' and r.payload->>'id' = new.id::text and b.kind = 'paquete_v2'
    )
  );
  if tg_op = 'UPDATE' then
    protected_old := old.catalog_origin = 'importacion' and old.source_quote_id is null and (
      old.import_v2_route is not null or old.import_includes_id is not null or old.import_excludes_id is not null or
      exists (
        select 1 from public.import_rows r join public.import_batches b on b.id = r.batch_id
        where r.table_name = 'itinerary_templates' and r.payload->>'id' = old.id::text and b.kind = 'paquete_v2'
      )
    );
  end if;

  if (protected_new or protected_old) and not trusted_import_write then
    if tg_op = 'INSERT' and not (
      new.economic_status in ('pending','blocked') and cardinality(new.economic_issues) > 0
    ) then
      raise exception 'Una plantilla importada nueva debe quedar pendiente o bloqueada con una razón económica.' using errcode = '42501';
    elsif tg_op = 'UPDATE' and not protected_old and not (
      new.economic_status in ('pending','blocked') and cardinality(new.economic_issues) > 0
    ) then
      raise exception 'Una plantilla convertida a importada debe quedar pendiente o bloqueada con una razón económica.' using errcode = '42501';
    elsif tg_op = 'UPDATE' and protected_old and (
      new.economic_status is distinct from old.economic_status or
      new.economic_issues is distinct from old.economic_issues
    ) then
      raise exception 'El estado económico importado solo puede cambiar mediante una importación validada.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.approve_templates(ids uuid[], accept_warnings boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  review jsonb;
  n integer;
begin
  perform public._check_catalog_action(ids);
  if accept_warnings is null then
    raise exception 'Indica si aceptas los avisos.' using errcode = '22023';
  end if;
  perform public._lock_catalog_approval();
  review := public.review_catalog_approval('templates', ids);
  update public.itinerary_templates t set
    status = case when accept_warnings or cardinality(r.reasons) = 0 then 'activo' else 'pendiente' end::public.catalog_status,
    approval_issues = r.reasons
  from jsonb_to_recordset(review->'items') r(id uuid, reasons text[])
  where t.id = r.id;
  select count(*)::int into n
  from jsonb_to_recordset(review->'items') r(id uuid, reasons text[])
  join public.itinerary_templates t on t.id = r.id
  where t.status = 'activo';
  return review || jsonb_build_object(
    'approved', n,
    'pending', jsonb_array_length(review->'items') - n,
    'accept_warnings', accept_warnings
  );
end;
$$;

revoke all on function public.approve_templates(uuid[],boolean) from public,anon;
grant execute on function public.approve_templates(uuid[],boolean) to authenticated;

-- Patch only the template policy in the current global approval implementation.
-- Services, locking, permissions, simulation and fingerprint mechanics stay intact.
do $patch$
declare
  definition text;
  old_fragment text;
begin
  definition := pg_get_functiondef('public.approve_valid_imports(boolean,text,boolean)'::regprocedure);

  if strpos(definition, 'import-approval-v4') = 0 then
    raise exception 'approve_valid_imports no contiene el fingerprint v4 esperado.';
  end if;
  definition := replace(definition, 'import-approval-v4', 'import-approval-v5');

  old_fragment := $old$
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

        ),$old$;
  if strpos(definition, old_fragment) = 0 then
    raise exception 'No se encontró el cálculo esperado de plantillas elegibles.';
  end if;
  definition := replace(definition, old_fragment, $new$
        'eligible', count(*) filter (
          where p_accept_warnings or cardinality(reasons) = 0
        ),$new$);

  old_fragment := $old$
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

        ),$old$;
  if strpos(definition, old_fragment) = 0 then
    raise exception 'No se encontró el cálculo esperado de plantillas pendientes.';
  end if;
  definition := replace(definition, old_fragment, $new$
        'remaining', count(*) filter (
          where not p_accept_warnings and cardinality(reasons) > 0
        ),$new$);

  old_fragment := $old$
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

      end::public.catalog_status,$old$;
  if strpos(definition, old_fragment) = 0 then
    raise exception 'No se encontró la actualización esperada del estado de plantillas.';
  end if;
  definition := replace(definition, old_fragment, $new$
      status = case
        when p_accept_warnings or cardinality(r.reasons) = 0 then 'activo'
        else 'pendiente'
      end::public.catalog_status,$new$);

  execute definition;
end;
$patch$;

revoke all on function public.approve_valid_imports(boolean,text,boolean) from public,anon;
grant execute on function public.approve_valid_imports(boolean,text,boolean) to authenticated;

commit;
