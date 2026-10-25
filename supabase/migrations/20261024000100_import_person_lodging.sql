begin;

-- Imported lodging is explicit for per-person rates. The implicit supplier path
-- remains available only for the existing per-room room-type alternatives.
create or replace function public.template_import_links(p_template uuid) returns jsonb language sql stable set search_path='' as $$
with segments as(
 select x.id,x.template_id,x.day_from day_number,x.slot_key,x.service_id,1::numeric qty,true is_default,
 'per_service'::text billing,x.day_to-x.day_from+1 span_days,'charged'::text tc_policy,
   (case when x.pricing_unit_override is null then '{}'::jsonb else
    jsonb_build_object('pricing_unit',x.pricing_unit_override::text)||
   case when x.pricing_unit_override='per_vehicle' then '{"vehicle_segment":"tour"}'::jsonb else '{}'::jsonb end end)||
   case when x.vehicle_max_pax_override is null then '{}'::jsonb else jsonb_build_object('vehicle_max_pax',x.vehicle_max_pax_override) end pricing_config,
 'segment:'||x.id::text coverage_key,x.day_from coverage_start_day
 from public.template_segment_items x where x.template_id=p_template
),nights as(
 select x.id,x.template_id,x.day_number,x.slot_key,s.id service_id,1::numeric qty,
 x.is_default,'per_day'::text billing,1 span_days,x.tc_policy,
 case when x.pricing_unit_override is not null then
   jsonb_build_object('pricing_unit',x.pricing_unit_override::text)||
   case when x.pricing_unit_override='per_vehicle' then '{"vehicle_segment":"tour"}'::jsonb else '{}'::jsonb end
  when x.slot_key='STAFF' then '{"pricing_unit":"per_group"}'::jsonb
  when x.slot_key='ALOJAMIENTO' and s.room_type in ('MAT','TWN','DBL_MAT','DBL_TWN') then '{"room_type":"DBL"}'::jsonb else '{}'::jsonb end pricing_config,
 null::text coverage_key,x.day_number coverage_start_day
 from public.template_day_items x left join public.hotel_codes h on h.id=x.hotel_id join public.services s on
  (x.service_id=s.id or (x.slot_key='ALOJAMIENTO' and x.service_id is null and
    s.supplier_id=coalesce(h.supplier_id,x.supplier_id) and
    s.type='alojamiento' and s.pricing_unit='per_room'))
 where x.template_id=p_template and (x.slot_key<>'ALOJAMIENTO' or s.type='alojamiento')
  and (public.current_role() in ('admin','operacion') or s.status='activo' or s.created_by=auth.uid())
),links as(select * from segments union all select * from nights)
select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('applies_tc',null,'margin_applicable',null) order by day_number,slot_key,service_id),'[]') from links x
$$;
revoke all on function public.template_import_links(uuid) from public,anon;
grant execute on function public.template_import_links(uuid) to authenticated;

