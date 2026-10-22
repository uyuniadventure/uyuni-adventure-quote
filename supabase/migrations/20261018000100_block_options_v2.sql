-- T01h. Apply in Lovable Cloud after 20261017000200. No remote writes here.
begin;
do $reconcile$
declare
  missing text;
  signature text;
  definition text;
begin
  select string_agg(object_name, ', ' order by object_name) into missing
  from (values
    ('pricing_settings'),('doc_blocks'),('quote_doc_sections')
  ) required(object_name)
  where to_regclass('public.'||object_name) is null;
  if missing is not null then
    raise exception 'Esquema no reconciliado: faltan tablas históricas: %.',missing;
  end if;

  select string_agg(table_name||'.'||column_name, ', ' order by table_name,column_name) into missing
  from (values
    ('itinerary_templates','quote_defaults'),('services','approval_issues'),
    ('itinerary_templates','approval_issues'),('quote_items','adjustment_pct'),
    ('quote_days','block_snapshot'),('quotes','cancel_reason'),
    ('quote_payments','fx_rate'),('day_blocks','catalog_origin'),
    ('day_blocks','approval_issues')
  ) required(table_name,column_name)
  where not exists(select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name=required.table_name and c.column_name=required.column_name);
  if missing is not null then
    raise exception 'Esquema no reconciliado: faltan columnas históricas: %.',missing;
  end if;

  foreach signature in array array[
    'public.insert_quote_item(uuid,jsonb,boolean)',
    'public.guard_quote_child()','public.set_updated_at()',
    'public.save_quote_calculation(uuid,timestamptz,jsonb)',
    'public.guard_quote_state()','public.version_quote(uuid)',
    'public.edit_quote_item(uuid,jsonb,boolean,boolean)',
    'public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb)',
    'public.quote_sold_operations()',
    'public.save_quote_as_template(uuid,text,text,text,text,timestamptz,uuid,timestamptz)',
    'public.edit_quote_days(uuid,text,jsonb,timestamptz,jsonb)',
    'public.quote_template_source(uuid,uuid)',
    'public._template_approval_rows(uuid[],uuid[])',
    'public._lock_catalog_approval()',
    'public.approve_valid_imports(boolean,text,boolean)'
  ] loop
    if to_regprocedure(signature) is null then
      raise exception 'Esquema no reconciliado: falta la función %.',signature;
    end if;
  end loop;

  definition:=replace(pg_get_functiondef('public.insert_quote_item(uuid,jsonb,boolean)'::regprocedure),chr(13),'');
  if strpos(definition,'{"qty":1,')=0 then
    raise exception 'Esquema no reconciliado: insert_quote_item no contiene los defaults esperados; compara su definición remota.';
  end if;
  definition:=replace(pg_get_functiondef('public.guard_quote_child()'::regprocedure),chr(13),'');
  if strpos(definition,'qid:=case when tg_op=''DELETE'' then old.quote_id else new.quote_id end;')=0 then
    raise exception 'Esquema no reconciliado: guard_quote_child no admite hijos con quote_id; compara su definición remota.';
  end if;
end;
$reconcile$;

alter table public.services add column capacity integer check(capacity>0), add column occupancy integer check(occupancy>0);
update public.services set capacity=vehicle_max_pax,occupancy=case upper(room_type) when 'SGL' then 1 when 'DBL_TWN' then 2 when 'DBL_MAT' then 2 when 'DBL' then 2 when 'TWN' then 2 when 'MAT' then 2 when 'TPL' then 3 when 'QUAD' then 4 end;
create function public.check_vehicle_capacity() returns trigger language plpgsql set search_path='' as $$ begin
 new.capacity:=coalesce(new.capacity,new.vehicle_max_pax);
 if new.pricing_unit='per_vehicle' and new.capacity is null then raise exception 'El servicio por vehículo necesita capacidad.'; end if; return new;
end; $$;
create trigger vehicle_capacity before insert or update of capacity,pricing_unit on public.services for each row execute function public.check_vehicle_capacity();
-- Hotel identity is the client-owned hotel code, not the supplier. A supplier may
-- serve more than one hotel and must never collapse those identities.
alter table public.day_blocks add column hotel_id uuid references public.hotel_codes(id);
create index day_blocks_hotel_idx on public.day_blocks(hotel_id);
alter table public.day_block_items
 add column slot_key text not null default 'SERVICIO',add column is_default boolean not null default true,
 add column billing text not null default 'per_day' check(billing in ('per_day','per_service')),
 add column span_days integer not null default 1 check(span_days>0),
 add column tc_policy text not null default 'free' check(tc_policy in ('charged','free','excluded')),
 add column margin_mode text not null default 'inherit' check(margin_mode in ('inherit','custom','none')),
 add column margin_pct numeric check(margin_pct > -100 and margin_pct < 100),
 add constraint block_custom_margin check(margin_mode <> 'custom' or margin_pct is not null);
