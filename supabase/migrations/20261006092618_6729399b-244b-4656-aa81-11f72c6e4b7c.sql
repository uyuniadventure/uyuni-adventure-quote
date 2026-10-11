-- Historical duplicate of 20261004000700_email_outbox.sql.
-- The canonical file owns the schema; preserve this applied ID as a check.
do $$
begin
 if (select count(*) from information_schema.columns where table_schema='public'
     and table_name='quote_emails' and column_name in ('provider_id','last_error','pdf_path')) <> 3
    or to_regprocedure('public.claim_quote_email(uuid,text,text,text)') is null
    or to_regprocedure('public.finish_quote_email(uuid,text)') is null
    or to_regprocedure('public.due_followups()') is null
    or to_regclass('public.followup_email_runs') is null
    or not exists (select 1 from pg_trigger where tgrelid='public.quotes'::regclass
      and tgname='guard_quote_delivery' and not tgisinternal) then
   raise exception 'Apply canonical migration 20261004000700 before its historical alias';
 end if;
end $$;
