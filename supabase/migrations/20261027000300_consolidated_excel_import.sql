-- UyuniQuote - Fase 3 (revision de seguridad, 2026-10-28)
-- IMPORTANTE: esta migracion sustituye la version 00300 todavia NO aplicada.
-- No volver a ejecutar si 00300 ya fue aplicada. Requiere 00200 completa.
-- Una reimportacion con filas modificadas se rechaza con error explicito:
-- nunca se sobreescriben cambios manuales ni se omiten diferencias.
begin;

alter table public.day_blocks
  add column excel_import_key text unique,
  add column excel_import_fingerprint text,
  add column manually_modified_at timestamptz;
alter table public.itinerary_templates
  add column excel_import_key text unique,
  add column excel_import_fingerprint text,
  add column manually_modified_at timestamptz;
alter table public.tour_cost_scenario_issues
  add column import_key text unique,
  add column issue_type text not null default 'technical'
    check (issue_type in ('identification','missing_price','date_exclusion','reconciliation','technical'));

alter table public.tour_cost_scenarios
  add column approved_cost_usd numeric(18,6) check (approved_cost_usd >= 0),
  add column detail_cost_usd numeric(18,6) check (detail_cost_usd >= 0),
  add column cost_difference_usd numeric(18,6),
  add column reconciliation_status text not null default 'matched'
    check (reconciliation_status in ('matched','difference')),
  add constraint tour_cost_scenarios_cost_reconciliation check (
    (approved_cost_usd is null and detail_cost_usd is null and cost_difference_usd is null)
    or (
      approved_cost_usd is not null and detail_cost_usd is not null and cost_difference_usd is not null
      and abs((detail_cost_usd - approved_cost_usd) - cost_difference_usd) <= 0.01
      and reconciliation_status = case when abs(cost_difference_usd) <= 0.01 then 'matched' else 'difference' end
    )
  );

alter table public.quotes
  add column cost_scenario_id uuid references public.tour_cost_scenarios(id) on delete set null,
  add column cost_scenario_warnings jsonb not null default '[]'::jsonb
    check (jsonb_typeof(cost_scenario_warnings) = 'array');
create index quotes_cost_scenario_idx on public.quotes(cost_scenario_id)
  where cost_scenario_id is not null;

create table public.consolidated_import_runs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  source_sha256 text not null unique check (source_sha256 ~ '^[0-9a-f]{64}$'),
  schema_version text not null check (schema_version = 'uyuni-consolidated-v1'),
  status text not null default 'completed' check (status in ('completed')),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.consolidated_import_issues (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.consolidated_import_runs(id) on delete cascade,
  import_key text not null,
  scenario_key text,
  day_key text,
  line_key text,
  code text not null,
  issue_type text not null check (issue_type in
    ('identification','missing_price','date_exclusion','reconciliation','technical')),
  detail text not null,
  source_ref jsonb not null default '{}'::jsonb check (jsonb_typeof(source_ref) = 'object'),
  created_at timestamptz not null default now(),
  unique (run_id, import_key)
);
create index consolidated_import_issues_scenario_idx
  on public.consolidated_import_issues(scenario_key) where scenario_key is not null;

alter table public.consolidated_import_runs enable row level security;
alter table public.consolidated_import_issues enable row level security;
create policy consolidated_runs_admin_read on public.consolidated_import_runs for select to authenticated
  using (public.current_role() = 'admin');
create policy consolidated_issues_read on public.consolidated_import_issues for select to authenticated
  using (public.current_role() in ('admin','operacion'));
grant select on public.consolidated_import_runs to authenticated;
grant select on public.consolidated_import_issues to authenticated;

