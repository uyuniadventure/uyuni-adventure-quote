begin;

alter table public.day_blocks
  add column parent_block_id uuid references public.day_blocks(id) on delete set null,
  add column start_point text,
  add column end_point text,
  add column name text,
  add column content jsonb not null default '{}';
alter table public.quote_days
  add column source_block_id uuid references public.day_blocks(id) on delete set null,
  add column block_snapshot jsonb not null default '{}',
  add column overrides jsonb not null default '{}',
  add column link_type text not null default 'chained' check(link_type in ('chained','independent','grouped')),
  add column group_id uuid,
  add column group_position int,
  add constraint quote_day_group_shape check (
    (link_type='grouped' and group_id is not null and group_position is not null and group_position>0) or
    (link_type<>'grouped' and group_id is null and group_position is null));
alter table public.quote_items add column source_block_service_id uuid;
-- Provenance may identify either day_block_items or activity_module_items.
-- No FK: deleting/rebuilding a catalog link must not erase historical provenance.
comment on column public.quote_items.source_block_service_id is
  'Original day_block_items or activity_module_items id; kind and full link are frozen in pricing_snapshot._source_link.';
create index quote_days_group_idx on public.quote_days(group_id) where group_id is not null;
create index quote_days_source_block_idx on public.quote_days(source_block_id);
create index day_blocks_parent_idx on public.day_blocks(parent_block_id);

