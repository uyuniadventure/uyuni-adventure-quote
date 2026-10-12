begin;

-- Only templates already visible through catalogue RLS are eligible. Reading a
-- pending template also requires reading its blocks/modules to copy a snapshot.
-- This grants no catalogue writes and does not publish any pending content.
alter policy approved_template_blocks_read on public.day_blocks
using (public.current_role() = 'vendedor' and exists (
  select 1 from public.template_days d join public.itinerary_templates t on t.id=d.template_id
  where d.block_id=day_blocks.id and t.status in ('activo','pendiente')
));
alter policy approved_template_modules_read on public.activity_modules
using (public.current_role() = 'vendedor' and exists (
  select 1 from public.day_block_modules m
  join public.template_days d on d.block_id=m.block_id
  join public.itinerary_templates t on t.id=d.template_id
  where m.module_id=activity_modules.id and t.status in ('activo','pendiente')
));

-- Change only the eligibility gate in the existing atomic constructor. Keep all
-- source-lock, snapshot, item, calculation and rollback validation intact.
do $migration$
declare
  definition text := replace(pg_get_functiondef('public.create_quote_from_template(uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure),E'\r\n',E'\n');
  old_gate text := $old$  if not found or template.status<>'activo' then
    raise exception 'La plantilla no está aprobada.' using errcode='22023';
  end if;$old$;
  new_gate text := $new$  if not found or template.status not in ('activo','pendiente') then
    raise exception 'La plantilla está archivada o no está disponible.' using errcode='22023';
  end if;
  -- SECURITY DEFINER must independently enforce pending-template visibility;
  -- a caller cannot forge p_source to copy somebody else's private draft.
  if template.status='pendiente' and public.current_role()='vendedor'
    and template.created_by is distinct from auth.uid() then
    raise exception 'La plantilla no está disponible para tu usuario.' using errcode='42501';
  end if;$new$;
begin
  if position(old_gate in definition)=0 then
    raise exception 'No se reconoce el control de plantilla: revisar create_quote_from_template antes de migrar.';
  end if;
  execute replace(definition,old_gate,new_gate);
end;
$migration$;

commit;
