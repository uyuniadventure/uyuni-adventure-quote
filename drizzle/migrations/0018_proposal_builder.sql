-- T13. Apply after 20261016000100_quote_template_sku.sql. No customer text seeded.
begin;
create table public.doc_blocks (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 kind text not null check(kind in ('static','dynamic')),
 data_key text check(data_key in ('ficha','itinerario','hoteles','incluye','precio','pagos','extras','servicios','validez')),
 channel text not null default 'all' check(channel in ('all','b2b','b2c')),
 required boolean not null default false,
 status text not null default 'pendiente' check(status in ('activo','pendiente','archivado')),
 created_by uuid references public.profiles(id) default auth.uid(),
 check ((kind='static' and data_key is null) or (kind='dynamic' and data_key is not null))
);
create table public.doc_block_translations (
 block_id uuid references public.doc_blocks(id) on delete cascade,
 lang text check(lang in ('es','en','it')), title text not null default '', body_html text not null default '',
 reviewed boolean not null default false, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
 primary key(block_id,lang), check(length(title)<=200 and length(body_html)<=50000)
);
create table public.doc_layouts (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 channel text not null check(channel in ('b2b','b2c')), is_default boolean not null default false,
 created_by uuid references public.profiles(id) default auth.uid()
);
create unique index doc_layout_default on public.doc_layouts(channel) where is_default;
create table public.doc_layout_items (
 id uuid primary key default gen_random_uuid(), layout_id uuid not null references public.doc_layouts(id) on delete cascade,
 block_id uuid not null references public.doc_blocks(id), sort int not null, options jsonb not null default '{}'
);
create table public.quote_doc_sections (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.quotes(id) on delete cascade,
 block_id uuid references public.doc_blocks(id) on delete set null, sort int not null,
 hidden boolean not null default false, options jsonb not null default '{}',
 title_override text, body_override_html text, override_lang text,
 snapshot jsonb not null, reviewed boolean not null default false
);
create index quote_doc_order on public.quote_doc_sections(quote_id,sort);
create index doc_blocks_creator on public.doc_blocks(created_by);
create index doc_translation_reviewer on public.doc_block_translations(reviewed_by);
create index doc_layout_creator on public.doc_layouts(created_by);
create index doc_layout_item_layout on public.doc_layout_items(layout_id);
create index doc_layout_item_block on public.doc_layout_items(block_id);
create index quote_doc_block on public.quote_doc_sections(block_id);
create table public.quote_proposals (
 quote_id uuid primary key references public.quotes(id) on delete cascade,
 html text not null, sections jsonb not null, source_hash text not null, lang text not null,
 frozen_at timestamptz, pdf_path text
);
do $$ declare t text; begin
 foreach t in array array['doc_blocks','doc_block_translations','doc_layouts','doc_layout_items','quote_doc_sections','quote_proposals'] loop
  execute format('alter table public.%I add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now()',t);
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
 end loop;
end $$;
alter table public.doc_blocks enable row level security;
alter table public.doc_block_translations enable row level security;
alter table public.doc_layouts enable row level security;
alter table public.doc_layout_items enable row level security;
alter table public.quote_doc_sections enable row level security;
alter table public.quote_proposals enable row level security;
create policy doc_blocks_read on public.doc_blocks for select to authenticated using(true);
create policy doc_blocks_manage on public.doc_blocks for all to authenticated using(public.current_role() in ('admin','operacion')) with check(public.current_role() in ('admin','operacion'));
create policy doc_translations_read on public.doc_block_translations for select to authenticated using(exists(select 1 from public.doc_blocks b where b.id=block_id));
create policy doc_translations_manage on public.doc_block_translations for all to authenticated using(public.current_role() in ('admin','operacion')) with check(public.current_role() in ('admin','operacion'));
create policy doc_layout_read on public.doc_layouts for select to authenticated using(true);
create policy doc_layout_manage on public.doc_layouts for all to authenticated using(public.current_role() in ('admin','operacion')) with check(public.current_role() in ('admin','operacion'));
create policy doc_layout_item_read on public.doc_layout_items for select to authenticated using(true);
create policy doc_layout_item_manage on public.doc_layout_items for all to authenticated using(public.current_role() in ('admin','operacion')) with check(public.current_role() in ('admin','operacion'));
create policy doc_sections_read on public.quote_doc_sections for select to authenticated using(exists(select 1 from public.quotes q where q.id=quote_id));
create policy quote_proposals_read on public.quote_proposals for select to authenticated using(exists(select 1 from public.quotes q where q.id=quote_id));
grant select,insert,update,delete on public.doc_blocks,public.doc_block_translations,public.doc_layouts,public.doc_layout_items to authenticated;
revoke all on public.quote_doc_sections,public.quote_proposals from anon,authenticated;
grant select on public.quote_doc_sections,public.quote_proposals to authenticated;
grant all on public.quote_proposals to service_role;

