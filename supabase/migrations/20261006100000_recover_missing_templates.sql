-- Recovery of guide programs 28 and 44. See docs/VERIFICACION_PLANTILLAS.md.
-- Apply after the already-applied schema and 00/01/02 seeds. No prices inferred.
-- SPA4D/ remains excluded by user decision. Both recovered programs lack a matching budget.
begin;

insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('aeac7542-707b-5b98-a5a6-f511a578454f', 'SPAUYU-4D3N-FTL', 'Itinerario Detallado', 'SPA', 'UYU', 'ONEWAY', 4, 3, 'MIXTO', 'FTL', 'pendiente', '["SKU de origen SPAUYU-3D3N-FTL: cuatro días extraídos; se normaliza a 4D3N conservando el combo FTL.", "El día 4 es opcional. Confirmar duración comercial y combo hotelero T (el texto dice Tayka de Sal) antes de aprobar.", "Sin presupuesto por SKU en extraccion_presupuestos_standard.json. Todos los días quedan sin servicios tarifados; asignar SKU y variantes manualmente antes de aprobar."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, default_day_position, status) values ('2f204d1b-506f-5423-91e6-20bb272eadcc', 'RECOVERY_GUIDE_28_DAY_1', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, reviewed) values ('9f368ed8-1c9c-5ac9-9e81-2a6cbfd4f41c', '2f204d1b-506f-5423-91e6-20bb272eadcc', 'es', 'Día 1', 'Lagunas Altiplánicas y Desierto de Siloli Salida desde su hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón. Durante la jornada se visitan la Laguna Blanca, Laguna Verde, el Desierto de Dalí, Aguas Termales Polques, el campo geotérmico de los Géiseres Sol de Mañana y la impresionante Laguna Colorada. La ruta continúa a través del vasto Desierto de Siloli y las lagunas Honda y Hedionda, hábitat natural de flamencos andinos en un entorno volcánico de gran impacto visual. Alojamiento: Hotel Los Flamencos (Laguna Hedionda)  Comidas incluidas: Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('951f06a6-4220-5703-81c5-48d3c05db9dd', 'aeac7542-707b-5b98-a5a6-f511a578454f', 1, '2f204d1b-506f-5423-91e6-20bb272eadcc') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, default_day_position, status) values ('abbbfdda-23ee-5a95-892b-f6706ba7a8bb', 'RECOVERY_GUIDE_28_DAY_2', NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, reviewed) values ('c74937e1-c497-5b91-aa2f-4074bf1aab51', 'abbbfdda-23ee-5a95-892b-f6706ba7a8bb', 'es', 'Día 2', 'Salar de Uyuni y atardecer en el desierto de sal Visita a las lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, atravesando el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fósil,  Retorno a el Hotel en Tawa. Alojamiento: Tayka de Sal Comidas incluidas: Desayuno · Almuerzo', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5ca6751a-26cc-5dda-b007-16f33948c537', 'aeac7542-707b-5b98-a5a6-f511a578454f', 2, 'abbbfdda-23ee-5a95-892b-f6706ba7a8bb') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, default_day_position, status) values ('c8196cfc-9dca-5818-9e15-f38ab225e9af', 'RECOVERY_GUIDE_28_DAY_3', NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, reviewed) values ('7f47b53f-9feb-5b96-ae05-98bc5949938b', 'c8196cfc-9dca-5818-9e15-f38ab225e9af', 'es', 'Día 3', 'Exploración del Salar de Uyuni Salida a las 5am para apreciar el Amanecer en el Salar, vuelta al Hotel para disfrutar del desayuno.  Exploración de diferentes perspectivas de este paisaje único, Esculturas de Sal, Plaza de las banderas, Visita al pueblo artesanal de Colchani, Almuerzo en medio del salar y por la tarde, continuación del recorrido con tiempo para fotografías y para apreciar la inmensidad del horizonte blanco. Finalizando con un cóctel privado al atardecer en medio del salar. Alojamiento: Hotel Luna de Sal  Comidas incluidas: Desayuno · Almuerzo · Cóctel', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('839ab9ff-237f-5b92-88fc-e51fa62eb262', 'aeac7542-707b-5b98-a5a6-f511a578454f', 3, 'c8196cfc-9dca-5818-9e15-f38ab225e9af') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, default_day_position, status) values ('dfe4d98a-0af0-59f5-b37a-aacd4af8487a', 'RECOVERY_GUIDE_28_DAY_4', NULL, 'UYU', 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, reviewed) values ('0022950d-49ae-5039-88bd-2ab1bbdbb8ac', 'dfe4d98a-0af0-59f5-b37a-aacd4af8487a', 'es', 'Día 4 (opcional)', '(opcional)  – Vuelo hacia La Paz Transfer Hotel aeropuerto a las 7.30am. Alojamiento: No incluido Comidas incluidas: Desayuno Fin del servicio
El itinerario puede variar debido a acumulación de agua por lluvias. La Isla Incahuasi podría no estar accesible y la ruta puede modificarse sin previo aviso.', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d81c79b4-56c7-5384-a9f2-219d5bd29183', 'aeac7542-707b-5b98-a5a6-f511a578454f', 4, 'dfe4d98a-0af0-59f5-b37a-aacd4af8487a') on conflict do nothing;
-- No day_block_items for SPAUYU-4D3N-FTL: no matching budget or explicit service SKU.
-- Hotel names alone do not establish room, provider, currency or pricing variant.

insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('6e7ee944-785a-54b9-b329-6be204344a67', 'UYUUYU-2D1N-L', 'Servicio: 2 Días y 1 Noche: Full Day Salar de Uyuni + extensión Valle de las Rocas y Lagunas Altiplánicas', 'UYU', 'UYU', 'ROUNDTRIP', 2, 1, 'MIXTO', 'L', 'pendiente', '["La extracción mezcla dos días de este programa con cuatro días Uyuni–Arica sin SKU propio; solo se recuperan los dos primeros.", "Los incluye/no incluye generales están mezclados con otro programa; revisar antes de completar.", "Sin presupuesto por SKU en extraccion_presupuestos_standard.json. Todos los días quedan sin servicios tarifados; asignar SKU y variantes manualmente antes de aprobar."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, default_day_position, status) values ('663317eb-a126-53f2-aaa1-331c8d1bf91a', 'RECOVERY_GUIDE_44_DAY_1', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, reviewed) values ('afc6db92-0c94-5040-983c-cee7e3c7f02f', '663317eb-a126-53f2-aaa1-331c8d1bf91a', 'es', 'Salar de Uyuni · Colchani · Isla Incahuasi · Cóctel al Atardecer', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un importante recuerdo histórico del pasado ferroviario del país.
Alojamiento: Luna Salada', 'Almuerzo estilo Apthapi · Snacks para el atardecer', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('eb988938-8eba-5bf7-8d7c-9a825415c121', '6e7ee944-785a-54b9-b329-6be204344a67', 1, '663317eb-a126-53f2-aaa1-331c8d1bf91a') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, default_day_position, status) values ('05f0354a-78de-59ca-99f3-cc5537927256', 'RECOVERY_GUIDE_44_DAY_2', NULL, 'UYU', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, reviewed) values ('04aefcb0-f2be-5c0c-a6b0-ad30ee0b7c11', '05f0354a-78de-59ca-99f3-cc5537927256', 'es', 'Valle de las Rocas · Lagunas Altiplánicas · Retorno a Uyuni', 'Después del desayuno, iniciaremos una jornada de exploración hacia el Valle de las Rocas, una zona de formaciones volcánicas esculpidas por el viento y la erosión natural. Durante el recorrido podremos observar paisajes de gran amplitud, formaciones rocosas singulares y escenarios característicos del altiplano boliviano.
Alojamiento: No incluido', 'Comidas o bebidas no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e154d778-baee-5753-aa4d-2637b7fd41f2', '6e7ee944-785a-54b9-b329-6be204344a67', 2, '05f0354a-78de-59ca-99f3-cc5537927256') on conflict do nothing;
-- No day_block_items for UYUUYU-2D1N-L: no matching budget or explicit service SKU.
-- Hotel names alone do not establish room, provider, currency or pricing variant.

-- A natural-key collision must not silently produce partial templates.
do $$
begin
 if (select count(*) from public.itinerary_templates
     where sku in ('SPAUYU-4D3N-FTL','UYUUYU-2D1N-L')) <> 2 then
   raise exception 'Recovery incomplete: missing template';
 end if;
 if exists (
   select 1 from public.itinerary_templates t
   cross join lateral generate_series(1,t.days) d(n)
   left join public.template_days td on td.template_id=t.id and td.day_number=d.n
   left join public.day_blocks b on b.id=td.block_id
   where t.sku in ('SPAUYU-4D3N-FTL','UYUUYU-2D1N-L') and b.id is null
 ) then raise exception 'Recovery incomplete: missing day/block'; end if;
end $$;
commit;
