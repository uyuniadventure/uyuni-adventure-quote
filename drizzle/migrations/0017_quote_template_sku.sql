begin;

-- Invoker security keeps quotation ownership and catalog RLS in force.
-- The preview and commit share exactly the same SKU derivation.
create function public.prepare_quote_template(
  p_id uuid, p_route_from text default '', p_route_to text default ''
) returns jsonb language plpgsql stable set search_path='' as $$
declare q public.quotes; origin text; destination text; missing_origin boolean;
  missing_destination boolean; count_days int; suffix text; candidate text; existing jsonb;
begin
  select * into q from public.quotes where id=p_id;
  if not found then raise exception 'No tienes acceso a esta cotización.' using errcode='42501'; end if;
  select count(*) into count_days from public.quote_days where quote_id=p_id;
  if count_days=0 then raise exception 'Agrega al menos un día antes de guardar la plantilla.'; end if;
  select l.code into origin from public.location_codes l
    where l.code=upper(btrim((select route_from from public.quote_days where quote_id=p_id order by day_number limit 1))) and l.code<>'XXX';
  select l.code into destination from public.location_codes l
    where l.code=upper(btrim((select route_to from public.quote_days where quote_id=p_id order by day_number desc limit 1))) and l.code<>'XXX';
  missing_origin:=origin is null; missing_destination:=destination is null;
  if missing_origin then
    select code into origin from public.location_codes where code=upper(btrim(p_route_from)) and code<>'XXX';
  end if;
  if missing_destination then
    select code into destination from public.location_codes where code=upper(btrim(p_route_to)) and code<>'XXX';
  end if;
  -- Keep the program's hotel/feature suffix, never its quote code or COPY UUID.
  suffix:=substring(q.tour_sku from '^[^-]+-[0-9]+D[0-9]+N-(.+)$');
  suffix:=regexp_replace(coalesce(suffix,''),'(-COPY-[A-Za-z0-9]+|-V[0-9]+)+$','','i');
  if suffix='' or upper(suffix) like '%XXX%' then suffix:='CUSTOM'; end if;
  if origin is not null and destination is not null then
    candidate:=origin||destination||'-'||count_days||'D'||greatest(count_days-1,0)||'N-'||suffix;
    select jsonb_build_object('id',id,'sku',sku,'name',name,'updated_at',updated_at)
      into existing from public.itinerary_templates where sku=candidate;
  end if;
  return jsonb_build_object('sku',candidate,'route_from',origin,'route_to',destination,
    'needs_from',missing_origin,'needs_to',missing_destination,'days',count_days,
    'quote_updated_at',q.updated_at,'existing',existing);
end; $$;

create function public.save_quote_as_template(
  p_id uuid, p_mode text default 'create', p_route_from text default '', p_route_to text default '',
  p_expected_sku text default '', p_updated_at timestamptz default null,
  p_replace_id uuid default null, p_replace_updated_at timestamptz default null
) returns jsonb language plpgsql set search_path='' as $$
declare q public.quotes; d public.quote_days; i public.quote_items; old_template public.itinerary_templates;
  prepared jsonb; base_sku text; candidate text; tid uuid; bid uuid; revision int:=1;
  content jsonb; lang text; constraint_name text; operation_id uuid:=gen_random_uuid();
