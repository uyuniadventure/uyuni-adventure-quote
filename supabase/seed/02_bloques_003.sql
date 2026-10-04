-- Generado por scripts/db/generate_blocks.py; ejecutar después de 00 y 01 y migración 003.
begin;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('eff7c70e-19ab-5ddf-b0ab-241ecaf8ca24', 'DAY_eff7c70e19ab5ddfb0ab', 'UYU', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f5416fb5-5585-524c-9b94-63175850f93f', 'eff7c70e-19ab-5ddf-b0ab-241ecaf8ca24', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Los Flamencos', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f0208101-d658-5d66-97e8-ace49cb7b85f', '1ed64259-6796-539d-9889-291da5798c6a', 2, 'eff7c70e-19ab-5ddf-b0ab-241ecaf8ca24') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e7c792fd-9d87-5674-839b-aa7bc955b089', 'DAY_e7c792fd9d875674839b', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8419f035-3183-5848-bc62-58757b0e2fdd', 'e7c792fd-9d87-5674-839b-aa7bc955b089', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('676bba2a-19e3-5a07-8c27-f68c2be8f88d', '1ed64259-6796-539d-9889-291da5798c6a', 3, 'e7c792fd-9d87-5674-839b-aa7bc955b089') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('95df3a85-6bf2-520b-9145-7ef43b183663', 'UYUUYU-3D2N-PTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'PTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "8 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('99992180-8a7f-5bd7-a50b-725e70080851', 'DAY_999921808a7f5bd7a50b', 'UYU', 'UYU', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('29d02580-0687-5826-8af1-e22e43b5d5b6', '99992180-8a7f-5bd7-a50b-725e70080851', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0281736a-2381-5a4e-a3ce-2abdb689f1d7', '99992180-8a7f-5bd7-a50b-725e70080851', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '00e0b0c7-7607-5f37-8daa-e1b5dd2431d0', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7733ba7c-2e6b-5149-983e-8053e727d6a2', '99992180-8a7f-5bd7-a50b-725e70080851', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cfaa9e4e-79b2-539e-8970-6ca2417e3d77', '99992180-8a7f-5bd7-a50b-725e70080851', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('76a27991-1fb4-53fd-be1b-b459a64a05b8', '99992180-8a7f-5bd7-a50b-725e70080851', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ee8add84-3483-5506-8865-e4ddae42a0bf', '99992180-8a7f-5bd7-a50b-725e70080851', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7f02a04b-dfb2-57dc-8db5-352eb7205092', '99992180-8a7f-5bd7-a50b-725e70080851', '5ee76308-b296-5d44-aacb-a874b1c2b6fe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('bd6e58b1-96c2-5501-adbe-b9992ff38baa', '95df3a85-6bf2-520b-9145-7ef43b183663', 1, '99992180-8a7f-5bd7-a50b-725e70080851') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'DAY_a5d9698a8a4a560fa1a1', 'UYU', 'UYU', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('082a0342-6eb9-5fad-abad-c667137087c1', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3987a595-aa71-5f0a-bd58-1c044490f4a9', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '00e0b0c7-7607-5f37-8daa-e1b5dd2431d0', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dac86f4a-c6e0-5341-9e18-605a4d0ed1cc', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6d87bd21-84f1-533f-bee0-4b07591e38c1', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1560cc0d-552f-54eb-9acc-b32f572fb9bc', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7569eb3d-0a8b-567a-a6db-59552cbe1fef', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c2e9acd0-964c-5ac8-b626-3dfd91193808', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f61b9cb9-aa36-5d47-9b60-bb049402a9f9', 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('3b2a29bf-16b3-56ab-bf41-96b33f7ddd3d', '95df3a85-6bf2-520b-9145-7ef43b183663', 2, 'a5d9698a-8a4a-560f-a1a1-48f0ddc6908c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('4dab971a-04a1-543c-bc4b-da07fffee2e1', 'DAY_4dab971a04a1543cbc4b', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('2797128c-8e90-5594-8eab-8452b051d4d6', '4dab971a-04a1-543c-bc4b-da07fffee2e1', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1e59ffef-715a-5a45-9d64-a23604e6055d', '4dab971a-04a1-543c-bc4b-da07fffee2e1', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '00e0b0c7-7607-5f37-8daa-e1b5dd2431d0', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d2bffaae-834e-5b06-b1e3-ab098694792d', '4dab971a-04a1-543c-bc4b-da07fffee2e1', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('35ed95fa-7f24-5503-9f68-48a6ab784bff', '4dab971a-04a1-543c-bc4b-da07fffee2e1', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('858538cd-d5a5-54e4-a8db-2fff24dbf145', '95df3a85-6bf2-520b-9145-7ef43b183663', 3, '4dab971a-04a1-543c-bc4b-da07fffee2e1') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('ba0bb734-2f73-5040-8aae-217705d47e23', 'UYUUYU-3D2N-LTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'LTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('aac2f427-10cd-50e9-953b-ceb601a9e39b', 'DAY_aac2f42710cd50e9953b', 'UYU', 'UYU', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('05d8fcf2-9ab0-5b9a-bb8a-7d07ef8409cc', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Luna Salada', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7bfd40d9-b9c7-521b-a6d9-f8d704e9a61a', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'fa487a75-b826-5a07-a0d4-913d223fe119', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a6c4ae7b-2f05-55c3-9394-10bf3c0fd6aa', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fc3ec081-702a-5b1e-9f06-cede68d007dd', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f3cccbcb-26cf-5958-9c91-9c69aea88f32', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9ae79c62-ec3f-56eb-b71a-109340913aca', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('de962657-97ae-5918-ad14-a012dfaab99a', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('09177c90-9436-51a2-9a72-29455b3e61a1', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('da300a20-56bc-59b3-bd6c-1f18f0c27719', 'aac2f427-10cd-50e9-953b-ceb601a9e39b', '56d7552b-879e-5c20-993b-8b1a7cbe6c60', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('eb533bf1-baee-54ef-b279-a56a401bac83', 'ba0bb734-2f73-5040-8aae-217705d47e23', 1, 'aac2f427-10cd-50e9-953b-ceb601a9e39b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('77fe2551-1185-5a5b-ab57-ae08392e7165', 'DAY_77fe255111855a5bab57', 'UYU', 'UYU', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('19eb808c-e10a-5be0-be24-cfe0285305cb', '77fe2551-1185-5a5b-ab57-ae08392e7165', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Taika del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9ca818a1-ffa5-59e3-8baf-b914fe3951a3', '77fe2551-1185-5a5b-ab57-ae08392e7165', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'fa487a75-b826-5a07-a0d4-913d223fe119', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ec9ca98c-ed93-5041-8efd-a5d4d8c7584b', '77fe2551-1185-5a5b-ab57-ae08392e7165', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('585444ba-d6b9-5c47-b1ef-3689cb5be066', '77fe2551-1185-5a5b-ab57-ae08392e7165', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('14ce02f7-f146-50b1-916f-a8bdf3f4fb11', '77fe2551-1185-5a5b-ab57-ae08392e7165', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7896f255-25d8-574a-900b-e5a0128f0ae9', '77fe2551-1185-5a5b-ab57-ae08392e7165', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('37e28d42-45af-5504-9729-ae148b830d4d', '77fe2551-1185-5a5b-ab57-ae08392e7165', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('89f9543a-ecf3-5e2c-9c31-026fbe54ad47', '77fe2551-1185-5a5b-ab57-ae08392e7165', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0c5b42e8-115c-5ea4-92ca-a3b4fe1f2a7d', 'ba0bb734-2f73-5040-8aae-217705d47e23', 2, '77fe2551-1185-5a5b-ab57-ae08392e7165') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('98fb707c-03bf-5c10-8c32-0e6487b63938', 'DAY_98fb707c03bf5c108c32', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d710efa8-ab72-5e63-8dc8-13760739d435', '98fb707c-03bf-5c10-8c32-0e6487b63938', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('840bb0f6-335b-5981-a0db-010dc5099dcf', '98fb707c-03bf-5c10-8c32-0e6487b63938', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'fa487a75-b826-5a07-a0d4-913d223fe119', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3fa8a030-1fb5-540a-ae9c-db74176e89cd', '98fb707c-03bf-5c10-8c32-0e6487b63938', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8bb70ac2-0d19-5c77-934b-3148aa432c33', '98fb707c-03bf-5c10-8c32-0e6487b63938', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('74ba3474-91f0-557e-96ba-423ffb316236', 'ba0bb734-2f73-5040-8aae-217705d47e23', 3, '98fb707c-03bf-5c10-8c32-0e6487b63938') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 'UYUUYU-3D2N-JTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'JTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b8175836-9720-5a6d-8e9f-fb1f99c6d023', 'DAY_b817583697205a6d8e9f', 'UYU', 'UYU', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('cae5c1bd-da0e-5113-a7d1-816b41dae0c1', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Jardines del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('450739d6-49de-53e1-b8ba-0ef25d5fae00', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'da777575-1a0c-5714-9c71-0c7e95afe2be', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('15b7af3f-9a13-56d9-8b49-1ff0a6fcb75f', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fbaf26c1-2132-59f5-832c-5a54e03f51b0', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a57cd365-d993-5de5-97a7-ec37f78b4fe8', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', 'ecd656cd-9c28-55e2-b248-36bc8f5901ab', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2f8608f1-5951-5985-8c61-6c6128327d15', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8a1cf04d-e2b3-5975-a3a7-3a5b6a8e5302', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', '113ed8f7-8532-5bcf-85ff-c51e2c0cf91e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e9f45f05-fdba-5273-b803-a883e720573c', 'b8175836-9720-5a6d-8e9f-fb1f99c6d023', 'c42e75f2-488a-52ed-863d-a740cc5d78cf', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('04accf41-6d1e-5c12-aeb4-14e408080e04', 'c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 1, 'b8175836-9720-5a6d-8e9f-fb1f99c6d023') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'DAY_d0e5759293b95b4dac3e', 'UYU', 'UYU', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9c4011b6-fe88-5d09-89aa-ce90018bead2', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Taika del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('17dec528-8609-5e0a-aa00-97192a0c0961', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'da777575-1a0c-5714-9c71-0c7e95afe2be', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('78c81e31-cc83-5a09-892b-da49e69efaf2', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('337b5b8e-d936-5762-88de-f0c059f2034b', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5ff84ded-67f3-5ead-8e46-344fa55ff422', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('75997725-83b1-5ed2-8b1c-478473793c20', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('94e7717b-5f88-5c58-8350-083d83af11f2', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6e2a0042-75ed-53cc-8758-07c8e3d929b3', 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1f50069d-3b68-50dd-b2dd-4b9431c95e95', 'c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 2, 'd0e57592-93b9-5b4d-ac3e-e271dbc41c0d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('72fde351-ec7c-5feb-9ad7-e7437690cdc5', 'DAY_72fde351ec7c5feb9ad7', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('dd575074-72ff-5e0f-a10c-8bb402a849bd', '72fde351-ec7c-5feb-9ad7-e7437690cdc5', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2389244d-a5bd-5ea1-867a-598b432357d5', '72fde351-ec7c-5feb-9ad7-e7437690cdc5', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'da777575-1a0c-5714-9c71-0c7e95afe2be', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7c8133ed-d877-59c6-9932-2ee7a4ee18f2', '72fde351-ec7c-5feb-9ad7-e7437690cdc5', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1f00bec5-59b9-5a2e-84af-1c7ee6c27937', '72fde351-ec7c-5feb-9ad7-e7437690cdc5', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('cbad91ce-e8fb-54c7-81dc-370f276373aa', 'c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 3, '72fde351-ec7c-5feb-9ad7-e7437690cdc5') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 'UYUUYU-3D2N-ÑF', 'ITINERARIO DETALLADO – UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'ÑF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e278a320-9184-5f2c-9eec-24abef6c3fb5', 'DAY_e278a32091845f2c9eec', 'UYU', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('ce489a36-2621-5576-ba74-2775170ab276', 'e278a320-9184-5f2c-9eec-24abef6c3fb5', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Coscaña', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6493a679-1c5e-557c-8e9c-8ff13e95d590', '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 1, 'e278a320-9184-5f2c-9eec-24abef6c3fb5') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('4cd90f12-2368-5a94-b9e8-d5abe9d7f7c2', '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 2, 'eff7c70e-19ab-5ddf-b0ab-241ecaf8ca24') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('da0cee7f-232e-5b37-9770-a1613d95b674', '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 3, 'e7c792fd-9d87-5674-839b-aa7bc955b089') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('23ebc69c-20e6-53f5-a6c6-9da288431864', 'UYUUYU-3D2N-ÑTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'ÑTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a541c827-420e-50e2-93f0-9c2ef6e771d5', 'DAY_a541c827420e50e293f0', 'UYU', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('65036bd1-5961-588c-b313-3bbe1a8afec5', 'a541c827-420e-50e2-93f0-9c2ef6e771d5', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Coscaña', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a4bde608-ad9d-5747-b358-6615cc7d704d', '23ebc69c-20e6-53f5-a6c6-9da288431864', 1, 'a541c827-420e-50e2-93f0-9c2ef6e771d5') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('16038fac-4a71-5bc5-bcee-fb0d4af37e06', 'DAY_16038fac4a715bc5bcee', 'UYU', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('1e492c08-2f94-5213-9b40-d5f0e96871b9', '16038fac-4a71-5bc5-bcee-fb0d4af37e06', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Taika del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9e14c09b-2a1f-57d7-84ec-fc1be8e80ee8', '23ebc69c-20e6-53f5-a6c6-9da288431864', 2, '16038fac-4a71-5bc5-bcee-fb0d4af37e06') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('16dd93d6-91e7-5607-a617-7d91fd18964f', 'DAY_16dd93d691e75607a617', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b08a384f-4934-5398-8d58-52ce54335f9f', '16dd93d6-91e7-5607-a617-7d91fd18964f', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e5d328da-1741-5d77-8445-6084b2eebd7d', '23ebc69c-20e6-53f5-a6c6-9da288431864', 3, '16dd93d6-91e7-5607-a617-7d91fd18964f') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('49e92237-b6d4-514b-93bb-3272dfd1efd9', 'UYUUYU-3D2N-KS', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'KS', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('173f1e51-e9c5-5d09-af57-a071c05750cd', 'DAY_173f1e51e9c55d09af57', 'UYU', 'UYU', 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('204e8bc2-e5e8-5a30-9058-4a4b6e230900', '173f1e51-e9c5-5d09-af57-a071c05750cd', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Kachi', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0b59813f-9f65-5608-8423-9d485cae7ce7', '173f1e51-e9c5-5d09-af57-a071c05750cd', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7031738f-9790-5c01-833a-9534efbfdfc6', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('67b5f5e8-eeeb-5bff-8ae8-ada046ddcffa', '173f1e51-e9c5-5d09-af57-a071c05750cd', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0bac5671-e1e1-58ef-bd04-83bde9b8c2e6', '173f1e51-e9c5-5d09-af57-a071c05750cd', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c15a9810-9e05-596b-86b8-7454541db133', '173f1e51-e9c5-5d09-af57-a071c05750cd', 'a9f5afb8-374d-5c0c-8413-99aaae578359', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e7a2d62b-22cc-51ac-9ae1-bba7e088501c', '173f1e51-e9c5-5d09-af57-a071c05750cd', 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c3fa0abd-003c-50de-b93e-ad4292f77864', '173f1e51-e9c5-5d09-af57-a071c05750cd', '3f93d6d1-5344-5390-aade-fe9b9be74129', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0c6bfbb0-2b2a-58cb-a371-65ee5d1a4f82', '173f1e51-e9c5-5d09-af57-a071c05750cd', '7542eeab-7698-5514-b7bc-d3ac470b03f4', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('55bb7e72-f773-56f9-be44-6bd8793e0f7b', '173f1e51-e9c5-5d09-af57-a071c05750cd', '2ae87e13-3f80-5387-b92d-56a5b36d4e54', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f1fa2057-520c-5096-9d0c-b422d137f9a2', '49e92237-b6d4-514b-93bb-3272dfd1efd9', 1, '173f1e51-e9c5-5d09-af57-a071c05750cd') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b2fe8078-fbff-5551-b66e-fcfce8530253', 'DAY_b2fe8078fbff5551b66e', 'UYU', 'UYU', 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('ecb045e7-dfad-5407-b813-3b8b16471c4e', 'b2fe8078-fbff-5551-b66e-fcfce8530253', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Sky Deam', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('46080d2c-e272-5445-a173-77e77384c2bc', 'b2fe8078-fbff-5551-b66e-fcfce8530253', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7031738f-9790-5c01-833a-9534efbfdfc6', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a6a70992-8fb0-5134-bbb0-a34408c74bcc', 'b2fe8078-fbff-5551-b66e-fcfce8530253', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('91c65f2d-a436-51e9-82de-e6b463ed8bcf', 'b2fe8078-fbff-5551-b66e-fcfce8530253', '81270178-5ac4-5c82-b566-4c7d3224b368', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('077e4b6e-ee3b-52ed-bfd8-093f4e0248d3', 'b2fe8078-fbff-5551-b66e-fcfce8530253', 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('b7c68467-79a4-53c5-93b4-73f030fd545b', '49e92237-b6d4-514b-93bb-3272dfd1efd9', 2, 'b2fe8078-fbff-5551-b66e-fcfce8530253') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9a4d7c67-cb6e-5ac7-a6e5-9acf87afcff6', 'DAY_9a4d7c67cb6e5ac7a6e5', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('fde782a5-e1df-542d-bebd-d9354e28c6df', '9a4d7c67-cb6e-5ac7-a6e5-9acf87afcff6', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e35ae166-edc6-5472-8b59-6c18e7033bb5', '9a4d7c67-cb6e-5ac7-a6e5-9acf87afcff6', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7031738f-9790-5c01-833a-9534efbfdfc6', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('30d77d8e-bd74-5a79-b449-764b8012cfe9', '9a4d7c67-cb6e-5ac7-a6e5-9acf87afcff6', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('56bf7d5a-6f87-5b93-95ec-93f376319c02', '9a4d7c67-cb6e-5ac7-a6e5-9acf87afcff6', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('78aa3c89-88e9-5a94-aab3-e8b6433edf89', '49e92237-b6d4-514b-93bb-3272dfd1efd9', 3, '9a4d7c67-cb6e-5ac7-a6e5-9acf87afcff6') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('74fd942d-44d1-52a5-af3b-9a10027cb6d9', 'UYUUYU-3D2N-CkHj', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'CkHj', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('570ba1b3-608c-5f14-a185-a0d30ff44842', 'DAY_570ba1b3608c5f14a185', 'UYU', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5360cb4b-4260-53b9-b1b4-6f243fd203b9', '570ba1b3-608c-5f14-a185-a0d30ff44842', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hostel de Sal en Colcha K', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('c44caaaf-eb9c-5d1d-8a75-ce1c5dad1eea', '74fd942d-44d1-52a5-af3b-9a10027cb6d9', 1, '570ba1b3-608c-5f14-a185-a0d30ff44842') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9b9becca-fc03-5d13-a163-879727e01204', 'DAY_9b9beccafc035d13a163', 'UYU', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5a447b56-39c2-5aef-a873-db3679105d77', '9b9becca-fc03-5d13-a163-879727e01204', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hostal basico en Huayajara', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('870f5497-609d-5717-93b7-3f1f022ca498', '74fd942d-44d1-52a5-af3b-9a10027cb6d9', 2, '9b9becca-fc03-5d13-a163-879727e01204') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('14a6f1aa-453b-5e9a-b0da-5293a93d5860', 'DAY_14a6f1aa453b5e9ab0da', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f2438abf-df2e-56d0-8ba8-7f134c5d24c5', '14a6f1aa-453b-5e9a-b0da-5293a93d5860', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('dd29b913-263d-5f67-ae9d-7502c2ee549b', '74fd942d-44d1-52a5-af3b-9a10027cb6d9', 3, '14a6f1aa-453b-5e9a-b0da-5293a93d5860') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('8eaaf135-cdba-5122-be08-66d9e825672d', 'UYUSPA-3D2N-PTd', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA   (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'PTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('bf419c61-f3b4-53ea-aaa4-9bf853852509', 'DAY_bf419c61f3b453eaaaa4', 'UYU', 'SPA', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('40e084fa-a575-582b-a052-c8229c0c600d', 'bf419c61-f3b4-53ea-aaa4-9bf853852509', 'es', 'Uyuni · Colchani · Isla Incahuasi - Full day Salar', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c364b89e-c880-5510-87e0-fae65d2cc8a6', 'bf419c61-f3b4-53ea-aaa4-9bf853852509', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '415a5dfe-0345-5780-94ab-d107ef4aa663', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('95a81c97-c886-5e4d-8e2d-8f1f0720c7ff', 'bf419c61-f3b4-53ea-aaa4-9bf853852509', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('baf5f354-7278-5f0f-81d5-79b729b68938', 'bf419c61-f3b4-53ea-aaa4-9bf853852509', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('499d9bda-33b5-5215-a458-aefd968a5c97', 'bf419c61-f3b4-53ea-aaa4-9bf853852509', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dfd0eb4a-1edc-57ea-a7cc-d70d1dbd16e8', 'bf419c61-f3b4-53ea-aaa4-9bf853852509', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('aa17a9c3-0f6e-59cf-81b7-11eb39daed16', '8eaaf135-cdba-5122-be08-66d9e825672d', 1, 'bf419c61-f3b4-53ea-aaa4-9bf853852509') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('90209467-62b0-514d-b742-1771c836d19b', 'DAY_9020946762b0514db742', 'UYU', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('24eaedc3-34dc-5da2-835e-e37b27ace16e', '90209467-62b0-514d-b742-1771c836d19b', 'es', 'Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Tayka del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e9b78bfd-22fd-5c53-94f7-d18626b50db3', '90209467-62b0-514d-b742-1771c836d19b', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '415a5dfe-0345-5780-94ab-d107ef4aa663', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('30906f90-09ec-5488-8bb5-dc0d9136d02d', '90209467-62b0-514d-b742-1771c836d19b', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1f388bc2-181b-5aab-b132-efe0c7ce88bb', '90209467-62b0-514d-b742-1771c836d19b', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('14429350-1c04-5a7a-8e16-ef004649de04', '90209467-62b0-514d-b742-1771c836d19b', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bf571b67-04e6-5b65-8960-09a949ca6d34', '90209467-62b0-514d-b742-1771c836d19b', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ea65e27f-0a48-51ca-acc4-835fb35a4de6', '90209467-62b0-514d-b742-1771c836d19b', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5b619af0-39df-580f-b810-5b231ab7d625', '90209467-62b0-514d-b742-1771c836d19b', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6eecabbc-2d1f-54c0-b845-fef810ef81c0', '8eaaf135-cdba-5122-be08-66d9e825672d', 2, '90209467-62b0-514d-b742-1771c836d19b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b63c6a62-b9d2-58a6-804e-5d4263d0e2a3', 'DAY_b63c6a62b9d258a6804e', 'UYU', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('272a54f6-8a92-539d-86dc-371026dc0202', 'b63c6a62-b9d2-58a6-804e-5d4263d0e2a3', 'es', 'Sol de la Mañana · Hito Cajón ·  San Pedro de Atacama', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluído', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('08aea804-8420-5dcb-a329-20f0b0ae73b4', 'b63c6a62-b9d2-58a6-804e-5d4263d0e2a3', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '415a5dfe-0345-5780-94ab-d107ef4aa663', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a79105c8-1cf0-55c8-86a6-5b5988c682c5', 'b63c6a62-b9d2-58a6-804e-5d4263d0e2a3', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fed03355-7a4d-5ae3-9286-0c2ca84425a3', 'b63c6a62-b9d2-58a6-804e-5d4263d0e2a3', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('af1ec0bb-d569-59ac-85ef-d65db3f6aac4', 'b63c6a62-b9d2-58a6-804e-5d4263d0e2a3', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('530768f4-b6dc-54e1-9188-2e481cde2e59', '8eaaf135-cdba-5122-be08-66d9e825672d', 3, 'b63c6a62-b9d2-58a6-804e-5d4263d0e2a3') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('287413e0-49b4-5708-9871-ffd236128363', 'UYUSPA-3D2N-LTd', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA  (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'LTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('83d11a4c-9624-543d-96ff-252f29858176', 'DAY_83d11a4c9624543d96ff', 'UYU', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('ff18c490-e840-595c-9c3a-c35262e03cd0', '83d11a4c-9624-543d-96ff-252f29858176', 'es', 'Uyuni · Colchani · Isla Incahuasi · Puerto Chuvica', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Luna Salada', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1f93fccc-7068-51f3-a0df-657b3eb176ba', '287413e0-49b4-5708-9871-ffd236128363', 1, '83d11a4c-9624-543d-96ff-252f29858176') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('563c416f-bcdb-5a45-bb4d-e7e089a64e67', 'DAY_563c416fbcdb5a45bb4d', 'UYU', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('3ee79c24-8594-559c-a467-26a07e48c4c2', '563c416f-bcdb-5a45-bb4d-e7e089a64e67', 'es', 'Puerto Chuvica · Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Tayka del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('4e92d60b-50e9-5085-8249-cbdfaa1ea302', '287413e0-49b4-5708-9871-ffd236128363', 2, '563c416f-bcdb-5a45-bb4d-e7e089a64e67') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('19cb80c0-a9c5-5e63-ae5c-8b8345f8c441', 'DAY_19cb80c0a9c55e63ae5c', 'UYU', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('321dd040-1d6b-5a24-882e-9e95d56d6e6f', '19cb80c0-a9c5-5e63-ae5c-8b8345f8c441', 'es', 'Sol de la Mañana · Hito Cajón', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluido', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f0fc166a-e318-5311-a2d0-5eb3826f0c43', '287413e0-49b4-5708-9871-ffd236128363', 3, '19cb80c0-a9c5-5e63-ae5c-8b8345f8c441') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('7d37719c-7fcb-5622-b0f8-f7d3101441e7', 'UYUSPA-3D2N-JTd', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA  (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'COMFORT', 'JTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c771ce3d-eb27-532e-b39e-5aff245bbcfa', 'DAY_c771ce3deb27532eb39e', 'UYU', 'SPA', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('abc81bf5-44ad-5e7d-b3ac-fcafb0dd0399', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', 'es', 'Uyuni · Colchani · Isla Incahuasi ·', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Jardines de Uyuni', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5efebc9e-781f-5420-abb2-714d4ff19465', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7513f5db-f8d1-57ae-a1c3-db400169a5cc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('637d072e-4cf2-5d30-8dbb-26feb0499a3c', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a32fa4d2-0184-5be2-99e9-ff2e2bdbb137', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d37507a7-6ab4-56e1-81cc-8234325e7724', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', 'ecd656cd-9c28-55e2-b248-36bc8f5901ab', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f909c6aa-c2de-5ad5-8a18-49b60fa2f865', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('21486d79-ff3c-57ae-9fde-a66a2e0ed81f', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', '113ed8f7-8532-5bcf-85ff-c51e2c0cf91e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8ad303a3-e7c0-5af1-9a33-e09e1a130588', 'c771ce3d-eb27-532e-b39e-5aff245bbcfa', 'c42e75f2-488a-52ed-863d-a740cc5d78cf', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6d23a5d7-a277-5b08-857f-57ba7037b267', '7d37719c-7fcb-5622-b0f8-f7d3101441e7', 1, 'c771ce3d-eb27-532e-b39e-5aff245bbcfa') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('949e4c88-6460-5fe8-bfef-adcc707daf53', 'DAY_949e4c8864605fe8bfef', 'UYU', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('83952609-41bf-59fd-aff6-4bc6f81e345a', '949e4c88-6460-5fe8-bfef-adcc707daf53', 'es', 'Puerto Chuvica · Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Tayka del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aea371d8-6d58-5066-8a98-90f9eeca9a26', '949e4c88-6460-5fe8-bfef-adcc707daf53', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7513f5db-f8d1-57ae-a1c3-db400169a5cc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ffd1a2a5-862d-59c1-b81e-05f52bbfec86', '949e4c88-6460-5fe8-bfef-adcc707daf53', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('576c7096-4488-5a6e-994d-621d45c82f35', '949e4c88-6460-5fe8-bfef-adcc707daf53', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('84376ad0-d541-5d7b-a44e-8a024f57afa6', '949e4c88-6460-5fe8-bfef-adcc707daf53', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7434315c-af62-5570-bb51-d2808a69cd0c', '949e4c88-6460-5fe8-bfef-adcc707daf53', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ce7282ad-6bc4-5c20-8c7c-5e553f1f5136', '949e4c88-6460-5fe8-bfef-adcc707daf53', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ff3d766b-a996-549d-a98b-a8868220363e', '949e4c88-6460-5fe8-bfef-adcc707daf53', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5d1695c9-8c1e-5379-99c0-4c5c56a44213', '7d37719c-7fcb-5622-b0f8-f7d3101441e7', 2, '949e4c88-6460-5fe8-bfef-adcc707daf53') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('559c45fe-1443-5257-8e69-b5864815b8c8', 'DAY_559c45fe144352578e69', 'UYU', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('437702e4-8def-5a0f-b56f-41d2dec40204', '559c45fe-1443-5257-8e69-b5864815b8c8', 'es', 'Sol de la Mañana · Hito Cajón  · San Pedro de Atacama', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluído', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ce984030-d162-5b1b-9ab7-b568d86f33fd', '559c45fe-1443-5257-8e69-b5864815b8c8', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7513f5db-f8d1-57ae-a1c3-db400169a5cc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ee548a04-c206-52c5-8f8a-028acc06a244', '559c45fe-1443-5257-8e69-b5864815b8c8', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('74621d4f-4d33-5917-a9b4-0728aa53106b', '559c45fe-1443-5257-8e69-b5864815b8c8', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('74aed09b-e3d2-5250-971f-f3de863ee3fd', '559c45fe-1443-5257-8e69-b5864815b8c8', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1f524b3c-ca87-505c-a3bd-ba133f72ec3b', '7d37719c-7fcb-5622-b0f8-f7d3101441e7', 3, '559c45fe-1443-5257-8e69-b5864815b8c8') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('242291b9-7094-5c71-a396-87da68e5b217', 'UYUSPA-3D2N-ÑTd', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA  (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'ÑTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7b57b214-cb7a-5781-ac02-ffc421cd6d40', 'DAY_7b57b214cb7a5781ac02', 'UYU', 'SPA', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d38c5b1c-ffcb-59b4-9dad-c37ab2ed3864', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', 'es', 'Uyuni · Colchani · Isla Incahuasi · Puerto Chuvica', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Coscaña', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e58ae82d-16c2-5a9b-9c3b-ab294f1ed428', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'c3189e5f-6fcc-5ec8-8ea6-1b7130c35410', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fc3ae985-1350-5f17-8de7-333df3544cc0', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('77dcad17-ca50-5f75-89ee-0ff5558672e7', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3491dc2c-1e64-558c-a61c-4044d872b9b1', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', '4e78b66d-0113-529a-a8f6-76bb10131eee', 1, false, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7818baba-8f34-52b2-afb9-ea8979d02093', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('645a12d6-8840-56b2-98b4-ece2c3ce8f71', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', 'fe8f8a8e-f51b-5460-9be0-ea2934436a65', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f1f53010-2f4f-5a1d-8646-ccce884d9cab', '7b57b214-cb7a-5781-ac02-ffc421cd6d40', 'fa33cfd5-f099-5049-934f-ac1376653382', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('406b3a3c-0a5f-56c9-a46a-859bdb721f52', '242291b9-7094-5c71-a396-87da68e5b217', 1, '7b57b214-cb7a-5781-ac02-ffc421cd6d40') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('71f435f3-5c65-5590-9c69-9589ce935527', 'DAY_71f435f35c6555909c69', 'UYU', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a489422c-ab76-56e2-afa9-c8ffda7d2bf4', '71f435f3-5c65-5590-9c69-9589ce935527', 'es', 'Puerto Chuvica · Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Tayka del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1bf9879d-ca58-5782-a2c7-51f880addb3f', '71f435f3-5c65-5590-9c69-9589ce935527', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'c3189e5f-6fcc-5ec8-8ea6-1b7130c35410', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c1bf2199-ce81-5e92-8737-154f097ef3bb', '71f435f3-5c65-5590-9c69-9589ce935527', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e2235d12-ba09-5320-b4ea-560302da9432', '71f435f3-5c65-5590-9c69-9589ce935527', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b735c877-4c27-5e9d-88a9-b9a444313921', '71f435f3-5c65-5590-9c69-9589ce935527', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('342ab4a2-7dcb-5739-914c-0ce780b18fb8', '71f435f3-5c65-5590-9c69-9589ce935527', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7417e4d8-82bb-5e6d-a1c1-7e4656916f35', '71f435f3-5c65-5590-9c69-9589ce935527', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8d0c8353-970a-5cc8-8adb-3a8c34a7a0c3', '71f435f3-5c65-5590-9c69-9589ce935527', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9affb311-9d83-5e78-97d0-2e1302eed08c', '242291b9-7094-5c71-a396-87da68e5b217', 2, '71f435f3-5c65-5590-9c69-9589ce935527') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('5cc3a2c8-b681-51a5-8775-58e763adab80', 'DAY_5cc3a2c8b68151a58775', 'UYU', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('6e488890-a5dd-5011-a144-f41bd09d8085', '5cc3a2c8-b681-51a5-8775-58e763adab80', 'es', 'Sol de la Mañana · Hito Cajón  · San Pedro de Atacama', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluido', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('92fd873e-cc68-5497-832c-4eba7a27ac58', '5cc3a2c8-b681-51a5-8775-58e763adab80', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'c3189e5f-6fcc-5ec8-8ea6-1b7130c35410', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('33e77021-0a43-54c9-a917-ac5be1656648', '5cc3a2c8-b681-51a5-8775-58e763adab80', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8fd47b1b-1cad-5883-95fc-38a371d7262a', '5cc3a2c8-b681-51a5-8775-58e763adab80', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7393bce4-d76a-5e0e-bf42-f9787784b560', '5cc3a2c8-b681-51a5-8775-58e763adab80', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('8dd6cadf-8c2d-5129-b33f-03d3be5a4bf6', '242291b9-7094-5c71-a396-87da68e5b217', 3, '5cc3a2c8-b681-51a5-8775-58e763adab80') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('8ced6997-e743-57da-8679-b8202f48256e', 'UYUSPA-3D2N-KS', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA  (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'KS', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('557c7d24-40ab-5c08-af3f-ff38741805b5', 'DAY_557c7d2440ab5c08af3f', 'UYU', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d13c820b-24db-57a7-947e-250be03c19a9', '557c7d24-40ab-5c08-af3f-ff38741805b5', 'es', 'Uyuni · Colchani · Isla Incahuasi · Puerto Chuvica', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Kachi', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro – Calama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f1696989-155a-5038-8929-00c08396bce4', '8ced6997-e743-57da-8679-b8202f48256e', 1, '557c7d24-40ab-5c08-af3f-ff38741805b5') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ae15e5af-1a06-5ac3-bb40-65cab23dc204', 'DAY_ae15e5af1a065ac3bb40', 'UYU', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('05e1fba1-0d80-51c1-a220-d5ae2e671589', 'ae15e5af-1a06-5ac3-bb40-65cab23dc204', 'es', 'Puerto Chuvica · Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Sky Dream', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro – Calama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('861829b9-b7b2-53bc-bb9e-8517e79cca3d', '8ced6997-e743-57da-8679-b8202f48256e', 2, 'ae15e5af-1a06-5ac3-bb40-65cab23dc204') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b966e728-fca5-5bb4-a26e-ec4f6b2e42e7', 'DAY_b966e728fca55bb4a26e', 'UYU', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('3f59f0d2-96c1-56f2-ab9c-b76d9eea3053', 'b966e728-fca5-5bb4-a26e-ec4f6b2e42e7', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluido', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro – Calama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a0b5d834-160b-50a1-b1bc-b836d097831d', '8ced6997-e743-57da-8679-b8202f48256e', 3, 'b966e728-fca5-5bb4-a26e-ec4f6b2e42e7') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('1f6782ea-17d1-54b6-8ba8-95d3c6c89e7e', 'UYUSPA-3D2N-LM', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'LM', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('668d4d99-3ccd-5304-84e5-a4675f8180e1', 'DAY_668d4d993ccd530484e5', 'UYU', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('4d43ab31-796b-52e9-ba5b-d97eb4a4e3eb', '668d4d99-3ccd-5304-84e5-a4675f8180e1', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Luna Salada', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ce820d1d-1055-5a05-be9e-6d014d237bb9', '1f6782ea-17d1-54b6-8ba8-95d3c6c89e7e', 1, '668d4d99-3ccd-5304-84e5-a4675f8180e1') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('2915f995-139d-5735-baee-34995fe4c447', 'DAY_2915f995139d5735baee', 'UYU', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('05d9da44-0f89-5531-a017-098feec17fa1', '2915f995-139d-5735-baee-34995fe4c447', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural, antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e9e4b2ca-21ec-5b60-bf7b-8dad331cfe2c', '1f6782ea-17d1-54b6-8ba8-95d3c6c89e7e', 2, '2915f995-139d-5735-baee-34995fe4c447') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('18e40b5c-cea9-5625-b7c4-6891fe391d0a', 'DAY_18e40b5ccea95625b7c4', 'UYU', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bde8d00e-ea25-50db-ac7e-b32851cf5255', '18e40b5c-cea9-5625-b7c4-6891fe391d0a', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 17:00 hrs.', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('09201346-6ebd-5e99-8a53-ce5ae26fef7b', '1f6782ea-17d1-54b6-8ba8-95d3c6c89e7e', 4, '18e40b5c-cea9-5625-b7c4-6891fe391d0a') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('ede37172-1e3b-5f87-8a34-14e3c81133e3', 'UYUSPA-3D2N-KDr', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA   (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'BUDGET', 'KDr', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('127f86e4-5540-5891-b3bd-244d5f461ad5', 'DAY_127f86e455405891b3bd', 'UYU', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('659f0b43-8c60-5894-920c-0a7efca53c19', '127f86e4-5540-5891-b3bd-244d5f461ad5', 'es', 'Uyuni · Colchani · Isla Incahuasi - Full day Salar', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Kachi', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f312f99a-b612-5158-a77a-d5d7af262a06', 'ede37172-1e3b-5f87-8a34-14e3c81133e3', 1, '127f86e4-5540-5891-b3bd-244d5f461ad5') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('2ebc33d6-9bcd-5fa0-882b-352da4c6673b', 'DAY_2ebc33d69bcd5fa0882b', 'UYU', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9b3b1b51-98af-531f-a1f5-35efcdd01483', '2ebc33d6-9bcd-5fa0-882b-352da4c6673b', 'es', 'Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Refugio de Montaña en Laguna Colorada', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a9cdab6b-efca-521e-bc7c-029aea90a230', 'ede37172-1e3b-5f87-8a34-14e3c81133e3', 2, '2ebc33d6-9bcd-5fa0-882b-352da4c6673b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('1eec4dc4-f9c4-539d-8010-ccf651a7e39e', 'DAY_1eec4dc4f9c4539d8010', 'UYU', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('634c4224-356f-51a7-a930-4fc11f73c0fd', '1eec4dc4-f9c4-539d-8010-ccf651a7e39e', 'es', 'Sol de la Mañana · Hito Cajón ·  San Pedro de Atacama', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluído', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5f71956c-7e64-5a99-b169-086f5fc89955', 'ede37172-1e3b-5f87-8a34-14e3c81133e3', 3, '1eec4dc4-f9c4-539d-8010-ccf651a7e39e') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e1982840-00dc-5eaa-ba5e-50c7171416a1', 'DAY_e198284000dc5eaaba5e', 'SPA', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9d5c41b7-ed4a-59a2-9f13-321b2341a076', 'e1982840-00dc-5eaa-ba5e-50c7171416a1', 'es', 'Lagunas Altiplánicas y Desierto de Siloli Salida desde su hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón. Durante la jornada se visitan la Laguna Blanca, Laguna Verde, el Desierto de Dalí, Aguas Termales Polques, el campo geotérmico de los Géiseres Sol de Mañana y la impresionante Laguna Colorada. La ruta continúa a través del vasto Desierto de Siloli y las lagunas Honda y Hedionda, hábitat natural de flamencos andinos en un entorno volcánico de gran impacto visual. Alojamiento: Hotel Los Flamencos (Laguna Hedionda)  Comidas incluidas: Almuerzo · Cena', 'Lagunas Altiplánicas y Desierto de Siloli Salida desde su hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón. Durante la jornada se visitan la Laguna Blanca, Laguna Verde, el Desierto de Dalí, Aguas Termales Polques, el campo geotérmico de los Géiseres Sol de Mañana y la impresionante Laguna Colorada. La ruta continúa a través del vasto Desierto de Siloli y las lagunas Honda y Hedionda, hábitat natural de flamencos andinos en un entorno volcánico de gran impacto visual. Alojamiento: Hotel Los Flamencos (Laguna Hedionda)  Comidas incluidas: Almuerzo · Cena', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('589c6586-e41c-5095-84ad-c5d6ad692e7b', 'DAY_589c6586e41c509584ad', 'SPA', 'UYU', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('599b7f9a-2123-59dc-9474-84f7b36c38c1', '589c6586-e41c-5095-84ad-c5d6ad692e7b', 'es', '(opcional)  – Vuelo hacia La Paz Transfer Hotel aeropuerto a las 7.30am. Alojamiento: No incluido Comidas incluidas: Desayuno Fin del servicio', 'El itinerario puede variar debido a acumulación de agua por lluvias. La Isla Incahuasi podría no estar accesible y la ruta puede modificarse sin previo aviso.', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('83b7af4f-cbf4-54d2-bc17-22e197e3527f', 'DAY_83b7af4fcbf454d2bc17', 'UYU', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('aa760b2e-89e9-5569-9942-93345fe8ccf0', '83b7af4f-cbf4-54d2-bc17-22e197e3527f', 'es', 'Salar de Uyuni · Colchani · Isla Incahuasi · Cóctel al Atardecer', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un importante recuerdo histórico del pasado ferroviario del país.
Alojamiento: Luna Salada', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('df69c4b9-9308-5ba3-b5d6-195a5e5df398', 'DAY_df69c4b993085ba3b5d6', 'UYU', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('62fd9d9f-6ee2-5165-ba0a-ad714e64b823', 'df69c4b9-9308-5ba3-b5d6-195a5e5df398', 'es', 'Valle de las Rocas · Lagunas Altiplánicas · Retorno a Uyuni', 'Después del desayuno, iniciaremos una jornada de exploración hacia el Valle de las Rocas, una zona de formaciones volcánicas esculpidas por el viento y la erosión natural. Durante el recorrido podremos observar paisajes de gran amplitud, formaciones rocosas singulares y escenarios característicos del altiplano boliviano.
Alojamiento: No incluido', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('63b1c8c3-76b6-590f-bea3-7c0cad9b6b5f', 'DAY_63b1c8c376b6590fbea3', 'UYU', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f30fbb7b-b301-5e3b-986c-e6ec5ffbd617', '63b1c8c3-76b6-590f-bea3-7c0cad9b6b5f', 'es', '12/08 · Exploración alrededor del Salar de Uyuni', 'Día completo dedicado a la exploración de los alrededores del Salar de Uyuni, recorriendo algunos de sus principales atractivos y paisajes característicos. Durante esta jornada se visitarán sectores del salar y zonas cercanas, con tiempo para fotografías y contemplación del entorno.
Alojamiento: Hotel Jardines de Uyuni · 2 habitaciones', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('98ec67bc-69c6-58b3-8b88-651401010d97', 'DAY_98ec67bc69c658b38b88', 'UYU', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('661a77e4-cadb-59db-8fb1-176d350e59a9', '98ec67bc-69c6-58b3-8b88-651401010d97', 'es', '13/08 · Uyuni · Sajama · Tambo Quemado', 'Salida desde Uyuni hacia Tambo Quemado, siguiendo una ruta paisajística por el altiplano boliviano vía Sajama. Durante el recorrido se atravesarán extensas planicies de altura, paisajes volcánicos, pueblos andinos y zonas de gran valor escénico, con vistas hacia el entorno del Parque Nacional Sajama.
Alojamiento: Hospedaje rústico en ruta / zona Sajama – Tambo Quemado', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('cca6da92-46ca-549f-a6ec-080eac3321a9', 'DAY_cca6da9246ca549fa6ec', 'UYU', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5a508ef7-710a-5cfe-9554-abe5bc8ffe96', 'cca6da92-46ca-549f-a6ec-080eac3321a9', 'es', '14/08 · Termas · Tambo Quemado · Lago Chungará · Putre', 'Después del desayuno, visita a las termas de la zona para disfrutar de un momento de descanso antes de continuar hacia la frontera. Posteriormente, traslado hacia Tambo Quemado para realizar el cruce fronterizo alrededor de las 11:30 AM.
Alojamiento: No incluido · Se sugiere Terraza Lodge en Putre', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e1f48dc1-997a-54ab-b3d1-36a282779025', 'DAY_e1f48dc1997a54abb3d1', 'UYU', 'UYU', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('16b3b900-8c65-5b91-b1af-4549ccead156', 'e1f48dc1-997a-54ab-b3d1-36a282779025', 'es', '15/08 · Putre · Museo de San Miguel de Azapa · Arica · Aeropuerto', 'Salida desde Putre hacia Arica, realizando paradas en ruta para apreciar los paisajes de la precordillera y el descenso hacia la costa del norte de Chile.
Alojamiento: No incluido', NULL, NULL, false) on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('cffe039d-fad5-54f2-b1f2-b31c8f55af8f', 'DAY_cffe039dfad554f2b1f2', NULL, NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('aed0a426-f92d-57cb-b4ac-d10476a74d91', 'cffe039d-fad5-54f2-b1f2-b31c8f55af8f', 'es', 'Hito Cajón › San Pedro de Atacama › Tarde libre + Tour Astronómico Llegada a Hito Cajón y traslado directo hacia San Pedro de Atacama. Tendrás tiempo libre por la tarde para descansar o recorrer el pueblo. Por la noche, disfrutarás un tour astronómico, que incluye observación guiada del cielo andino,  Guia Certificada en Inglés, las entradas correspondientes y el traslado de vuelta a su hotel. Día 2 – Full Day Piedras Rojas + Laguna Chaxa Salida en la mañana para un full day que combina los paisajes altiplánicos de Piedras Rojas y la fauna del Salar de Atacama en Laguna Chaxa. El programa incluye Transporte privado, Guia Certificada en Inglés, Entradas y Box Lunch durante el recorrido. Día 3 – Geysers del Tatio + Valle de la Luna Muy temprano visitarás los Geysers del Tatio, uno de los campos geotérmicos más altos del mundo, con desayuno básico y entradas incluidas. Por la tarde, se realiza la excursión al Valle de la Luna, donde podrás apreciar formaciones únicas y un paisaje lunar espectacular. El programa incluye Transporte privado, Guia Certificada en Inglés, Entradas durante el recorrido. Día 4 – Valle del Arcoíris + Laguna Cejar Por la mañana visitarás el Valle del Arcoíris, conocido por sus montañas de minerales que forman un paisaje multicolor. Por la tarde, el recorrido continúa hacia Laguna Cejar, famosa por su alta concentración de sal que permite flotar fácilmente. El programa incluye Transporte privado, Guia Certificada en Inglés, Entradas durante el recorrido.', 'Fin de Servicio.  Incluye Transporte en Hito Cajón  –  San Pedro A Chofer/guía en idioma Inglés Entradas a todas las experiencias mencionadas. Box lunch, desayuno básico y cóctel según programa. No incluido Alojamiento en San Pedro de Atacama. Cenas y almuerzos no mencionados. Actividades opcionales (por ejemplo, tours en bicicleta, excursiones adicionales) Gastos personales (snacks, bebidas, souvenirs) Seguro de viaje y de salud Propinas para conductores, guías y personal local Vuelos internacionales o domésticos Almuerzos/cenas no mencionados Transfer San Pedro–Calama (CJC) SKU: SPA2D-TATIO-CEJAR-LUNA
Alojamiento: No incluido', NULL, NULL, false) on conflict do nothing;
commit;

-- Auditoría de fuentes (sin precios inventados):
-- {
--   "missing_budgets": [
--     "SPAUYU-3D2N-HK",
--     "SPAUYU-3D2N-ScK",
--     "SPASPA-4D3N-ScRF",
--     "SPASPA-4D3N-FJM",
--     "SPASPA-4D3N-FJJ",
--     "SPASPA-4D3N-PPTd",
--     "SPASPA-4D3N-ÑÑF",
--     "SPASPA-4D3N-MPF",
--     "SPASPA-4D3N-ScLM",
--     "SPASPA-4D3N-ScJF",
--     "SPASPA-4D3N-ScJTd",
--     "UYUUYU-3D2N-PF",
--     "UYUUYU-3D2N-ÑF",
--     "UYUUYU-3D2N-ÑTd",
--     "UYUUYU-3D2N-CkHj",
--     "UYUSPA-3D2N-LTd",
--     "UYUSPA-3D2N-KS",
--     "UYUSPA-3D2N-LM",
--     "UYUSPA-3D2N-KDr"
--   ],
--   "missing_skus": [
--     {
--       "template": "SPAUYU-3D2N-FJ",
--       "sheet": "SPA UYU - 3D2N - FJ",
--       "item": 9,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FJ",
--       "sheet": "SPA UYU - 3D2N - FJ",
--       "item": 14,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FJ",
--       "sheet": "SPA UYU - 3D2N - FJ",
--       "item": 24,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FJ",
--       "sheet": "SPA UYU - 3D2N - FJ",
--       "item": 29,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FJ",
--       "sheet": "SPA UYU - 3D2N - FJ",
--       "item": 39,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FJ",
--       "sheet": "SPA UYU - 3D2N - FJ",
--       "item": 44,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FP",
--       "sheet": "SPA UYU - 3D2N - FP",
--       "item": 9,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FP",
--       "sheet": "SPA UYU - 3D2N - FP",
--       "item": 14,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FP",
--       "sheet": "SPA UYU - 3D2N - FP",
--       "item": 24,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FP",
--       "sheet": "SPA UYU - 3D2N - FP",
--       "item": 29,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FP",
--       "sheet": "SPA UYU - 3D2N - FP",
--       "item": 39,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FP",
--       "sheet": "SPA UYU - 3D2N - FP",
--       "item": 44,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FL",
--       "sheet": "SPA UYU - 3D2N - FL",
--       "item": 9,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FL",
--       "sheet": "SPA UYU - 3D2N - FL",
--       "item": 14,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FL",
--       "sheet": "SPA UYU - 3D2N - FL",
--       "item": 24,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FL",
--       "sheet": "SPA UYU - 3D2N - FL",
--       "item": 29,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FL",
--       "sheet": "SPA UYU - 3D2N - FL",
--       "item": 39,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-FL",
--       "sheet": "SPA UYU - 3D2N - FL",
--       "item": 44,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 7,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 20,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 25,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 33,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 34,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 39,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     },
--     {
--       "template": "SPAUYU-3D2N-MP",
--       "sheet": "SPA UYU - 3D2N - MP",
--       "item": 48,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 7,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 20,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 25,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 33,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 34,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 39,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     },
--     {
--       "template": "SPAUYU-3D2N-ML",
--       "sheet": "SPA UYU - 3D2N - ML",
--       "item": 48,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 48,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 53,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 54,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MRF",
--       "sheet": "SPA SPA 4D3N MRF",
--       "item": 60,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 34,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 47,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 54,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ÑLTd",
--       "sheet": "SPA SPA - 4D3N - ÑLTd",
--       "item": 58,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 47,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 52,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-LLTd",
--       "sheet": "SPA SPA - 4D3N - LLTd",
--       "item": 58,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 48,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 53,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLTd",
--       "sheet": "SPA SPA - 4D3N - MLTd",
--       "item": 59,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 48,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 53,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MLF",
--       "sheet": "SPA SPA - 4D3N - MLF",
--       "item": 59,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 48,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 53,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MJF",
--       "sheet": "SPA SPA - 4D3N - MJF",
--       "item": 59,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 48,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 53,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MÑF",
--       "sheet": "SPA SPA - 4D3N - MÑF",
--       "item": 59,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 16,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 25,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 30,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 34,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 43,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 44,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 49,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-ScKS",
--       "sheet": "SPA SPA - 4D3N - ScKS",
--       "item": 53,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 7,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 12,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 18,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 27,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 32,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 38,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 47,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 48,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 53,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "SPASPA-4D3N-MPTd",
--       "sheet": "SPA SPA - 4D3N - MPTd",
--       "item": 59,
--       "sku": null,
--       "description": "TRANSPORTE 4X4 HITO - HITO 4D3N"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 20,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 26,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 34,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 40,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 48,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "UYUUYU-3D2N-PTd",
--       "sheet": "UYU UYU - 3D2N - PTd",
--       "item": 49,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 20,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 26,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 34,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 40,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-LTd",
--       "sheet": "UYU UYU - 3D2N - LTd",
--       "item": 48,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 20,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 26,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 34,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 40,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-JTd",
--       "sheet": "UYU UYU - 3D2N - JTd",
--       "item": 48,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 10,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 18,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 22,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 30,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 34,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 42,
--       "sku": null,
--       "description": "INCLUIDO EN OPCIÓN ARRIBA"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 43,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUUYU-3D2N-KS",
--       "sheet": "UYU UYU - 3D2N - KS",
--       "item": 47,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 21,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 27,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 36,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 42,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-PTd",
--       "sheet": "UYU SPA - 3D2N PTd",
--       "item": 50,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 21,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 27,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 36,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 42,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-JTd",
--       "sheet": "UYU SPA - 3D2N JTd",
--       "item": 51,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 6,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 12,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 21,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 27,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 36,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 42,
--       "sku": null,
--       "description": "3D2N UYUNI – UYUNI"
--     },
--     {
--       "template": "UYUSPA-3D2N-ÑTd",
--       "sheet": "UYU SPA 3D2N - ÑTd",
--       "item": 51,
--       "sku": null,
--       "description": "INCLUIDO EN DISTRIBUCIÓN ARRIBA"
--     }
--   ],
--   "rejected_programs": [
--     {
--       "index": 6,
--       "sku": "SPAUYU-3D2N-FL",
--       "reason": "SKU inválido, duplicado o duración inconsistente"
--     },
--     {
--       "index": 24,
--       "sku": "SPASPA-4D3N-MRF",
--       "reason": "SKU inválido, duplicado o duración inconsistente"
--     },
--     {
--       "index": 28,
--       "sku": "SPAUYU-3D3N-FTL",
--       "reason": "SKU inválido, duplicado o duración inconsistente"
--     },
--     {
--       "index": 44,
--       "sku": "UYUUYU-2D1N-L",
--       "reason": "SKU inválido, duplicado o duración inconsistente"
--     },
--     {
--       "index": 45,
--       "sku": "UYUSPA-3D2N-JTd",
--       "reason": "SKU inválido, duplicado o duración inconsistente"
--     },
--     {
--       "index": 46,
--       "sku": "SPA4D/",
--       "reason": "SKU inválido, duplicado o duración inconsistente"
--     }
--   ],
--   "ambiguous_budgets": [
--     "SPA SPA - 4D3N - ÑÑF",
--     "COTIZAR____SPA SPA - 4D3N - FJJ",
--     "COTIZAR ---- UYU SPA - 2D1N P"
--   ],
--   "missing_modules": [
--     "BLOQUES SPA no está presente en la extracción; se requiere la hoja con grupos de actividades."
--   ]
-- }