-- Canonical output of the HTML sanitizer. Reject unsupported markup even on direct RPC calls.
create function public.proposal_html_valid(p_html text) returns boolean language sql immutable set search_path=public as $$
 select length(coalesce(p_html,''))<=50000 and
 regexp_replace(coalesce(p_html,''), '</?(p|h2|h3|strong|em|u|ul|ol|li|br|hr|table|tbody|tr|td|th|a)>|<(p|h2|h3|td|th) class="align-(left|center|right)">|<a href="(https?://|mailto:)[^"<>[:space:]]*">', '', 'g') !~ '<'
$$;
alter table public.doc_block_translations add constraint doc_html_safe check(public.proposal_html_valid(body_html));
alter table public.quote_doc_sections add constraint section_html_safe check(public.proposal_html_valid(body_override_html));

create function public._editable_doc_quote(p_id uuid) returns public.quotes language plpgsql security definer set search_path=public as $$
declare q public.quotes;
begin
 select * into q from public.quotes where id=p_id for update;
 if q.id is null or auth.uid() is null or (q.seller_id is distinct from auth.uid() and public.current_role() is distinct from 'admin') then raise exception 'No tienes permiso para editar esta propuesta.'; end if;
 if q.status<>'borrador' or q.archived_at is not null then raise exception 'La propuesta solo se puede editar en borrador. Crea una nueva versión.'; end if;
 if exists(select 1 from public.quote_emails where quote_id=p_id and status='pendiente') then raise exception 'Hay un envío pendiente. Reintenta ese envío antes de editar.'; end if;
 return q;