update public.day_block_items set slot_key='SERVICIO:'||id,tc_policy=case when applies_tc then 'charged' else 'free' end,margin_mode=case when margin_applicable=false then 'none' else 'inherit' end;
alter table public.quote_items
 add column slot_key text not null default 'SERVICIO',add column is_default boolean not null default true,
 add column billing text not null default 'per_day' check(billing in ('per_day','per_service')),
 add column span_days integer not null default 1 check(span_days>0),
 add column tc_policy text check(tc_policy in ('charged','free','excluded')),
 add column margin_mode text not null default 'inherit' check(margin_mode in ('inherit','custom','none')),
 add column margin_pct numeric check(margin_pct > -100 and margin_pct < 100),
 add column selected boolean not null default true,
 add column selection_source text not null default 'auto' check(selection_source in ('auto','manual')),
 add column qty_override numeric check(qty_override>=0 and qty_override<'Infinity'::numeric),
 add column qty_cost numeric check(qty_cost>=0),add column qty_supplier numeric check(qty_supplier>=0),
 add constraint quote_custom_margin check(margin_mode <> 'custom' or margin_pct is not null);
-- No UPDATE of historical quotes: null policy retains the old frozen applies_tc.
create table public.quote_rooming(
 id uuid primary key default gen_random_uuid(),quote_id uuid not null references public.quotes(id) on delete cascade,
 night integer check(night>0),room_type text not null check(room_type in ('SGL','DBL','TWN','MAT','TPL','QUAD')),
 count integer not null check(count>=0),for_tc boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique nulls not distinct(quote_id,night,room_type,for_tc));
alter table public.quote_rooming enable row level security;
grant select,insert,update,delete on public.quote_rooming to authenticated;
create policy rooming_owner on public.quote_rooming for all to authenticated using(exists(select 1 from public.quotes q where q.id=quote_id)) with check(exists(select 1 from public.quotes q where q.id=quote_id));
create trigger guard_rooming before insert or update or delete on public.quote_rooming for each row execute function public.guard_quote_child();
create trigger set_updated_at before update on public.quote_rooming for each row execute function public.set_updated_at();
alter table public.pricing_settings add column activity_modules_enabled boolean not null default false;

-- Diagnose before discarding any old hotel reference; failure rolls everything back.
do $$ declare bad text; begin
 select string_agg(b.code||' / '||s.sku,', ') into bad from public.day_blocks b join public.services s on s.id=b.hotel_service_id where s.supplier_id is null;
 if bad is not null then raise exception 'Falta proveedor del hotel: %. Corrige el servicio antes de migrar.',bad; end if;
 if exists(select 1 from public.day_blocks b join public.day_block_items i on i.block_id=b.id join public.services s on s.id=i.service_id where s.type='alojamiento' and coalesce(i.pricing_config->>'pricing_unit',s.pricing_unit::text)='per_room' and b.hotel_service_id is null and b.hotel_id is null) then raise exception 'Hay bloques sin hotel con alojamiento. Asigna hotel_service_id antes de migrar.'; end if;
end; $$;
-- Backfill only an unambiguous, already-authorized hotel code. Keep the legacy
-- hotel_service_id in every other case so this migration cannot discard data.
update public.day_blocks b set hotel_id=h.id
from public.services s join public.hotel_codes h on h.supplier_id=s.supplier_id
where s.id=b.hotel_service_id
  and 1=(select count(*) from public.hotel_codes x where x.supplier_id=s.supplier_id);
update public.day_block_items i set slot_key='ALOJAMIENTO',is_default=(i.service_id=b.hotel_service_id)
from public.day_blocks b,public.services s,public.services original
where i.block_id=b.id and s.id=i.service_id and original.id=b.hotel_service_id
  and s.type='alojamiento' and coalesce(i.pricing_config->>'pricing_unit',s.pricing_unit::text)='per_room'
  and s.supplier_id is not distinct from original.supplier_id
  and s.location is not distinct from original.location;
-- Do not infer room alternatives from a shared supplier. Existing links are
-- preserved exactly; alternatives require an explicit hotel identity.
-- hotel_service_id remains as a backwards-compatible frozen reference. New
-- blocks use hotel_id plus ALOJAMIENTO alternatives.

