-- Commit the enum value before using it in the following migration (PostgreSQL).
begin;
alter type public.quote_status add value if not exists 'cancelada';
commit;
