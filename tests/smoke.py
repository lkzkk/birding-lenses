#!/usr/bin/env python3
from __future__ import annotations
import csv, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEM_FILES=[ROOT/'data'/'systems.csv',ROOT/'data'/'systems_additions.csv']
COMPONENT_FILES=[ROOT/'data'/'component_prices.csv',ROOT/'data'/'component_prices_additions.csv']
SPEC_FILES=[ROOT/'data'/'spec_sources.csv',ROOT/'data'/'spec_sources_additions.csv']
COMPAT_FILES=[ROOT/'data'/'teleconverter_compatibility.csv',ROOT/'data'/'teleconverter_compatibility_additions.csv']
COVERAGE_FILES=[ROOT/'data'/'coverage_audit.csv',ROOT/'data'/'coverage_audit_additions.csv']
HTML=ROOT/'index.html'; JS=ROOT/'app.js'; CSS=ROOT/'styles.css'; UXCSS=ROOT/'interaction-fixes.css'; RUNTIME=ROOT/'runtime-wrapper.js'
WORKFLOW=ROOT/'.github'/'workflows'/'static.yml'; UPDATE_RULES=ROOT/'PROJECT_UPDATE_RULES.md'; UI_AUDIT=ROOT/'UI_REDESIGN_AUDIT.md'
SYS_REQUIRED={'system_id','brand','list_name','body','lens','teleconverter','equiv_focal_length_mm','equiv_f_stop','system_weight_g'}
BUILTIN_TC_LENSES={'lens-om150400','lens-z400f28tc','lens-z600f4tc'}
EXPECTED_BODIES={'OM System OM-1 II','Canon EOS R5 Mark II','Fujifilm X-H2S','Nikon Z8','Sony Alpha 1 II'}


def read(path):
    assert path.is_file(), f'Missing {path.relative_to(ROOT)}'
    with path.open(newline='',encoding='utf-8') as f:
        r=csv.DictReader(f); return r.fieldnames or [], list(r)


