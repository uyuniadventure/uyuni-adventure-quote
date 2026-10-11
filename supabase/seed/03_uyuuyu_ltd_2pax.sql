-- Apply after 20261011000100_template_quote_defaults.sql and historical seeds 00/01/02.
-- Source read 2026-10-11: https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723
-- Only UYUUYU-3D2N-LTd, 2 paying passengers, 0 TC. Expected cost USD 1475.
-- Prices remain linked to service_rates. No master tariffs or existing quotes change.
begin;
create temporary table ltd_source_days on commit drop as
 select td.template_id, td.day_number, b.*, t.quote_defaults='{}'::jsonb as apply_reference,
   md5('uyuuyu-ltd-2pax-20261011:day:' || td.day_number)::uuid as new_block_id
 from public.itinerary_templates t join public.template_days td on td.template_id=t.id
 join public.day_blocks b on b.id=td.block_id where t.sku='UYUUYU-3D2N-LTd';
create temporary table ltd_source_items(day_number integer, source_cell text, sku text, span integer, config jsonb) on commit drop;
insert into ltd_source_items values
 (1, 'F48', 'TOUR_UYU_LEO_3D2N_LOOP', 3, '{"pricing_unit":"per_group","description":"3D2N UYUNI – UYUNI","_source_cell":"F48","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (1, 'F49', 'FNB_UYU_LEO_BUFFET_APTHAPI', 1, '{"pricing_unit":"per_person","description":"ALMUERZO APTHAPI BUFFET SALAR","_source_cell":"F49","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (1, 'F50', 'TICKETS_LEO_UYU', 1, '{"pricing_unit":"per_person","description":"ENTRADAS A PARQUES","_source_cell":"F50","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (1, 'F51', 'MEAL_LS_DINNER_2026', 1, '{"pricing_unit":"per_person","description":"CENA","_source_cell":"F51","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (1, 'F52', 'HTL_LS_COLCHANI_TWN_STD_NO_VIEW_2026', 1, '{"pricing_unit":"per_room","description":"1 HAB TWIN STANDARD - SIN VISTA SALAR","_source_cell":"F52","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (2, 'F54', 'TOUR_UYU_LEO_3D2N_LOOP', 3, '{"pricing_unit":"per_group","description":"3D2N UYUNI – UYUNI","_source_cell":"F54","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (2, 'F55', 'FNB_UYU_LEO_LUNCH', 1, '{"pricing_unit":"per_person","description":"ALMUERZO PLATO SERVIDO","_source_cell":"F55","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (2, 'F56', 'MEAL_TAYKA_DESERT_DINNER', 1, '{"pricing_unit":"per_staff","description":"CENA CHOFER","staff_type":"drivers","_source_cell":"F56","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (2, 'F57', 'HTL_TAYKA_DESERT_HAB_COMP_CHOFER', 1, '{"pricing_unit":"per_staff","description":"HAB COMPARTIDA CHOFER","staff_type":"drivers","_source_cell":"F57","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (2, 'F58', 'MEAL_TAYKA_DESERT_DINNER', 1, '{"pricing_unit":"per_person","description":"CENA","_source_cell":"F58","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (2, 'F59', 'HTL_TAYKA_DESERT_DBL_2026', 1, '{"pricing_unit":"per_room","description":"1 HAB DOBLE","_source_cell":"F59","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (3, 'F61', 'TOUR_UYU_LEO_3D2N_LOOP', 3, '{"pricing_unit":"per_group","description":"3D2N UYUNI – UYUNI","_source_cell":"F61","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (3, 'F62', 'FNB_UYU_LEO_LUNCH', 1, '{"pricing_unit":"per_person","description":"ALMUERZO PLATO SERVIDO","_source_cell":"F62","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb),
 (3, 'F63', 'FNB_UYU_LEO_COCKTAIL', 1, '{"pricing_unit":"per_person","description":"CÓCTEL SALAR","_source_cell":"F63","_source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723"}'::jsonb);
do $$
begin
 if (select array_agg(day_number order by day_number) from ltd_source_days) is distinct from array[1,2,3] then
   raise exception 'Expected the three existing UYUUYU-3D2N-LTd days; apply historical seeds or reconcile this template first';
 end if;
 if exists(select 1 from ltd_source_items i left join public.services s on s.sku=i.sku where s.id is null) then
   raise exception 'Missing reference SKU; apply tariff seed first';
 end if;
end $$;
insert into public.day_blocks(id,code,route_from,route_to,places,modality,hotel_service_id,default_day_position,status)
 select d.new_block_id,'REF_UYUUYU_LTD_2PAX_D'||d.day_number,d.route_from,d.route_to,d.places,d.modality,
   (select s.id from public.services s where s.sku=case d.day_number
     when 1 then 'HTL_LS_COLCHANI_TWN_STD_NO_VIEW_2026' when 2 then 'HTL_TAYKA_DESERT_DBL_2026' end),
   d.day_number,'pendiente'
 from ltd_source_days d where d.apply_reference on conflict do nothing;
insert into public.day_block_translations(id,block_id,lang,title,description,includes,excludes,reviewed)
 select md5('uyuuyu-ltd-2pax-20261011:text:'||d.day_number||':'||tr.lang)::uuid,
   d.new_block_id,tr.lang,tr.title,tr.description,tr.includes,tr.excludes,tr.reviewed
 from ltd_source_days d join public.day_block_translations tr on tr.block_id=d.id
 where d.apply_reference
 on conflict do nothing;
insert into public.day_block_items(id,block_id,service_id,qty,applies_tc,margin_applicable,is_optional,included,multi_day_span,coverage_key,coverage_start_day,pricing_config)
 select md5('uyuuyu-ltd-2pax-20261011:item:'||i.source_cell)::uuid,d.new_block_id,s.id,1,
   case when i.config->>'pricing_unit'='per_staff' then false else s.applies_tc_default end,
   s.margin_applicable_default,false,true,i.span,
   case when i.span>1 then 'uyuuyu-ltd-2pax-circuit' end,
   case when i.span>1 then 1 end,i.config
 from ltd_source_items i join ltd_source_days d using(day_number) join public.services s on s.sku=i.sku
 where d.apply_reference
 on conflict do nothing;
update public.template_days td set block_id=d.new_block_id
 from ltd_source_days d where d.apply_reference and td.template_id=d.template_id and td.day_number=d.day_number and td.block_id<>d.new_block_id;
update public.itinerary_templates set quote_defaults='{"pax_paying":2,"tc_count":0,"rooming":{"paying":{"TWN_STD_NO_VIEW":1,"DBL":1},"tc":{}},"staff":{"drivers":1,"guides":0},"source_url":"https://docs.google.com/spreadsheets/d/1FkL5rTr1QH5XRPZi-cD0RHdyHIp2nEYwvCKmOueen5M/edit?gid=71315723#gid=71315723","source_sheet":"*UYU UYU - 3D2N - LTd ","source_range":"A34:F64","expected_cost_usd":1475}'::jsonb,
 import_warnings=coalesce((select jsonb_agg(w) from jsonb_array_elements(import_warnings) w
   where w #>> '{}' not in ('Validar cantidades, variantes y servicios de origen antes de revisar.','7 filas sin SKU enlazable.')),'[]'::jsonb)
 where sku='UYUUYU-3D2N-LTd' and quote_defaults='{}'::jsonb;
commit;
