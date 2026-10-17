-- T01k. Extends T01u; no catalog rows are deleted or approved by this migration.
begin;
alter table public.template_days drop constraint template_days_block_id_fkey;
alter table public.template_days add constraint template_days_block_id_fkey
  foreign key(block_id) references public.day_blocks(id) on delete restrict;
-- quotes.template_id and quote_days.source_block_id already have SET NULL.
-- T01u's narrowly scoped FK trigger handling continues preserving snapshots.

alter table public.day_blocks add column approval_issues text[] not null default '{}';

create function public._check_catalog_action(ids uuid[]) returns void
language plpgsql set search_path='' as $$
begin
  if auth.uid() is null or coalesce(public.current_role() in ('admin','operacion'),false) is false then
    raise exception 'Solo Admin y Operación pueden borrar, aprobar o archivar el catálogo.' using errcode='42501';
  end if;
  if ids is null or array_position(ids,null) is not null then
    raise exception 'Indica una lista de IDs válida.' using errcode='22023';
  end if;
end;
$$;
revoke all on function public._check_catalog_action(uuid[]) from public,anon,authenticated;

create function public._lock_catalog_approval() returns void
language plpgsql set search_path='' as $$
begin
  -- Same order as import approval and T01u deletion. Readers stay available.
  lock table public.services,public.service_rates,public.itinerary_templates,
    public.template_days,public.day_blocks,public.day_block_items,public.day_block_modules,
    public.activity_modules,public.activity_module_items,public.day_block_translations
    in share row exclusive mode;
end;
$$;
revoke all on function public._lock_catalog_approval() from public,anon,authenticated;

create function public._day_block_approval_rows(ids uuid[])
returns table(id uuid,code text,name text,reasons text[])
language sql stable set search_path='' as $$
  with block_services as (
    select block_id,service_id from public.day_block_items
    union select m.block_id,i.service_id from public.day_block_modules m
      join public.activity_module_items i on i.module_id=m.module_id
    union select b.id,b.hotel_service_id from public.day_blocks b where b.hotel_service_id is not null
  )
  select b.id,b.code,coalesce(nullif(b.name,''),b.code),array(
    select distinct reason from (
      select '0 servicios vinculados al tarifario.' as reason
      where not exists(select 1 from block_services s where s.block_id=b.id and s.service_id is not null)
      union all
      select 'Sin título ES.' where nullif(btrim(tr.title),'') is null
      union all
      select 'Texto ES sin revisar.' where tr.reviewed is distinct from true
      union all
      select 'Servicio pendiente: '||s.sku||'.' from block_services bs
        join public.services s on s.id=bs.service_id where bs.block_id=b.id and s.status='pendiente'
      union all
      select 'Servicio inactivo: '||s.sku||'.' from block_services bs
        join public.services s on s.id=bs.service_id where bs.block_id=b.id and s.status='inactivo'
      union all
      select 'Ítem sin vínculo al tarifario.' from block_services bs where bs.block_id=b.id and bs.service_id is null
    ) warnings order by reason
  )
  from public.day_blocks b left join public.day_block_translations tr on tr.block_id=b.id and tr.lang='es'
  where b.id=any(ids) order by b.code,b.id;
$$;
revoke all on function public._day_block_approval_rows(uuid[]) from public,anon,authenticated;