def read_many(paths):
    fields=None; rows=[]
    for path in paths:
        f,r=read(path)
        if fields is None: fields=f
        else: assert f==fields, f'Header mismatch in {path.relative_to(ROOT)}'
        rows.extend(r)
    return fields or [],rows


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
    fields,rows=read_many(SYSTEM_FILES)
    assert SYS_REQUIRED<=set(fields)
    ids={r['system_id'] for r in rows}; assert len(ids)==len(rows), 'Duplicate system_id'
    assert {r['body'] for r in rows}==EXPECTED_BODIES
    assert {r['body'] for r in rows if r['brand']=='Fujifilm'}=={'Fujifilm X-H2S'}
    assert not any('GFX' in r['body'] or 'GF500' in r['lens'] for r in rows)
    assert not any('2.0' in r['teleconverter'] or '2×' in r['teleconverter'] for r in rows)
    assert not any('rumor' in r['system_id'] for r in rows)
    for r in rows:
        for c in ('equiv_focal_length_mm','equiv_f_stop','system_weight_g','system_price_chf'):
            v=float(r[c]); assert math.isfinite(v) and v>0, (r['system_id'],c,v)

    _,comps=read_many(COMPONENT_FILES)
    cids={r['component_id'] for r in comps}; assert len(cids)==len(comps), 'Duplicate component_id'
    comp_price={r['component_id']:float(r['price_chf']) for r in comps}
    used_lens_ids={lens_component_id(r) for r in rows}; assert None not in used_lens_ids
    assert not any(cid.startswith(('body-gfx','lens-gf','tc-gf','tc-sony20')) for cid in cids)
    for r in rows:
        parts=r['price_component_ids'].split('|')
        for cid in parts:
            assert cid in cids, f'Unknown component {cid} in {r["system_id"]}'
        expected_price=sum(comp_price[cid] for cid in parts)
        assert abs(expected_price-float(r['system_price_chf']))<0.02, f'Price component sum mismatch for {r["system_id"]}: {expected_price} vs {r["system_price_chf"]}'

    _,specs=read_many(SPEC_FILES); sids={r['component_id'] for r in specs}
    assert {'lens-fe400f45','lens-fe600f63','tc-sony14','lens-om150400','lens-om150600','lens-xf400f45','lens-z100400','lens-panaleica100400ii','lens-panaleica50200','lens-panaleica200','tc-pana14','lens-sigma150600-e'}<=sids
    assert 'tc-sony20' not in sids

    _,compat=read_many(COMPAT_FILES)
    compat_ids=[r['lens_component_id'] for r in compat]
    assert len(set(compat_ids))==len(compat_ids), 'Duplicate compatibility lens id'
    assert set(compat_ids)==used_lens_ids, f'Compatibility audit mismatch: missing={used_lens_ids-set(compat_ids)}, extra={set(compat_ids)-used_lens_ids}'
    compat_by_id={r['lens_component_id']:r for r in compat}
    known_no_tc={'lens-sigma500','lens-tamron150500-x','lens-tamron150500-z','lens-tamron150500-e','lens-sigma150600-e'}
    for lens_id in known_no_tc:
        assert compat_by_id[lens_id]['compatible_1_4x']=='no', lens_id
    for lens_id in {'lens-panaleica100400ii','lens-panaleica50200','lens-panaleica200'}:
        assert compat_by_id[lens_id]['compatible_1_4x']=='yes', lens_id

    expected_total=0
    expected_by_lens={}
    for lens_id in sorted(used_lens_ids):
        matching=[r for r in rows if lens_component_id(r)==lens_id]
        audit=compat_by_id[lens_id]
        if lens_id in BUILTIN_TC_LENSES:
            expected=4
            assert len(matching)==expected, f'{lens_id}: expected four built-in/external TC states, got {len(matching)}'
            native=[r for r in matching if external_tc_component_id(r) is None]
            external=[r for r in matching if external_tc_component_id(r) is not None]
            assert len(native)==2 and len(external)==2
            assert any(builtin_disengaged(r) for r in native) and any(builtin_engaged(r) for r in native)
            assert any(builtin_disengaged(r) for r in external) and any(builtin_engaged(r) for r in external)
        elif audit['compatible_1_4x']=='yes':
            expected=2
            assert len(matching)==expected, f'{lens_id}: expected native + 1.4x, got {len(matching)} records'
            tc_id=audit['teleconverter_component_id']; assert tc_id
            assert sum(external_tc_component_id(r) is None for r in matching)==1
            assert sum(external_tc_component_id(r)==tc_id for r in matching)==1
        else:
            expected=1
            assert len(matching)==expected, f'{lens_id}: unsupported TC lens should have one native record'
            assert external_tc_component_id(matching[0]) is None
        expected_by_lens[lens_id]=expected
        expected_total+=expected
    assert len(rows)==expected_total, f'Derived {expected_total} kit states but found {len(rows)}'

    _,coverage=read_many(COVERAGE_FILES)
    coverage_ids=[r['lens_component_id'] for r in coverage]
    assert len(set(coverage_ids))==len(coverage_ids), 'Duplicate coverage lens id'
    assert set(coverage_ids)==used_lens_ids
    actual_counts={lens_id:sum(lens_component_id(r)==lens_id for r in rows) for lens_id in used_lens_ids}
    for r in coverage:
        lens_id=r['lens_component_id']
        assert r['status']=='complete'
        assert int(r['expected_records'])==expected_by_lens[lens_id], f'Coverage expected count stale for {lens_id}'
        assert int(r['actual_records'])==actual_counts[lens_id], f'Coverage actual count stale for {lens_id}'
    assert sum(int(r['actual_records']) for r in coverage)==len(rows)

    html=HTML.read_text(encoding='utf-8'); js=JS.read_text(encoding='utf-8'); css=CSS.read_text(encoding='utf-8'); uxcss=UXCSS.read_text(encoding='utf-8'); runtime=RUNTIME.read_text(encoding='utf-8')
    workflow=WORKFLOW.read_text(encoding='utf-8'); update_rules=UPDATE_RULES.read_text(encoding='utf-8')
    assert UI_AUDIT.is_file()

    for marker in [
        'id="minReach" class="range-thumb range-thumb-min" type="range"',
        'id="maxReach" class="range-thumb range-thumb-max" type="range"',
        'id="reachFill"','id="maxWeight"','name="lensType"','name="paretoMode"',
        'id="brandFilter"','id="colorMode"','id="planeToggle"','id="sizePriceToggle"',
        'id="recalcResidualToggle"','id="plot"','id="rankTable"','id="shortlistStatus"'
    ]:
        assert marker in html, marker

    assert 'statusFilter' not in html and 'Highlight similar kits' not in html
    assert 'id="infoPopover"' in html and 'id="infoButton"' in html and 'id="infoClose"' in html
    assert 'DPReview: What is equivalence?' in html and 'https://buymeacoffee.com/lkzk' in html
    assert 'interaction-fixes.css?v=20260919b' in html and 'runtime-wrapper.js?v=20260919a' in html
    assert 'id="planeToggle" type="checkbox" disabled' in html
    assert 'id="recalcResidualToggle" type="checkbox" disabled' in html
    assert 'Choose an efficiency residual color mode' in html
    assert 'wheel to zoom' not in html

    # Task-oriented information architecture.
    assert '<title>Telephotos Side-by-Side</title>' in html
    assert '<h1>Telephotos Side-by-Side</h1>' in html
    assert 'Visualise lens tradeoffs between various camera + telephoto kits for birding and wildlife' in html
    assert 'aria-controls="controlsBody"' in html and 'id="controlsBody" hidden' in html
    assert html.count('class="panel-toggle shared-controls-toggle"')==1
    assert 'Filters &amp; display' in html
    assert 'Define which kits are active.' in html
    assert 'Change encoding without changing the candidate set.' in html
    assert '>Reset filters</button>' in html and '>Reset selection</button>' in html
    assert 'data-view="three-d"' in html
    assert 'data-view="reach-aperture"' in html and 'data-view="reach-weight"' in html and 'data-view="aperture-weight"' in html
    assert 'id="colorLegend" class="inline-legend is-empty"' in html
    assert 'legend-placeholder' in html and 'No color encoding' in html
    assert 'Camera kit plot' in html and 'chartgrid' not in html
    assert html.index('id="plot"') < html.index('id="detail"')
    assert all(x in html for x in ['id="reachHelp"','id="paretoHelp"','id="residualHelp"','id="planeHelp"'])
    assert all(x in html for x in ['Scenario 1','Scenario 2','Scenario 3','Scenario 4'])
    assert 'Equivalent aperture residual' in html
    assert 'Reach × equivalent aperture' in html and 'Equivalent aperture × weight' in html
    assert '>Aperture residual<' not in html and '>Eq. f<' not in html and '>Eq. f-stop<' not in html

    for marker in ['data-filtered-i','activeSet','computeFrontier','colorFor','axis-reach','axis-aperture','axis-weight','pointRadius','brandAll','reachResidual']:
        assert marker in js or marker in css, marker

    # Canonical core still contains zoom; runtime removes it before evaluation.
    assert 'zoom=1,pointer=null' in js and 'sc=220*zoom' in js and "addEventListener('wheel'" in js
    for marker in [
        'supplemental kit data','systems_additions.csv','recalcResidualToggle',
        'return 4.5+12.5*Math.sqrt(q);','hover label dedupe','setInfoOpen',
        'teleconverter filter state','teleconverter pass','teleconverter reset','teleconverter listeners',
        'remove chart zoom state','fixed chart scale','hover capability','mobile clear selection',
        'mobile pointer interaction','hitTestPoint','setPointerCapture','residualModeNote',
        'filtered selection reset copy','popup equivalent aperture label','colorLegend','panel-toggle','mini-help',
        'preset orientations','weight slider fill','active first table sorting'
    ]:
        assert marker in runtime, marker
    assert 'External 1.4× teleconverter' in runtime
    assert '<input id="tcNo" type="checkbox" checked> No 1.4× TC' in runtime
    assert '<input id="tcYes" type="checkbox"> 1.4× TC' in runtime
    assert "builtInOnly=s.tc==='TC disengaged'||/^built-in/i.test(s.tc)" in runtime
    assert "builtInOnly||(externalTc?f.tcYes:f.tcNo)" in runtime
    assert "hovered=null;popup.hidden=true" in runtime
    assert "residualMode=cs.kind==='res'" in runtime and "recalc.disabled=!residualMode" in runtime and "plane.disabled=!residualMode" in runtime
    assert "colorLegend.classList.toggle('is-empty',cs.mode==='neutral')" in runtime
    assert "v==='aperture-weight'){yaw=-Math.PI/2" in runtime
    assert "activeView='three-d'" in runtime
    assert "Shortlist is limited to four kits." in js
    assert "status.textContent=`${shortlist.length} / 4 shortlisted`" in js
    assert 'shortNo=isShort?shortlist.indexOf(i)+1:0' in js
    assert 'compare-kit-head' in js and 'compare-metric-head' in js
    assert 'const aa=activeSet.has(ia),ab=activeSet.has(ib)' in runtime
    assert "w.style.setProperty('--range-pct'" in runtime
    assert 'equivalent aperture f/${s.fstop}' in runtime

    assert '--info-popover-bg:#f8fafc' in uxcss and '--info-popover-bg:#24282e' in uxcss
    assert '.control-drawer{' in uxcss and '.shared-controls-toggle{' in uxcss
    assert '.weight-slider::-webkit-slider-runnable-track' in uxcss and '--range-pct' in uxcss
    assert '.inline-legend.is-empty .legend-content' in uxcss
    assert '.color-control{display:grid;grid-template-columns:minmax(0,1fr)' in uxcss
    assert '.legend-placeholder,.legend-content{grid-area:1 / 1' in uxcss
    assert '.inline-legend .hint{max-width:68ch' in uxcss
    assert '.plot-presets{' in uxcss and '.plot-key{' in uxcss
    assert '.compare-matrix{' in uxcss and '.compare-kit-head{' in uxcss
    assert '0 / 4 shortlisted' in html and '2–4 finalists' in html
    assert '#rankTable thead th{position:sticky' in uxcss
    assert ':has(+ #tcFilter)' not in uxcss
    assert '.check-control:has(input:disabled)' in uxcss
    assert 'type="number"' not in html and 'Highlight frontier' not in html

    # OM/MFT price audit: coherent Swiss price basis for this branch.
    assert comp_price['body-om1ii']==1748.00
    assert comp_price['lens-om100400ii']==1278.00
    assert comp_price['lens-om300f4']==2388.00
    assert comp_price['lens-om150400']==6449.00
    assert comp_price['lens-om150600']==2138.00
    assert comp_price['tc-om-mc14']==449.00
    assert comp_price['lens-panaleica100400ii']==1345.00
    assert comp_price['lens-panaleica50200']==1339.00
    assert comp_price['lens-panaleica200']==2545.00
    assert next(r for r in rows if r['system_id']=='om1ii-100400-400')['system_price_chf']=='3026'
    assert next(r for r in rows if r['system_id']=='om1ii-300f4-14x')['system_price_chf']=='4585'
    assert next(r for r in rows if r['system_id']=='om1ii-150400-400')['system_price_chf']=='8197'
    assert next(r for r in rows if r['system_id']=='om1ii-150600-600-14x')['system_price_chf']=='4335'
    assert next(r for r in rows if r['system_id']=='om1ii-panaleica50200-200')['system_price_chf']=='3087'

    # Deployment logic must never validate a rapidly superseded partial main state.
    assert 'cancel-in-progress: true' in workflow
    assert 'Coalesce rapid main updates' in workflow
    assert 'Check this is still the latest main commit' in workflow
    assert "if: steps.latest.outputs.deploy == 'true'" in workflow
    assert 'Superseded by $latest; validation and deployment are intentionally skipped.' in workflow
    assert 'non-deploy working branch' in update_rules and 'Do **not** publish partially updated data files to `main` one at a time.' in update_rules
    assert 'hard-code the current total number of kits or lenses' in update_rules

    assert {'om1ii-150400-700-builtin-14x','z8-400f28tc-engaged-14x','z8-600f4tc-engaged-14x'}<=ids
    assert {'om1ii-panaleica100400ii-400','om1ii-panaleica50200-200','om1ii-panaleica200f28','a1ii-sigma150600-600'}<=ids
    assert next(r for r in rows if r['system_id']=='xh2s-150600-600')['equiv_focal_length_mm']=='900'
    assert next(r for r in rows if r['system_id']=='xh2s-xf500f56')['equiv_focal_length_mm']=='750'
    assert all(' — ' in r['list_name'] and r['list_name'].startswith(r['brand']+' — ') for r in rows)
    print(f'Smoke validation passed: {len(rows)} kits, {len(used_lens_ids)} lenses, {len(compat)} compatibility rows; counts derived structurally.')

if __name__=='__main__': main()
