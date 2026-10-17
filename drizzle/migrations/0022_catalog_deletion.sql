-- T01u. Export docs/consultas/respaldo_catalogo.sql BEFORE calling purge.
begin;

alter table public.quotes drop constraint quotes_template_id_fkey;
alter table public.quotes add constraint quotes_template_id_fkey
  foreign key(template_id) references public.itinerary_templates(id) on delete set null;
-- template_days.block_id deliberately retains NO ACTION (never CASCADE).

-- Explicit provenance: NULL creator, status and code prefixes do not identify
-- imports. Backfill only IDs emitted by the checked-in historical importers.
-- New UI/quote-derived rows default to manual; importers must opt in explicitly.
alter table public.day_blocks add column catalog_origin text not null default 'manual'
  check (catalog_origin in ('manual','importacion'));
alter table public.itinerary_templates add column catalog_origin text not null default 'manual'
  check (catalog_origin in ('manual','importacion'));
-- 42 IDs: seeds 02, recovery and budget seeds 03/04 (blocks).
update public.itinerary_templates set catalog_origin='importacion'
where id in (
  '18ca2699-00d3-5406-a14e-9ee82ebe69f6'::uuid,
  '1ed64259-6796-539d-9889-291da5798c6a'::uuid,
  '1f6782ea-17d1-54b6-8ba8-95d3c6c89e7e'::uuid,
  '23ebc69c-20e6-53f5-a6c6-9da288431864'::uuid,
  '242291b9-7094-5c71-a396-87da68e5b217'::uuid,
  '287413e0-49b4-5708-9871-ffd236128363'::uuid,
  '2eaf385e-d58c-5a23-9b3c-ad3089529692'::uuid,
  '3c12f644-8b4f-5008-aeff-19ba0095bf22'::uuid,
  '3fa5db59-25c2-50f6-a157-95689e6169b8'::uuid,
  '404dde3a-1709-511b-ae95-53bf62a55c77'::uuid,
  '44f067c9-d3a2-59ee-b4f8-70708a54ed66'::uuid,
  '49e92237-b6d4-514b-93bb-3272dfd1efd9'::uuid,
  '4ed1aa02-2ffb-5077-86b5-78b3903ffa6c'::uuid,
  '5261a32b-19a9-5728-86fc-7a50ef522145'::uuid,
  '6a448cc0-21b6-582e-8c4e-3205637a836d'::uuid,
  '6c556df1-4f97-5415-8304-ccd6d7d949ad'::uuid,
  '6e7ee944-785a-54b9-b329-6be204344a67'::uuid,
  '74fd942d-44d1-52a5-af3b-9a10027cb6d9'::uuid,
  '78c82f20-4e2e-550b-b407-03adee23fa74'::uuid,
  '7d37719c-7fcb-5622-b0f8-f7d3101441e7'::uuid,
  '8b65bf70-0fc6-5d02-ab76-6ca41a8db7df'::uuid,
  '8ced6997-e743-57da-8679-b8202f48256e'::uuid,
  '8e048b4b-7857-560c-896d-60c0087b23c9'::uuid,
  '8eaaf135-cdba-5122-be08-66d9e825672d'::uuid,
  '95df3a85-6bf2-520b-9145-7ef43b183663'::uuid,
  'a190b5d3-6018-57a5-854f-3d1bdfb4fd2c'::uuid,
  'a5b84943-3684-5aa2-9ef4-fb6ffe12f538'::uuid,
  'aeac7542-707b-5b98-a5a6-f511a578454f'::uuid,
  'b4bc1d22-229c-5f15-9e16-7a12686ff003'::uuid,
  'ba0bb734-2f73-5040-8aae-217705d47e23'::uuid,
  'bbed5c37-b4e3-5f6a-9b52-0c1e5d1deff0'::uuid,
  'bef32a75-cc11-5c89-9b99-ef373754da67'::uuid,
  'c1afa26e-8cc2-5067-a9d7-d4f0bca59ba7'::uuid,
  'c3223fde-2544-572e-a5dc-2d6c3639cfc9'::uuid,
  'c34c51d8-82f0-5f7d-9c94-dc9390b8738e'::uuid,
  'c477b3db-8f69-55be-8feb-99acfe1442ae'::uuid,
  'c56f1951-5c6d-532b-9af7-ca0b742985e9'::uuid,
  'c91a565d-7596-56d9-99dd-057b212826da'::uuid,
  'e0fb57c1-9600-5ef5-9d1d-6d7b7620ebfb'::uuid,
  'e8a098a4-b630-51aa-8b1c-f4b28ac40045'::uuid,
  'ede37172-1e3b-5f87-8a34-14e3c81133e3'::uuid,
  'f4a0ee78-4e36-59db-9bda-5b94d3f48edf'::uuid
) and source_quote_id is null;
-- 155 IDs: seeds 02, recovery and budget seeds 03/04 (blocks).
update public.day_blocks set catalog_origin='importacion'
where id in (
  '016bd8bb-1855-5344-9bed-61b9d639b3c9'::uuid,
  '047293b8-3f49-5cad-9a29-5b754bbbf7f5'::uuid,
  '04b2b7cd-4a76-5a36-820d-34dd42c7bcdc'::uuid,
  '04f04fa4-252e-5976-9f58-f5bc6bec5c41'::uuid,
  '05f0354a-78de-59ca-99f3-cc5537927256'::uuid,
  '0f2786dc-1143-5a25-8c55-9a26eaf9cd8d'::uuid,
  '10b7525f-0ebc-5d45-8f3b-7d2b729d1f0c'::uuid,
  '1340d3d3-0f2d-55e0-84dc-a86df8545b84'::uuid,
  '13911d00-32cc-e081-a3d5-b8393ef25c9d'::uuid,
  '14f80090-ea15-5a3a-8bb2-062c8406775c'::uuid,
  '16a85a1c-5f61-5c0a-98d5-918a29bab8dc'::uuid,
  '16b7025c-fdcf-5bbc-af11-f9ecd9f7c304'::uuid,
  '18b7de10-ce92-5366-9a73-c175510a7d05'::uuid,
  '1abf416c-49a2-5649-9c62-62fc8edf65bb'::uuid,
  '1bbade78-2401-5720-8d0c-7ec1146af466'::uuid,
  '1c878d91-b983-57c6-9b33-64a0bfaab4ed'::uuid,
  '1d4c5879-be0b-56b2-8bbf-b1a84ec38f35'::uuid,
  '1da549dd-2518-5fc9-a33c-e3026809819a'::uuid,
  '20044ba8-8a9c-f915-a855-55dcb54aa50f'::uuid,
  '24c7b7ba-1f98-5941-8063-ad6798882c53'::uuid,
  '296a590c-9613-5774-be15-6f66e0fe899d'::uuid,
  '2c30823d-295b-5dc7-ad7b-78163015861a'::uuid,
  '2d5a994a-7e25-5f71-a08c-4ddad27b2613'::uuid,
  '2e87e77d-adce-5ccf-a9eb-c4c8924ec60a'::uuid,
  '2f204d1b-506f-5423-91e6-20bb272eadcc'::uuid,
  '2f887349-19e2-552e-b21d-014b7f238097'::uuid,
  '2fd16069-0672-51db-ab1e-c44072d953db'::uuid,
  '323d1f1e-04fb-5e91-9a5a-a3c8dd7738a0'::uuid,
  '34a494d4-c924-56aa-bf34-2471fd8d372c'::uuid,
  '35d384b3-0c12-58d9-9343-f2e0a1e1cf9b'::uuid,
  '36a85551-24f4-54b9-b27a-0da3810cce99'::uuid,
  '38f6b2bf-0ec0-5cc0-8577-2a8f89fac686'::uuid,
  '3e1e15ba-be72-55eb-aae1-5283ba6ef9d8'::uuid,
  '3fede8da-f71c-5220-8f5e-dfcd29c0a403'::uuid,
  '42b5e981-7215-5d31-a888-d74018241683'::uuid,
  '44a45a60-8c44-52eb-9c2b-e9593d109f9a'::uuid,
  '47853b0c-9fa8-5937-bef1-9171fd3d21ad'::uuid,
  '4807af0a-ed58-5cfd-b267-1722f8349468'::uuid,
  '48ac169c-0410-5a7e-b8a4-8cf63859b053'::uuid,
  '4b3e587d-2b38-50ad-9db2-8cfa42e2cedc'::uuid,
  '4c743212-282a-5fd3-b08a-a619a0cfdc2d'::uuid,
  '53d512c8-cfb4-537c-ad95-4d616e9a6883'::uuid,
  '54b83312-21c5-5239-b338-651a4351067f'::uuid,
  '5c5d4d46-dfa3-5411-9ea1-df76ee45c511'::uuid,
  '5c6cb615-2d88-5884-9c95-c65bf7561022'::uuid,
  '5cb4d965-3675-5992-a0d7-b4a6995c80f0'::uuid,
  '5cbc5ac6-b020-5208-a6dd-0460a3a38d80'::uuid,
  '5f8cbdd6-8c54-5a70-b55b-944bc2fa8df7'::uuid,
  '6184c14b-bea6-5ca8-8533-cdfbf9662683'::uuid,
  '63ca6183-6ab8-55fb-8ad9-78f3fd048d75'::uuid,
  '64379a12-8339-5c3d-8ef9-fa5bcd9579a0'::uuid,
  '6453093f-efa9-596b-af0a-3e0744531051'::uuid,
  '6486ad9a-e501-5854-9db2-4b74d7fbba94'::uuid,
  '64a08bb1-df25-5fc2-923f-e7b9b20a6240'::uuid,
  '64f11bdf-8db8-5264-b6f4-27e135d14d37'::uuid,
  '6537e466-f147-5d31-b729-5b2673234599'::uuid,
  '663317eb-a126-53f2-aaa1-331c8d1bf91a'::uuid,
  '678603a2-5f6a-5ee6-a2b5-9163cdd68270'::uuid,
  '67a6c390-91b3-5cfa-b80a-8d806eb52d3f'::uuid,
  '68de8bf1-283e-58cd-ad16-79d7f83d7a9d'::uuid,
  '6b510461-d955-5a25-b719-3ebf479cdbd2'::uuid,
  '6ba9368d-d086-567b-861f-928a0f989b96'::uuid,
  '7202757f-0d5e-5dc5-9817-212a90c653f9'::uuid,
  '72cc8225-36fa-5f13-b688-678083f8b484'::uuid,
  '7526f99b-4807-50f9-bf4d-23e18ec68981'::uuid,
  '757a8023-5f45-5cd0-a090-a2c6c86da20e'::uuid,
  '75d47e05-75c9-25b6-1120-fdaae3c3ccc7'::uuid,
  '76007f60-7e01-5e2d-bf18-b0cf9fe57a99'::uuid,
  '79b62906-9055-510d-cc2d-6329806ba9b3'::uuid,
  '79cff890-230a-527a-b76c-0638abba00a1'::uuid,
  '7d029084-60e5-7bfd-a8da-738eec259f41'::uuid,
  '7d6a695c-f6ae-56f7-89c0-cf14c9878796'::uuid,
  '7ef34805-c1a6-5335-98f9-b9ed92055e6b'::uuid,
  '7f1727d8-00ba-5981-a67e-0a6396357ecd'::uuid,
  '7f2ee230-86aa-5d46-bcda-deb20cde94c3'::uuid,
  '7fadb241-9922-5ae6-866f-ed13f37c668c'::uuid,
  '811308a3-3e12-59f1-8c61-b78c7cd8f188'::uuid,
  '8167c971-287a-517c-81c3-a1822b8fb55f'::uuid,
  '81c6b747-2c9d-511b-a8fa-87a9ef02dcba'::uuid,
  '822d5a32-c6af-5c41-bd5a-6a352fdf47fe'::uuid,
  '830de60b-a48d-5628-afc1-17ef86f23581'::uuid,
  '83871815-4379-5ab2-981a-bbb4d2ce27bd'::uuid,
  '855c1dda-8a89-5b15-bb62-9291da91f331'::uuid,
  '856b68a5-4516-571c-9760-e58d1da0de06'::uuid,
  '8d00a334-b739-520d-86a7-dda95489d297'::uuid,
  '8f7ce417-2d5e-53b8-a673-c60c6561481f'::uuid,
  '93d0b7a1-ead0-57e1-b89f-2643c1bacae1'::uuid,
  '95878356-6247-5cac-b8a5-bdcb405c7373'::uuid,
  '95b59e6f-d2ee-50de-8456-6beac6e3eae9'::uuid,
  '9684edba-228b-53eb-84bd-9564ad8ca9a9'::uuid,
  '97baa231-d359-5ca2-bff0-e62800a1a9b1'::uuid,
  '985f5311-c735-5740-9df8-f7ef9bc1a715'::uuid,
  '9984d2d1-b938-5983-b0de-ed48e64e1c47'::uuid,
  '999f4559-7b30-5fc3-b73a-61906e618d89'::uuid,
  '99dc888e-7146-57ba-ade2-be11f4c120bf'::uuid,
  '9a1962bf-2b34-519d-8185-52327ae07272'::uuid,
  '9a7e3d00-dbef-5e06-bb05-73ca98ddda25'::uuid,
  '9adba802-6eed-565c-a298-385c9a868ab8'::uuid,
  '9f435644-e75a-570a-8234-13707b6d97c7'::uuid,
  'a4449cea-da27-5648-a65b-49539d0c4043'::uuid,
  'a4aedbe7-0848-51de-98ab-d0f116b1b6e6'::uuid,
  'abbbfdda-23ee-5a95-892b-f6706ba7a8bb'::uuid,
  'ac2bbb60-f987-593e-9f8f-afc4f556a383'::uuid,
  'acd015cc-f6c0-5101-8e98-6611fec569f3'::uuid,
  'ad22fea7-b511-520d-83b0-c5f95113631a'::uuid,
  'ad513c0c-9ab3-5844-adb8-b9d09472b28d'::uuid,
  'b0bc90f4-eab7-54c3-8f20-0413d0d578a2'::uuid,
  'b1fd21a2-4600-5ca8-baf1-2b7018401998'::uuid,
  'b22bc19e-a483-5016-ab72-03a0ddf49aa4'::uuid,
  'b34df665-f5bf-54e1-8d97-6805c4cb41e2'::uuid,
  'b375a7c2-5503-58a7-b36b-8ede9f965ca6'::uuid,
  'b5ef56b5-a3ad-5c84-934c-3a4808b1d7f7'::uuid,
  'bb5dc4af-629e-5a26-b272-caaccb2c055f'::uuid,
  'bb8ff4de-73f5-50d6-8183-15e8318a420a'::uuid,
  'bba0cc92-3509-57b4-98bf-0e43ed1835f2'::uuid,
  'bc46d308-583f-538b-a631-7a3b9697182b'::uuid,
  'be2d5f1e-4e9f-5850-8c75-2298891d7e3f'::uuid,
  'beb42e7a-8f68-5ad2-a3b0-6f39e8fdbb56'::uuid,
  'c19ff14a-c596-5d7e-af6c-1dc21eb4958c'::uuid,
  'c1d9fdb8-8f50-8b89-7fb3-c78262f36bd1'::uuid,
  'c213044f-6aab-579f-a751-4d6d43794a6d'::uuid,
  'c2beb95f-90aa-5639-a442-86868eefe7a3'::uuid,
  'c2d54ab9-0e4a-55a0-96c8-36746c8d4ce8'::uuid,
  'c6ed468c-e322-5a30-aaac-008f36d0ae3e'::uuid,
  'c711b6c7-8384-58a8-9bf1-806c5f6ef844'::uuid,
  'c8196cfc-9dca-5818-9e15-f38ab225e9af'::uuid,
  'c9a58352-7118-558d-8659-6d8d51d80d3b'::uuid,
  'cb43e35c-21e1-575a-9247-6f9429a9415b'::uuid,
  'cdfdda2f-7046-54da-b367-c45bcfccd566'::uuid,
  'ce6d64fb-c041-5e1c-8c83-10ecaddc3315'::uuid,
  'cf8b52bb-79a8-514e-9442-110c5791dd22'::uuid,
  'd05719b6-c97e-54a7-b863-0b125bf278a5'::uuid,
  'd3c1cae1-efec-5421-b318-dd1e89c77774'::uuid,
  'd6c157c9-37df-5aaa-8b7a-0595fe8bb95a'::uuid,
  'd81f178f-57e1-5c5d-8356-3356c6128c66'::uuid,
  'd95bc440-ad5d-586a-bdc7-bf2921881525'::uuid,
  'dce13276-f016-584b-9bf0-c0ab1c28dcbe'::uuid,
  'dd38a097-3a1f-5c30-95e3-023445f3bfda'::uuid,
  'deec7979-4b12-56ea-8b12-e70017e2bf53'::uuid,
  'dfe4d98a-0af0-59f5-b37a-aacd4af8487a'::uuid,
  'e4df9d70-362f-58ac-8723-03d5631ad90a'::uuid,
  'e9b83485-ae68-5911-b45c-8ffbd833490b'::uuid,
  'ecbde376-79df-51c2-a499-1b18ad51b1dc'::uuid,
  'eeb0934c-b8ed-5fac-bdb8-6148602c9386'::uuid,
  'f0ee29cd-734b-55cf-be2e-c5315fd3ce68'::uuid,
  'f0fb157a-342f-5239-8695-4fe6f0602e14'::uuid,
  'f12a577f-17db-5ad1-b36b-15b48cff33b6'::uuid,
  'f1716cc7-3ac7-50e9-8856-07eb0a7913d0'::uuid,
  'f1dac0ee-4043-5762-bbcb-95a75a048842'::uuid,
  'f3a27e95-af98-5b1e-83cf-3ab4f3742f0c'::uuid,
  'f51c04d2-bf97-555d-acc5-1291e875ef28'::uuid,
  'f562c363-4981-532c-9ce7-b7ef01657b2f'::uuid,
  'f8a78b63-445a-538e-bf41-cc684244af59'::uuid,
  'f9ccb4ca-0c68-5706-ba45-071570400573'::uuid,
  'f9fd009b-4be1-500d-864e-5d2273db3e1b'::uuid
);

