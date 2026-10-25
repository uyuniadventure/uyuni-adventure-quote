begin;

-- Resolve all current catalogue rows for one table with a single catalogue scan.
-- Callers pass the original import row position as __position so comparisons
-- remain tied to the exact preview row.
create function public._import_current_rows(p_table text, p_rows jsonb)
returns table(row_position int, current_row jsonb)
language plpgsql
set search_path=''
as $$
declare
  predicate text;
begin
  if not (p_table=any(public._import_tables())) then
    raise exception 'Tabla de importación no permitida.';
  end if;
  predicate:=case when p_table='doc_block_translations'
    then 't.block_id=(i.payload->>''block_id'')::uuid and t.lang=i.payload->>''lang'''
    else 't.id=(i.payload->>''id'')::uuid'
  end;
  return query execute format($sql$
    with input as (
      select coalesce((value->>'__position')::int, ordinality::int-1) row_position,
             value->'payload' payload
      from jsonb_array_elements($1) with ordinality
      where value->>'table_name'=$2
    )
    select i.row_position,
           case when to_jsonb(t) is null then null else (
             select jsonb_object_agg(k, to_jsonb(t)->k)
             from jsonb_object_keys(i.payload) k
           ) end current_row
    from input i
    left join public.%I t on %s
  $sql$,p_table,predicate) using p_rows,p_table;
end $$;
revoke all on function public._import_current_rows(text,jsonb) from public,anon,authenticated;

-- Keep the economic-validation wrapper installed by 20261024000100. Replace
-- only its underlying implementation, which is where the expensive row loop
-- and repeated information_schema lookups lived.
create or replace function public.stage_import_package_before_economic_guard(
  p_file_name text,p_package jsonb,p_rows jsonb,p_validation jsonb
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  batch uuid;
  target_table text;
  table_rows jsonb;
  table_counts jsonb;
  current_mismatch text;
  invalid_column text;
  r jsonb;
  n int;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then
    raise exception 'Solo Admin puede importar.' using errcode='42501';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array'
     or jsonb_array_length(p_rows)>30000
     or jsonb_typeof(p_validation->'errors') is distinct from 'array' then
    raise exception 'Paquete o validación inválidos.';
  end if;
  if length(p_file_name)>250 or octet_length(p_package::text)>30000000 then
    raise exception 'Paquete demasiado grande.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_rows) row_data
    where not ((row_data->>'table_name')=any(public._import_tables()))
       or jsonb_typeof(row_data->'payload') is distinct from 'object'
  ) then
    raise exception 'Fila de importación inválida.';
  end if;

  -- One pg_catalog join validates every payload key. The former nested loop
  -- queried information_schema.columns once per key (tens of thousands of
  -- catalogue queries for a historical package).
  select key_name into invalid_column
  from jsonb_array_elements(p_rows) with ordinality row_data(value,row_number)
  cross join lateral jsonb_object_keys(row_data.value->'payload') key_name
  left join pg_catalog.pg_namespace ns on ns.nspname='public'
  left join pg_catalog.pg_class cls on cls.relnamespace=ns.oid
    and cls.relname=row_data.value->>'table_name' and cls.relkind in ('r','p')
  left join pg_catalog.pg_attribute attr on attr.attrelid=cls.oid
    and attr.attname=key_name and attr.attnum>0 and not attr.attisdropped
  where key_name in ('created_by','created_at','updated_at') or attr.attname is null
  order by row_number,key_name
  limit 1;
  if invalid_column is not null then
    raise exception 'Columna de importación no permitida: %',invalid_column;
  end if;

  p_validation:=jsonb_set(
    p_validation,'{errors}',
    (p_validation->'errors')||public._validate_import_package(p_package)
  );

  select coalesce(jsonb_object_agg(counts.table_name,counts.row_count),'{}') into table_counts
  from (
    select value->>'table_name' table_name,count(*) row_count
    from jsonb_array_elements(p_rows)
    group by value->>'table_name'
  ) counts;
  if jsonb_array_length(p_validation->'errors')=0 then
    for r in select value from jsonb_array_elements(
      '[{"table":"services","key":"tariffs"},{"table":"service_rates","key":"tariffs"},{"table":"itinerary_templates","key":"templates"},{"table":"template_days","key":"days"},{"table":"template_segment_items","key":"segments"},{"table":"template_day_items","key":"lodging"},{"table":"segment_rules","key":"rules"},{"table":"doc_block_translations","key":"pdf"}]'::jsonb
    ) loop
      if coalesce((table_counts->>(r->>'table'))::int,0)<>jsonb_array_length(p_package->(r->>'key')) then
        p_validation:=jsonb_set(
          p_validation,'{errors}',
          (p_validation->'errors')||jsonb_build_array(jsonb_build_object(
            'key',r->>'table','message','Vista previa incompleta; vuelve a preparar el paquete.'
          ))
        );
      end if;
    end loop;
  end if;

  insert into public.import_batches(file_name,package,summary)
  values(p_file_name,p_package,p_validation) returning id into batch;

  foreach target_table in array public._import_tables() loop
    select jsonb_agg(value||jsonb_build_object('__position',row_number-1) order by row_number)
      into table_rows
    from jsonb_array_elements(p_rows) with ordinality row_data(value,row_number)
    where value->>'table_name'=target_table;
    if table_rows is null then continue; end if;

    select source.value->>'natural_key' into current_mismatch
    from jsonb_array_elements(table_rows) source(value)
    join public._import_current_rows(target_table,table_rows) current
      on current.row_position=(source.value->>'__position')::int
    where current.current_row is distinct from nullif(source.value->'before','null')
    order by current.row_position
    limit 1;
    if current_mismatch is not null then
      raise exception 'El catálogo cambió; vuelve a preparar la importación.' using errcode='40001';
    end if;

    insert into public.import_rows(
      batch_id,position,table_name,natural_key,action,payload,before
    )
    select batch,current.row_position,target_table,source.value->>'natural_key',
      case when current.current_row is null then 'insert'
           when current.current_row=source.value->'payload' then 'skip'
           else 'update' end,
      source.value->'payload',current.current_row
    from jsonb_array_elements(table_rows) source(value)
    join public._import_current_rows(target_table,table_rows) current
      on current.row_position=(source.value->>'__position')::int;
  end loop;

  select coalesce(max(position)+1,0) into n
  from public.import_rows where batch_id=batch;
  for r in select value from jsonb_array_elements(p_validation->'errors') loop
    insert into public.import_rows(
      batch_id,position,table_name,natural_key,action,payload,message
    ) values(batch,n,'validation',n::text,'error',r,r->>'message');
    n:=n+1;
  end loop;
  update public.import_batches set summary=summary||jsonb_build_object('tables',(
    select coalesce(jsonb_object_agg(table_name,counts),'{}') from (
      select table_name,jsonb_object_agg(action,row_count) counts from (
        select table_name,action,count(*) row_count
        from public.import_rows where batch_id=batch group by table_name,action
      ) actions group by table_name
    ) tables
  )) where id=batch;
  return batch;
