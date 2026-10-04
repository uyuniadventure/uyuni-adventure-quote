begin;
-- Always schema-qualify this function: CURRENT_ROLE is also a SQL keyword.
create function public.current_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid();
$$;
revoke all on function public.current_role() from public;
grant execute on function public.current_role() to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- Profile administration is admin-only; each user can read their own role for auth.
create policy profiles_read on public.profiles for select to authenticated
using (id = auth.uid() or public.current_role() = 'admin');
create policy profiles_admin on public.profiles for all to authenticated
using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- User request: currencies, FX, terms and banking are accessible only to admin.
do $$
declare t text;
begin
  foreach t in array array['currencies','exchange_rates','terms_conditions','bank_accounts','info_blocks'] loop
    execute format('create policy admin_only on public.%I for all to authenticated using (public.current_role() = ''admin'') with check (public.current_role() = ''admin'')', t);
  end loop;
  foreach t in array array['location_codes','hotel_codes'] loop
    execute format('create policy team_read on public.%I for select to authenticated using (public.current_role() is not null)', t);
    execute format('create policy admin_write on public.%I for all to authenticated using (public.current_role() = ''admin'') with check (public.current_role() = ''admin'')', t);
  end loop;
  foreach t in array array['suppliers','places','media'] loop
    execute format('create policy team_read on public.%I for select to authenticated using (public.current_role() is not null)', t);
    execute format('create policy operations_write on public.%I for all to authenticated using (public.current_role() in (''admin'', ''operacion'')) with check (public.current_role() in (''admin'', ''operacion''))', t);
  end loop;
end;
$$;

-- A seller can create pending services, but cannot mutate the tariff thereafter.
create policy services_read on public.services for select to authenticated
using (public.current_role() in ('admin','operacion') or
  (public.current_role() = 'vendedor' and (status = 'activo' or created_by = auth.uid())));
create policy services_create_pending on public.services for insert to authenticated
with check (public.current_role() = 'vendedor' and status = 'pendiente' and created_by = auth.uid());
create policy services_operations on public.services for all to authenticated
using (public.current_role() in ('admin','operacion'))
with check (public.current_role() in ('admin','operacion'));
do $$
declare t text;
begin
  foreach t in array array['service_rates','service_sku_aliases'] loop
    execute format('create policy visible_service on public.%I for select to authenticated using (exists (select 1 from public.services s where s.id = service_id))', t);
    execute format('create policy operations_write on public.%I for all to authenticated using (public.current_role() in (''admin'', ''operacion'')) with check (public.current_role() in (''admin'', ''operacion''))', t);
  end loop;
end;
$$;
create policy change_requests_read on public.service_change_requests for select to authenticated
using (public.current_role() in ('admin','operacion') or (public.current_role() = 'vendedor' and requested_by = auth.uid()));
create policy change_requests_create on public.service_change_requests for insert to authenticated
with check (public.current_role() is not null and requested_by = auth.uid()
  and status = 'pendiente' and approved_by is null and reviewed_at is null
  and (exists(select 1 from public.services s where s.id = service_id)
    or exists(select 1 from public.service_rates r where r.id = rate_id)));
create policy change_requests_review on public.service_change_requests for all to authenticated
using (public.current_role() in ('admin','operacion'))
with check (public.current_role() in ('admin','operacion'));

-- Approved content cannot be changed by sellers via a child row or by reparenting.
do $$
declare t text; child record;
begin
  foreach t in array array['activity_modules','day_blocks','itinerary_templates'] loop
    execute format('create policy catalog_read on public.%I for select to authenticated using (public.current_role() in (''admin'', ''operacion'') or (public.current_role() = ''vendedor'' and (status = ''activo'' or created_by = auth.uid())))', t);
    execute format('create policy catalog_seller_insert on public.%I for insert to authenticated with check (public.current_role() = ''vendedor'' and status = ''pendiente'' and created_by = auth.uid())', t);
    execute format('create policy catalog_seller_update on public.%I for update to authenticated using (public.current_role() = ''vendedor'' and status = ''pendiente'' and created_by = auth.uid()) with check (public.current_role() = ''vendedor'' and status = ''pendiente'' and created_by = auth.uid())', t);
    execute format('create policy catalog_operations on public.%I for all to authenticated using (public.current_role() in (''admin'', ''operacion'')) with check (public.current_role() in (''admin'', ''operacion''))', t);
  end loop;
  for child in select * from (values
    ('activity_module_translations','activity_modules','module_id'),
    ('activity_module_items','activity_modules','module_id'),
    ('day_block_translations','day_blocks','block_id'),
    ('day_block_modules','day_blocks','block_id'),
    ('day_block_items','day_blocks','block_id'),
    ('template_days','itinerary_templates','template_id')
  ) v(tbl,parent,fk) loop
    execute format('create policy parent_read on public.%I for select to authenticated using (exists(select 1 from public.%I p where p.id = %I))', child.tbl, child.parent, child.fk);
    execute format('create policy parent_write on public.%I for all to authenticated using (public.current_role() in (''admin'', ''operacion'') or (public.current_role() = ''vendedor'' and exists(select 1 from public.%I p where p.id = %I and p.status = ''pendiente'' and p.created_by = auth.uid()))) with check (public.current_role() in (''admin'', ''operacion'') or (public.current_role() = ''vendedor'' and exists(select 1 from public.%I p where p.id = %I and p.status = ''pendiente'' and p.created_by = auth.uid())))', child.tbl, child.parent, child.fk, child.parent, child.fk);
  end loop;