-- One validator for selected templates and the existing whole-import workflow.
-- eligible_services is populated ONLY by the latter, which approves valid
-- services in the same transaction. Selected-template approval never does so.
create function public._template_approval_rows(ids uuid[],eligible_services uuid[] default '{}')
returns table(id uuid,code text,name text,reasons text[])
language sql stable set search_path='' as $$
  with block_services as (
    select block_id,service_id from public.day_block_items
    union select m.block_id,i.service_id from public.day_block_modules m
      join public.activity_module_items i on i.module_id=m.module_id
    union select b.id,b.hotel_service_id from public.day_blocks b where b.hotel_service_id is not null
  )
  select t.id,t.sku,t.name,array(
    select distinct reason from (
      select 'Los días deben cubrir del 1 al '||t.days||' sin huecos ni días extra.' as reason
      where (select count(*) from public.template_days d where d.template_id=t.id)<>t.days
        or exists(select 1 from public.template_days d where d.template_id=t.id and d.day_number>t.days)
      union all
      select 'Día '||d.day_number||': sin servicios.' from public.template_days d
      where d.template_id=t.id and not exists(select 1 from block_services bs where bs.block_id=d.block_id)
      union all
      select 'Día '||d.day_number||': bloque inactivo ('||b.code||').' from public.template_days d
      join public.day_blocks b on b.id=d.block_id where d.template_id=t.id and b.status='inactivo'
      union all
      select 'Día '||d.day_number||': módulo inactivo o vacío ('||a.code||').' from public.template_days d
      join public.day_block_modules m on m.block_id=d.block_id join public.activity_modules a on a.id=m.module_id
      where d.template_id=t.id and (a.status='inactivo' or not exists(select 1 from public.activity_module_items i where i.module_id=a.id))
      union all
      select 'Día '||d.day_number||': servicio no aprobado ('||coalesce(s.sku,'sin vínculo al catálogo')||').'
      from public.template_days d join block_services bs on bs.block_id=d.block_id
      left join public.services s on s.id=bs.service_id where d.template_id=t.id
        and not(coalesce(s.status='activo',false) or coalesce(s.id=any(eligible_services),false))
      union all
      select 'Importación: '||warning from jsonb_array_elements_text(
        case when jsonb_typeof(t.import_warnings)='array' then t.import_warnings else '[]'::jsonb end
      ) warning where nullif(btrim(warning),'') is not null
    ) warnings order by reason
  ) from public.itinerary_templates t where t.id=any(ids) order by t.sku,t.id;
$$;
revoke all on function public._template_approval_rows(uuid[],uuid[]) from public,anon,authenticated;

