-- Read-only: execute in Lovable SQL Editor to verify the current remote catalog.
select t.sku, t.days,
 array(select d.day_number from public.template_days d where d.template_id=t.id order by d.day_number) as linked_days,
 array(select n from generate_series(1,t.days) n where not exists
   (select 1 from public.template_days d join public.day_blocks b on b.id=d.block_id
    where d.template_id=t.id and d.day_number=n)) as missing_blocks,
 array(select d.day_number from public.template_days d where d.template_id=t.id and d.day_number>t.days) as out_of_range,
 array(select d.day_number from public.template_days d where d.template_id=t.id and not exists
   (select 1 from public.day_block_items i where i.block_id=d.block_id) and not exists
   (select 1 from public.day_block_modules bm join public.activity_module_items mi on mi.module_id=bm.module_id
    where bm.block_id=d.block_id) order by d.day_number) as days_without_services,
 (select count(*)::int from public.template_days d join public.day_block_items i on i.block_id=d.block_id
   left join public.services s on s.id=i.service_id where d.template_id=t.id and s.id is null) as invalid_service_links,
 (select count(*)::int from public.template_days d join public.day_block_items i on i.block_id=d.block_id
   where d.template_id=t.id) as item_links
 from public.itinerary_templates t order by t.sku;
