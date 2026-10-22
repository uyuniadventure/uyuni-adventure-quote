-- Accept the confirmed PER_VEHICLE capacity representation. Decimal CSV text
-- such as 6.0 is an integer value; PaxMax is used only when VehicleMaxPax is empty.
create or replace function public._validate_import_package(p jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare k text;e jsonb:='[]';r jsonb;begin
 foreach k in array array['tariffs','templates','days','segments','lodging','texts','blockItems','rules','pdf','controls'] loop
  if jsonb_typeof(p->k) is distinct from 'array' then return jsonb_build_array(jsonb_build_object('key',k,'message','Falta tabla del paquete.'));end if;
 end loop;
 for r in
  with tariff as(select value v from jsonb_array_elements(p->'tariffs')),
  tpl as(select value v from jsonb_array_elements(p->'templates')),
  refs as(select value v from jsonb_array_elements(p->'segments') union all select value from jsonb_array_elements(p->'blockItems') union all select value from jsonb_array_elements(p->'rules') union all select value from jsonb_array_elements(p->'lodging'))
  select jsonb_build_object('key',v->>'TariffCode','message','TariffCode vacío o repetido.') from tariff group by v->>'TariffCode' having count(*)>1 or coalesce(v->>'TariffCode','')=''
  union all select jsonb_build_object('key',v->>'TariffCode','message','Moneda inválida.') from tariff where coalesce(v->>'Currency','') not in ('USD','CLP','BOB')
  union all select jsonb_build_object('key',v->>'TariffCode','message','PRECIO_USD ausente o inválido.') from tariff where coalesce(replace(v->>'PRECIO_USD',',','.'),'') !~ '^[0-9]+([.][0-9]+)?$'
  union all select jsonb_build_object('key',v->>'TariffCode','message','PRECIO_USD debe ser mayor que cero.') from tariff where coalesce(replace(v->>'PRECIO_USD',',','.'),'') ~ '^[0-9]+([.][0-9]+)?$' and replace(v->>'PRECIO_USD',',','.')::numeric<=0
  union all select jsonb_build_object('key',v->>'TariffCode','message','PER_VEHICLE sin capacidad.') from tariff
   where v->>'UnitType'='PER_VEHICLE' and not (
    coalesce(v->>'VehicleMaxPax','') ~ '^[0-9]*[1-9][0-9]*([.]0+)?$'
    or (coalesce(v->>'VehicleMaxPax','')='' and coalesce(v->>'PaxMax','') ~ '^[0-9]*[1-9][0-9]*([.]0+)?$')
   )
  union all select jsonb_build_object('key',v->>'TariffCode','message','TariffCode inexistente.') from refs where coalesce(v->>'TariffCode','')<>'' and not exists(select 1 from tariff t where t.v->>'TariffCode'=refs.v->>'TariffCode')
  union all select jsonb_build_object('key',v->>'sku','message','Días de plantilla incompletos.') from tpl where (select count(*)::text from jsonb_array_elements(p->'days') d where d->>'sku'=tpl.v->>'sku') is distinct from v->>'dias'
  union all select jsonb_build_object('key',d->>'sku','message','Bloque inexistente.') from jsonb_array_elements(p->'days') d where coalesce(d->>'bloque_texto_id','')<>'' and not exists(select 1 from jsonb_array_elements(p->'texts') t where t->>'bloque_texto_id'=d->>'bloque_texto_id')
 loop e:=e||jsonb_build_array(r);end loop;
 return e;
end $$;
revoke all on function public._validate_import_package(jsonb) from public,anon,authenticated;
