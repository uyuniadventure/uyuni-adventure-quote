begin;
-- These links belong to the TEMPLATE. They are never inserted into day_block_items.
create function public.template_import_links(p_template uuid) returns jsonb language sql stable set search_path='' as $$
with segments as(
 select x.id,x.template_id,x.day_from day_number,x.slot_key,x.service_id,1::numeric qty,true is_default,
 'per_service'::text billing,x.day_to-x.day_from+1 span_days,'charged'::text tc_policy,'{}'::jsonb pricing_config,
 'segment:'||x.id::text coverage_key,x.day_from coverage_start_day
 from public.template_segment_items x where x.template_id=p_template
),nights as(
 select x.id,x.template_id,x.day_number,x.slot_key,s.id service_id,1::numeric qty,
 x.is_default,'per_day'::text billing,1 span_days,x.tc_policy,
 case when x.slot_key='STAFF' then '{"pricing_unit":"per_group"}'::jsonb
  when x.slot_key='ALOJAMIENTO' and s.room_type in ('MAT','TWN','DBL_MAT','DBL_TWN') then '{"room_type":"DBL"}'::jsonb else '{}'::jsonb end pricing_config,
 null::text coverage_key,x.day_number coverage_start_day
 from public.template_day_items x join public.services s on
  (x.service_id=s.id or (x.slot_key='ALOJAMIENTO' and x.service_id is null and s.supplier_id=x.supplier_id and s.pricing_unit='per_room'))
 where x.template_id=p_template and (public.current_role() in ('admin','operacion') or s.status='activo' or s.created_by=auth.uid())
),links as(select * from segments union all select * from nights)
select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('applies_tc',null,'margin_applicable',null) order by day_number,slot_key,service_id),'[]') from links x
$$;
revoke all on function public.template_import_links(uuid) from public,anon;
grant execute on function public.template_import_links(uuid) to authenticated;

-- Extend the existing exact-source read model, preserving its private permissions.
alter function public.quote_template_source(uuid,uuid) rename to quote_template_source_before_v2;
create function public.quote_template_source(p_template uuid,p_client uuid) returns jsonb language sql stable set search_path='' as $$
with base as(select public.quote_template_source_before_v2(p_template,p_client) data),
links as(select public.template_import_links(p_template) data),
s as(select distinct s.* from public.services s where s.id in (
 select (v->>'id')::uuid from base,jsonb_array_elements(base.data->'services') v
 union select (v->>'service_id')::uuid from links,jsonb_array_elements(links.data) v))
select base.data||jsonb_build_object('importLinks',links.data,
 'services',(select coalesce(jsonb_agg(x order by id),'[]') from s x),
 'rates',(select coalesce(jsonb_agg(r order by id),'[]') from public.service_rates r where service_id in(select id from s))) from base,links
$$;
revoke all on function public.quote_template_source(uuid,uuid) from public,anon,authenticated;
-- The TS read model uses normal RLS queries; only the atomic writer uses this private function.