-- FK detachment is metadata only, even for sent/archived quotes. Preserve the
-- complete snapshot, calculation, PDF and timestamps. Only an actual nested FK
-- action whose parent is gone and which changes NOTHING else may bypass guards.
-- No client-settable flag, role-based blanket exemption or disabled trigger.
do $migration$
declare name text; definition text; guard text;
begin
  foreach name in array array['guard_quote_state','guard_quote_child','set_updated_at'] loop
    guard:=$guard$
  if tg_op='UPDATE' and pg_trigger_depth()>1 then
    if tg_table_name='quotes' then
      if old.template_id is not null and new.template_id is null
        and (to_jsonb(new)-'template_id')=(to_jsonb(old)-'template_id')
        and not exists(select 1 from public.itinerary_templates where id=old.template_id)
      then return new; end if;
    elsif tg_table_name='quote_days' then
      if old.source_block_id is not null and new.source_block_id is null
        and (to_jsonb(new)-'source_block_id')=(to_jsonb(old)-'source_block_id')
        and not exists(select 1 from public.day_blocks where id=old.source_block_id)
      then return new; end if;
    end if;
  end if;
$guard$;
    definition:=replace(pg_get_functiondef(('public.'||name||'()')::regprocedure),chr(13),'');
    if strpos(definition,E'begin\n')=0 then raise exception 'No se reconoce el trigger %.',name; end if;
    -- Insert once at the start, preserving all previous business checks verbatim.
    definition:=overlay(definition placing E'begin\n'||guard
      from strpos(definition,E'begin\n') for length(E'begin\n'));
    execute definition;
  end loop;