end $$;
revoke all on function public.stage_import_package_before_economic_guard(text,jsonb,jsonb,jsonb) from public,anon,authenticated;

-- Commit compares each table in one set and groups writes by table, action and
-- payload shape. This preserves omitted-column defaults and partial-update
-- semantics while reducing thousands of dynamic statements to a few dozen.
create or replace function public.commit_import_batch_before_economic_guard(p_batch_id uuid)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  batch public.import_batches;
  target_table text;
  table_rows jsonb;
  group_data record;
  sample_payload jsonb;
  cols text;
  expr text;
  predicate text;
  failure text;
  changed_key text;
  counts jsonb;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then
    raise exception 'Solo Admin puede confirmar importaciones.' using errcode='42501';
  end if;
  select * into batch from public.import_batches where id=p_batch_id for update;
  if not found then raise exception 'Lote inexistente.'; end if;
  if batch.status<>'staged' then
    raise exception 'El lote ya fue confirmado o descartado.';
  end if;
  begin
    lock table public.location_codes,public.suppliers,public.services,public.service_rates,
      public.day_blocks,public.day_block_translations,public.day_block_items,
      public.doc_blocks,public.doc_block_translations,public.itinerary_templates,
      public.template_days,public.template_segment_items,public.template_day_items,
      public.segment_rules in share row exclusive mode;
    if exists(select 1 from public.import_rows where batch_id=p_batch_id and action='error') then
      raise exception 'Hay errores de validación.';
    end if;

    foreach target_table in array public._import_tables() loop
      select jsonb_agg(jsonb_build_object(
        '__position',position,'table_name',target_table,'payload',payload
      ) order by position) into table_rows
      from public.import_rows
      where batch_id=p_batch_id and import_rows.table_name=target_table;
      if table_rows is null then continue; end if;

      select rows.natural_key into changed_key
      from public.import_rows rows
      join public._import_current_rows(target_table,table_rows) current
        on current.row_position=rows.position
      where rows.batch_id=p_batch_id and rows.table_name=target_table
        and current.current_row is distinct from rows.before
      order by rows.position
      limit 1;
      if changed_key is not null then
        raise exception 'El catálogo cambió en %; repite la vista previa.',changed_key;
      end if;

      for group_data in
        select action,
          (select string_agg(key,',' order by key) from jsonb_object_keys(payload) key) signature,
          jsonb_agg(payload order by position) payloads,
          min(position) first_position
        from public.import_rows
        where batch_id=p_batch_id and import_rows.table_name=target_table
          and action in ('insert','update')
        group by action,(select string_agg(key,',' order by key) from jsonb_object_keys(payload) key)
        order by min(position)
      loop
        sample_payload:=group_data.payloads->0;
        if group_data.action='insert' then
          select string_agg(format('%I',key),',' order by key),
                 string_agg(format('x.%I',key),',' order by key)
            into cols,expr
          from jsonb_object_keys(sample_payload) key;
          execute format(
            'insert into public.%I(%s) select %s from jsonb_populate_recordset(null::public.%I,$1) x',
            target_table,cols,expr,target_table
          ) using group_data.payloads;
        else
          select string_agg(format('%1$I=x.%1$I',key),',' order by key)
            into expr
          from jsonb_object_keys(sample_payload) key
          where key<>'id' and (target_table<>'doc_block_translations' or key not in ('block_id','lang'));
          predicate:=case when target_table='doc_block_translations'
            then 't.block_id=x.block_id and t.lang=x.lang'
            else 't.id=x.id'
          end;
          if expr is not null then
            execute format(
              'update public.%I t set %s from jsonb_populate_recordset(null::public.%I,$1) x where %s',
              target_table,expr,target_table,predicate
            ) using group_data.payloads;
          end if;
        end if;
      end loop;
    end loop;

    select jsonb_object_agg(action,n) into counts
    from (select action,count(*) n from public.import_rows
          where batch_id=p_batch_id group by action) c;
    update public.import_batches
      set status='committed',summary=(summary-'error')||jsonb_build_object('counts',counts)
      where id=p_batch_id;
    return jsonb_build_object('status','committed','counts',counts);
  exception when others then
    get stacked diagnostics failure=message_text;
    update public.import_batches
      set summary=summary||jsonb_build_object('error',failure)
      where id=p_batch_id;
    return jsonb_build_object('status','staged','error',failure);
  end;
end $$;
revoke all on function public.commit_import_batch_before_economic_guard(uuid) from public,anon,authenticated;

commit;
