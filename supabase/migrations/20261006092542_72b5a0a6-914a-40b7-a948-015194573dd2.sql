begin;
alter table public.quotes add column pdf_path text;
create policy quote_pdf_read on storage.objects for select to authenticated using (
 bucket_id='quote-pdfs' and exists(select 1 from public.quotes q where q.id::text=split_part(name,'/',1)));
create policy quote_pdf_insert on storage.objects for insert to authenticated with check (
 bucket_id='quote-pdfs' and exists(select 1 from public.quotes q where q.id::text=split_part(name,'/',1) and q.status in ('borrador','revisada') and q.archived_at is null));
-- No update/delete: previous PDFs are immutable evidence of what was sent.
create function public.save_quote_pdf(p_id uuid,p_updated_at timestamptz,p_path text,p_url text) returns void
language plpgsql set search_path='' as $$
declare q public.quotes;
begin
 select * into strict q from public.quotes where id=p_id for update;
 if q.updated_at<>p_updated_at then raise exception 'Quote changed; regenerate PDF' using errcode='40001'; end if;
 if q.calculation is null or q.status not in ('borrador','revisada') or q.archived_at is not null then raise exception 'Quote is not ready for PDF'; end if;
 if split_part(p_path,'/',1)<>q.id::text or not exists(select 1 from storage.objects where bucket_id='quote-pdfs' and name=p_path) then raise exception 'PDF object not accessible'; end if;
 update public.quotes set pdf_url=p_url,pdf_path=p_path where id=q.id;
end; $$;
revoke all on function public.save_quote_pdf(uuid,timestamptz,text,text) from public;
grant execute on function public.save_quote_pdf(uuid,timestamptz,text,text) to authenticated;
commit;