end;
$migration$;

-- Match bulk approval's lock order. Catalog readers remain unblocked; writers
-- cannot add references/change provenance between inspection and deletion.
create function public._lock_catalog_deletion() returns void
language plpgsql set search_path='' as $$
begin
  lock table public.itinerary_templates,public.template_days,public.day_blocks,
    public.day_block_items,public.day_block_modules,public.day_block_translations
    in share row exclusive mode;
end;
$$;
revoke all on function public._lock_catalog_deletion() from public,anon,authenticated;

create function public.delete_day_blocks(ids uuid[], force boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare conflicts jsonb; affected uuid[]; d record;
begin
  if auth.uid() is null or coalesce(public.current_role() in ('admin','operacion'),false) is false then
    raise exception 'Solo Admin y Operación pueden eliminar el catálogo.' using errcode='42501';
  end if;
  if ids is null or array_position(ids,null) is not null or force is null then
    raise exception 'Indica una lista de IDs válida y force verdadero o falso.' using errcode='22023';
  end if;
  perform public._lock_catalog_deletion();
  select coalesce(jsonb_agg(jsonb_build_object('block_id',b.id,'templates',(
    select jsonb_agg(jsonb_build_object('id',t.id,'sku',t.sku) order by t.sku,t.id)
    from public.itinerary_templates t where exists(select 1 from public.template_days td
      where td.template_id=t.id and td.block_id=b.id)
  )) order by b.id),'[]'::jsonb) into conflicts
  from public.day_blocks b where b.id=any(ids)
    and exists(select 1 from public.template_days td where td.block_id=b.id);
  -- A nonempty array is the blocked result, NOT success. No row has changed.
  if not force and conflicts<>'[]'::jsonb then return conflicts; end if;
  select coalesce(array_agg(distinct template_id),'{}'::uuid[]) into affected
    from public.template_days where block_id=any(ids);
  delete from public.template_days where block_id=any(ids);
  -- Moving down in ascending old order never collides with UNIQUE(template,day).
  for d in select id,day_number,row_number() over(partition by template_id order by day_number,id)::int as n
    from public.template_days where template_id=any(affected) order by template_id,day_number,id loop
    if d.day_number<>d.n then update public.template_days set day_number=d.n where id=d.id; end if;
  end loop;
  -- Keep the advertised duration/SKU for human review (including empty templates).
  update public.itinerary_templates set status='pendiente' where id=any(affected);
  delete from public.day_blocks where id=any(ids);
  return '[]'::jsonb;
end;
$$;
revoke all on function public.delete_day_blocks(uuid[],boolean) from public,anon;
grant execute on function public.delete_day_blocks(uuid[],boolean) to authenticated;

create function public.delete_templates(ids uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare template_count integer; day_count integer;
begin
  if auth.uid() is null or coalesce(public.current_role() in ('admin','operacion'),false) is false then
    raise exception 'Solo Admin y Operación pueden eliminar el catálogo.' using errcode='42501';
  end if;
  if ids is null or array_position(ids,null) is not null then
    raise exception 'Indica una lista de IDs válida.' using errcode='22023';
  end if;
  perform public._lock_catalog_deletion();
  select count(*) into day_count from public.template_days where template_id=any(ids);
  delete from public.itinerary_templates where id=any(ids);
  get diagnostics template_count=row_count;
  return jsonb_build_object('templates',template_count,'template_days',day_count);
end;
$$;
revoke all on function public.delete_templates(uuid[]) from public,anon;
grant execute on function public.delete_templates(uuid[]) to authenticated;

create function public.purge_imported_catalog(confirm text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tids uuid[]; bids uuid[]; counts jsonb;
begin
  if auth.uid() is null or coalesce(public.current_role() in ('admin','operacion'),false) is false then
    raise exception 'Solo Admin y Operación pueden eliminar el catálogo.' using errcode='42501';
  end if;
  if confirm is distinct from 'BORRAR' then
    raise exception 'Escribe BORRAR para vaciar el catálogo importado.' using errcode='22023';
  end if;
  perform public._lock_catalog_deletion();
  -- A quote may have replaced an imported template in place: preserve that work.
  select coalesce(array_agg(id),'{}'::uuid[]) into tids from public.itinerary_templates
    where catalog_origin='importacion' and source_quote_id is null;
  select coalesce(array_agg(id),'{}'::uuid[]) into bids from public.day_blocks
    where catalog_origin='importacion';
  select jsonb_build_object(
    'templates',cardinality(tids),'day_blocks',cardinality(bids),
    'template_days',(select count(*) from public.template_days where template_id=any(tids) or block_id=any(bids)),
    'day_block_translations',(select count(*) from public.day_block_translations where block_id=any(bids)),
    'day_block_items',(select count(*) from public.day_block_items where block_id=any(bids)),
    'day_block_modules',(select count(*) from public.day_block_modules where block_id=any(bids)),
    'templates_updated',(select count(distinct template_id) from public.template_days where block_id=any(bids) and not(template_id=any(tids)))
  ) into counts;
  perform public.delete_templates(tids);
  perform public.delete_day_blocks(bids,true);
  return counts;
end;
$$;
revoke all on function public.purge_imported_catalog(text) from public,anon;
grant execute on function public.purge_imported_catalog(text) to authenticated;
commit;