create or replace function public.import_template_package(p_template uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p jsonb;tariffs jsonb;t public.itinerary_templates;k text;begin
 select * into t from public.itinerary_templates where id=p_template;
 if auth.uid() is null or public.current_role() is null or t.id is null or
  (t.status<>'activo' and public.current_role()='vendedor' and t.created_by is distinct from auth.uid()) then raise exception 'Plantilla no accesible.' using errcode='42501';end if;
 select b.package into p from public.import_batches b join public.import_rows r on r.batch_id=b.id
  where b.status='committed' and r.table_name='itinerary_templates' and r.payload->>'id'=p_template::text order by b.created_at desc limit 1;
 if p is null then raise exception 'Plantilla sin paquete v2.';end if;
 foreach k in array array['templates','days','segments','lodging','controls'] loop
  p:=jsonb_set(p,array[k],(select coalesce(jsonb_agg(v),'[]') from jsonb_array_elements(p->k) v where v->>'sku'=t.sku));
 end loop;
 p:=jsonb_set(p,'{rules}',(select coalesce(jsonb_agg(v),'[]') from jsonb_array_elements(p->'rules') v where v->>'ruta'=t.import_v2_route and (v->>'dias')::int=t.days));
 p:=jsonb_set(p,'{texts}',(select coalesce(jsonb_agg(v),'[]') from jsonb_array_elements(p->'texts') v where exists(select 1 from jsonb_array_elements(p->'days') d where d->>'bloque_texto_id'=v->>'bloque_texto_id')));
 p:=jsonb_set(p,'{blockItems}',(select coalesce(jsonb_agg(v),'[]') from jsonb_array_elements(p->'blockItems') v where exists(select 1 from jsonb_array_elements(p->'days') d where d->>'bloque_servicios_id'=v->>'bloque_servicios_id')));
 p:=jsonb_set(p,'{pdf}','[]');
 select jsonb_agg(v||jsonb_build_object('PRECIO_USD',rate.price_net::text,'Currency',coalesce(s.import_source_currency,v->>'Currency')) order by ord) into tariffs
 from jsonb_array_elements(p->'tariffs') with ordinality a(v,ord)
 join public.services s on s.sku=v->>'TariffCode' or exists(
  select 1 from public.service_sku_aliases alias
  where alias.sku=v->>'TariffCode' and alias.service_id=s.id
 )
 left join lateral(select sr.* from public.service_rates sr where sr.service_id=s.id
  and sr.valid_from=coalesce(nullif(v->>'ValidFrom','')::date,((v->>'Year')||'-01-01')::date)
  and sr.valid_to=coalesce(nullif(v->>'ValidTo','')::date,((v->>'Year')||'-12-31')::date)
  order by sr.id limit 1) rate on true
 where (public.current_role() in ('admin','operacion') or s.status='activo' or s.created_by=auth.uid()) and (
  exists(select 1 from public.template_segment_items item where item.template_id=p_template and item.service_id=s.id)
  or exists(select 1 from public.template_day_items item where item.template_id=p_template and item.service_id=s.id)
  or exists(
   select 1 from jsonb_array_elements((p->'segments')||(p->'blockItems')||(p->'lodging')) ref
   where ref->>'TariffCode'=s.sku or exists(
    select 1 from public.service_sku_aliases alias
    where alias.sku=ref->>'TariffCode' and alias.service_id=s.id
   )
  )
  or (s.type='alojamiento' and s.pricing_unit='per_room' and exists(
   select 1 from jsonb_array_elements(p->'lodging') n
   join public.suppliers sp on lower(sp.name)=lower(n->>'proveedor')
   where n->>'slot'='ALOJAMIENTO' and sp.id=s.supplier_id
    and coalesce(n->>'unidad','PER_ROOM_PER_NIGHT') not in ('PER_PERSON_PER_NIGHT','PER_PAX_PER_NIGHT')
  ))
  or exists(select 1 from jsonb_array_elements(p->'blockItems') n
   join public.services base on base.sku=n->>'TariffCode' or exists(
    select 1 from public.service_sku_aliases alias
    where alias.sku=n->>'TariffCode' and alias.service_id=base.id
   )
   where n->>'slot'='TRASLADO_FRONTERA' and base.supplier_id=s.supplier_id and base.import_v2_route=s.import_v2_route)
 );
 return jsonb_set(p,'{tariffs}',coalesce(tariffs,'[]'));
end $$;
revoke all on function public.import_template_package(uuid) from public,anon;
grant execute on function public.import_template_package(uuid) to authenticated;

-- Imported economic fields are written only by the reviewed commit path. Manual
-- templates retain their existing defaults and editing permissions.
create or replace function public.guard_template_economic_status() returns trigger language plpgsql set search_path='' as $$
declare trusted_import_write boolean:=current_user not in ('authenticated','anon') and
 coalesce(current_setting('app.import_economic_write',true),'')='on';protected_new boolean;protected_old boolean:=false;begin
 protected_new:=new.catalog_origin='importacion' and new.source_quote_id is null and (
  new.import_v2_route is not null or new.import_includes_id is not null or new.import_excludes_id is not null or
  exists(select 1 from public.import_rows r join public.import_batches b on b.id=r.batch_id
   where r.table_name='itinerary_templates' and r.payload->>'id'=new.id::text and b.kind='paquete_v2')
 );
 if tg_op='UPDATE' then
  protected_old:=old.catalog_origin='importacion' and old.source_quote_id is null and (
   old.import_v2_route is not null or old.import_includes_id is not null or old.import_excludes_id is not null or
   exists(select 1 from public.import_rows r join public.import_batches b on b.id=r.batch_id
    where r.table_name='itinerary_templates' and r.payload->>'id'=old.id::text and b.kind='paquete_v2')
  );
 end if;
 -- Only package-owned imported templates require economic validation to activate.
 -- Manual templates (and templates originating from quotes) retain their workflow.
 if (protected_new or protected_old) and new.status='activo'
    and new.economic_status is distinct from 'validated' then
   raise exception 'La plantilla importada requiere validación económica antes de activarse.';
 end if;
 if (protected_new or protected_old) and not trusted_import_write then
  if tg_op='INSERT' and not (
   new.economic_status in ('pending','blocked') and cardinality(new.economic_issues)>0
  ) then
   raise exception 'Una plantilla importada nueva debe quedar pendiente o bloqueada con una razón económica.' using errcode='42501';
  elsif tg_op='UPDATE' and not protected_old and not (
   new.economic_status in ('pending','blocked') and cardinality(new.economic_issues)>0
  ) then
   raise exception 'Una plantilla convertida a importada debe quedar pendiente o bloqueada con una razón económica.' using errcode='42501';
  elsif tg_op='UPDATE' and protected_old and (
   new.economic_status is distinct from old.economic_status or new.economic_issues is distinct from old.economic_issues
  ) then
   raise exception 'El estado económico importado solo puede cambiar mediante una importación validada.' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
drop trigger if exists template_economic_guard on public.itinerary_templates;
create trigger template_economic_guard before insert or update of status,economic_status,economic_issues,catalog_origin,import_v2_route,import_includes_id,import_excludes_id on public.itinerary_templates
 for each row execute function public.guard_template_economic_status();

-- The server checks that the staged payload exactly matches the economic
-- assessment and that "validated" covers the historical 1..5 pax matrix.
create or replace function public._validate_import_economics(p_package jsonb,p_rows jsonb,p_validation jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare errors jsonb:='[]';row_data jsonb;payload jsonb;assessment jsonb;sku text;pax int;source_count int;control_count int;begin
 if jsonb_typeof(p_validation->'templates') is distinct from 'array' or
    jsonb_typeof(p_validation->'control') is distinct from 'array' then
  return jsonb_build_array(jsonb_build_object('key','economic','message','Falta evaluación económica completa.'));
 end if;
 for row_data in select value from jsonb_array_elements(p_rows)
  where value->>'table_name'='itinerary_templates'
 loop
  payload:=row_data->'payload';sku:=payload->>'sku';
  select value into assessment from jsonb_array_elements(p_validation->'templates')
   where value->>'sku'=sku;
  if assessment is null or (select count(*) from jsonb_array_elements(p_validation->'templates') v where v->>'sku'=sku)<>1 then
   errors:=errors||jsonb_build_array(jsonb_build_object('key',sku,'message','Falta una evaluación económica única.'));
   continue;
  end if;
  if coalesce(payload->>'economic_status','') not in ('validated','pending','blocked') or
     payload->>'economic_status' is distinct from assessment->>'status' or
     coalesce(payload->'economic_issues','[]') is distinct from coalesce(assessment->'reasons','[]') then
   errors:=errors||jsonb_build_array(jsonb_build_object('key',sku,'message','El estado económico no coincide con la evaluación preparada.'));
   continue;
  end if;
  if payload->>'economic_status'<>'validated' and jsonb_array_length(coalesce(payload->'economic_issues','[]'))=0 then
   errors:=errors||jsonb_build_array(jsonb_build_object('key',sku,'message','El estado económico pendiente o bloqueado debe conservar sus razones.'));
  end if;
  if payload->>'economic_status'='validated' then
   if jsonb_array_length(coalesce(assessment->'reasons','[]'))<>0 then
    errors:=errors||jsonb_build_array(jsonb_build_object('key',sku,'message','Una plantilla validada no puede conservar incidencias económicas.'));
   end if;
   for pax in 1..5 loop
    select count(*) into source_count from jsonb_array_elements(p_package->'controls') v
     where v->>'sku'=sku and (v->>'pax')::int=pax;
    select count(*) into control_count from jsonb_array_elements(p_validation->'control') v
     where v->>'sku'=sku and (v->>'pax')::int=pax and v->'error'='null'::jsonb
      and jsonb_typeof(v->'delta')='number' and abs((v->>'delta')::numeric)<=1;
    if source_count<>1 or control_count<>1 then
     errors:=errors||jsonb_build_array(jsonb_build_object('key',sku,'message','Cobertura económica insuficiente o ambigua para pax '||pax||'.'));
    end if;
   end loop;
  end if;
 end loop;
 return errors;
end $$;
revoke all on function public._validate_import_economics(jsonb,jsonb,jsonb) from public,anon,authenticated;

alter function public.stage_import_package(text,jsonb,jsonb,jsonb) rename to stage_import_package_before_economic_guard;
create function public.stage_import_package(p_file_name text,p_package jsonb,p_rows jsonb,p_validation jsonb) returns uuid
language plpgsql security definer set search_path='' as $$ begin
 p_validation:=jsonb_set(p_validation,'{errors}',coalesce(p_validation->'errors','[]')||
  public._validate_import_economics(p_package,p_rows,p_validation));
 return public.stage_import_package_before_economic_guard(p_file_name,p_package,p_rows,p_validation);
end $$;
revoke all on function public.stage_import_package_before_economic_guard(text,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.stage_import_package(text,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.stage_import_package(text,jsonb,jsonb,jsonb) to authenticated;

alter function public.commit_import_batch(uuid) rename to commit_import_batch_before_economic_guard;
create function public.commit_import_batch(p_batch_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 perform set_config('app.import_economic_write','on',true);
 return public.commit_import_batch_before_economic_guard(p_batch_id);
end $$;
revoke all on function public.commit_import_batch_before_economic_guard(uuid) from public,anon,authenticated;
revoke all on function public.commit_import_batch(uuid) from public,anon;
grant execute on function public.commit_import_batch(uuid) to authenticated;

commit;