create function public.check_block_hotel() returns trigger language plpgsql security definer set search_path='' as $$
declare b public.day_blocks;s public.services;ref public.services;hotel_supplier uuid;
begin
 if tg_table_name='day_block_items' then
  if tg_op='UPDATE' and old.slot_key='ALOJAMIENTO' and new.slot_key<>'ALOJAMIENTO' then
   raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.';
  end if;
  select * into strict b from public.day_blocks where id=new.block_id for update;
  if new.service_id is null then
   if new.slot_key='ALOJAMIENTO' then raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.'; end if;
   return new;
  end if;
  select * into strict s from public.services where id=new.service_id for share;
  if new.slot_key='ALOJAMIENTO' or (s.type='alojamiento' and coalesce(new.pricing_config->>'pricing_unit',s.pricing_unit::text)='per_room') then
   -- Backwards-compatible seed/editor payloads omit slot_key. Normalize only
   -- explicitly linked rooms that match the legacy hotel's supplier and place;
   -- this does not create or infer any additional room row. Meal-plan
   -- consistency is checked below among the actual room alternatives.
   if new.slot_key<>'ALOJAMIENTO' and b.hotel_service_id is not null then
    select * into ref from public.services where id=b.hotel_service_id;
    if new.service_id=b.hotel_service_id or
       (s.supplier_id is not distinct from ref.supplier_id and
        s.location is not distinct from ref.location) then
     new.slot_key:='ALOJAMIENTO';new.is_default:=(new.service_id=b.hotel_service_id);
    end if;
   end if;
   select supplier_id into hotel_supplier from public.hotel_codes where id=b.hotel_id;
   if new.slot_key='ALOJAMIENTO' then
    if (b.hotel_id is null and b.hotel_service_id is null) or s.type<>'alojamiento' or
       (b.hotel_id is not null and s.supplier_id is distinct from hotel_supplier) then raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.'; end if;
    select x.* into ref from public.day_block_items i join public.services x on x.id=i.service_id where i.block_id=b.id and i.slot_key='ALOJAMIENTO' and i.id<>new.id limit 1;
    if found and (s.location is distinct from ref.location or s.meal_plan is distinct from ref.meal_plan) then raise exception 'Las habitaciones deben tener el mismo lugar y régimen del hotel del bloque.'; end if;
   elsif b.hotel_id is not null then
    raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.';
   end if;
  end if;
 elsif tg_table_name='day_blocks' then
  if old.hotel_id is not null and new.hotel_id is distinct from old.hotel_id then raise exception 'Para cambiar de hotel, usa otro bloque.'; end if;
  select supplier_id into hotel_supplier from public.hotel_codes where id=new.hotel_id;
  if new.hotel_id is not null and exists(select 1 from public.day_block_items i join public.services x on x.id=i.service_id where i.block_id=new.id and i.slot_key='ALOJAMIENTO' and x.supplier_id is distinct from hotel_supplier) then raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.'; end if;
 else
  if exists(select 1 from public.day_block_items i join public.day_blocks x on x.id=i.block_id left join public.hotel_codes h on h.id=x.hotel_id where i.service_id=new.id and i.slot_key='ALOJAMIENTO' and (new.type<>'alojamiento' or (x.hotel_id is not null and new.supplier_id is distinct from h.supplier_id))) then raise exception 'La habitación debe pertenecer al hotel del bloque. Para cambiar de hotel, usa otro bloque.'; end if;
  if exists(select 1 from public.day_block_items i join public.day_block_items j on j.block_id=i.block_id and j.id<>i.id and j.slot_key='ALOJAMIENTO' join public.services x on x.id=j.service_id where i.service_id=new.id and i.slot_key='ALOJAMIENTO' and (new.location is distinct from x.location or new.meal_plan is distinct from x.meal_plan)) then raise exception 'Las habitaciones deben tener el mismo lugar y régimen del hotel del bloque.'; end if;
 end if;
 return new;
end; $$;
create trigger block_hotel_items before insert or update on public.day_block_items for each row execute function public.check_block_hotel();
create trigger block_hotel_identity before insert or update on public.day_blocks for each row execute function public.check_block_hotel();
create trigger block_hotel_service before update of supplier_id,type,location,meal_plan on public.services for each row execute function public.check_block_hotel();
update public.day_block_items set slot_key=slot_key where slot_key='ALOJAMIENTO';

create function public.create_location(code text,name text,country text) returns public.location_codes language plpgsql security definer set search_path='' as $$
declare result public.location_codes;begin
 if public.current_role() is null or public.current_role() not in ('admin','operacion') then raise exception 'Solo Admin y Operación pueden crear lugares.' using errcode='42501'; end if;
 if code !~ '^[A-Z]{3}$' or nullif(btrim(name),'') is null then raise exception 'Usa un código de tres letras mayúsculas y un nombre.'; end if;
 insert into public.location_codes(code,name,country) values(code,btrim(name),country) returning * into result;return result;
exception when unique_violation then raise exception 'El código de lugar ya existe.' using errcode='23505';
end; $$;
revoke all on function public.create_location(text,text,text),public.check_block_hotel(),public.check_vehicle_capacity() from public,anon;
grant execute on function public.create_location(text,text,text) to authenticated;
-- Extend the insertion defaults; all prior validation and identity assignment stay intact.
do $migration$ declare definition text;begin
 definition:=pg_get_functiondef('public.insert_quote_item(uuid,jsonb,boolean)'::regprocedure);
 definition:=replace(definition,'{"qty":1,','{"slot_key":"SERVICIO","is_default":true,"billing":"per_day","span_days":1,"margin_mode":"inherit","selected":true,"selection_source":"auto","qty":1,');
 execute definition;
end; $migration$;
commit;