-- Historical quotes retain only text already saved, never today's library text.
-- Disable child invalidation during this metadata-only backfill (also covers sent quotes).
alter table public.quote_days disable trigger guard_quote_day;
update public.quote_days d set
  source_block_id=(select b.id from public.day_blocks b where b.id::text=coalesce(d.snapshot#>>'{block,id}',d.snapshot->>'block_id')),
  block_snapshot=d.snapshot || jsonb_build_object('legacy',true,'content',jsonb_build_object(
    'title',jsonb_build_object(q.language,d.title),'description',jsonb_build_object(q.language,d.description),
    'start_point',d.route_from,'end_point',d.route_to))
from public.quotes q where q.id=d.quote_id;
alter table public.quote_days enable trigger guard_quote_day;
alter table public.quote_days add constraint quote_day_snapshot_shape check (
  jsonb_typeof(block_snapshot)='object' and jsonb_typeof(block_snapshot->'content')='object');
alter table public.quote_items disable trigger guard_quote_item;
update public.quote_items set source_block_service_id=(pricing_snapshot#>>'{_source_link,id}')::uuid
where pricing_snapshot#>>'{_source_link,id}' is not null;
alter table public.quote_items enable trigger guard_quote_item;

-- Bucket 'media' created via the storage tool (private); only policies run here.
create policy media_read on storage.objects for select to authenticated
  using(bucket_id='media' and auth.uid() is not null);
create policy media_insert on storage.objects for insert to authenticated
  with check(bucket_id='media' and public.current_role() in ('admin','operacion'));
create policy media_update on storage.objects for update to authenticated
  using(bucket_id='media' and public.current_role() in ('admin','operacion'))
  with check(bucket_id='media' and public.current_role() in ('admin','operacion'));
create policy media_delete on storage.objects for delete to authenticated
  using(bucket_id='media' and public.current_role() in ('admin','operacion'));

-- Content patch contract is checked by Postgres as well as Zod.
create function public.validate_day_content(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object' then return false; end if;
  for k,v in select * from jsonb_each(p) loop
    if k in ('title','description','accommodation_text','transport_text') then
      if jsonb_typeof(v)<>'object' or exists(select 1 from jsonb_each(v) e
        where e.key !~ '^[a-z]{2}(-[A-Za-z]{2})?$' or jsonb_typeof(e.value)<>'string') then return false; end if;
    elsif k in ('start_point','end_point','internal_notes') then
      if jsonb_typeof(v) not in ('string','null') then return false; end if;
    elsif k in ('meals','schedule','photo_ids') then
      if jsonb_typeof(v)<>'array' or exists(select 1 from jsonb_array_elements(v) e where jsonb_typeof(e)<>'string') then return false; end if;
    else return false;
    end if;
  end loop;
  return true;
end; $$;
alter table public.quote_days add constraint quote_day_content_only check(public.validate_day_content(overrides));
alter table public.day_blocks add constraint block_content_only check(public.validate_day_content(content));

create function public.resolve_day_content(p_snapshot jsonb,p_overrides jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb:=coalesce(p_snapshot->'content','{}'); k text; v jsonb;
begin
  for k,v in select * from jsonb_each(p_overrides) loop
    if jsonb_typeof(v)='object' then v:=coalesce(result->k,'{}') || v; end if;
    result:=result || jsonb_build_object(k,v);
  end loop;
  return result;
end; $$;

create function public.patch_day_overrides(snap jsonb,old_overrides jsonb,patch jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb:=old_overrides; k text; v jsonb; lang text; txt jsonb; localized jsonb;
begin
  if not public.validate_day_content(patch) then raise exception 'Solo se admite contenido en overrides.'; end if;
  for k,v in select * from jsonb_each(patch) loop
    if jsonb_typeof(v)='object' then
      localized:=coalesce(result->k,'{}');
      for lang,txt in select * from jsonb_each(v) loop
        if txt is not distinct from snap->'content'->k->lang then localized:=localized-lang;
        else localized:=localized || jsonb_build_object(lang,txt); end if;
      end loop;
      if localized='{}'::jsonb then result:=result-k;
      else result:=result || jsonb_build_object(k,localized); end if;
    elsif v is not distinct from snap->'content'->k then result:=result-k;
    else result:=result || jsonb_build_object(k,v); end if;
  end loop;
  return result;
end; $$;

-- Copies include every translation and module, plus all default service links.
create function public.snapshot_day_block(p_id uuid) returns jsonb
language sql stable set search_path='' as $$
with b as (select * from public.day_blocks where id=p_id),
links as (select * from public.day_block_modules where block_id=p_id),
texts as (select * from public.day_block_translations where block_id=p_id),
mods as (select l.id,l."order",jsonb_build_object('link',to_jsonb(l),'module',to_jsonb(m),
  'translations',(select coalesce(jsonb_agg(t order by t.id),'[]') from public.activity_module_translations t where t.module_id=m.id),
  'items',(select coalesce(jsonb_agg(i order by i.id),'[]') from public.activity_module_items i where i.module_id=m.id)) as doc
  from links l join public.activity_modules m on m.id=l.module_id)
select jsonb_build_object('block',to_jsonb(b),
  'translations',(select coalesce(jsonb_agg(t order by id),'[]') from texts t),
  'services',(select coalesce(jsonb_agg(i order by id),'[]') from public.day_block_items i where block_id=p_id),
  'modules',(select coalesce(jsonb_agg(doc order by "order",id),'[]') from mods),
  'content', b.content || jsonb_build_object(
    'title',coalesce((select jsonb_object_agg(lang,title) from texts),'{}'),
    'description',coalesce((select jsonb_object_agg(t.lang,t.description || coalesce((select string_agg(E'\n\n'||mt.title||E'\n'||mt.description,'' order by l."order",l.id)
      from links l join public.activity_module_translations mt on mt.module_id=l.module_id and mt.lang=t.lang),'')) from texts t),'{}'),
    'start_point',coalesce(b.start_point,b.route_from),'end_point',coalesce(b.end_point,b.route_to))) from b;
$$;
revoke all on function public.snapshot_day_block(uuid) from public,anon;
grant execute on function public.snapshot_day_block(uuid) to authenticated;

-- Direct insertion also freezes provenance; frozen copies/versioning never read the live block.
create function public.freeze_quote_day() returns trigger language plpgsql set search_path='' as $$
declare lang text;
begin
  if tg_op='UPDATE' then
    if new.block_snapshot is distinct from old.block_snapshot or (new.source_block_id is distinct from old.source_block_id
      and not (pg_trigger_depth()>1 and new.source_block_id is null)) then
      raise exception 'El snapshot y su origen son inmutables.';
    end if;
  elsif new.block_snapshot='{}'::jsonb then
    new.source_block_id:=coalesce(new.source_block_id,(new.snapshot#>>'{block,id}')::uuid,(new.snapshot->>'block_id')::uuid);
    if new.source_block_id is not null then new.block_snapshot:=public.snapshot_day_block(new.source_block_id);
    else
      select language into lang from public.quotes where id=new.quote_id;
      new.block_snapshot:=jsonb_build_object('content',jsonb_build_object('title',jsonb_build_object(lang,new.title),
        'description',jsonb_build_object(lang,new.description),'start_point',new.route_from,'end_point',new.route_to));
    end if;
  end if;
  return new;
end; $$;
create trigger freeze_quote_day before insert or update on public.quote_days for each row execute function public.freeze_quote_day();
create function public.trace_quote_item() returns trigger language plpgsql set search_path='' as $$
begin
  new.source_block_service_id:=coalesce((new.pricing_snapshot#>>'{_source_link,id}')::uuid,new.source_block_service_id);
  return new;
end; $$;
create trigger trace_quote_item before insert on public.quote_items for each row execute function public.trace_quote_item();

create or replace function public.create_quote_snapshot(p_quote jsonb,p_days jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; d jsonb; item jsonb; did uuid; purchase record; existing_groups uuid[]; gid uuid;
begin
  if p_quote->>'template_id' is not null then
    raise exception 'Usa create_quote_from_template para copiar una plantilla y guardar su cálculo atómicamente.';
  end if;
  insert into public.quotes(code,template_id,client_id,client_type,language,start_date,pax_paying,tc_count,category,
    tour_sku,rooming,vehicles,staff,fx_snapshot,margin_pct,margin_mode,rounding_rule,pricing_config,document_snapshot,pax_scenarios,
    deposit_pct,balance_due_days,card_surcharge_pct,payment_schedule)
  values(public.next_quote_code(p_quote->>'tour_sku',p_quote->>'language'),(p_quote->>'template_id')::uuid,
    (p_quote->>'client_id')::uuid,(p_quote->>'client_type')::public.client_type,p_quote->'language',
    (p_quote->>'start_date')::date,(p_quote->>'pax_paying')::integer,coalesce((p_quote->>'tc_count')::integer,0),
    (p_quote->>'category')::public.tour_category,p_quote->'tour_sku',p_quote->'rooming',p_quote->'vehicles',
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
    insert into public.quote_days(quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,snapshot,source_block_id,block_snapshot,link_type,group_id,group_position)
    values(q.id,(d->>'day_number')::int,q.start_date+(d->>'day_number')::int-1,d->>'title',coalesce(d->>'description',''),
      d->>'includes',d->>'excludes',d->>'route_from',d->>'route_to',coalesce(d->'snapshot','{}'),(d->>'source_block_id')::uuid,coalesce(d->'block_snapshot','{}'),
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
end; $$;

create or replace function public.version_quote(p_id uuid) returns uuid
language plpgsql set search_path='' as $$
declare q public.quotes; d public.quote_days; i public.quote_items; original_id uuid; next_id uuid:=gen_random_uuid(); did uuid; groups jsonb:='{}'; old_group text;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.archived_at is not null then raise exception 'Archived version'; end if;
  if q.status in ('borrador','revisada') then return q.id; end if;
  if q.status<>'enviada' then raise exception 'Only sent quotes can be versioned'; end if;
  original_id:=q.id;
  update public.quotes set archived_at=now() where id=original_id;
  q.id:=next_id; q.parent_quote_id:=original_id; q.version:=q.version+1;
  q.code:=regexp_replace(q.code,'-v[0-9]+$','')||'-v'||q.version;
  q.status:='borrador'; q.archived_at:=null; q.pdf_url:=null; q.pdf_path:=null; q.calculation:=null;
  q.total_cost_usd:=null; q.total_margin_usd:=null; q.total_price_usd:=null; q.price_per_pax_usd:=null;
  q.created_at:=now(); q.updated_at:=now();
  insert into public.quotes select q.*;
  for d in select * from public.quote_days where quote_id=original_id order by day_number loop
    did:=d.id; d.id:=gen_random_uuid(); d.quote_id:=next_id; d.created_at:=now(); d.updated_at:=now();
    if d.group_id is not null then
      old_group:=d.group_id::text;
      if not groups ? old_group then groups:=groups || jsonb_build_object(old_group,gen_random_uuid()); end if;
      d.group_id:=(groups->>old_group)::uuid;
    end if;
    insert into public.quote_days select d.*;
    for i in select * from public.quote_items where quote_day_id=did loop
      i.pricing_snapshot:=i.pricing_snapshot||jsonb_build_object('_version_source_id',i.id);
      i.id:=gen_random_uuid(); i.quote_day_id:=d.id; i.created_at:=now(); i.updated_at:=now();
      insert into public.quote_items select i.*;
    end loop;
  end loop;
  return next_id;
end; $$;

-- Preview is read-only. Apply reconstructs the same plan under the quote lock,
-- verifies the revision and saves children + calculation in a single transaction.
create function public.edit_quote_days(
  p_id uuid,p_operation text,p_payload jsonb,p_updated_at timestamptz default null,p_result jsonb default null
) returns jsonb language plpgsql set search_path='' as $$
declare
  q public.quotes; ds jsonb; its jsonb; d jsonb; it jsonb; selected jsonb; members uuid[]; requested int[];
  ordered jsonb:='[]'; moving jsonb:='[]'; remaining jsonb:='[]'; newitems jsonb:='[]'; content jsonb;
  gid uuid; n int; pos int; target int; start_n int; end_n int; old_start int; span int; offset_n int;
  k text; ir public.quote_items; blockid uuid; lang text; source jsonb;
  s public.services;
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
  if p_operation not in ('content','link','group','ungroup','move','delete','save_block','add_block') then raise exception 'Operación desconocida.'; end if;
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
  elsif p_operation='add_block' then
    source:=public.snapshot_day_block((p_payload->>'block_id')::uuid);
    if source is null or source#>>'{block,status}'='inactivo' then raise exception 'Bloque no disponible.'; end if;
    if p_payload->'source' is distinct from source then raise exception 'El bloque cambió; vuelve a intentar.' using errcode='40001'; end if;
    d:=p_payload->'day';
    if (d->>'day_number')::int<>jsonb_array_length(ds)+1 or d->'block_snapshot' is distinct from source then raise exception 'Copia de bloque inválida.'; end if;
    -- Re-read services and rates in the preparation and commit; compare the full bundle.
    for it in select value from jsonb_array_elements(p_payload->'items') loop
      if (it->>'day_span')::int>1 then raise exception 'Inserta el tramo multi-día mediante una plantilla completa.'; end if;
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
    its:=its || (p_payload->'items');
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
        insert into public.quote_days(id,quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,snapshot,source_block_id,block_snapshot)
          values((d->>'id')::uuid,q.id,(d->>'day_number')::int,(d->>'date')::date,d->>'title',d->>'description',d->>'includes',d->>'excludes',d->>'route_from',d->>'route_to',d->'snapshot',(d->>'source_block_id')::uuid,d->'block_snapshot');
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

-- Checked at transaction end, so intermediate renumbering never exposes a partial group.
create function public.check_quote_day_group() returns trigger
language plpgsql security definer set search_path='' as $$
declare g uuid;
begin
  for g in select distinct x from unnest(array[
    case when tg_op<>'DELETE' then new.group_id end,
    case when tg_op<>'INSERT' then old.group_id end]) x where x is not null loop
    if exists(select 1 from public.quote_days where group_id=g group by group_id
      having count(distinct quote_id)>1 or max(day_number)-min(day_number)+1<>count(*)
        or min(group_position)<>1 or max(group_position)<>count(*) or count(distinct group_position)<>count(*)) then
      raise exception 'Un grupo debe pertenecer a una cotización y contener días consecutivos.';
    end if;
  end loop;
  return null;
end; $$;
revoke all on function public.check_quote_day_group() from public,anon,authenticated;
create constraint trigger quote_day_group_integrity after insert or update or delete on public.quote_days
  deferrable initially deferred for each row execute function public.check_quote_day_group();

commit;