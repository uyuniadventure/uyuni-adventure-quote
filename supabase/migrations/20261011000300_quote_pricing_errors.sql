begin;

-- Error state is kept in the existing calculation JSON; no UI/schema columns needed.
create function public.calculation_has_errors(result jsonb) returns boolean
language sql immutable set search_path='' as $$
  select coalesce(result->>'status'='error',false)
    or exists(select 1 from jsonb_array_elements(coalesce(result->'items','[]')) x where x->>'status'='error')
    or exists(select 1 from jsonb_array_elements(coalesce(result->'scenarios','[]')) x where x->>'status'='error');
$$;

create function public.guard_quote_pricing_errors() returns trigger
language plpgsql set search_path='' as $$
begin
  if not public.calculation_has_errors(new.calculation) then return new; end if;
  if new.status in ('enviada','vendida','perdida') or
    (tg_op='UPDATE' and new.status='revisada' and new.status is distinct from old.status) then
    raise exception 'Cotización con errores de cálculo: corrige las tarifas sin costo neto ni rack';
  end if;
  if tg_op='UPDATE' and (
    (new.pdf_path is not null and new.pdf_path is distinct from old.pdf_path) or
    (new.pdf_url is not null and new.pdf_url is distinct from old.pdf_url)) then
    raise exception 'Cotización con errores de cálculo: no se puede guardar un PDF';
  end if;
  new.calculation:=new.calculation || jsonb_build_object('status','error',
    'total_cost_usd',null,'total_margin_usd',null,'total_price_usd',null,
    'price_per_pax_usd',null,'single_supplement_pp',null);
  new.total_cost_usd:=null; new.total_margin_usd:=null; new.total_price_usd:=null;
  new.price_per_pax_usd:=null; new.single_supplement_pp:=null;
  new.pdf_path:=null; new.pdf_url:=null;
  return new;
end; $$;
-- Runs after the existing state/invalidation guards (PostgreSQL orders by name).
create trigger zz_guard_quote_pricing_errors before insert or update on public.quotes
  for each row execute function public.guard_quote_pricing_errors();

create or replace function public.save_quote_calculation(p_id uuid,p_updated_at timestamptz,p_result jsonb) returns public.quotes
language plpgsql set search_path='' as $$
declare q public.quotes; x jsonb;
begin
  select * into strict q from public.quotes where id=p_id for update;
  if q.updated_at<>p_updated_at then raise exception 'Quote changed; recalculate again' using errcode='40001'; end if;
  if q.status not in ('borrador','revisada') then raise exception 'Cannot recalculate a sent quote'; end if;
  for x in select value from jsonb_array_elements(p_result->'items') loop
    if x->>'status'='error' then
      -- Keep the frozen source/override intact; missing costs are NULL, never zero.
      update public.quote_items set total_cost_usd=null,total_cost_local=null
        where id=(x->>'id')::uuid and quote_day_id in(select id from public.quote_days where quote_id=p_id);
    else
      update public.quote_items set
        unit_cost_original=case when coalesce((x->>'covered')::boolean,false) then unit_cost_original else (x->>'unit_cost_original')::numeric end,
        unit_cost_usd=(x->>'unit_cost_usd')::numeric,total_cost_usd=(x->>'total_cost_usd')::numeric,
        total_cost_local=(x->>'quantity')::numeric*(x->>'unit_cost_original')::numeric
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

revoke all on function public.calculation_has_errors(jsonb),public.guard_quote_pricing_errors() from public,anon;
grant execute on function public.calculation_has_errors(jsonb),public.guard_quote_pricing_errors() to authenticated;
commit;
