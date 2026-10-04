-- Generado por scripts/db/generate_blocks.py; ejecutar después de 00 y 01 y migración 003.
begin;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9e6e0d49-5b18-54dd-81d6-c5d300e4dd0b', '70c2dcc1-a603-526e-8dd0-a1898ca26104', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'ab7f5d6b-98c7-5505-8291-12ef1579af9a', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2e1f37be-7048-5c8f-a7df-27e375a40189', '70c2dcc1-a603-526e-8dd0-a1898ca26104', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('19b8c9b5-3061-56b1-90ed-c8f6ee928696', '70c2dcc1-a603-526e-8dd0-a1898ca26104', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('8a70251e-570d-5d5f-9054-24309789af0c', '6a448cc0-21b6-582e-8c4e-3205637a836d', 4, '70c2dcc1-a603-526e-8dd0-a1898ca26104') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('a190b5d3-6018-57a5-854f-3d1bdfb4fd2c', 'SPASPA-4D3N-PPTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'PPTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('fcd5a511-18f2-5dce-afc2-94110d27770f', 'DAY_fcd5a51118f25dceafc2', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('39f0bffb-1cf6-596a-ba47-b7fadc3ad3e1', 'fcd5a511-18f2-5dce-afc2-94110d27770f', 'es', 'Cruce Hito Cajón · Lagunas Altiplánicas · Villamar', 'Salida temprano desde San Pedro de Atacama rumbo a la frontera Hito Cajón para ingresar al altiplano boliviano. Desde los primeros kilómetros, el paisaje cambia por completo: se visitan la Laguna Blanca y la Laguna Verde, con el volcán Licancabur como telón de fondo, y luego el Desierto de Dalí, un escenario surreal de formaciones y colores. La ruta continúa hacia Uyuni.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('360d8110-7996-5bbf-8417-2121a75b9b4d', 'a190b5d3-6018-57a5-854f-3d1bdfb4fd2c', 1, 'fcd5a511-18f2-5dce-afc2-94110d27770f') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('6c21c239-a654-5200-bbfe-4579e6d3adce', 'DAY_6c21c239a6545200bbfe', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d374e2ac-9e9e-52e2-beef-1e11ab6c72d9', '6c21c239-a654-5200-bbfe-4579e6d3adce', 'es', '(Bolivia) –Full day en el Salar de Uyuni · Isla Incahuasi · Atardecer', 'Salar de Uyuni para vivir la experiencia completa del desierto de sal, incluyendo la visita a la Isla Incahuasi, con caminata y vistas panorámicas entre cactus gigantes. El almuerzo es un Apthapi servido en el salar y, al final del día, se vive uno de los momentos más especiales del programa: cóctel privado al atardecer sobre el salar.
Alojamiento: Hotel Palacio de Sal', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9b28001b-32f0-5200-8f78-8a6da1f455fb', 'a190b5d3-6018-57a5-854f-3d1bdfb4fd2c', 2, '6c21c239-a654-5200-bbfe-4579e6d3adce') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d42d1ee1-27e6-5666-b2c2-8223065310b1', 'DAY_d42d1ee127e65666b2c2', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('e05cc0bd-1c00-5efb-8a10-ea47b2898c6d', 'd42d1ee1-27e6-5666-b2c2-8223065310b1', 'es', '(Bolivia) – Cementerio de Trenes · Ruta altiplánica (Cañapa/Hedionda) · Desierto de Siloli · Regreso a zona Hedionda', 'Salida hacia Uyuni para visitar el Cementerio de Trenes, un ícono fotográfico de la historia ferroviaria del altiplano. Luego se continúa hacia el mirador del Volcán Ollagüe y se avanza hacia el sur, con paradas en paisajes de altura y lagunas altiplánicas como Cañapa, además de sectores cercanos a Hedionda. Durante la tarde se atraviesa el Desierto de Siloli, regresando posteriormente a la zona de Hedionda para el alojamiento.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('466e39aa-ee23-5960-b45b-0dfb7f787660', 'a190b5d3-6018-57a5-854f-3d1bdfb4fd2c', 3, 'd42d1ee1-27e6-5666-b2c2-8223065310b1') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('6f135a94-d697-59f9-bd03-7a0ba9ec39b6', 'DAY_6f135a94d69759f9bd03', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('75d00a7a-295d-5835-ae97-742fcf1d4064', '6f135a94-d697-59f9-bd03-7a0ba9ec39b6', 'es', '(Bolivia/Chile) – Retorno a San Pedro de Atacama', 'Tras el desayuno, salida desde el hotel rumbo a la frontera de Hito Cajón. Visitamos los Géiseres Sol de Mañana y, después del almuerzo, se realiza el cruce y el regreso a San Pedro de Atacama (Chile). Tras el regreso a San Pedro, se contempla una pausa para compras y almuerzo libre y por la tarde se continúa con la excursión a Laguna Cejar, conocida por sus aguas de alta salinidad y su entorno único en pleno desierto.
Alojamiento: No incluído', 'Desayuno, almuerzo, cocktail', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ad569973-15fa-51a6-836f-e143d76b7050', 'a190b5d3-6018-57a5-854f-3d1bdfb4fd2c', 4, '6f135a94-d697-59f9-bd03-7a0ba9ec39b6') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('5261a32b-19a9-5728-86fc-7a50ef522145', 'SPASPA-4D3N-ÑÑF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ÑÑF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('5c4f3c89-b3d3-5590-ae1a-0a7b3f3f654a', 'DAY_5c4f3c89b3d35590ae1a', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('678f3c1c-aa2b-50a6-9ca6-93360e69ce35', '5c4f3c89-b3d3-5590-ae1a-0a7b3f3f654a', 'es', 'Cruce Hito Cajón · Lagunas Altiplánicas', 'Salida temprano desde San Pedro de Atacama rumbo a la frontera Hito Cajón para ingresar al altiplano boliviano. Desde los primeros kilómetros, el paisaje cambia por completo: se visitan la Laguna Blanca y la Laguna Verde, con el volcán Licancabur como telón de fondo, y luego el Desierto de Dalí, un escenario surreal de formaciones y colores. La ruta continúa hacia Uyuni.
Alojamiento: Hotel coscaña', 'Almuerzo.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('8e67936f-3c47-5d3c-9568-652efd59ecd2', '5261a32b-19a9-5728-86fc-7a50ef522145', 1, '5c4f3c89-b3d3-5590-ae1a-0a7b3f3f654a') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('55c5ec18-7ab7-5dbf-b0ee-6244f9a31e92', 'DAY_55c5ec187ab75dbfb0ee', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('ce5f4e7c-6956-50eb-b8e0-cddaecf212ac', '55c5ec18-7ab7-5dbf-b0ee-6244f9a31e92', 'es', 'Full day en el Salar de Uyuni · Isla Incahuasi · Atardecer', 'Salar de Uyuni para vivir la experiencia completa del desierto de sal, incluyendo la visita a la Isla Incahuasi, con caminata y vistas panorámicas entre cactus gigantes. El almuerzo es un Apthapi servido en el salar y, al final del día, se vive uno de los momentos más especiales del programa: cóctel privado al atardecer sobre el salar.
Alojamiento: Hotel coscaña', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ff4cc498-e3b2-5aad-b521-833b21f4de25', '5261a32b-19a9-5728-86fc-7a50ef522145', 2, '55c5ec18-7ab7-5dbf-b0ee-6244f9a31e92') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('4a123d06-0bf5-55de-a465-fac5378f8d7f', 'DAY_4a123d060bf555dea465', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5ff49d49-2f7c-5beb-ba04-f62e4b679152', '4a123d06-0bf5-55de-a465-fac5378f8d7f', 'es', 'Cementerio de Trenes  · Desierto de Siloli · Regreso a zona Hedionda', 'Salida hacia Uyuni para visitar el Cementerio de Trenes, un ícono fotográfico de la historia ferroviaria del altiplano. Luego se continúa hacia el mirador del Volcán Ollagüe y se avanza hacia el sur, con paradas en paisajes de altura y lagunas altiplánicas como Cañapa, además de sectores cercanos a Hedionda. Durante la tarde se atraviesa el Desierto de Siloli, regresando posteriormente a la zona de Hedionda para el alojamiento.
Alojamiento: Hotel Flamencos', 'Desayuno, almuerzo y cena.', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d45bbcfc-bd8b-55cd-a422-4e6b1648f858', '5261a32b-19a9-5728-86fc-7a50ef522145', 3, '4a123d06-0bf5-55de-a465-fac5378f8d7f') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('1a9d13e4-26fc-5a22-8be8-cb3379870d3c', 'DAY_1a9d13e426fc5a228be8', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d302e778-eb3a-5953-bad2-4408af5ee0ee', '1a9d13e4-26fc-5a22-8be8-cb3379870d3c', 'es', 'Retorno a San Pedro de Atacama', 'Tras el desayuno, salida desde el hotel rumbo a la frontera de Hito Cajón. Visitamos los Géiseres Sol de Mañana y, después del almuerzo, se realiza el cruce y el regreso a San Pedro de Atacama (Chile).
Alojamiento: No incluído', 'Desayuno, almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('10d9470c-afdc-539c-9281-45f0cb4e283e', '5261a32b-19a9-5728-86fc-7a50ef522145', 4, '1a9d13e4-26fc-5a22-8be8-cb3379870d3c') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c91a565d-7596-56d9-99dd-057b212826da', 'SPASPA-4D3N-MPF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MPF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ad53a95b-807b-5888-8429-1ffc3fddd545', 'DAY_ad53a95b807b58888429', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8fea2d8a-d3a2-5df7-bbf3-cfc07acd318b', 'ad53a95b-807b-5888-8429-1ffc3fddd545', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano.  Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('8b0428bc-f02b-550c-a6c8-23930d95e998', 'c91a565d-7596-56d9-99dd-057b212826da', 1, 'ad53a95b-807b-5888-8429-1ffc3fddd545') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('dbe05a45-3410-58a4-888e-9d35ca3b7be8', 'DAY_dbe05a45341058a4888e', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0bba6081-2699-556f-8156-f13ff64934d8', 'dbe05a45-3410-58a4-888e-9d35ca3b7be8', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Palacio de Sal', 'Desayuno · Almuerzo · Cóctel · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a21c2b6e-7a6b-596f-9f0c-7697c1fe2bc5', 'c91a565d-7596-56d9-99dd-057b212826da', 2, 'dbe05a45-3410-58a4-888e-9d35ca3b7be8') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9911c4c4-fad8-5d0f-8383-995d5d25570c', 'DAY_9911c4c4fad85d0f8383', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('ab7ae312-32b0-5e22-922a-43026abcff94', '9911c4c4-fad8-5d0f-8383-995d5d25570c', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar. Luego continuaremos hacia las impresionantes Lagunas Altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Los Flamencos', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0618dfda-96c0-5b74-8dc7-d596fa185d6e', 'c91a565d-7596-56d9-99dd-057b212826da', 3, '9911c4c4-fad8-5d0f-8383-995d5d25570c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('438bd9c7-82c2-5bd9-8b60-227305f6027a', 'DAY_438bd9c782c25bd98b60', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('41157104-a4f8-528b-b050-0d0ac4f84662', '438bd9c7-82c2-5bd9-8b60-227305f6027a', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 17:00 hrs.', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Traslado San Pedro de Atacama', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6d1b5cd7-929c-502c-884e-468cfdbdb478', 'c91a565d-7596-56d9-99dd-057b212826da', 4, '438bd9c7-82c2-5bd9-8b60-227305f6027a') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('404dde3a-1709-511b-ae95-53bf62a55c77', 'SPASPA-4D3N-MLTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MLTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('21a7dba9-f579-5cb7-afb0-e460e5ea3d01', 'DAY_21a7dba9f5795cb7afb0', 'SPA', 'SPA', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('ec614aeb-a9f7-552e-9cf1-3b2e5f3579bf', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('61521d4f-8871-5095-bbe5-2ac5c6478f39', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('13a4961e-07cd-50c4-ac05-029e4479e9a6', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '130b15cd-e5e6-5d65-ba8b-4318a264f9cd', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1dee8917-7a46-5d15-a4b1-ffd61ae6a25a', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3f149e1d-1e43-587d-a23b-9cd47e90b32b', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('684e62a0-f48b-5a3a-a6ca-527a68585bd1', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('01826f66-aab6-53cb-929d-efd2863410be', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6d88ad92-e97e-5ab7-89f9-82b0c08b2dff', '21a7dba9-f579-5cb7-afb0-e460e5ea3d01', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7b701db0-c290-5725-a172-b8b224c0cf91', '404dde3a-1709-511b-ae95-53bf62a55c77', 1, '21a7dba9-f579-5cb7-afb0-e460e5ea3d01') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'DAY_b693eb40025d5ec3b23b', 'SPA', 'SPA', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f4d55bf6-680a-519c-937d-2fedfd99fc67', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Luna Salada', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c18ad946-e244-5b78-9433-f56755cfee81', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '130b15cd-e5e6-5d65-ba8b-4318a264f9cd', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('61ac670b-d9c6-5022-86e4-d2c18c452a7d', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6853c269-00a7-5ebf-b4bf-d3ee5b2c6a63', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e4b4373d-3bfb-59e6-a2af-d3d0450246a4', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c30fa4ee-1b6e-5bbc-91c5-00118d5b0087', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('020a05b6-1364-5221-a527-3fea3c1a81a2', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d8e33291-ceb4-5a31-b949-49366cd1c8b3', 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5187dd3a-19b6-5297-be01-4dd9a730a8ba', '404dde3a-1709-511b-ae95-53bf62a55c77', 2, 'b693eb40-025d-5ec3-b23b-4b442c8e0cc9') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7acd742b-c347-5f16-861f-10035db2d858', 'DAY_7acd742bc3475f16861f', 'SPA', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('737e60c4-c6c1-5610-af68-61d2bd049d1e', '7acd742b-c347-5f16-861f-10035db2d858', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar.Luego continuaremos hacia las impresionantes Lagunas Altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Taika del Desierto', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('940aca0e-35e6-5dc2-8adb-1e54edf6f649', '7acd742b-c347-5f16-861f-10035db2d858', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '130b15cd-e5e6-5d65-ba8b-4318a264f9cd', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2088efd6-a091-5d50-9dee-c4537ac6ca16', '7acd742b-c347-5f16-861f-10035db2d858', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bc82627b-00eb-5e4e-8f98-160357c7db42', '7acd742b-c347-5f16-861f-10035db2d858', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1aae0063-732d-5d84-a707-8ccda6b30e55', '7acd742b-c347-5f16-861f-10035db2d858', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b297e76f-ee56-5777-b370-4803906e496e', '7acd742b-c347-5f16-861f-10035db2d858', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1f5a147f-574d-5a8a-8ad6-1fbbd2843814', '7acd742b-c347-5f16-861f-10035db2d858', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9dd4f0d6-2c43-572c-80ec-aa35b739ca6f', '7acd742b-c347-5f16-861f-10035db2d858', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('93af2080-0ba9-5695-8086-eeeb29df9a87', '404dde3a-1709-511b-ae95-53bf62a55c77', 3, '7acd742b-c347-5f16-861f-10035db2d858') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('465dfc6a-9028-50a3-98af-05c77414e488', 'DAY_465dfc6a902850a398af', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('81d87934-59b6-56d2-9259-a51be6a4e2d1', '465dfc6a-9028-50a3-98af-05c77414e488', 'es', 'Sol de la Mañana · Hito Cajón  · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 17:00 hrs.', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('34d2f86b-423c-5e8d-9797-eb8b69e34d29', '465dfc6a-9028-50a3-98af-05c77414e488', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '130b15cd-e5e6-5d65-ba8b-4318a264f9cd', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2c0126dd-f510-5ed6-ba2b-0399e5f23f31', '465dfc6a-9028-50a3-98af-05c77414e488', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('015ccefd-ffe8-5561-bd41-dab4c7f94b9c', '465dfc6a-9028-50a3-98af-05c77414e488', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('83f98105-8d1d-5330-987a-c59ea255dcaf', '404dde3a-1709-511b-ae95-53bf62a55c77', 4, '465dfc6a-9028-50a3-98af-05c77414e488') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('8b65bf70-0fc6-5d02-ab76-6ca41a8db7df', 'SPASPA-4D3N-MLF', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MLF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('cdc2088b-7668-503a-ba6e-06bf08efaefb', 'DAY_cdc2088b7668503aba6e', 'SPA', 'SPA', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b7d636de-438f-5fe0-8e6c-b0b40ca47f37', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ee2df2a6-7d72-5508-a7d7-25582321c84a', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7a5e3636-d7da-53c1-b5dc-f1cb8c468914', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57324e96-cc9d-5a56-b4ce-05b7e1b5c395', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c035d57d-3703-5afc-8fdc-5a9aee647cd4', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('665d80c2-90c9-5fae-b84a-714456d89e67', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('316c7eb5-6495-55bf-af20-5263fefc7869', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('14ac7395-4b95-5c3d-bf4c-cd6a525a6a0f', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bf26f1fb-4e97-5439-a982-0c8f7ba954a3', 'cdc2088b-7668-503a-ba6e-06bf08efaefb', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('8afa29f8-5c34-542f-924a-b93ed38ccda8', '8b65bf70-0fc6-5d02-ab76-6ca41a8db7df', 1, 'cdc2088b-7668-503a-ba6e-06bf08efaefb') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('6f37f833-f61d-5131-bda0-2a3c57460372', 'DAY_6f37f833f61d5131bda0', 'SPA', 'SPA', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('1e5691e7-e310-5000-b490-12fc49ed9cd7', '6f37f833-f61d-5131-bda0-2a3c57460372', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Luna Salada', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c670c871-4399-55b1-bd6b-9ee29ad658e8', '6f37f833-f61d-5131-bda0-2a3c57460372', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57324e96-cc9d-5a56-b4ce-05b7e1b5c395', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f9c457af-3192-55e4-9fad-a833036ba904', '6f37f833-f61d-5131-bda0-2a3c57460372', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('05c57c36-20c0-53e5-92ae-3fe2062d4ac2', '6f37f833-f61d-5131-bda0-2a3c57460372', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c4a7b287-9adc-52f0-8fed-5b25262731a1', '6f37f833-f61d-5131-bda0-2a3c57460372', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c508f356-57d0-5e75-9e56-26fc9ddfeed4', '6f37f833-f61d-5131-bda0-2a3c57460372', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bacdd509-5e53-5704-9f73-1799b726eefb', '6f37f833-f61d-5131-bda0-2a3c57460372', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('66ebd6e5-2fe4-5d67-8c9d-0030c2b7b888', '6f37f833-f61d-5131-bda0-2a3c57460372', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('56e88a64-b739-5244-8500-36d0157fd22d', '8b65bf70-0fc6-5d02-ab76-6ca41a8db7df', 2, '6f37f833-f61d-5131-bda0-2a3c57460372') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d077e9ba-c9a6-56ac-bd01-6539d84641df', 'DAY_d077e9bac9a656acbd01', 'SPA', 'SPA', 'bd24d50a-2061-5524-99ef-fe971856685d', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('be05c7dc-b2df-54d2-b666-f280105aaa39', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar. Luego continuaremos hacia las impresionantes Lagunas Altiplánicas Cañapa, Ramaditas, Honda y Hedionda, hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Los Flamencos', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5107a4db-2741-55e1-a9f5-98b3211d9d7b', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57324e96-cc9d-5a56-b4ce-05b7e1b5c395', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a263859b-d7b9-5bdc-934e-94409d31cad9', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0cbe2894-095e-58de-8f69-ba96f6bd460a', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('88272309-44f9-5e92-9b51-49ccd0387473', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('88b6301c-8d1c-574b-ba88-575a16c2d1fe', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8d5e4590-5e09-5929-84e0-11e95e658530', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', '92d2369c-4c49-5ed1-a6b8-e8f164e175e6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('576aa949-383b-5722-8011-99fa52a72611', 'd077e9ba-c9a6-56ac-bd01-6539d84641df', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('b2e58335-d1d5-5e67-a288-5c9d145cdfe9', '8b65bf70-0fc6-5d02-ab76-6ca41a8db7df', 3, 'd077e9ba-c9a6-56ac-bd01-6539d84641df') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c1fc83e9-2db3-568e-8335-c657fc7b5482', 'DAY_c1fc83e92db3568e8335', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('39dc472a-b7f5-5ad4-9c0e-8966b0402059', 'c1fc83e9-2db3-568e-8335-c657fc7b5482', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 17:00 hrs.', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('41e03235-c2e5-5351-9782-cdca8899d247', 'c1fc83e9-2db3-568e-8335-c657fc7b5482', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '57324e96-cc9d-5a56-b4ce-05b7e1b5c395', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cbe0f1e8-acec-55f2-a5d4-f64ef750f54f', 'c1fc83e9-2db3-568e-8335-c657fc7b5482', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fa5e538c-454b-5909-b3bc-ac80d6cd6314', 'c1fc83e9-2db3-568e-8335-c657fc7b5482', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9ede9b5c-1249-55da-b752-1e392bfdf721', '8b65bf70-0fc6-5d02-ab76-6ca41a8db7df', 4, 'c1fc83e9-2db3-568e-8335-c657fc7b5482') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('f4a0ee78-4e36-59db-9bda-5b94d3f48edf', 'SPASPA-4D3N-MJF', '- VIP', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MJF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b6c4d840-a0f3-595f-a22f-357109b239e9', 'DAY_b6c4d840a0f3595fa22f', 'SPA', 'SPA', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('038b28f2-77bc-5fac-9e62-f608bdac804d', 'b6c4d840-a0f3-595f-a22f-357109b239e9', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0ccf5950-0dd4-5ad0-be2d-c755251b66aa', 'b6c4d840-a0f3-595f-a22f-357109b239e9', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8b29e8fa-cfda-5ded-8ddf-6ae6c4eaf7f6', 'b6c4d840-a0f3-595f-a22f-357109b239e9', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'c721be82-906d-579a-9d77-9c52550d4e0e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('55bf1e32-356e-569e-bc89-002710e1257a', 'b6c4d840-a0f3-595f-a22f-357109b239e9', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ec1b4db6-34ec-53d0-a800-90c5bfb2650e', 'b6c4d840-a0f3-595f-a22f-357109b239e9', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a0d49b2f-839e-5029-a0dd-e39bd7b15daf', 'b6c4d840-a0f3-595f-a22f-357109b239e9', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9ae98c40-b621-509b-8269-5a12af7b90c4', 'b6c4d840-a0f3-595f-a22f-357109b239e9', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('509a23ee-31a6-536c-bb76-fe35b6a395a0', 'b6c4d840-a0f3-595f-a22f-357109b239e9', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('719459e3-0401-52d8-a1e7-bb3e1c04db4f', 'f4a0ee78-4e36-59db-9bda-5b94d3f48edf', 1, 'b6c4d840-a0f3-595f-a22f-357109b239e9') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('007040af-388a-56cd-9f7a-3e7be37c8e37', 'DAY_007040af388a56cd9f7a', 'SPA', 'SPA', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8b8cc7b7-ac31-5532-9c1a-f00e891a6ade', '007040af-388a-56cd-9f7a-3e7be37c8e37', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Jardines de Uyuni', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('21771c79-4397-58a7-b621-d9b38ec7ab75', '007040af-388a-56cd-9f7a-3e7be37c8e37', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'c721be82-906d-579a-9d77-9c52550d4e0e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3c80693d-e762-5c68-b8da-6ee82cce1a02', '007040af-388a-56cd-9f7a-3e7be37c8e37', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('71d1c79f-95e0-5ec8-a513-c957c6bb92a3', '007040af-388a-56cd-9f7a-3e7be37c8e37', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1c2860ea-6b55-5eca-9230-6b86bb99bb97', '007040af-388a-56cd-9f7a-3e7be37c8e37', 'ecd656cd-9c28-55e2-b248-36bc8f5901ab', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f4053c63-8156-5866-a497-6b935205baed', '007040af-388a-56cd-9f7a-3e7be37c8e37', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('598714e6-3d5d-5425-a06f-e0a78d565de8', '007040af-388a-56cd-9f7a-3e7be37c8e37', '113ed8f7-8532-5bcf-85ff-c51e2c0cf91e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4bb71024-d856-5e03-a0b1-ef47b3a4566e', '007040af-388a-56cd-9f7a-3e7be37c8e37', 'c42e75f2-488a-52ed-863d-a740cc5d78cf', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('82fcbb70-ad23-55fa-bafc-937448588efc', 'f4a0ee78-4e36-59db-9bda-5b94d3f48edf', 2, '007040af-388a-56cd-9f7a-3e7be37c8e37') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'DAY_69f27ec594785e0aa6bf', 'SPA', 'SPA', 'bd24d50a-2061-5524-99ef-fe971856685d', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0b54fc9b-9337-5a38-b2bf-cba3151eeb17', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar.Luego continuaremos hacia las impresionantes Lagunas Altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Los Flamencos', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('03833bb8-5e2a-5d53-ba67-24566c323c12', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'c721be82-906d-579a-9d77-9c52550d4e0e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5f74a833-6ecf-5fe2-8032-fdb4b2ecbd47', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1e0f70f6-e3ae-58a2-ae0c-06dded039c1b', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8bb631d0-94bb-54fb-bcb8-fde2f0cf57a0', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ad3cc546-1afe-53cf-ab13-860c040790d6', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('11fafc65-c4f7-5dff-9e81-dc18faec3ef7', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', '92d2369c-4c49-5ed1-a6b8-e8f164e175e6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a7c06f2a-79d5-59ee-9f7a-b681538e2ca3', '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('523ea1e6-4f1b-575e-a666-899b6c290c6f', 'f4a0ee78-4e36-59db-9bda-5b94d3f48edf', 3, '69f27ec5-9478-5e0a-a6bf-76a5ddcdd56b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e2519bd6-c65e-5991-aa4f-cabac920c5bc', 'DAY_e2519bd6c65e5991aa4f', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('52e89bd0-8d25-5aa1-a7d1-d18fe5dd824c', 'e2519bd6-c65e-5991-aa4f-cabac920c5bc', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 17:00 hrs.', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('89f84990-be1c-5ba1-9a66-62fc15004a01', 'e2519bd6-c65e-5991-aa4f-cabac920c5bc', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'c721be82-906d-579a-9d77-9c52550d4e0e', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bb07e26e-7764-5098-936c-6163f2d29cf3', 'e2519bd6-c65e-5991-aa4f-cabac920c5bc', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('45d130d3-a1e8-5233-901a-30e234ca362b', 'e2519bd6-c65e-5991-aa4f-cabac920c5bc', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('918d3444-e3b6-59ff-be3d-a7efb47ab9d2', 'f4a0ee78-4e36-59db-9bda-5b94d3f48edf', 4, 'e2519bd6-c65e-5991-aa4f-cabac920c5bc') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('3fa5db59-25c2-50f6-a157-95689e6169b8', 'SPASPA-4D3N-MÑF', '- COMFORT', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'MÑF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('cf8527f1-e0ba-54c2-868c-1c981f1c226f', 'DAY_cf8527f1e0ba54c2868c', 'SPA', 'SPA', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('13714741-9342-5f87-b47a-3e809e384eb3', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama, cruzando la frontera por Hito Cajón. Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7537ba91-a4b7-518c-abea-5c38b9cb4655', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('203b19b2-98b5-5668-ad96-473ffceac965', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '5df105e6-8365-50ee-b6f5-fb695fcaea03', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('382f8cd7-5c16-58ff-8710-5845c1843d3f', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('59004d89-a666-59ce-857e-bc6e214be18b', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a23b8bac-7a19-54ac-aa6b-0c93a832d700', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('982ab2e6-d228-5fda-8d4b-e1b00b5a48c9', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4e7176d0-df0a-5d57-b7c4-1c6aa1543c8a', 'cf8527f1-e0ba-54c2-868c-1c981f1c226f', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('82ec716f-4047-5455-9107-b30e515f019b', '3fa5db59-25c2-50f6-a157-95689e6169b8', 1, 'cf8527f1-e0ba-54c2-868c-1c981f1c226f') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('fbe87465-5ad4-51e7-b65d-9481326b28ca', 'DAY_fbe874655ad451e7b65d', 'SPA', 'SPA', '4f92cc8a-a8c4-517f-987e-eb7142359327', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('2491cfe2-a81f-5fe1-ab6a-f775d22ccb06', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Coscaña', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ed11c35d-aab0-5f6d-bd7c-a3da95778197', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '5df105e6-8365-50ee-b6f5-fb695fcaea03', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('548380b8-2292-523a-ad68-fba63022fd57', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7fd5078c-cbed-5069-939e-5f9226c52bf0', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('40fa4ffe-5fbe-5ec8-aca5-40345bc76b27', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', '4e78b66d-0113-529a-a8f6-76bb10131eee', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3dc9aac7-0cbb-5f31-b62c-41f8aae2496c', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('97d5c3d7-ef18-5c1f-8ac5-9b72ab44dadb', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', 'c2f9b7ed-8467-50c7-b8ce-59ea4e66e40c', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f3a03667-b583-58c7-90ae-e19da43b09f4', 'fbe87465-5ad4-51e7-b65d-9481326b28ca', 'fa33cfd5-f099-5049-934f-ac1376653382', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('2525e7bd-3e90-55e3-bda2-9bc57ecd6136', '3fa5db59-25c2-50f6-a157-95689e6169b8', 2, 'fbe87465-5ad4-51e7-b65d-9481326b28ca') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'DAY_48b7ec45b3b450ac8899', 'SPA', 'SPA', 'bd24d50a-2061-5524-99ef-fe971856685d', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5ecb8fa6-2f6f-5da2-8b5e-377630409583', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar.Luego continuaremos hacia las impresionantes Lagunas Altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Los Flamencos', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1e60b4a2-6e64-5b57-a3d6-e888e98c254f', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '5df105e6-8365-50ee-b6f5-fb695fcaea03', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4630163f-68b7-5704-b9f3-23a4333647ec', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('71342233-9175-5469-89e8-ccb7d9c72eed', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', '015fa55a-5577-5427-9600-c6cf9b978c2d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bafa5cc3-86f1-5c8c-ac78-c9881d55dcc0', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'f92d93bc-655c-58ad-8845-13df28e39bf2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('db164312-d46c-53ee-a6a4-83ef8d9c0fea', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'bd24d50a-2061-5524-99ef-fe971856685d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e24a9f46-6c64-5464-b9f3-1174a2bfa51b', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', '92d2369c-4c49-5ed1-a6b8-e8f164e175e6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f90168cf-fd0b-549d-b59c-9ea0a898add6', '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3', 'aec9f8f8-05f3-507f-8d52-7c166f9ef710', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a8b90392-1dff-5936-a6c0-8f3fa2c1c68b', '3fa5db59-25c2-50f6-a157-95689e6169b8', 3, '48b7ec45-b3b4-50ac-8899-c0eacb1c92d3') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e6ce75bd-6d12-519e-9ce1-10fb85fc48be', 'DAY_e6ce75bd6d12519e9ce1', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('aca6cfaf-0667-59f2-a4d5-7c352560eb17', 'e6ce75bd-6d12-519e-9ce1-10fb85fc48be', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana (Hito Cajón) hacia San Pedro de Atacama antes de las 17:00 hrs.', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f5b8811a-6b5d-5dc2-9c4b-e1e1cea36853', 'e6ce75bd-6d12-519e-9ce1-10fb85fc48be', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '5df105e6-8365-50ee-b6f5-fb695fcaea03', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9cbe60f3-7dd9-565b-b13e-fb3c75aff122', 'e6ce75bd-6d12-519e-9ce1-10fb85fc48be', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('60b99df6-777d-5836-9d46-303ce7f8fa38', 'e6ce75bd-6d12-519e-9ce1-10fb85fc48be', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('df7ad98d-afa1-5b64-a20d-0748270e5ccc', '3fa5db59-25c2-50f6-a157-95689e6169b8', 4, 'e6ce75bd-6d12-519e-9ce1-10fb85fc48be') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c3223fde-2544-572e-a5dc-2d6c3639cfc9', 'SPASPA-4D3N-ScKS', 'BUDGET', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScKS', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('65082245-300c-5ac0-abeb-e91303eb0f7b', 'DAY_65082245300c5ac0abeb', 'SPA', 'SPA', '9fcea26f-f535-501a-9508-669b2826c68a', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('dcc716e5-e69b-521c-8a25-3ab5de9371a6', '65082245-300c-5ac0-abeb-e91303eb0f7b', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde comenzará la travesía en 4x4 por el altiplano boliviano. Durante el recorrido visitarán la Laguna Blanca, la Laguna Verde, el Desierto de Dalí, los Géiseres Sol de la Mañana (4.900 msnm), uno de los campos geotérmicos más altos del mundo, y la impactante Laguna Colorada (4.278 msnm), importante hábitat de flamencos andinos. La ruta continúa por el Desierto de Siloli y por las hermosas lagunas Cañapa y Hedionda, dos joyas del altiplano rodeadas de volcanes y paisajes de gran altura, reconocidas por su belleza natural y por la presencia de flamencos. Al final del día, llegada al alojamiento en el tradicional pueblo minero de San Cristóbal.
Alojamiento: Hotel San Cristóbal', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('18f62b16-6f38-542c-8024-96418eca9138', '65082245-300c-5ac0-abeb-e91303eb0f7b', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('33d73604-c26a-5720-8107-8229805d5131', '65082245-300c-5ac0-abeb-e91303eb0f7b', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'e97917f5-2d59-57e7-9b8e-d0c4444da2ba', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a5246bac-9d84-5d48-8dad-c7b063ab9dbb', '65082245-300c-5ac0-abeb-e91303eb0f7b', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d567d4da-6e7d-58f2-a58a-da26e2420297', '65082245-300c-5ac0-abeb-e91303eb0f7b', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dd9fcbd8-d208-59aa-afe8-2760be0b4997', '65082245-300c-5ac0-abeb-e91303eb0f7b', '36bd47e9-e8ad-52c5-8f11-a95026312775', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('61bab0e8-914c-51d4-b681-c7059904ecad', '65082245-300c-5ac0-abeb-e91303eb0f7b', '9fcea26f-f535-501a-9508-669b2826c68a', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0e6f21d9-2bf5-555c-ac5c-cfff380f49bc', '65082245-300c-5ac0-abeb-e91303eb0f7b', 'c6094766-4e08-5a6e-a1cf-43e8aad3b74a', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a9700a2d-bae0-5275-b7bc-9d9efad81d7a', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 1, '65082245-300c-5ac0-abeb-e91303eb0f7b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('15750df7-e01f-5eb7-8c08-cb75acf6063c', 'DAY_15750df7e01f5eb78c08', 'SPA', 'SPA', 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5e14b1b5-9865-5883-890a-6c8a8213471e', '15750df7-e01f-5eb7-8c08-cb75acf6063c', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Durante la jornada disfrutarán de un almuerzo tipo apthapi en medio del salar y luego explorarán la famosa Isla Incahuasi, hogar de cactus gigantes y antiguas formaciones de coral fosilizado. Más tarde, vivirán la magia del salar con un cóctel al atardecer, en uno de los escenarios más impresionantes de Bolivia.
Alojamiento: Hotel Kachi', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c6c86e8f-a54b-5110-96d9-9491141b9379', '15750df7-e01f-5eb7-8c08-cb75acf6063c', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'e97917f5-2d59-57e7-9b8e-d0c4444da2ba', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('662a0f51-c10a-5f02-a93c-3f472b917caf', '15750df7-e01f-5eb7-8c08-cb75acf6063c', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b4797e7a-0df4-52c7-a48e-2e9b95222a93', '15750df7-e01f-5eb7-8c08-cb75acf6063c', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f5af5754-52dc-584b-9fc3-ef656ed18e11', '15750df7-e01f-5eb7-8c08-cb75acf6063c', 'a9f5afb8-374d-5c0c-8413-99aaae578359', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1f926900-8e52-574c-9870-4786babd9197', '15750df7-e01f-5eb7-8c08-cb75acf6063c', 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('42b559c6-e098-56f6-8fc0-3daec4e813ff', '15750df7-e01f-5eb7-8c08-cb75acf6063c', '3f93d6d1-5344-5390-aade-fe9b9be74129', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('15579aec-1773-56ba-bd02-3cda77208d6d', '15750df7-e01f-5eb7-8c08-cb75acf6063c', '7542eeab-7698-5514-b7bc-d3ac470b03f4', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('c0281662-19ec-553f-ab0b-d826ed6eceba', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 2, '15750df7-e01f-5eb7-8c08-cb75acf6063c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('844c3687-179e-5017-aa29-bf27c944c9e4', 'DAY_844c3687179e5017aa29', 'SPA', 'SPA', 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('82fc5f3e-f01d-5e29-8de3-e615acd118b7', '844c3687-179e-5017-aa29-bf27c944c9e4', 'es', 'Valle de las Rocas · Cañón de la Anaconda · Termas de Polques', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, moldeado por siglos de erosión natural. En el camino también se visitará el mirador de la Laguna Capina, antes de continuar hacia las Termas de Polques, donde podrán relajarse en sus aguas termales naturales rodeadas de paisajes altiplánicos únicos.
Alojamiento: Hostel Sky Dream', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('af51aaed-93f5-5bc4-87ec-e5e391ca9486', '844c3687-179e-5017-aa29-bf27c944c9e4', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'e97917f5-2d59-57e7-9b8e-d0c4444da2ba', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('73ab6c3e-de8c-5f1c-b7cf-e518c9164cd6', '844c3687-179e-5017-aa29-bf27c944c9e4', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f65db862-fd31-5fdf-9652-a03b3ce3544b', '844c3687-179e-5017-aa29-bf27c944c9e4', '81270178-5ac4-5c82-b566-4c7d3224b368', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('30477816-8332-511d-92e0-5494851985be', '844c3687-179e-5017-aa29-bf27c944c9e4', 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('96bea32e-86a1-5018-a149-75f390e97c2b', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 3, '844c3687-179e-5017-aa29-bf27c944c9e4') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('cc0b7f47-e562-52bb-8637-e33ccd068e87', 'DAY_cc0b7f47e56252bb8637', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f3709d20-6f7f-5370-87d3-d913eaeeee9d', 'cc0b7f47-e562-52bb-8637-e33ccd068e87', 'es', 'Sol de la Mañana · Laguna Verde · Hito Cajón · San Pedro de Atacama', 'Salida temprano por la mañana para visitar el campo geotérmico Sol de la Mañana, una zona de intensa actividad volcánica con fumarolas y pequeños cráteres de barro hirviendo. Luego continuarán atravesando el Desierto de Dalí y visitarán la Laguna Verde y la Laguna Blanca, ubicadas al pie del majestuoso volcán Licancabur. Finalmente, traslado hacia la frontera en Hito Cajón y continuación en vehículo chileno hacia San Pedro de Atacama, con llegada prevista antes de las 14:00 hrs.', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('22bf9fbf-ae26-533d-8555-04ba2931ce7b', 'cc0b7f47-e562-52bb-8637-e33ccd068e87', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'e97917f5-2d59-57e7-9b8e-d0c4444da2ba', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('977e226b-a650-52f8-acca-c85e6bedc956', 'cc0b7f47-e562-52bb-8637-e33ccd068e87', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5849a2ad-7acd-54a9-b2b6-594f3337be3f', 'cc0b7f47-e562-52bb-8637-e33ccd068e87', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d6292eb3-4783-515e-8592-ffe2c843c87c', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 4, 'cc0b7f47-e562-52bb-8637-e33ccd068e87') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 'SPASPA-4D3N-MPTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'VIP', 'MPTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9b533833-c809-50b8-bd5f-1777d9931e5b', 'DAY_9b533833c80950b8bd5f', 'SPA', 'SPA', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5db9f49b-853e-5c18-a00d-6bfd228c0c2c', '9b533833-c809-50b8-bd5f-1777d9931e5b', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('260d5d98-38e1-5409-9ccd-9a42184ce10b', '9b533833-c809-50b8-bd5f-1777d9931e5b', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f8285ba4-1ea0-572f-b32b-71823e3c1035', '9b533833-c809-50b8-bd5f-1777d9931e5b', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dcacd4d0-d4c0-5dbc-954b-5b0499b5056d', '9b533833-c809-50b8-bd5f-1777d9931e5b', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aae24286-c225-567b-8fba-e6a3810e5809', '9b533833-c809-50b8-bd5f-1777d9931e5b', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('085e686d-df51-5389-862a-2a098eb992a5', '9b533833-c809-50b8-bd5f-1777d9931e5b', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4418647b-0e65-5644-a2d9-48b18ceb0ee4', '9b533833-c809-50b8-bd5f-1777d9931e5b', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cd912ebf-edc3-5838-a988-49d31f5b107d', '9b533833-c809-50b8-bd5f-1777d9931e5b', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('50b05c6f-02de-547a-9420-a57db9c62fd5', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 1, '9b533833-c809-50b8-bd5f-1777d9931e5b') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c163a3d2-b869-59a6-893b-9101f90fdd6d', 'DAY_c163a3d2b86959a6893b', 'SPA', 'SPA', '6695d424-92d7-5de0-91d4-b950ad466be1', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a0656d0f-7756-5039-b2b8-619d86f20385', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Palacio Sal', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('abc22771-8414-57a1-908b-219b9e22da75', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('02d48c01-3ca7-54ca-a6d9-96850f2c3595', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a68ff5a5-eca0-57db-a42d-fb655cf53f09', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('77053503-2f2b-5a8e-b2ef-06a6e67452e6', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2b273e7b-e74c-59cf-ad81-c498245cd6f0', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8ac16f92-5e1b-542e-a643-543ec91f2382', 'c163a3d2-b869-59a6-893b-9101f90fdd6d', '5ee76308-b296-5d44-aacb-a874b1c2b6fe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0acd965c-2442-5641-a87a-b35b7e6afc5f', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 2, 'c163a3d2-b869-59a6-893b-9101f90fdd6d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('461eb32f-39f6-5f6c-a68c-53777d270336', 'DAY_461eb32f39f65f6ca68c', 'SPA', 'SPA', 'f36e2c3f-b286-5781-9928-155a28b45931', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bd8e40fa-6a2d-5553-9a39-627175eca649', '461eb32f-39f6-5f6c-a68c-53777d270336', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar.Luego continuaremos hacia las impresionantes Lagunas Altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c900b72f-43df-58eb-b5f2-16af9d96bc14', '461eb32f-39f6-5f6c-a68c-53777d270336', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b4be1ffa-b1a9-58bb-a792-504bc0e99642', '461eb32f-39f6-5f6c-a68c-53777d270336', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0cd52475-b82f-53ad-838a-ff852604f3d2', '461eb32f-39f6-5f6c-a68c-53777d270336', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('431f86d2-fd79-5897-a73f-254879af9e93', '461eb32f-39f6-5f6c-a68c-53777d270336', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ef677aee-79d2-5b07-a036-7d9052ceefcf', '461eb32f-39f6-5f6c-a68c-53777d270336', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6703ff03-8e54-5d24-83b4-fe117eb6ffdb', '461eb32f-39f6-5f6c-a68c-53777d270336', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dd1f20db-f35c-5fe4-9646-196f6acdfe16', '461eb32f-39f6-5f6c-a68c-53777d270336', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('977da2c6-efe8-5b65-af75-e2ec264c8ffa', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 3, '461eb32f-39f6-5f6c-a68c-53777d270336') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c482a1aa-0865-5cf8-89a0-9dc685f2b838', 'DAY_c482a1aa08655cf889a0', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('c06edbea-3ee0-51bb-b465-233dea816286', 'c482a1aa-0865-5cf8-89a0-9dc685f2b838', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur.', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ad0d3260-da1c-599d-8935-9ae183ab0ddc', 'c482a1aa-0865-5cf8-89a0-9dc685f2b838', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bfddea5a-a9f3-5bbb-a633-2a59b3ac65ab', 'c482a1aa-0865-5cf8-89a0-9dc685f2b838', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5ab26695-c07b-5ecd-855a-34297f50d9b9', 'c482a1aa-0865-5cf8-89a0-9dc685f2b838', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ab859f85-a26c-53bf-8f2f-a42f64532a2c', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 4, 'c482a1aa-0865-5cf8-89a0-9dc685f2b838') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 'SPASPA-4D3N-ScLM', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScLM', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('4c1c4b0a-c5be-5146-9eb5-1e9db3d614c4', 'DAY_4c1c4b0ac5be51469eb5', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('abbfe3c3-defc-5f35-9504-fd7353d508e4', '4c1c4b0a-c5be-5146-9eb5-1e9db3d614c4', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama, Chile, cruzando la frontera por Hito Cajón, donde comienza el recorrido en 4x4 por el Altiplano boliviano. Durante el recorrido, visitarás la Laguna Blanca, la Laguna Verde, el Desierto de Dalí y la impresionante Laguna Colorada, situada a 4.278 metros sobre el nivel del mar y conocida por ser un importante hábitat para los flamencos andinos. La ruta continúa por el desierto de Siloli y las hermosas lagunas de Cañapa y Hedionda.
Alojamiento: Hotel Nativo San Cristóbal', 'Desayuno-Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('2530f25f-0d30-5245-8da5-63831386a118', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 1, '4c1c4b0a-c5be-5146-9eb5-1e9db3d614c4') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('fda3a911-72f8-536c-ace2-8260761b0504', 'DAY_fda3a91172f8536cace2', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d9eee6cb-dc11-569b-8730-780f20d0e41c', 'fda3a911-72f8-536c-ace2-8260761b0504', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Salida hacia Uyuni con una visita al emblemático Cementerio de Trenes. A continuación, visita al pueblo artesanal de Colchani antes de adentrarnos en el inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y, después, explora la famosa isla de Incahuasi, donde se encuentran cactus gigantes y formaciones de coral fosilizado. El almuerzo se servirá al estilo Apthapi en el salar. Posteriormente, el recorrido continúa hacia el hotel.
Alojamiento: Hotel Luna Salada', 'Desayuno - Almuerzo - Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1d4941f3-1e80-5d69-95bc-5cbd9742a706', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 2, 'fda3a911-72f8-536c-ace2-8260761b0504') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b22a70d8-35b9-56d1-a3ed-f239342715e6', 'DAY_b22a70d835b956d1a3ed', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('2e6b2ff8-e696-53a8-9f43-7e059286d235', 'b22a70d8-35b9-56d1-a3ed-f239342715e6', 'es', 'Valle de las Rocas · Lagunas Altiplanicas · Villa Mar', 'Después del desayuno, la ruta incluirá el Valle de las Rocas, la Laguna Turquiri, la Laguna Cañapa, la Laguna Hedionda y la Laguna Pastos Grandes, atravesando algunas zonas muy pintorescas del Altiplano boliviano con numerosas oportunidades para avistar llamas y fauna andina. Al final del día, el grupo continuará hacia Villa Mar, donde pasará la noche.
Alojamiento: Hotel Mallku cueva', 'Desayuno- Almuerzo - Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('fedb284b-5e4f-58ed-8a8f-1f46a8347f66', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 3, 'b22a70d8-35b9-56d1-a3ed-f239342715e6') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('693a2da0-3124-5528-a0ac-d7b271509887', 'DAY_693a2da031245528a0ac', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('262387bd-79bc-5288-b443-8b58eebe28ab', '693a2da0-3124-5528-a0ac-d7b271509887', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de Mañana, situados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica genera fumarolas y pozos de barro hirviente. La ruta continúa hacia las aguas termales de Polques, donde podrás relajarte en aguas termales naturales. A continuación, atravesaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, situadas a los pies del volcán Licancabur. Traslado en vehículo chileno desde la frontera con Bolivia, en Hito Cajón, hasta San Pedro de Atacama antes de las 17:00 horas.
Alojamiento: No incluído', 'Desayuno - Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a4d48e4a-36db-5262-849c-69e1f1c35637', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 4, '693a2da0-3124-5528-a0ac-d7b271509887') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c477b3db-8f69-55be-8feb-99acfe1442ae', 'SPASPA-4D3N-ScJF', 'San Pedro de Atacama → Uyuni → San Pedro de Atacama', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScJF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9d5f3057-9267-5a81-b4e2-20c1bdc8445c', 'DAY_9d5f305792675a81b4e2', 'SPA', 'SPA', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('52447d97-f779-5bb2-a06e-4a84c0eeb165', '9d5f3057-9267-5a81-b4e2-20c1bdc8445c', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde su hotel en San Pedro de Atacama, Chile, atravesando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura a través de los espectaculares paisajes del altiplano boliviano.
Alojamiento: Hotel San Cristóbal', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f58de55d-97cb-53d1-9a82-3ae97c12fb4c', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 1, '9d5f3057-9267-5a81-b4e2-20c1bdc8445c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('10595537-ec19-5ea2-be2b-232e639f9239', 'DAY_10595537ec195ea2be2b', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('6a3f69db-ca06-56bd-9f26-18120b2dbbf3', '10595537-ec19-5ea2-be2b-232e639f9239', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, esculpido durante siglos por la erosión natural.
Alojamiento: Hotel Jardines de Uyuni o similar', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('828cec7a-c594-55df-9c10-316259c5dab2', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 2, '10595537-ec19-5ea2-be2b-232e639f9239') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9a75bcce-9fcb-5f28-965d-8e3a672d1560', 'DAY_9a75bcce9fcb5f28965d', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0ec07128-2484-57a5-baab-471be4aa16ec', '9a75bcce-9fcb-5f28-965d-8e3a672d1560', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Almuerzo en medio del salar y, posteriormente, exploración de la famosa Isla Incahuasi, conocida por sus cactus gigantes y sus formaciones de coral fosilizado.
Alojamiento: Hotel Los Flamencos, Laguna Hedionda', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5e9a4926-12b1-59f2-90e9-576dc3764d5a', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 3, '9a75bcce-9fcb-5f28-965d-8e3a672d1560') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e56dec3a-f1c2-5924-8cf0-c5aa86e0e9fe', 'DAY_e56dec3af1c259248cf0', 'SPA', 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('e671e0a5-2533-5c79-bcb7-9ab5698c8142', 'e56dec3a-f1c2-5924-8cf0-c5aa86e0e9fe', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continuación hacia las Termas de Polques, donde podrán relajarse en sus aguas termales naturales. Posteriormente, atravesaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, ubicadas a los pies del volcán Licancabur.
Alojamiento: No incluido', NULL, NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6937ac63-a72d-5b81-b531-f6818fef3b7d', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 4, 'e56dec3a-f1c2-5924-8cf0-c5aa86e0e9fe') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('3c12f644-8b4f-5008-aeff-19ba0095bf22', 'SPASPA-4D3N-ScJTd', 'San Pedro de Atacama → Uyuni → San Pedro de Atacama', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScJTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('fe929e57-a7e5-576b-918c-572285ebc085', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 1, '9d5f3057-9267-5a81-b4e2-20c1bdc8445c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f4772847-4a44-5aac-97a2-c1dbe3bc4b35', 'DAY_f47728474a445aac97a2', 'SPA', 'SPA', NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('575f848d-a866-5da4-9816-f1805d9509e6', 'f4772847-4a44-5aac-97a2-c1dbe3bc4b35', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, esculpido durante siglos por la erosión natural.
Alojamiento: Hotel Jardines de Uyuni', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('94d4f694-97ec-51b3-b7a2-9fa205f8a281', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 2, 'f4772847-4a44-5aac-97a2-c1dbe3bc4b35') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('0152e3be-61d0-5038-9890-9d8d5e21e9f4', 'DAY_0152e3be61d050389890', 'SPA', 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('b6b9a5a4-8393-55bb-a827-5fbb5fa1305d', '0152e3be-61d0-5038-9890-9d8d5e21e9f4', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Almuerzo en medio del salar y, posteriormente, exploración de la famosa Isla Incahuasi, conocida por sus cactus gigantes y sus formaciones de coral fosilizado.
Alojamiento: Hotel Tayka del desierto.', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9cd3b098-8880-5812-96a9-7182005a1782', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 3, '0152e3be-61d0-5038-9890-9d8d5e21e9f4') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f6f78d92-a800-5e69-8def-98b2aa82c62b', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 4, 'e56dec3a-f1c2-5924-8cf0-c5aa86e0e9fe') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('1ed64259-6796-539d-9889-291da5798c6a', 'UYUUYU-3D2N-PF', 'ITINERARIO DETALLADO – UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'PF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('07268fb4-fcc3-5624-b7b0-d2ccaff1b414', 'DAY_07268fb4fcc35624b7b0', 'UYU', 'UYU', NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('3606905c-3b14-5186-9ed7-3648e02fffd8', '07268fb4-fcc3-5624-b7b0-d2ccaff1b414', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7bd120db-3ffe-58af-8a6c-57dc4411e572', '1ed64259-6796-539d-9889-291da5798c6a', 1, '07268fb4-fcc3-5624-b7b0-d2ccaff1b414') on conflict do nothing;
commit;
