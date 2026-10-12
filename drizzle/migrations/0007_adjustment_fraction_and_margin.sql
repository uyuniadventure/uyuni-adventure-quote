begin;

-- 006 already added adjustment_pct numeric NOT NULL DEFAULT 0 and adjustment_note
-- text. Its edit_quote_item persists both; version_quote copies the entire record.
-- This migration changes percent points to fractions, never guesses or clamps.
lock table public.quotes, public.quote_items in access exclusive mode;
do $$
declare invalid_count integer;
begin
  select count(*) into invalid_count from public.quote_items
    where not (adjustment_pct / 100 between -0.5 and 1);
  if invalid_count > 0 then
    raise exception '% ajustes anteriores fuera de -50%% a +100%%; revisar antes de migrar.', invalid_count;
  end if;
end;
$$;

-- Only the stored representation changes in sent/archived quotes: retain amounts,
-- notes, status, PDF and history. Locks and one transaction protect this conversion;
-- normal immutability/invalidation triggers are restored before committing.
alter table public.quote_items disable trigger guard_quote_item;
alter table public.quotes disable trigger guard_quote_state;
alter table public.quotes disable trigger guard_quote_delivery;
alter table public.quote_items drop constraint quote_items_adjustment_pct_check;
update public.quote_items set adjustment_pct=adjustment_pct/100 where adjustment_pct<>0;
alter table public.quote_items add constraint quote_items_adjustment_pct_check
  check(adjustment_pct between -0.5 and 1);
comment on column public.quote_items.adjustment_pct is
  'Quote-only fraction: 0.064 means +6.4%; range [-0.5,1]. Margin applies to adjusted cost (Andrea, 2026-10-11).';

update public.quotes q set calculation=jsonb_set(q.calculation,'{items}',(
  select jsonb_agg(case when x ? 'adjustment_pct'
    then jsonb_set(x,'{adjustment_pct}',to_jsonb((x->>'adjustment_pct')::numeric/100))
    else x end order by ord)
  from jsonb_array_elements(q.calculation->'items') with ordinality as saved(x,ord)
))
where jsonb_typeof(q.calculation->'items')='array'
  and exists(select 1 from jsonb_array_elements(q.calculation->'items') x
    where coalesce((x->>'adjustment_pct')::numeric,0)<>0);

-- Drafts/reviewed quotes must recalculate under the revised margin rule. Issued
-- quotes keep their agreed totals; their next version uses the new rule.
update public.quotes q set calculation=null,pdf_url=null,pdf_path=null,
  total_cost_usd=null,total_margin_usd=null,total_price_usd=null,
  price_per_pax_usd=null,single_supplement_pp=null
where q.status in ('borrador','revisada') and q.archived_at is null and exists(
  select 1 from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
  where d.quote_id=q.id and i.adjustment_pct<>0
);

-- Historical operational/template snapshots use the same fraction convention;
-- do not change their prices or notes. Promoted templates normally have zero.
update public.ops_items set item_snapshot=jsonb_set(item_snapshot,'{adjustment_pct}',
  to_jsonb((item_snapshot->>'adjustment_pct')::numeric/100))
where coalesce((item_snapshot->>'adjustment_pct')::numeric,0)<>0;
update public.day_block_items set item_snapshot=jsonb_set(item_snapshot,'{adjustment_pct}',
  to_jsonb((item_snapshot->>'adjustment_pct')::numeric/100))
where coalesce((item_snapshot->>'adjustment_pct')::numeric,0)<>0;

alter table public.quote_items enable trigger guard_quote_item;
alter table public.quotes enable trigger guard_quote_state;
alter table public.quotes enable trigger guard_quote_delivery;