create function public.preview_consolidated_workbook(p_payload jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then
    raise exception 'Solo Admin puede previsualizar la importación consolidada.' using errcode = '42501';
  end if;
  if p_payload->>'schemaVersion' is distinct from 'uyuni-consolidated-v1' then
    raise exception 'Versión de importador no compatible.';
  end if;
  if jsonb_array_length(coalesce(p_payload->'services','[]')) <> 1244
    or jsonb_array_length(coalesce(p_payload->'rates','[]')) <> 1244
    or jsonb_array_length(coalesce(p_payload->'scenarios','[]')) <> 155
    or jsonb_array_length(coalesce(p_payload->'scenarioDays','[]')) <> 536
    or jsonb_array_length(coalesce(p_payload->'lines','[]')) <> 2749
    or jsonb_array_length(coalesce(p_payload->'narrativeDays','[]')) <> 96
    or jsonb_array_length(coalesce(p_payload->'templates','[]')) <> 28 then
    raise exception 'Los conteos del Excel consolidado no coinciden con la revisión aprobada.';
  end if;
  select jsonb_build_object(
    'services', jsonb_build_object(
      'new', (select count(*) from jsonb_array_elements(p_payload->'services') x
        where not exists(select 1 from public.services s where s.sku=x->>'sku')),
      'existing', (select count(*) from jsonb_array_elements(p_payload->'services') x
        where exists(select 1 from public.services s where s.sku=x->>'sku'
          and s.source='consolidated-excel:'||(x->>'fingerprint'))),
      'modified', (select count(*) from jsonb_array_elements(p_payload->'services') x
        where exists(select 1 from public.services s where s.sku=x->>'sku'
          and s.source like 'consolidated-excel:%'
          and s.source is distinct from 'consolidated-excel:'||(x->>'fingerprint'))),
      'protected', (select count(*) from jsonb_array_elements(p_payload->'services') x
        where exists(select 1 from public.services s where s.sku=x->>'sku'
          and (s.source is null or s.source not like 'consolidated-excel:%')))),
    'rates', jsonb_build_object(
      'new', (select count(*) from jsonb_array_elements(p_payload->'rates') x
        where not exists(select 1 from public.service_rates r where r.import_key=x->>'importKey')),
      'existing', (select count(*) from jsonb_array_elements(p_payload->'rates') x
        where exists(select 1 from public.service_rates r where r.import_key=x->>'importKey'
          and r.source_ref->>'fingerprint'=x->>'fingerprint')),
      'modified', (select count(*) from jsonb_array_elements(p_payload->'rates') x
        where exists(select 1 from public.service_rates r where r.import_key=x->>'importKey'
          and r.source_ref->>'fingerprint' is distinct from x->>'fingerprint'))),
    'scenarios', jsonb_build_object(
      'new', (select count(*) from jsonb_array_elements(p_payload->'scenarios') x
        where not exists(select 1 from public.tour_cost_scenarios s where s.import_key=x->>'importKey')),
      'existing', (select count(*) from jsonb_array_elements(p_payload->'scenarios') x
        where exists(select 1 from public.tour_cost_scenarios s where s.import_key=x->>'importKey'
          and s.import_fingerprint=x->>'fingerprint')),
      'modified', (select count(*) from jsonb_array_elements(p_payload->'scenarios') x
        where exists(select 1 from public.tour_cost_scenarios s where s.import_key=x->>'importKey'
          and s.import_fingerprint is distinct from x->>'fingerprint'))),
    'scenario_days', jsonb_build_object('total',jsonb_array_length(p_payload->'scenarioDays')),
    'templates', jsonb_build_object(
      'new', (select count(*) from jsonb_array_elements(p_payload->'templates') x
        where not exists(select 1 from public.itinerary_templates t where t.sku=x->>'sku')),
      'existing', (select count(*) from jsonb_array_elements(p_payload->'templates') x
        where exists(select 1 from public.itinerary_templates t where t.excel_import_key=x->>'importKey'
          and t.excel_import_fingerprint=x->>'fingerprint')),
      'protected', (select count(*) from jsonb_array_elements(p_payload->'templates') x
        where exists(select 1 from public.itinerary_templates t where t.sku=x->>'sku'
          and (t.excel_import_key is null or t.excel_import_fingerprint is distinct from x->>'fingerprint')))),
    'issues', jsonb_array_length(coalesce(p_payload->'issues','[]')),
    'pending_services', (select count(*) from jsonb_array_elements(p_payload->'services') x where x->>'status'='pendiente')
  ) into result;
  return result;
end;
$$;

create function public.import_consolidated_workbook(
  p_file_name text,
  p_source_sha256 text,
  p_payload jsonb,
  p_confirm boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  preview jsonb;
  run_id uuid;
  existing_result jsonb;
  row jsonb;
  service_id uuid;
  supplier_id uuid;
  template_id uuid;
  block_id uuid;
  scenario_id uuid;
  scenario_day_id uuid;
  result jsonb;
begin
  -- Serialize concurrent import calls: the SHA check alone is not a lock.
  perform pg_catalog.pg_advisory_xact_lock(20261027, 300);
  preview := public.preview_consolidated_workbook(p_payload);
  if not p_confirm then return jsonb_build_object('dry_run',true,'preview',preview); end if;
  if nullif(btrim(p_file_name),'') is null or p_source_sha256 !~ '^[0-9a-f]{64}$'
    or p_source_sha256 is distinct from p_payload->>'sourceSha256' then
    raise exception 'Nombre o huella del archivo inválidos.';
  end if;
  select r.result into existing_result from public.consolidated_import_runs r
    where r.source_sha256=p_source_sha256;
  if found then return existing_result||jsonb_build_object('idempotent',true); end if;

  -- Fail closed on anything that cannot be safely reconciled. Do not call
  -- a changed workbook "imported" if rows were silently skipped.
  if (preview#>>'{services,modified}')::int > 0
    or (preview#>>'{services,protected}')::int > 0
    or (preview#>>'{rates,modified}')::int > 0
    or (preview#>>'{scenarios,modified}')::int > 0
    or (preview#>>'{templates,protected}')::int > 0 then
    raise exception
      'CONFLICTO DE REIMPORTACION: hay filas cambiadas o registros manuales protegidos. Revise la previsualizacion y resuelva los conflictos antes de confirmar. %',
      preview using errcode='23505';
  end if;

  -- Exact-name suppliers are inserted only when absent. Existing supplier records
  -- are never rewritten, including aliases, contacts and manually curated notes.
  for row in select value from jsonb_array_elements(p_payload->'suppliers') loop
    if not exists(select 1 from public.suppliers s where lower(btrim(s.name))=lower(btrim(row->>'name'))) then
      insert into public.suppliers(name,country,notes)
      values(row->>'name',row->>'country','Excel consolidado '||p_source_sha256);
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'services') loop
    -- A prior catalog item with the same SKU must be the exact same import.
    -- Never attach a rate to an unrelated manually created service.
    if exists (select 1 from public.services s where s.sku=row->>'sku'
      and s.source is distinct from 'consolidated-excel:'||(row->>'fingerprint')) then
      raise exception 'SKU protegido o distinto: %',row->>'sku';
    end if;
    if not exists(select 1 from public.services s where s.sku=row->>'sku') then
      select s.id into supplier_id from public.suppliers s
        where lower(btrim(s.name))=lower(btrim(row->>'supplierName')) order by s.id limit 1;
      insert into public.services(
        sku,name,location,country,supplier_id,type,pricing_unit,currency,room_type,
        vehicle_max_pax,meal_plan,multi_day_span,status,source,notes,import_source_currency,import_source_unit
      ) values(
        row->>'sku',row->>'name',row->>'location',row->>'country',supplier_id,
        (row->>'type')::public.service_type,(row->>'pricingUnit')::public.pricing_unit,
        row->>'currency',row->>'roomType',(row->>'vehicleMaxPax')::integer,
        (row->>'mealPlan')::public.meal_plan,coalesce((row->>'multiDaySpan')::integer,1),
        (row->>'status')::public.catalog_status,'consolidated-excel:'||(row->>'fingerprint'),
        row->>'notes',row->>'currency',row->>'pricingUnit'
      );
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'rates') loop
    if exists (select 1 from public.service_rates r where r.import_key=row->>'importKey'
      and (r.source_ref->>'fingerprint') is distinct from (row->>'fingerprint')) then
      raise exception 'Tarifa modificada: %. No se sobrescribe automaticamente.',row->>'importKey';
    end if;
    if not exists(select 1 from public.service_rates r where r.import_key=row->>'importKey') then
      select s.id into service_id from public.services s
        where s.sku=row->>'serviceSku'
          and s.source='consolidated-excel:'||(
            select x->>'fingerprint' from jsonb_array_elements(p_payload->'services') x
            where x->>'sku'=row->>'serviceSku'
            limit 1
          );
      if service_id is null then raise exception 'Servicio inexistente para tarifa: %',row->>'serviceSku'; end if;
      insert into public.service_rates(
        service_id,season,valid_from,valid_to,pax_min,pax_max,price_net,net_cost_missing,notes,
        pricing_enabled,rate_year,import_key,source_sheet,source_ref,source_currency,
        source_price_usd,source_price_net,exclusion_text,date_exclusions
      ) values(
        service_id,(row->>'season')::public.season,(row->>'validFrom')::date,(row->>'validTo')::date,
        (row->>'paxMin')::integer,(row->>'paxMax')::integer,(row->>'priceNet')::numeric,
        -- Blank sourcePriceNet is not a missing cost when USD is approved.
        (row->>'priceNet') is null,row->>'notes',
        coalesce((row->>'pricingEnabled')::boolean,false) and (row->>'priceNet') is not null,
        (row->>'year')::integer,row->>'importKey',row#>>'{sourceRef,sheet}',
        coalesce(row->'sourceRef','{}')||jsonb_build_object('fingerprint',row->>'fingerprint'),
        row->>'sourceCurrency',(row->>'sourcePriceUsd')::numeric,(row->>'sourcePriceNet')::numeric,
        row->>'exclusionText','[]'::jsonb
      );
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'hotelCodes') loop
    if not exists(select 1 from public.hotel_codes h where h.code=row->>'code') then
      select s.id into supplier_id from public.suppliers s
        where lower(btrim(s.name))=lower(btrim(row->>'name')) order by s.id limit 1;
      insert into public.hotel_codes(code,name,supplier_id) values(row->>'code',row->>'name',supplier_id);
    end if;
  end loop;

  -- Only the 96 narrative Word days become reusable catalog blocks. The 536
  -- economic days remain independent and are never duplicated into day_blocks.
  for row in select value from jsonb_array_elements(p_payload->'narrativeDays') loop
    if exists(select 1 from public.day_blocks b where b.code=row->>'visibleCode'
      and (b.excel_import_key is distinct from row->>'importKey'
        or b.excel_import_fingerprint is distinct from row->>'fingerprint'
        or b.manually_modified_at is not null)) then
      raise exception 'Bloque narrativo protegido o modificado: %',row->>'visibleCode';
    end if;
    if not exists(select 1 from public.day_blocks b where b.code=row->>'visibleCode') then
      insert into public.day_blocks(
        code,default_day_position,status,catalog_origin,excel_import_key,excel_import_fingerprint
      ) values(
        row->>'visibleCode',(row->>'dayNumber')::integer,'activo','importacion',
        row->>'importKey',row->>'fingerprint'
      ) returning id into block_id;
      insert into public.day_block_translations(block_id,lang,title,description,includes,reviewed)
      values(block_id,'es',row->>'title',coalesce(row->>'description',''),row->>'meals',true);
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'templates') loop
    if exists(select 1 from public.itinerary_templates t where t.sku=row->>'sku'
      and (t.excel_import_key is distinct from row->>'importKey'
        or t.excel_import_fingerprint is distinct from row->>'fingerprint'
        or t.manually_modified_at is not null)) then
      raise exception 'Plantilla protegida o modificada: %',row->>'sku';
    end if;
    if not exists(select 1 from public.itinerary_templates t where t.sku=row->>'sku') then
      insert into public.itinerary_templates(
        sku,name,route_type,days,nights,modality,category,status,catalog_origin,
        quote_defaults,excel_import_key,excel_import_fingerprint
      ) values(
        row->>'sku',row->>'name','ROUNDTRIP',(row->>'days')::integer,(row->>'nights')::integer,
        (row->>'modality')::public.itinerary_modality,(row->>'category')::public.tour_category,
        'activo','importacion',jsonb_build_object('seasons',coalesce(row->'seasons','[]'::jsonb),
          'source_sha256',p_source_sha256),row->>'importKey',row->>'fingerprint'
      );
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'narrativeDays') loop
    select t.id into template_id from public.itinerary_templates t
      where t.sku=row->>'tourSku' and t.excel_import_key='template:'||(row->>'tourSku');
    select b.id into block_id from public.day_blocks b where b.excel_import_key=row->>'importKey';
    if template_id is not null and block_id is not null and not exists(
      select 1 from public.template_days d where d.template_id=template_id and d.day_number=(row->>'dayNumber')::integer
    ) then
      insert into public.template_days(template_id,day_number,block_id,import_title,import_lodging,import_meals,import_note)
      values(template_id,(row->>'dayNumber')::integer,block_id,row->>'title',row->>'lodging',row->>'meals',row->>'note');
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'scenarios') loop
    if exists (select 1 from public.tour_cost_scenarios s where s.import_key=row->>'importKey'
      and (s.import_fingerprint is distinct from row->>'fingerprint'
        or s.approved_cost_usd is distinct from (row->>'expectedCostUsd')::numeric
        or s.detail_cost_usd is distinct from (row->>'detailCostUsd')::numeric)) then
      raise exception 'Escenario importado modificado: %',row->>'importKey';
    end if;
    if not exists(select 1 from public.tour_cost_scenarios s where s.import_key=row->>'importKey') then
      select t.id into template_id from public.itinerary_templates t where t.sku=row->>'tourSku';
      insert into public.tour_cost_scenarios(
        tour_sku,rate_year,season,pax,template_id,status,import_key,source_revision,source_ref,import_fingerprint,
        approved_cost_usd,detail_cost_usd,cost_difference_usd,reconciliation_status
      ) values(
        row->>'tourSku',(row->>'year')::integer,row->>'season',(row->>'pax')::integer,
        template_id,'activo',row->>'importKey',p_source_sha256,
        coalesce(row->'sourceRef','{}')||jsonb_build_object(
          'expected_cost_usd',row->'expectedCostUsd','detail_cost_usd',row->'detailCostUsd',
          'difference_usd',row->'differenceUsd','review_status',row->>'reviewStatus'),
        row->>'fingerprint',(row->>'expectedCostUsd')::numeric,(row->>'detailCostUsd')::numeric,
        (row->>'differenceUsd')::numeric,
        case when abs((row->>'differenceUsd')::numeric) <= 0.01 then 'matched' else 'difference' end
      );
    end if;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'scenarioDays') loop
    -- A collision must have the same fingerprint, identity and original values.
    if exists(select 1 from public.tour_cost_scenario_days d
      join public.tour_cost_scenarios s on s.id=d.scenario_id
      where s.import_key=row->>'scenarioKey' and d.day_number=(row->>'dayNumber')::integer
        and (d.source_ref->>'fingerprint' is distinct from row->>'fingerprint'
          or d.visible_code is distinct from row->>'visibleCode')) then
      raise exception 'Dia economico modificado: %',row->>'importKey';
    end if;
    select s.id into scenario_id from public.tour_cost_scenarios s where s.import_key=row->>'scenarioKey';
    select b.id into block_id from public.day_blocks b
      where b.excel_import_key='narrative:'||(row->>'tourSku')||':D'||(row->>'dayNumber');
    if scenario_id is null then raise exception 'Escenario inexistente para día: %',row->>'scenarioKey'; end if;
    insert into public.tour_cost_scenario_days(
      scenario_id,day_number,visible_code,block_id,title,description,source_ref
    ) values(
      scenario_id,(row->>'dayNumber')::integer,row->>'visibleCode',block_id,row->>'title',row->>'description',
      coalesce(row->'sourceRef','{}')||jsonb_build_object(
        'import_key',row->>'importKey','fingerprint',row->>'fingerprint','hotel',row->'hotel',
        'meals',row->'meals','cost_usd',row->'costUsd','review_status',row->>'reviewStatus')
    ) on conflict (scenario_id,day_number) do nothing;
  end loop;

  for row in select value from jsonb_array_elements(p_payload->'lines') loop
    if exists(select 1 from public.tour_cost_scenario_lines l
      join public.tour_cost_scenario_days d on d.id=l.scenario_day_id
      join public.tour_cost_scenarios s on s.id=d.scenario_id
      where s.import_key=row->>'scenarioKey' and d.day_number=(row->>'dayNumber')::integer
        and l.line_key=row->>'lineKey'
        and (l.source_ref->>'fingerprint' is distinct from row->>'fingerprint'
          or l.amount_usd is distinct from (row->>'amountUsd')::numeric
          or l.quantity is distinct from (row->>'quantity')::numeric
          or l.cost_basis is distinct from row->>'costBasis')) then
      raise exception 'Linea economica modificada: %',row->>'importKey';
    end if;
    select d.id into scenario_day_id from public.tour_cost_scenario_days d
      join public.tour_cost_scenarios s on s.id=d.scenario_id
      where s.import_key=row->>'scenarioKey' and d.day_number=(row->>'dayNumber')::integer;
    select s.id into service_id from public.services s where s.sku=row->>'serviceSku';
    select s.id into supplier_id from public.suppliers s
      where lower(btrim(s.name))=lower(btrim(row->>'supplierName')) order by s.id limit 1;
    if scenario_day_id is null then raise exception 'Día inexistente para línea: %',row->>'importKey'; end if;
    insert into public.tour_cost_scenario_lines(
      scenario_day_id,line_key,service_id,supplier_id,unresolved_service_ref,description,quantity,
      billing_unit,cost_basis,reference_unit_cost,original_amount,original_currency,amount_usd,
      charge_once_key,source_ref,resolution_issue
    ) values(
      scenario_day_id,row->>'lineKey',service_id,supplier_id,
      case when service_id is null then coalesce(row->>'unresolvedServiceRef',row->>'serviceSku') end,
      row->>'description',(row->>'quantity')::numeric,row->>'billingUnit',row->>'costBasis',
      (row->>'referenceUnitCost')::numeric,(row->>'originalAmount')::numeric,row->>'originalCurrency',
      (row->>'amountUsd')::numeric,row->>'chargeOnceKey',
      coalesce(row->'sourceRef','{}')||jsonb_build_object('import_key',row->>'importKey','fingerprint',row->>'fingerprint'),
      row->>'resolutionIssue'
    ) on conflict (scenario_day_id,line_key) do nothing;
  end loop;

  result := jsonb_build_object(
    'dry_run',false,'idempotent',false,'source_sha256',p_source_sha256,'preview',preview,
    'processed',jsonb_build_object(
      'services',jsonb_array_length(p_payload->'services'),'rates',jsonb_array_length(p_payload->'rates'),
      'scenarios',jsonb_array_length(p_payload->'scenarios'),'scenario_days',jsonb_array_length(p_payload->'scenarioDays'),
      'lines',jsonb_array_length(p_payload->'lines'),'templates',jsonb_array_length(p_payload->'templates'),
      'issues',jsonb_array_length(p_payload->'issues'))
  );
  run_id:=gen_random_uuid();
  result:=result||jsonb_build_object('run_id',run_id);
  insert into public.consolidated_import_runs(id,file_name,source_sha256,schema_version,result)
  values(run_id,p_file_name,p_source_sha256,p_payload->>'schemaVersion',result);

  for row in select value from jsonb_array_elements(p_payload->'issues') loop
    insert into public.consolidated_import_issues(
      run_id,import_key,scenario_key,day_key,line_key,code,issue_type,detail,source_ref
    ) values(
      run_id,row->>'importKey',row->>'scenarioKey',row->>'dayKey',row->>'lineKey',
      row->>'code',row->>'issueType',row->>'detail',coalesce(row->'sourceRef','{}')
    );
    if row->>'scenarioKey' is not null then
      if exists(select 1 from public.tour_cost_scenario_issues i
        where i.import_key=row->>'importKey'
          and (i.code is distinct from row->>'code'
            or i.issue_type is distinct from row->>'issueType'
            or i.detail is distinct from row->>'detail')) then
        raise exception 'Incidencia de escenario modificada: %',row->>'importKey';
      end if;
      select s.id into scenario_id from public.tour_cost_scenarios s where s.import_key=row->>'scenarioKey';
      select d.id into scenario_day_id from public.tour_cost_scenario_days d
        where d.scenario_id=scenario_id and d.source_ref->>'import_key'=row->>'dayKey';
      insert into public.tour_cost_scenario_issues(
        scenario_id,scenario_day_id,line_key,code,issue_type,detail,source_ref,import_key
      ) values(
        scenario_id,scenario_day_id,row->>'lineKey',row->>'code',row->>'issueType',row->>'detail',
        coalesce(row->'sourceRef','{}'),row->>'importKey'
      ) on conflict (import_key) do nothing;
    end if;
  end loop;

  return result;
