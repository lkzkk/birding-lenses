#!/usr/bin/env python3
from __future__ import annotations
import csv, math
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEMS=ROOT/'data'/'systems.csv'
COMPONENTS=ROOT/'data'/'component_prices.csv'
SPECS=ROOT/'data'/'spec_sources.csv'
COMPAT=ROOT/'data'/'teleconverter_compatibility.csv'
COVERAGE=ROOT/'data'/'coverage_audit.csv'
HTML=ROOT/'index.html'; JS=ROOT/'app.js'; CSS=ROOT/'styles.css'; UXCSS=ROOT/'interaction-fixes.css'; RUNTIME=ROOT/'runtime-wrapper.js'
SYS_REQUIRED={'system_id','brand','list_name','body','lens','teleconverter','equiv_focal_length_mm','equiv_f_stop','system_weight_g'}
BUILTIN_TC_LENSES={'lens-om150400','lens-z400f28tc','lens-z600f4tc'}
EXPECTED_BODIES={'OM System OM-1 II','Canon EOS R5 Mark II','Fujifilm X-H2S','Nikon Z8','Sony Alpha 1 II'}

def read(path):
    assert path.is_file(), f'Missing {path.relative_to(ROOT)}'
    with path.open(newline='',encoding='utf-8') as f:
        r=csv.DictReader(f); return r.fieldnames or [], list(r)

def lens_component_id(row):
    return next((x for x in row['price_component_ids'].split('|') if x.startswith('lens-')), None)

def external_tc_component_id(row):
    return next((x for x in row['price_component_ids'].split('|') if x.startswith('tc-')), None)

def builtin_engaged(row):
    tc=row['teleconverter'].lower()
    return 'built-in' in tc and 'engaged' in tc and 'disengaged' not in tc

def builtin_disengaged(row):
    return 'disengaged' in row['teleconverter'].lower()

