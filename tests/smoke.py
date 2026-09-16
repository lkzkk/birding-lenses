#!/usr/bin/env python3
from __future__ import annotations
import csv, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEMS=ROOT/'data'/'systems.csv'
COMPONENTS=ROOT/'data'/'component_prices.csv'
SPECS=ROOT/'data'/'spec_sources.csv'
COMPAT=ROOT/'data'/'teleconverter_compatibility.csv'
HTML=ROOT/'index.html'; JS=ROOT/'app.js'; CSS=ROOT/'styles.css'; RUNTIME=ROOT/'runtime-wrapper.js'
SYS_REQUIRED={'system_id','brand','list_name','body','lens','teleconverter','equiv_focal_length_mm','equiv_f_stop','system_weight_g'}
BUILTIN_TC_LENSES={'lens-om150400','lens-z400f28tc','lens-z600f4tc'}

def read(path):
    assert path.is_file(), f'Missing {path.relative_to(ROOT)}'
    with path.open(newline='',encoding='utf-8') as f:
        r=csv.DictReader(f); return r.fieldnames or [], list(r)

def lens_component_id(row):
    return next((x for x in row['price_component_ids'].split('|') if x.startswith('lens-')), None)

def external_tc_component_id(row):
    return next((x for x in row['price_component_ids'].split('|') if x.startswith('tc-')), None)

def builtin_engaged(row):
    return 'built-in' in row['teleconverter'].lower() and 'engaged' in row['teleconverter'].lower() and 'disengaged' not in row['teleconverter'].lower()

def builtin_disengaged(row):
    return 'disengaged' in row['teleconverter'].lower()