create function public.review_catalog_approval(kind text,ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare items jsonb;
begin
  perform public._check_catalog_action(ids);
  if kind='day_blocks' then
    select coalesce(jsonb_agg(to_jsonb(r) order by code,id),'[]') into items from public._day_block_approval_rows(ids) r;
  elsif kind='templates' then
    select coalesce(jsonb_agg(to_jsonb(r) order by code,id),'[]') into items from public._template_approval_rows(ids) r;
  else raise exception 'Tipo de catálogo inválido.' using errcode='22023'; end if;
  return jsonb_build_object('items',items,
    'eligible',(select count(*) from jsonb_array_elements(items) i where i->'reasons'='[]'::jsonb),
    'with_warnings',(select count(*) from jsonb_array_elements(items) i where i->'reasons'<>'[]'::jsonb));
end;
$$;
revoke all on function public.review_catalog_approval(text,uuid[]) from public,anon;
grant execute on function public.review_catalog_approval(text,uuid[]) to authenticated;

create function public.approve_day_blocks(ids uuid[],accept_warnings boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare review jsonb; n integer;
begin
  perform public._check_catalog_action(ids);
  if accept_warnings is null then raise exception 'Indica si aceptas los avisos.' using errcode='22023'; end if;
  perform public._lock_catalog_approval();
  review:=public.review_catalog_approval('day_blocks',ids);
  update public.day_blocks b set
    status=case when accept_warnings or cardinality(r.reasons)=0 then 'activo' else 'pendiente' end::public.catalog_status,
    approval_issues=r.reasons
  from jsonb_to_recordset(review->'items') r(id uuid,reasons text[]) where b.id=r.id;
  n:=case when accept_warnings then jsonb_array_length(review->'items') else (review->>'eligible')::int end;
  return review||jsonb_build_object('approved',n,'pending',jsonb_array_length(review->'items')-n,'accept_warnings',accept_warnings);
end;
$$;
revoke all on function public.approve_day_blocks(uuid[],boolean) from public,anon;
grant execute on function public.approve_day_blocks(uuid[],boolean) to authenticated;

create function public.approve_templates(ids uuid[],accept_warnings boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare review jsonb; n integer;
begin
  perform public._check_catalog_action(ids);
  if accept_warnings is null then raise exception 'Indica si aceptas los avisos.' using errcode='22023'; end if;
  perform public._lock_catalog_approval();
  review:=public.review_catalog_approval('templates',ids);
  update public.itinerary_templates t set
    status=case when accept_warnings or cardinality(r.reasons)=0 then 'activo' else 'pendiente' end::public.catalog_status,
    approval_issues=r.reasons
  from jsonb_to_recordset(review->'items') r(id uuid,reasons text[]) where t.id=r.id;
  n:=case when accept_warnings then jsonb_array_length(review->'items') else (review->>'eligible')::int end;
  return review||jsonb_build_object('approved',n,'pending',jsonb_array_length(review->'items')-n,'accept_warnings',accept_warnings);
end;
$$;
revoke all on function public.approve_templates(uuid[],boolean) from public,anon;
grant execute on function public.approve_templates(uuid[],boolean) to authenticated;

create function public.preview_template_deletion(ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  perform public._check_catalog_action(ids);
  -- Counts only: Operation does not gain access to other sellers' private quotes.
  return jsonb_build_object(
    'templates',(select count(*) from public.itinerary_templates where id=any(ids)),
    'template_days',(select count(*) from public.template_days where template_id=any(ids)),
    'quotes_detached',(select count(*) from public.quotes where template_id=any(ids)));
end;
$$;
revoke all on function public.preview_template_deletion(uuid[]) from public,anon;
grant execute on function public.preview_template_deletion(uuid[]) to authenticated;

create or replace function public.delete_templates(ids uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare counts jsonb;
begin
  perform public._check_catalog_action(ids);
  perform public._lock_catalog_deletion();
  -- Freeze FK targets and matching quote rows so the returned count describes
  -- the actual detachment, including quotes hidden from Operation by RLS.
  perform id from public.itinerary_templates where id=any(ids) order by id for update;
  perform id from public.quotes where template_id=any(ids) order by id for update;
  counts:=public.preview_template_deletion(ids);
  delete from public.itinerary_templates where id=any(ids);
  return counts;
end;
$$;

create function public.archive_catalog(kind text,ids uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
  perform public._check_catalog_action(ids);
  if kind='day_blocks' then
    update public.day_blocks set status='inactivo' where id=any(ids) and status<>'inactivo';
  elsif kind='templates' then
    update public.itinerary_templates set status='inactivo' where id=any(ids) and status<>'inactivo';
  else raise exception 'Tipo de catálogo inválido.' using errcode='22023'; end if;
  get diagnostics n=row_count;
  return jsonb_build_object('archived',n);
end;
$$;
revoke all on function public.archive_catalog(text,uuid[]) from public,anon;
grant execute on function public.archive_catalog(text,uuid[]) to authenticated;

create or replace function public.delete_day_blocks(ids uuid[], force boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare conflicts jsonb; affected uuid[]; d record;
begin
  if auth.uid() is null or coalesce(public.current_role() in ('admin','operacion'),false) is false then
    raise exception 'Solo Admin y Operación pueden eliminar el catálogo.' using errcode='42501';
  end if;
  if ids is null or array_position(ids,null) is not null or force is null then
    raise exception 'Indica una lista de IDs válida y force verdadero o falso.' using errcode='22023';
  end if;
  perform public._lock_catalog_deletion();
  select coalesce(jsonb_agg(jsonb_build_object('block_id',b.id,'templates',(
    select jsonb_agg(jsonb_build_object('id',t.id,'sku',t.sku) order by t.sku,t.id)
    from public.itinerary_templates t where exists(select 1 from public.template_days td
      where td.template_id=t.id and td.block_id=b.id)
  )) order by b.id),'[]'::jsonb) into conflicts
  from public.day_blocks b where b.id=any(ids)
    and exists(select 1 from public.template_days td where td.block_id=b.id);
  -- A nonempty array is the blocked result, NOT success. No row has changed.
  if not force and conflicts<>'[]'::jsonb then return conflicts; end if;
  select coalesce(array_agg(distinct template_id),'{}'::uuid[]) into affected
    from public.template_days where block_id=any(ids);
  delete from public.template_days where block_id=any(ids);
  -- Moving down in ascending old order never collides with UNIQUE(template,day).
  for d in select id,day_number,row_number() over(partition by template_id order by day_number,id)::int as n
    from public.template_days where template_id=any(affected) order by template_id,day_number,id loop
    if d.day_number<>d.n then update public.template_days set day_number=d.n where id=d.id; end if;
  end loop;
  -- T01k: display 3/3 after deleting a day from a 4-day template. Keep the
  -- SKU stable; reviewers can rename it separately without losing identity.
  -- An empty template retains its last advertised duration (days must be >0)
  -- and stays pending until repaired; never invent a replacement day.
  update public.itinerary_templates t set status='pendiente',
    days=case when r.n>0 then r.n else t.days end,
    nights=case when r.n>0 then least(t.nights,greatest(r.n-1,0)) else t.nights end
  from (select a.id,count(td.id)::int n from unnest(affected) a(id)
    left join public.template_days td on td.template_id=a.id group by a.id) r where t.id=r.id;
  delete from public.day_blocks where id=any(ids);
  return '[]'::jsonb;
end;
$$;

-- Replace the signature, avoiding ambiguous PostgREST overloads. Existing
-- two-argument callers continue to work through the default false argument.
drop function public.approve_valid_imports(boolean,text);
create function public.approve_valid_imports(
  p_dry_run boolean default true,
  p_expected_fingerprint text default null,
  p_accept_warnings boolean default false
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
  if p_dry_run is null or p_accept_warnings is null then
    raise exception 'Indica simulación/aplicación y si aceptas los avisos.' using errcode = '22023';
  end if;

  -- Serialize reviews and prevent edits of rates/dependencies between validation
  -- and updates. Ordinary catalog reads remain available. No persistent writes
  -- occur in simulation. Any exception rolls back the entire apply RPC.
  perform public._lock_catalog_approval();

  -- Invalidate confirmations created before this stricter validation rule.
  select md5(jsonb_build_array('import-approval-v3', p_accept_warnings, review_date, auth.uid(),
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
  ), template_review as (
    select * from public._template_approval_rows(
      array(select id from public.itinerary_templates where status='pendiente'),
      array(select id from approved_services))
  )
  select jsonb_build_object(
    'dry_run', p_dry_run, 'accept_warnings', p_accept_warnings, 'review_date', review_date, 'fingerprint', fingerprint,
    'services', (select jsonb_build_object(
      'pending', count(*), 'eligible', count(*) filter (where cardinality(reasons) = 0),
      'remaining', count(*) filter (where cardinality(reasons) > 0),
      'items', coalesce(jsonb_agg(to_jsonb(s) order by code), '[]'::jsonb)) from service_review s),
    'templates', (select jsonb_build_object(
      'pending', count(*), 'eligible', count(*) filter (where p_accept_warnings or cardinality(reasons) = 0),
      'remaining', count(*) filter (where not p_accept_warnings and cardinality(reasons) > 0),
      'items', coalesce(jsonb_agg(to_jsonb(t) order by code), '[]'::jsonb)) from template_review t)
  ) into result;

  if not p_dry_run then
    update public.services s set
      status = case when cardinality(r.reasons) = 0 then 'activo' else 'pendiente' end::public.catalog_status,
      approval_issues = r.reasons
    from jsonb_to_recordset(result #> '{services,items}') as r(id uuid, reasons text[])
    where s.id = r.id;
    update public.itinerary_templates t set
      status = case when p_accept_warnings or cardinality(r.reasons) = 0 then 'activo' else 'pendiente' end::public.catalog_status,
      approval_issues = r.reasons
    from jsonb_to_recordset(result #> '{templates,items}') as r(id uuid, reasons text[])
    where t.id = r.id;
  end if;
  return result;
end;
$$;


revoke all on function public.approve_valid_imports(boolean,text,boolean) from public,anon;
grant execute on function public.approve_valid_imports(boolean,text,boolean) to authenticated;

commit;