def main():
    fields,rows=read(SYSTEMS)
    assert SYS_REQUIRED<=set(fields)
    assert len(rows)==76, f'Expected 76 kits, got {len(rows)}'
    ids={r['system_id'] for r in rows}; assert len(ids)==len(rows)
    assert {r['body'] for r in rows}==EXPECTED_BODIES
    assert {r['body'] for r in rows if r['brand']=='Fujifilm'}=={'Fujifilm X-H2S'}
    assert not any('GFX' in r['body'] or 'GF500' in r['lens'] for r in rows)
    assert not any('2.0' in r['teleconverter'] or '2×' in r['teleconverter'] for r in rows)
    assert not any('rumor' in r['system_id'] for r in rows)
    for r in rows:
        for c in ('equiv_focal_length_mm','equiv_f_stop','system_weight_g'):
            v=float(r[c]); assert math.isfinite(v) and v>0, (r['system_id'],c,v)

    _,comps=read(COMPONENTS)
    cids={r['component_id'] for r in comps}
    used_lens_ids={lens_component_id(r) for r in rows}
    assert None not in used_lens_ids
    assert len(used_lens_ids)==37, f'Expected 37 included lenses, got {len(used_lens_ids)}'
    assert not any(cid.startswith(('body-gfx','lens-gf','tc-gf','tc-sony20')) for cid in cids)
    for r in rows:
        for cid in r['price_component_ids'].split('|'):
            assert cid in cids, f'Unknown component {cid} in {r["system_id"]}'

    _,specs=read(SPECS); sids={r['component_id'] for r in specs}
    assert {'lens-fe400f45','lens-fe600f63','tc-sony14','lens-om150400','lens-om150600','lens-xf400f45','lens-z100400'}<=sids
    assert 'tc-sony20' not in sids

    _,compat=read(COMPAT)
    assert len(compat)==37, f'Expected compatibility audit for 37 lenses, got {len(compat)}'
    compat_ids={r['lens_component_id'] for r in compat}
    assert compat_ids==used_lens_ids, f'Compatibility audit mismatch: missing={used_lens_ids-compat_ids}, extra={compat_ids-used_lens_ids}'
    compat_by_id={r['lens_component_id']:r for r in compat}
    for lens_id in {'lens-sigma500','lens-tamron150500-x','lens-tamron150500-z','lens-tamron150500-e'}:
        assert compat_by_id[lens_id]['compatible_1_4x']=='no'

    # Every ordinary compatible lens has exactly native + external 1.4x.
    # Built-in-TC lenses have four states. Unsupported lenses have one native state.
    for lens_id in sorted(used_lens_ids):
        matching=[r for r in rows if lens_component_id(r)==lens_id]
        audit=compat_by_id[lens_id]
        if lens_id in BUILTIN_TC_LENSES:
            assert len(matching)==4, f'{lens_id}: expected four built-in/external TC states, got {len(matching)}'
            native=[r for r in matching if external_tc_component_id(r) is None]
            external=[r for r in matching if external_tc_component_id(r) is not None]
            assert len(native)==2 and len(external)==2
            assert any(builtin_disengaged(r) for r in native) and any(builtin_engaged(r) for r in native)
            assert any(builtin_disengaged(r) for r in external) and any(builtin_engaged(r) for r in external)
        elif audit['compatible_1_4x']=='yes':
            assert len(matching)==2, f'{lens_id}: expected native + 1.4x, got {len(matching)} records'
            tc_id=audit['teleconverter_component_id']; assert tc_id
            assert sum(external_tc_component_id(r) is None for r in matching)==1
            assert sum(external_tc_component_id(r)==tc_id for r in matching)==1
        else:
            assert len(matching)==1, f'{lens_id}: unsupported TC lens should have one native record'
            assert external_tc_component_id(matching[0]) is None

    _,coverage=read(COVERAGE)
    assert len(coverage)==37
    assert {r['lens_component_id'] for r in coverage}==used_lens_ids
    assert all(r['status']=='complete' for r in coverage)
    assert sum(int(r['actual_records']) for r in coverage)==76
    assert Counter(r['brand'] for r in coverage)==Counter({'Sony':12,'Canon':8,'Nikon':8,'Fujifilm':5,'OM System':4})

    html=HTML.read_text(encoding='utf-8'); js=JS.read_text(encoding='utf-8'); css=CSS.read_text(encoding='utf-8'); uxcss=UXCSS.read_text(encoding='utf-8'); runtime=RUNTIME.read_text(encoding='utf-8')
    for marker in ['id="minReach" class="range-thumb range-thumb-min" type="range"','id="maxReach" class="range-thumb range-thumb-max" type="range"','id="reachFill"','id="maxWeight"','name="lensType"','name="paretoMode"','System / brand','id="colorMode"','id="planeToggle"','id="sizePriceToggle"','id="recalcResidualToggle"','id="plot"','id="rankTable"']:
        assert marker in html, marker
    assert 'statusFilter' not in html and 'Highlight similar kits' not in html
    assert 'id="infoPopover"' in html and 'id="infoButton"' in html and 'id="infoClose"' in html
    assert 'DPReview: What is equivalence?' in html and 'https://buymeacoffee.com/lkzk' in html
    assert 'interaction-fixes.css?v=20260916a' in html and 'runtime-wrapper.js?v=20260916c' in html
    assert 'id="planeToggle" type="checkbox" disabled' in html
    assert 'id="recalcResidualToggle" type="checkbox" disabled' in html
    assert 'Select an Advanced: efficiency residual color mode' in html
    assert 'wheel to zoom' not in html and 'tap or click empty plot space to deselect' in html
    for marker in ['data-filtered-i','activeSet','computeFrontier','colorFor','axis-reach','axis-aperture','axis-weight','pointRadius','brandAll','reachResidual']:
        assert marker in js or marker in css, marker
    # Canonical core still contains zoom; runtime removes it before evaluation.
    assert 'zoom=1,pointer=null' in js and 'sc=220*zoom' in js and "addEventListener('wheel'" in js
    for marker in ['recalcResidualToggle','return 4.5+12.5*Math.sqrt(q);','hover label dedupe','setInfoOpen','teleconverter filter state','teleconverter pass','teleconverter reset','teleconverter listeners','remove chart zoom state','fixed chart scale','hover capability','mobile clear selection','mobile pointer interaction','hitTestPoint','setPointerCapture','residualModeNote']:
        assert marker in runtime, marker
    assert 'External teleconverter' in runtime
    assert '<input id="tcNo" type="checkbox" checked> No TC' in runtime and '<input id="tcYes" type="checkbox"> TC' in runtime
    assert "builtInOnly=s.tc==='TC disengaged'||/^built-in/i.test(s.tc)" in runtime
    assert "builtInOnly||(externalTc?f.tcYes:f.tcNo)" in runtime
    assert "hovered=null;popup.hidden=true" in runtime
    assert "residualMode=cs.kind==='res'" in runtime and "recalc.disabled=!residualMode" in runtime and "plane.disabled=!residualMode" in runtime
    assert '--info-popover-bg:#f7f9fd' in uxcss and '--info-popover-bg:#252a31' in uxcss
    assert 'External 1.4× teleconverter' in uxcss and 'No 1.4× TC' in uxcss and '1.4× TC' in uxcss
    assert '.check-control:has(input:disabled)' in uxcss and '.plotwrap{padding:8px 10px 18px}' in uxcss
    assert 'type="number"' not in html and 'Highlight frontier' not in html
    assert {'om1ii-150400-700-builtin-14x','z8-400f28tc-engaged-14x','z8-600f4tc-engaged-14x'}<=ids
    assert {'om1ii-150600-600','r5ii-rf800f56','xh2s-xf400f45','z8-z100400','a1ii-fe100400mc','a1ii-sigma500f56'}<=ids
    assert next(r for r in rows if r['system_id']=='xh2s-150600-600')['equiv_focal_length_mm']=='900'
    assert next(r for r in rows if r['system_id']=='xh2s-xf500f56')['equiv_focal_length_mm']=='750'
    assert all(' — ' in r['list_name'] and r['list_name'].startswith(r['brand']+' — ') for r in rows)
    print(f'Smoke validation passed: {len(rows)} kits, {len(used_lens_ids)} lenses, {len(compat)} compatibility rows.')

if __name__=='__main__': main()
