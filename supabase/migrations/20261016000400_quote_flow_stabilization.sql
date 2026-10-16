-- T01s: recoverable draft pricing, fallback text and bounded batch writes.
-- Existing FK indexes cover service_rates(service_id), day_block_items(block_id),
-- quote_items(quote_day_id) and quote_days(quote_id). quote_items has no quote_id.
begin;

-- These ordered composites are absent from earlier migrations. They support the
-- snapshot aggregates without sorting all linked rows for every block/service.
create index if not exists service_rates_service_order_idx on public.service_rates(service_id,id);
create index if not exists day_block_items_block_order_idx on public.day_block_items(block_id,id);

CREATE OR REPLACE FUNCTION public.guard_quote_child()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare qid uuid; q public.quotes;
begin
  if tg_table_name='quote_items' then
    if tg_op='UPDATE' and new.quote_day_id<>old.quote_day_id then raise exception 'Cannot reparent snapshot items' using errcode='42501'; end if;
    select quote_id into qid from public.quote_days where id=case when tg_op='DELETE' then old.quote_day_id else new.quote_day_id end;
  else
    if tg_op='UPDATE' and new.quote_id<>old.quote_id then raise exception 'Cannot reparent snapshot days' using errcode='42501'; end if;
    qid:=case when tg_op='DELETE' then old.quote_id else new.quote_id end;
  end if;
  select * into q from public.quotes where id=qid for update;
  if not found then
    if tg_op='DELETE' then return old; end if;
    raise exception 'Quote not accessible';
  end if;
  if q.status not in ('borrador','revisada') or q.archived_at is not null then raise exception 'Snapshot is immutable; create a version'; end if;
  -- Child writes invalidate totals/PDF and serialize against payment/transition.
  -- Once per statement/quote, including direct DML. Never use a client-settable
  -- bypass flag: every row still checks ownership, immutability and the quote lock.
  -- A later statement advances the revision even if calculation is already null.
  if q.calculation is not null or q.pdf_url is not null or q.pdf_path is not null
    or q.updated_at < statement_timestamp() then
    update public.quotes set calculation=null,pdf_url=null,pdf_path=null where id=qid;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.create_quote_snapshot(p_quote jsonb, p_days jsonb)
 RETURNS public.quotes
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare q public.quotes; d jsonb; item jsonb; did uuid; purchase record; existing_groups uuid[]; gid uuid;
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
    if d#>>'{snapshot,block,id}' is not null and d->>'source_block_id' is not null
      and d->>'source_block_id' is distinct from d#>>'{snapshot,block,id}' then
      raise exception 'El origen del día no coincide con el bloque copiado.';
    end if;
    if d->>'source_block_id' is not null and d->'block_snapshot' is distinct from public.snapshot_day_block((d->>'source_block_id')::uuid) then
      raise exception 'El snapshot debe copiar el bloque completo y todos sus idiomas.';
    end if;
    insert into public.quote_days(quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,snapshot,source_block_id,block_snapshot,overrides,link_type,group_id,group_position)
    values(q.id,(d->>'day_number')::int,q.start_date+(d->>'day_number')::int-1,d->>'title',coalesce(d->>'description',''),
      d->>'includes',d->>'excludes',d->>'route_from',d->>'route_to',coalesce(d->'snapshot','{}'),(d->>'source_block_id')::uuid,coalesce(d->'block_snapshot','{}'),coalesce(d->'overrides','{}'),
      coalesce(d->>'link_type','chained'),(d->>'group_id')::uuid,(d->>'group_position')::int) returning id into did;
    for item in select value from jsonb_array_elements(coalesce(d->'items','[]')) loop
      perform public.insert_quote_item(did,item,false);
    end loop;
  end loop;
  -- Catalog copies with a single multi-day purchase always form a movement group.
  -- The TypeScript preparation already proposes groups; this also protects older callers.
  for purchase in select distinct (i.pricing_snapshot->>'coverage_start_day')::int first_day,i.day_span
    from public.quote_items i join public.quote_days day on day.id=i.quote_day_id
    where day.quote_id=q.id and day.source_block_id is not null and i.day_span>1
    order by first_day loop
    if purchase.first_day is null or (select count(*) from public.quote_days where quote_id=q.id
      and day_number between purchase.first_day and purchase.first_day+purchase.day_span-1)<>purchase.day_span then
      raise exception 'Servicio multi-día fuera del itinerario.';
    end if;
    select array_agg(distinct group_id) filter(where group_id is not null) into existing_groups from public.quote_days
      where quote_id=q.id and day_number between purchase.first_day and purchase.first_day+purchase.day_span-1;
    gid:=coalesce(existing_groups[1],gen_random_uuid());
    update public.quote_days set link_type='grouped',group_id=gid,group_position=day_number
      where quote_id=q.id and (day_number between purchase.first_day and purchase.first_day+purchase.day_span-1
        or group_id=any(existing_groups));
  end loop;
  update public.quote_days d set group_position=x.position
    from (select id,row_number() over(partition by group_id order by day_number)::int position
      from public.quote_days where quote_id=q.id and group_id is not null) x where d.id=x.id;
  update public.quotes set document_snapshot=coalesce(p_quote->'document_snapshot','{}')||public.quote_document_context(q.id)
    where id=q.id returning * into q;
  return q;
