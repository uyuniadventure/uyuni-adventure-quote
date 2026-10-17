-- T01u. Aplicar la migración de borrado antes de ejecutar estas consultas.
-- ANTES de Vaciar catálogo importado: ejecutar cada SELECT y exportar su resultado
-- completo a un CSV separado. Mantener los CSV fuera del repositorio.
-- Ejecutar con Admin/SQL Editor. No llamar a ninguna RPC de borrado aquí.
-- Para una copia consistente, pausar ediciones/importaciones durante respaldo y
-- purga. Esta transacción READ ONLY no bloquea editores después de COMMIT.
begin transaction isolation level repeatable read read only;

-- 1. itinerary_templates.csv: plantillas que se eliminarán.
select * from public.itinerary_templates
where catalog_origin='importacion' and source_quote_id is null order by id;

-- 2. day_blocks.csv: bloques que se eliminarán, incluidos los huérfanos.
select * from public.day_blocks where catalog_origin='importacion' order by id;

-- 3. template_days.csv: también enlaces desde plantillas manuales a esos bloques.
select d.* from public.template_days d
where exists(select 1 from public.itinerary_templates t where t.id=d.template_id
  and t.catalog_origin='importacion' and t.source_quote_id is null)
or exists(select 1 from public.day_blocks b where b.id=d.block_id
  and b.catalog_origin='importacion') order by d.template_id,d.day_number;

-- 4. day_block_translations.csv
select d.* from public.day_block_translations d join public.day_blocks b on b.id=d.block_id
where b.catalog_origin='importacion' order by d.block_id,d.lang;

-- 5. day_block_items.csv (los servicios del tarifario se conservan).
select d.* from public.day_block_items d join public.day_blocks b on b.id=d.block_id
where b.catalog_origin='importacion' order by d.block_id,d.id;

-- 6. day_block_modules.csv (los módulos y sus ítems se conservan).
select d.* from public.day_block_modules d join public.day_blocks b on b.id=d.block_id
where b.catalog_origin='importacion' order by d.block_id,d.id;

-- 7. plantillas_conservadas_afectadas.csv: respaldo de metadatos ANTES de marcar
-- pendiente y renumerar los días restantes. Estas plantillas NO se eliminan.
select t.* from public.itinerary_templates t
where not (t.catalog_origin='importacion' and t.source_quote_id is null)
and exists(select 1 from public.template_days d join public.day_blocks b on b.id=d.block_id
  where d.template_id=t.id and b.catalog_origin='importacion') order by t.id;

-- 8. dias_plantillas_conservadas.csv: incluye los días que solo se renumerarán.
select d.* from public.template_days d join public.itinerary_templates t on t.id=d.template_id
where not (t.catalog_origin='importacion' and t.source_quote_id is null)
and exists(select 1 from public.template_days x join public.day_blocks b on b.id=x.block_id
  where x.template_id=t.id and b.catalog_origin='importacion') order by d.template_id,d.day_number;

-- 9-11. Vínculos que quedarán en NULL; solo IDs, sin exportar datos de clientes.
select q.id as quote_id,q.template_id from public.quotes q join public.itinerary_templates t on t.id=q.template_id
where t.catalog_origin='importacion' and t.source_quote_id is null order by q.id;
select d.id as quote_day_id,d.source_block_id from public.quote_days d join public.day_blocks b on b.id=d.source_block_id
where b.catalog_origin='importacion' order by d.id;
select d.id as block_id,d.parent_block_id from public.day_blocks d join public.day_blocks b on b.id=d.parent_block_id
where d.catalog_origin<>'importacion' and b.catalog_origin='importacion' order by d.id;
commit;