end;
$$;

revoke all on function public.preview_consolidated_workbook(jsonb) from public,anon;
revoke all on function public.import_consolidated_workbook(text,text,jsonb,boolean) from public,anon;
grant execute on function public.preview_consolidated_workbook(jsonb) to authenticated;
grant execute on function public.import_consolidated_workbook(text,text,jsonb,boolean) to authenticated;

-- This wrapper is deliberately separate from the Excel import. It prepares an
-- exact active scenario as one atomic quote snapshot and validates every priced
-- line against the immutable scenario source before saving the calculation.
create function public.create_quote_from_cost_scenario(
  p_scenario uuid,
  p_quote jsonb,
  p_days jsonb,
  p_result jsonb
) returns public.quotes
language plpgsql set search_path = '' as $$
declare
  scenario public.tour_cost_scenarios;
  q public.quotes;
  expected_cost numeric;
  missing_count integer;
  warnings jsonb;
  calc_item jsonb;
  input_line text;
  persisted_item_id uuid;
  remapped_items jsonb := '[]'::jsonb;
  calculated jsonb;
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesion autenticada.' using errcode='42501';
  end if;
  if jsonb_typeof(p_quote) is distinct from 'object'
    or jsonb_typeof(p_days) is distinct from 'array'
    or jsonb_typeof(p_result) is distinct from 'object'
    or jsonb_typeof(p_result->'items') is distinct from 'array' then
    raise exception 'Payload de cotizacion invalido.' using errcode='22023';
  end if;
  select * into strict scenario from public.tour_cost_scenarios
    where id=p_scenario and status='activo';
  if (p_quote->>'pax_paying')::integer is distinct from scenario.pax then
    raise exception 'Los pasajeros no coinciden con el escenario exacto.';
  end if;
  if p_quote->>'tour_sku' is not null and p_quote->>'tour_sku' is distinct from scenario.tour_sku then
    raise exception 'El SKU de la cotizacion no coincide con el escenario.';
  end if;
  if jsonb_array_length(p_days) is distinct from
    (select count(*) from public.tour_cost_scenario_days d where d.scenario_id=scenario.id) then
    raise exception 'La copia del escenario no contiene todos sus dias.';
  end if;
  if exists (
    select 1 from public.tour_cost_scenario_days d where d.scenario_id=scenario.id
      and 1<>(select count(*) from jsonb_array_elements(p_days) day
        where day#>>'{snapshot,cost_scenario_day_id}'=d.id::text
          and (day->>'day_number')::integer=d.day_number)
  ) then
    raise exception 'Los dias deben corresponder exactamente una vez al escenario.';
  end if;

  -- Every source line must be copied ONCE, to its OWN day, with the approved
  -- amount. Unresolved service refs do not imply a missing amount.
  if exists (
    select 1 from public.tour_cost_scenario_lines line
      join public.tour_cost_scenario_days d on d.id=line.scenario_day_id
    where d.scenario_id=scenario.id
      and 1<>(
        select count(*) from jsonb_array_elements(p_days) day
          cross join lateral jsonb_array_elements(coalesce(day->'items','[]'::jsonb)) item
        where item#>>'{pricing_snapshot,scenario_line_id}'=line.id::text
          and day#>>'{snapshot,cost_scenario_day_id}'=d.id::text
          and (day->>'day_number')::integer=d.day_number
          and (line.amount_usd is null or (
             (item->>'unit_cost_usd')::numeric=line.amount_usd
             and (item->>'unit_cost_original')::numeric=line.amount_usd
          ))
          and item->>'currency'='USD' and item->>'pricing_unit'='per_group'
          and (item->>'qty')::numeric=1
      )
  ) then
    raise exception 'Faltan lineas, existen duplicados o se alteraron importes/dias del escenario.';
  end if;
  -- Reject extras, cross-day references and duplicated line ids.
  if exists (
    select 1 from (
      select item#>>'{pricing_snapshot,scenario_line_id}' as line_id,
        count(*) as copies,
        min(day#>>'{snapshot,cost_scenario_day_id}') as parent_day_id,
        max(day#>>'{snapshot,cost_scenario_day_id}') as last_parent_day_id
      from jsonb_array_elements(p_days) day
      cross join lateral jsonb_array_elements(coalesce(day->'items','[]'::jsonb)) item
      group by item#>>'{pricing_snapshot,scenario_line_id}'
    ) x
    where x.line_id is null or x.copies<>1 or not exists (
      select 1 from public.tour_cost_scenario_lines l
        join public.tour_cost_scenario_days d on d.id=l.scenario_day_id
      where l.id::text=x.line_id and d.scenario_id=scenario.id
        and d.id::text=x.parent_day_id
    )
  ) then
    raise exception 'La copia contiene lineas duplicadas, ajenas o en otro dia.';
  end if;

  select count(*) into missing_count from public.tour_cost_scenario_lines line
    join public.tour_cost_scenario_days d on d.id=line.scenario_day_id
    where d.scenario_id=scenario.id and line.amount_usd is null;
  select coalesce(sum(line.amount_usd),0) into expected_cost
    from public.tour_cost_scenario_lines line
      join public.tour_cost_scenario_days d on d.id=line.scenario_day_id
    where d.scenario_id=scenario.id and line.amount_usd is not null
      and (line.charge_once_key is null or not exists (
        select 1 from public.tour_cost_scenario_lines earlier
          join public.tour_cost_scenario_days earlier_day on earlier_day.id=earlier.scenario_day_id
        where earlier_day.scenario_id=scenario.id
          and earlier.charge_once_key=line.charge_once_key
          and (earlier_day.day_number,earlier.id)<(d.day_number,line.id)
      ));
  if scenario.detail_cost_usd is null
     or abs(expected_cost-scenario.detail_cost_usd)>0.01 then
    raise exception 'La suma de lineas no coincide con el desglose importado.';
  end if;

  if missing_count>0 or scenario.reconciliation_status='difference' then
    if p_result->>'status' is distinct from 'error'
      or p_result->>'total_cost_usd' is not null
      or p_result->>'total_price_usd' is not null
      or p_result->>'price_per_pax_usd' is not null then
      raise exception 'El borrador con costos o conciliacion pendientes no puede mostrar un precio definitivo.';
    end if;
  elsif p_result->>'status'='error' or (p_result->>'total_cost_usd')::numeric is null
    or abs((p_result->>'total_cost_usd')::numeric-expected_cost)>0.01 then
    raise exception 'El calculo no coincide con el costo del escenario.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('code',i.code,'issue_type',i.issue_type,'detail',i.detail)
      order by i.created_at),'[]'::jsonb) into warnings
  from public.tour_cost_scenario_issues i
  where i.scenario_id=scenario.id and i.resolved_at is null;
  if scenario.reconciliation_status='difference' then
    warnings:=warnings||jsonb_build_array(jsonb_build_object(
      'code','RECONCILIATION_DIFFERENCE','issue_type','reconciliation',
      'approved_cost_usd',scenario.approved_cost_usd,
      'detail_cost_usd',scenario.detail_cost_usd,
      'difference_usd',scenario.cost_difference_usd,
      'detail','Los costos del presupuesto y desglose difieren; no se alteraron.'
    ));
  end if;

  -- Calculation entries must form a bijection with the source lines. The
  -- historical save_quote_calculation verifies count but not unique IDs.
  if jsonb_array_length(p_result->'items') is distinct from (
      select count(*) from public.tour_cost_scenario_lines l
        join public.tour_cost_scenario_days d on d.id=l.scenario_day_id
      where d.scenario_id=scenario.id
    ) or exists (
      select 1 from jsonb_array_elements(p_result->'items') x
      group by x->>'id' having count(*)<>1 or x->>'id' is null
    ) then
    raise exception 'El calculo debe contener exactamente una entrada por linea con ID unico.';
  end if;

  -- create_quote_snapshot / insert_quote_item generate new UUIDs. Remap the
  -- calculation items to the ACTUAL persisted ids by scenario_line_id.
  q:=public.create_quote_snapshot(
    (p_quote-'template_id')||jsonb_build_object('tour_sku',scenario.tour_sku),p_days
  );
  update public.quotes
    set template_id=scenario.template_id, cost_scenario_id=scenario.id,
      cost_scenario_warnings=warnings
    where id=q.id returning * into q;

  for calc_item in select value from jsonb_array_elements(p_result->'items') loop
    select item#>>'{pricing_snapshot,scenario_line_id}' into input_line
    from jsonb_array_elements(p_days) day
      cross join lateral jsonb_array_elements(coalesce(day->'items','[]'::jsonb)) item
    where item->>'id'=calc_item->>'id';
    if input_line is null then
      raise exception 'No se puede asociar un calculo con la linea original: %',calc_item->>'id';
    end if;
    select qi.id into persisted_item_id from public.quote_items qi
      join public.quote_days qd on qd.id=qi.quote_day_id
    where qd.quote_id=q.id and qi.pricing_snapshot->>'scenario_line_id'=input_line;
    if persisted_item_id is null then
      raise exception 'No se encontro el item persistido para la linea: %',input_line;
    end if;
    remapped_items:=remapped_items||jsonb_build_array(
      jsonb_set(calc_item,'{id}',to_jsonb(persisted_item_id::text),true));
  end loop;
  calculated:=jsonb_set(p_result,'{items}',remapped_items,true);
  perform public.save_quote_calculation(q.id,q.updated_at,calculated);
  select * into q from public.quotes where id=q.id;
  return q;
end;
$$;

revoke all on function public.create_quote_from_cost_scenario(uuid,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.create_quote_from_cost_scenario(uuid,jsonb,jsonb,jsonb) to authenticated;

commit;