begin
  select * into q from public.quotes where id=p_id for update;
  if not found then raise exception 'No tienes acceso a esta cotización.' using errcode='42501'; end if;
  if p_updated_at is not null and q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió. Reabre el diálogo antes de guardar.' using errcode='40001';
  end if;
  if p_mode is null or p_mode not in ('create','new','replace') then
    raise exception 'Elige guardar como nueva o reemplazar la plantilla existente.' using errcode='22023';
  end if;
  prepared:=public.prepare_quote_template(p_id,p_route_from,p_route_to);
  base_sku:=prepared->>'sku'; candidate:=base_sku;
  if base_sku is null then
    raise exception 'Selecciona el origen del primer día y el destino del último día.' using errcode='22023';
  end if;
  if nullif(p_expected_sku,'') is not null and p_expected_sku<>base_sku then
    raise exception 'La ruta cambió. Reabre el diálogo para confirmar el nuevo SKU.' using errcode='40001';
  end if;
  -- Serialize writers for the same base SKU; the unique constraint is still the
  -- final arbiter against catalog writers that do not take this advisory lock.
  perform pg_advisory_xact_lock(hashtextextended('quote-template:'||base_sku,0));
  if p_mode='replace' then
    if public.current_role() is null or public.current_role() not in ('admin','operacion') then
      raise exception 'Solo Admin y Operación pueden reemplazar una plantilla existente.' using errcode='42501';
    end if;
    select * into old_template from public.itinerary_templates where id=p_replace_id and sku=base_sku for update;
    if not found then raise exception 'La plantilla a reemplazar ya no está disponible. Reabre el diálogo.'; end if;
    if p_replace_updated_at is null or old_template.updated_at is distinct from p_replace_updated_at then
      raise exception 'La plantilla cambió. Reabre el diálogo antes de reemplazarla.' using errcode='40001';
    end if;
    tid:=old_template.id;
    update public.itinerary_templates set name=q.code,route_from=prepared->>'route_from',route_to=prepared->>'route_to',
      route_type=(case when prepared->>'route_from'=prepared->>'route_to' then 'ROUNDTRIP' else 'ONEWAY' end)::public.route_type,
      days=(prepared->>'days')::int,nights=greatest((prepared->>'days')::int-1,0),category=q.category,
      status='pendiente',source_quote_id=q.id,quote_defaults='{}',import_warnings='[]',approval_issues='{}'
      where id=tid;
    -- Do not delete day_blocks: other templates or frozen quotes may reference them.
    delete from public.template_days where template_id=tid;
  else
    loop
      begin
        insert into public.itinerary_templates(sku,name,route_from,route_to,route_type,days,nights,category,status,source_quote_id,created_by)
          values(candidate,q.code,prepared->>'route_from',prepared->>'route_to',
            (case when prepared->>'route_from'=prepared->>'route_to' then 'ROUNDTRIP' else 'ONEWAY' end)::public.route_type,
            (prepared->>'days')::int,greatest((prepared->>'days')::int-1,0),q.category,'pendiente',q.id,auth.uid()) returning id into tid;
        exit;
      exception when unique_violation then
        get stacked diagnostics constraint_name=CONSTRAINT_NAME;
        if constraint_name<>'itinerary_templates_sku_key' then raise; end if;
        if p_mode='create' then
          raise exception 'Ya existe una plantilla con el SKU %. Elige Guardar como nueva o Reemplazar plantilla existente.',base_sku
            using errcode='23505',hint='template_sku_conflict';
        end if;
        revision:=revision+1;
        candidate:=base_sku||'-V'||revision;
      end;
    end loop;
  end if;
  for d in select * from public.quote_days where quote_id=q.id order by day_number loop
    content:=public.resolve_day_content(d.block_snapshot,d.overrides);
    insert into public.day_blocks(code,name,status,default_day_position,route_from,route_to,start_point,end_point,content,created_by)
      values('SNAP-'||operation_id||'-'||d.day_number,coalesce(content->'title'->>q.language,d.title),
        'pendiente',d.day_number,
        case when d.day_number=(select min(day_number) from public.quote_days where quote_id=q.id) then prepared->>'route_from' else d.route_from end,
        case when d.day_number=(select max(day_number) from public.quote_days where quote_id=q.id) then prepared->>'route_to' else d.route_to end,
        content->>'start_point',content->>'end_point',content,auth.uid()) returning id into bid;
    for lang in select jsonb_object_keys(coalesce(content->'title','{}')||coalesce(content->'description','{}')||jsonb_build_object(q.language,'')) loop
      insert into public.day_block_translations(block_id,lang,title,description,includes,excludes,reviewed)
        values(bid,lang,coalesce(content->'title'->>lang,case when lang=q.language then d.title else '' end),
          coalesce(content->'description'->>lang,case when lang=q.language then d.description else '' end),
          coalesce(content->'includes'->>lang,case when lang=q.language then d.includes end),
          coalesce(content->'excludes'->>lang,case when lang=q.language then d.excludes end),
          lang=q.language and coalesce((d.snapshot->>'reviewed')::boolean,false));
    end loop;
    insert into public.template_days(template_id,day_number,block_id) values(tid,d.day_number,bid);
    for i in select * from public.quote_items where quote_day_id=d.id loop
      insert into public.day_block_items(block_id,service_id,qty,applies_tc,margin_applicable,included,is_optional,multi_day_span,coverage_key,coverage_start_day,pricing_config,item_snapshot)
        values(bid,i.service_id,greatest(i.qty,0.0001),i.applies_tc,i.margin_applicable,i.included,
          coalesce((i.pricing_snapshot->>'is_optional')::boolean,false),i.day_span,
          case when i.day_span>1 then operation_id::text||':'||coalesce(i.pricing_snapshot->>'coverage_key',i.id::text) end,
          case when i.day_span>1 then coalesce((i.pricing_snapshot->>'coverage_start_day')::int,d.day_number) end,
          coalesce(i.pricing_snapshot->'_source_pricing_config',i.pricing_snapshot->'pricing_config','{}'),
          to_jsonb(i)||jsonb_build_object('adjustment_pct',0,'adjustment_note',null,'total_cost_usd',null,'total_cost_local',null));
    end loop;
  end loop;
  return jsonb_build_object('id',tid,'sku',candidate,'replaced',p_mode='replace');
end; $$;

-- Older callers remain safe: repeated promotion creates the next free version.
create or replace function public.promote_quote_template(p_id uuid) returns uuid
language sql set search_path='' as $$
  select (public.save_quote_as_template(p_id,'new')->>'id')::uuid;
$$;

revoke all on function public.prepare_quote_template(uuid,text,text),
  public.save_quote_as_template(uuid,text,text,text,text,timestamptz,uuid,timestamptz) from public,anon;
grant execute on function public.prepare_quote_template(uuid,text,text),
  public.save_quote_as_template(uuid,text,text,text,text,timestamptz,uuid,timestamptz) to authenticated;
commit;