end;
$$;
create policy clients_team on public.clients for all to authenticated
using (public.current_role() is not null) with check (public.current_role() is not null);

-- §3: only admin sees every quote; operations can edit their own quotes.
create policy quotes_owner on public.quotes for all to authenticated
using (public.current_role() = 'admin' or (public.current_role() is not null and seller_id = auth.uid()))
with check (public.current_role() = 'admin' or (public.current_role() is not null and seller_id = auth.uid()));
do $$
declare t text;
begin
  foreach t in array array['quote_days','quote_status_history','quote_payments','quote_followups','quote_emails'] loop
    execute format('create policy quote_owner on public.%I for all to authenticated using (exists (select 1 from public.quotes q where q.id = quote_id)) with check (exists (select 1 from public.quotes q where q.id = quote_id))', t);
  end loop;
end;
$$;
create policy quote_items_owner on public.quote_items for all to authenticated
using (exists(select 1 from public.quote_days d where d.id = quote_day_id))
with check (exists(select 1 from public.quote_days d where d.id = quote_day_id));

do $$
declare t text;
begin
  foreach t in array array['ops_services','ops_items','ops_supplier_payables','ops_communications'] loop
    execute format('create policy operations_read on public.%I for select to authenticated using (public.current_role() is not null)', t);
    execute format('create policy operations_write on public.%I for all to authenticated using (public.current_role() in (''admin'', ''operacion'')) with check (public.current_role() in (''admin'', ''operacion''))', t);
  end loop;
end;
$$;
create policy passengers_operations_only on public.ops_passengers for all to authenticated
using (public.current_role() in ('admin','operacion'))
with check (public.current_role() in ('admin','operacion'));

-- Private counter has RLS with no direct policies; only the controlled RPC updates it.
revoke all on public.quote_year_counters from authenticated;
create function public.next_quote_code(p_sku text, p_language text) returns text
language plpgsql security definer set search_path = '' as $$
declare quote_year integer := extract(year from timezone('America/Santiago', now()));
  sequence_value bigint;
begin
  if public.current_role() is null then
    raise exception 'A registered profile is required' using errcode = '42501';
  end if;
  if p_sku is null or btrim(p_sku) = '' or p_language is null or p_language !~ '^[A-Za-z]{2,3}$' then
    raise exception 'SKU and two/three-letter language are required' using errcode = '22023';
  end if;
  insert into public.quote_year_counters(year,last_value) values (quote_year,1)
  on conflict(year) do update set last_value = public.quote_year_counters.last_value + 1
  returning last_value into sequence_value;
  return btrim(p_sku) || '-' || upper(p_language) || '-' || right(quote_year::text,2)
    || '-' || lpad(sequence_value::text, greatest(4,length(sequence_value::text)), '0');
end;
$$;
revoke all on function public.next_quote_code(text,text) from public;
grant execute on function public.next_quote_code(text,text) to authenticated;
comment on function public.next_quote_code(text,text) is 'Atomic annual counter in Santiago time. Gaps are allowed. Versions append -vN to the original code without allocating a new number.';

-- Views run with the caller's RLS, never the owner's privileges. No passenger data.
create view public.ops_service_summary with (security_invoker = true) as
select id, booking_code, start_date, end_date, pax, quoted_cost_usd,
  real_cost_usd, sale_price_usd, real_margin_usd, status from public.ops_services;
create view public.ops_pending_payables with (security_invoker = true) as
select p.*, s.name as supplier_name from public.ops_supplier_payables p
join public.suppliers s on s.id = p.supplier_id
where p.status <> 'pagado' order by p.due_date nulls last;
create view public.ops_active_accommodation_bookings with (security_invoker = true) as
select i.id, i.service_id, o.booking_code, i.description as hotel,
  i.check_in, i.check_out, i.room_distribution, i.booking_status,
  s.email as hotel_email, p.due_date, p.paid_date
from public.ops_items i join public.ops_services o on o.id = i.service_id
left join public.suppliers s on s.id = i.supplier_id
left join public.ops_supplier_payables p on p.service_id = i.service_id
  and p.supplier_id = i.supplier_id and p.currency = i.currency
where i.type = 'alojamiento' and o.status in ('activo','en_curso') and i.booking_status <> 'cancelado';
grant select on public.ops_service_summary, public.ops_pending_payables, public.ops_active_accommodation_bookings to authenticated;
commit;