def main():
    fields,rows=read(SYSTEMS)
    assert SYS_REQUIRED<=set(fields)
    assert len(rows)==58, f'Expected 58 kits, got {len(rows)}'
    ids={r['system_id'] for r in rows}
    assert len(ids)==len(rows)
    assert 'a1ii-fe400f45' in ids and 'a1ii-fe600f63' in ids
    assert not any('rumor' in x for x in ids)
    for r in rows:
        for c in ('equiv_focal_length_mm','equiv_f_stop','system_weight_g'):
            v=float(r[c]); assert math.isfinite(v) and v>0

    _,comps=read(COMPONENTS)
    cids={r['component_id'] for r in comps}
    lens_cids={r['component_id'] for r in comps if r['category']=='lens'}
    assert {'lens-fe400f45','lens-fe600f63','tc-xf14','tc-z14'}<=cids
    for r in rows:
        assert lens_component_id(r) in lens_cids, f'Missing lens component for {r["system_id"]}'
        for cid in r['price_component_ids'].split('|'):
            assert cid in cids, f'Unknown component {cid} in {r["system_id"]}'

    _,specs=read(SPECS)
    sids={r['component_id'] for r in specs}
    assert {'lens-fe400f45','lens-fe600f63','tc-sony14','tc-sony20','lens-om150400'}<=sids

    _,compat=read(COMPAT)
    assert len(compat)==25, f'Expected compatibility audit for 25 lenses, got {len(compat)}'
    compat_ids={r['lens_component_id'] for r in compat}
    assert compat_ids==lens_cids, f'Compatibility audit mismatch: missing={lens_cids-compat_ids}, extra={compat_ids-lens_cids}'
    compatible={r['lens_component_id']:r['teleconverter_component_id'] for r in compat if r['compatible_1_4x']=='yes'}
    assert next(r for r in compat if r['lens_component_id']=='lens-sigma500')['compatible_1_4x']=='no'
    for body,lens_id in {(r['body'],lens_component_id(r)) for r in rows if lens_component_id(r) in compatible}:
        matching=[r for r in rows if r['body']==body and lens_component_id(r)==lens_id]
        tc_id=compatible[lens_id]
        assert any(external_tc_component_id(r) is None for r in matching), f'Missing non-external-TC entry for {body} / {lens_id}'
        assert any(external_tc_component_id(r)==tc_id for r in matching), f'Missing external 1.4x entry for {body} / {lens_id}'

    for lens_id in BUILTIN_TC_LENSES:
        matching=[r for r in rows if lens_component_id(r)==lens_id]
        assert len(matching)==4, f'Built-in TC lens {lens_id} must have exactly four records, got {len(matching)}'
        native=[r for r in matching if external_tc_component_id(r) is None]
        external=[r for r in matching if external_tc_component_id(r) is not None]
        assert len(native)==2 and len(external)==2, f'{lens_id} must have two native and two external-TC records'
        assert any(builtin_disengaged(r) for r in native) and any(builtin_engaged(r) for r in native), f'{lens_id} native built-in states incomplete'
        assert any(builtin_disengaged(r) for r in external) and any(builtin_engaged(r) for r in external), f'{lens_id} external-TC built-in states incomplete'

    html=HTML.read_text(encoding='utf-8'); js=JS.read_text(encoding='utf-8'); css=CSS.read_text(encoding='utf-8'); runtime=RUNTIME.read_text(encoding='utf-8')
    for marker in ['id="minReach" class="range-thumb range-thumb-min" type="range"','id="maxReach" class="range-thumb range-thumb-max" type="range"','id="reachFill"','id="maxWeight"','name="lensType"','name="paretoMode"','System / brand','id="colorMode"','id="planeToggle"','id="sizePriceToggle"','id="recalcResidualToggle"','id="plot"','id="rankTable"']:
        assert marker in html, marker
    assert 'statusFilter' not in html
    assert 'Highlight similar kits' not in html
    assert 'id="infoPopover"' in html and 'id="infoButton"' in html and 'id="infoClose"' in html
    assert 'DPReview: What is equivalence?' in html and 'https://buymeacoffee.com/lkzk' in html
    assert 'runtime-wrapper.js?v=20260916b' in html
    assert 'data-sort="seq"' in html
    for marker in ['data-filtered-i','activeSet','computeFrontier','colorFor','axis-reach','axis-aperture','axis-weight','pointerEvents','pointRadius','brandAll','reachResidual','orientPlaneEdgeOn']:
        assert marker in js or marker in css, marker
    for marker in ['recalcResidualToggle','return 4.5+12.5*Math.sqrt(q);','hover label dedupe','color mode orientation','plane orientation','setInfoOpen','Regression uses the full dataset.','infoClose','teleconverter filter state','teleconverter pass','teleconverter reset','teleconverter listeners','id="tcFilter"','id="tcNo"','id="tcYes"']:
        assert marker in runtime, marker
    assert 'External teleconverter' in runtime
    assert '<input id="tcNo" type="checkbox" checked> No TC' in runtime
    assert '<input id="tcYes" type="checkbox"> TC' in runtime
    assert "tcNo:$('tcNo')?.checked??true" in runtime
    assert "tcYes:$('tcYes')?.checked??false" in runtime
    assert "builtInOnly=s.tc==='TC disengaged'||/^built-in/i.test(s.tc)" in runtime
    assert "builtInOnly||(externalTc?f.tcYes:f.tcNo)" in runtime
    assert "document.querySelectorAll('#tcFilter input').forEach(el=>el.addEventListener('change',refresh));" in runtime
    assert "$('tcNo').checked=true;$('tcYes').checked=false;refresh();" in runtime
    assert "$('colorMode').addEventListener('change',refresh);" in runtime
    assert "$('planeToggle').addEventListener('change',render);" in runtime
    assert "if(!isSel&&!isShort)tx(" in runtime
    assert '.info-close{' in css
    assert 'Highlight frontier' not in html
    assert 'type="number"' not in html
    assert "pitch=-Math.PI/2" in js
    assert 'standardFStops' in js and 'reachStep' in js
    assert {'om1ii-150400-700-builtin-14x','z8-400f28tc-engaged-14x','z8-600f4tc-engaged-14x'}<=ids
    assert next(r for r in rows if r['system_id']=='xh2s-150600-600')['equiv_focal_length_mm']=='900'
    assert next(r for r in rows if r['system_id']=='xh2s-xf500f56')['equiv_focal_length_mm']=='750'
    assert all(' — ' in r['list_name'] for r in rows)
    assert all(r['list_name'].startswith(r['brand']+' — ') for r in rows)
    print(f'Smoke validation passed: {len(rows)} kits, {len(comps)} component price rows, {len(compat)} lens compatibility rows.')

if __name__=='__main__': main()
