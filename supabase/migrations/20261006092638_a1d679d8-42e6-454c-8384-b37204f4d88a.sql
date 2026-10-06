update public.profiles p set role = 'admin'
from auth.users u
where u.id = p.id and u.email = '[TU EMAIL]';