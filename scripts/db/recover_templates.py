"""Recover only programs 28 and 44; never infer tariff links from prose.

Run before publishing this migration. Does not connect to Lovable Cloud.
SPA4D/ is explicitly excluded at the user's request.
"""
import json
from generate_seed import ROOT, uid, insert

MIGRATION = ROOT / 'supabase/migrations/20261006100000_recover_missing_templates.sql'
guide = json.loads((ROOT / 'docs/fase0/guia_productos_extraida.json').read_text(encoding='utf8'))
statements = ["""-- Recovery of guide programs 28 and 44. See docs/VERIFICACION_PLANTILLAS.md.
-- Apply after the already-applied schema and 00/01/02 seeds. No prices inferred.
-- SPA4D/ remains excluded by user decision. Both recovered programs lack a matching budget.
begin;
"""]

for index, sku, days, nights, warnings in [
    (28, 'SPAUYU-4D3N-FTL', guide['programas'][27]['days'], 3, [
        'SKU de origen SPAUYU-3D3N-FTL: cuatro dÃ­as extraÃ­dos; se normaliza a 4D3N conservando el combo FTL.',
        'El dÃ­a 4 es opcional. Confirmar duraciÃ³n comercial y combo hotelero T (el texto dice Tayka de Sal) antes de aprobar.',
    ]),
    (44, 'UYUUYU-2D1N-L', guide['programas'][43]['days'][:2], 1, [
        'La extracciÃ³n mezcla dos dÃ­as de este programa con cuatro dÃ­as Uyuniâ€“Arica sin SKU propio; solo se recuperan los dos primeros.',
        'Los incluye/no incluye generales estÃ¡n mezclados con otro programa; revisar antes de completar.',
    ]),
]:
    p = guide['programas'][index-1]
    assert [d['n'] for d in days] == list(range(1, len(days)+1))
    warnings += ['Sin presupuesto por SKU en extraccion_presupuestos_standard.json. Todos los dÃ­as quedan sin servicios tarifados; asignar SKU y variantes manualmente antes de aprobar.']
    tid = uid('template', sku)
    statements.append(insert('itinerary_templates', dict(
        id=tid, sku=sku, name=p['title'], route_from=sku[:3], route_to=sku[3:6],
        route_type='ROUNDTRIP' if sku[:3] == sku[3:6] else 'ONEWAY',
        days=len(days), nights=nights, category='MIXTO', hotel_combo=sku.split('-')[2],
        status='pendiente', import_warnings=json.dumps(warnings, ensure_ascii=False))))
    for d in days:
        n = d['n']
        bid = uid('recovered_guide_block', f'{index}:{n}')
        statements.append(insert('day_blocks', dict(
            id=bid, code=f'RECOVERY_GUIDE_{index}_DAY_{n}', route_from=sku[:3] if n == 1 else None,
            route_to=sku[3:6] if n == len(days) else None, default_day_position=n, status='pendiente')))
        # Program 28's extractor put the whole narrative in title: retain every word.
        description = '\n'.join(filter(None, [d['title'] if index == 28 else None, d['desc'],
            ('Alojamiento: ' + d['alojamiento']) if d['alojamiento'] else None, d.get('nota')]))
        title = (f'DÃ­a {n}' + (' (opcional)' if n == 4 else '')) if index == 28 else d['title']
        statements.append(insert('day_block_translations', dict(
            id=uid('block_es', bid), block_id=bid, lang='es', title=title,
            description=description, includes=d.get('comidas'), reviewed=False)))
        statements.append(insert('template_days', dict(
            id=uid('template_day', sku+str(n)), template_id=tid, day_number=n, block_id=bid)))
    statements.append(f"""-- No day_block_items for {sku}: no matching budget or explicit service SKU.
-- Hotel names alone do not establish room, provider, currency or pricing variant.
""")

statements.append("""-- A natural-key collision must not silently produce partial templates.
do $$
begin
 if (select count(*) from public.itinerary_templates
     where sku in ('SPAUYU-4D3N-FTL','UYUUYU-2D1N-L')) <> 2 then
   raise exception 'Recovery incomplete: missing template';
 end if;
 if exists (
   select 1 from public.itinerary_templates t
   cross join lateral generate_series(1,t.days) d(n)
   left join public.template_days td on td.template_id=t.id and td.day_number=d.n
   left join public.day_blocks b on b.id=td.block_id
   where t.sku in ('SPAUYU-4D3N-FTL','UYUUYU-2D1N-L') and b.id is null
 ) then raise exception 'Recovery incomplete: missing day/block'; end if;
end $$;
commit;
""")
MIGRATION.write_text('\n'.join(statements), encoding='utf8')
print(MIGRATION.name, ': 2 pending templates, 6 days/blocks/translations, 0 inferred items')
