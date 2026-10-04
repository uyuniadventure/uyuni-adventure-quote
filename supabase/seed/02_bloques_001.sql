-- Generado por scripts/db/generate_blocks.py; ejecutar después de 00 y 01 y migración 003.
begin;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('8e048b4b-7857-560c-896d-60c0087b23c9', 'SPAUYU-3D2N-FJ', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'COMFORT', 'FJ', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "6 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'DAY_2d42cf3182d252c18aba', 'SPA', 'UYU', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0ed61399-9365-5650-8cd2-adea3799dd7d', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6b9c7283-e35b-5f2b-a332-36196674c657', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b3e3c5f1-e833-57ec-9a26-c6b1c77c4240', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '6e3ce078-9f35-55ed-9a2c-7992872ba017', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f64b7e07-202f-52d6-93dd-86c4ce92b8f2', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ce8ada49-5693-5ac6-94f9-33350c4b098e', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6aa2e65f-0e95-516a-aa2d-988357307b3b', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b2ca6688-0a58-56df-ab68-2ee3eb456966', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5f7f757c-bb95-53e9-8705-b51367d1de5e', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('28803696-7efe-5ff6-9841-2c02b84df42b', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'f8bd6097-3080-58dc-ab0c-b58edf37f250', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('acb5c72b-574f-544e-af5b-01c24f384def', '2d42cf31-82d2-52c1-8aba-2cf53c65bcca', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a88b8a56-8fb4-579e-a000-e4b3a363c240', '8e048b4b-7857-560c-896d-60c0087b23c9', 1, '2d42cf31-82d2-52c1-8aba-2cf53c65bcca') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('892aee4e-b160-56ad-ab1d-296bd86d5695', 'DAY_892aee4eb16056adab1d', 'SPA', 'UYU', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('7588054c-f63a-5409-9d64-4337d9e53b22', '892aee4e-b160-56ad-ab1d-296bd86d5695', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Después del desayuno, salida desde la zona de Laguna Hedionda con una parada en el mirador del Volcán Ollagüe, uno de los volcanes más emblemáticos del altiplano andino. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi (3.660 msnm), una formación rocosa que emerge en medio del salar, famosa por sus cactus gigantes y formaciones de coral fosilizado.
Alojamiento: Hotel Jardines de Uyuni', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8d2dbd09-18b0-5dbc-a0dd-ef1c0029bcc0', '892aee4e-b160-56ad-ab1d-296bd86d5695', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '6e3ce078-9f35-55ed-9a2c-7992872ba017', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1a2f1932-dcf9-5f28-9807-dcc36ea5b11b', '892aee4e-b160-56ad-ab1d-296bd86d5695', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ef0ae21c-5819-5870-af4b-36050a167644', '892aee4e-b160-56ad-ab1d-296bd86d5695', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ec2ec10e-f3cf-5cb3-8941-3b7e35a7f9b0', '892aee4e-b160-56ad-ab1d-296bd86d5695', 'ecd656cd-9c28-55e2-b248-36bc8f5901ab', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ac9f4223-3170-5cbb-96f0-962f7d5c9160', '892aee4e-b160-56ad-ab1d-296bd86d5695', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('328dbc69-59d6-5046-b9cd-35afec1e8f1c', '892aee4e-b160-56ad-ab1d-296bd86d5695', '113ed8f7-8532-5bcf-85ff-c51e2c0cf91e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3147c231-50d0-59d3-a580-e85163643b5c', '892aee4e-b160-56ad-ab1d-296bd86d5695', 'c42e75f2-488a-52ed-863d-a740cc5d78cf', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('3d34fb36-2c0f-545d-b268-55a8b46ef488', '8e048b4b-7857-560c-896d-60c0087b23c9', 2, '892aee4e-b160-56ad-ab1d-296bd86d5695') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('4bbef46a-440c-5612-a58b-7c17145d64f1', 'DAY_4bbef46a440c5612a58b', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f656af88-7e3f-504f-89fe-cb22438c2a1f', '4bbef46a-440c-5612-a58b-7c17145d64f1', 'es', 'Exploración del Salar de Uyuni', 'La jornada comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Luego continuarán hacia Colchani, donde conocerán el proceso artesanal de extracción y refinamiento de la sal. Ingreso al majestuoso Salar de Uyuni para visitar los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional apthapi en medio del salar, tiempo para fotografías y contemplación de este extraordinario paisaje natural. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c727d1e0-69bb-5215-9b91-8745d9ee7c38', '4bbef46a-440c-5612-a58b-7c17145d64f1', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '6e3ce078-9f35-55ed-9a2c-7992872ba017', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('091714b8-3088-5b03-a700-12ea6eb724d5', '4bbef46a-440c-5612-a58b-7c17145d64f1', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e3002aed-dc39-503b-b191-512f7b42a5bc', '8e048b4b-7857-560c-896d-60c0087b23c9', 3, '4bbef46a-440c-5612-a58b-7c17145d64f1') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('b4bc1d22-229c-5f15-9e16-7a12686ff003', 'SPAUYU-3D2N-HK', 'ITINERARIO DETALLADO SAN PEDRO DE ATACAMA → SALAR DE  UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'HK', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('5ab1da67-9e88-5562-945b-010eafac4f48', 'DAY_5ab1da679e885562945b', 'SPA', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('fb065a92-3a8a-59f2-863f-2bf3fb03ffc7', '5ab1da67-9e88-5562-945b-010eafac4f48', 'es', 'Lagunas Altiplánicas y Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón (4.480–4.550 msnm), donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la Laguna Blanca (4.350 msnm) y la Laguna Verde, (4.350 msnm) siguiendo la visita el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la espectacular Laguna Colorada.
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
insert into public.template_days (id, template_id, day_number, block_id) values ('dca19783-24b2-5c71-b5f3-b067457aad26', 'b4bc1d22-229c-5f15-9e16-7a12686ff003', 1, '5ab1da67-9e88-5562-945b-010eafac4f48') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('af88518f-dc65-5c3e-a426-a7384228c0d7', 'DAY_af88518fdc655c3ea426', 'SPA', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('cc5ed2bb-f18e-5d68-8c4b-6d6c14c6d7e1', 'af88518f-dc65-5c3e-a426-a7384228c0d7', 'es', 'Salar de Uyuni y Atardecer en el Desierto de Sal', 'La ruta continúa a través del vasto Desierto de Siloli y las hermosas lagunas Honda y Hedionda, hábitat natural de flamencos andinos, rodeados de impresionantes paisajes volcánicos. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
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
insert into public.template_days (id, template_id, day_number, block_id) values ('869c146b-42a9-5d06-8bd4-8fd9fd7f1fd7', 'b4bc1d22-229c-5f15-9e16-7a12686ff003', 2, 'af88518f-dc65-5c3e-a426-a7384228c0d7') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('34973dce-c543-56d5-b993-2045188086b6', 'DAY_34973dcec54356d5b993', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('73fc5760-d110-5597-83d9-947ef6b5b161', '34973dce-c543-56d5-b993-2045188086b6', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo estilo Apthapi en medio del salar y explora diferentes perspectivas de este extraordinario paisaje natural. Durante la tarde, continuarás descubriendo el desierto de sal, con tiempo para fotografías y para apreciar este infinito horizonte blanco.
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
insert into public.template_days (id, template_id, day_number, block_id) values ('6818e032-2745-5ecc-b290-b388c1fa7688', 'b4bc1d22-229c-5f15-9e16-7a12686ff003', 3, '34973dce-c543-56d5-b993-2045188086b6') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('e8a098a4-b630-51aa-8b1c-f4b28ac40045', 'SPAUYU-3D2N-FP', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'FP', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "6 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'DAY_a02f2b90ddb8511e927b', 'SPA', 'UYU', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d85e8c86-4c50-5b24-93fb-5f058bf8c5e9', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d2a6dcf4-ea6f-5dbe-a421-34d2bb7a52ff', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ba571f33-fc7b-55f6-82e5-4874d68b4b26', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '8a63b1cc-3aeb-5ca1-a7f2-096e5a0f91ae', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('294a0c8f-5aa2-5c50-b3c7-3a0eb9de233f', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b68f66cb-888c-585b-8f81-dae801ef13d5', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('413d9157-053e-57d4-848a-9a9f531ca561', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('28813240-a54a-57a8-8cfe-e824af1dc03c', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('49b85ca3-62dd-5872-be68-fd6985114669', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e383f666-c412-56b7-838a-adb43b298d69', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'f8bd6097-3080-58dc-ab0c-b58edf37f250', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('51f9ea93-39ce-59aa-9503-182a5e456e38', 'a02f2b90-ddb8-511e-927b-0b9f9b098c52', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('77854416-7bf8-5870-b3e3-c9091be6db53', 'e8a098a4-b630-51aa-8b1c-f4b28ac40045', 1, 'a02f2b90-ddb8-511e-927b-0b9f9b098c52') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('28b7c0bf-3213-58df-92af-eb761f97d45d', 'DAY_28b7c0bf321358df92af', 'SPA', 'UYU', '6695d424-92d7-5de0-91d4-b950ad466be1', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('e5abecce-91ac-531d-8080-c11e33015ced', '28b7c0bf-3213-58df-92af-eb761f97d45d', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Palacio de Sal', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b67cc237-d85b-5485-a1f6-e90dc50967e5', '28b7c0bf-3213-58df-92af-eb761f97d45d', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '8a63b1cc-3aeb-5ca1-a7f2-096e5a0f91ae', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d38f5d04-aee8-5025-8e2c-9bf2ec64d486', '28b7c0bf-3213-58df-92af-eb761f97d45d', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4a417837-c282-579c-a5e5-a522990f2759', '28b7c0bf-3213-58df-92af-eb761f97d45d', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('57034d8c-3ddb-58db-ac1f-1436ca4a1dae', '28b7c0bf-3213-58df-92af-eb761f97d45d', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('287507c2-cc03-5525-a695-6a8d29428121', '28b7c0bf-3213-58df-92af-eb761f97d45d', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a4afa60e-d7c3-5978-a1f8-cf9b89bed571', 'e8a098a4-b630-51aa-8b1c-f4b28ac40045', 2, '28b7c0bf-3213-58df-92af-eb761f97d45d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e209cc58-050e-528f-9aba-0e221cb99978', 'DAY_e209cc58050e528f9aba', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('62a9b1fb-eb5c-573d-92e5-b8f16dc044b4', 'e209cc58-050e-528f-9aba-0e221cb99978', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('31815edb-62b6-5671-963b-8c1644e3b3d6', 'e209cc58-050e-528f-9aba-0e221cb99978', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '8a63b1cc-3aeb-5ca1-a7f2-096e5a0f91ae', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b8718b9c-687b-57fb-93b8-1b8afba49dc6', 'e209cc58-050e-528f-9aba-0e221cb99978', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1bb19e17-dc02-5359-b73e-f5679d2abba7', 'e8a098a4-b630-51aa-8b1c-f4b28ac40045', 3, 'e209cc58-050e-528f-9aba-0e221cb99978') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('bef32a75-cc11-5c89-9b99-ef373754da67', 'SPAUYU-3D2N-FL', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'FL', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "6 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7e0ace28-c4c1-5443-89c9-8e250aa87420', 'DAY_7e0ace28c4c1544389c9', 'SPA', 'UYU', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a03badeb-3b6b-5098-9016-afc96a58e5a3', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('eae37024-137b-5b8c-8eea-cdcd762bdf60', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0bf96b94-e846-5a21-972a-147c586eb053', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '1c2a9f76-ad47-5780-a583-a9f4593be3b3', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f8b92632-2883-5d7d-a950-e97bb955709d', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('41462db2-2b03-5fce-b828-1143db18ac32', '7e0ace28-c4c1-5443-89c9-8e250aa87420', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d0babe77-0967-5339-bbc8-ffa0c0d9a690', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2f8f0793-4ea5-5c69-b476-eb87a9360064', '7e0ace28-c4c1-5443-89c9-8e250aa87420', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1311833e-d0e5-5c35-aff3-f148e7b5c4e0', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('30538506-c678-5fc1-bc38-842ba0934021', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'f8bd6097-3080-58dc-ab0c-b58edf37f250', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('87316182-29dc-5b0d-b4cc-16cba4c1935b', '7e0ace28-c4c1-5443-89c9-8e250aa87420', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7d503655-9ddf-54ef-9ea8-f002472ae756', 'bef32a75-cc11-5c89-9b99-ef373754da67', 1, '7e0ace28-c4c1-5443-89c9-8e250aa87420') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('89b4bafa-b27e-5c61-a388-65f23c532e08', 'DAY_89b4bafab27e5c61a388', 'SPA', 'UYU', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('05726c1a-8422-510e-9f30-34691507ec38', '89b4bafa-b27e-5c61-a388-65f23c532e08', 'es', 'Lagunas Cañapa y Hedionda · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Luna Salada', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('183e0a15-5196-5af6-883a-d3aa0720af2f', '89b4bafa-b27e-5c61-a388-65f23c532e08', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '1c2a9f76-ad47-5780-a583-a9f4593be3b3', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('292c82ec-c159-5997-ae44-1ac39812a2de', '89b4bafa-b27e-5c61-a388-65f23c532e08', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4a6ea866-6b94-5bda-9a26-7843cf0f1658', '89b4bafa-b27e-5c61-a388-65f23c532e08', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('03957ef3-8d26-543f-a2d0-99e8afcbede5', '89b4bafa-b27e-5c61-a388-65f23c532e08', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b91d38d6-d525-50ec-b9da-4cb1918c2a1e', '89b4bafa-b27e-5c61-a388-65f23c532e08', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d9ffb1c8-e9f8-58dc-a82b-854ff60b5d58', '89b4bafa-b27e-5c61-a388-65f23c532e08', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f3b9fc86-07bd-5b23-b6c2-d1ff457918bb', '89b4bafa-b27e-5c61-a388-65f23c532e08', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('71d643bd-49e6-5d74-a0eb-1d8343fd7580', 'bef32a75-cc11-5c89-9b99-ef373754da67', 2, '89b4bafa-b27e-5c61-a388-65f23c532e08') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('67edde4d-63fa-52c5-8c82-8664e93f016f', 'DAY_67edde4d63fa52c58c82', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('3355b888-b6c9-5946-949d-cbe80d06b7bf', '67edde4d-63fa-52c5-8c82-8664e93f016f', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('05ab4d27-fe4c-54dd-8dde-edbf80369989', '67edde4d-63fa-52c5-8c82-8664e93f016f', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '1c2a9f76-ad47-5780-a583-a9f4593be3b3', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7af038b7-c70f-5373-9426-e17137258a92', '67edde4d-63fa-52c5-8c82-8664e93f016f', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6dee1939-7369-574c-be6e-2327921c5562', 'bef32a75-cc11-5c89-9b99-ef373754da67', 3, '67edde4d-63fa-52c5-8c82-8664e93f016f') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c56f1951-5c6d-532b-9af7-ca0b742985e9', 'SPAUYU-3D2N-MP', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'MP', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('330efa37-7214-59af-be81-5d1c0143bb23', 'DAY_330efa37721459afbe81', 'SPA', 'UYU', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('85be2cb7-3342-5d24-9fec-698968b097dc', '330efa37-7214-59af-be81-5d1c0143bb23', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la impresionante Laguna Blanca y Laguna Verde, el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la impactante Laguna Colorada. Terminamos en Hotel antes del atardecer.
Alojamiento: Hotel Mallku Cueva', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('897b3c9f-5215-504b-a0a4-628713f032e6', '330efa37-7214-59af-be81-5d1c0143bb23', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'd6231b75-3c60-52d9-8495-829bcc0b0d39', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fd965d37-9b41-5b63-b87d-31efbbe07af8', '330efa37-7214-59af-be81-5d1c0143bb23', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f7acd374-b6df-58cd-8c2e-3470079271a8', '330efa37-7214-59af-be81-5d1c0143bb23', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1fa3aac1-2997-5155-a774-ce9119ad64f0', '330efa37-7214-59af-be81-5d1c0143bb23', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('02fbfade-0f15-5ced-931e-13f14dfb3f84', '330efa37-7214-59af-be81-5d1c0143bb23', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('76550d4e-c43f-5a47-a089-c126cb132b5d', '330efa37-7214-59af-be81-5d1c0143bb23', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4515ccb4-d33a-56ba-925b-d9f7c880a6fb', '330efa37-7214-59af-be81-5d1c0143bb23', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('857a75e1-c462-54b3-a34f-044bcf6927b1', 'c56f1951-5c6d-532b-9af7-ca0b742985e9', 1, '330efa37-7214-59af-be81-5d1c0143bb23') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a6f61188-1790-52aa-a815-71b475a251b9', 'DAY_a6f61188179052aaa815', 'SPA', 'UYU', '6695d424-92d7-5de0-91d4-b950ad466be1', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d32871dd-ea2f-5f22-a602-e98cb0bcfded', 'a6f61188-1790-52aa-a815-71b475a251b9', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.
Alojamiento: Hotel Palacio de Sal', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e04ce31f-8c7e-57a7-9bfd-3299300b71c8', 'a6f61188-1790-52aa-a815-71b475a251b9', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'd6231b75-3c60-52d9-8495-829bcc0b0d39', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b0e69c89-a7ec-5cfd-9538-4421b30a67be', 'a6f61188-1790-52aa-a815-71b475a251b9', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d8f72baa-19ce-508f-bc04-dac6bf5c2919', 'a6f61188-1790-52aa-a815-71b475a251b9', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3ad0f7e4-5ec7-5aef-80cc-31ff34ec72a2', 'a6f61188-1790-52aa-a815-71b475a251b9', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d732d6cd-3caf-5a85-b07e-e9502304940e', 'a6f61188-1790-52aa-a815-71b475a251b9', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5c9fecb3-49e8-572a-bdd8-f05853fb2707', 'c56f1951-5c6d-532b-9af7-ca0b742985e9', 2, 'a6f61188-1790-52aa-a815-71b475a251b9') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d83e60f2-e252-5743-a1de-1d294cf1eaa5', 'DAY_d83e60f2e2525743a1de', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('e87026a8-7cd8-5000-bbb1-09b9ed111ad3', 'd83e60f2-e252-5743-a1de-1d294cf1eaa5', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a623a136-bee3-5950-85d0-9287fba0668f', 'd83e60f2-e252-5743-a1de-1d294cf1eaa5', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('18a3b409-1236-5036-94b9-06092040553f', 'd83e60f2-e252-5743-a1de-1d294cf1eaa5', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'd6231b75-3c60-52d9-8495-829bcc0b0d39', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9e4d31c2-eef2-5bcc-8351-50547a2770a4', 'd83e60f2-e252-5743-a1de-1d294cf1eaa5', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('63b822af-bcef-5c0a-9d0e-744f31988474', 'd83e60f2-e252-5743-a1de-1d294cf1eaa5', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e7a6c7d5-0a2b-5e0d-903a-8b669dcc2b34', 'c56f1951-5c6d-532b-9af7-ca0b742985e9', 3, 'd83e60f2-e252-5743-a1de-1d294cf1eaa5') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('6c556df1-4f97-5415-8304-ccd6d7d949ad', 'SPAUYU-3D2N-ML', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'ML', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('83903186-1129-5903-a8fc-9c73c62472ab', 'DAY_8390318611295903a8fc', 'SPA', 'UYU', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('24f3eb66-e710-5239-bf80-f3c073c27b82', '83903186-1129-5903-a8fc-9c73c62472ab', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la impresionante Laguna Blanca y Laguna Verde, el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la impactante Laguna Colorada. Terminamos en Hotel antes del Atardecer.
Alojamiento: Hotel Mallku Cueva', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('30ecb672-e8d7-587a-b78a-18eedef3407c', '83903186-1129-5903-a8fc-9c73c62472ab', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '67749c25-d652-5f01-885a-cb2e56a8eff4', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8a6f556a-f719-50ce-a71b-b0fd2e304a8a', '83903186-1129-5903-a8fc-9c73c62472ab', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fa70b7f9-b898-52b5-ac7e-76ff4b2d6e96', '83903186-1129-5903-a8fc-9c73c62472ab', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('19460134-1216-5f34-b50e-4e6e79dc4376', '83903186-1129-5903-a8fc-9c73c62472ab', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c0e5096b-a307-5b7f-8688-b512c4110096', '83903186-1129-5903-a8fc-9c73c62472ab', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d84b92bb-2974-56a1-85cc-7e3cac9ef71f', '83903186-1129-5903-a8fc-9c73c62472ab', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('283bfb0f-647f-57bf-a8ec-fe17cb7d37d2', '83903186-1129-5903-a8fc-9c73c62472ab', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c400d5b8-2d1b-5af6-9568-fd038b3f8eb6', '83903186-1129-5903-a8fc-9c73c62472ab', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6cdbb956-1688-548b-948e-f42229e9753a', '6c556df1-4f97-5415-8304-ccd6d7d949ad', 1, '83903186-1129-5903-a8fc-9c73c62472ab') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'DAY_3aa80c01dd8a574291f4', 'SPA', 'UYU', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('724a959d-a03f-5093-93b0-a07e1737134b', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fosilizado. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: Hotel Luna Salada', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6a37d1e5-60b6-5b72-8579-994bb2d82fc6', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '67749c25-d652-5f01-885a-cb2e56a8eff4', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e6823aa6-a1c1-57df-a66a-8b0e39720a60', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e13dbc51-5a8d-5cb0-8d58-36bdbfa79694', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('af072078-3394-5db3-a7fc-0302c561780c', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a587c25b-994f-524a-b4e4-349e7601d3f6', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('be871275-9f1d-5467-903e-4e3c930f8f67', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('369851fe-a331-5ed5-9c1c-0f92879a7a36', '3aa80c01-dd8a-5742-91f4-6335a6b23d06', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('521253c1-253b-5c66-83be-4aa0435c016f', '6c556df1-4f97-5415-8304-ccd6d7d949ad', 2, '3aa80c01-dd8a-5742-91f4-6335a6b23d06') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e38e45a6-2832-5451-8045-d0a8e324a846', 'DAY_e38e45a6283254518045', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('175cd333-3a66-5302-835a-ba7d827c4785', 'e38e45a6-2832-5451-8045-d0a8e324a846', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b331ae12-f3c0-588a-be1f-fbefe9ccb43f', 'e38e45a6-2832-5451-8045-d0a8e324a846', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('40e9ed70-479e-509c-9c46-3849953b1e22', 'e38e45a6-2832-5451-8045-d0a8e324a846', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '67749c25-d652-5f01-885a-cb2e56a8eff4', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('abb3cfef-7933-52b7-8497-534edcd6ff3a', 'e38e45a6-2832-5451-8045-d0a8e324a846', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6822ae62-68b6-5224-a218-eee865881c20', 'e38e45a6-2832-5451-8045-d0a8e324a846', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('528cedc2-828f-5f76-952c-156cd1abf5af', '6c556df1-4f97-5415-8304-ccd6d7d949ad', 3, 'e38e45a6-2832-5451-8045-d0a8e324a846') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('18ca2699-00d3-5406-a14e-9ee82ebe69f6', 'SPAUYU-3D2N-ScK', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI (SOLO IDA)', 'SPA', 'UYU', 'ONEWAY', 3, 2, 'MIXTO', 'ScK', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7071b577-0fc3-575b-9737-4432b886521a', 'DAY_7071b5770fc3575b9737', 'SPA', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('393fae7b-23b4-589d-9fdd-1093f590166a', '7071b577-0fc3-575b-9737-4432b886521a', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el recorrido visitarás la impresionante Laguna Blanca y Laguna Verde, el surrealista Desierto de Dalí, el campo geotérmico de los Géiseres Sol de la Mañana y la impactante Laguna Colorada. Terminamos en Hotel antes del Atardecer.
Alojamiento: Hotel San Cristóbal', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('fdf752e4-06f1-5044-80a8-62397beb7eec', '18ca2699-00d3-5406-a14e-9ee82ebe69f6', 1, '7071b577-0fc3-575b-9737-4432b886521a') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('3d31cdd7-30a9-56b7-b4da-df3887ba2f69', 'DAY_3d31cdd730a956b7b4da', 'SPA', 'UYU', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('065d71fe-c393-5e8d-be33-217dc64e3b6f', '3d31cdd7-30a9-56b7-b4da-df3887ba2f69', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo. Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fosilizado. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: Hotel Kachi', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d8584dc3-5da0-5bd6-8476-d23b3a1f97dc', '18ca2699-00d3-5406-a14e-9ee82ebe69f6', 2, '3d31cdd7-30a9-56b7-b4da-df3887ba2f69') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ebd3bf9c-f3b4-5e9f-a8b8-0359f2a72d71', 'DAY_ebd3bf9cf3b45e9fa8b8', 'SPA', 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f3daf81d-8435-5e95-9b08-f962439b70f4', 'ebd3bf9c-f3b4-5e9f-a8b8-0359f2a72d71', 'es', 'Exploración del Salar de Uyuni', 'Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito.
Alojamiento: No incluído', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7e3a80b3-f7f2-58e6-811f-b6ecffe40c84', '18ca2699-00d3-5406-a14e-9ee82ebe69f6', 3, 'ebd3bf9c-f3b4-5e9f-a8b8-0359f2a72d71') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('2eaf385e-d58c-5a23-9b3c-ad3089529692', 'SPASPA-4D3N-MRF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI - SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MRF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "11 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9cbbb36a-f665-555e-9e8a-621fcfb31a8b', 'DAY_9cbbb36af665555e9e8a', 'SPA', 'SPA', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b57b503d-6d7d-5712-ac15-f2265958e600', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarás un vehículo 4x4 para comenzar esta aventura por los espectaculares paisajes del altiplano boliviano. El recorrido inicia temprano con la visita a los géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la intensa actividad geotérmica crea fumarolas y pozas de barro hirviendo. Durante el día visitarás la Laguna Blanca, la Laguna Verde y el surrealista Desierto de Dalí. Luego continuarás hacia la impresionante Laguna Colorada, para finalmente seguir rumbo a Villamar ubicado a unos 3.900 a 4.000 metros sobre el nivel del mar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ac730033-f4c1-5741-aa09-89b930314cbb', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e5bc7494-6296-5888-bae4-b2e1461a2654', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('853a2c0e-3a75-5f0a-a720-7e17846923e9', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e545e757-d8fc-5759-b008-05a55b446df7', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ba615ff0-522c-5cd1-acc8-b87ef4b31c39', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ddba1529-3316-5340-bcf7-c26ac1075978', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ee344b92-1af9-50d2-b867-77a666e9dcc0', '9cbbb36a-f665-555e-9e8a-621fcfb31a8b', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1a09dd62-b100-5956-a390-380eea03ec25', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 1, '9cbbb36a-f665-555e-9e8a-621fcfb31a8b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a33e65e3-4038-54f0-8a42-0d5d57037f0e', 'DAY_a33e65e3403854f08a42', 'SPA', 'SPA', '4e99889a-d935-5eba-aa11-a5150d760bb9', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b477445c-1ce1-553a-a33a-f33e3e6aef93', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', 'es', 'Valle de las Rocas · Cañón Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural. El día finaliza en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cócteles al atardecer, rodeado por el horizonte blanco e interminable del desierto de sal.
Alojamiento: Hotel Rosario de Uyuni', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7f90b476-b3e4-5bc1-b1e2-3599cfb90091', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('88437d90-7c9a-5912-83be-d9c2414abc63', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1a035e8d-a89e-5d0f-8295-de89fd6f7b6f', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('052798c8-feb1-5017-9f2f-aca0f0870d92', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', 'd9d04ee8-9f48-5c27-84fb-f90e72781e39', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('37bab7f7-0154-5803-95eb-a1e8d282d86b', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', '4e99889a-d935-5eba-aa11-a5150d760bb9', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('50a78412-8355-5b89-9ab6-f143f2a645ec', 'a33e65e3-4038-54f0-8a42-0d5d57037f0e', '37c1b2b5-2015-50f7-87fd-f5a21b94ab98', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('069987be-9907-5809-9d72-6fbd10a0f60b', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 2, 'a33e65e3-4038-54f0-8a42-0d5d57037f0e') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7e4f37c4-40ca-5d74-8595-98c357d2a110', 'DAY_7e4f37c440ca5d748595', 'SPA', 'SPA', 'bd24d50a-2061-5524-99ef-fe971856685d', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('948d968c-2735-5f55-8fe0-cd0488a5efb4', '7e4f37c4-40ca-5d74-8595-98c357d2a110', 'es', 'Salar de Uyuni · Cóctel al atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio de los salares y más tarde explora la famosa Isla Incahuasi, hogar de gigantescos cactus y formaciones de coral fosilizado. Almuerzo Apthapi en el Salar. Luego continuaremos hacia las impresionantes Lagunas Altiplánicas Cañapa, Ramaditas, Honda y Hedionda, hábitat natural de cientos de flamencos dentro de un paisaje andino extraordinario. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes coloridos y vastas llanuras de gran altitud.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b41bec9b-a21e-5e14-a7e9-458002eb492d', '7e4f37c4-40ca-5d74-8595-98c357d2a110', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('41b41b4f-7438-54db-a7f7-443ce0470eaf', '7e4f37c4-40ca-5d74-8595-98c357d2a110', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('812cc677-c63b-5462-a150-a32cb1d7c995', '7e4f37c4-40ca-5d74-8595-98c357d2a110', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d5bc6c82-bac8-523c-8a87-a24cceb311d0', '7e4f37c4-40ca-5d74-8595-98c357d2a110', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b6cb0d14-49f2-5a87-aff8-dd63ef56c388', '7e4f37c4-40ca-5d74-8595-98c357d2a110', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d02cb0c1-419d-54ba-b33d-c89933159159', '7e4f37c4-40ca-5d74-8595-98c357d2a110', '92d2369c-4c49-5ed1-a6b8-e8f164e175e6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d00bcbbf-1ac0-546d-a387-6281f7e3450a', '7e4f37c4-40ca-5d74-8595-98c357d2a110', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('bdaa5c62-b0ea-5aa7-9012-262c15ece4f5', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 3, '7e4f37c4-40ca-5d74-8595-98c357d2a110') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('bf022fa8-ab33-5057-91c8-bec48c1c6993', 'DAY_bf022fa8ab33505791c8', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('da73b2b7-9974-5326-a015-04194e8fee6a', 'bf022fa8-ab33-5057-91c8-bec48c1c6993', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', NULL, '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8e229200-65eb-5694-83b0-3932106557bd', 'bf022fa8-ab33-5057-91c8-bec48c1c6993', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7f9286ba-77ea-557a-afec-c07af23d7d70', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('98c5d9c3-3d04-55ed-8917-56ff8905c55f', 'bf022fa8-ab33-5057-91c8-bec48c1c6993', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9b13f839-3e65-5519-ac48-546f5ff72cce', 'bf022fa8-ab33-5057-91c8-bec48c1c6993', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d428eb3c-d4e4-5cb3-849d-3e36f5a71530', '2eaf385e-d58c-5a23-9b3c-ad3089529692', 4, 'bf022fa8-ab33-5057-91c8-bec48c1c6993') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 'SPASPA-4D3N-ScRF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI - SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScRF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ed8fbc29-7c15-5894-aa1c-24f044202fde', 'DAY_ed8fbc297c155894aa1c', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f2d29dc9-747a-5e02-aa1a-a3f4a4fb0a44', 'ed8fbc29-7c15-5894-aa1c-24f044202fde', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarás un vehículo 4x4 para comenzar esta aventura por los espectaculares paisajes del altiplano boliviano. El recorrido inicia temprano con la visita a los géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la intensa actividad geotérmica crea fumarolas y pozas de barro hirviendo. Durante el día visitarás la Laguna Blanca, la Laguna Verde y el surrealista Desierto de Dalí. Luego continuarás hacia la impresionante Laguna Colorada, para finalmente seguir rumbo a San Cristobal ubicado a unos 3.800 metros sobre el nivel del mar.
Alojamiento: Hotel San Cristobal', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('b4fd6931-1c46-57f1-a701-2b9ada2489c4', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 1, 'ed8fbc29-7c15-5894-aa1c-24f044202fde') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('3a89cc69-1e59-5007-8c32-9bc9588f23c5', 'DAY_3a89cc691e5950078c32', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a408b9e0-bdba-58c6-b67a-8db6b660a8f4', '3a89cc69-1e59-5007-8c32-9bc9588f23c5', 'es', 'Valle de las Rocas · Cañón Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural. El día finaliza en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cócteles al atardecer, rodeado por el horizonte blanco e interminable del desierto de sal.
Alojamiento: Hotel Rosario de Uyuni', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d5ae098e-a2cf-5c67-bb25-a43715032e06', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 2, '3a89cc69-1e59-5007-8c32-9bc9588f23c5') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('4d3b85dd-318f-5b43-b73c-729a8bd4f7be', 'DAY_4d3b85dd318f5b43b73c', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8188e6d6-8bd1-5797-89f9-85475ac77860', '4d3b85dd-318f-5b43-b73c-729a8bd4f7be', 'es', 'Salar de Uyuni · Cóctel al atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio de los salares y más tarde explora la famosa Isla Incahuasi, hogar de gigantescos cactus y formaciones de coral fosilizado. Almuerzo Apthapi en el Salar. Luego continuaremos hacia las impresionantes Lagunas Altiplánicas Cañapa, Ramaditas, Honda y Hedionda, hábitat natural de cientos de flamencos dentro de un paisaje andino extraordinario. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes coloridos y vastas llanuras de gran altitud.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7e3eaf74-7e44-5c70-8006-1dfc7cfa7e13', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 3, '4d3b85dd-318f-5b43-b73c-729a8bd4f7be') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('3185098c-2a77-5055-8af0-a22a8c76228b', 'DAY_3185098c2a7750558af0', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('648607ea-bc82-5d19-9295-f36a91dc23b8', '3185098c-2a77-5055-8af0-a22a8c76228b', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', NULL, '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e7ce26d1-3907-5e02-bc99-033d5eb2485d', 'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb', 4, '3185098c-2a77-5055-8af0-a22a8c76228b') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('44f067c9-d3a2-59ee-b4f8-70708a54ed66', 'SPASPA-4D3N-FJM', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'FJM', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d41d5264-e5f4-56bc-bc03-22479bcbab14', 'DAY_d41d5264e5f456bcbc03', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5a3db2f6-4567-50c4-abfa-f894f46969a4', 'd41d5264-e5f4-56bc-bc03-22479bcbab14', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos.
Alojamiento: Hotel Los Flamencos (Laguna Hedionda)', 'Almuerzo · Cena', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('466976c3-1407-5cbe-814e-58502e2a8d96', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 1, 'd41d5264-e5f4-56bc-bc03-22479bcbab14') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('78535901-41b1-5926-a01f-bdc2dfe72aff', 'DAY_7853590141b15926a01f', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('1b24e692-e0a0-5ce5-a33d-1c44147fabca', '78535901-41b1-5926-a01f-bdc2dfe72aff', 'es', 'Salar de Uyuni · Atardecer en el desierto de sal', 'Visita a las hermosas lagunas Cañapa y Hedionda, seguida de una parada en el mirador del Volcán Ollagüe. Desde allí, el recorrido continúa hacia el inmenso Salar de Uyuni, cruzando el salar más grande del mundo.  El almuerzo será servido en medio del salar, Por la tarde, exploración de la icónica Isla Incahuasi, famosa por sus cactus gigantes y formaciones de coral fosilizado. El día finaliza con un cóctel privado al atardecer en medio del desierto de sal.
Alojamiento: Hotel Jardines de Uyuni (Pueblo de Uyuni)', 'Desayuno · Almuerzo', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6d24a5f1-e4ae-527d-88b6-7aa31350c017', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 2, '78535901-41b1-5926-a01f-bdc2dfe72aff') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('0285c4d4-fe89-5422-bc04-6c1c7af9147c', 'DAY_0285c4d4fe895422bc04', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('938142b2-60d5-5493-be41-93e2deccc677', '0285c4d4-fe89-5422-bc04-6c1c7af9147c', 'es', 'Salar de Uyuni  · Valle de las Rocas · Cañón Anaconda', 'Después del desayuno, Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito. Tarde libre para fotografía y contemplación de este extraordinario paisaje natural. Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('51fe2d0a-d478-52aa-bb0b-9429b2e8c17d', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 3, '0285c4d4-fe89-5422-bc04-6c1c7af9147c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ba0b6886-8028-5805-b8b2-f8f30357f662', 'DAY_ba0b688680285805b8b2', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('4128ac06-a588-55bb-84d1-bdea684b7b4e', 'ba0b6886-8028-5805-b8b2-f8f30357f662', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', 'Comidas o bebestible no mencionadas', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a833c304-8fbb-525f-89a9-f60fa6c9942d', '44f067c9-d3a2-59ee-b4f8-70708a54ed66', 4, 'ba0b6886-8028-5805-b8b2-f8f30357f662') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 'SPASPA-4D3N-FJJ', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'FJJ', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('533e09f2-7c9e-56c9-9f1f-8f70f6feccfc', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 1, 'd41d5264-e5f4-56bc-bc03-22479bcbab14') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0c323d8e-5556-5cef-bb55-49cf347fbb5b', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 2, '78535901-41b1-5926-a01f-bdc2dfe72aff') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b9fd5b1c-dd9d-524b-9b81-22e4f056c409', 'DAY_b9fd5b1cdd9d524b9b81', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('e854a985-09c1-5015-abaa-56ffbae803e1', 'b9fd5b1c-dd9d-524b-9b81-22e4f056c409', 'es', 'Salar de Uyuni  · Valle de las Rocas · Cañón Anaconda', 'Después del desayuno, Visita al pueblo artesanal de Colchani antes de reingresar al vasto Salar de Uyuni. El almuerzo será servido en medio del salar, seguido de visitas a miradores panorámicos para disfrutar perspectivas únicas del horizonte blanco infinito. Tarde libre para fotografía y contemplación de este extraordinario paisaje natural.
Alojamiento: Hotel Jardines de Uyuni (Pueblo de Uyuni)', 'Desayuno · Almuerzo · Cena', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('3a43180a-29a4-5741-bd22-a8afeaf2d7a9', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 3, 'b9fd5b1c-dd9d-524b-9b81-22e4f056c409') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('0161acd4-fc12-57c7-bf94-0cdbf389381f', 'DAY_0161acd4fc1257c7bf94', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('531c4faf-fb8f-5a39-8662-9fe284225ca6', '0161acd4-fc12-57c7-bf94-0cdbf389381f', 'es', 'Hito Cajón · San Pedro de Atacama', 'Salida temprana en la mañana, hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón Anaconda, esculpido por siglos de erosión natural. Continúa hacia las Aguas Termales de Polques, donde podrás relajarte en sus aguas termales naturales. Luego cruzaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 5 p.m.', 'Comidas o bebestible no mencionadas', 'Tasas fronterizas y migratorias
Alojamiento en San Pedro de Atacama
Actividades opcionales
Gastos personales
Seguro de viaje
Propinas
Vuelos', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('dbb41833-bed8-58d1-a69a-944b424f3e50', 'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7', 4, '0161acd4-fc12-57c7-bf94-0cdbf389381f') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('78c82f20-4e2e-550b-b407-03adee23fa74', 'SPASPA-4D3N-ÑLTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ÑLTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'DAY_e090523b9b955ab5acc5', 'SPA', 'SPA', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d3c9e938-5b02-5f3d-a790-791f271f85f6', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'es', '(Bolivia) –  Hito Cajón · Lagunas Altiplánicas · Villamar', 'Salida temprano desde San Pedro de Atacama rumbo a la frontera Hito Cajón para ingresar al altiplano boliviano. Desde los primeros kilómetros, el paisaje cambia por completo: se visitan la Laguna Blanca y la Laguna Verde, con el volcán Licancabur como telón de fondo, y luego el Desierto de Dalí, un escenario surreal de formaciones y colores. La ruta continúa hacia Uyuni.
Alojamiento: Hotel Coscaña', 'Almuerzo.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('eb7c767f-5e47-526c-a897-ee2f04399f88', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c778776c-14d4-51ff-bf4e-5a2846b031c1', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7429282b-76dd-5dd1-a315-a91936f158a1', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('52b66edf-a00e-542a-b5d2-222b8d8f8efd', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('70ae2a6c-de7c-511c-8b1d-ceda533daeef', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', '4e78b66d-0113-529a-a8f6-76bb10131eee', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2826ebd4-080c-5aa4-9c67-f209c8577155', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8ed89b67-2868-5772-8f34-1e535d7d353d', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'c2f9b7ed-8467-50c7-b8ce-59ea4e66e40c', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f16f0b59-16c0-526a-9368-58aa6d0dff1d', 'e090523b-9b95-5ab5-acc5-5e90b8497fbe', 'fa33cfd5-f099-5049-934f-ac1376653382', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ef96293b-c2f2-5ef6-bd6b-73c8c59ac4d4', '78c82f20-4e2e-550b-b407-03adee23fa74', 1, 'e090523b-9b95-5ab5-acc5-5e90b8497fbe') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('30692db4-71aa-5c0b-8db3-22466d663840', 'DAY_30692db471aa5c0b8db3', 'SPA', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('51586626-92c2-5aee-bfbc-4ce5714da673', '30692db4-71aa-5c0b-8db3-22466d663840', 'es', '(Bolivia) –Full day en el Salar de Uyuni · Isla Incahuasi · Atardecer', 'Salar de Uyuni para vivir la experiencia completa del desierto de sal, incluyendo la visita a la Isla Incahuasi, con caminata y vistas panorámicas entre cactus gigantes. El almuerzo es un Apthapi servido en el salar y, al final del día, se vive uno de los momentos más especiales del programa: cóctel privado al atardecer sobre el salar.
Alojamiento: Hotel Luna Salada', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('609fdff7-35b1-5459-9bf5-30ec0a4c4aaf', '30692db4-71aa-5c0b-8db3-22466d663840', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d5e85309-aae1-5d16-a185-43e824f3fab1', '30692db4-71aa-5c0b-8db3-22466d663840', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('68264a4c-0d33-57de-8b55-199e255d6841', '30692db4-71aa-5c0b-8db3-22466d663840', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e8efa8d0-9590-542d-8e19-9020403cd0c1', '30692db4-71aa-5c0b-8db3-22466d663840', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6b8b13e9-d715-55df-96e2-28f292ee9b8f', '30692db4-71aa-5c0b-8db3-22466d663840', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4618cb78-541b-5c41-9065-bc9cdfad3946', '30692db4-71aa-5c0b-8db3-22466d663840', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cf3881a9-fb71-5178-96e0-05caa3d96507', '30692db4-71aa-5c0b-8db3-22466d663840', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5cdd6ee5-cf15-5e82-a217-762fbe9cd052', '30692db4-71aa-5c0b-8db3-22466d663840', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('38ae3ed3-e1d5-5e3e-8b04-8659a209bfc8', '78c82f20-4e2e-550b-b407-03adee23fa74', 2, '30692db4-71aa-5c0b-8db3-22466d663840') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('0b72eee6-c313-5a3e-8016-f2ed75d41a3d', 'DAY_0b72eee6c3135a3e8016', 'SPA', 'SPA', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('301e23ba-4597-51f6-aac9-979a86ddd482', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', 'es', '(Bolivia) – Cementerio de Trenes · Ruta altiplánica · Desierto de Siloli · Regreso a zona Hedionda', 'Salida hacia Uyuni para visitar el Cementerio de Trenes, un ícono fotográfico de la historia ferroviaria del altiplano. Luego se continúa hacia el mirador del Volcán Ollagüe y se avanza hacia el sur, con paradas en paisajes de altura y lagunas altiplánicas como Cañapa, además de sectores cercanos a Hedionda. Durante la tarde se atraviesa el Desierto de Siloli, regresando posteriormente a la zona de Hedionda para el alojamiento.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cdd50ae5-b66b-5d9e-b7fc-90a5e53b86ef', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0afb21fd-1690-5690-aa0f-a35d70e62969', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('588cb4f1-3a3d-507c-a292-cba6a82d24c8', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('39cbc720-aba7-5c9b-81df-3667487d97ed', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9eabf32d-6399-5fb1-9995-664da2bc737e', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2f696f9e-4b77-5d34-bd86-5e1b4b25a85e', '0b72eee6-c313-5a3e-8016-f2ed75d41a3d', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('38bf35c8-3f2a-59a3-91ee-d1e8432a8e27', '78c82f20-4e2e-550b-b407-03adee23fa74', 3, '0b72eee6-c313-5a3e-8016-f2ed75d41a3d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('98fc93a6-a38f-54b0-8eba-c78e47326fdb', 'DAY_98fc93a6a38f54b08eba', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a52c6ef1-d49e-50bf-bff1-0d70ddf26a7b', '98fc93a6-a38f-54b0-8eba-c78e47326fdb', 'es', '(Bolivia/Chile) – Retorno a San Pedro de Atacama', 'Tras el desayuno, salida desde el hotel rumbo a la frontera de Hito Cajón. Visitamos los Géiseres Sol de Mañana y, después del almuerzo, se realiza el cruce y el regreso a San Pedro de Atacama (Chile). Tras el regreso a San Pedro, se contempla una pausa para compras y almuerzo libre y por la tarde se continúa con la excursión a Laguna Cejar, conocida por sus aguas de alta salinidad y su entorno único en pleno desierto.
Alojamiento: No incluído', 'Desayuno, Almuerzo, Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('030cabb8-8cd4-577d-8222-32a57a1174e3', '98fc93a6-a38f-54b0-8eba-c78e47326fdb', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57f5e387-c2f0-5539-a3a3-884e3da6522e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f25ec643-e2c8-5c18-afc7-8f7643882872', '98fc93a6-a38f-54b0-8eba-c78e47326fdb', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3bfeee6e-d5bb-5fef-99b6-ed30e782a2c6', '98fc93a6-a38f-54b0-8eba-c78e47326fdb', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('179956d3-9c4d-5634-bbb1-48e23c8c779a', '78c82f20-4e2e-550b-b407-03adee23fa74', 4, '98fc93a6-a38f-54b0-8eba-c78e47326fdb') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('6a448cc0-21b6-582e-8c4e-3205637a836d', 'SPASPA-4D3N-LLTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'LLTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'DAY_24cdb8083a92593da07a', 'SPA', 'SPA', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a72ff2d5-955c-5b8b-a578-0abeefd504ff', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'es', 'Cruce Hito Cajón · Lagunas Altiplánicas · Villamar', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano.  Desde los primeros kilómetros, el paisaje cambia por completo: se visitan la Laguna Blanca y la Laguna Verde, con el volcán Licancabur como telón de fondo, y luego el Desierto de Dalí, un escenario surreal de formaciones y colores. La ruta continúa hacia Uyuni.
Alojamiento: Hotel Luna Salada', 'Almuerzo.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a9e313cc-56b2-5c8d-80fb-e20f55373b6a', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a27f2746-723d-50c8-bd79-0ebcbba7ae71', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'ab7f5d6b-98c7-5505-8291-12ef1579af9a', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a2fe2eed-62cd-50be-ad2d-d123cf43e310', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('40aea2f2-a640-58cc-af83-9c98f6cf2385', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bb8fe120-49ab-5a24-8204-fb7453461a46', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f6355745-82f6-5240-8c49-ef96abffd70b', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b10f1c29-e289-514a-bd45-0cc53430e9e3', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('89f3b9c0-002e-5450-8c0d-44243ca84ac1', '24cdb808-3a92-593d-a07a-2e6a7f4229c4', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6963b770-df80-5ccc-a159-a4b1b9d461e4', '6a448cc0-21b6-582e-8c4e-3205637a836d', 1, '24cdb808-3a92-593d-a07a-2e6a7f4229c4') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7596036b-0329-53bf-848e-948e6703bc21', 'DAY_7596036b032953bf848e', 'SPA', 'SPA', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('4e48cfba-fcd5-5a38-9d2c-9e9faf452dfb', '7596036b-0329-53bf-848e-948e6703bc21', 'es', '(Bolivia) –Full day en el Salar de Uyuni · Isla Incahuasi · Atardecer', 'Salar de Uyuni para vivir la experiencia completa del desierto de sal, incluyendo la visita a la Isla Incahuasi, con caminata y vistas panorámicas entre cactus gigantes. El almuerzo es un Apthapi servido en el salar y, al final del día, se vive uno de los momentos más especiales del programa: cóctel privado al atardecer sobre el salar.
Alojamiento: Hotel Luna Salada', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ba39bf94-9741-5bf9-9a2d-84a958ba2b72', '7596036b-0329-53bf-848e-948e6703bc21', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'ab7f5d6b-98c7-5505-8291-12ef1579af9a', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('80c29485-f19c-5d71-8f1d-b64d39b4527c', '7596036b-0329-53bf-848e-948e6703bc21', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('21f04aed-0ba7-5a17-937b-13ac0ccf3c8b', '7596036b-0329-53bf-848e-948e6703bc21', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5a1a6e1d-798a-5cfd-a9cd-a5b5dff0b28d', '7596036b-0329-53bf-848e-948e6703bc21', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a7e118d2-4e15-5a21-9eec-17764df9e7fa', '7596036b-0329-53bf-848e-948e6703bc21', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d028f591-a5ec-5a61-bfa5-5c02ed43fb49', '7596036b-0329-53bf-848e-948e6703bc21', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('51c10246-5b92-520c-9250-831b8134f5aa', '7596036b-0329-53bf-848e-948e6703bc21', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f59cdfb0-dcca-55d1-a135-bfa07df3d8ea', '6a448cc0-21b6-582e-8c4e-3205637a836d', 2, '7596036b-0329-53bf-848e-948e6703bc21') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d66178e5-68ed-5bff-882a-07a89b782ed4', 'DAY_d66178e568ed5bff882a', 'SPA', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('cb9d8d31-ef98-51b2-9c98-038e223adfb9', 'd66178e5-68ed-5bff-882a-07a89b782ed4', 'es', '(Bolivia) – Cementerio de Trenes · Ruta altiplánica (Cañapa/Hedionda) · Desierto de Siloli · Regreso a zona Hedionda', 'Salida hacia Uyuni para visitar el Cementerio de Trenes, un ícono fotográfico de la historia ferroviaria del altiplano. Luego se continúa hacia el mirador del Volcán Ollagüe y se avanza hacia el sur, con paradas en paisajes de altura y lagunas altiplánicas como Cañapa, además de sectores cercanos a Hedionda. Durante la tarde se atraviesa el Desierto de Siloli, regresando posteriormente a la zona de Hedionda para el alojamiento.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('25631e76-fdac-58b9-bc0d-df483f0ef1a0', 'd66178e5-68ed-5bff-882a-07a89b782ed4', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'ab7f5d6b-98c7-5505-8291-12ef1579af9a', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f868aa4d-cea2-55b3-b2e2-183f0fa063c5', 'd66178e5-68ed-5bff-882a-07a89b782ed4', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('576b824d-2ad3-5616-9756-27ced163f4d8', 'd66178e5-68ed-5bff-882a-07a89b782ed4', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('52d318f6-e607-5bdd-b821-e14d9513b0c7', 'd66178e5-68ed-5bff-882a-07a89b782ed4', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f84345d5-7d32-5687-97b3-c8de02adf43e', 'd66178e5-68ed-5bff-882a-07a89b782ed4', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0453590d-2f17-5bb9-a4ca-ed5d512613d9', 'd66178e5-68ed-5bff-882a-07a89b782ed4', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aafa3195-1650-5ac2-a50e-05a0d1813d0c', 'd66178e5-68ed-5bff-882a-07a89b782ed4', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('96fd936a-296d-5e76-8718-2440630d7efe', '6a448cc0-21b6-582e-8c4e-3205637a836d', 3, 'd66178e5-68ed-5bff-882a-07a89b782ed4') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('70c2dcc1-a603-526e-8dd0-a1898ca26104', 'DAY_70c2dcc1a603526e8dd0', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0f895b12-eace-5ec2-9ede-d096972859c4', '70c2dcc1-a603-526e-8dd0-a1898ca26104', 'es', '(Bolivia/Chile) – Retorno a San Pedro de Atacama', 'Tras el desayuno, salida desde el hotel rumbo a la frontera de Hito Cajón. Visitamos los Géiseres Sol de Mañana y, después del almuerzo, se realiza el cruce y el regreso a San Pedro de Atacama (Chile). Tras el regreso a San Pedro, se contempla una pausa para compras y almuerzo libre y por la tarde se continúa con la excursión a Laguna Cejar, conocida por sus aguas de alta salinidad y su entorno único en pleno desierto.
Alojamiento: No incluído', 'Desayuno, Almuerzo y Cocktail', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
commit;
