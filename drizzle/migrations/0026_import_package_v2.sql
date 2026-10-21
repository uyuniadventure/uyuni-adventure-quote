-- T01k. Depends on both T01h migrations. No catalogue seed and no real costs.
begin;
alter table public.services add column import_v2_route text,
 add column import_source_currency text,add column import_source_unit text;
alter table public.service_rates add column import_source_season text,
 add column import_source_price_net numeric,add column import_source_price_rack numeric,
 add column pricing_enabled boolean not null default true;
alter table public.day_block_items add column variant_key text;
alter table public.template_days add column variant_key text, add column import_title text,
 add column import_lodging text, add column import_meals text, add column import_note text;
alter table public.itinerary_templates add column import_v2_route text,
 add column import_includes_id uuid references public.doc_blocks(id) on delete set null,
 add column import_excludes_id uuid references public.doc_blocks(id) on delete set null,
 add column source_category text,add column source_season text,
 add column economic_status text not null default 'validated' check(economic_status in ('pending','validated','blocked')),
 add column economic_issues text[] not null default '{}';
-- Imported categories without an exact enum value remain unresolved. Existing
-- templates keep their current category and validated economic state.
alter table public.itinerary_templates alter column category drop not null;
-- T13 is the existing fixed-text catalogue; do not create pdf_text_blocks.
alter table public.doc_blocks add column import_kind text, add column import_sort int;
create table public.template_segment_items(
 id uuid primary key default gen_random_uuid(),template_id uuid not null references public.itinerary_templates(id) on delete cascade,
 slot_key text not null,service_id uuid not null references public.services(id),day_from int not null check(day_from>0),day_to int not null,
 pricing_unit_override public.pricing_unit,vehicle_max_pax_override int check(vehicle_max_pax_override>0),
 created_at timestamptz not null default now(),check(day_to>=day_from),unique(template_id,slot_key,day_from)
);
create table public.template_day_items(
 id uuid primary key default gen_random_uuid(),template_id uuid not null references public.itinerary_templates(id) on delete cascade,
 day_number int not null check(day_number>0),slot_key text not null check(slot_key in ('ALOJAMIENTO','CENA','STAFF')),
 service_id uuid references public.services(id),supplier_id uuid references public.suppliers(id),hotel_id uuid references public.hotel_codes(id),
 source_hotel_name text,source_tariff_code text,source_row_key text not null,pricing_unit_override public.pricing_unit,
 tc_policy text not null default 'free' check(tc_policy in ('free','charged','excluded')),is_default bool not null default true,sort int not null default 0,
 check(service_id is not null or (slot_key='ALOJAMIENTO' and supplier_id is not null and source_hotel_name is not null)),
 unique(template_id,day_number,slot_key,source_row_key)
);
create table public.segment_rules(
 id uuid primary key default gen_random_uuid(),route text not null,days int not null check(days>0),slot_key text not null,
 service_id uuid not null references public.services(id),day_from int not null check(day_from>0),day_to int not null,
 check(day_to>=day_from and day_to<=days),unique(route,days,slot_key)
);
create index template_segment_service on public.template_segment_items(service_id);
create index template_night_service on public.template_day_items(service_id);
create index template_night_supplier on public.template_day_items(supplier_id);
create index template_night_hotel on public.template_day_items(hotel_id);
create index segment_rule_service on public.segment_rules(service_id);
create index template_import_includes on public.itinerary_templates(import_includes_id);
create index template_import_excludes on public.itinerary_templates(import_excludes_id);
do $$ declare tbl text;begin
 foreach tbl in array array['template_segment_items','template_day_items'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('create policy read_template on public.%I for select to authenticated using(exists(select 1 from public.itinerary_templates t where t.id=template_id))',tbl);
  execute format('create policy manage_template on public.%I for all to authenticated using(exists(select 1 from public.itinerary_templates t where t.id=template_id and (public.current_role() in (''admin'',''operacion'') or (t.created_by=auth.uid() and t.status=''pendiente'')))) with check(exists(select 1 from public.itinerary_templates t where t.id=template_id and (public.current_role() in (''admin'',''operacion'') or (t.created_by=auth.uid() and t.status=''pendiente''))))',tbl);
  execute format('grant select,insert,update,delete on public.%I to authenticated',tbl);
 end loop;
end $$;
alter table public.segment_rules enable row level security;
create policy rules_read on public.segment_rules for select to authenticated using(true);
create policy rules_manage on public.segment_rules for all to authenticated using(public.current_role()='admin') with check(public.current_role()='admin');
grant select,insert,update,delete on public.segment_rules to authenticated;
create function public.check_template_import_item() returns trigger language plpgsql set search_path=public as $$
declare n int;begin
 select days into n from public.itinerary_templates where id=new.template_id;
 if (case when tg_table_name='template_segment_items' then (to_jsonb(new)->>'day_to')::int else (to_jsonb(new)->>'day_number')::int end)>n then raise exception 'Ítem fuera de los días de la plantilla.';end if;
 return new;
end $$;
create trigger segment_bounds before insert or update on public.template_segment_items for each row execute function public.check_template_import_item();
create trigger night_bounds before insert or update on public.template_day_items for each row execute function public.check_template_import_item();
create function public.guard_template_economic_status() returns trigger language plpgsql set search_path='' as $$ begin
 if new.status='activo' and new.economic_status<>'validated' then
  raise exception 'La plantilla requiere validación económica antes de activarse.';
 end if;
 return new;
end $$;
create trigger template_economic_guard before insert or update of status,economic_status on public.itinerary_templates
 for each row execute function public.guard_template_economic_status();
create table public.import_batches(
 id uuid primary key default gen_random_uuid(),kind text not null default 'paquete_v2' check(kind='paquete_v2'),
 status text not null default 'staged' check(status in ('staged','committed','discarded')),file_name text not null,
 created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now(),
 summary jsonb not null default '{}',package jsonb not null
);
create table public.import_rows(
 id uuid primary key default gen_random_uuid(),batch_id uuid not null references public.import_batches(id) on delete cascade,
 position int not null,table_name text not null,natural_key text not null,
 action text not null check(action in ('insert','update','skip','error')),payload jsonb not null,before jsonb,message text,
 unique(batch_id,table_name,natural_key)
);
create index import_rows_batch on public.import_rows(batch_id,position);
create index import_batches_creator on public.import_batches(created_by);
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
create policy batches_admin on public.import_batches for select to authenticated using(public.current_role()='admin');
create policy rows_admin on public.import_rows for select to authenticated using(public.current_role()='admin');
revoke all on public.import_batches,public.import_rows from anon,authenticated;
grant select on public.import_batches,public.import_rows to authenticated;
do $$ declare tbl text;begin
 foreach tbl in array array['template_segment_items','template_day_items','segment_rules','import_batches','import_rows'] loop
  execute format('alter table public.%I add column if not exists created_at timestamptz not null default now(),add column updated_at timestamptz not null default now()',tbl);
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.set_updated_at()',tbl);
 end loop;
end $$;

-- Only this fixed catalogue allowlist is writable. No identifiers from CSV are SQL.
create function public._import_tables() returns text[] language sql immutable as $$
 select array['location_codes','suppliers','services','service_rates','day_blocks','day_block_translations','day_block_items','doc_blocks','doc_block_translations','itinerary_templates','template_days','template_segment_items','template_day_items','segment_rules']::text[]
$$;
create function public._import_current(p_table text,p_payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare result jsonb;predicate text;begin
 if not(p_table=any(public._import_tables())) then raise exception 'Tabla de importación no permitida.';end if;
 predicate:=case when p_table='doc_block_translations' then 't.block_id=($1->>''block_id'')::uuid and t.lang=$1->>''lang''' else 't.id=($1->>''id'')::uuid' end;
 execute format('select (select jsonb_object_agg(k,to_jsonb(t)->k) from jsonb_object_keys($1) k) from public.%I t where %s',p_table,predicate) into result using p_payload;
 return result;
end $$;
create function public._validate_import_package(p jsonb) returns jsonb language plpgsql set search_path='' as $$
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
  union all select jsonb_build_object('key',v->>'TariffCode','message','PER_VEHICLE sin capacidad.') from tariff where v->>'UnitType'='PER_VEHICLE' and coalesce(v->>'VehicleMaxPax','') !~ '^[1-9][0-9]*$'
  union all select jsonb_build_object('key',v->>'TariffCode','message','TariffCode inexistente.') from refs where coalesce(v->>'TariffCode','')<>'' and not exists(select 1 from tariff t where t.v->>'TariffCode'=refs.v->>'TariffCode')
  union all select jsonb_build_object('key',v->>'sku','message','Días de plantilla incompletos.') from tpl where (select count(*)::text from jsonb_array_elements(p->'days') d where d->>'sku'=tpl.v->>'sku') is distinct from v->>'dias'
  union all select jsonb_build_object('key',d->>'sku','message','Bloque inexistente.') from jsonb_array_elements(p->'days') d where coalesce(d->>'bloque_texto_id','')<>'' and not exists(select 1 from jsonb_array_elements(p->'texts') t where t->>'bloque_texto_id'=d->>'bloque_texto_id')
 loop e:=e||jsonb_build_array(r);end loop;
 return e;
end $$;
revoke all on function public._validate_import_package(jsonb) from public,anon,authenticated;
create function public.stage_import_package(p_file_name text,p_package jsonb,p_rows jsonb,p_validation jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare batch uuid;r jsonb;old jsonb;act text;n int:=0;k text;begin
 if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Solo Admin puede importar.' using errcode='42501';end if;
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>30000 or jsonb_typeof(p_validation->'errors') is distinct from 'array' then raise exception 'Paquete o validación inválidos.';end if;
 if length(p_file_name)>250 or octet_length(p_package::text)>30000000 then raise exception 'Paquete demasiado grande.';end if;
 p_validation:=jsonb_set(p_validation,'{errors}',(p_validation->'errors')||public._validate_import_package(p_package));
 if jsonb_array_length(p_validation->'errors')=0 then
  for r in select value from jsonb_array_elements('[{"table":"services","key":"tariffs"},{"table":"service_rates","key":"tariffs"},{"table":"itinerary_templates","key":"templates"},{"table":"template_days","key":"days"},{"table":"template_segment_items","key":"segments"},{"table":"template_day_items","key":"lodging"},{"table":"segment_rules","key":"rules"},{"table":"doc_block_translations","key":"pdf"}]'::jsonb) loop
   if (select count(*) from jsonb_array_elements(p_rows) row_data where row_data->>'table_name'=r->>'table')<>jsonb_array_length(p_package->(r->>'key')) then
    p_validation:=jsonb_set(p_validation,'{errors}',(p_validation->'errors')||jsonb_build_array(jsonb_build_object('key',r->>'table','message','Vista previa incompleta; vuelve a preparar el paquete.')));
   end if;
  end loop;
 end if;
 insert into public.import_batches(file_name,package,summary) values(p_file_name,p_package,p_validation) returning id into batch;
 for r in select value from jsonb_array_elements(p_rows) loop
  if not((r->>'table_name')=any(public._import_tables())) or jsonb_typeof(r->'payload') is distinct from 'object' then raise exception 'Fila de importación inválida.';end if;
  for k in select jsonb_object_keys(r->'payload') loop
   if k in ('created_by','created_at','updated_at') or not exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=r->>'table_name' and c.column_name=k) then raise exception 'Columna de importación no permitida: %',k;end if;
  end loop;
  old:=public._import_current(r->>'table_name',r->'payload');
  if old is distinct from nullif(r->'before','null') then raise exception 'El catálogo cambió; vuelve a preparar la importación.' using errcode='40001';end if;
  act:=case when old is null then 'insert' when old=r->'payload' then 'skip' else 'update' end;
  insert into public.import_rows(batch_id,position,table_name,natural_key,action,payload,before) values(batch,n,r->>'table_name',r->>'natural_key',act,r->'payload',old);n:=n+1;
 end loop;
 for r in select value from jsonb_array_elements(p_validation->'errors') loop
  insert into public.import_rows(batch_id,position,table_name,natural_key,action,payload,message) values(batch,n,'validation',n::text,'error',r,r->>'message');n:=n+1;
 end loop;
 update public.import_batches set summary=summary||jsonb_build_object('tables',(
  select coalesce(jsonb_object_agg(table_name,counts),'{}') from (
   select table_name,jsonb_object_agg(action,row_count) counts from (
    select table_name,action,count(*) row_count from public.import_rows where batch_id=batch group by table_name,action
   ) actions group by table_name
  ) tables
 )) where id=batch;
 return batch;
end $$;
create function public.commit_import_batch(p_batch_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare batch public.import_batches;r public.import_rows;cols text;expr text;predicate text;failure text;counts jsonb;begin
 if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Solo Admin puede confirmar importaciones.' using errcode='42501';end if;
 select * into batch from public.import_batches where id=p_batch_id for update;
 if not found then raise exception 'Lote inexistente.';end if;
 if batch.status<>'staged' then raise exception 'El lote ya fue confirmado o descartado.';end if;
 begin
  -- Serialise with ordinary catalogue editors as well as other import sessions.
  lock table public.location_codes,public.suppliers,public.services,public.service_rates,public.day_blocks,public.day_block_translations,public.day_block_items,public.doc_blocks,public.doc_block_translations,public.itinerary_templates,public.template_days,public.template_segment_items,public.template_day_items,public.segment_rules in share row exclusive mode;
  if exists(select 1 from public.import_rows where batch_id=p_batch_id and action='error') then raise exception 'Hay errores de validación.';end if;
  for r in select * from public.import_rows where batch_id=p_batch_id order by array_position(public._import_tables(),table_name),position loop
   if public._import_current(r.table_name,r.payload) is distinct from r.before then raise exception 'El catálogo cambió en %; repite la vista previa.',r.natural_key;end if;
   if r.action='skip' then continue;end if;
   if r.action='insert' then
    select string_agg(format('%I',k),','),string_agg(format('x.%I',k),',') into cols,expr from jsonb_object_keys(r.payload) k;
    execute format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1) x',r.table_name,cols,expr,r.table_name) using r.payload;
   else
    select string_agg(format('%1$I=x.%1$I',k),',') into expr from jsonb_object_keys(r.payload) k where k<>'id' and (r.table_name<>'doc_block_translations' or k not in ('block_id','lang'));
    predicate:=case when r.table_name='doc_block_translations' then 't.block_id=x.block_id and t.lang=x.lang' else 't.id=x.id' end;
    if expr is not null then execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) x where %s',r.table_name,expr,r.table_name,predicate) using r.payload;end if;
   end if;
  end loop;
  select jsonb_object_agg(action,n) into counts from (select action,count(*) n from public.import_rows where batch_id=p_batch_id group by action) c;
  update public.import_batches set status='committed',summary=(summary-'error')||jsonb_build_object('counts',counts) where id=p_batch_id;
  return jsonb_build_object('status','committed','counts',counts);
 exception when others then
  get stacked diagnostics failure=message_text;
  -- This exception block rolls back ALL catalogue changes, retaining the preview.
  update public.import_batches set summary=summary||jsonb_build_object('error',failure) where id=p_batch_id;
  return jsonb_build_object('status','staged','error',failure);
 end;
end $$;
create function public.discard_import_batch(p_batch_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Solo Admin puede descartar importaciones.' using errcode='42501';end if;
 update public.import_batches set status='discarded' where id=p_batch_id and status='staged';
 if not found then raise exception 'Lote inexistente o cerrado.';end if;
end $$;
revoke all on function public._import_tables(),public._import_current(text,jsonb) from public,anon,authenticated;
revoke all on function public.stage_import_package(text,jsonb,jsonb,jsonb),public.commit_import_batch(uuid),public.discard_import_batch(uuid) from public,anon;
grant execute on function public.stage_import_package(text,jsonb,jsonb,jsonb),public.commit_import_batch(uuid),public.discard_import_batch(uuid) to authenticated;
commit;
