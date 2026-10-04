-- Generado por scripts/db/generate_blocks.py; ejecutar después de 00 y 01 y migración 003.
begin;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('70683062-6b11-56b3-add6-9b0f8cf4b1b6', '4807af0a-ed58-5cfd-b267-1722f8349468', '3f93d6d1-5344-5390-aade-fe9b9be74129', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4ff76a58-215b-5ba7-b5fa-1410d1a1f175', '4807af0a-ed58-5cfd-b267-1722f8349468', '7542eeab-7698-5514-b7bc-d3ac470b03f4', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('c0281662-19ec-553f-ab0b-d826ed6eceba', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 2, '4807af0a-ed58-5cfd-b267-1722f8349468') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('a4449cea-da27-5648-a65b-49539d0c4043', 'DAY_a4449ceada275648a65b', NULL, NULL, 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('d38fa33c-ca91-57e4-910c-7e1dba476c86', 'a4449cea-da27-5648-a65b-49539d0c4043', 'es', 'Valle de las Rocas · Cañón de la Anaconda · Termas de Polques', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, moldeado por siglos de erosión natural. En el camino también se visitará el mirador de la Laguna Capina, antes de continuar hacia las Termas de Polques, donde podrán relajarse en sus aguas termales naturales rodeadas de paisajes altiplánicos únicos.
Alojamiento: Hostel Sky Dream', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('66ca7bd3-4a58-523b-a618-dcbe00fcccd8', 'a4449cea-da27-5648-a65b-49539d0c4043', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'e97917f5-2d59-57e7-9b8e-d0c4444da2ba', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c469a22b-413f-550b-acf3-a9a3ce2b8b29', 'a4449cea-da27-5648-a65b-49539d0c4043', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dc3c1f50-081f-55b0-953f-cec22dc0aefb', 'a4449cea-da27-5648-a65b-49539d0c4043', '81270178-5ac4-5c82-b566-4c7d3224b368', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5f12d294-70e3-5516-83da-6363fe086505', 'a4449cea-da27-5648-a65b-49539d0c4043', 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('96bea32e-86a1-5018-a149-75f390e97c2b', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 3, 'a4449cea-da27-5648-a65b-49539d0c4043') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f0ee29cd-734b-55cf-be2e-c5315fd3ce68', 'DAY_f0ee29cd734b55cfbe2e', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('edf91a9b-3963-5fa8-9f5f-0b2d246bab12', 'f0ee29cd-734b-55cf-be2e-c5315fd3ce68', 'es', 'Sol de la Mañana · Laguna Verde · Hito Cajón · San Pedro de Atacama', 'Salida temprano por la mañana para visitar el campo geotérmico Sol de la Mañana, una zona de intensa actividad volcánica con fumarolas y pequeños cráteres de barro hirviendo. Luego continuarán atravesando el Desierto de Dalí y visitarán la Laguna Verde y la Laguna Blanca, ubicadas al pie del majestuoso volcán Licancabur. Finalmente, traslado hacia la frontera en Hito Cajón y continuación en vehículo chileno hacia San Pedro de Atacama, con llegada prevista antes de las 14:00 hrs.', 'Desayuno · Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9b7749dd-5977-5a85-9bdb-ed916ae13aa2', 'f0ee29cd-734b-55cf-be2e-c5315fd3ce68', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, 'e97917f5-2d59-57e7-9b8e-d0c4444da2ba', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('580b12c5-52e6-5e57-8e83-a7a2ff4f468e', 'f0ee29cd-734b-55cf-be2e-c5315fd3ce68', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5ab7bd00-42c6-5eb8-89d8-37a22ca5da5d', 'f0ee29cd-734b-55cf-be2e-c5315fd3ce68', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('d6292eb3-4783-515e-8592-ffe2c843c87c', 'c3223fde-2544-572e-a5dc-2d6c3639cfc9', 4, 'f0ee29cd-734b-55cf-be2e-c5315fd3ce68') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 'SPASPA-4D3N-MPTd', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'VIP', 'MPTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "10 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f51c04d2-bf97-555d-acc5-1291e875ef28', 'DAY_f51c04d2bf97555dacc5', 'SPA', NULL, 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('55acca32-ed43-5187-96f7-6eec55c10156', 'f51c04d2-bf97-555d-acc5-1291e875ef28', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde tu hotel en San Pedro de Atacama (Chile), cruzando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura por los paisajes más espectaculares del altiplano boliviano. Durante el día visitarás la Laguna Blanca, Laguna Verde, el surrealista Desierto Dalí, el campo geotérmico de los Géiseres Sol de Mañana y la espectacular Laguna Colorada antes de continuar hacia Villamar.
Alojamiento: Hotel Mallku Cueva', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('25ed6331-0ad0-5f61-ab7c-111e0140089b', 'f51c04d2-bf97-555d-acc5-1291e875ef28', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b4f490f0-e89a-5fa5-b034-d406c67fc11b', 'f51c04d2-bf97-555d-acc5-1291e875ef28', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('071df133-b635-5f25-a4be-3f817d8b0f13', 'f51c04d2-bf97-555d-acc5-1291e875ef28', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('224e32e6-edb7-53e6-8529-11209af1c1f0', 'f51c04d2-bf97-555d-acc5-1291e875ef28', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c408bd2c-048d-5298-8c4a-7f651be06c6f', 'f51c04d2-bf97-555d-acc5-1291e875ef28', '59512cf2-1c0a-576e-9c53-6e1ec8c1172e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5172f9d3-d3f8-5c98-880d-6632217a5685', 'f51c04d2-bf97-555d-acc5-1291e875ef28', 'f39a9af2-050b-56fd-842c-8b4147abacf3', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4820cf65-7b8c-5212-ad3e-571da4487167', 'f51c04d2-bf97-555d-acc5-1291e875ef28', '14e52856-4094-58b2-ac71-3742609a3cc6', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('50b05c6f-02de-547a-9420-a57db9c62fd5', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 1, 'f51c04d2-bf97-555d-acc5-1291e875ef28') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('eeb0934c-b8ed-5fac-bdb8-6148602c9386', 'DAY_eeb0934cb8ed5facbdb8', NULL, NULL, '6695d424-92d7-5de0-91d4-b950ad466be1', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('1fc2a579-48a9-59cf-b138-e622ff9cec96', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, formado por siglos de erosión natural. El día termina en Uyuni con una visita al icónico Cementerio de Trenes. Por la tarde, disfruta de una experiencia privada de cóctel al atardecer, rodeado por el infinito horizonte blanco del desierto de sal.
Alojamiento: Hotel Palacio Sal', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9a834311-b635-5b86-a53a-8fad0c820716', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aa9064fa-d726-5c86-b339-91f7105e4cb0', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('70d840fc-347b-55fc-aa9c-92704e852146', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a68880fe-6402-5213-af1e-009cb329b166', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f9a5fac8-558e-5133-a564-5f9b2ba8beaa', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('570bca27-d293-5632-994a-9785d167b16c', 'eeb0934c-b8ed-5fac-bdb8-6148602c9386', '5ee76308-b296-5d44-aacb-a874b1c2b6fe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0acd965c-2442-5641-a87a-b35b7e6afc5f', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 2, 'eeb0934c-b8ed-5fac-bdb8-6148602c9386') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'DAY_c19ff14ac5965d7eaf6c', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('321ee660-74df-574d-8e1c-577f9cccc293', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita el pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y luego explora la famosa Isla Incahuasi, hogar de cactus gigantes y formaciones de coral fosilizado. Almuerzo tipo apthapi en el salar.Luego continuaremos hacia las impresionantes Lagunas Altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — hábitat natural de cientos de flamencos dentro de un extraordinario paisaje andino. Posteriormente cruzaremos el Desierto de Siloli, rodeado de volcanes de colores y extensas planicies de altura.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno · Almuerzo · Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('774b832e-2222-5e21-a070-242daf8d7e3c', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f22cea73-9b79-561e-b968-d348f783b5d8', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bdca94ba-d78a-5cce-b732-6a839435f8e7', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9f728fc9-8ea6-5327-9e2c-5ef9215af164', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('58adda83-9fb4-5ef5-ab00-a9055a16c133', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1296cb86-4a8b-54d1-b68c-4d3ba5c24433', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('68f5b9fc-17d0-5c1e-b4de-9d1c7d63d2c6', 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('977da2c6-efe8-5b65-af75-e2ec264c8ffa', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 3, 'c19ff14a-c596-5d7e-af6c-1dc21eb4958c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('016bd8bb-1855-5344-9bed-61b9d639b3c9', 'DAY_016bd8bb185553449bed', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('95908f61-5a71-5d3d-8869-cd1f06f8b59b', '016bd8bb-1855-5344-9bed-61b9d639b3c9', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica crea fumarolas y pozas de barro hirviendo. Continuación hacia las Termas de Polques, donde podrás relajarte en aguas termales naturales. Luego cruzarás el surrealista Desierto Dalí y visitarás la Laguna Verde y la Laguna Blanca al pie del volcán Licancabur.', 'Desayuno · Almuerzo · Cóctel', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8db63319-481e-59e8-a4e6-e03b0a1902cf', '016bd8bb-1855-5344-9bed-61b9d639b3c9', 'd8f8d0be-6630-5995-b346-0f6e19bf805a', 1, true, 4, '7b1db39a-a16c-5789-8d8b-41609b6ce0dc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d20a1da3-a8b6-57ea-acf7-cfbd094fff0f', '016bd8bb-1855-5344-9bed-61b9d639b3c9', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5876254f-1de3-5751-95ed-6662ab0c3ff5', '016bd8bb-1855-5344-9bed-61b9d639b3c9', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('ab859f85-a26c-53bf-8f2f-a42f64532a2c', 'a5b84943-3684-5aa2-9ef4-fb6ffe12f538', 4, '016bd8bb-1855-5344-9bed-61b9d639b3c9') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 'SPASPA-4D3N-ScLM', 'ITINERARIO DETALLADO – SAN PEDRO DE ATACAMA → UYUNI →SAN PEDRO DE ATACAMA', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScLM', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ecbde376-79df-51c2-a499-1b18ad51b1dc', 'DAY_ecbde37679df51c2a499', 'SPA', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('990aa648-8c21-540a-8318-bf316f0a63cc', 'ecbde376-79df-51c2-a499-1b18ad51b1dc', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde San Pedro de Atacama, Chile, cruzando la frontera por Hito Cajón, donde comienza el recorrido en 4x4 por el Altiplano boliviano. Durante el recorrido, visitarás la Laguna Blanca, la Laguna Verde, el Desierto de Dalí y la impresionante Laguna Colorada, situada a 4.278 metros sobre el nivel del mar y conocida por ser un importante hábitat para los flamencos andinos. La ruta continúa por el desierto de Siloli y las hermosas lagunas de Cañapa y Hedionda.
Alojamiento: Hotel Nativo San Cristóbal', 'Desayuno-Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('2530f25f-0d30-5245-8da5-63831386a118', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 1, 'ecbde376-79df-51c2-a499-1b18ad51b1dc') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c213044f-6aab-579f-a751-4d6d43794a6d', 'DAY_c213044f6aab579fa751', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a0cba541-219c-5a03-8c4a-de279f8a4a73', 'c213044f-6aab-579f-a751-4d6d43794a6d', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Salida hacia Uyuni con una visita al emblemático Cementerio de Trenes. A continuación, visita al pueblo artesanal de Colchani antes de adentrarnos en el inmenso Salar de Uyuni. Disfruta de un almuerzo en medio del salar y, después, explora la famosa isla de Incahuasi, donde se encuentran cactus gigantes y formaciones de coral fosilizado. El almuerzo se servirá al estilo Apthapi en el salar. Posteriormente, el recorrido continúa hacia el hotel.
Alojamiento: Hotel Luna Salada', 'Desayuno - Almuerzo - Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1d4941f3-1e80-5d69-95bc-5cbd9742a706', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 2, 'c213044f-6aab-579f-a751-4d6d43794a6d') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('855c1dda-8a89-5b15-bb62-9291da91f331', 'DAY_855c1dda8a895b15bb62', NULL, NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('5767feb8-71b3-50ba-bfd1-1e60630e421e', '855c1dda-8a89-5b15-bb62-9291da91f331', 'es', 'Valle de las Rocas · Lagunas Altiplanicas · Villa Mar', 'Después del desayuno, la ruta incluirá el Valle de las Rocas, la Laguna Turquiri, la Laguna Cañapa, la Laguna Hedionda y la Laguna Pastos Grandes, atravesando algunas zonas muy pintorescas del Altiplano boliviano con numerosas oportunidades para avistar llamas y fauna andina. Al final del día, el grupo continuará hacia Villa Mar, donde pasará la noche.
Alojamiento: Hotel Mallku cueva', 'Desayuno- Almuerzo - Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('fedb284b-5e4f-58ed-8a8f-1f46a8347f66', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 3, '855c1dda-8a89-5b15-bb62-9291da91f331') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('95b59e6f-d2ee-50de-8456-6beac6e3eae9', 'DAY_95b59e6fd2ee50de8456', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('28c1fd84-554a-5691-ab31-e519f92054f7', '95b59e6f-d2ee-50de-8456-6beac6e3eae9', 'es', 'Sol de la Mañana · Hito Cajón · San Pedro de Atacama', 'Salida temprano para visitar los géiseres de Sol de Mañana, situados a casi 5.000 metros sobre el nivel del mar, donde la actividad geotérmica genera fumarolas y pozos de barro hirviente. La ruta continúa hacia las aguas termales de Polques, donde podrás relajarte en aguas termales naturales. A continuación, atravesaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, situadas a los pies del volcán Licancabur. Traslado en vehículo chileno desde la frontera con Bolivia, en Hito Cajón, hasta San Pedro de Atacama antes de las 17:00 horas.
Alojamiento: No incluído', 'Desayuno - Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas.', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a4d48e4a-36db-5262-849c-69e1f1c35637', 'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0', 4, '95b59e6f-d2ee-50de-8456-6beac6e3eae9') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c477b3db-8f69-55be-8feb-99acfe1442ae', 'SPASPA-4D3N-ScJF', 'San Pedro de Atacama → Uyuni → San Pedro de Atacama', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScJF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('985f5311-c735-5740-9df8-f7ef9bc1a715', 'DAY_985f5311c73557409df8', 'SPA', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('2c908708-86db-5468-992f-7b990290f633', '985f5311-c735-5740-9df8-f7ef9bc1a715', 'es', 'Lagunas Altiplánicas · Desierto de Siloli', 'Salida desde su hotel en San Pedro de Atacama, Chile, atravesando la frontera por Hito Cajón, donde abordarán un vehículo 4x4 para comenzar esta aventura a través de los espectaculares paisajes del altiplano boliviano.
Alojamiento: Hotel San Cristóbal', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f58de55d-97cb-53d1-9a82-3ae97c12fb4c', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 1, '985f5311-c735-5740-9df8-f7ef9bc1a715') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('16b7025c-fdcf-5bbc-af11-f9ecd9f7c304', 'DAY_16b7025cfdcf5bbcaf11', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('8a9ae276-212e-51c2-983d-698d4281530e', '16b7025c-fdcf-5bbc-af11-f9ecd9f7c304', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, esculpido durante siglos por la erosión natural.
Alojamiento: Hotel Jardines de Uyuni o similar', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('828cec7a-c594-55df-9c10-316259c5dab2', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 2, '16b7025c-fdcf-5bbc-af11-f9ecd9f7c304') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('dd38a097-3a1f-5c30-95e3-023445f3bfda', 'DAY_dd38a0973a1f5c3095e3', NULL, NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f018c7ad-a17b-57a9-aa2c-6300b76efdfc', 'dd38a097-3a1f-5c30-95e3-023445f3bfda', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Almuerzo en medio del salar y, posteriormente, exploración de la famosa Isla Incahuasi, conocida por sus cactus gigantes y sus formaciones de coral fosilizado.
Alojamiento: Hotel Los Flamencos, Laguna Hedionda', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('5e9a4926-12b1-59f2-90e9-576dc3764d5a', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 3, 'dd38a097-3a1f-5c30-95e3-023445f3bfda') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('1340d3d3-0f2d-55e0-84dc-a86df8545b84', 'DAY_1340d3d30f2d55e084dc', NULL, 'SPA', NULL, 4, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('810e6580-9d56-5b95-abe3-fadb7562f347', '1340d3d3-0f2d-55e0-84dc-a86df8545b84', 'es', 'Hito Cajón · San Pedro de Atacama', 'Continuación hacia las Termas de Polques, donde podrán relajarse en sus aguas termales naturales. Posteriormente, atravesaremos el surrealista Desierto de Dalí y visitaremos la Laguna Verde y la Laguna Blanca, ubicadas a los pies del volcán Licancabur.
Alojamiento: No incluido', NULL, NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6937ac63-a72d-5b81-b531-f6818fef3b7d', 'c477b3db-8f69-55be-8feb-99acfe1442ae', 4, '1340d3d3-0f2d-55e0-84dc-a86df8545b84') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('3c12f644-8b4f-5008-aeff-19ba0095bf22', 'SPASPA-4D3N-ScJTd', 'San Pedro de Atacama → Uyuni → San Pedro de Atacama', 'SPA', 'SPA', 'ROUNDTRIP', 4, 3, 'MIXTO', 'ScJTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('fe929e57-a7e5-576b-918c-572285ebc085', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 1, '985f5311-c735-5740-9df8-f7ef9bc1a715') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('999f4559-7b30-5fc3-b73a-61906e618d89', 'DAY_999f45597b305fc3b73a', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('319edc60-95ce-5224-96c5-2233d1e9dfbc', '999f4559-7b30-5fc3-b73a-61906e618d89', 'es', 'Valle de las Rocas · Cañón de la Anaconda', 'Salida hacia el espectacular Valle de las Rocas, seguido de un recorrido por el impresionante Cañón de la Anaconda, esculpido durante siglos por la erosión natural.
Alojamiento: Hotel Jardines de Uyuni', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('94d4f694-97ec-51b3-b7a2-9fa205f8a281', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 2, '999f4559-7b30-5fc3-b73a-61906e618d89') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('38f6b2bf-0ec0-5cc0-8577-2a8f89fac686', 'DAY_38f6b2bf0ec05cc08577', NULL, NULL, NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('623b809f-3e05-5c2e-ab45-d66e814eb0d7', '38f6b2bf-0ec0-5cc0-8577-2a8f89fac686', 'es', 'Salar de Uyuni · Cóctel al Atardecer', 'Visita al pueblo artesanal de Colchani antes de ingresar al inmenso Salar de Uyuni. Almuerzo en medio del salar y, posteriormente, exploración de la famosa Isla Incahuasi, conocida por sus cactus gigantes y sus formaciones de coral fosilizado.
Alojamiento: Hotel Tayka del desierto.', 'Desayuno · Almuerzo · Cena', NULL, false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9cd3b098-8880-5812-96a9-7182005a1782', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 3, '38f6b2bf-0ec0-5cc0-8577-2a8f89fac686') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f6f78d92-a800-5e69-8def-98b2aa82c62b', '3c12f644-8b4f-5008-aeff-19ba0095bf22', 4, '1340d3d3-0f2d-55e0-84dc-a86df8545b84') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('1ed64259-6796-539d-9889-291da5798c6a', 'UYUUYU-3D2N-PF', 'ITINERARIO DETALLADO – UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'PF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('e4df9d70-362f-58ac-8723-03d5631ad90a', 'DAY_e4df9d70362f58ac8723', 'UYU', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('3da9c103-639b-50f7-bb07-1392912481b2', 'e4df9d70-362f-58ac-8723-03d5631ad90a', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('7bd120db-3ffe-58af-8a6c-57dc4411e572', '1ed64259-6796-539d-9889-291da5798c6a', 1, 'e4df9d70-362f-58ac-8723-03d5631ad90a') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('856b68a5-4516-571c-9760-e58d1da0de06', 'DAY_856b68a54516571c9760', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9c8884a0-bc7b-5a76-96a6-244f94531d3c', '856b68a5-4516-571c-9760-e58d1da0de06', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Los Flamencos', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f0208101-d658-5d66-97e8-ace49cb7b85f', '1ed64259-6796-539d-9889-291da5798c6a', 2, '856b68a5-4516-571c-9760-e58d1da0de06') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7fadb241-9922-5ae6-866f-ed13f37c668c', 'DAY_7fadb24199225ae6866f', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('cd84dfbe-ba9c-5b20-a315-2adf91955d6b', '7fadb241-9922-5ae6-866f-ed13f37c668c', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('676bba2a-19e3-5a07-8c27-f68c2be8f88d', '1ed64259-6796-539d-9889-291da5798c6a', 3, '7fadb241-9922-5ae6-866f-ed13f37c668c') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('95df3a85-6bf2-520b-9145-7ef43b183663', 'UYUUYU-3D2N-PTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'PTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "8 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d3c1cae1-efec-5421-b318-dd1e89c77774', 'DAY_d3c1cae1efec5421b318', 'UYU', NULL, '6695d424-92d7-5de0-91d4-b950ad466be1', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('cc272e86-0065-527e-a1da-fcedab1d20b0', 'd3c1cae1-efec-5421-b318-dd1e89c77774', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('855c3ee3-6bd1-524a-8add-d7b94e99c56c', 'd3c1cae1-efec-5421-b318-dd1e89c77774', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '00e0b0c7-7607-5f37-8daa-e1b5dd2431d0', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7ca48024-b191-5e76-838e-685de3b1bc05', 'd3c1cae1-efec-5421-b318-dd1e89c77774', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('343b3a4e-9110-59ac-9b54-9ea04964bf86', 'd3c1cae1-efec-5421-b318-dd1e89c77774', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('91ea28a9-6ebc-507e-83d4-86766b720246', 'd3c1cae1-efec-5421-b318-dd1e89c77774', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('da6e2a97-9f64-5e57-8dff-878e6edda21d', 'd3c1cae1-efec-5421-b318-dd1e89c77774', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('dca08b26-4a82-5ed7-ad2a-e29104669733', 'd3c1cae1-efec-5421-b318-dd1e89c77774', '5ee76308-b296-5d44-aacb-a874b1c2b6fe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('bd6e58b1-96c2-5501-adbe-b9992ff38baa', '95df3a85-6bf2-520b-9145-7ef43b183663', 1, 'd3c1cae1-efec-5421-b318-dd1e89c77774') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9684edba-228b-53eb-84bd-9564ad8ca9a9', 'DAY_9684edba228b53eb84bd', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f3c59168-3aa1-5d67-b0b9-57620d9146b0', '9684edba-228b-53eb-84bd-9564ad8ca9a9', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Tayka del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d8b456b0-9067-5089-9386-5f194b896782', '9684edba-228b-53eb-84bd-9564ad8ca9a9', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '00e0b0c7-7607-5f37-8daa-e1b5dd2431d0', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1ff5edcb-a0d2-53bb-9ef6-c6682fe7ef1d', '9684edba-228b-53eb-84bd-9564ad8ca9a9', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fd74707e-6c29-5b16-8cad-5255314e665d', '9684edba-228b-53eb-84bd-9564ad8ca9a9', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('48d81123-c651-5089-a87d-49f127ef89e8', '9684edba-228b-53eb-84bd-9564ad8ca9a9', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('81b83109-cfad-5dce-b1ae-4c54c5d702f2', '9684edba-228b-53eb-84bd-9564ad8ca9a9', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a8af4bc4-0d03-565e-a56d-f5f4b732ca3d', '9684edba-228b-53eb-84bd-9564ad8ca9a9', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cb243c37-c31e-5f8b-9e56-2151ee4b4267', '9684edba-228b-53eb-84bd-9564ad8ca9a9', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('3b2a29bf-16b3-56ab-bf41-96b33f7ddd3d', '95df3a85-6bf2-520b-9145-7ef43b183663', 2, '9684edba-228b-53eb-84bd-9564ad8ca9a9') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('97baa231-d359-5ca2-bff0-e62800a1a9b1', 'DAY_97baa231d3595ca2bff0', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bd48adc6-ae6b-5e9d-bb6f-02b4a39e2052', '97baa231-d359-5ca2-bff0-e62800a1a9b1', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('20f37b2b-94c7-54e1-8c44-2f5009b57fdb', '97baa231-d359-5ca2-bff0-e62800a1a9b1', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '00e0b0c7-7607-5f37-8daa-e1b5dd2431d0', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('08994820-0afc-56ef-935f-4519b910a1fb', '97baa231-d359-5ca2-bff0-e62800a1a9b1', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a040f699-ad1d-5057-a0a9-52a5be272dd1', '97baa231-d359-5ca2-bff0-e62800a1a9b1', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('858538cd-d5a5-54e4-a8db-2fff24dbf145', '95df3a85-6bf2-520b-9145-7ef43b183663', 3, '97baa231-d359-5ca2-bff0-e62800a1a9b1') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('ba0bb734-2f73-5040-8aae-217705d47e23', 'UYUUYU-3D2N-LTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'LTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', 'DAY_1d4c5879be0b56b28bbf', 'UYU', NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0f5cdc00-0359-5506-a1fe-76899a7f624c', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Luna Salada', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('505a1d60-11a2-55c1-858a-64e5ea574bd5', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'fa487a75-b826-5a07-a0d4-913d223fe119', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2d8d2b33-baf5-5019-9a6d-eaba1725eb44', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8632e2e0-ac9d-5f00-be07-499540b9ee9a', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('75221ad6-cfb6-58dc-aec1-7bffefbb9e05', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0cb6816a-570c-54ef-a031-a3d11c924fc3', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('52f2a748-88db-5c7e-b2e3-c52374b5bd53', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ed1e98a6-e1ef-5cd1-a8b3-f9d5a0e235b6', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('29740751-43ac-5380-93cc-8b3ce6a1d39c', '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35', '56d7552b-879e-5c20-993b-8b1a7cbe6c60', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('eb533bf1-baee-54ef-b279-a56a401bac83', 'ba0bb734-2f73-5040-8aae-217705d47e23', 1, '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'DAY_5cb4d96536755992a0d7', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('f1cbbd7b-b285-5e8d-bd72-b031375be2c6', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Taika del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3063dd59-ff6e-54a0-a3f8-221bf99c952d', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'fa487a75-b826-5a07-a0d4-913d223fe119', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1c83906f-a44b-506b-9488-c336b1e75422', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ac72c575-0368-5cd9-a715-f6ecbf468256', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('09779463-cfe0-5ee1-898d-a2775a083646', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9a7e0253-7936-5d50-b2c2-dbb3e3834d05', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('14cc7d91-77c3-5980-b4cb-fdc6848e7b0c', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d5cc8fbb-cd92-5b05-879c-b926e0e485e3', '5cb4d965-3675-5992-a0d7-b4a6995c80f0', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('0c5b42e8-115c-5ea4-92ca-a3b4fe1f2a7d', 'ba0bb734-2f73-5040-8aae-217705d47e23', 2, '5cb4d965-3675-5992-a0d7-b4a6995c80f0') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('8167c971-287a-517c-81c3-a1822b8fb55f', 'DAY_8167c971287a517c81c3', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('33e0dc68-51c2-5bb9-9540-0929242ca68d', '8167c971-287a-517c-81c3-a1822b8fb55f', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fa6bf443-eca5-535a-88e9-2cf8d6ba9a53', '8167c971-287a-517c-81c3-a1822b8fb55f', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'fa487a75-b826-5a07-a0d4-913d223fe119', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c49fd064-b1ae-50ef-86c3-242fb9fb354f', '8167c971-287a-517c-81c3-a1822b8fb55f', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e7061c32-3a0e-55f6-9305-f6e42837c809', '8167c971-287a-517c-81c3-a1822b8fb55f', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('74ba3474-91f0-557e-96ba-423ffb316236', 'ba0bb734-2f73-5040-8aae-217705d47e23', 3, '8167c971-287a-517c-81c3-a1822b8fb55f') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 'UYUUYU-3D2N-JTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'JTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', 'DAY_5f8cbdd68c545a70b55b', 'UYU', NULL, '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('83eb6241-f772-5576-bb86-85b606d5ec69', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Jardines del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8bdc6549-d5f9-5282-845d-6ef4555f9035', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'da777575-1a0c-5714-9c71-0c7e95afe2be', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3f84f491-76d1-51d9-a356-9f7a81ddd108', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8d2c4957-3b8d-541e-aa6b-95543ca53f1e', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('64ac002f-30af-59a1-86cc-5cfb8cae8c63', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', 'ecd656cd-9c28-55e2-b248-36bc8f5901ab', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2835489a-85de-5e69-acf0-e4f4a746843d', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', '03b03981-6b01-5a24-88b4-4b4bd66fcb2f', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4739bf85-1180-56a9-8011-49ebf286c9e7', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', '113ed8f7-8532-5bcf-85ff-c51e2c0cf91e', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9aa7d600-9424-505b-b6cf-abb23ccdef27', '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7', 'c42e75f2-488a-52ed-863d-a740cc5d78cf', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('04accf41-6d1e-5c12-aeb4-14e408080e04', 'c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 1, '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'DAY_f3a27e95af985b1e83cf', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('c4d88bca-5dc1-58d3-b74a-560c4e414695', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Taika del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('bebac52d-f8aa-5bbb-afc9-3a4694805172', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'da777575-1a0c-5714-9c71-0c7e95afe2be', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b9407d62-05ae-5724-b308-6d8991b29ae9', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('668ca654-5f86-5681-83f5-0d81e3fc7cde', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('27c6fbd5-a6e7-5dfb-8ebf-1904b641abea', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cc0e8570-14f1-5b8d-a527-0c17ee327b29', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ab2bf3df-1250-524a-a5c4-d5b5ba2ddcac', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('019d33b9-2178-5c0f-8fbb-f6de32c08cb1', 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1f50069d-3b68-50dd-b2dd-4b9431c95e95', 'c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 2, 'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('d05719b6-c97e-54a7-b863-0b125bf278a5', 'DAY_d05719b6c97e54a7b863', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a563680c-d6c7-5826-ae82-518c8955720f', 'd05719b6-c97e-54a7-b863-0b125bf278a5', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f2e1866e-4ee6-5f58-97cc-7baa3df60d0e', 'd05719b6-c97e-54a7-b863-0b125bf278a5', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'da777575-1a0c-5714-9c71-0c7e95afe2be', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('690fc49b-7017-5e7e-aef8-d911d8d66545', 'd05719b6-c97e-54a7-b863-0b125bf278a5', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8faf46f6-8b37-5033-bc7b-dd1ca434b880', 'd05719b6-c97e-54a7-b863-0b125bf278a5', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('cbad91ce-e8fb-54c7-81dc-370f276373aa', 'c34c51d8-82f0-5f7d-9c94-dc9390b8738e', 3, 'd05719b6-c97e-54a7-b863-0b125bf278a5') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 'UYUUYU-3D2N-ÑF', 'ITINERARIO DETALLADO – UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'ÑF', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('811308a3-3e12-59f1-8c61-b78c7cd8f188', 'DAY_811308a33e1259f18c61', 'UYU', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('7697599b-e2ae-5623-bd83-06e3a416d8fa', '811308a3-3e12-59f1-8c61-b78c7cd8f188', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Coscaña', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6493a679-1c5e-557c-8e9c-8ff13e95d590', '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 1, '811308a3-3e12-59f1-8c61-b78c7cd8f188') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('4cd90f12-2368-5a94-b9e8-d5abe9d7f7c2', '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 2, '856b68a5-4516-571c-9760-e58d1da0de06') on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('da0cee7f-232e-5b37-9770-a1613d95b674', '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c', 3, '7fadb241-9922-5ae6-866f-ed13f37c668c') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('23ebc69c-20e6-53f5-a6c6-9da288431864', 'UYUUYU-3D2N-ÑTd', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'ÑTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('ac2bbb60-f987-593e-9f8f-afc4f556a383', 'DAY_ac2bbb60f987593e9f8f', 'UYU', NULL, '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('92526caf-7629-5522-ac54-f3023a833280', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Coscaña', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto.', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2fa6be40-63ee-520e-8091-faa525816872', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '93848c9c-ab7d-565e-9156-4db4c3736f97', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('227b8ba2-0852-51e9-9209-9b5faeb10b3c', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('95ac392e-b855-5cef-8311-3e5123c73308', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0220b4d4-ebbf-536f-996c-e7c9426d0867', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', '4e78b66d-0113-529a-a8f6-76bb10131eee', 1, false, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b738deea-a233-542d-b341-0a1a8eda055d', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', '4f92cc8a-a8c4-517f-987e-eb7142359327', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4df4f84f-2172-5912-833e-82cb0cd97b22', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', 'c2f9b7ed-8467-50c7-b8ce-59ea4e66e40c', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('2284530d-9b84-5b98-8cbe-00c3712c5848', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', 'fa33cfd5-f099-5049-934f-ac1376653382', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('59f17cd8-1c74-510e-a661-54a710cea6a8', 'ac2bbb60-f987-593e-9f8f-afc4f556a383', 'fda36488-da49-5dab-902b-a4e0721d7ad2', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('a4bde608-ad9d-5747-b358-6615cc7d704d', '23ebc69c-20e6-53f5-a6c6-9da288431864', 1, 'ac2bbb60-f987-593e-9f8f-afc4f556a383') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('34a494d4-c924-56aa-bf34-2471fd8d372c', 'DAY_34a494d4c92456aabf34', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('585dcdeb-383d-5f71-8853-4ab29ca24a16', '34a494d4-c924-56aa-bf34-2471fd8d372c', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Taika del Desierto', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto.', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b714c0ba-7bc5-5e80-9ee9-15ee0a985d19', '34a494d4-c924-56aa-bf34-2471fd8d372c', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '93848c9c-ab7d-565e-9156-4db4c3736f97', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f1f6df23-e7c5-52e5-b37d-a41d47572720', '34a494d4-c924-56aa-bf34-2471fd8d372c', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0a5e0509-40c6-57ad-bcd0-bd3d09cf891a', '34a494d4-c924-56aa-bf34-2471fd8d372c', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9edfca24-0cfa-5a39-bf3c-d2c88f19a4bb', '34a494d4-c924-56aa-bf34-2471fd8d372c', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c183f62d-1e9f-55da-a05e-029a10fb0628', '34a494d4-c924-56aa-bf34-2471fd8d372c', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('84036fac-9783-5a46-b360-eabb3e755264', '34a494d4-c924-56aa-bf34-2471fd8d372c', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('53872626-d442-55d7-af1b-1392b1eb472b', '34a494d4-c924-56aa-bf34-2471fd8d372c', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('9e14c09b-2a1f-57d7-84ec-fc1be8e80ee8', '23ebc69c-20e6-53f5-a6c6-9da288431864', 2, '34a494d4-c924-56aa-bf34-2471fd8d372c') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('2c30823d-295b-5dc7-ad7b-78163015861a', 'DAY_2c30823d295b5dc7ad7b', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9b3e011f-8a71-55bb-a877-f78af5540602', '2c30823d-295b-5dc7-ad7b-78163015861a', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto.', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('31b1b2ba-8b1c-5860-b266-fbc3da94fefa', '2c30823d-295b-5dc7-ad7b-78163015861a', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '93848c9c-ab7d-565e-9156-4db4c3736f97', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6ef48cb0-0348-5859-a04b-a81058e2477c', '2c30823d-295b-5dc7-ad7b-78163015861a', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('17cba01f-a863-536a-81be-b959c1312aed', '2c30823d-295b-5dc7-ad7b-78163015861a', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('e5d328da-1741-5d77-8445-6084b2eebd7d', '23ebc69c-20e6-53f5-a6c6-9da288431864', 3, '2c30823d-295b-5dc7-ad7b-78163015861a') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('49e92237-b6d4-514b-93bb-3272dfd1efd9', 'UYUUYU-3D2N-KS', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'KS', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "9 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('1bbade78-2401-5720-8d0c-7ec1146af466', 'DAY_1bbade78240157208d0c', 'UYU', NULL, 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('55791fc9-5064-5b3d-8939-3d9aee2fafd5', '1bbade78-2401-5720-8d0c-7ec1146af466', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hotel Kachi', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('09640a06-dc07-5807-a536-706650b7ba42', '1bbade78-2401-5720-8d0c-7ec1146af466', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7031738f-9790-5c01-833a-9534efbfdfc6', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8b646c08-64c4-5af4-912f-5362aff878c5', '1bbade78-2401-5720-8d0c-7ec1146af466', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1029f08f-614d-5918-bd7f-86e98c2cb4c4', '1bbade78-2401-5720-8d0c-7ec1146af466', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5ecf63c0-9761-5e83-a63a-507b7735280e', '1bbade78-2401-5720-8d0c-7ec1146af466', 'a9f5afb8-374d-5c0c-8413-99aaae578359', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4efc3707-d8bb-5103-9131-e0f878d6ba4d', '1bbade78-2401-5720-8d0c-7ec1146af466', 'ac4f09a4-e6fb-5732-a04b-16537f6ebc07', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('87d4a336-4b1f-5993-8d6d-d4096309c248', '1bbade78-2401-5720-8d0c-7ec1146af466', '3f93d6d1-5344-5390-aade-fe9b9be74129', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('d59a8730-0f7b-581e-b4b9-211a8faf39da', '1bbade78-2401-5720-8d0c-7ec1146af466', '7542eeab-7698-5514-b7bc-d3ac470b03f4', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9a8d1b34-c49f-55ec-b526-d8184da66f18', '1bbade78-2401-5720-8d0c-7ec1146af466', '2ae87e13-3f80-5387-b92d-56a5b36d4e54', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('f1fa2057-520c-5096-9d0c-b422d137f9a2', '49e92237-b6d4-514b-93bb-3272dfd1efd9', 1, '1bbade78-2401-5720-8d0c-7ec1146af466') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7d6a695c-f6ae-56f7-89c0-cf14c9878796', 'DAY_7d6a695cf6ae56f789c0', NULL, NULL, 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('c0e0277f-f8fa-5a7b-834e-2c816ccf679d', '7d6a695c-f6ae-56f7-89c0-cf14c9878796', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hotel Sky Deam', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('6b352b12-3bc6-56c1-bba2-f09a90d5a0c3', '7d6a695c-f6ae-56f7-89c0-cf14c9878796', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7031738f-9790-5c01-833a-9534efbfdfc6', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e1963964-921a-56f0-9977-6f8a06ef0263', '7d6a695c-f6ae-56f7-89c0-cf14c9878796', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ef927504-9b73-5498-bf66-80823e60d4ad', '7d6a695c-f6ae-56f7-89c0-cf14c9878796', '81270178-5ac4-5c82-b566-4c7d3224b368', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c4fb7da2-f188-5e33-9940-63d45c9212f4', '7d6a695c-f6ae-56f7-89c0-cf14c9878796', 'ab659ba3-46d0-5798-ac53-dc1d32caa7d5', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('b7c68467-79a4-53c5-93b4-73f030fd545b', '49e92237-b6d4-514b-93bb-3272dfd1efd9', 2, '7d6a695c-f6ae-56f7-89c0-cf14c9878796') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('b1fd21a2-4600-5ca8-baf1-2b7018401998', 'DAY_b1fd21a246005ca8baf1', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('9f7efa0b-669e-5b00-b424-b9cdfc16297b', 'b1fd21a2-4600-5ca8-baf1-2b7018401998', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('958d95a2-f78d-5c90-acc7-d035b56145a1', 'b1fd21a2-4600-5ca8-baf1-2b7018401998', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '7031738f-9790-5c01-833a-9534efbfdfc6', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('69301c7c-b080-5aef-845b-40ec0d9039c2', 'b1fd21a2-4600-5ca8-baf1-2b7018401998', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4592cdca-556e-5be8-a908-3ec75e96d78b', 'b1fd21a2-4600-5ca8-baf1-2b7018401998', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('78aa3c89-88e9-5a94-aab3-e8b6433edf89', '49e92237-b6d4-514b-93bb-3272dfd1efd9', 3, 'b1fd21a2-4600-5ca8-baf1-2b7018401998') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('74fd942d-44d1-52a5-af3b-9a10027cb6d9', 'UYUUYU-3D2N-CkHj', 'ITINERARIO DETALLADO UYUNI Y ALTIPLANO BOLIVIANO', 'UYU', 'UYU', 'ROUNDTRIP', 3, 2, 'MIXTO', 'CkHj', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "Sin presupuesto enlazado."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('2e87e77d-adce-5ccf-a9eb-c4c8924ec60a', 'DAY_2e87e77dadce5ccfa9eb', 'UYU', NULL, NULL, 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('922d5b60-7a6a-5412-af03-48876bf27235', '2e87e77d-adce-5ccf-a9eb-c4c8924ec60a', 'es', 'Uyuni · Colchani · Salar de Uyuni', 'La aventura comienza a las 10:30 AM con la visita al Cementerio de Trenes de Uyuni, símbolo histórico del altiplano boliviano. Continuamos hacia Colchani, donde conoceremos el proceso artesanal de extracción y refinamiento de la sal.  Ingreso al majestuoso Salar de Uyuni, visitando los Ojos del Salar, el Museo de Sal, las esculturas de sal, el laberinto y la escalera panorámica. Almuerzo tradicional Apthapi en medio del salar y atardecer sobre el desierto blanco.
Alojamiento: Hostel de Sal en Colcha K', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('c44caaaf-eb9c-5d1d-8a75-ce1c5dad1eea', '74fd942d-44d1-52a5-af3b-9a10027cb6d9', 1, '2e87e77d-adce-5ccf-a9eb-c4c8924ec60a') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('5cbc5ac6-b020-5208-a6dd-0460a3a38d80', 'DAY_5cbc5ac6b0205208a6dd', NULL, NULL, NULL, 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('afd2063f-565e-5ca0-ba00-f8e6267373e7', '5cbc5ac6-b020-5208-a6dd-0460a3a38d80', 'es', 'Isla Incahuasi · Valle de las Rocas · Lagunas Altiplánicas', 'Visita a la icónica Isla Incahuasi, famosa por sus cactus gigantes y vistas panorámicas del salar. Luego recorrido por el Valle de las Rocas y las Lagunas Altiplánicas (Cañapa, Ramaditas, Honda y Hedionda), hábitat natural de flamencos en un impresionante paisaje andino.
Alojamiento: Hostal basico en Huayajara', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('870f5497-609d-5717-93b7-3f1f022ca498', '74fd942d-44d1-52a5-af3b-9a10027cb6d9', 2, '5cbc5ac6-b020-5208-a6dd-0460a3a38d80') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('c9a58352-7118-558d-8659-6d8d51d80d3b', 'DAY_c9a583527118558d8659', NULL, 'UYU', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('50215d47-6ff8-5bf5-a117-b5bc4f669d04', 'c9a58352-7118-558d-8659-6d8d51d80d3b', 'es', 'Laguna Colorada · Sol de la Mañana · Lagunas Verde y Blanca', 'Salida temprano  hacia la impresionante Laguna Colorada Cruzando el Desierto de Siloli, uno de los escenarios más remotos del altiplano.. Continuación hacia el campo geotérmico Sol de la Mañana (casi 5.000 m s.n.m.) y visita a las Termas de Polques.
Alojamiento: No incluye', 'Desayuno, Almuerzo', '- Tasas fronterizas y migratorias
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas
- Transfer aeropuerto', false) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('dd29b913-263d-5f67-ae9d-7502c2ee549b', '74fd942d-44d1-52a5-af3b-9a10027cb6d9', 3, 'c9a58352-7118-558d-8659-6d8d51d80d3b') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('8eaaf135-cdba-5122-be08-66d9e825672d', 'UYUSPA-3D2N-PTd', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA   (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'PTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('7f2ee230-86aa-5d46-bcda-deb20cde94c3', 'DAY_7f2ee23086aa5d46bcda', 'UYU', NULL, '6695d424-92d7-5de0-91d4-b950ad466be1', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('0fbd46a7-e180-5f06-a4b7-232bc638b637', '7f2ee230-86aa-5d46-bcda-deb20cde94c3', 'es', 'Uyuni · Colchani · Isla Incahuasi - Full day Salar', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Palacio de Sal', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('5a8412ce-8b57-52a2-9ff2-72c3a9cf7292', '7f2ee230-86aa-5d46-bcda-deb20cde94c3', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '415a5dfe-0345-5780-94ab-d107ef4aa663', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('307811b8-8551-5c7b-8cc4-c119f5ecd659', '7f2ee230-86aa-5d46-bcda-deb20cde94c3', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('a9ac6c17-81c8-5c09-9be2-cfc0ec39bb26', '7f2ee230-86aa-5d46-bcda-deb20cde94c3', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('0cd865ed-b80f-5406-b7df-9fc4159577a4', '7f2ee230-86aa-5d46-bcda-deb20cde94c3', '1f0c9c6b-6660-5efd-ac23-47ae5242ed9d', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('84ef2b10-9e88-57d1-b2c1-b8be436286f4', '7f2ee230-86aa-5d46-bcda-deb20cde94c3', '6695d424-92d7-5de0-91d4-b950ad466be1', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('aa17a9c3-0f6e-59cf-81b7-11eb39daed16', '8eaaf135-cdba-5122-be08-66d9e825672d', 1, '7f2ee230-86aa-5d46-bcda-deb20cde94c3') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('8d00a334-b739-520d-86a7-dda95489d297', 'DAY_8d00a334b739520d86a7', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('41fd5cf4-78bb-5380-b213-b7fa5388cd76', '8d00a334-b739-520d-86a7-dda95489d297', 'es', 'Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Tayka del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('9bb87efe-e21d-5bb5-9dd8-93c0c324f79d', '8d00a334-b739-520d-86a7-dda95489d297', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '415a5dfe-0345-5780-94ab-d107ef4aa663', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7846c1d8-7235-528f-bf07-4501cb4735ab', '8d00a334-b739-520d-86a7-dda95489d297', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('43ae2a7d-929c-5a77-a308-0df41a6419c9', '8d00a334-b739-520d-86a7-dda95489d297', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('4eed8c63-57f0-5afc-9fc7-9eea8c2d1083', '8d00a334-b739-520d-86a7-dda95489d297', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('accff6b7-1a2c-5549-9a20-0b6b5a4b80b3', '8d00a334-b739-520d-86a7-dda95489d297', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('b6ac87f2-4158-5de7-8c5c-0d6826832959', '8d00a334-b739-520d-86a7-dda95489d297', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c7f62015-3ef8-5f0b-b42a-09a188b74bcb', '8d00a334-b739-520d-86a7-dda95489d297', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('6eecabbc-2d1f-54c0-b845-fef810ef81c0', '8eaaf135-cdba-5122-be08-66d9e825672d', 2, '8d00a334-b739-520d-86a7-dda95489d297') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('acd015cc-f6c0-5101-8e98-6611fec569f3', 'DAY_acd015ccf6c051018e98', NULL, 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('a7988e15-f638-5365-9ec6-79f30bbdd6f8', 'acd015cc-f6c0-5101-8e98-6611fec569f3', 'es', 'Sol de la Mañana · Hito Cajón ·  San Pedro de Atacama', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluído', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('132cf6c1-e1d5-57e5-8089-7df54f18f14d', 'acd015cc-f6c0-5101-8e98-6611fec569f3', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, '415a5dfe-0345-5780-94ab-d107ef4aa663', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('c1e0340c-0428-5c35-8b34-37dee14aca12', 'acd015cc-f6c0-5101-8e98-6611fec569f3', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('aad8c90d-8310-5eda-b58f-172ed2120703', 'acd015cc-f6c0-5101-8e98-6611fec569f3', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('72b79500-ae0c-5d15-a104-6f4af591848a', 'acd015cc-f6c0-5101-8e98-6611fec569f3', 'd68d0735-4b95-5b8a-b363-77d36646a285', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('530768f4-b6dc-54e1-9188-2e481cde2e59', '8eaaf135-cdba-5122-be08-66d9e825672d', 3, 'acd015cc-f6c0-5101-8e98-6611fec569f3') on conflict do nothing;
insert into public.itinerary_templates (id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, status, import_warnings) values ('287413e0-49b4-5708-9871-ffd236128363', 'UYUSPA-3D2N-LTd', 'ITINERARIO DETALLADO – UYUNI A SAN PEDRO DE ATACAMA  (SOLO IDA)', 'UYU', 'SPA', 'ONEWAY', 3, 2, 'MIXTO', 'LTd', 'pendiente', '["Validar cantidades, variantes y servicios de origen antes de revisar.", "7 filas sin SKU enlazable."]') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('bb8ff4de-73f5-50d6-8183-15e8318a420a', 'DAY_bb8ff4de73f550d68183', 'UYU', NULL, 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('4c9158bc-4662-5618-8f11-0a362c30daa8', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', 'es', 'Uyuni · Colchani · Isla Incahuasi · Puerto Chuvica', 'La aventura comienza a las 10:30 a.m. con una visita al Cementerio de Trenes de Uyuni, hogar de las primeras locomotoras de Bolivia y un impactante recordatorio del pasado ferroviario del país. Luego continuamos hacia Colchani, un pueblo tradicional conocido por su producción artesanal de sal y sus artesanías locales. Posteriormente, ingresamos al vasto e impresionante Salar de Uyuni, visitando atractivos como los Ojos del Salar, el Museo de Sal construido completamente con bloques de sal, y la icónica Isla Incahuasi. En la isla, realizamos una caminata hasta la cima para admirar cactus gigantes y formaciones de coral fosilizado, con tiempo suficiente para fotografía creativa. Disfruta del atardecer en el salar antes de regresar a tu hotel en Uyuni.
Alojamiento: Hotel Luna Salada', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('99190b05-0892-52f0-8653-13a07cf90285', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'a9327c40-c15d-5f5d-8bbe-8f54de0375fc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('806b9ffa-7c6a-5960-afa6-0fa9741aa7f7', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', 'c1a0c70d-d40c-5eb2-b844-db8cb194ba4b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('8c0f06f6-728b-5801-8352-d0ed578fa8bf', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', '02bb6245-5732-58eb-8c2a-4e1c42dddf51', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('e3f2a430-b9ab-5e53-ba83-9a10792ba50c', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', '968f0877-b3b8-5fbb-9b46-d4f587e442af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('1a6f9951-567b-5190-b568-0c3a2d85e0a2', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', 'dfa5b26a-6ae2-5edf-abd0-eb9e8fed5a82', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('08ce8786-2baa-5221-8cc2-a50178a5c869', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', 'f059a7d4-dfee-59ae-a880-23a5df3b7687', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('25a3029d-c226-56af-9ba1-13a12abc2372', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', '48d2ee62-f799-5736-9a5c-b6bbf1c5fffe', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7e4051e2-2ff1-5755-9552-6c73ee299e86', 'bb8ff4de-73f5-50d6-8183-15e8318a420a', '56d7552b-879e-5c20-993b-8b1a7cbe6c60', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('1f93fccc-7068-51f3-a0df-657b3eb176ba', '287413e0-49b4-5708-9871-ffd236128363', 1, 'bb8ff4de-73f5-50d6-8183-15e8318a420a') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'DAY_9a7e3d00dbef5e06bb05', NULL, NULL, 'f36e2c3f-b286-5781-9928-155a28b45931', 2, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('bdfa5d41-36fc-56b6-bde5-ea2e088096d4', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'es', 'Puerto Chuvica · Lagunas Altiplánicas · Laguna Colorada', 'Continuamos hacia el impresionante Valle de las Rocas, donde formaciones naturales esculpidas por el viento durante siglos crean un paisaje surrealista. También visitamos comunidades tradicionales para conocer la vida local en el Altiplano. El viaje continúa hacia las hermosas lagunas altiplánicas — Cañapa, Ramaditas, Honda y Hedionda — donde cientos de flamencos habitan en un extraordinario entorno andino. Más tarde, atravesamos el vasto Desierto de Siloli, rodeado de volcanes y paisajes de gran altitud.
Alojamiento: Hotel Tayka del Desierto', 'Almuerzo, Cena', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('88b9be3a-f2a0-51c6-acd3-7eb4928a640e', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'a9327c40-c15d-5f5d-8bbe-8f54de0375fc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('74e08293-7e2d-528b-9fff-51ccff5e8630', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('fc449e50-bbc1-5f07-8aea-958070adeca9', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', '4c8c52df-18b9-5a1a-b1a0-41c11e9cd9af', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('3a24d507-0dd7-58d5-9af1-b7c87d0ce5b9', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'f36e2c3f-b286-5781-9928-155a28b45931', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ad5ec6c2-b286-597d-8d0a-90bf99f5daa7', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'ee86e0d2-04fc-5288-9b3a-3da87e264fae', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('cfb7e4c6-63e4-5834-99b7-ada50dfec7c5', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', 'af2523ea-4a7c-5944-b07e-d3ce8bc4f80b', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('7e588ec2-3758-5cd4-aea8-f35b38506384', '9a7e3d00-dbef-5e06-bb05-73ca98ddda25', '81770c42-cbf6-5433-a1bd-4f75bf940632', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.template_days (id, template_id, day_number, block_id) values ('4e92d60b-50e9-5085-8249-cbdfaa1ea302', '287413e0-49b4-5708-9871-ffd236128363', 2, '9a7e3d00-dbef-5e06-bb05-73ca98ddda25') on conflict do nothing;
insert into public.day_blocks (id, code, route_from, route_to, hotel_service_id, default_day_position, status) values ('757a8023-5f45-5cd0-a090-a2c6c86da20e', 'DAY_757a80235f455cd0a090', NULL, 'SPA', NULL, 3, 'pendiente') on conflict do nothing;
insert into public.day_block_translations (id, block_id, lang, title, description, includes, excludes, reviewed) values ('94658f32-2af8-5b85-bdbd-4cb516ebc4b5', '757a8023-5f45-5cd0-a090-a2c6c86da20e', 'es', 'Sol de la Mañana · Hito Cajón', 'Salida temprano hacia los Géiseres Sol de la Mañana, ubicados a casi 5.000 metros sobre el nivel del mar, seguido de una visita a las relajantes aguas termales de Polques. Luego cruzamos el surrealista Desierto de Dalí y visitamos la Laguna Verde y la Laguna Blanca, al pie del majestuoso Volcán Licancabur. Traslado en vehículo chileno desde la frontera boliviana hacia San Pedro de Atacama.
Alojamiento: No incluido', 'Almuerzo', '- Tasas fronterizas y migratorias
- Alojamiento en San Pedro de Atacama
- Actividades opcionales
- Gastos personales
- Seguro de viaje
- Propinas
- Vuelos
- Comidas o bebestible no mencionadas', false) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('f04054b1-ccb7-58bc-8d77-28cd905d34ee', '757a8023-5f45-5cd0-a090-a2c6c86da20e', 'dfdec903-cf0e-5add-853d-055cfae40c63', 1, true, 3, 'a9327c40-c15d-5f5d-8bbe-8f54de0375fc', 1) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('64bcaf15-86e7-506c-a42b-cb7cd507f403', '757a8023-5f45-5cd0-a090-a2c6c86da20e', 'f7e84c94-e708-5606-bee7-861d569cd595', 1, true, 1, NULL, NULL) on conflict do nothing;
insert into public.day_block_items (id, block_id, service_id, qty, included, multi_day_span, coverage_key, coverage_start_day) values ('ccba365b-d6c1-5034-989a-0273826ed7a5', '757a8023-5f45-5cd0-a090-a2c6c86da20e', 'fd01d0d5-04f6-57cf-8538-f1ce8daf05fc', 1, true, 1, NULL, NULL) on conflict do nothing;
commit;
