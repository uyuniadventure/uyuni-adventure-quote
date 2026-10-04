"""Deterministic SQL Editor seeds. Run: python scripts/db/generate_seed.py.

No credentials or database access. CSV record numbers include the header (row 1).
Only explicit passenger tokens matching the CSV band are removed for grouping;
vehicle, room, currency, year and other product variants remain separate.
"""
import csv
import json
import re
import uuid
import unicodedata
from collections import defaultdict
from decimal import Decimal, ROUND_CEILING
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "supabase/seed"
NS = uuid.UUID("a7166768-1be6-42fb-93fc-91e23f1b042a")


def uid(kind, key):
    return str(uuid.uuid5(NS, kind + ':' + str(key)))


def sql(value):
    if value is None or value == '':
        return 'NULL'
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, (int, Decimal)):
        return str(value)
    if isinstance(value, list):
        return 'ARRAY[' + ','.join(sql(x) for x in value) + ']::text[]'
    return "'" + str(value).replace("'", "''") + "'"


def insert(table, row):
    return 'insert into public.' + table + ' (' + ', '.join(row) + ') values (' + ', '.join(sql(v) for v in row.values()) + ') on conflict do nothing;'


def normalize(value):
    return ' '.join(value.upper().split())


def supplier_name(value):
    name = normalize(value)
    name = ''.join(c for c in unicodedata.normalize('NFKD', name) if not unicodedata.combining(c))
    # Explicit aliases named in SPEC; no fuzzy merging of different businesses.
    return {'LEO - UYUNI': 'LEONEL HUANCHACA'}.get(name, name)


def number(value):
    return Decimal(value) if value else None


def integer(value):
    if not value:
        return None
    # Source has e.g. PaxMin=1 / PaxMax=5. Preserve the unambiguous number.
    parsed = Decimal(re.sub(r'^Pax(?:Min|Max)=', '', value, flags=re.I))
    assert parsed == parsed.to_integral_value(), value
    return int(parsed)


def band_key(row):
    sku = row['sku']
    lo, hi = integer(row['pax_min']), integer(row['pax_max'])
    if lo is None:
        return sku
    tokens = []
    if hi is not None and lo != hi:
        tokens += [f'{lo}_{hi}PAX', f'{lo}_{hi}', f'{lo}{hi}']
    if lo == hi or hi is None:
        tokens += [f'{lo}PAX', f'PAX{lo}', f'{lo}P']
    for token in tokens:
        pattern = r'_' + re.escape(token) + r'(?=_(?:20\d{2}|CLP|USD)$|$)'
        result, count = re.subn(pattern, '_PAXBAND', sku)
        if count:
            return result
    return sku


def day_span(value):
    # Half-day services occupy one calendar day; SPEC stores an integer span.
    return max(1, int(Decimal(value or '1').to_integral_value(rounding=ROUND_CEILING)))


def date(value):
    if not value:
        return None
    return datetime.strptime(value[:10], '%d/%m/%Y' if '/' in value else '%Y-%m-%d').date().isoformat()