create or replace function public.save_quote_calculation(p_id uuid,p_updated_at timestamptz,p_result jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; x jsonb;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at<>p_updated_at then raise exception 'Quote changed; recalculate again' using errcode='40001'; end if;
  if q.status not in ('borrador','revisada') then raise exception 'Cannot recalculate a sent quote'; end if;
  if jsonb_typeof(p_result->'items') is distinct from 'array' then raise exception 'Incomplete calculation'; end if;
  if (select count(distinct entry.value->>'id') from jsonb_array_elements(p_result->'items') as entry(value)) <> jsonb_array_length(p_result->'items') then raise exception 'Duplicate calculation items'; end if;
  for x in select value from jsonb_array_elements(p_result->'items') loop
    if coalesce((x->>'adjustment_pct')::numeric,0) is distinct from (
      select i.adjustment_pct from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
      where i.id=(x->>'id')::uuid and d.quote_id=p_id) then
      raise exception 'Calculation adjustment does not match saved item';
    end if;
    if x->>'status'='error' then
      -- Keep the frozen source/override intact; missing costs are NULL, never zero.
      update public.quote_items set total_cost_usd=null,total_cost_local=null
        where id=(x->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=p_id);
    else
      update public.quote_items set
        unit_cost_original=case when coalesce((x->>'covered')::boolean,false) then unit_cost_original else (x->>'unit_cost_original')::numeric end,
        unit_cost_usd=(x->>'unit_cost_usd')::numeric,total_cost_usd=(x->>'total_cost_usd')::numeric,
        total_cost_local=(x->>'quantity')::numeric*(x->>'unit_cost_original')::numeric*(1+adjustment_pct)
        where id=(x->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=p_id);
    end if;
    if not found then raise exception 'Calculation contains an unknown item'; end if;
  end loop;
  if jsonb_array_length(p_result->'items')<>(select count(*) from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=p_id) then raise exception 'Incomplete calculation'; end if;
  update public.quotes set calculation=p_result,total_cost_usd=(p_result->>'total_cost_usd')::numeric,
    total_margin_usd=(p_result->>'total_margin_usd')::numeric,total_price_usd=(p_result->>'total_price_usd')::numeric,
    price_per_pax_usd=(p_result->>'price_per_pax_usd')::numeric,single_supplement_pp=(p_result->>'single_supplement_pp')::numeric
    where id=p_id returning * into q;
  return q;
end; $$;

-- The RPC now returns the committed affected rows as well as the calculation.
drop function public.apply_quote_adjustment_bulk(uuid,jsonb,numeric,text,timestamptz,jsonb);
create function public.apply_quote_adjustment_bulk(
  p_id uuid, p_filter jsonb, p_pct numeric, p_note text,
  p_updated_at timestamptz, p_result jsonb
) returns jsonb
language plpgsql set search_path='' as $$
declare q public.quotes; matched uuid[]; affected uuid[]; listed uuid[]; total_name text;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at is distinct from p_updated_at then
    raise exception 'La cotización cambió; vuelve a calcular el ajuste.' using errcode='40001';
  end if;
  if q.archived_at is not null or q.status not in ('borrador','revisada') then
    raise exception 'Crea una nueva versión antes de ajustar una cotización enviada.';
  end if;
  if p_pct is null or not (p_pct between -0.5 and 1) then
    raise exception 'Ajuste inválido: usa una fracción entre -0.5 y 1.' using errcode='22023';
  end if;
  if p_filter is null or jsonb_typeof(p_filter)<>'object' or p_filter='{}'::jsonb then
    raise exception 'Indica al menos un filtro.' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_object_keys(p_filter) k
      where k not in ('type','supplier_id','day_number','item_ids'))
    or exists(select 1 from jsonb_each(p_filter) e where e.value='null'::jsonb) then
    raise exception 'Filtro desconocido o nulo.' using errcode='22023';
  end if;
  -- Casts reject malformed enums/UUIDs/numbers even when an empty selection
  -- would otherwise let a bad filter silently through.
  if p_filter ? 'type' then perform (p_filter->>'type')::public.service_type; end if;
  if p_filter ? 'supplier_id' then perform (p_filter->>'supplier_id')::uuid; end if;
  if p_filter ? 'day_number' and ((p_filter->>'day_number')::int <= 0
      or jsonb_typeof(p_filter->'day_number')<>'number') then
    raise exception 'Día inválido.' using errcode='22023';
  end if;
  if p_filter ? 'item_ids' then
    if jsonb_typeof(p_filter->'item_ids')<>'array' or p_filter->'item_ids'='[]'::jsonb then
      raise exception 'La lista de ítems está vacía o es inválida.' using errcode='22023';
    end if;
    select array_agg(value::uuid) into listed from jsonb_array_elements_text(p_filter->'item_ids');
    if exists(select 1 from unnest(listed) as requested(item_id) where requested.item_id is null or not exists (
      select 1 from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
      where i.id=requested.item_id and d.quote_id=p_id)) then
      raise exception 'La lista contiene ítems ajenos a esta cotización.' using errcode='22023';
    end if;
  end if;
  select array_agg(i.id) into matched
    from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
    where d.quote_id=p_id
      and (not p_filter ? 'type' or i.type=(p_filter->>'type')::public.service_type)
      and (not p_filter ? 'supplier_id' or i.supplier_id=(p_filter->>'supplier_id')::uuid)
      and (not p_filter ? 'day_number' or d.day_number=(p_filter->>'day_number')::int)
      and (listed is null or i.id=any(listed));
  if coalesce(cardinality(matched),0)=0 then
    raise exception 'El filtro no coincide con ningún ítem.' using errcode='22023';
  end if;
  select array_agg(i.id) into affected
    from public.quote_items i join public.quote_days d on d.id=i.quote_day_id
    where d.quote_id=p_id and (i.id=any(matched) or (i.day_span>1 and exists (
      select 1 from public.quote_items selected where selected.id=any(matched)
      and selected.day_span>1 and selected.pricing_snapshot->>'coverage_key'=i.pricing_snapshot->>'coverage_key'
    )));
  if p_result is null or p_result->>'status' is distinct from 'ok'
    or jsonb_typeof(p_result->'items') is distinct from 'array'
    or public.calculation_has_errors(p_result) then
    raise exception 'No se puede aplicar un ajuste sin cálculo completo.' using errcode='22023';
  end if;
  foreach total_name in array array['total_cost_usd','total_margin_usd','total_price_usd','price_per_pax_usd'] loop
    if p_result->>total_name is null or not ((p_result->>total_name)::numeric >= 0
        and (p_result->>total_name)::numeric < 'Infinity'::numeric) then
      raise exception 'Faltan totales válidos en el cálculo.' using errcode='22023';
    end if;
  end loop;
  update public.quote_items set adjustment_pct=p_pct, adjustment_note=nullif(btrim(p_note),'')
    where id=any(affected);
  -- Child triggers touch updated_at and invalidate calculation/PDF. Use the new
  -- revision inside this same transaction, never a second network request.
  select * into strict q from public.quotes where id=p_id;
  q:=public.save_quote_calculation(p_id,q.updated_at,p_result);
  return jsonb_build_object('quote_id',q.id,'matched_item_ids',to_jsonb(matched),
    'affected_item_ids',to_jsonb(affected),'calculation',q.calculation,
    'items',(select jsonb_agg(i order by i.id) from public.quote_items i where i.id=any(affected)));
end;
$$;
revoke all on function public.apply_quote_adjustment_bulk(uuid,jsonb,numeric,text,timestamptz,jsonb) from public,anon;
grant execute on function public.apply_quote_adjustment_bulk(uuid,jsonb,numeric,text,timestamptz,jsonb) to authenticated;
commit;