end $$;
create function public._doc_snapshot(p_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select to_jsonb(b)||jsonb_build_object('translations',coalesce((select jsonb_agg(to_jsonb(t) order by lang) from public.doc_block_translations t where block_id=b.id),'[]'::jsonb)) from public.doc_blocks b where id=p_id
$$;
create function public._invalidate_proposal(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 delete from public.quote_proposals where quote_id=p_id and frozen_at is null;
 update public.quotes set pdf_path=null,pdf_url=null,updated_at=now() where id=p_id;
end $$;

create function public.ensure_quote_doc_sections(p_quote_id uuid,p_layout_id uuid default null) returns void language plpgsql security definer set search_path=public as $$
declare q public.quotes; layout uuid;
begin
 q:=public._editable_doc_quote(p_quote_id);
 if p_layout_id is null and exists(select 1 from public.quote_doc_sections where quote_id=p_quote_id) then return; end if;
 select id into layout from public.doc_layouts where channel=lower(q.client_type::text) and (id=p_layout_id or (p_layout_id is null and is_default)) limit 1;
 if layout is null then raise exception 'No existe un diseño para este canal.'; end if;
 if not exists(select 1 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where i.layout_id=layout and b.code='TYC') or
 not exists(select 1 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where i.layout_id=layout and b.code='ITINERARIO') or
 not exists(select 1 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where i.layout_id=layout and b.code='PRECIO') then raise exception 'El diseño debe incluir Itinerario, Precio y T&C.'; end if;
 delete from public.quote_doc_sections where quote_id=p_quote_id;
 insert into public.quote_doc_sections(quote_id,block_id,sort,options,snapshot)
 select p_quote_id,i.block_id,i.sort,case when b.code='TYC' then jsonb_build_object('mode',case when q.client_type='B2C' then 'link' else 'full' end,'url',coalesce(q.document_snapshot->>'terms_url',''))||i.options else i.options end,public._doc_snapshot(i.block_id)
 from public.doc_layout_items i join public.doc_blocks b on b.id=i.block_id where layout_id=layout order by sort;
 perform public._invalidate_proposal(p_quote_id);
end $$;

create function public.edit_quote_doc_section(p_quote_id uuid,p_action text,p_section_id uuid default null,p_data jsonb default '{}') returns uuid language plpgsql security definer set search_path=public as $$
declare q public.quotes; s public.quote_doc_sections; b public.doc_blocks; result uuid; ids uuid[];
begin
 q:=public._editable_doc_quote(p_quote_id);
 if p_action='add' then
  select * into b from public.doc_blocks where id=(p_data->>'block_id')::uuid and (status='activo' or created_by=auth.uid() or public.current_role() in ('admin','operacion')) and channel in ('all',lower(q.client_type::text));
  if b.id is null then raise exception 'El bloque no está disponible para este canal.'; end if;
  update public.quote_doc_sections set sort=sort+1 where quote_id=p_quote_id and sort>=coalesce((p_data->>'sort')::int,9999);
  insert into public.quote_doc_sections(quote_id,block_id,sort,snapshot) values(p_quote_id,b.id,coalesce((p_data->>'sort')::int,(select coalesce(max(sort),0)+1 from public.quote_doc_sections where quote_id=p_quote_id)),public._doc_snapshot(b.id)) returning id into result;
 elsif p_action='reorder' then
  if jsonb_typeof(p_data->'ids') is distinct from 'array' then raise exception 'La lista de secciones es inválida.'; end if;
  select array_agg(value::uuid) into ids from jsonb_array_elements_text(p_data->'ids');
  if coalesce(cardinality(ids),0)<>(select count(*) from public.quote_doc_sections where quote_id=p_quote_id) or coalesce(cardinality(ids),0)<>(select count(distinct x) from unnest(ids) x) or exists(select 1 from unnest(ids) x where not exists(select 1 from public.quote_doc_sections where id=x and quote_id=p_quote_id)) then raise exception 'La lista de secciones cambió. Recarga la propuesta.'; end if;
  update public.quote_doc_sections target set sort=i.ord from unnest(ids) with ordinality i(id,ord) where target.id=i.id;
 else
  select * into s from public.quote_doc_sections where id=p_section_id and quote_id=p_quote_id for update;
  if s.id is null then raise exception 'La sección no pertenece a esta cotización.'; end if;
  result:=s.id;
  if (p_action='remove' or (p_action='hide' and coalesce((p_data->>'hidden')::boolean,false))) and (coalesce((s.snapshot->>'required')::boolean,false) or s.snapshot->>'code' in ('ITINERARIO','PRECIO','TYC')) then raise exception 'Esta sección es obligatoria y no se puede ocultar ni eliminar.'; end if;
  case p_action
   when 'hide' then update public.quote_doc_sections set hidden=coalesce((p_data->>'hidden')::boolean,false) where id=s.id;
   when 'remove' then delete from public.quote_doc_sections where id=s.id;
   when 'text' then
    if s.snapshot->>'kind'<>'static' then raise exception 'Edita los datos de este bloque desde la cotización.'; end if;
    if not public.proposal_html_valid(p_data->>'body_html') or length(p_data->>'title')>200 then raise exception 'El texto contiene formato no permitido.'; end if;
    update public.quote_doc_sections set title_override=p_data->>'title',body_override_html=p_data->>'body_html',override_lang=q.language,reviewed=coalesce((p_data->>'reviewed')::boolean,false) where id=s.id;
   when 'options' then
    if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>5000 then raise exception 'Opciones inválidas.'; end if;
    update public.quote_doc_sections set options=p_data where id=s.id;
   when 'reset' then update public.quote_doc_sections set title_override=null,body_override_html=null,override_lang=null,reviewed=false where id=s.id;
   else raise exception 'Acción de documento desconocida.';
  end case;
 end if;
 perform public._invalidate_proposal(p_quote_id);
 return result;
end $$;

create function public.reorder_quote_doc_sections(p_quote_id uuid,p_ids uuid[]) returns void language plpgsql security invoker set search_path=public as $$
begin
 perform public.edit_quote_doc_section(p_quote_id,'reorder',null,jsonb_build_object('ids',p_ids));
end $$;
revoke all on function public.reorder_quote_doc_sections(uuid,uuid[]) from public,anon;
grant execute on function public.reorder_quote_doc_sections(uuid,uuid[]) to authenticated;

create function public.save_doc_section_as_block(p_quote_id uuid,p_section_id uuid,p_code text) returns uuid language plpgsql security definer set search_path=public as $$
declare q public.quotes; s public.quote_doc_sections; result uuid;
begin
 q:=public._editable_doc_quote(p_quote_id);
 select * into s from public.quote_doc_sections where id=p_section_id and quote_id=p_quote_id;
 if s.id is null or s.snapshot->>'kind'<>'static' then raise exception 'Selecciona una sección de texto.'; end if;
 if p_code !~ '^[A-Z][A-Z0-9_]{2,59}$' then raise exception 'Usa un código de 3 a 60 letras mayúsculas, números o guiones bajos.'; end if;
 insert into public.doc_blocks(code,kind,channel,status,created_by) values(p_code,'static',lower(q.client_type::text),'pendiente',auth.uid()) returning id into result;
 insert into public.doc_block_translations(block_id,lang,title,body_html,reviewed)
 select result,t->>'lang',case when t->>'lang'=s.override_lang then coalesce(s.title_override,t->>'title') else t->>'title' end,case when t->>'lang'=s.override_lang then coalesce(s.body_override_html,t->>'body_html') else t->>'body_html' end,false from jsonb_array_elements(s.snapshot->'translations') t;
 if s.override_lang is not null then insert into public.doc_block_translations(block_id,lang,title,body_html) values(result,s.override_lang,coalesce(s.title_override,''),coalesce(s.body_override_html,'')) on conflict(block_id,lang) do update set title=excluded.title,body_html=excluded.body_html; end if;
 return result;
exception when unique_violation then raise exception 'Ya existe un bloque con ese código.';
end $$;
create function public.save_quote_doc_as_layout(p_quote_id uuid,p_name text) returns uuid language plpgsql security definer set search_path=public as $$
declare q public.quotes; result uuid;
begin
 q:=public._editable_doc_quote(p_quote_id);
 if public.current_role() not in ('admin','operacion') then raise exception 'Solo Admin y Operación pueden guardar diseños.'; end if;
 insert into public.doc_layouts(name,channel) values(trim(p_name),lower(q.client_type::text)) returning id into result;
 insert into public.doc_layout_items(layout_id,block_id,sort,options) select result,block_id,sort,options from public.quote_doc_sections where quote_id=p_quote_id and not hidden and block_id is not null;
 return result;
end $$;

-- Hash the live inputs, excluding transport metadata changed by PDF upload/status transitions.
create function public._proposal_context(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare data jsonb;
begin
 select jsonb_build_object('quote',to_jsonb(q)-array['updated_at','status','archived_at','pdf_url','pdf_path','next_followup_at','lost_reason','cancel_reason'],
 'days',coalesce((select jsonb_agg(to_jsonb(d) order by day_number) from public.quote_days d where quote_id=q.id),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from public.quote_items i join public.quote_days d on d.id=i.quote_day_id where d.quote_id=q.id),'[]'::jsonb),
 'sections',coalesce((select jsonb_agg(to_jsonb(s) order by sort,id) from public.quote_doc_sections s where quote_id=q.id),'[]'::jsonb),
 'seller',coalesce((select full_name from public.profiles where id=q.seller_id),''),
 'payments',jsonb_build_object('deposit_required_usd',round(q.total_price_usd*q.deposit_pct/100,2),'deposits_usd',coalesce((select sum(amount_usd) from public.quote_payments where quote_id=q.id and type='deposito'),0),'paid_usd',coalesce((select sum(amount_usd) from public.quote_payments where quote_id=q.id),0),'unconverted', (select count(*) from public.quote_payments where quote_id=q.id and amount_usd is null))) into data from public.quotes q where id=p_id;
 return data||jsonb_build_object('source_hash',md5(data::text));
end $$;
create function public.quote_proposal_context(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.quotes where id=p_id and (seller_id=auth.uid() or public.current_role()='admin')) then raise exception 'No tienes permiso para ver esta propuesta.'; end if;
 return public._proposal_context(p_id)||jsonb_build_object('frozen',(select to_jsonb(p) from public.quote_proposals p where quote_id=p_id and frozen_at is not null));
end $$;
create function public.store_rendered_proposal(p_id uuid,p_hash text,p_lang text,p_html text) returns void language plpgsql security definer set search_path=public as $$
declare ctx jsonb;
begin
 perform 1 from public.quotes where id=p_id for update;
 if exists(select 1 from public.quote_proposals where quote_id=p_id and frozen_at is not null) then return; end if;
 ctx:=public._proposal_context(p_id);
 if ctx->>'source_hash' is distinct from p_hash or ctx->'quote'->>'language'<>p_lang then raise exception 'La cotización cambió durante la preparación. Reintenta.'; end if;
 insert into public.quote_proposals(quote_id,html,sections,source_hash,lang) values(p_id,p_html,ctx->'sections',p_hash,p_lang) on conflict(quote_id) do update set html=excluded.html,sections=excluded.sections,source_hash=excluded.source_hash,lang=excluded.lang,pdf_path=case when quote_proposals.source_hash=excluded.source_hash and quote_proposals.html=excluded.html then quote_proposals.pdf_path else null end;
end $$;

create function public.guard_proposal_delivery() returns trigger language plpgsql security definer set search_path=public as $$
declare p public.quote_proposals; ctx jsonb;
begin
 if not exists(select 1 from public.quote_doc_sections where quote_id=new.id) then return new; end if;
 select * into p from public.quote_proposals where quote_id=new.id;
 if new.pdf_path is distinct from old.pdf_path and new.pdf_path is not null then
  ctx:=public._proposal_context(new.id);
  if p.quote_id is null or p.source_hash<>ctx->>'source_hash' then raise exception 'Prepara la propuesta antes de guardar su PDF.'; end if;
  update public.quote_proposals set pdf_path=new.pdf_path where quote_id=new.id;
 end if;
 if new.status in ('revisada','enviada') and old.status is distinct from new.status then
  ctx:=public._proposal_context(new.id);
  if p.quote_id is null or (p.frozen_at is null and p.source_hash<>ctx->>'source_hash') then raise exception 'Revisa y prepara los bloques del documento antes de continuar.'; end if;
  if new.status='enviada' and (new.pdf_path is null or p.pdf_path is distinct from new.pdf_path) then raise exception 'Genera el PDF de esta propuesta antes de enviarla.'; end if;
  if new.status='enviada' then update public.quote_proposals set frozen_at=coalesce(frozen_at,now()) where quote_id=new.id; end if;
 end if;
 return new;
end $$;
create trigger zz_proposal_delivery before update on public.quotes for each row execute function public.guard_proposal_delivery();
create function public.copy_version_doc_sections() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.parent_quote_id is not null then
 insert into public.quote_doc_sections(quote_id,block_id,sort,hidden,options,title_override,body_override_html,override_lang,snapshot,reviewed)
 select new.id,block_id,sort,hidden,options,title_override,body_override_html,override_lang,snapshot,reviewed from public.quote_doc_sections where quote_id=new.parent_quote_id;
 end if;
 return new;
end $$;
create trigger copy_version_doc after insert on public.quotes for each row execute function public.copy_version_doc_sections();

-- Reserve the exact proposal with the outbox, including on ambiguous provider failures.
create function public.freeze_outbox_proposal() returns trigger language plpgsql security definer set search_path=public as $$
declare p public.quote_proposals;
begin
 if not exists(select 1 from public.quote_doc_sections where quote_id=new.quote_id) then return new; end if;
 select * into p from public.quote_proposals where quote_id=new.quote_id for update;
 if p.quote_id is null or p.html is distinct from new.body or p.pdf_path is distinct from new.pdf_path or (p.frozen_at is null and p.source_hash is distinct from public._proposal_context(new.quote_id)->>'source_hash') then raise exception 'El correo y el PDF deben corresponder a la propuesta preparada.'; end if;
 update public.quote_proposals set frozen_at=coalesce(frozen_at,now()) where quote_id=new.quote_id;
 return new;
end $$;
create trigger freeze_outbox_proposal before insert on public.quote_emails for each row execute function public.freeze_outbox_proposal();
revoke all on function public.freeze_outbox_proposal() from public,anon,authenticated;

insert into public.doc_blocks(code,kind,data_key,required,status) values
 ('INTRO','static',null,false,'activo'),('FICHA','dynamic','ficha',false,'activo'),('ITINERARIO','dynamic','itinerario',true,'activo'),
 ('HOTELES','dynamic','hoteles',false,'activo'),('INCLUYE','dynamic','incluye',false,'activo'),('PRECIO','dynamic','precio',true,'activo'),
 ('PAGOS','dynamic','pagos',false,'activo'),('EXTRAS','dynamic','extras',false,'activo'),('NOTA_HOTELES','static',null,false,'activo'),
 ('SALUD_ALTITUD','static',null,false,'activo'),('TYC','static',null,true,'activo'),('VALIDEZ','dynamic','validez',false,'activo'),('FOOTER','static',null,false,'activo');
insert into public.doc_blocks(code,kind,data_key,channel,status) values('SERVICIOS','dynamic','servicios','b2b','activo');
insert into public.doc_block_translations(block_id,lang,title) select id,lang,code from public.doc_blocks cross join unnest(array['es','en','it']) lang;
insert into public.doc_layouts(name,channel,is_default) values('Propuesta B2C','b2c',true),('Propuesta B2B','b2b',true);
insert into public.doc_layout_items(layout_id,block_id,sort) select l.id,b.id,i.ord from public.doc_layouts l cross join unnest(array['INTRO','FICHA','ITINERARIO','HOTELES','INCLUYE','PRECIO','PAGOS','EXTRAS','NOTA_HOTELES','SALUD_ALTITUD','TYC','VALIDEZ']) with ordinality i(code,ord) join public.doc_blocks b on b.code=i.code;
insert into public.doc_layout_items(layout_id,block_id,sort) select l.id,b.id,13 from public.doc_layouts l cross join public.doc_blocks b where l.channel='b2b' and b.code='SERVICIOS';

revoke all on function public._editable_doc_quote(uuid),public._doc_snapshot(uuid),public._invalidate_proposal(uuid),public._proposal_context(uuid),public.store_rendered_proposal(uuid,text,text,text),public.guard_proposal_delivery(),public.copy_version_doc_sections() from public,anon,authenticated;
grant execute on function public.store_rendered_proposal(uuid,text,text,text) to service_role;
revoke all on function public.ensure_quote_doc_sections(uuid,uuid),public.edit_quote_doc_section(uuid,text,uuid,jsonb),public.save_doc_section_as_block(uuid,uuid,text),public.save_quote_doc_as_layout(uuid,text),public.quote_proposal_context(uuid) from public,anon;
grant execute on function public.ensure_quote_doc_sections(uuid,uuid),public.edit_quote_doc_section(uuid,text,uuid,jsonb),public.save_doc_section_as_block(uuid,uuid,text),public.save_quote_doc_as_layout(uuid,text),public.quote_proposal_context(uuid) to authenticated;
commit;
