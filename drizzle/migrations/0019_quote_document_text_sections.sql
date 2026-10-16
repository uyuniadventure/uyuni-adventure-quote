-- Apply after T13 (20261016000200). Historical migrations stay unchanged.
begin;

create or replace function public.validate_quote_document_patch(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; v jsonb; block jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object' or p='{}'::jsonb then return false; end if;
  for k,v in select * from jsonb_each(p) loop
    if k='client_name' then
      if jsonb_typeof(v)<>'string' or length(btrim(v#>>'{}')) not between 1 and 200 then return false; end if;
    elsif k in ('introduction','guide','payment_text','cancellation') then
      if jsonb_typeof(v)<>'string' or length(v#>>'{}')>20000 then return false; end if;
    elsif k='terms_url' then
      if jsonb_typeof(v)<>'string' or length(v#>>'{}')>2048 then return false; end if;
    elsif k='info' then
      -- Check types before calling set-returning functions (SQL OR is not short-circuit).
      if jsonb_typeof(v)<>'array' then return false; end if;
      if jsonb_array_length(v)>50 then return false; end if;
      for block in select * from jsonb_array_elements(v) loop
        if jsonb_typeof(block)<>'object' then return false; end if;
        if (select count(*) from jsonb_object_keys(block)) <> 2
          or not (block ? 'title' and block ? 'content')
          or jsonb_typeof(block->'title')<>'string' or length(btrim(block->>'title')) not between 1 and 200
          or jsonb_typeof(block->'content')<>'string' or length(block->>'content')>10000
        then return false; end if;
      end loop;
    else return false;
    end if;
  end loop;
  return true;
end; $$;

-- Reusable empty text blocks; customer text remains private to each quote.
insert into public.doc_blocks(code,kind,status) values
  ('PAGO_TEXTO','static','activo'),('CANCELACION','static','activo'),('INFO_PRACTICA','static','activo');
insert into public.doc_block_translations(block_id,lang,title)
select b.id,t.lang,t.title from (values
  ('PAGO_TEXTO','es','Condiciones de pago'),('PAGO_TEXTO','en','Payment conditions'),('PAGO_TEXTO','it','Condizioni di pagamento'),
  ('CANCELACION','es','Cancelación'),('CANCELACION','en','Cancellation'),('CANCELACION','it','Cancellazione'),
  ('INFO_PRACTICA','es','Información práctica'),('INFO_PRACTICA','en','Practical information'),('INFO_PRACTICA','it','Informazioni pratiche')
) t(code,lang,title) join public.doc_blocks b on b.code=t.code;

-- Legacy fields were plain text. Escape before wrapping: do not interpret or strip markup.
create function public._document_text_html(p text) returns text
language sql immutable set search_path='' as $$
  select '<p>'||replace(replace(replace(replace(replace(replace(replace(coalesce(p,''),
    '&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;'),E'\r\n',E'\n'),E'\n','<br>')||'</p>'
$$;

create function public._migrate_quote_document_texts(p_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare q public.quotes; part record; s public.quote_doc_sections; b public.doc_blocks;
  doc jsonb; snap jsonb; html text; label text; position int; opts jsonb; target uuid;
begin
  select * into q from public.quotes where id=p_id for update;
  if q.id is null or q.status<>'borrador' or q.archived_at is not null
    or q.document_snapshot->>'text_sections_migrated'='true'
    or exists(select 1 from public.quote_proposals where quote_id=p_id and frozen_at is not null)
    or exists(select 1 from public.quote_emails where quote_id=p_id and status='pendiente')
  then return; end if;
  doc:=coalesce(q.document_snapshot,'{}');

  -- Initialize the complete document, never a partial list of just the legacy texts.
  if not exists(select 1 from public.quote_doc_sections where quote_id=p_id) then
    -- A legacy quote without text keeps lazy initialization on opening PDF y envío.
    if not exists(select 1 from unnest(array['introduction','payment_text','cancellation','terms','terms_url']) k
      where coalesce(doc->>k,'')<>'')
      and coalesce(doc->'info','[]'::jsonb) in ('[]'::jsonb,'null'::jsonb)
    then return; end if;
    insert into public.quote_doc_sections(quote_id,block_id,sort,options,snapshot)
    select p_id,i.block_id,i.sort,
      case when catalog.code='TYC' then jsonb_build_object('mode',case when q.client_type='B2C' then 'link' else 'full' end,'url',coalesce(doc->>'terms_url',''))||i.options else i.options end,
      public._doc_snapshot(i.block_id)
    from public.doc_layouts l join public.doc_layout_items i on i.layout_id=l.id
      join public.doc_blocks catalog on catalog.id=i.block_id
    where l.is_default and l.channel=lower(q.client_type::text);
    if not found then raise exception 'No existe un diseño inicial para migrar los textos.'; end if;
  end if;

  for part in
    select v.key,v.code,v.title,doc->>v.key as content,v.anchor,v.ord::bigint as ordinal
    from (values
      ('introduction','INTRO',case q.language when 'en' then 'Introduction' when 'it' then 'Introduzione' else 'Introducción' end,'INTRO',0),
      ('payment_text','PAGO_TEXTO',case q.language when 'en' then 'Payment conditions' when 'it' then 'Condizioni di pagamento' else 'Condiciones de pago' end,'PAGOS',1),
      ('cancellation','CANCELACION',case q.language when 'en' then 'Cancellation' when 'it' then 'Cancellazione' else 'Cancelación' end,'PAGOS',2),
      ('terms','TYC',case q.language when 'en' then 'Terms and conditions' when 'it' then 'Termini e condizioni' else 'Términos y condiciones' end,'TYC',3)
    ) v(key,code,title,anchor,ord)
    where coalesce(doc->>v.key,'')<>''
    union all
    select 'info.'||i.ord,'INFO_PRACTICA',i.value->>'title',coalesce(i.value->>'content',''),'TYC',3+i.ord
    from jsonb_array_elements(case when jsonb_typeof(doc->'info')='array' then doc->'info' else '[]'::jsonb end)
      with ordinality i(value,ord)
    order by ordinal,key
  loop
    select * into b from public.doc_blocks where code=part.code;
    html:=public._document_text_html(part.content);
    label:=coalesce(part.title,'');
    -- A text already copied verbatim to T13 needs no second visible block.
    -- Do not deduplicate info[]: identical entries can be intentional.
    if part.code<>'INFO_PRACTICA' and exists(
      select 1 from public.quote_doc_sections existing where existing.quote_id=p_id
        and existing.snapshot->>'code'=part.code and not existing.hidden
        and case when existing.override_lang=q.language and existing.body_override_html is not null
          then existing.body_override_html=html
          else exists(select 1 from jsonb_array_elements(existing.snapshot->'translations') t
            where t->>'lang'=q.language and t->>'body_html'=html) end
    ) then continue; end if;
    target:=null;
    -- Fill an untouched empty slot. An edited or populated T13 block always wins;
    -- keep its legacy counterpart as an additional, independent text section.
    select * into s from public.quote_doc_sections
      where quote_id=p_id and snapshot->>'code'=part.code and not hidden
        and body_override_html is null and title_override is null
        and not exists(select 1 from jsonb_array_elements(snapshot->'translations') t
          where t->>'lang'=q.language and coalesce(t->>'body_html','')<>'')
      order by sort,id limit 1;
    if found then target:=s.id; end if;
    snap:=case when target is null then public._doc_snapshot(b.id) else s.snapshot end;
    snap:=snap||jsonb_build_object('legacy_document_key',part.key,'translations',
      coalesce((select jsonb_agg(t) from jsonb_array_elements(snap->'translations') t where t->>'lang'<>q.language),'[]'::jsonb)
      ||jsonb_build_array(jsonb_build_object('lang',q.language,'title',label,'body_html',html,'reviewed',false)));
    opts:=case when target is null then '{}'::jsonb else s.options end;
    if part.code='TYC' then
      -- Full text must remain visible even for a B2C quote whose old mode was link.
      opts:=opts||jsonb_build_object('mode',case when coalesce(opts->>'url',doc->>'terms_url','')<>'' then 'both' else 'full' end,
        'url',coalesce(nullif(opts->>'url',''),doc->>'terms_url',''));
    end if;
    if target is not null then
      update public.quote_doc_sections set snapshot=snap,options=opts where id=target;
    else
      -- Place recovered content next to its corresponding block; info[] retains array order.
      select coalesce(min(sort),(select coalesce(max(sort),0)+1 from public.quote_doc_sections where quote_id=p_id))
        into position from public.quote_doc_sections where quote_id=p_id and snapshot->>'code'=part.anchor;
      if part.code='INTRO' then position:=1; end if;
      update public.quote_doc_sections set sort=sort+1 where quote_id=p_id and sort>=position;
      insert into public.quote_doc_sections(quote_id,block_id,sort,options,snapshot)
        values(p_id,b.id,position,opts,snap);
    end if;
  end loop;

  -- Preserve an old T&C link even if a different link was already edited in T13.
  if coalesce(doc->>'terms_url','')<>'' and not exists(
    select 1 from public.quote_doc_sections where quote_id=p_id and snapshot->>'code'='TYC'
      and options->>'url'=doc->>'terms_url'
  ) then
    select id into target from public.quote_doc_sections where quote_id=p_id and snapshot->>'code'='TYC'
      and coalesce(options->>'url','')='' order by sort,id limit 1;
    if target is not null then
      update public.quote_doc_sections set options=options||jsonb_build_object('url',doc->>'terms_url',
        'mode',case when options->>'mode'='full' then 'both' else coalesce(options->>'mode','link') end) where id=target;
    else
      select * into b from public.doc_blocks where code='TYC';
      insert into public.quote_doc_sections(quote_id,block_id,sort,options,snapshot)
        select p_id,b.id,coalesce(max(sort),0)+1,jsonb_build_object('mode','link','url',doc->>'terms_url'),public._doc_snapshot(b.id)
        from public.quote_doc_sections where quote_id=p_id;
    end if;
  end if;
  -- Keep original fields as an audit/legacy copy. The marker prevents deleted texts
  -- from reappearing on reopen, versioning or explicit layout replacement.
  update public.quotes set document_snapshot=doc||'{"text_sections_migrated":true}'::jsonb where id=p_id;
  perform public._invalidate_proposal(p_id);
end $$;

create or replace function public.ensure_quote_doc_sections(p_quote_id uuid,p_layout_id uuid default null) returns void
language plpgsql security definer set search_path=public as $$
declare q public.quotes; layout uuid;
begin
  q:=public._editable_doc_quote(p_quote_id);
  if p_layout_id is null and exists(select 1 from public.quote_doc_sections where quote_id=p_quote_id) then
    perform public._migrate_quote_document_texts(p_quote_id);
    return;
  end if;
  select id into layout from public.doc_layouts where channel=lower(q.client_type::text) and (id=p_layout_id or (p_layout_id is null and is_default)) limit 1;
  if layout is null then raise exception 'No existe un diseño para este canal.'; end if;
  if not exists(select 1 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where i.layout_id=layout and b.code='TYC') or
    not exists(select 1 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where i.layout_id=layout and b.code='ITINERARIO') or
    not exists(select 1 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where i.layout_id=layout and b.code='PRECIO') then
    raise exception 'El diseño debe incluir Itinerario, Precio y T&C.';
  end if;
  delete from public.quote_doc_sections where quote_id=p_quote_id;
  insert into public.quote_doc_sections(quote_id,block_id,sort,options,snapshot)
    select p_quote_id,i.block_id,i.sort,case when b.code='TYC' then jsonb_build_object('mode',case when q.client_type='B2C' then 'link' else 'full' end,'url',case when q.document_snapshot->>'text_sections_migrated'='true' then '' else coalesce(q.document_snapshot->>'terms_url','') end)||i.options else i.options end,public._doc_snapshot(i.block_id)
    from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where layout_id=layout order by sort;
  perform public._migrate_quote_document_texts(p_quote_id);
  perform public._invalidate_proposal(p_quote_id);
end $$;

create or replace function public.copy_version_doc_sections() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.parent_quote_id is not null then
    insert into public.quote_doc_sections(quote_id,block_id,sort,hidden,options,title_override,body_override_html,override_lang,snapshot,reviewed)
      select new.id,block_id,sort,hidden,options,title_override,body_override_html,override_lang,snapshot,reviewed
      from public.quote_doc_sections where quote_id=new.parent_quote_id;
    perform public._migrate_quote_document_texts(new.id);
  end if;
  return new;
end $$;

revoke all on function public._document_text_html(text),public._migrate_quote_document_texts(uuid) from public,anon,authenticated;

-- Only mutable drafts are upgraded now. Sent/reviewed/archived documents and
-- pending outboxes stay byte-for-byte intact; a new draft version is upgraded above.
do $$ declare id uuid; begin
  for id in select q.id from public.quotes q where q.status='borrador' and q.archived_at is null
    and not exists(select 1 from public.quote_proposals p where p.quote_id=q.id and p.frozen_at is not null)
    and not exists(select 1 from public.quote_emails e where e.quote_id=q.id and e.status='pendiente')
  loop perform public._migrate_quote_document_texts(id); end loop;
end $$;
commit;
