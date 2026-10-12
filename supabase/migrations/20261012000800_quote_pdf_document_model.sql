begin;

-- Includes/excludes and customer notes now participate in the frozen day model.
create or replace function public.validate_day_content(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object' then return false; end if;
  for k,v in select * from jsonb_each(p) loop
    if k in ('title','description','includes','excludes','accommodation_text','transport_text','client_note') then
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

-- New quote snapshots take every translated piece of customer-facing day text.
create or replace function public.snapshot_day_block(p_id uuid) returns jsonb
language sql stable set search_path='' as $$
with b as (select * from public.day_blocks where id=p_id),
links as (select * from public.day_block_modules where block_id=p_id),
texts as (select * from public.day_block_translations where block_id=p_id),
mods as (select l.id,l."order",jsonb_build_object('link',to_jsonb(l),'module',to_jsonb(m),
  'translations',(select coalesce(jsonb_agg(t order by t.id),'[]') from public.activity_module_translations t where t.module_id=m.id),
  'items',(select coalesce(jsonb_agg(i order by i.id),'[]') from public.activity_module_items i where i.module_id=m.id)) as doc
  from links l join public.activity_modules m on m.id=l.module_id)
select jsonb_build_object('block',to_jsonb(b),
  'translations',(select coalesce(jsonb_agg(x order by x.id),'[]') from texts x),
  'services',(select coalesce(jsonb_agg(i order by i.id),'[]') from public.day_block_items i where block_id=p_id),
  'modules',(select coalesce(jsonb_agg(doc order by "order",id),'[]') from mods),
  'content', b.content || jsonb_build_object(
    'title',coalesce((select jsonb_object_agg(lang,title) from texts),'{}'),
    'description',coalesce((select jsonb_object_agg(t.lang,t.description || coalesce((select string_agg(E'\n\n'||mt.title||E'\n'||mt.description,'' order by l."order",l.id)
      from links l join public.activity_module_translations mt on mt.module_id=l.module_id and mt.lang=t.lang),'')) from texts t),'{}'),
    'includes',coalesce((select jsonb_object_agg(lang,includes) from texts where includes is not null),'{}'),
    'excludes',coalesce((select jsonb_object_agg(lang,excludes) from texts where excludes is not null),'{}'),
    'start_point',coalesce(b.start_point,b.route_from),'end_point',coalesce(b.end_point,b.route_to))) from b;
$$;
revoke all on function public.snapshot_day_block(uuid) from public,anon;
grant execute on function public.snapshot_day_block(uuid) to authenticated;

-- Preserve the exact legacy strings from each quote's language. This is a text
-- only backfill: block_snapshot is immutable and pricing/PDF totals are kept.
alter table public.quote_days disable trigger guard_quote_day;
update public.quote_days d set overrides = coalesce(d.overrides,'{}') ||
  case when not (coalesce(d.overrides->'title','{}') ? q.language)
      and d.title is distinct from d.block_snapshot->'content'->'title'->>q.language
    then jsonb_build_object('title',coalesce(d.overrides->'title','{}') || jsonb_build_object(q.language,coalesce(d.title,''))) else '{}'::jsonb end ||
  case when not (coalesce(d.overrides->'description','{}') ? q.language)
      and d.description is distinct from d.block_snapshot->'content'->'description'->>q.language
    then jsonb_build_object('description',coalesce(d.overrides->'description','{}') || jsonb_build_object(q.language,coalesce(d.description,''))) else '{}'::jsonb end ||
  case when d.includes is not null and not (coalesce(d.overrides->'includes','{}') ? q.language)
      and d.includes is distinct from d.block_snapshot->'content'->'includes'->>q.language
    then jsonb_build_object('includes',coalesce(d.overrides->'includes','{}') || jsonb_build_object(q.language,d.includes)) else '{}'::jsonb end ||
  case when d.excludes is not null and not (coalesce(d.overrides->'excludes','{}') ? q.language)
      and d.excludes is distinct from d.block_snapshot->'content'->'excludes'->>q.language
    then jsonb_build_object('excludes',coalesce(d.overrides->'excludes','{}') || jsonb_build_object(q.language,d.excludes)) else '{}'::jsonb end ||
  case when not (d.overrides ? 'start_point')
      and d.route_from is distinct from public.resolve_day_content(d.block_snapshot,'{}')->>'start_point'
    then jsonb_build_object('start_point',d.route_from) else '{}'::jsonb end ||
  case when not (d.overrides ? 'end_point')
      and d.route_to is distinct from public.resolve_day_content(d.block_snapshot,'{}')->>'end_point'
    then jsonb_build_object('end_point',d.route_to) else '{}'::jsonb end
from public.quotes q
where q.id=d.quote_id and (d.title is not null or d.description is not null or d.includes is not null or d.excludes is not null or d.route_from is not null or d.route_to is not null);
set constraints quote_day_group_integrity immediate;
alter table public.quote_days enable trigger guard_quote_day;

-- A document text edit invalidates its old PDF but leaves its pricing result intact.
do $migration$
declare definition text; old_fragment text; new_fragment text;
begin
  definition:=replace(pg_get_functiondef('public.guard_quote_state()'::regprocedure),chr(13),'');
  old_fragment:=$old$if (to_jsonb(new)-array['updated_at','status','lost_reason','cancel_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url','pdf_path']) is distinct from
     (to_jsonb(old)-array['updated_at','status','lost_reason','cancel_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url','pdf_path']) then
    new.calculation:=null; new.pdf_url:=null; new.pdf_path:=null;
  end if;$old$;
  new_fragment:=$new$if (to_jsonb(new)-array['updated_at','status','lost_reason','cancel_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url','pdf_path','document_snapshot']) is distinct from
     (to_jsonb(old)-array['updated_at','status','lost_reason','cancel_reason','archived_at','next_followup_at','calculation','total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd','single_supplement_pp','pdf_url','pdf_path','document_snapshot']) then
    new.calculation:=null; new.pdf_url:=null; new.pdf_path:=null;
  elsif new.document_snapshot is distinct from old.document_snapshot then
    new.pdf_url:=null; new.pdf_path:=null;
  end if;$new$;
  if strpos(definition,old_fragment)=0 then
    raise exception 'No se reconoce la invalidación del cálculo en guard_quote_state.';
  end if;
  execute replace(definition,old_fragment,new_fragment);
end;
$migration$;

create function public.validate_quote_document_patch(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object' or p='{}'::jsonb then return false; end if;
  for k,v in select * from jsonb_each(p) loop
    if k='client_name' then
      if jsonb_typeof(v)<>'string' or length(btrim(v#>>'{}')) not between 1 and 200 then return false; end if;
    elsif k in ('introduction','guide','payment_text','cancellation') then
      if jsonb_typeof(v)<>'string' or length(v#>>'{}')>20000 then return false; end if;
    elsif k='terms_url' then
      if jsonb_typeof(v)<>'string' or length(v#>>'{}')>2048 then return false; end if;
    elsif k='info' then
      if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>50 or exists(
        select 1 from jsonb_array_elements(v) block
        where jsonb_typeof(block)<>'object' or jsonb_object_length(block)<>2
          or not (block ? 'title' and block ? 'content')
          or jsonb_typeof(block->'title')<>'string' or length(btrim(block->>'title')) not between 1 and 200
          or jsonb_typeof(block->'content')<>'string' or length(block->>'content')>10000
      ) then return false; end if;
    else return false;
    end if;
  end loop;
  return true;
end; $$;
revoke all on function public.validate_quote_document_patch(jsonb) from public,anon;
grant execute on function public.validate_quote_document_patch(jsonb) to authenticated;

create function public.save_quote_document(
  p_quote_id uuid,p_updated_at timestamptz,p_patch jsonb
) returns public.quotes language plpgsql security invoker set search_path='' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id=p_quote_id for update;
  if not found then raise exception 'Cotización inexistente o sin permiso.' using errcode='42501'; end if;
  if q.archived_at is not null or q.status<>'borrador' then
    raise exception 'Los textos del PDF solo se pueden editar en borrador.';
  end if;
  if q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió; vuelve a guardar el texto.' using errcode='40001';
  end if;
  if not public.validate_quote_document_patch(p_patch) then raise exception 'Contenido del documento inválido.'; end if;
  update public.quotes set document_snapshot=coalesce(document_snapshot,'{}')||p_patch,
    updated_at=clock_timestamp() where id=q.id returning * into q;
  return q;
end; $$;
revoke all on function public.save_quote_document(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.save_quote_document(uuid,timestamptz,jsonb) to authenticated;

create function public.save_quote_item_label(
  p_quote_id uuid,p_item_id uuid,p_updated_at timestamptz,p_label text
) returns public.quotes language plpgsql security invoker set search_path='' as $$
declare q public.quotes; labels jsonb; document jsonb;
begin
  select * into q from public.quotes where id=p_quote_id for update;
  if not found then raise exception 'Cotización inexistente o sin permiso.' using errcode='42501'; end if;
  if q.archived_at is not null or q.status<>'borrador' then
    raise exception 'Las etiquetas del PDF solo se pueden editar en borrador.';
  end if;
  if q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió; vuelve a guardar la etiqueta.' using errcode='40001';
  end if;
  if not exists(select 1 from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
    where i.id=p_item_id and d.quote_id=q.id) then
    raise exception 'El servicio no pertenece a esta cotización.' using errcode='42501';
  end if;
  if p_label is null or length(btrim(p_label))>200 then raise exception 'Etiqueta inválida.'; end if;
  document:=coalesce(q.document_snapshot,'{}');
  labels:=coalesce(document->'item_labels','{}');
  if btrim(p_label)='' then labels:=labels-p_item_id::text;
  else labels:=labels||jsonb_build_object(p_item_id::text,btrim(p_label)); end if;
  if labels='{}'::jsonb then document:=document-'item_labels';
  else document:=jsonb_set(document,'{item_labels}',labels,true); end if;
  update public.quotes set document_snapshot=document,updated_at=clock_timestamp()
    where id=q.id returning * into q;
  return q;
end; $$;
revoke all on function public.save_quote_item_label(uuid,uuid,timestamptz,text) from public,anon;
grant execute on function public.save_quote_item_label(uuid,uuid,timestamptz,text) to authenticated;

create function public.reset_quote_day_field(
  p_day_id uuid,p_field text,p_updated_at timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare q public.quotes; d public.quote_days; new_overrides jsonb; content jsonb; localized jsonb;
begin
  select * into d from public.quote_days where id=p_day_id;
  if not found then raise exception 'Día inexistente o sin permiso.' using errcode='42501'; end if;
  select * into q from public.quotes where id=d.quote_id for update;
  if not found then raise exception 'Cotización inexistente o sin permiso.' using errcode='42501'; end if;
  if q.archived_at is not null or q.status<>'borrador' then
    raise exception 'Los textos del PDF solo se pueden editar en borrador.';
  end if;
  if q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió; vuelve a restaurar el texto.' using errcode='40001';
  end if;
  if p_field not in ('title','description','includes','excludes','accommodation_text','transport_text',
    'client_note','meals','schedule','start_point','end_point','internal_notes','photo_ids') then
    raise exception 'Campo de día no editable.';
  end if;
  new_overrides:=coalesce(d.overrides,'{}');
  if p_field in ('title','description','includes','excludes','accommodation_text','transport_text','client_note') then
    localized:=coalesce(new_overrides->p_field,'{}')-q.language;
    if localized='{}'::jsonb then new_overrides:=new_overrides-p_field;
    else new_overrides:=jsonb_set(new_overrides,array[p_field],localized,true); end if;
  else new_overrides:=new_overrides-p_field;
  end if;
  content:=public.resolve_day_content(d.block_snapshot,new_overrides);
  update public.quote_days set overrides=new_overrides,
    title=coalesce(content->'title'->>q.language,d.title),
    description=coalesce(content->'description'->>q.language,d.description),
    includes=content->'includes'->>q.language,
    excludes=content->'excludes'->>q.language,
    route_from=content->>'start_point',route_to=content->>'end_point',
    snapshot=coalesce(d.snapshot,'{}')||jsonb_build_object('reviewed',true,'reviewed_by',auth.uid(),'reviewed_at',transaction_timestamp())
    where id=d.id;
  -- guard_quote_child invalidates the old PDF; a text-only reset keeps the saved price.
  update public.quotes set calculation=q.calculation where id=q.id;
  return jsonb_build_object('quote_id',q.id,'day_id',d.id,'overrides',new_overrides,
    'updated_at',(select updated_at from public.quotes where id=q.id));
end; $$;
revoke all on function public.reset_quote_day_field(uuid,text,timestamptz) from public,anon;
grant execute on function public.reset_quote_day_field(uuid,text,timestamptz) to authenticated;

commit;
