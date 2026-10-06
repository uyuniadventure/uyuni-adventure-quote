-- Generado por scripts/db/generate_blocks.py; ejecutar después de 00 y 01 y migración 003.
begin;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('8e048b4b-7857-560c-896d-60c0087b23c9', 'SPAUYU-3D2N-FJ', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'COMFORT', 'FJ', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "6 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'DAY_beb42e7a8f685ad2a3b0', 'SPA', NULL, 'bd24d50a-2061-5524-99ef-fe971856685d', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('66751ca1-9668-5375-a037-44fb1a2bc107', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4a1a3370-94c6-5bb6-a73b-ab0b2e892eaf', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('83eda363-660a-562f-8254-59bc26f0e84d', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '6e3ce078-9f35-55ed-9a2c-7992872ba017', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2049bead-4071-5d17-ad6a-f8adb8b7597b', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('88a21244-ef79-5d87-a3dd-8ae0b668b5a5', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('622c853f-5206-5339-b093-1ca67e027ba3', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e24eedd0-d77b-5814-bfe8-0dbe2edec819', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f3287b4c-1eef-50a9-a83c-d4315a52135a', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4c9bba21-a245-5701-8b04-deb23f119e59', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'f8bd6097-3080-58dc-ab0c-b58edf37f250', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f63f2076-b166-5d7d-9d61-1608f0002807', 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a88b8a56-8fb4-579e-a000-e4b3a363c240', '8e048b4b-7857-560c-896d-60c0087b23c9', 1, 'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9adba802-6eed-565c-a298-385c9a868ab8', 'DAY_9adba8026eed565ca298', NULL, NULL, '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d83bf2a1-e19c-54c8-b666-16c97d5ac125', '9adba802-6eed-565c-a298-385c9a868ab8', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Después del desayuno, salida desde la zona de Laguna Hedionda con una parada en el mirador del Volcán Ollagüe, uno de los volcanes más emblemáticos del altiplano andino. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi (3.660 msnm), una formación rocosa que emerge en medio del salar, famosa por sus cactus gigantes y formaciones de coral fosilizado.
Alojamiento: Hotel Jardines de Uyuni', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('17fee0c8-e1ae-5f6a-9ff1-fe83d4b5b856', '9adba802-6eed-565c-a298-385c9a868ab8', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '6e3ce078-9f35-55ed-9a2c-7992872ba017', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('66f19012-289b-5046-ba3f-319f31a65685', '9adba802-6eed-565c-a298-385c9a868ab8', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aacdc562-5af9-549b-bb4d-ea86f26c7854', '9adba802-6eed-565c-a298-385c9a868ab8', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2f2f3cea-9a68-520c-91fc-4d23331cdfa6', '9adba802-6eed-565c-a298-385c9a868ab8', 'ecd656cd-9c28-55e2-b248-36bc8f5901ab', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('93873a61-ddf4-540c-84d9-04d6ef116e42', '9adba802-6eed-565c-a298-385c9a868ab8', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('889a6af8-2905-5683-b724-6bc8911f148f', '9adba802-6eed-565c-a298-385c9a868ab8', '113ed8f7-8532-5bcf-85ff-c51e2c0cf91e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5d50b9d6-1a0d-5103-91c0-447b0b71df2d', '9adba802-6eed-565c-a298-385c9a868ab8', 'c42e75f2-488a-52ed-863d-a740cc5d78cf', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('3d34fb36-2c0f-545d-b268-55a8b46ef488', '8e048b4b-7857-560c-896d-60c0087b23c9', 2, '9adba802-6eed-565c-a298-385c9a868ab8') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('cb43e35c-21e1-575a-9247-6f9429a9415b', 'DAY_cb43e35c21e1575a9247', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bae4e093-8cab-50a4-971c-c5d3888dced5', 'cb43e35c-21e1-575a-9247-6f9429a9415b', 'es', 'Exploración del Salar de Uyuni', 'La jornada comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Luego continuarán hacia Colchani, donde conocerán el proceso artesanal de extracción y refinamiento de la sal. Ingreso al majestuoso Salar de Uyuni para visitar los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional apthapi en medio del salar, tiempo para fotografías y contemplación de este extraordinario paisaje natural. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d0194106-7370-59aa-b8cb-7a10a9952fcd', 'cb43e35c-21e1-575a-9247-6f9429a9415b', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '6e3ce078-9f35-55ed-9a2c-7992872ba017', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5ab895fd-83e5-52a2-86f7-c6c47bdf4a61', 'cb43e35c-21e1-575a-9247-6f9429a9415b', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e3002aed-dc39-503b-b191-512f7b42a5bc', '8e048b4b-7857-560c-896d-60c0087b23c9', 3, 'cb43e35c-21e1-575a-9247-6f9429a9415b') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('b4bc1d22-229c-5f15-9e16-7a12686ff003', 'SPAUYU-3D2N-HK', 'ITINERARIO DETALLADO SAN PEDRO DE ATACAMA → SALAR DE  UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'HK', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('8f7ce417-2d5e-53b8-a673-c60c6561481f', 'DAY_8f7ce4172d5e53b8a673', 'SPA', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a505561d-ff36-5628-8c3f-6eb6a8ac8467', '8f7ce417-2d5e-53b8-a673-c60c6561481f', 'es', 'Lagunas Altiplánicas y Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón (4.480–4.550 msnm), donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la Laguna Blanca (4.350 msnm) y la Laguna Verde, (4.350 msnm) siguiendo la visita el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la espectacular Laguna Colorada.
Alojamiento: Hostal en Huayajara', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama
.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('dca19783-24b2-5c71-b5f3-b067457aad26', 'b4bc1d22-229c-5f15-9e16-7a12686ff003', 1, '8f7ce417-2d5e-53b8-a673-c60c6561481f') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('2fd16069-0672-51db-ab1e-c44072d953db', 'DAY_2fd16069067251dbab1e', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a151c37f-6b40-5b12-ad22-4dcea6ef31ca', '2fd16069-0672-51db-ab1e-c44072d953db', 'es', 'Salar de Uyuni y Atardecer en el Desierto de Sal', 'La ruta continúa a través del vasto Desierto de Siloli y las hermosas lagunas Honda y Hedionda, hábitat natural de flamencos andinos, rodeados de impresionantes paisajes volcánicos. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Kachi (Uyuni)', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama
.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('869c146b-42a9-5d06-8bd4-8fd9fd7f1fd7', 'b4bc1d22-229c-5f15-9e16-7a12686ff003', 2, '2fd16069-0672-51db-ab1e-c44072d953db') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c2d54ab9-0e4a-55a0-96c8-36746c8d4ce8', 'DAY_c2d54ab90e4a55a096c8', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('982062fb-4524-5de6-8671-6b4dfc8483f6', 'c2d54ab9-0e4a-55a0-96c8-36746c8d4ce8', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo estilo Apthapi en medio del salar y explora diferentes perspectivas de este extraordinario paisaje natural. Durante la tarde, continuarás descubriendo el desierto de sal, con tiempo para fotografías y para apreciar este infinito horizonte blanco.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama
.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6818e032-2745-5ecc-b290-b388c1fa7688', 'b4bc1d22-229c-5f15-9e16-7a12686ff003', 3, 'c2d54ab9-0e4a-55a0-96c8-36746c8d4ce8') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('e8a098a4-b630-51aa-8b1c-f4b28ac40045', 'SPAUYU-3D2N-FP', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'FP', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "6 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'DAY_47853b0c9fa85937bef1', 'SPA', NULL, 'bd24d50a-2061-5524-99ef-fe971856685d', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('940c188b-2cdf-5bb4-a087-3b403b3a8e9a', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ebda41c7-2171-50bd-9171-82adfd0320f2', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5eac62f4-e9e8-591b-9127-2341d37451bd', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '8a63b1cc-3aeb-5ca1-a7f2-096e5a0f91ae', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('04c9abcd-ad9c-5cfc-a13a-a35afc945d52', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e42ad182-7dd4-564a-b475-c93ee23c05e2', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ca55bca7-afe3-5510-9432-ed6cb534461d', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('561d5dba-475a-535a-99b4-a8154818a23a', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1aac6a73-261f-5e2c-98ae-cd6e1552049e', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c00484c5-1803-5b2b-b96f-1fef8e335d77', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'f8bd6097-3080-58dc-ab0c-b58edf37f250', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('834cddf2-7145-522e-8a14-12b7eb093eeb', '47853b0c-9fa8-5937-bef1-9171fd3d21ad', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('77854416-7bf8-5870-b3e3-c9091be6db53', 'e8a098a4-b630-51aa-8b1c-f4b28ac40045', 1, '47853b0c-9fa8-5937-bef1-9171fd3d21ad') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('53d512c8-cfb4-537c-ad95-4d616e9a6883', 'DAY_53d512c8cfb4537cad95', NULL, NULL, '6695d424-92d7-5de0-91d4-b950ad466be1', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d010447f-303b-5e8a-bce8-060d91a76818', '53d512c8-cfb4-537c-ad95-4d616e9a6883', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Palacio de Sal', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('00cf9f80-d0e6-52ba-a003-a1590feae30d', '53d512c8-cfb4-537c-ad95-4d616e9a6883', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '8a63b1cc-3aeb-5ca1-a7f2-096e5a0f91ae', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('29c9454b-cb47-50d6-a246-2b8469d1914b', '53d512c8-cfb4-537c-ad95-4d616e9a6883', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5ade015d-b65e-54cc-8d88-818a618b93ca', '53d512c8-cfb4-537c-ad95-4d616e9a6883', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ccfa2134-dbe5-5bcd-983a-907f979b88dd', '53d512c8-cfb4-537c-ad95-4d616e9a6883', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('eb44e4ac-456a-5844-acee-cea506ae2c8c', '53d512c8-cfb4-537c-ad95-4d616e9a6883', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a4afa60e-d7c3-5978-a1f8-cf9b89bed571', 'e8a098a4-b630-51aa-8b1c-f4b28ac40045', 2, '53d512c8-cfb4-537c-ad95-4d616e9a6883') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a4aedbe7-0848-51de-98ab-d0f116b1b6e6', 'DAY_a4aedbe7084851de98ab', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b1688195-c5b8-514f-8a77-fdc99d8535d2', 'a4aedbe7-0848-51de-98ab-d0f116b1b6e6', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0f391a7b-3072-5eb6-8a82-98f620036cbc', 'a4aedbe7-0848-51de-98ab-d0f116b1b6e6', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '8a63b1cc-3aeb-5ca1-a7f2-096e5a0f91ae', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ce6dd50d-9756-533e-8727-4f6862d40f8e', 'a4aedbe7-0848-51de-98ab-d0f116b1b6e6', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1bb19e17-dc02-5359-b73e-f5679d2abba7', 'e8a098a4-b630-51aa-8b1c-f4b28ac40045', 3, 'a4aedbe7-0848-51de-98ab-d0f116b1b6e6') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('bef32a75-cc11-5c89-9b99-ef373754da67', 'SPAUYU-3D2N-FL', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'FL', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "6 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f9ccb4ca-0c68-5706-ba45-071570400573', 'DAY_f9ccb4ca0c685706ba45', 'SPA', NULL, 'bd24d50a-2061-5524-99ef-fe971856685d', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9704ae53-403e-5b6f-9559-162a1c130d1b', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('925fd9dc-dfbf-533b-9bf1-fe885aa525cf', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1f70d796-b1bb-5360-8308-4cc40583fe36', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '1c2a9f76-ad47-5780-a583-a9f4593be3b3', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0e9e3374-6e90-5334-a09a-470ee27e99fc', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('24ea640b-5951-5ad2-bf21-410dc77458d3', 'f9ccb4ca-0c68-5706-ba45-071570400573', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('43b27a3b-3962-5080-b834-668fec1b1221', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9df52dc1-348c-5161-9870-122325cc9a2d', 'f9ccb4ca-0c68-5706-ba45-071570400573', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6eabf4f8-558c-5c7e-9c8e-dec71e3cb258', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('61eacf39-9c12-566e-ad6c-b52ee2898bed', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'f8bd6097-3080-58dc-ab0c-b58edf37f250', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f33b5857-ecfa-5b66-b3fe-a5c0fb523e2c', 'f9ccb4ca-0c68-5706-ba45-071570400573', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7d503655-9ddf-54ef-9ea8-f002472ae756', 'bef32a75-cc11-5c89-9b99-ef373754da67', 1, 'f9ccb4ca-0c68-5706-ba45-071570400573') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'DAY_04f04fa4252e59769f58', NULL, NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('22d17fdc-a65b-5f16-af2f-b4c07972424a', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'es', 'Lagunas Cañapa y Hedionda · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Luna Salada', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aab4390f-f930-5f31-9802-5fb7e5c5ea1d', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '1c2a9f76-ad47-5780-a583-a9f4593be3b3', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e4ee61a3-5b80-5d9b-b35e-105b0f3410dc', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('86292cf3-3332-59ec-8b71-3a1463f5a0d2', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c0707b1d-0a98-5c26-8875-8031814821fd', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a0567277-2388-5d50-bdf7-d774e665441e', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f4e3eb69-b129-53f9-b5ce-ed4ea7f4bd29', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c0c0cf3d-3cac-5b79-851c-d985b149842b', '04f04fa4-252e-5976-9f58-f5bc6bec5c41', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('71d643bd-49e6-5d74-a0eb-1d8343fd7580', 'bef32a75-cc11-5c89-9b99-ef373754da67', 2, '04f04fa4-252e-5976-9f58-f5bc6bec5c41') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('64f11bdf-8db8-5264-b6f4-27e135d14d37', 'DAY_64f11bdf8db85264b6f4', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('892a6d71-549f-5e78-8428-16a4aeb39739', '64f11bdf-8db8-5264-b6f4-27e135d14d37', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('90199119-7a52-5784-9cf0-8d20663d012e', '64f11bdf-8db8-5264-b6f4-27e135d14d37', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '1c2a9f76-ad47-5780-a583-a9f4593be3b3', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3ccefcad-c09f-5f44-9bc2-75097f6f569a', '64f11bdf-8db8-5264-b6f4-27e135d14d37', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6dee1939-7369-574c-be6e-2327921c5562', 'bef32a75-cc11-5c89-9b99-ef373754da67', 3, '64f11bdf-8db8-5264-b6f4-27e135d14d37') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c56f1951-5c6d-532b-9af7-ca0b742985e9', 'SPAUYU-3D2N-MP', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'MP', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('68de8bf1-283e-58cd-ad16-79d7f83d7a9d', 'DAY_68de8bf1283e58cdad16', 'SPA', NULL, 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8c0a0be0-797e-5606-871b-ca3b8366296b', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la impresionante Laguna Blanca y Laguna Verde, el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la impactante Laguna Colorada. Terminamos en Hotel antes del atardecer.
Alojamiento: Hotel Mallku Cueva', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aa880f45-0926-5511-843b-7d05ef77eaaf', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'd6231b75-3c60-52d9-8495-829bcc0b0d39', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1661ea46-bab2-57f9-b96c-0d4c44a26abd', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('913a667d-4aea-51c5-9589-bb6efe0a382e', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a01b8a8a-6dfd-5737-a577-7a82dadcb451', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5df90ce3-eb7d-5791-8d8f-8f21f6f06d3d', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4a4c9f49-eed9-57a0-94d6-c6f671579774', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('caff96fa-f985-5542-bf37-e32910b569f3', '68de8bf1-283e-58cd-ad16-79d7f83d7a9d', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('857a75e1-c462-54b3-a34f-044bcf6927b1', 'c56f1951-5c6d-532b-9af7-ca0b742985e9', 1, '68de8bf1-283e-58cd-ad16-79d7f83d7a9d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('bb5dc4af-629e-5a26-b272-caaccb2c055f', 'DAY_bb5dc4af629e5a26b272', NULL, NULL, '6695d424-92d7-5de0-91d4-b950ad466be1', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8716539f-fb38-548e-94a9-1c8080796727', 'bb5dc4af-629e-5a26-b272-caaccb2c055f', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Palacio de Sal', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('23620c2d-ef3f-5e68-a5c8-d9151cd1acaf', 'bb5dc4af-629e-5a26-b272-caaccb2c055f', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'd6231b75-3c60-52d9-8495-829bcc0b0d39', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2b1549c4-cb93-5de8-9c42-43b71025e56a', 'bb5dc4af-629e-5a26-b272-caaccb2c055f', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('82733b3b-33a7-5dea-801c-a14a42058c96', 'bb5dc4af-629e-5a26-b272-caaccb2c055f', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('58fda9b0-e03e-5f11-ace0-639129fef2c5', 'bb5dc4af-629e-5a26-b272-caaccb2c055f', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ad67d120-fdec-55ae-ab83-e2cbec64a643', 'bb5dc4af-629e-5a26-b272-caaccb2c055f', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5c9fecb3-49e8-572a-bdd8-f05853fb2707', 'c56f1951-5c6d-532b-9af7-ca0b742985e9', 2, 'bb5dc4af-629e-5a26-b272-caaccb2c055f') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('18b7de10-ce92-5366-9a73-c175510a7d05', 'DAY_18b7de10ce9253669a73', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('c239a661-a4c0-5f99-8dd5-865db2f45c58', '18b7de10-ce92-5366-9a73-c175510a7d05', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('01579f15-baf2-52f6-b7fc-7340b0d78930', '18b7de10-ce92-5366-9a73-c175510a7d05', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e41c0467-7da9-5cd9-87c0-0d715c2af81e', '18b7de10-ce92-5366-9a73-c175510a7d05', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'd6231b75-3c60-52d9-8495-829bcc0b0d39', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('feb1bfa1-c192-5907-baf1-82013ca7f8a4', '18b7de10-ce92-5366-9a73-c175510a7d05', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3eefe5c7-f2a9-554e-b1ba-bca42f15a985', '18b7de10-ce92-5366-9a73-c175510a7d05', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e7a6c7d5-0a2b-5e0d-903a-8b669dcc2b34', 'c56f1951-5c6d-532b-9af7-ca0b742985e9', 3, '18b7de10-ce92-5366-9a73-c175510a7d05') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('6c556df1-4f97-5415-8304-ccd6d7d949ad', 'SPAUYU-3D2N-ML', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'ML', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'DAY_93d0b7a1ead057e1b89f', 'SPA', NULL, 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('77dbf8e3-47e0-5f82-9777-f8ec8e8ca9ef', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la impresionante Laguna Blanca y Laguna Verde, el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la impactante Laguna Colorada. Terminamos en Hotel antes del Atardecer.
Alojamiento: Hotel Mallku Cueva', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5fb7e9be-ccca-5086-bae5-3001b5b7fb1a', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '67749c25-d652-5f01-885a-cb2e56a8eff4', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('042b0b18-66b7-5a75-856b-61139c108cfd', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('80b3115c-4151-5297-9fed-633e13c4dba1', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2b0994f8-5222-5d5c-a127-3dacc20ab346', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8d15687f-1744-504e-85a5-0b47f827fd2a', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('97d35452-ba9c-5aed-9fe2-8f880150b92a', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0d972699-8d4d-5f94-8b61-736df220a05e', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('391f33b1-24f9-52c8-9940-c821bd59f3c5', '93d0b7a1-ead0-57e1-b89f-2643c1bacae1', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6cdbb956-1688-548b-948e-f42229e9753a', '6c556df1-4f97-5415-8304-ccd6d7d949ad', 1, '93d0b7a1-ead0-57e1-b89f-2643c1bacae1') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'DAY_f1716cc73ac750e98856', NULL, NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('2d6d19e3-6938-560b-9a58-ad6699c2b4c2', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fosilizado. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: Hotel Luna Salada', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b08f297e-6c4d-52bf-b6ea-1615c681e8d8', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '67749c25-d652-5f01-885a-cb2e56a8eff4', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0380bd4e-f141-5055-8844-046d8b5683cd', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7ed24ee2-a119-5380-9c9c-b620b69db09d', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0751d210-7877-5144-8712-70341da71c5e', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2f205f66-63db-5eea-9313-228f61375a20', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('776002d6-f404-50b4-b66a-362e052d1fcc', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cb23406e-2981-5a92-911d-a51e21bed69c', 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('521253c1-253b-5c66-83be-4aa0435c016f', '6c556df1-4f97-5415-8304-ccd6d7d949ad', 2, 'f1716cc7-3ac7-50e9-8856-07eb0a7913d0') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7526f99b-4807-50f9-bf4d-23e18ec68981', 'DAY_7526f99b480750f9bf4d', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('feb538b5-332f-5a5c-96ec-89f6b1e33c88', '7526f99b-4807-50f9-bf4d-23e18ec68981', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('33966ad1-8ae7-5405-805d-565b5ab586c5', '7526f99b-4807-50f9-bf4d-23e18ec68981', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1c716140-e80b-56ff-97e4-8e866c3278ed', '7526f99b-4807-50f9-bf4d-23e18ec68981', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '67749c25-d652-5f01-885a-cb2e56a8eff4', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0e74ee8d-a5e2-541c-b3e9-609b403957fb', '7526f99b-4807-50f9-bf4d-23e18ec68981', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5722310d-7d44-5a7c-8845-dac0a96e7dde', '7526f99b-4807-50f9-bf4d-23e18ec68981', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('528cedc2-828f-5f76-952c-156cd1abf5af', '6c556df1-4f97-5415-8304-ccd6d7d949ad', 3, '7526f99b-4807-50f9-bf4d-23e18ec68981') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('18ca2699-00d3-5406-a14e-9ee82ebe69f6', 'SPAUYU-3D2N-ScK', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'ScK', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('79cff890-230a-527a-b76c-0638abba00a1', 'DAY_79cff890230a527ab76c', 'SPA', NULL, '9fcea26f-f535-501a-9508-669b2826c68a', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('dbe47814-782f-5966-9d18-c04c80959619', '79cff890-230a-527a-b76c-0638abba00a1', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la impresionante Laguna Blanca y Laguna Verde, el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la impactante Laguna Colorada. Terminamos en Hotel antes del Atardecer.
Alojamiento: Hotel San Cristóbal', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0778a5b7-36f9-5ae4-9ebe-bb1b7a7b8dbe', '79cff890-230a-527a-b76c-0638abba00a1', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '9e390f31-ccaf-503d-bbb9-20fccf88e652', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b2b1f9f1-a784-5921-87aa-1ea733bd5e07', '79cff890-230a-527a-b76c-0638abba00a1', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('87fed66d-bc2f-57f9-b5f5-a353b651b543', '79cff890-230a-527a-b76c-0638abba00a1', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('be2ed535-1153-5e02-a5b5-251300158e92', '79cff890-230a-527a-b76c-0638abba00a1', '0b84e71e-13ab-5899-971e-af8e1581ea62', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b675f6d1-1e16-5e4f-bc5c-b189c54d78b5', '79cff890-230a-527a-b76c-0638abba00a1', '9fcea26f-f535-501a-9508-669b2826c68a', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4888db16-34aa-53a8-98ab-ac2aaf3a4dcf', '79cff890-230a-527a-b76c-0638abba00a1', 'c6094766-4e08-5a6e-a1cf-43e8aad3b74a', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f1889e77-1c23-5b3a-9335-50d0c7ffed5b', '79cff890-230a-527a-b76c-0638abba00a1', '1323c441-0576-5d5a-9509-eed71b68fd11', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e4fa6099-50db-592c-8ff5-84ae11373fb4', '79cff890-230a-527a-b76c-0638abba00a1', '97e9f3e5-3e6a-5515-af04-118eafd8511f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('fdf752e4-06f1-5044-80a8-62397beb7eec', '18ca2699-00d3-5406-a14e-9ee82ebe69f6', 1, '79cff890-230a-527a-b76c-0638abba00a1') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'DAY_4b3e587d2b3850ad9db2', NULL, NULL, 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bd8bcad2-9330-52f1-b6d1-5395887cb711', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fosilizado. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: Hotel Kachi', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d76518ab-3edf-5aa1-a358-39cb6aabf257', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '9e390f31-ccaf-503d-bbb9-20fccf88e652', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cf9f9752-2f5a-575a-9ecd-9c35bcd253ef', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('abc9ef59-838a-53e1-8b97-e8924ceb4391', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'a9f5afb8-374d-5c0c-8413-99aaae578359', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('51f26dcb-26f7-592e-b0d6-6a405610f549', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('37d91ecd-20e8-5351-8970-2c69ce519b03', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e6f0b27f-1ea4-51ab-ba53-c1d776946a36', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', '3f93d6d1-5344-5390-aade-fe9b9be74129', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('64300928-c0b3-5651-a596-7a9a5437d19e', '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc', '7542eeab-7698-5514-b7bc-d3ac470b03f4', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d8584dc3-5da0-5bd6-8476-d23b3a1f97dc', '18ca2699-00d3-5406-a14e-9ee82ebe69f6', 2, '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('deec7979-4b12-56ea-8b12-e70017e2bf53', 'DAY_deec79794b1256ea8b12', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0f142710-3e8f-5616-a1f4-4f23af4672f2', 'deec7979-4b12-56ea-8b12-e70017e2bf53', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('79c2200d-199d-5e9f-bb61-073ae0ed0b29', 'deec7979-4b12-56ea-8b12-e70017e2bf53', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5b582ad7-cf8d-57c3-9b06-e3f2a2ceadb9', 'deec7979-4b12-56ea-8b12-e70017e2bf53', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '9e390f31-ccaf-503d-bbb9-20fccf88e652', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5f2eb6a0-0cb3-5730-8c5b-55604d0c0e65', 'deec7979-4b12-56ea-8b12-e70017e2bf53', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dd508c09-b9dd-5ca9-ab7d-ffe386040399', 'deec7979-4b12-56ea-8b12-e70017e2bf53', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7e3a80b3-f7f2-58e6-811f-b6ecffe40c84', '18ca2699-00d3-5406-a14e-9ee82ebe69f6', 3, 'deec7979-4b12-56ea-8b12-e70017e2bf53') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('2eaf385e-d58c-5a23-9b3c-ad3089529692', 'SPASPA-4D3N-MRF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI - SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MRF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "11 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', 'DAY_10b7525f0ebc5d458f3b', 'SPA', NULL, 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('69384537-f52e-507b-aa36-9660559f3801', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarás un vehículo 4x4 para comenzar esta aventura por los espectaculares paisajes del altiplano boliviano. El recorrido inicia temprano con la visita a los géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la intensa actividad geotérmica crea fumarolas y pozas de barro hirviendo. Durante el día visitarás la Laguna Blanca, la Laguna Verde y el surrealista Desierto de Dalí. Luego continuarás hacia la impresionante Laguna Colorada, para finalmente seguir rumbo a Villamar ubicado a unos 3.900 a 4.000 metros sobre el nivel del mar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f9a67421-65dd-5ab1-93fb-cf2a6faee249', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c757c70d-cf7c-5db8-8387-d41f7fe27680', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('75ea2585-10ec-562c-b425-1f1d3e870888', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1dc1a2a5-ddeb-5e6e-b2fe-88061a26a90f', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('06a4f9f9-57fe-545a-85d8-20b913d6a971', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('747033bd-ec4c-5760-af0c-fbbd87507449', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('098c7de3-9196-5e19-85e8-6574e39852c7', '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1a09dd62-b100-5956-a390-380eea03ec25', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 1, '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c2beb95f-90aa-5639-a442-86868eefe7a3', 'DAY_c2beb95f90aa5639a442', NULL, NULL, '4e99889a-d935-5eba-aa11-a5150d760bb9', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('e4770339-b385-50aa-af79-6f9f1083af80', 'c2beb95f-90aa-5639-a442-86868eefe7a3', 'es', 'Valle de las Rocas · Cañón Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural. El día finaliza en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cócteles al atardecer, rodeado por el horizonte blanco e interminable del desierto de sal.
Alojamiento: Hotel Rosario de Uyuni', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8e2a93b8-0200-5fe0-aada-9a9b65d8d47a', 'c2beb95f-90aa-5639-a442-86868eefe7a3', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('94b0bbc4-52f6-5369-a868-dd5f9c7680a8', 'c2beb95f-90aa-5639-a442-86868eefe7a3', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('57b866d8-18b6-5f0a-adcf-5b2e25c52bd9', 'c2beb95f-90aa-5639-a442-86868eefe7a3', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5e3548a5-959b-5df2-a278-0bffbdd67859', 'c2beb95f-90aa-5639-a442-86868eefe7a3', 'd9d04ee8-9f48-5c27-84fb-f90e72781e39', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('67bb8ab2-65f8-5a60-a5b9-6cf83f22d2a1', 'c2beb95f-90aa-5639-a442-86868eefe7a3', '4e99889a-d935-5eba-aa11-a5150d760bb9', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('579c74c3-c3e6-5786-9ee7-61a2e7dadd30', 'c2beb95f-90aa-5639-a442-86868eefe7a3', '37c1b2b5-2015-50f7-87fd-f5a21b94ab98', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('069987be-9907-5809-9d72-6fbd10a0f60b', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 2, 'c2beb95f-90aa-5639-a442-86868eefe7a3') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f12a577f-17db-5ad1-b36b-15b48cff33b6', 'DAY_f12a577f17db5ad1b36b', NULL, NULL, 'bd24d50a-2061-5524-99ef-fe971856685d', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('c0818778-e17c-5e21-9083-38b774d8314c', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', 'es', 'Salar de Uyuni · Cóctel al atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio de los salares y más tarde explora la famosa Isla Incahuasi, hogar de gigantescos cactus y formaciones de coral fosilizado. Almuerzo Apthapi en el Salar. Luego continuaremos hacia las impresionantes Lagunas Altiplánicas Cañapa, Ramaditas, Honda y Hedionda, hábitat natural de cientos de flamencos dentro de un paisaje andino extraordinario. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes coloridos y vastas llanuras de gran altitud.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a25bc76c-dd84-55f1-8877-f57335768c1c', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0555bb8b-b830-530c-b01d-c79b30a1fd25', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2138406a-8d68-5de6-acf7-3ee2e5542b90', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('791c5f34-5de3-5f65-b833-71705aaaf597', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7911935d-c058-5b54-98f6-f1a82c765ab1', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8cd45064-596d-5c9d-9fa2-dcab8c8bb08b', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', '92d2369c-4c49-5ed1-a6b8-e8f164e175e6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('62591471-9836-5052-829c-c57b3750724c', 'f12a577f-17db-5ad1-b36b-15b48cff33b6', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('bdaa5c62-b0ea-5aa7-9012-262c15ece4f5', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 3, 'f12a577f-17db-5ad1-b36b-15b48cff33b6') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('76007f60-7e01-5e2d-bf18-b0cf9fe57a99', 'DAY_76007f607e015e2dbf18', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5bf5023a-0f4b-5528-b51b-c6da13179ba6', '76007f60-7e01-5e2d-bf18-b0cf9fe57a99', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', NULL, '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('30b8a2b7-9a1b-5206-9c6f-bd1b4c9a92e2', '76007f60-7e01-5e2d-bf18-b0cf9fe57a99', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0642ff06-cf9f-54ab-bc84-3f3d563271b2', '76007f60-7e01-5e2d-bf18-b0cf9fe57a99', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f29874cf-5d87-5d06-9c68-44b39fc35012', '76007f60-7e01-5e2d-bf18-b0cf9fe57a99', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d428eb3c-d4e4-5cb3-849d-3e36f5a71530', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 4, '76007f60-7e01-5e2d-bf18-b0cf9fe57a99') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 'SPASPA-4D3N-ScRF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI - SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScRF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d81f178f-57e1-5c5d-8356-3356c6128c66', 'DAY_d81f178f57e15c5d8356', 'SPA', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f96bb8a6-5888-58b0-8efa-fd9324dc90a5', 'd81f178f-57e1-5c5d-8356-3356c6128c66', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarás un vehículo 4x4 para comenzar esta aventura por los espectaculares paisajes del altiplano boliviano. El recorrido inicia temprano con la visita a los géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la intensa actividad geotérmica crea fumarolas y pozas de barro hirviendo. Durante el día visitarás la Laguna Blanca, la Laguna Verde y el surrealista Desierto de Dalí. Luego continuarás hacia la impresionante Laguna Colorada, para finalmente seguir rumbo a San Cristobal ubicado a unos 3.800 metros sobre el nivel del mar.
Alojamiento: Hotel San Cristobal', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('b4fd6931-1c46-57f1-a701-2b9ada2489c4', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 1, 'd81f178f-57e1-5c5d-8356-3356c6128c66') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('14f80090-ea15-5a3a-8bb2-062c8406775c', 'DAY_14f80090ea155a3a8bb2', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('003b08ae-dbf4-514b-bdd1-019fc6ed3444', '14f80090-ea15-5a3a-8bb2-062c8406775c', 'es', 'Valle de las Rocas · Cañón Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural. El día finaliza en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cócteles al atardecer, rodeado por el horizonte blanco e interminable del desierto de sal.
Alojamiento: Hotel Rosario de Uyuni', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d5ae098e-a2cf-5c67-bb25-a43715032e06', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 2, '14f80090-ea15-5a3a-8bb2-062c8406775c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('16a85a1c-5f61-5c0a-98d5-918a29bab8dc', 'DAY_16a85a1c5f615c0a98d5', NULL, NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('cade5e5e-85b0-5767-8086-ed9ebdd62efd', '16a85a1c-5f61-5c0a-98d5-918a29bab8dc', 'es', 'Salar de Uyuni · Cóctel al atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio de los salares y más tarde explora la famosa Isla Incahuasi, hogar de gigantescos cactus y formaciones de coral fosilizado. Almuerzo Apthapi en el Salar. Luego continuaremos hacia las impresionantes Lagunas Altiplánicas Cañapa, Ramaditas, Honda y Hedionda, hábitat natural de cientos de flamencos dentro de un paisaje andino extraordinario. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes coloridos y vastas llanuras de gran altitud.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7e3eaf74-7e44-5c70-8006-1dfc7cfa7e13', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 3, '16a85a1c-5f61-5c0a-98d5-918a29bab8dc') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ad22fea7-b511-520d-83b0-c5f95113631a', 'DAY_ad22fea7b511520d83b0', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bb8808b5-5c07-5428-aa47-dbd5e790b854', 'ad22fea7-b511-520d-83b0-c5f95113631a', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', NULL, '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e7ce26d1-3907-5e02-bc99-033d5eb2485d', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 4, 'ad22fea7-b511-520d-83b0-c5f95113631a') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('44f067c9-d3a2-59ee-b4f8-70708a54ed66', 'SPASPA-4D3N-FJM', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'FJM', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('323d1f1e-04fb-5e91-9a5a-a3c8dd7738a0', 'DAY_323d1f1e04fb5e919a5a', 'SPA', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('20b28f1a-0e4c-5e10-bd5d-467d3a5f1d9f', '323d1f1e-04fb-5e91-9a5a-a3c8dd7738a0', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('466976c3-1407-5cbe-814e-58502e2a8d96', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 1, '323d1f1e-04fb-5e91-9a5a-a3c8dd7738a0') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('1c878d91-b983-57c6-9b33-64a0bfaab4ed', 'DAY_1c878d91b98357c69b33', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d549cc5f-03d3-55e3-a5e4-b5ac4041ac74', '1c878d91-b983-57c6-9b33-64a0bfaab4ed', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.  El almuerzo será servido en medio del salar, Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fosilizado. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: Hotel Jardines de Uyuni (Pueblo de Uyuni)', 'Desayuno · Almuerzo', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6d24a5f1-e4ae-527d-88b6-7aa31350c017', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 2, '1c878d91-b983-57c6-9b33-64a0bfaab4ed') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('6537e466-f147-5d31-b729-5b2673234599', 'DAY_6537e466f1475d31b729', NULL, NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8e149854-f8f3-5114-9f58-8b2d244a3511', '6537e466-f147-5d31-b729-5b2673234599', 'es', 'Salar de Uyuni  · Valle de las Rocas · Cañón Anaconda', 'Después del desayuno, Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito. Tarde libre para fotografía y contemplación de este extraordinario paisaje natural. Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('51fe2d0a-d478-52aa-bb0b-9429b2e8c17d', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 3, '6537e466-f147-5d31-b729-5b2673234599') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('bc46d308-583f-538b-a631-7a3b9697182b', 'DAY_bc46d308583f538ba631', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('be6934c0-8730-5f40-a85c-0fd2258a1dc2', 'bc46d308-583f-538b-a631-7a3b9697182b', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', 'Comidas o bebestible no mencionadas', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a833c304-8fbb-525f-89a9-f60fa6c9942d', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 4, 'bc46d308-583f-538b-a631-7a3b9697182b') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 'SPASPA-4D3N-FJJ', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'FJJ', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('533e09f2-7c9e-56c9-9f1f-8f70f6feccfc', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 1, '323d1f1e-04fb-5e91-9a5a-a3c8dd7738a0') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0c323d8e-5556-5cef-bb55-49cf347fbb5b', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 2, '1c878d91-b983-57c6-9b33-64a0bfaab4ed') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('dce13276-f016-584b-9bf0-c0ab1c28dcbe', 'DAY_dce13276f016584b9bf0', NULL, NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('96d57dd5-d0e9-5494-ac9a-82951840dc2f', 'dce13276-f016-584b-9bf0-c0ab1c28dcbe', 'es', 'Salar de Uyuni  · Valle de las Rocas · Cañón Anaconda', 'Después del desayuno, Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito. Tarde libre para fotografía y contemplación de este extraordinario paisaje natural.
Alojamiento: Hotel Jardines de Uyuni (Pueblo de Uyuni)', 'Desayuno · Almuerzo · Cena', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('3a43180a-29a4-5741-bd22-a8afeaf2d7a9', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 3, 'dce13276-f016-584b-9bf0-c0ab1c28dcbe') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('95878356-6247-5cac-b8a5-bdcb405c7373', 'DAY_9587835662475cacb8a5', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b218921f-1092-56e0-b9fe-12e511770e5a', '95878356-6247-5cac-b8a5-bdcb405c7373', 'es', 'Hito Cajón · San Pedro de Atacama', 'Salida temprana en la mañana, hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural. Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', 'Comidas o bebestible no mencionadas', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('dbb41833-bed8-58d1-a69a-944b424f3e50', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 4, '95878356-6247-5cac-b8a5-bdcb405c7373') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('78c82f20-4e2e-550b-b407-03adee23fa74', 'SPASPA-4D3N-ÑLTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ÑLTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f1dac0ee-4043-5762-bbcb-95a75a048842', 'DAY_f1dac0ee40435762bbcb', 'SPA', NULL, '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('1f51a0f1-da5a-546f-8079-a3f411cb46ef', 'f1dac0ee-4043-5762-bbcb-95a75a048842', 'es', '(Bolivia) –  Hito Cajón · Lagunas Altiplánicas · Villamar', 'Salida temprano desde San Pedro de Atacama rumbo a la frontera Hito Cajón para ingresar al altiplano boliviano. Desde los primeros kilómetros, el paisaje cambia por completo: se visitan la Laguna Blanca y la Laguna Verde, con el volcán Licancabur como telón de fondo, y luego el Desierto de Dalí, un escenario surreal de formaciones y colores. La ruta continúa hacia Uyuni.
Alojamiento: Hotel Coscaña', 'Almuerzo.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7f9490be-25f3-5d06-8f24-5dc533c19a8a', 'f1dac0ee-4043-5762-bbcb-95a75a048842', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7cfa95db-7899-5897-a146-22e1f41b95d2', 'f1dac0ee-4043-5762-bbcb-95a75a048842', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d099fccf-a7f8-5bfb-b64f-5a7a9a5f930e', 'f1dac0ee-4043-5762-bbcb-95a75a048842', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ab84038d-a35c-5cfa-8f0d-c85e5de00e6f', 'f1dac0ee-4043-5762-bbcb-95a75a048842', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9b66c974-4c63-5a56-b0b1-1092fc15bba6', 'f1dac0ee-4043-5762-bbcb-95a75a048842', '4e78b66d-0113-529a-a8f6-76bb10131eee', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('15417f3c-bac0-5136-a8d5-09dfec22276e', 'f1dac0ee-4043-5762-bbcb-95a75a048842', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('503655e5-bb0a-5732-903c-299c46a025d3', 'f1dac0ee-4043-5762-bbcb-95a75a048842', 'c2f9b7ed-8467-50c7-b8ce-59ea4e66e40c', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('04e37d10-1674-51d4-b2c5-b77632bce0e4', 'f1dac0ee-4043-5762-bbcb-95a75a048842', 'fa33cfd5-f099-5049-934f-ac1376653382', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ef96293b-c2f2-5ef6-bd6b-73c8c59ac4d4', '78c82f20-4e2e-550b-b407-03adee23fa74', 1, 'f1dac0ee-4043-5762-bbcb-95a75a048842') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'DAY_b34df665f5bf54e18d97', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d23f4ac7-a44e-55b0-875f-f4af3cd48e47', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'es', '(Bolivia) –Full day en el Salar de Uyuni · Isla Incahuasi · Atardecer', 'Salar de Uyuni para vivir la experiencia completa del desierto de sal, incluyendo la visita a la Isla Incahuasi, con caminata y vistas panorámicas entre cactus gigantes. El almuerzo es un Apthapi servido en el salar y, al final del día, se vive uno de los momentos más especiales del programa: cóctel privado al atardecer sobre el salar.
Alojamiento: Hotel Luna Salada', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3ae4b8b6-9e58-5061-a586-bd5e00f0b77e', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5a3a390a-4fe1-55a0-b6f8-0cb34194cb51', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('95bd197a-3f1c-50e8-8588-3fad5ea2639e', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0184ddb1-103a-5f51-a893-87cc257d8abe', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2fef022b-cb1a-5711-81c3-e08831c8274e', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('47e8b6ef-7530-5671-85ba-d9291f30b0a4', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bbb6ce71-4dd8-5f19-9826-093333d103d2', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5acd8da4-4bf3-5ce0-b89e-6d612d7aaf28', 'b34df665-f5bf-54e1-8d97-6805c4cb41e2', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('38ae3ed3-e1d5-5e3e-8b04-8659a209bfc8', '78c82f20-4e2e-550b-b407-03adee23fa74', 2, 'b34df665-f5bf-54e1-8d97-6805c4cb41e2') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('296a590c-9613-5774-be15-6f66e0fe899d', 'DAY_296a590c96135774be15', NULL, NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('dc9a368a-720b-5061-8186-837d766e2876', '296a590c-9613-5774-be15-6f66e0fe899d', 'es', '(Bolivia) – Cementerio de Trenes · Ruta altiplánica · Desierto de Siloli · Regreso a zona Hedionda', 'Salida hacia Uyuni para visitar el Cementerio de Trenes, un ícono fotográfico de la historia ferroviaria del altiplano. Luego se continúa hacia el mirador del Volcán Ollagüe y se avanza hacia el sur, con paradas en paisajes de altura y lagunas altiplánicas como Cañapa, además de sectores cercanos a Hedionda. Durante la tarde se atraviesa el Desierto de Siloli, regresando posteriormente a la zona de Hedionda para el alojamiento.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7d882fc0-f9ea-505f-8953-0f9123972c94', '296a590c-9613-5774-be15-6f66e0fe899d', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('05adb4a7-0d50-5d54-a38a-aa44a02de923', '296a590c-9613-5774-be15-6f66e0fe899d', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('324487e1-8c49-56ee-9250-bd549771ddce', '296a590c-9613-5774-be15-6f66e0fe899d', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7ad3edb1-4cae-5c03-91ff-2fc7b1edd63c', '296a590c-9613-5774-be15-6f66e0fe899d', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f066014f-76ab-5cd8-a3ab-a335f9039f90', '296a590c-9613-5774-be15-6f66e0fe899d', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('61af8e00-405e-54d7-b3af-eaf4dcc76c24', '296a590c-9613-5774-be15-6f66e0fe899d', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('38bf35c8-3f2a-59a3-91ee-d1e8432a8e27', '78c82f20-4e2e-550b-b407-03adee23fa74', 3, '296a590c-9613-5774-be15-6f66e0fe899d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f8a78b63-445a-538e-bf41-cc684244af59', 'DAY_f8a78b63445a538ebf41', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('4bd2177c-f406-5d9d-8e8e-603b1e11a218', 'f8a78b63-445a-538e-bf41-cc684244af59', 'es', '(Bolivia/Chile) – Retorno a San Pedro de Atacama', 'Tras el desayuno, salida desde el hotel rumbo a la frontera de Hito Cajón. Visitamos los Géiseres Sol de Mañana y, después del almuerzo, se realiza el cruce y el regreso a San Pedro de Atacama (Chile). Tras el regreso a San Pedro, se contempla una pausa para compras y almuerzo libre y por la tarde se continúa con la excursión a Laguna Cejar, conocida por sus aguas de alta salinidad y su entorno único en pleno desierto.
Alojamiento: No incluído', 'Desayuno, Almuerzo, Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bcde40ab-71ac-5b15-af7c-21ed95c8ed69', 'f8a78b63-445a-538e-bf41-cc684244af59', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b6190eec-f7cc-5d69-923a-82e199dd68da', 'f8a78b63-445a-538e-bf41-cc684244af59', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('becf8b28-9b9d-5aa2-85fa-35bf32195c7e', 'f8a78b63-445a-538e-bf41-cc684244af59', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('179956d3-9c4d-5634-bbb1-48e23c8c779a', '78c82f20-4e2e-550b-b407-03adee23fa74', 4, 'f8a78b63-445a-538e-bf41-cc684244af59') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('6a448cc0-21b6-582e-8c4e-3205637a836d', 'SPASPA-4D3N-LLTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'LLTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'DAY_64a08bb1df255fc2923f', 'SPA', NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0fcadcb7-d217-5e2f-b9e5-1758abd4fd97', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'es', 'Cruce Hito Cajón · Lagunas Altiplánicas · Villamar', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano.  Desde los primeros kilómetros, el paisaje cambia por completo: se visitan la Laguna Blanca y la Laguna Verde, con el volcán Licancabur como telón de fondo, y luego el Desierto de Dalí, un escenario surreal de formaciones y colores. La ruta continúa hacia Uyuni.
Alojamiento: Hotel Luna Salada', 'Almuerzo.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ff8a8f55-929e-55cd-8eca-9192c5246ad1', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d577c37e-9b78-5592-93bd-69497aa6cb42', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'ab7f5d6b-98c7-5505-8291-12ef1579af9a', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fb66a4be-7b01-59e6-9d29-d06d57dfde5c', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('df9c9f20-4e9c-5dd9-853f-b0f8cc9c54a4', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f79800a1-32cf-5dee-9938-dc0d2544fe52', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f4a5aa88-e318-590e-83f6-ef6be91a8e20', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a2e245c7-e38b-514c-85a0-c714f9c3bb46', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8f38416b-531f-53a5-b104-f5d3dcc1e2da', '64a08bb1-df25-5fc2-923f-e7b9b20a6240', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6963b770-df80-5ccc-a159-a4b1b9d461e4', '6a448cc0-21b6-582e-8c4e-3205637a836d', 1, '64a08bb1-df25-5fc2-923f-e7b9b20a6240') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('24c7b7ba-1f98-5941-8063-ad6798882c53', 'DAY_24c7b7ba1f9859418063', NULL, NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f6613528-6b9b-5588-8f88-9c5c4b4d4a14', '24c7b7ba-1f98-5941-8063-ad6798882c53', 'es', '(Bolivia) –Full day en el Salar de Uyuni · Isla Incahuasi · Atardecer', 'Salar de Uyuni para vivir la experiencia completa del desierto de sal, incluyendo la visita a la Isla Incahuasi, con caminata y vistas panorámicas entre cactus gigantes. El almuerzo es un Apthapi servido en el salar y, al final del día, se vive uno de los momentos más especiales del programa: cóctel privado al atardecer sobre el salar.
Alojamiento: Hotel Luna Salada', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7c0234b5-53ce-5c06-bfc9-345d96ba7ebe', '24c7b7ba-1f98-5941-8063-ad6798882c53', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'ab7f5d6b-98c7-5505-8291-12ef1579af9a', 1) on conflict do nothing;
commit;
