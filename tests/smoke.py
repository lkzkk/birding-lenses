#!/usr/bin/env python3
from __future__ import annotations
import csv, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SYSTEMS=ROOT/'data'/'systems.csv'; COMPONENTS=ROOT/'data'/'component_prices.csv'; HTML=ROOT/'index.html'; JS=ROOT/'app.js'; CSS=ROOT/'styles.css'
SYS_REQUIRED={'system_id','brand','list_name','display_name','body','lens','teleconverter','actual_focal_length_mm','actual_f_stop','equiv_focal_length_mm','equiv_f_stop','system_weight_g','system_price_chf','price_checked_date'}
SYS_NUM={'actual_focal_length_mm','actual_f_stop','equiv_focal_length_mm','equiv_f_stop','system_weight_g','system_price_chf'}
COMP_REQUIRED={'component_id','component_name','price_chf','notes'}
HTML_MARKERS=['id="zMetric"','id="colorDimension"','id="colorMode"','id="planeToggle"','id="idToggle"','id="clearSelection"','id="plot"','id="systemList"','data-view="reach-aperture"','data-view="reach-z"','data-view="aperture-z"','app.js','styles.css']
JS_MARKERS=['Efficiency residual','data/systems.csv','pointIndex','clearSelection()','sizeMetric()']
def rows(path):
    assert path.is_file(),f'Missing {path.relative_to(ROOT)}'
    with path.open(newline='',encoding='utf-8') as f:
        r=csv.DictReader(f); return r.fieldnames or [],list(r)
def main():
    fields,data=rows(SYSTEMS);assert SYS_REQUIRED<=set(fields),f'Missing systems columns: {sorted(SYS_REQUIRED-set(fields))}';assert len(data)==31,f'Expected 31 systems, got {len(data)}';ids=[r['system_id'] for r in data];assert len(ids)==len(set(ids))
    for n,r in enumerate(data,2):
        for c in SYS_REQUIRED: assert r[c].strip(),f'Blank {c} row {n}'
        for c in SYS_NUM:
            v=float(r[c]);assert math.isfinite(v) and v>0,f'Invalid {c} row {n}'
    cfields,comps=rows(COMPONENTS);assert COMP_REQUIRED<=set(cfields);assert len(comps)>=30;assert ('source' in cfields or 'source_name' in cfields);assert ('price_checked_date' in cfields or 'checked_date' in cfields)
    html=HTML.read_text(encoding='utf-8');js=JS.read_text(encoding='utf-8');assert CSS.is_file()
    for m in HTML_MARKERS: assert m in html,f'Missing HTML marker: {m}'
    for m in JS_MARKERS: assert m in js,f'Missing JS marker: {m}'
    for forbidden in ['id="comparisonMode"','id="axisX"','id="axisY"','type="range"']: assert forbidden not in html,f'Obsolete control: {forbidden}'
    print(f'Smoke validation passed: {len(data)} systems, {len(comps)} component prices.')
if __name__=='__main__': main()
