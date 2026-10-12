-- Append a selected block sequence atomically, including complete multi-day purchases.
-- Retains the existing ownership/RLS, revision checks and all other day operations.
begin;
create or replace function public.edit_quote_days(
  p_id uuid,p_operation text,p_payload jsonb,p_updated_at timestamptz default null,p_result jsonb default null
) returns jsonb language plpgsql set search_path='' as $$
declare
  q public.quotes; ds jsonb; its jsonb; d jsonb; it jsonb; selected jsonb; members uuid[]; requested int[];
  ordered jsonb:='[]'; moving jsonb:='[]'; remaining jsonb:='[]'; newitems jsonb:='[]'; content jsonb;
  gid uuid; n int; pos int; target int; start_n int; end_n int; old_start int; span int; offset_n int;
  k text; ir public.quote_items; blockid uuid; lang text; source jsonb;
  s public.services; bundle jsonb; bundles jsonb;
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
      select * into strict s from public.services where id=(it->>'service_id')::uuid;
      if it#>'{pricing_snapshot,service}' is distinct from to_jsonb(s) or
        it#>'{pricing_snapshot,rates}' is distinct from (select coalesce(jsonb_agg(r order by id),'[]') from public.service_rates r where service_id=s.id) then
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
    update public.quote_days set day_number=day_number+offset_n where quote_id=q.id;
    for d in select value from jsonb_array_elements(ds) loop
      update public.quote_days set day_number=(d->>'day_number')::int,date=(d->>'date')::date,title=d->>'title',description=d->>'description',
        overrides=d->'overrides',link_type=d->>'link_type',group_id=(d->>'group_id')::uuid,group_position=(d->>'group_position')::int where id=(d->>'id')::uuid and quote_id=q.id;
      if not found then
        insert into public.quote_days(id,quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,snapshot,source_block_id,block_snapshot,link_type,group_id,group_position)
          values((d->>'id')::uuid,q.id,(d->>'day_number')::int,(d->>'date')::date,d->>'title',d->>'description',d->>'includes',d->>'excludes',d->>'route_from',d->>'route_to',d->'snapshot',(d->>'source_block_id')::uuid,d->'block_snapshot',coalesce(d->>'link_type','chained'),(d->>'group_id')::uuid,(d->>'group_position')::int);
      end if;
    end loop;
    for it in select value from jsonb_array_elements(its) loop
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
end; $$;
revoke all on function public.edit_quote_days(uuid,text,jsonb,timestamptz,jsonb) from public,anon;
grant execute on function public.edit_quote_days(uuid,text,jsonb,timestamptz,jsonb) to authenticated;


commit;