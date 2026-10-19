// Synthetic catalog: no production/customer data. Real migrations and RLS apply.
export const catalogSeller = "51000000-0000-0000-0000-000000000001";
export const catalogOtherSeller = "51000000-0000-0000-0000-000000000002";

export async function seedLargeCatalog(pg) {
  await pg.exec(`
    insert into auth.users(id,email) values
      ('${catalogSeller}','catalog-seller@test.invalid'),
      ('${catalogOtherSeller}','catalog-other@test.invalid');
    insert into currencies(code,name) values('USD','US dollar') on conflict(code) do nothing;
    insert into suppliers(id,name) select md5('large-hotel-'||n)::uuid,'Hotel sintetico '||n from generate_series(1,45) n;
    insert into services(id,sku,name,type,pricing_unit,currency,status,created_by,room_type,vehicle_max_pax,supplier_id)
    select md5('large-service-'||n)::uuid, 'CAT-'||lpad(n::text,3,'0'), 'Servicio de catálogo '||n,
      (array['comida','guia','transporte','alojamiento'])[1+(n-1)%4]::service_type,
      (array['per_person','per_group','per_vehicle','per_room'])[1+(n-1)%4]::pricing_unit,
      'USD',case when n%5=0 then 'pendiente' else 'activo' end::catalog_status,
      '${catalogSeller}',case when n%4=0 then 'DBL' end,case when n%4=3 then 20 end,case when n%4=0 then md5('large-hotel-'||ceil(n/8.0)::int)::uuid end
    from generate_series(1,360) n;
    insert into service_rates(service_id,valid_from,valid_to,pax_min,pax_max,price_net,season)
    select md5('large-service-'||n)::uuid,
      case when band=4 or n>330 then '2025-01-01' else '2026-01-01' end::date,
      case when band=4 or n>330 then '2025-12-31' else '2026-12-31' end::date,
      (array[1,3,7,1])[band],(array[2,6,20,20])[band],10+n%20+band,'ALL'
    from generate_series(1,360) n cross join generate_series(1,4) band;
    insert into day_blocks(id,code,status,default_day_position,created_by,hotel_id)
    select md5('large-block-'||n)::uuid,'CAT-DAY-'||lpad(n::text,3,'0'),'activo',n,'${catalogSeller}',md5('large-hotel-'||(1+((n-1)%45)))::uuid
      from generate_series(1,120) n;
    insert into day_block_translations(block_id,lang,title,description,reviewed)
    select md5('large-block-'||n)::uuid, lang, 'Día '||n||' '||lang, 'Recorrido de prueba '||n||' '||lang, true
      from generate_series(1,120) n cross join unnest(array['es','en','it']) lang
      where n%10<>0 and (lang<>'es' or n%3<>0) and (n%5<>0 or lang='it');
    insert into day_block_items(block_id,service_id,slot_key,is_default)
    select md5('large-block-'||n)::uuid,md5('large-service-'||(1+((n-1)*8+i)%360))::uuid,
      case when i%4=3 then 'ALOJAMIENTO' else 'SERVICIO' end,i<>7
      from generate_series(1,120) n cross join generate_series(0,7) i;
    insert into activity_modules(id,code,name,duration,status,created_by)
    select md5('large-module-'||n)::uuid,'CAT-MOD-'||n,'Actividad '||n,'HD_AM','activo','${catalogSeller}'
      from generate_series(1,30) n;
    insert into activity_module_translations(module_id,lang,title,description,reviewed)
    select md5('large-module-'||n)::uuid,'en','Activity '||n,'Module description '||n,true from generate_series(1,30) n;
    insert into activity_module_items(module_id,service_id)
    select md5('large-module-'||n)::uuid,md5('large-service-'||(1+n))::uuid from generate_series(1,30) n;
    insert into day_block_modules(block_id,module_id)
    select md5('large-block-'||(n*4))::uuid,md5('large-module-'||n)::uuid from generate_series(1,30) n;
    insert into itinerary_templates(id,sku,name,route_type,days,nights,category,status,created_by)
    values(md5('large-template')::uuid,'SPASPA-4D3N','Circuito de prueba','ROUNDTRIP',4,3,'COMFORT','pendiente','${catalogSeller}');
    insert into template_days(template_id,block_id,day_number)
    select md5('large-template')::uuid,md5('large-block-'||n)::uuid,n from generate_series(1,4) n;
    insert into clients(id,type,name) values(md5('large-client')::uuid,'B2C','Cliente sintético');
    analyze;
  `);
  const { rows } =
    await pg.query(`select md5('large-template')::uuid template_id,md5('large-client')::uuid client_id,
    (select jsonb_agg(id order by default_day_position) from day_blocks where code like 'CAT-DAY-%') block_ids`);
  await pg.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${catalogSeller}',false);`,
  );
  return rows[0];
}
