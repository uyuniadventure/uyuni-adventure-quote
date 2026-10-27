begin;

-- Administrative activation and economic completeness are independent. Keep the
-- exact-source/permission/atomicity checks, but allow an approved itinerary to
-- become an editable draft even when a day has no billable rows yet.
do $patch$
declare
  definition text;
  empty_start integer;
  empty_end integer;
  mandatory_marker text := ') links where not exists (';
  hotel_marker text := 'where d.template_id=p_template and d.day_number=n and b.hotel_service_id is not null';
begin
  definition := replace(
    pg_get_functiondef(
      'public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure
    ),
    chr(13),
    ''
  );

  empty_start := position(
    '    if jsonb_typeof(day->''items'') is distinct from ''array'' or' in definition
  );
  empty_end := position(
    '    if exists(select 1 from public.template_days d join public.day_block_modules' in definition
  );
  if empty_start = 0 or empty_end <= empty_start then
    raise exception 'create_quote_from_template incompatible: no se encontró el control de días vacíos.';
  end if;
  definition := substring(definition from 1 for empty_start - 1) ||
    '    if jsonb_typeof(day->''items'') is distinct from ''array'' then' || chr(10) ||
    '      raise exception ''Día %: la copia de servicios no es una lista.'',n;' || chr(10) ||
    '    end if;' || chr(10) ||
    substring(definition from empty_end);

  if position(mandatory_marker in definition) = 0 then
    raise exception 'create_quote_from_template incompatible: no se encontró el control de enlaces.';
  end if;
  definition := replace(
    definition,
    mandatory_marker,
    ') links where exists (' || chr(10) ||
      '        select 1 from public.services source_service' || chr(10) ||
      '        where source_service.id=(links.source->>''service_id'')::uuid' || chr(10) ||
      '          and source_service.pricing_unit is not null and source_service.currency is not null' || chr(10) ||
      '      ) and not exists ('
  );

  if position(hotel_marker in definition) = 0 then
    raise exception 'create_quote_from_template incompatible: no se encontró el control de hotel.';
  end if;
  definition := replace(
    definition,
    hotel_marker,
    hotel_marker || chr(10) ||
      '      and exists(select 1 from public.services source_service where source_service.id=b.hotel_service_id' || chr(10) ||
      '        and source_service.pricing_unit is not null and source_service.currency is not null)'
  );

  execute definition;
end;
$patch$;

commit;
