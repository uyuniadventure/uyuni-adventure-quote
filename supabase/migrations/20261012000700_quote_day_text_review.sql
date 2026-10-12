-- T01b: review the quote's copied text without changing its immutable source.
begin;

-- The optional third argument keeps the two-argument call working and makes
-- catalog review part of the SAME transaction (never a second browser write).
create function public.review_quote_days(
  p_quote_id uuid, p_day_ids uuid[] default null, p_also_update_block boolean default false
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  q public.quotes; d public.quote_days; tr public.day_block_translations;
  ids uuid[]; translation_ids uuid[] := '{}'; skipped jsonb := '[]'; frozen jsonb;
  review_stamp jsonb; reason text;
begin
  select * into q from public.quotes where id=p_quote_id for update;
  if not found or auth.uid() is null or public.current_role() is null then
    raise exception 'Cotización inexistente o sin permiso.' using errcode='42501';
  end if;
  if q.status<>'borrador' or q.archived_at is not null then
    raise exception 'Solo se pueden revisar textos de una cotización en borrador.';
  end if;
  if p_also_update_block and public.current_role() not in ('admin','operacion') then
    raise exception 'Solo administración u operación pueden revisar textos del catálogo.' using errcode='42501';
  end if;
  -- Reject a mixed/foreign selection BEFORE touching any row. [] is a no-op.
  if p_day_ids is not null and exists(
    select 1 from unnest(p_day_ids) requested(id)
    where not exists(select 1 from public.quote_days where quote_id=q.id and id=requested.id)
  ) then raise exception 'La selección contiene días ajenos o inexistentes.'; end if;
  select coalesce(array_agg(id order by day_number),'{}') into ids
    from public.quote_days where quote_id=q.id and (p_day_ids is null or id=any(p_day_ids));
  review_stamp:=jsonb_build_object('reviewed',true,'reviewed_by',auth.uid(),'reviewed_at',transaction_timestamp());

  if p_also_update_block then
    for d in select * from public.quote_days where quote_id=q.id and id=any(ids) order by day_number loop
      reason:=null;
      if d.source_block_id is null then
        reason:='Día sin bloque de origen.';
      elsif d.overrides ?| array['title','description','meals','accommodation_text','transport_text','schedule','start_point','end_point'] then
        reason:='El día tiene textos personalizados.';
      else
        select * into tr from public.day_block_translations
          where block_id=d.source_block_id and lang=q.language for update;
        if not found then
          reason:='No existe la traducción del bloque en el idioma de la cotización.';
        else
          select value into frozen from jsonb_array_elements(coalesce(d.block_snapshot->'translations','[]'))
            where value->>'lang'=q.language;
          -- Do not approve a live translation that has changed since the user
          -- read the quote. A later catalog edit must be reviewed separately.
          if frozen is null or jsonb_build_array(tr.title,tr.description,tr.includes,tr.excludes)
            is distinct from jsonb_build_array(frozen->>'title',frozen->>'description',frozen->>'includes',frozen->>'excludes') then
            reason:='El texto del bloque cambió desde que se copió a la cotización.';
          else
            update public.day_block_translations set reviewed=true where id=tr.id;
            if not found then raise exception 'Sin permiso para revisar la traducción del bloque.' using errcode='42501'; end if;
            if not tr.id=any(translation_ids) then translation_ids:=array_append(translation_ids,tr.id); end if;
          end if;
        end if;
      end if;
      if reason is not null then skipped:=skipped || jsonb_build_array(jsonb_build_object('day_id',d.id,'reason',reason)); end if;
    end loop;
  end if;

  update public.quote_days set snapshot=coalesce(snapshot,'{}') || review_stamp
    where quote_id=q.id and id=any(ids);
  -- guard_quote_child runs normally and invalidates the old PDF. Only review
  -- metadata changed, so the calculation (including any errors) remains valid.
  -- The quote lock prevents restoring an obsolete concurrent calculation.
  if cardinality(ids)>0 then
    update public.quotes set calculation=q.calculation where id=q.id;
  end if;
  return jsonb_build_object('quote_id',q.id,'day_ids',ids,
    'block_translation_ids',translation_ids,'skipped_blocks',skipped);
end; $$;
revoke all on function public.review_quote_days(uuid,uuid[],boolean) from public,anon;
grant execute on function public.review_quote_days(uuid,uuid[],boolean) to authenticated;

-- Small, guarded edits preserve the existing state machine / day operations.
-- Normalize line endings because some installations applied migrations on Windows.
do $migration$
declare definition text; old_fragment text; new_fragment text;
begin
  definition:=replace(pg_get_functiondef('public.edit_quote_days(uuid,text,jsonb,timestamptz,jsonb)'::regprocedure),chr(13),'');
  old_fragment:=$old$content:=public.resolve_day_content(d->'block_snapshot',d->'overrides');$old$;
  new_fragment:=$new$content:=public.resolve_day_content(d->'block_snapshot',d->'overrides');
        d:=d || jsonb_build_object('snapshot',coalesce(d->'snapshot','{}') ||
          jsonb_build_object('reviewed',true,'reviewed_by',auth.uid(),'reviewed_at',transaction_timestamp()));$new$;
  if strpos(definition,old_fragment)=0 then raise exception 'No se encontró la edición de contenido esperada en edit_quote_days.'; end if;
  definition:=replace(definition,old_fragment,replace(new_fragment,chr(13),''));
  old_fragment:=$old$overrides=d->'overrides',link_type=d->>'link_type'$old$;
  new_fragment:=$new$snapshot=d->'snapshot',overrides=d->'overrides',link_type=d->>'link_type'$new$;
  if strpos(definition,old_fragment)=0 then raise exception 'No se encontró la escritura de días esperada en edit_quote_days.'; end if;
  execute replace(definition,old_fragment,new_fragment);

  definition:=replace(pg_get_functiondef('public.guard_quote_state()'::regprocedure),chr(13),'');
  old_fragment:=$old$if exists(select 1 from public.quote_days where quote_id=new.id and
        (snapshot->>'reviewed')::boolean is distinct from true) then raise exception 'Review all translated days first'; end if;$old$;
  old_fragment:=replace(old_fragment,chr(13),'');
  new_fragment:=$new$if exists(select 1 from public.quote_days where quote_id=new.id and snapshot->'reviewed' is distinct from 'true'::jsonb) then
        raise exception 'Faltan revisar los textos de los días % (idioma %)',
          (select string_agg(day_number::text,', ' order by day_number) from public.quote_days
            where quote_id=new.id and snapshot->'reviewed' is distinct from 'true'::jsonb),upper(new.language);
      end if;$new$;
  if strpos(definition,old_fragment)=0 then raise exception 'No se encontró la validación de textos esperada en guard_quote_state.'; end if;
  execute replace(definition,old_fragment,replace(new_fragment,chr(13),''));
end; $migration$;
commit;
