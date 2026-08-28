#!/usr/bin/env python3
"""Dependency-free validation for the static microsite data and source files."""
from __future__ import annotations
import csv, math
from datetime import date
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEMS=ROOT/'data/systems.csv'; COMPONENTS=ROOT/'data/component_prices.csv'; HTML=ROOT/'index.html'; APP=ROOT/'app.js'; STYLES=ROOT/'styles.css'; README=ROOT/'README.md'
SYSTEM_COLUMNS=['system_id','brand','list_name','display_name','body','lens','teleconverter','actual_focal_length_mm','actual_f_stop','equiv_focal_length_mm','equiv_f_stop','system_weight_g','system_price_chf','price_checked_date','price_component_ids','price_basis']
COMPONENT_COLUMNS=['component_id','category','brand','component_name','price_chf','source','source_url','price_checked_date','notes']
SYSTEM_NUMERIC=['actual_focal_length_mm','actual_f_stop','equiv_focal_length_mm','equiv_f_stop','system_weight_g','system_price_chf']
HTML_MARKERS=['id="comparisonMode"','id="axisX"','id="axisY"','id="axisZ"','id="colorDimension"','id="colorMode"','id="clearSelection"','Experimental 4D','Efficiency residual','data-preset="reach-aperture"','styles.css','app.js']
APP_MARKERS=['data/systems.csv','function clearSelection()','function ticks(d)','Experimental 4D','fourthDim()']

def rows(path, expected):
    assert path.is_file(), f'Missing {path.relative_to(ROOT)}'
    with path.open(newline='',encoding='utf-8') as f:
        r=csv.DictReader(f); assert r.fieldnames==expected, f'{path.name} schema mismatch: {r.fieldnames}'; return list(r)

def positive_float(v, what):
    try:x=float(v)
    except ValueError as e: raise AssertionError(f'Non-numeric {what}: {v!r}') from e
    assert math.isfinite(x) and x>0, f'Invalid {what}: {x}'
    return x

def main():
    systems=rows(SYSTEMS,SYSTEM_COLUMNS); comps=rows(COMPONENTS,COMPONENT_COLUMNS)
    assert len(systems)==31, f'Expected 31 systems, found {len(systems)}'
    assert len(comps)>=30, f'Unexpectedly small component price table: {len(comps)}'
    ids=[r['system_id'] for r in systems]; assert len(ids)==len(set(ids)), 'Duplicate system_id'
    cids=[r['component_id'] for r in comps]; assert len(cids)==len(set(cids)), 'Duplicate component_id'
    comp_price={r['component_id']:positive_float(r['price_chf'],r['component_id']) for r in comps}
    for n,r in enumerate(systems,2):
        for c in SYSTEM_COLUMNS: assert r[c].strip(), f'Blank {c} row {n}'
        for c in SYSTEM_NUMERIC: positive_float(r[c],f'{c} row {n}')
        date.fromisoformat(r['price_checked_date'])
        refs=r['price_component_ids'].split('|'); assert refs, f'No component refs row {n}'
        missing=[x for x in refs if x not in comp_price]; assert not missing, f'Missing components row {n}: {missing}'
        calculated=round(sum(comp_price[x] for x in refs),2); stated=round(float(r['system_price_chf']),2)
        assert calculated==stated, f'Price total mismatch {r["system_id"]}: {calculated} != {stated}'
    for n,r in enumerate(comps,2):
        for c in COMPONENT_COLUMNS: assert r[c].strip(), f'Blank component {c} row {n}'
        assert r['category'] in {'body','lens','teleconverter'}, f'Bad category row {n}'
        date.fromisoformat(r['price_checked_date']); assert r['source_url'].startswith('https://'), f'Bad URL row {n}'
    assert APP.is_file() and STYLES.is_file(), 'Missing app.js or styles.css'
    html=HTML.read_text(encoding='utf-8'); app=APP.read_text(encoding='utf-8'); readme=README.read_text(encoding='utf-8')
    for m in HTML_MARKERS: assert m in html, f'Missing HTML marker {m}'
    for m in APP_MARKERS: assert m in app, f'Missing app.js marker {m}'
    assert 'type="range"' not in html, 'Rotation/tilt/zoom sliders unexpectedly present'
    assert html.count('<script')==1 and html.count('</script>')==1, 'Unexpected script tag count'
    assert 'vibecoded AI slop' in readme and 'component_prices.csv' in readme and 'Experimental 4D' in readme
    brands=[r['brand'] for r in systems]; assert set(brands)=={'Canon','Fujifilm','Nikon','OM System','Sony'}
    print(f'Validation passed: {len(systems)} systems, {len(comps)} component prices, totals reconcile.')

if __name__=='__main__': main()