do $patch$ declare definition text;old text;begin
 definition:=pg_get_functiondef('public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure);
 definition:=replace(definition,'lock table public.itinerary_templates,','lock table public.template_segment_items,public.template_day_items,public.itinerary_templates,');
 old:='where d.template_id=p_template and d.day_number=n'||chr(10)||'        union all';
 if position(old in definition)=0 then raise exception 'No se encontró el control de enlaces de plantilla.';end if;
 definition:=replace(definition,old,'where d.template_id=p_template and d.day_number=n and (i.variant_key is null or i.variant_key=d.variant_key)'||chr(10)||'        union all');
 -- Existing mandatory-link check now includes template-owned segments/rooms.
 definition:=replace(definition,') links where not exists (',
  'union all select v source from jsonb_array_elements(public.template_import_links(p_template)) v where (v->>''day_number'')::int=n ) links where not exists (');
 definition:=replace(definition,'b.hotel_service_id is not null or exists',
  'exists(select 1 from public.template_day_items ni where ni.template_id=p_template and ni.day_number=n) or exists(select 1 from public.template_segment_items si where si.template_id=p_template and n between si.day_from and si.day_to) or b.hotel_service_id is not null or exists');
 -- Preserve drafts made exclusively of text without pretending they have costs.
 definition:=replace(definition,'if jsonb_typeof(day->''items'') is distinct from ''array'' or jsonb_array_length(day->''items'')=0',
  'if jsonb_typeof(day->''items'') is distinct from ''array'' or (template.import_v2_route is null and jsonb_array_length(day->''items'')=0)');
 definition:=replace(definition,'and ('||chr(10)||'          exists(select 1 from public.template_day_items',
  'and (template.import_v2_route is not null or '||chr(10)||'          exists(select 1 from public.template_day_items');
 if position('return public.save_quote_calculation(q.id,q.updated_at,p_result);' in definition)=0 then raise exception 'Falta el guardado atómico de plantilla.';end if;
 definition:=replace(definition,'return public.save_quote_calculation(q.id,q.updated_at,p_result);',
  'if template.import_v2_route is not null then insert into public.quote_rooming(quote_id,room_type,count,for_tc) select q.id,key,value::int,false from jsonb_each_text(q.rooming->''paying'') where value::int>0 union all select q.id,key,value::int,true from jsonb_each_text(q.rooming->''tc'') where value::int>0; end if; return public.save_quote_calculation(q.id,q.updated_at,p_result);');
 execute definition;
end $patch$;
-- Replacing an imported template with a quote snapshot must not leave its old
-- template-owned links behind and charge them again alongside the new snapshot.
do $patch$ declare definition text;begin
 definition:=pg_get_functiondef('public.save_quote_as_template(uuid,text,text,text,text,timestamptz,uuid,timestamptz)'::regprocedure);
 definition:=replace(definition,'delete from public.template_days where template_id=tid;',
  'delete from public.template_segment_items where template_id=tid; delete from public.template_day_items where template_id=tid; update public.itinerary_templates set import_v2_route=null,import_includes_id=null,import_excludes_id=null where id=tid; delete from public.template_days where template_id=tid;');
 execute definition;
end $patch$;
-- Template-owned lodging freezes its own hotel, without changing the reusable block.
do $patch$ declare definition text;begin
 definition:=pg_get_functiondef('public.edit_quote_selection(uuid,text,jsonb,timestamptz,jsonb)'::regprocedure);
 definition:=replace(definition,'(d.block_snapshot#>>''{block,hotel_id}'')::uuid','coalesce((d.block_snapshot#>>''{block,hotel_id}'')::uuid,ref.supplier_id)');
 definition:=replace(definition,'''selection_source'',''manual'',''qty'',','''selection_source'',''manual'',''qty_override'',null,''qty'',');
 definition:=replace(definition,'set selected=i.selected,selection_source=i.selection_source,qty=i.qty','set selected=i.selected,selection_source=i.selection_source,qty_override=i.qty_override,qty=i.qty');
 execute definition;
end $patch$;

-- Reconstruct the package from its successful batch and CURRENT native rates.
-- Batch contents themselves remain Admin-only; this getter enforces template visibility.
create function public.import_template_package(p_template uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
 p:=jsonb_set(p,'{pdf}','[]'); -- Fixed document texts are not inputs to costTemplate.
 select jsonb_agg(v||jsonb_build_object('Price NETO',coalesce(rate.price_net,rate.price_rack)::text,'Valor RACK',rate.price_rack::text,'Currency',s.currency) order by ord) into tariffs
 from jsonb_array_elements(p->'tariffs') with ordinality a(v,ord)
 join public.services s on s.sku=v->>'TariffCode'
 left join lateral(select sr.* from public.service_rates sr where sr.service_id=s.id
  and sr.valid_from=coalesce(nullif(v->>'ValidFrom','')::date,((v->>'Year')||'-01-01')::date)
  and sr.valid_to=coalesce(nullif(v->>'ValidTo','')::date,((v->>'Year')||'-12-31')::date)
  order by sr.id limit 1) rate on true
 where (public.current_role() in ('admin','operacion') or s.status='activo' or s.created_by=auth.uid()) and (
  exists(select 1 from jsonb_array_elements((p->'segments')||(p->'blockItems')||(p->'lodging')) ref where ref->>'TariffCode'=s.sku)
  or (s.pricing_unit='per_room' and exists(select 1 from jsonb_array_elements(p->'lodging') n join public.suppliers sp on lower(sp.name)=lower(n->>'proveedor') where n->>'slot'='ALOJAMIENTO' and sp.id=s.supplier_id))
  or exists(select 1 from jsonb_array_elements(p->'blockItems') n join public.services base on base.sku=n->>'TariffCode' where n->>'slot'='TRASLADO_FRONTERA' and base.supplier_id=s.supplier_id and base.import_v2_route=s.import_v2_route)
 );
 return jsonb_set(p,'{tariffs}',coalesce(tariffs,'[]'));
end $$;
revoke all on function public.import_template_package(uuid) from public,anon;
grant execute on function public.import_template_package(uuid) to authenticated;
-- Template-owned services participate in the existing approval machinery too.
alter function public._template_approval_rows(uuid[],uuid[]) rename to _template_approval_rows_before_v2;
create function public._template_approval_rows(ids uuid[],eligible_services uuid[] default '{}')
returns table(id uuid,code text,name text,reasons text[]) language sql stable set search_path='' as $$
 select base.id,base.code,base.name,array(select distinct reason from unnest(base.reasons||array(
  select 'Día '||(l->>'day_number')||': servicio de plantilla no aprobado ('||s.sku||').' from jsonb_array_elements(public.template_import_links(base.id)) l
  join public.services s on s.id=(l->>'service_id')::uuid where s.status<>'activo' and not(s.id=any(eligible_services))
 )) reason order by reason) from public._template_approval_rows_before_v2(ids,eligible_services) base
$$;
revoke all on function public._template_approval_rows(uuid[],uuid[]) from public,anon,authenticated;
do $patch$ declare definition text;begin
 definition:=pg_get_functiondef('public._lock_catalog_approval()'::regprocedure);
 definition:=replace(definition,'public.template_days,public.day_blocks','public.template_days,public.template_day_items,public.template_segment_items,public.day_blocks');execute definition;
 definition:=pg_get_functiondef('public.approve_valid_imports(boolean,text,boolean)'::regprocedure);
 definition:=replace(definition,'(select jsonb_agg(t order by t.id) from public.itinerary_templates t),',
 '(select jsonb_agg(t order by t.id) from public.itinerary_templates t),(select jsonb_agg(t order by t.id) from public.template_day_items t),(select jsonb_agg(t order by t.id) from public.template_segment_items t),');
 execute definition;
end $patch$;
commit;
