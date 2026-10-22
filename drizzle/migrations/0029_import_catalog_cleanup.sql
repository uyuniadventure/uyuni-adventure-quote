-- Controlled removal of explicitly selected legacy import services.
-- Providers, clients, quotes and operational records are never deleted here.
begin;

create function public._review_imported_service_cleanup(ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 normalized uuid[];
 missing_count integer;
 unproven_count integer;
 protected_active_count integer;
 media_count integer;
 module_count integer;
 legacy_hotel_count integer;
 block_item_count integer;
 quote_item_count integer;
 segment_count integer;
 template_day_count integer;
 rule_count integer;
 rate_count integer;
 alias_count integer;
 request_count integer;
 supplier_ids uuid[];
 issues text[];
 fingerprint text;
begin
 if ids is null or cardinality(ids)=0 or array_position(ids,null) is not null then
  raise exception 'Indica una lista no vacía de servicios.' using errcode='22023';
 end if;
 select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into normalized from unnest(ids) x;
 if cardinality(normalized)<>cardinality(ids) then
  raise exception 'La lista de servicios contiene IDs repetidos.' using errcode='22023';
 end if;

 select count(*) into missing_count from unnest(normalized) x
  where not exists(select 1 from public.services s where s.id=x);
 select count(*) into unproven_count from public.services s where s.id=any(normalized)
  and s.source is distinct from 'paquete_v2'
  and not exists(select 1 from public.service_rates r where r.service_id=s.id and r.source_row is not null);
 select count(*) into protected_active_count from public.services s where s.id=any(normalized)
  and s.status='activo' and s.source is distinct from 'paquete_v2';

 select count(*) into media_count from public.media where service_id=any(normalized);
 select count(*) into module_count from public.activity_module_items where service_id=any(normalized);
 select count(*) into legacy_hotel_count from public.day_blocks where hotel_service_id=any(normalized);
 select count(*) into block_item_count from public.day_block_items where service_id=any(normalized);
 select count(*) into quote_item_count from public.quote_items where service_id=any(normalized);
 select count(*) into segment_count from public.template_segment_items where service_id=any(normalized);
 select count(*) into template_day_count from public.template_day_items where service_id=any(normalized);
 select count(*) into rule_count from public.segment_rules where service_id=any(normalized);
 select count(*) into rate_count from public.service_rates where service_id=any(normalized);
 select count(*) into alias_count from public.service_sku_aliases where service_id=any(normalized);
 select count(*) into request_count from public.service_change_requests
  where service_id=any(normalized) or rate_id in(select id from public.service_rates where service_id=any(normalized));
 select coalesce(array_agg(distinct supplier_id order by supplier_id) filter(where supplier_id is not null),'{}'::uuid[])
  into supplier_ids from public.services where id=any(normalized);

 issues:=array_remove(array[
  case when missing_count>0 then format('%s servicios no existen',missing_count) end,
  case when unproven_count>0 then format('%s servicios no tienen procedencia de importación comprobable',unproven_count) end,
  case when protected_active_count>0 then format('%s servicios activos no pertenecen a paquete_v2',protected_active_count) end,
  case when media_count>0 then format('%s referencias de media',media_count) end,
  case when module_count>0 then format('%s referencias de módulos',module_count) end,
  case when legacy_hotel_count>0 then format('%s referencias hoteleras históricas',legacy_hotel_count) end,
  case when block_item_count>0 then format('%s referencias de catálogo',block_item_count) end,
  case when quote_item_count>0 then format('%s referencias de cotizaciones',quote_item_count) end,
  case when segment_count+template_day_count+rule_count>0 then
   format('%s referencias de plantillas importadas',segment_count+template_day_count+rule_count) end
 ],null);

 select md5(jsonb_build_object(
  'ids',normalized,
  'services',coalesce((select jsonb_agg(to_jsonb(s) order by s.id) from public.services s where s.id=any(normalized)),'[]'::jsonb),
  'rates',coalesce((select jsonb_agg(to_jsonb(r) order by r.id) from public.service_rates r where r.service_id=any(normalized)),'[]'::jsonb),
  'aliases',coalesce((select jsonb_agg(to_jsonb(a) order by a.id) from public.service_sku_aliases a where a.service_id=any(normalized)),'[]'::jsonb),
  'media',coalesce((select jsonb_agg(id order by id) from public.media where service_id=any(normalized)),'[]'::jsonb),
  'modules',coalesce((select jsonb_agg(id order by id) from public.activity_module_items where service_id=any(normalized)),'[]'::jsonb),
  'legacy_hotels',coalesce((select jsonb_agg(id order by id) from public.day_blocks where hotel_service_id=any(normalized)),'[]'::jsonb),
  'catalog_items',coalesce((select jsonb_agg(id order by id) from public.day_block_items where service_id=any(normalized)),'[]'::jsonb),
  'quote_items',coalesce((select jsonb_agg(id order by id) from public.quote_items where service_id=any(normalized)),'[]'::jsonb),
  'template_segments',coalesce((select jsonb_agg(id order by id) from public.template_segment_items where service_id=any(normalized)),'[]'::jsonb),
  'template_days',coalesce((select jsonb_agg(id order by id) from public.template_day_items where service_id=any(normalized)),'[]'::jsonb),
  'rules',coalesce((select jsonb_agg(id order by id) from public.segment_rules where service_id=any(normalized)),'[]'::jsonb)
 )::text) into fingerprint;

 return jsonb_build_object(
  'service_ids',normalized,'services',cardinality(normalized)-missing_count,
  'rates',rate_count,'aliases',alias_count,'change_requests',request_count,
  'providers_retained',supplier_ids,'clients_deleted',0,'quotes_deleted',0,
  'dependencies',jsonb_build_object(
   'media',media_count,'activity_modules',module_count,'legacy_hotels',legacy_hotel_count,
   'catalog_items',block_item_count,'quote_items',quote_item_count,
   'template_segments',segment_count,'template_day_items',template_day_count,'segment_rules',rule_count
  ),
  'issues',to_jsonb(issues),'can_delete',cardinality(issues)=0,'fingerprint',fingerprint
 );
end;
$$;
revoke all on function public._review_imported_service_cleanup(uuid[]) from public,anon,authenticated;

create function public.review_imported_service_cleanup(ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or public.current_role() is distinct from 'admin' then
  raise exception 'Solo Admin puede preparar la limpieza del tarifario importado.' using errcode='42501';
 end if;
 return public._review_imported_service_cleanup(ids);
end;
$$;
revoke all on function public.review_imported_service_cleanup(uuid[]) from public,anon;
grant execute on function public.review_imported_service_cleanup(uuid[]) to authenticated;

create function public.cleanup_imported_services(
 ids uuid[],p_expected_fingerprint text,p_confirm text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare review jsonb; deleted_count integer;
begin
 if auth.uid() is null or public.current_role() is distinct from 'admin' then
  raise exception 'Solo Admin puede limpiar el tarifario importado.' using errcode='42501';
 end if;
 if p_confirm is distinct from 'BORRAR TARIFARIO IMPORTADO' then
  raise exception 'Escribe BORRAR TARIFARIO IMPORTADO para confirmar.' using errcode='22023';
 end if;
 lock table public.services,public.service_rates,public.service_sku_aliases,
  public.service_change_requests,public.media,public.activity_module_items,
  public.day_blocks,public.day_block_items,public.quote_items,
  public.template_segment_items,public.template_day_items,public.segment_rules
  in share row exclusive mode;
 review:=public._review_imported_service_cleanup(ids);
 if review->>'fingerprint' is distinct from p_expected_fingerprint then
  raise exception 'El catálogo cambió; repite la previsualización.' using errcode='40001';
 end if;
 if not (review->>'can_delete')::boolean then
  raise exception 'La limpieza tiene dependencias o procedencia ambigua: %',review->'issues';
 end if;
 delete from public.services where id=any(ids);
 get diagnostics deleted_count=row_count;
 return review||jsonb_build_object('deleted_services',deleted_count,'status','deleted');
end;
$$;
revoke all on function public.cleanup_imported_services(uuid[],text,text) from public,anon;
grant execute on function public.cleanup_imported_services(uuid[],text,text) to authenticated;

commit;

