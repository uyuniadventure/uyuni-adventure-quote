-- T18: optional manual seed, never a production migration or an automatic seed.
-- First create and confirm BOTH accounts in Auth; see docs/T18_ROLES.md.
-- Run as database owner. No passwords, Auth inserts, or existing admin changes.
begin;
do $$
begin
  if (select count(*) from auth.users
      where lower(email) in ('operacion@prueba.local','vendedor@prueba.local')
        and email_confirmed_at is not null) <> 2 then
    raise exception 'Crea y confirma en Auth operacion@prueba.local y vendedor@prueba.local antes del seed.';
  end if;
  if exists(select 1 from public.profiles p join auth.users u on u.id=p.id
      where lower(u.email) in ('operacion@prueba.local','vendedor@prueba.local')
        and p.role='admin') then
    raise exception 'Una cuenta de prueba ya es Admin; se cancela todo sin cambiar roles.';
  end if;
  insert into public.profiles(id,role,full_name)
  select id,
    case lower(email) when 'operacion@prueba.local' then 'operacion'::public.app_role
      else 'vendedor'::public.app_role end,
    case lower(email) when 'operacion@prueba.local' then 'Operación de prueba'
      else 'Vendedor de prueba' end
  from auth.users
  where lower(email) in ('operacion@prueba.local','vendedor@prueba.local')
  on conflict(id) do update set role=excluded.role;
end;
$$;
select u.email,p.role from public.profiles p join auth.users u on u.id=p.id
where lower(u.email) in ('operacion@prueba.local','vendedor@prueba.local') order by u.email;
commit;