end; $function$;

CREATE OR REPLACE FUNCTION public.create_quote_from_template(p_template uuid, p_quote jsonb, p_days jsonb, p_source jsonb, p_result jsonb)
 RETURNS public.quotes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if not found or template.status not in ('activo','pendiente') then
    raise exception 'La plantilla está archivada o no está disponible.' using errcode='22023';
  end if;
  -- SECURITY DEFINER must independently enforce pending-template visibility;
  -- a caller cannot forge p_source to copy somebody else's private draft.
  if template.status='pendiente' and public.current_role()='vendedor'
    and template.created_by is distinct from auth.uid() then
    raise exception 'La plantilla no está disponible para tu usuario.' using errcode='42501';
  end if;
  if p_source is distinct from public.quote_template_source(p_template,(p_quote->>'client_id')::uuid) then
    raise exception 'La plantilla, las tarifas o las condiciones cambiaron; vuelve a crear la cotización.' using errcode='40001';
  end if;
  if p_source->'client' = 'null'::jsonb then raise exception 'Cliente no disponible.'; end if;
  if exists(select 1 from jsonb_to_recordset(p_source->'services') s(status text)
    where s.status not in ('activo','pendiente')) then raise exception 'Servicio inactivo.'; end if;
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
  -- Missing/ambiguous tariffs are draft data, not a reason to discard the trip.
  if coalesce(p_result->>'status','') not in ('ok','error')
    or jsonb_typeof(p_result->'items') is distinct from 'array' then
    raise exception 'El cálculo no está completo.';
  end if;
  foreach total_name in array array['total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp'] loop
    if p_result->>'status'='error' then
      if p_result->>total_name is not null then raise exception 'Un cálculo con errores no puede tener totales parciales.'; end if;
    elsif public.calculation_has_errors(p_result) or p_result->>total_name is null or not ((p_result->>total_name)::numeric>=0 and (p_result->>total_name)::numeric<'Infinity'::numeric) then
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
$function$;

