begin;

-- Sold quotes retain private snapshots in Operations. A seller must not gain
-- access to someone else's quotation through those copies or their child rows.
drop policy operations_read on public.ops_services;
create policy operations_read on public.ops_services for select to authenticated
using (public.current_role() in ('admin','operacion') or
  (public.current_role()='vendedor' and exists (
    select 1 from public.quotes q where q.id=quote_id and q.seller_id=auth.uid()
  )));

do $$
declare t text;
begin
  foreach t in array array['ops_items','ops_supplier_payables','ops_communications'] loop
    execute format('drop policy operations_read on public.%I',t);
    execute format('create policy operations_read on public.%I for select to authenticated
      using (exists(select 1 from public.ops_services o where o.id=service_id))',t);
  end loop;
end;
$$;

-- Read Auth email at query time, so an email change is immediately reflected.
-- Do not expose auth.users, copy credentials, or broaden profiles_read.
create function public.admin_list_users() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if public.current_role() is distinct from 'admin' then
    raise exception 'Solo Admin puede consultar los usuarios y sus emails.' using errcode='42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',p.id,'email',u.email,'full_name',p.full_name,'role',p.role,'created_at',p.created_at
  ) order by p.created_at,p.id) from public.profiles p join auth.users u on u.id=p.id),'[]');
end;
$$;
revoke all on function public.admin_list_users() from public,anon;
grant execute on function public.admin_list_users() to authenticated;

commit;