def generate():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = list(csv.DictReader((ROOT / 'docs/fase0/tarifario_normalizado.csv').open(encoding='utf-8-sig', newline='')))
    kept, omitted, fx_rows = [], [], []
    for rowno, row in enumerate(rows, 2):
        row['_row'] = rowno
        if 'sku_dup' in row['issues'] or 'mismo_servicio_en_2_monedas' in row['issues']:
            omitted.append({'row': rowno, 'sku': row['sku'], 'issues': row['issues']})
        elif row['name'] in ('BOB/USD', 'CLP/USD') and not row['currency']:
            fx_rows.append({'row': rowno, 'sku': row['sku'], 'destination': '00_base.sql / exchange_rates'})
        else:
            if not row['sku']:
                row['sku'] = f'IMPORT_REVIEW_{rowno:04}'
            kept.append(row)

    suppliers = defaultdict(list)
    for row in kept:
        if row['supplier']:
            suppliers[supplier_name(row['supplier'])].append(row)
    statements = []
    for name, source in sorted(suppliers.items()):
        countries = sorted(set(x['country'] for x in source if x['country']))
        statements.append(insert('suppliers', dict(id=uid('supplier', name), name=name,
            aliases=sorted(set(x['supplier'] for x in source)), country=', '.join(countries))))

    groups = defaultdict(list)
    for row in kept:
        # Do not merge vehicle/room variants or products from different sources.
        key = (band_key(row), supplier_name(row['supplier']), *(row[x] for x in
            ('currency','type','pricing_unit','room_type','vehicle_type','meal_plan','multi_day_span','location','country')))
        groups[key].append(row)

    services, rates, aliases, review, grouped = [], [], [], [], []
    canonical_seen = set()
    for group in groups.values():
        first = group[0]
        canonical = first['sku']  # preserve the first original SKU; others remain aliases
        assert canonical not in canonical_seen, f'Conflicting SKU not marked sku_dup: {canonical}'
        canonical_seen.add(canonical)
        sid = uid('service', canonical)
        problems = sorted(set(x['issues'] for x in group if x['issues']))
        if len(group) > 1:
            grouped.append({'sku': canonical, 'rows': [x['_row'] for x in group], 'aliases': [x['sku'] for x in group]})
        # Every import awaits human approval (SPEC §9); no guessed unit or currency.
        if not first['name']:
            problems.append('sin_nombre: se usa SKU como etiqueta provisional')
        service = dict(id=sid, sku=canonical, name=first['name'] or canonical, location=first['location'],
            country=first['country'], supplier_id=uid('supplier', supplier_name(first['supplier'])) if first['supplier'] else None,
            type=first['type'], pricing_unit=first['pricing_unit'], currency=first['currency'],
            room_type=first['room_type'], vehicle_type=first['vehicle_type'],
            vehicle_max_pax=max((integer(x['vehicle_max_pax']) or 0 for x in group if x['vehicle_max_pax'] != 'PER_PERSON'), default=0) or None,
            meal_plan=first['meal_plan'] if first['meal_plan'] in ('NONE','BB','HB','FB') else None,
            multi_day_span=day_span(first['multi_day_span']),
            applies_tc_default=first['type'] == 'comida', margin_applicable_default=True,
            modality='ambos', status='pendiente', source=first['source'],
            notes=' | '.join(dict.fromkeys(x['notes'] for x in group if x['notes'])), import_issues=' | '.join(problems))
        services.append(insert('services', service))
        for row in group:
            if not row['sku'].startswith('IMPORT_REVIEW_'):
                aliases.append(insert('service_sku_aliases', dict(id=uid('alias', row['sku']), sku=row['sku'], service_id=sid)))
            missing_net = not row['price_net'] and bool(row['price_rack'])
            notes = [row['notes']]
            if row['vehicle_max_pax'] == 'PER_PERSON':
                notes.append('vehicle_max_pax original inválido: PER_PERSON')
            if row['multi_day_span'] and Decimal(row['multi_day_span']) != day_span(row['multi_day_span']):
                notes.append('duración original en días: ' + row['multi_day_span'])
            if missing_net:
                notes.append('sin costo neto')
            if row['issues']:
                notes.append('issues: ' + row['issues'])
                review.append({'row': row['_row'], 'sku': row['sku'], 'issues': row['issues']})
            if row['meal_plan'] not in ('', 'NONE', 'BB', 'HB', 'FB'):
                notes.append('meal_plan original: ' + row['meal_plan'])
            rates.append(insert('service_rates', dict(id=uid('rate', row['_row']), service_id=sid,
                season=row['season'] or 'ALL', valid_from=date(row['valid_from']), valid_to=date(row['valid_to']),
                pax_min=integer(row['pax_min']), pax_max=integer(row['pax_max']),
                price_net=number(row['price_net'] or row['price_rack']), price_rack=number(row['price_rack']),
                net_cost_missing=missing_net, notes=' | '.join(x for x in notes if x), source_row=row['_row'])))

    base = []
    for code, name in [('USD','Dólar estadounidense'),('CLP','Peso chileno'),('BOB','Boliviano'),('ARS','Peso argentino'),('PEN','Sol peruano'),('EUR','Euro')]:
        base.append(insert('currencies', dict(id=uid('currency', code), code=code, name=name)))
    for code, rate in [('USD',Decimal('1')),('CLP',Decimal('885')),('BOB',Decimal('6.91'))]:
        base.append(insert('exchange_rates', dict(id=uid('fx', code + ':2026-01-01'), currency=code, rate_to_usd=rate, valid_from='2026-01-01')))
    for code, name, country in [('SPA','San Pedro de Atacama','CHILE'),('UYU','Uyuni','BOLIVIA'),('CJC','Calama','CHILE'),('LPB','La Paz','BOLIVIA'),('SRE','Sucre','BOLIVIA'),('STG','Santiago','CHILE')]:
        base.append(insert('location_codes', dict(id=uid('location', code), code=code, name=name, country=country)))
    for code, name in [('P','Palacio de Sal'),('Td','Tayka del Desierto'),('M','Mallku Cueva'),('L','Luna Salada'),('F','Los Flamencos'),('K','Kachi'),('J','Jardines de Uyuni'),('Ñ','Coscaña'),('S','Sky Dream')]:
        base.append(insert('hotel_codes', dict(id=uid('hotel', code), code=code, name=name)))
    (OUT / '00_base.sql').write_text('-- Unidades de moneda nativa por USD; tasas iniciales, no cotizaciones actuales.\nbegin;\n' + '\n'.join(base) + '\ncommit;\n', encoding='utf-8')

    statements += services + aliases + rates
    parts = []
    for offset in range(0, len(statements), 300):
        name = f'01_tarifario_{offset // 300 + 1:03}.sql'
        part = statements[offset:offset+300]
        content = f'-- Generado por scripts/db/generate_seed.py. {len(part)} filas INSERT.\n-- Ejecutar en orden después de 00_base.sql; todo pendiente de aprobación.\nbegin;\n' + '\n'.join(part) + '\ncommit;\n'
        if offset + 300 >= len(statements):
            content += '\n-- Filas omitidas (número de registro CSV, encabezado = 1):\n'
            content += '\n'.join(f"-- {r['row']}: {r['sku']} | {r['issues']}" for r in omitted) + '\n'
            content += '-- Filas de divisas trasladadas a 00_base.sql:\n'
            content += '\n'.join(f"-- {r['row']}: {r['sku']}" for r in fx_rows) + '\n'
        (OUT / name).write_text(content, encoding='utf-8')
        parts.append(name)
    report = dict(source_rows=len(rows), services=len(services), rates=len(rates), suppliers=len(suppliers),
        sku_aliases=len(aliases), rack_fallbacks=sum(not x['price_net'] and bool(x['price_rack']) for x in kept),
        seed_order=['00_base.sql']+parts, omitted=omitted, exchange_rate_rows=fx_rows,
        grouped_services=grouped, review=review)
    (OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k not in ('grouped_services','review','omitted')},ensure_ascii=False, indent=2))


if __name__ == '__main__':
    generate()
