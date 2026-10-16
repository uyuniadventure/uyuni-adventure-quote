-- T01s · Diagnóstico SOLO LECTURA para Supabase SQL Editor.
-- No llama add_blocks/edit_quote_days, no crea objetos, no escribe ni recalcula.
-- EXPLAIN ANALYZE ejecuta SELECT reales. READ ONLY impide escrituras accidentales.
-- Puede ejecutarse antes o después de la migración T01s para comparar.
--
-- 1. En parámetros, sustituye las cadenas vacías por el UUID de la cotización
--    afectada y los UUID de los bloques seleccionados (separados por comas).
--    Vacío selecciona el último borrador SPASPA-4D3N y sus primeros cuatro bloques.
-- 2. Ejecuta el archivo. Devuelve los resultados/planes de A–F, indicando si fue
--    antes o después del deploy. No hace falta compartir textos ni clientes.
--    Si el editor solo muestra el último resultado, repite el preámbulo y el
--    bloque A/B/C/D/E/F deseado, terminando siempre con ROLLBACK.
-- 3. Si falta una cotización, indica también el UUID de tu usuario de Auth para
--    medir RLS con tus permisos. No uses una service key ni cambies tus permisos.
-- Límite 30 s por consulta, solo en esta sesión. Ante timeout ejecuta ROLLBACK.

begin read only;
set local statement_timeout = '30s';
set local lock_timeout = '3s';

-- PARÁMETROS (las tres cadenas '' son editables).
select set_config('t01s.quote_id',coalesce(nullif('',''),(
  select id::text from public.quotes where tour_sku like 'SPASPA-4D3N%'
    and status='borrador' order by updated_at desc limit 1),''),true);
select set_config('t01s.user_id',coalesce(nullif('',''),(
  select seller_id::text from public.quotes where id=nullif(current_setting('t01s.quote_id'),'')::uuid),''),true);
select set_config('t01s.block_ids',coalesce(nullif('',''),(
  select string_agg(block_id::text,',' order by day_number) from (
    select d.block_id,d.day_number from public.template_days d
    where d.template_id=(select id from public.itinerary_templates
      where sku like 'SPASPA-4D3N%' order by sku limit 1)
    order by d.day_number limit 4
  ) selected),''),true);

-- A · Entorno, tamaños, índices y triggers. Sin nombres/textos de clientes.
select version(), current_setting('statement_timeout') statement_timeout,
  current_setting('t01s.quote_id') quote_id, current_setting('t01s.user_id') user_id,
  current_setting('t01s.block_ids') block_ids;
select relname,n_live_tup,n_dead_tup,last_analyze,last_autoanalyze,
  pg_size_pretty(pg_total_relation_size(relid)) total_size
from pg_stat_user_tables
where schemaname='public' and relname in ('services','service_rates','day_blocks',
  'day_block_items','day_block_modules','activity_module_items','quote_days','quote_items','quotes');
select tablename,indexname,indexdef from pg_indexes where schemaname='public'
  and tablename in ('service_rates','day_block_items','day_block_modules',
    'activity_module_items','quote_days','quote_items') order by tablename,indexname;
select t.tgrelid::regclass table_name,t.tgname,pg_get_triggerdef(t.oid) trigger_definition,
  pg_get_functiondef(t.tgfoid) function_definition
from pg_trigger t where not t.tgisinternal and t.tgrelid in (
  'public.quote_days'::regclass,'public.quote_items'::regclass,'public.quotes'::regclass);

-- B · Bloqueos y estadísticas acumuladas (puede estar vacío si track_functions=none).
-- No muestra el SQL de otras sesiones ni datos de cotizaciones.
select l.pid,l.relation::regclass relation,l.mode,l.granted,a.wait_event_type,a.wait_event,
  clock_timestamp()-a.xact_start transaction_age,pg_blocking_pids(l.pid) blocking_pids
from pg_locks l left join pg_stat_activity a on a.pid=l.pid
where l.relation in ('public.quotes'::regclass,'public.quote_days'::regclass,
  'public.quote_items'::regclass,'public.day_blocks'::regclass,'public.service_rates'::regclass)
order by l.granted,l.pid;
select funcname,calls,total_time,self_time from pg_stat_user_functions
where schemaname='public' and funcname in ('edit_quote_days','snapshot_day_block',
  'save_quote_calculation','guard_quote_child','guard_quote_state');

-- El SQL Editor normalmente es postgres y omite RLS. Medir como el usuario real.
select set_config('request.jwt.claim.sub',current_setting('t01s.user_id'),true);
set local role authenticated;
select public.current_role() measured_role,
  case when public.current_role() is null then 'Falta user_id: completa los parámetros.'
    else 'RLS activo: planes con permisos del usuario.' end note;

-- C · Mismo snapshot que lee el frontend, incluyendo módulos y traducciones.
explain (analyze,buffers,verbose,settings,format text)
select public.snapshot_day_block(id) from unnest(
  string_to_array(nullif(current_setting('t01s.block_ids'),''),',')::uuid[]) id;

-- D · Lectura del catálogo por selección, con RLS. Se incluyen tarifas vencidas:
-- el motor debe conservarlas para explicar por qué no cubren fecha/pax.
explain (analyze,buffers,verbose,settings,format text)
with selected as (
  select unnest(string_to_array(nullif(current_setting('t01s.block_ids'),''),',')::uuid[]) id
), service_ids as (
  select i.service_id from public.day_block_items i join selected b on b.id=i.block_id
  union select i.service_id from public.day_block_modules l join selected b on b.id=l.block_id
    join public.activity_module_items i on i.module_id=l.module_id
  union select b.hotel_service_id from public.day_blocks b join selected s on s.id=b.id
)
select s.id,to_jsonb(s),
  (select coalesce(jsonb_agg(r order by r.id),'[]') from public.service_rates r where r.service_id=s.id) rates
from public.services s where s.id in (select service_id from service_ids);

-- E · Lectura de los ítems que prepara add_blocks y que usa el recálculo.
-- quote_items no tiene quote_id: se enlaza mediante quote_day_id → quote_days.
explain (analyze,buffers,verbose,settings,format text)
select coalesce(jsonb_agg(i order by i.created_at,
  coalesce((i.pricing_snapshot->>'_creation_order')::int,0),i.id),'[]')
from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
where d.quote_id=nullif(current_setting('t01s.quote_id'),'')::uuid;

-- F · Acceso a los días del borrador. Medir ambos tamaños, sin FOR UPDATE.
explain (analyze,buffers,verbose,settings,format text)
select coalesce(jsonb_agg(d order by d.day_number),'[]') from public.quote_days d
where d.quote_id=nullif(current_setting('t01s.quote_id'),'')::uuid;

rollback;

-- Este diagnóstico no mide escrituras/triggers con EXPLAIN ANALYZE: hacerlo
-- ejecutaría la mutación. La prueba local mide la RPC completa y sus triggers.
-- Con estos planes y los bloqueos se decide si hace falta una medición adicional
-- en una copia de la base. No atribuir el timeout real sin esa evidencia.
