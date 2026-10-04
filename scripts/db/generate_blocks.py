"""Conservative, reproducible joins. Never infer prices, suppliers or missing SKUs."""
import csv
import json
import re
from collections import Counter
from generate_seed import ROOT, OUT, uid, insert, day_span


def norm(s):
    s = re.sub(r'\s+', '', s or '')
    m = re.fullmatch(r'([A-Z]{3})([A-Z]{3})-?(\d+)D(\d+)N-?([A-Za-zÑñ]+)(?:-(ENG|ITA|PHOTO|SHR|GRP))?', s)
    return f'{m[1]}{m[2]}-{m[3]}D{m[4]}N-{m[5]}' + (f'-{m[6]}' if m[6] else '') if m else None


def main():
    guide = json.loads((ROOT/'docs/fase0/guia_productos_extraida.json').read_text(encoding='utf8'))
    budgets = json.loads((ROOT/'docs/fase0/extraccion_presupuestos_standard.json').read_text(encoding='utf8'))
    report = json.loads((OUT/'report.json').read_text(encoding='utf8'))
    rows = list(csv.DictReader((ROOT/'docs/fase0/tarifario_normalizado.csv').open(encoding='utf-8-sig')))
    aliases, services = {}, {}
    excluded = {r['row'] for r in report['omitted'] + report['exchange_rate_rows']}
    for rowno, row in enumerate(rows,2):
        if rowno not in excluded and row['sku']:
            services[row['sku']] = row
            aliases[row['sku']] = row['sku']
    for g in report['grouped_services']:
        services[g['sku']] = rows[g['rows'][0]-2]
        for a in g['aliases']:
            aliases[a] = g['sku']
    statements, counts = [], Counter()
    audit = dict(missing_budgets=[], missing_skus=[], rejected_programs=[], ambiguous_budgets=[], missing_modules=[])

    def emit(table, row):
        statements.append(insert(table, row)); counts[table] += 1

    by_sku = {}
    for b in budgets:
        k = norm(b.get('sku_tpl'))
        if not k:
            continue
        sheet = norm(b['sheet'])
        if k in by_sku:
            old = by_sku[k]
            if sheet == k and norm(old['sheet']) != k:
                audit['ambiguous_budgets'].append(old['sheet']); by_sku[k] = b
            else:
                audit['ambiguous_budgets'].append(b['sheet'])
        else:
            by_sku[k] = b
    # No BLOQUES SPA group exists in the supplied extraction (75 budget sheets).
    groups = [b for b in budgets if 'BLOQUES SPA' in b['sheet'].upper()]
    if not groups:
        audit['missing_modules'].append('BLOQUES SPA no está presente en la extracción; se requiere la hoja con grupos de actividades.')
    else:
        raise ValueError('New BLOQUES SPA source detected: review its grouping before importing.')
    used, blocks = set(), {}

    def block(candidate, hotel, n, sku, items, includes=None, excludes=None):
        # Different hotel OR services = different block; never union two budgets.
        identity = json.dumps([candidate['title'], candidate['desc'], hotel, items, includes, excludes], ensure_ascii=False, sort_keys=True)
        bid = uid('block', identity)
        if bid in blocks:
            return bid
        blocks[bid] = True
        hotel_sku = next((i['sku'] for i in items if services[i['sku']]['type'] == 'alojamiento'), None)
        emit('day_blocks', dict(id=bid, code='DAY_'+bid.replace('-','')[:20], route_from=sku[:3] if sku else None,
             route_to=sku[3:6] if sku else None, hotel_service_id=uid('service',hotel_sku) if hotel_sku else None,
             default_day_position=n, status='pendiente'))
        description = candidate['desc'] + (f'\nAlojamiento: {hotel}' if hotel else '')
        emit('day_block_translations', dict(id=uid('block_es',bid), block_id=bid, lang='es', title=candidate['title'],
             description=description or candidate['title'], includes=includes, excludes=excludes, reviewed=False))
        for i in items:
            emit('day_block_items', dict(id=uid('block_item',bid+json.dumps(i,sort_keys=True)), block_id=bid,
                 service_id=uid('service',i['sku']), qty=1, included=i['included'], multi_day_span=i['span'],
                 coverage_key=i.get('coverage'), coverage_start_day=i.get('start')))
        return bid

    for pi,p in enumerate(guide['programas'],1):
        sku = norm(p['sku_norm'])
        if not sku or sku in used or len(p['days']) != int(re.search(r'-(\d+)D',sku)[1]):
            audit['rejected_programs'].append(dict(index=pi,sku=p['sku_norm'],reason='SKU inválido, duplicado o duración inconsistente')); continue
        used.add(sku)
        budget = by_sku.get(sku)
        daily = {}
        if not budget:
            audit['missing_budgets'].append(sku)
        else:
            # Repeated pax/room columns are alternate views of the same purchase.
            seen = set()
            for ix,i in enumerate(budget['items'],1):
                daymatch = re.search(r'(\d+)',i['day'] or '')
                if not daymatch:
                    continue
                n = int(daymatch[1]); canonical = aliases.get(i.get('sku'))
                if not canonical:
                    audit['missing_skus'].append(dict(template=sku,sheet=budget['sheet'],item=ix,sku=i.get('sku'),description=i['servicio']))
                    continue
                key = (n,canonical,i['incl'])
                if key in seen: continue
                seen.add(key)
                raw = services[canonical]
                span = min(day_span(raw.get('multi_day_span')), len(p['days'])-n+1)
                if span < 1: continue
                entry = dict(sku=canonical,included=i['incl']=='INCLUDED',span=span)
                if span>1:
                    entry.update(coverage=uid('coverage',sku+str(key)),start=n)
                for covered in range(n,n+span):
                    daily.setdefault(covered,[]).append(entry)
        tid = uid('template',sku)
        category = next((c for c in ['BUDGET','COMFORT','VIP'] if c in p['sku_raw']), 'MIXTO')
        emit('itinerary_templates',dict(id=tid,sku=sku,name=p['title'],route_from=sku[:3],route_to=sku[3:6],
             route_type='ROUNDTRIP' if sku[:3]==sku[3:6] else 'ONEWAY',days=len(p['days']),
             nights=int(re.search(r'D(\d+)N',sku)[1]),category=category,hotel_combo=sku.split('-')[2],status='pendiente',
             import_warnings=json.dumps(['Validar cantidades, variantes y servicios de origen antes de revisar.'] +
                 (['Sin presupuesto enlazado.'] if not budget else []) +
                 ([f"{sum(x['template']==sku for x in audit['missing_skus'])} filas sin SKU enlazable."] if any(x['template']==sku for x in audit['missing_skus']) else []))))
        excludes=[]
        for text in p['no_incluye']:
            if 'Valores en USD' in text or re.match(r'\s*---',text): break
            excludes.append(text)
        for d in p['days']:
            candidate = next((c for c in guide['bloques_candidatos'] if c['title']==d['title'] and c['desc']==d['desc']), d)
            bid=block(candidate,d['alojamiento'],d['n'],sku,daily.get(d['n'],[]),d.get('comidas'), '\n'.join(excludes))
            emit('template_days',dict(id=uid('template_day',sku+str(d['n'])),template_id=tid,day_number=d['n'],block_id=bid))
    # Keep candidates with no valid template, including every accommodation variant.
    for c in guide['bloques_candidatos']:
        for sku,n,hotel in c['usado_en']:
            if norm(sku) not in used:
                block(c,hotel,n,norm(sku),[])
    files=[]
    for start in range(0,len(statements),300):
        filename=f'02_bloques_{start//300+1:03}.sql'; files.append(filename)
        text='-- Generado por scripts/db/generate_blocks.py; ejecutar después de 00 y 01 y migración 003.\nbegin;\n'+'\n'.join(statements[start:start+300])+'\ncommit;\n'
        if start+300>=len(statements):
            text+='\n-- Auditoría de fuentes (sin precios inventados):\n'+'\n'.join('-- '+line for line in json.dumps(audit,ensure_ascii=False,indent=2).splitlines())+'\n'
        (OUT/filename).write_text(text,encoding='utf8')
    (OUT/'blocks-report.json').write_text(json.dumps(dict(counts=counts,seed_order=files,**audit),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps(dict(counts=counts,files=files,missing_budgets=len(audit['missing_budgets']),missing_skus=len(audit['missing_skus'])),ensure_ascii=True))


if __name__=='__main__': main()