CREATE OR REPLACE FUNCTION public.edit_quote_days(p_id uuid, p_operation text, p_payload jsonb, p_updated_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_result jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  q public.quotes; ds jsonb; its jsonb; d jsonb; it jsonb; selected jsonb; members uuid[]; requested int[];
  ordered jsonb:='[]'; moving jsonb:='[]'; remaining jsonb:='[]'; newitems jsonb:='[]'; content jsonb;
  gid uuid; n int; pos int; target int; start_n int; end_n int; old_start int; span int; offset_n int;
  k text; ir public.quote_items; blockid uuid; lang text; source jsonb;
  bundle jsonb; bundles jsonb; catalog jsonb; service_source jsonb;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if public.current_role() is null then raise exception 'Usuario sin permiso.' using errcode='42501'; end if;
  if q.archived_at is not null or q.status not in ('borrador','revisada') then
    raise exception 'Crea una versión antes de editar días de una cotización enviada.';
  end if;
  if p_result is not null and q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió; vuelve a intentar.' using errcode='40001';
  end if;
  select coalesce(jsonb_agg(qd order by qd.day_number),'[]') into ds from public.quote_days qd where qd.quote_id=q.id;
  select coalesce(jsonb_agg(i order by i.created_at,coalesce((i.pricing_snapshot->>'_creation_order')::int,0),i.id),'[]') into its
    from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=q.id;
  if p_operation not in ('content','link','group','ungroup','move','delete','save_block','add_block','add_blocks') then raise exception 'Operación desconocida.'; end if;
  if p_operation in ('content','link','move','delete','save_block') then
    select x into selected from jsonb_array_elements(ds) x where x->>'id'=p_payload->>'day_id';
    if selected is null then raise exception 'Día ajeno o inexistente.'; end if;
    select array_agg((x->>'id')::uuid) into members from jsonb_array_elements(ds) x
      where x->>'id'=selected->>'id' or (selected->>'group_id' is not null and x->>'group_id'=selected->>'group_id');
  end if;
  if p_operation='content' then
    for d in select value from jsonb_array_elements(ds) loop
      if d->>'id'=selected->>'id' then
        d:=d || jsonb_build_object('overrides',public.patch_day_overrides(d->'block_snapshot',d->'overrides',p_payload->'fields'));
        content:=public.resolve_day_content(d->'block_snapshot',d->'overrides');
        d:=d || jsonb_build_object('snapshot',coalesce(d->'snapshot','{}') ||
          jsonb_build_object('reviewed',true,'reviewed_by',auth.uid(),'reviewed_at',transaction_timestamp()));
        d:=d || jsonb_build_object('title',coalesce(content->'title'->>q.language,d->>'title'),
          'description',coalesce(content->'description'->>q.language,d->>'description'));
      end if;
      ordered:=ordered || jsonb_build_array(d);
    end loop;
    ds:=ordered;
  elsif p_operation='link' then
    if selected->>'link_type'='grouped' then raise exception 'Desagrupa el tramo antes de cambiar el enlace.'; end if;
    if p_payload->>'link_type' not in ('chained','independent') then raise exception 'Tipo de enlace inválido.'; end if;
    select jsonb_agg(case when x->>'id'=selected->>'id' then x || jsonb_build_object('link_type',p_payload->>'link_type') else x end order by (x->>'day_number')::int) into ds from jsonb_array_elements(ds) x;
  elsif p_operation='group' then
    select array_agg(value::int order by value::int) into requested from jsonb_array_elements_text(p_payload->'day_numbers');
    if coalesce(cardinality(requested),0)<2 or cardinality(requested)<>(select count(distinct x) from unnest(requested) x)
      or requested[cardinality(requested)]-requested[1]+1<>cardinality(requested) then raise exception 'Selecciona al menos dos días consecutivos.'; end if;
    select array_agg((x->>'id')::uuid) into members from jsonb_array_elements(ds) x where (x->>'day_number')::int=any(requested);
    if cardinality(members) is distinct from cardinality(requested) then raise exception 'Día inexistente.'; end if;
    if exists(select 1 from jsonb_array_elements(ds) x where not ((x->>'id')::uuid=any(members)) and x->>'group_id' in (
      select z->>'group_id' from jsonb_array_elements(ds) z where (z->>'id')::uuid=any(members))) then
      raise exception 'Incluye el grupo completo.';
    end if;
    gid:=(p_payload->>'group_id')::uuid;
    if gid is null then raise exception 'Falta group_id.'; end if;
    if exists(select 1 from public.quote_days where group_id=gid) then raise exception 'group_id ya utilizado.'; end if;
    select jsonb_agg(case when (x->>'id')::uuid=any(members) then x || jsonb_build_object('link_type','grouped','group_id',gid,
      'group_position',(x->>'day_number')::int-requested[1]+1) else x end order by (x->>'day_number')::int) into ds from jsonb_array_elements(ds) x;
  elsif p_operation='ungroup' then
    gid:=(p_payload->>'group_id')::uuid;
    if not exists(select 1 from jsonb_array_elements(ds) x where x->>'group_id'=gid::text) then raise exception 'Grupo ajeno o inexistente.'; end if;
    select jsonb_agg(case when x->>'group_id'=gid::text then x || jsonb_build_object('link_type','chained','group_id',null,'group_position',null) else x end order by (x->>'day_number')::int) into ds from jsonb_array_elements(ds) x;
  elsif p_operation in ('move','delete') then
    for d in select value from jsonb_array_elements(ds) loop
      if (d->>'id')::uuid=any(members) then moving:=moving || jsonb_build_array(d);
      else remaining:=remaining || jsonb_build_array(d); end if;
    end loop;
    if p_operation='delete' then ds:=remaining;
    else
      target:=(p_payload->>'target_day')::int;
      select x into selected from jsonb_array_elements(ds) x where (x->>'day_number')::int=target;
      if selected is null or (selected->>'id')::uuid=any(members) then raise exception 'Destino fuera del grupo requerido.'; end if;
      -- Drop before/after the entire destination group, never into its middle.
      select min((x->>'day_number')::int),max((x->>'day_number')::int) into start_n,end_n from jsonb_array_elements(ds) x
        where x->>'id'=selected->>'id' or (selected->>'group_id' is not null and x->>'group_id'=selected->>'group_id');
      old_start:=(moving->0->>'day_number')::int;
      for d in select value from jsonb_array_elements(remaining) loop
        n:=(d->>'day_number')::int;
        if target<old_start and n=start_n then ordered:=ordered || moving; end if;
        ordered:=ordered || jsonb_build_array(d);
        if target>old_start and n=end_n then ordered:=ordered || moving; end if;
      end loop;
      ds:=ordered;
    end if;
  elsif p_operation='save_block' then
    if nullif(btrim(p_payload->>'name'),'') is null then raise exception 'Indica el nombre del bloque.'; end if;
  elsif p_operation in ('add_block','add_blocks') then
    bundles:=case when p_operation='add_block' then jsonb_build_array(p_payload) else p_payload->'blocks' end;
    if jsonb_typeof(bundles) is distinct from 'array' or jsonb_array_length(bundles)=0 then raise exception 'Selecciona al menos un bloque.'; end if;
    -- Read each distinct service/rate set once for the whole batch (RLS applies).
    select coalesce(jsonb_object_agg(s.id,jsonb_build_object('service',to_jsonb(s),
      'rates',(select coalesce(jsonb_agg(r order by r.id),'[]') from public.service_rates r where r.service_id=s.id))),'{}')
      into catalog from public.services s where s.id in (
        select (i->>'service_id')::uuid from jsonb_array_elements(bundles) b
        cross join lateral jsonb_array_elements(b->'items') i);
    for bundle in select value from jsonb_array_elements(bundles) loop
    source:=public.snapshot_day_block((bundle->>'block_id')::uuid);
    if source is null or source#>>'{block,status}'='inactivo' then raise exception 'Bloque no disponible.'; end if;
    if bundle->'source' is distinct from source then raise exception 'El bloque cambió; vuelve a intentar.' using errcode='40001'; end if;
    d:=bundle->'day';
    if (d->>'day_number')::int<>jsonb_array_length(ds)+1 or d->'block_snapshot' is distinct from source then raise exception 'Copia de bloque inválida.'; end if;
    -- Re-read services and rates in the preparation and commit; compare the full bundle.
    for it in select value from jsonb_array_elements(bundle->'items') loop
      if p_operation='add_block' and (it->>'day_span')::int>1 then raise exception 'Inserta el tramo multi-día mediante una plantilla completa.'; end if;
      if it->>'quote_day_id'<>d->>'id' then raise exception 'Ítem ajeno al día.'; end if;
      if exists(select 1 from jsonb_array_elements(source->'services') src
        where src->'item_snapshot' is not null and src->'item_snapshot'<>'null'::jsonb
          and src=it#>'{pricing_snapshot,_source_link}') then continue; end if;
      service_source:=catalog->(it->>'service_id');
      if service_source is null or service_source#>>'{service,status}' not in ('activo','pendiente') then
        raise exception 'Servicio no disponible.';
      end if;
      if it#>'{pricing_snapshot,service}' is distinct from service_source->'service' or
        it#>'{pricing_snapshot,rates}' is distinct from service_source->'rates' then
        raise exception 'Las tarifas cambiaron; vuelve a intentar.' using errcode='40001';
      end if;
    end loop;
    ds:=ds || jsonb_build_array(d);
    its:=its || (bundle->'items');
    end loop;
  end if;
  -- Renumber, dates and group positions are always derived, never caller supplied.
  ordered:='[]'; n:=0;
  for d in select value from jsonb_array_elements(ds) loop
    n:=n+1;
    d:=d || jsonb_build_object('day_number',n,'date',q.start_date+n-1,'quote_id',q.id);
    if d->>'group_id' is not null then
      select count(*)+1 into pos from jsonb_array_elements(ordered) x where x->>'group_id'=d->>'group_id';
      d:=d || jsonb_build_object('group_position',pos);
    end if;
    ordered:=ordered || jsonb_build_array(d);
  end loop;
  ds:=ordered;
  -- Preserve purchase identity when moving groups. A purchase may not be split,
  -- even after ungrouping its presentation: reject rather than charge it twice.
  for it in select value from jsonb_array_elements(its) loop
    if not exists(select 1 from jsonb_array_elements(ds) x where x->>'id'=it->>'quote_day_id') then continue; end if;
    span:=(it->>'day_span')::int;
    if span>1 then
      k:=it#>>'{pricing_snapshot,coverage_key}';
      select min((x->>'day_number')::int),max((x->>'day_number')::int),count(*) into start_n,end_n,pos
        from jsonb_array_elements(ds) x join jsonb_array_elements(its) i on i->>'quote_day_id'=x->>'id'
        where i#>>'{pricing_snapshot,coverage_key}'=k;
      if k is null or pos<>span or end_n-start_n+1<>span then raise exception 'No se puede dividir una compra multi-día; conserva su tramo completo.'; end if;
      it:=jsonb_set(it,'{pricing_snapshot,coverage_start_day}',to_jsonb(start_n));
    end if;
    newitems:=newitems || jsonb_build_array(it);
  end loop;
  its:=newitems;
  if p_result is null then return jsonb_build_object('quote',to_jsonb(q),'days',ds,'items',its); end if;
  if jsonb_typeof(p_result->'items') is distinct from 'array' then raise exception 'Falta el recálculo.'; end if;
  if exists(select 1 from jsonb_array_elements(p_result->'items') i where not exists(
    select 1 from jsonb_array_elements(its) item join jsonb_array_elements(ds) day on day->>'id'=item->>'quote_day_id'
    where item->>'id'=i->>'id' and day->>'day_number'=i->>'day_number' and day->>'date'=i->>'date')) then raise exception 'Cálculo de otro itinerario.'; end if;
  if p_operation='save_block' then
    blockid:=(p_payload->>'new_block_id')::uuid;
    content:=public.resolve_day_content(selected->'block_snapshot',selected->'overrides');
    insert into public.day_blocks(id,code,name,parent_block_id,start_point,end_point,content,status,created_by,
        route_from,route_to,places,modality,default_day_position,hotel_service_id)
      values(blockid,'DER-'||blockid::text,btrim(p_payload->>'name'),(selected->>'source_block_id')::uuid,
        content->>'start_point',content->>'end_point',content,'pendiente',auth.uid(),
        selected->>'route_from',selected->>'route_to',
        array(select jsonb_array_elements_text(coalesce(selected#>'{block_snapshot,block,places}',selected#>'{snapshot,places}','[]'))),
        coalesce((selected#>>'{block_snapshot,block,modality}')::public.itinerary_modality,'privado'),(selected->>'day_number')::int,
        (select (i->>'service_id')::uuid from jsonb_array_elements(its) i where i->>'quote_day_id'=selected->>'id'
          and i->>'service_id'=selected#>>'{block_snapshot,block,hotel_service_id}' limit 1));
    for lang in select key from jsonb_each(coalesce(content->'title','{}') || coalesce(content->'description','{}')) loop
      insert into public.day_block_translations(block_id,lang,title,description,includes,excludes,reviewed)
        values(blockid,lang,coalesce(content->'title'->>lang,p_payload->>'name'),coalesce(content->'description'->>lang,''),
          (select t->>'includes' from jsonb_array_elements(coalesce(selected#>'{block_snapshot,translations}','[]')) t where t->>'lang'=lang),
          (select t->>'excludes' from jsonb_array_elements(coalesce(selected#>'{block_snapshot,translations}','[]')) t where t->>'lang'=lang),false);
    end loop;
    for it in select value from jsonb_array_elements(its) where value->>'quote_day_id'=selected->>'id' loop
      insert into public.day_block_items(block_id,service_id,qty,applies_tc,margin_applicable,included,is_optional,multi_day_span,coverage_key,coverage_start_day,pricing_config,item_snapshot)
        values(blockid,(it->>'service_id')::uuid,(it->>'qty')::numeric,(it->>'applies_tc')::boolean,(it->>'margin_applicable')::boolean,
          (it->>'included')::boolean,coalesce((it#>>'{pricing_snapshot,is_optional}')::boolean,false),(it->>'day_span')::int,
          case when (it->>'day_span')::int>1 then blockid::text||':'||coalesce(it#>>'{pricing_snapshot,coverage_key}',it->>'id') end,
          case when (it->>'day_span')::int>1 then 1 end,coalesce(it#>'{pricing_snapshot,pricing_config}','{}'),
          it || jsonb_build_object('adjustment_pct',0,'adjustment_note',null,'total_cost_usd',null,'total_cost_local',null));
    end loop;
  else
    delete from public.quote_days where quote_id=q.id and id not in(select (x->>'id')::uuid from jsonb_array_elements(ds) x);
    select coalesce(max(day_number),0)+jsonb_array_length(ds)+1 into offset_n from public.quote_days where quote_id=q.id;
    -- Appending cannot reorder existing days. Preserve their rows and timestamps.
    if p_operation not in ('add_block','add_blocks') then
      update public.quote_days set day_number=day_number+offset_n where quote_id=q.id;
    end if;
    for d in select value from jsonb_array_elements(ds) loop
      if p_operation in ('add_block','add_blocks') and exists(
        select 1 from public.quote_days where id=(d->>'id')::uuid and quote_id=q.id) then continue; end if;
      update public.quote_days set day_number=(d->>'day_number')::int,date=(d->>'date')::date,title=d->>'title',description=d->>'description',
        snapshot=d->'snapshot',overrides=d->'overrides',link_type=d->>'link_type',group_id=(d->>'group_id')::uuid,group_position=(d->>'group_position')::int where id=(d->>'id')::uuid and quote_id=q.id;
      if not found then
        insert into public.quote_days(id,quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,snapshot,source_block_id,block_snapshot,overrides,link_type,group_id,group_position)
          values((d->>'id')::uuid,q.id,(d->>'day_number')::int,(d->>'date')::date,d->>'title',d->>'description',d->>'includes',d->>'excludes',d->>'route_from',d->>'route_to',d->'snapshot',(d->>'source_block_id')::uuid,d->'block_snapshot',coalesce(d->'overrides','{}'),coalesce(d->>'link_type','chained'),(d->>'group_id')::uuid,(d->>'group_position')::int);
      end if;
    end loop;
    for it in select value from jsonb_array_elements(its) loop
      if exists(select 1 from public.quote_items i join public.quote_days day on day.id=i.quote_day_id
        where i.id=(it->>'id')::uuid and day.quote_id=q.id and i.pricing_snapshot=it->'pricing_snapshot') then continue; end if;
      update public.quote_items set pricing_snapshot=it->'pricing_snapshot' where id=(it->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=q.id);
      if not found then
        ir:=public.insert_quote_item((it->>'quote_day_id')::uuid,it,false);
        p_result:=jsonb_set(p_result,'{items}',(select jsonb_agg(case when x->>'id'=it->>'id' then x || jsonb_build_object('id',ir.id) else x end) from jsonb_array_elements(p_result->'items') x));
      end if;
    end loop;
  end if;
  select * into strict q from public.quotes where id=p_id;
  q:=public.save_quote_calculation(q.id,q.updated_at,p_result);
  return jsonb_build_object('quote_id',q.id,'block_id',blockid,'calculation',q.calculation);
end; $function$;

-- Persist all line results in one UPDATE; validate the full set before any write.
create or replace function public.save_quote_calculation(p_id uuid,p_updated_at timestamptz,p_result jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at is distinct from p_updated_at then raise exception 'Quote changed; recalculate again' using errcode='40001'; end if;
  if q.status not in ('borrador','revisada') or q.archived_at is not null then raise exception 'Cannot recalculate a sent quote'; end if;
  if jsonb_typeof(p_result->'items') is distinct from 'array' then raise exception 'Incomplete calculation'; end if;
  if (select count(distinct x->>'id') from jsonb_array_elements(p_result->'items') x) <> jsonb_array_length(p_result->'items') then
    raise exception 'Duplicate calculation items';
  end if;
  if exists(select 1 from jsonb_array_elements(p_result->'items') x where not exists(
    select 1 from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
    where i.id=(x->>'id')::uuid and d.quote_id=p_id)) then raise exception 'Calculation contains an unknown item'; end if;
  if exists(select 1 from jsonb_array_elements(p_result->'items') x join public.quote_items i on i.id=(x->>'id')::uuid
    where coalesce((x->>'adjustment_pct')::numeric,0) is distinct from i.adjustment_pct) then
    raise exception 'Calculation adjustment does not match saved item';
  end if;
  if jsonb_array_length(p_result->'items')<>(select count(*) from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=p_id) then
    raise exception 'Incomplete calculation';
  end if;
  update public.quote_items i set
    unit_cost_original=case when x->>'status'='error' or coalesce((x->>'covered')::boolean,false) then i.unit_cost_original else (x->>'unit_cost_original')::numeric end,
    unit_cost_usd=case when x->>'status'='error' then i.unit_cost_usd else (x->>'unit_cost_usd')::numeric end,
    total_cost_usd=case when x->>'status'='error' then null else (x->>'total_cost_usd')::numeric end,
    total_cost_local=case when x->>'status'='error' then null else (x->>'quantity')::numeric*(x->>'unit_cost_original')::numeric*(1+i.adjustment_pct) end
    from jsonb_array_elements(p_result->'items') x, public.quote_days d
    where i.id=(x->>'id')::uuid and d.id=i.quote_day_id and d.quote_id=p_id;
  update public.quotes set calculation=p_result,total_cost_usd=(p_result->>'total_cost_usd')::numeric,
    total_margin_usd=(p_result->>'total_margin_usd')::numeric,total_price_usd=(p_result->>'total_price_usd')::numeric,
    price_per_pax_usd=(p_result->>'price_per_pax_usd')::numeric,single_supplement_pp=(p_result->>'single_supplement_pp')::numeric
    where id=p_id returning * into q;
  return q;
end; $$;

commit;
