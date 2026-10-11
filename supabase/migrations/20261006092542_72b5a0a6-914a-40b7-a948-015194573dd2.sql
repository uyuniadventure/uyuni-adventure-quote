-- Historical duplicate of 20261004000600_quote_pdf_storage.sql.
-- Preserve the applied ID while the canonical migration owns these objects.
-- Existing Cloud databases need no SQL or history repair for this reconciliation.
do $$
begin
 if not exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='quotes' and column_name='pdf_path')
    or to_regprocedure('public.save_quote_pdf(uuid,timestamp with time zone,text,text)') is null
    or not exists (select 1 from pg_policies where schemaname='storage'
      and tablename='objects' and policyname='quote_pdf_read')
    or not exists (select 1 from pg_policies where schemaname='storage'
      and tablename='objects' and policyname='quote_pdf_insert') then
   raise exception 'Apply canonical migration 20261004000600 before its historical alias';
 end if;
end $$;
