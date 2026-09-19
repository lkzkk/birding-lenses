(async()=>{
  const r=await fetch('app.js?v=20260919a',{cache:'no-store'});
  if(!r.ok) throw new Error(`App core load failed: HTTP ${r.status}`);
  let text=await r.text();
  const replace=(name,from,to)=>{
    if(!text.includes(from)) throw new Error(`Runtime patch failed: ${name}`);
    text=text.replace(from,to);
  };
  const replaceRe=(name,re,to)=>{
    if(!re.test(text)) throw new Error(`Runtime patch failed: ${name}`);
    text=text.replace(re,to);
  };

  const lensType=document.getElementById('lensType');
  if(lensType&&!document.getElementById('tcFilter')){
    lensType.closest('.filter-section')?.insertAdjacentHTML('beforeend',`<div class="control-head" style="margin-top:10px"><span>External 1.4× teleconverter</span></div><div class="choice-row" id="tcFilter"><label><input id="tcNo" type="checkbox" checked> No 1.4× TC</label><label><input id="tcYes" type="checkbox"> 1.4× TC</label></div>`);
  }

  replace('supplemental kit data',
    "  const r=await fetch('data/systems.csv',{cache:'no-store'});\n  if(!r.ok)throw Error(`HTTP ${r.status}`);\n  records=parseCSV(await r.text());",
    "  const [r,extra]=await Promise.all([fetch('data/systems.csv',{cache:'no-store'}),fetch('data/systems_additions.csv',{cache:'no-store'})]);\n  if(!r.ok)throw Error(`systems.csv HTTP ${r.status}`);\n  if(!extra.ok)throw Error(`systems_additions.csv HTTP ${extra.status}`);\n  records=[...parseCSV(await r.text()),...parseCSV(await extra.text())];");

  replace('teleconverter filter state',
    "return{min:+$('minReach').value,max:+$('maxReach').value,maxW:+$('maxWeight').value,lens:radioValue('lensType'),brands:new Set(checked),pareto:radioValue('paretoMode')};",
    "return{min:+$('minReach').value,max:+$('maxReach').value,maxW:+$('maxWeight').value,lens:radioValue('lensType'),tcNo:$('tcNo')?.checked??true,tcYes:$('tcYes')?.checked??false,brands:new Set(checked),pareto:radioValue('paretoMode')};");
  replace('teleconverter pass',
    "return s.fl>=f.min&&s.fl<=f.max&&s.weight<=f.maxW&&f.brands.has(s.brand)&&\n    (f.lens==='all'||(f.lens==='zoom')===s.zoom);",
    "const builtInOnly=s.tc==='TC disengaged'||/^built-in/i.test(s.tc),externalTc=s.tc!=='none'&&!builtInOnly;return s.fl>=f.min&&s.fl<=f.max&&s.weight<=f.maxW&&f.brands.has(s.brand)&&\n    (f.lens==='all'||(f.lens==='zoom')===s.zoom)&&(builtInOnly||(externalTc?f.tcYes:f.tcNo));");
  replace('teleconverter reset',
    "setRadio('lensType','all');setRadio('paretoMode','all');refresh();",
    "setRadio('lensType','all');setRadio('paretoMode','all');$('tcNo').checked=true;$('tcYes').checked=false;refresh();");
  replace('teleconverter listeners',
    "document.querySelectorAll('input[name=\"lensType\"],input[name=\"paretoMode\"]').forEach(el=>el.addEventListener('change',refresh));",
    "document.querySelectorAll('input[name=\"lensType\"],input[name=\"paretoMode\"]').forEach(el=>el.addEventListener('change',refresh));document.querySelectorAll('#tcFilter input').forEach(el=>el.addEventListener('change',refresh));");

  replace('remove chart zoom state',
    "let selected=null,shortlist=[],hovered=null,sort={key:'seq',dir:1},yaw=-38*Math.PI/180,pitch=24*Math.PI/180,zoom=1,pointer=null,activeView='custom';",
    "let selected=null,shortlist=[],hovered=null,sort={key:'seq',dir:1},yaw=-38*Math.PI/180,pitch=24*Math.PI/180,pointer=null,activeView='three-d';");
  replace('fixed chart scale',
    "function project([x,y,z]){const cy=Math.cos(yaw),sy=Math.sin(yaw),x1=x*cy-z*sy,z1=x*sy+z*cy,cp=Math.cos(pitch),sp=Math.sin(pitch),y1=y*cp-z1*sp,z2=y*sp+z1*cp,sc=220*zoom;return[470+x1*sc,330-y1*sc,z2]}",
    "function project([x,y,z]){const cy=Math.cos(yaw),sy=Math.sin(yaw),x1=x*cy-z*sy,z1=x*sy+z*cy,cp=Math.cos(pitch),sp=Math.sin(pitch),y1=y*cp-z1*sp,z2=y*sp+z1*cp,sc=220;return[470+x1*sc,330-y1*sc,z2]}");
  replace('hover capability',
    "let baseIds=[],activeIds=[],baseSet=new Set(),activeSet=new Set(),frontier=new Set();",
    "let baseIds=[],activeIds=[],baseSet=new Set(),activeSet=new Set(),frontier=new Set();const hoverCapable=window.matchMedia?.('(hover: hover) and (pointer: fine)').matches??true;");
  replace('hover only on hover devices',
    "    if(active){\n      grp.addEventListener('mouseenter'",
    "    if(active&&hoverCapable){\n      grp.addEventListener('mouseenter'");
  replace('mobile clear selection',
    "function clearSelection(){selected=null;detail.innerHTML='<strong>Select a kit</strong><p class=\"hint\">Use “Compare” to add up to five kits to the shortlist.</p>';render();renderTable()}",
    "function clearSelection(){selected=null;hovered=null;popup.hidden=true;detail.innerHTML='<strong>Select a kit</strong><p class=\"hint\">Tap or click any active point to inspect the kit and add it to the shortlist.</p>';render();renderTable()}");
  replace('filtered selection reset copy',
    "if(selected!==null&&!activeSet.has(selected)){selected=null;detail.innerHTML='<strong>Select a kit</strong><p class=\"hint\">Use “Compare” to add up to five kits to the shortlist.</p>'}",
    "if(selected!==null&&!activeSet.has(selected)){selected=null;detail.innerHTML='<strong>Select a kit</strong><p class=\"hint\">Tap or click any active point to inspect the kit and add it to the shortlist.</p>'}");

  replace('mobile pointer interaction',
    "svg.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==undefined)return;const hit=e.target.closest?.('[data-i]');pointer={id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,drag:false,hit:hit?+hit.dataset.i:null}});\nsvg.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-pointer.sx,e.clientY-pointer.sy);if(!pointer.drag&&moved>5){pointer.drag=true;activeView='custom';try{svg.setPointerCapture(e.pointerId)}catch(_){}}if(!pointer.drag)return;const dx=e.clientX-pointer.lx,dy=e.clientY-pointer.ly;pointer.lx=e.clientX;pointer.ly=e.clientY;yaw+=dx*.01;pitch=Math.max(-1.48,Math.min(1.48,pitch+dy*.008));render()});\nsvg.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(!p.drag){if(Number.isInteger(p.hit)&&activeSet.has(p.hit))select(p.hit);else clearSelection()}});\nsvg.addEventListener('pointercancel',()=>pointer=null);svg.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.5,zoom*(e.deltaY>0?.94:1.06)));activeView='custom';render()},{passive:false});",
    "function hitTestPoint(e){const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return null;const sx=(e.clientX-rect.left)*940/rect.width,sy=(e.clientY-rect.top)*670/rect.height,px=rect.width/940,py=rect.height/670,limit=e.pointerType==='touch'?24:14;let best=null,bestDist=limit,bestDepth=-Infinity;for(const i of activeIds){const p=project(coords(S[i])),d=Math.hypot((p[0]-sx)*px,(p[1]-sy)*py);if(d<bestDist-.25||(Math.abs(d-bestDist)<=.25&&p[2]>bestDepth)){best=i;bestDist=d;bestDepth=p[2]}}return best}\nsvg.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(e.pointerType!=='mouse'){hovered=null;if(selected===null)popup.hidden=true}pointer={id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,drag:false,hit:hitTestPoint(e),threshold:e.pointerType==='touch'?9:5};try{svg.setPointerCapture(e.pointerId)}catch(_){}});\nsvg.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-pointer.sx,e.clientY-pointer.sy);if(!pointer.drag&&moved>pointer.threshold){pointer.drag=true;activeView='custom'}if(!pointer.drag)return;const dx=e.clientX-pointer.lx,dy=e.clientY-pointer.ly;pointer.lx=e.clientX;pointer.ly=e.clientY;yaw+=dx*.01;pitch=Math.max(-1.48,Math.min(1.48,pitch+dy*.008));render()});\nsvg.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;try{if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId)}catch(_){}if(!p.drag){if(Number.isInteger(p.hit)&&activeSet.has(p.hit))select(p.hit);else clearSelection()}});\nsvg.addEventListener('pointercancel',e=>{if(pointer?.id===e.pointerId)pointer=null});");

  replaceRe('residual scope',/function colorState\(ids\)\{[\s\S]*?\n\}\nfunction colorFor/,`function colorState(ids){
  const mode=$('colorMode').value;if(mode==='neutral')return{mode};
  const[kind,dep]=mode.split('-'),pred={fl:['fstop','weight'],fstop:['fl','weight'],weight:['fl','fstop']}[dep];
  const recalc=kind==='res'&&$('recalcResidualToggle')?.checked;
  const modelIds=recalc?ids:fullIds,model=fit(dep,pred[0],pred[1],modelIds);
  const valueIds=ids.length?ids:fullIds;
  let vals=valueIds.map(i=>kind==='abs'?S[i][dep]:S[i][dep]-expected(S[i],model));if(!vals.length)vals=[0];
  const lo=Math.min(...vals),hi=Math.max(...vals),maxabs=Math.max(Math.abs(lo),Math.abs(hi))||1;return{mode,kind,dep,model,lo,hi,maxabs,recalc};
}
function colorFor`);

  replace('residual control state',
    "const bar=$('legendBar');bar.className='legendbar '+(cs.mode==='neutral'?'neutral':'metric');",
    "const bar=$('legendBar'),colorLegend=$('colorLegend'),recalc=$('recalcResidualToggle'),plane=$('planeToggle'),residualNote=$('residualModeNote'),residualMode=cs.kind==='res';if(colorLegend)colorLegend.classList.toggle('is-empty',cs.mode==='neutral');bar.className='legendbar '+(cs.mode==='neutral'?'neutral':'metric');if(recalc){recalc.disabled=!residualMode;if(!residualMode)recalc.checked=false}if(plane)plane.disabled=!residualMode;if(residualNote)residualNote.hidden=residualMode;");
  replace('residual legend note',
    "$('legendNote').textContent=cs.kind==='abs'?`Green = ${better[cs.dep]}; red = less favorable. Filtered-out kits stay grey.`:`Green = ${better[cs.dep]} than predicted from the other two metrics. Filtered-out kits stay grey.`;",
    "$('legendNote').textContent=cs.kind==='abs'?`Green = ${better[cs.dep]}; red = less favorable. Filtered-out kits stay grey.`:`Green = ${better[cs.dep]} than predicted from the other two metrics. ${cs.recalc?'Regression uses only currently active filtered kits.':'Regression uses the full dataset.'} Filtered-out kits stay grey.`;");
  replace('equivalent aperture favorable wording',
    "const names={fl:'Reach',fstop:'Equivalent aperture',weight:'Kit weight'},better={fl:'longer',fstop:'faster / lower f-number',weight:'lighter'};",
    "const names={fl:'Reach',fstop:'Equivalent aperture',weight:'Kit weight'},better={fl:'longer',fstop:'lower equivalent aperture',weight:'lighter'};");
  replace('popup equivalent aperture label',
    "function showPopup(i,p){const s=S[i];popup.hidden=false;popup.style.left=`${p[0]/940*100}%`;popup.style.top=`${p[1]/670*100}%`;popup.dataset.side=p[0]>650?'left':'right';popup.innerHTML=`<strong>${s.name}</strong><span>${Math.round(s.fl)} mm eq · f/${s.fstop} eq · ${s.weight.toFixed(3)} kg${$('sizePriceToggle').checked?` · CHF ${Math.round(s.price).toLocaleString('de-CH')}`:''}</span>`}",
    "function showPopup(i,p){const s=S[i];popup.hidden=false;popup.style.left=`${p[0]/940*100}%`;popup.style.top=`${p[1]/670*100}%`;popup.dataset.side=p[0]>650?'left':'right';popup.innerHTML=`<strong>${s.name}</strong><span>${Math.round(s.fl)} mm equivalent reach · equivalent aperture f/${s.fstop} · ${s.weight.toFixed(3)} kg${$('sizePriceToggle').checked?` · CHF ${Math.round(s.price).toLocaleString('de-CH')}`:''}</span>`}");
  replace('price point range','return 6+9*Math.sqrt(q);','return 4.5+12.5*Math.sqrt(q);');
  replace('hover label dedupe',
    "tx(p[0]+10,p[1]-9,pointLabel(s),{'font-size':'10','font-weight':'650','data-hover-label':'1'},svg)",
    "if(!isSel&&!isShort)tx(p[0]+10,p[1]-9,pointLabel(s),{'font-size':'10','font-weight':'650','data-hover-label':'1'},svg)");
  replace('color mode orientation',
    "$('colorMode').addEventListener('change',()=>{refresh();if($('planeToggle').checked){orientPlaneEdgeOn(colorState(activeIds));render()}});",
    "$('colorMode').addEventListener('change',refresh);");
  replace('plane orientation',
    "$('planeToggle').addEventListener('change',()=>{if($('planeToggle').checked)orientPlaneEdgeOn(colorState(activeIds));render()});",
    "$('planeToggle').addEventListener('change',render);");
  replace('residual toggle listener',
    "brandFilter.addEventListener('change',e=>",
    "$('recalcResidualToggle')?.addEventListener('change',refresh);brandFilter.addEventListener('change',e=>");

  replace('preset orientations',
    "function useView(v){activeView=v;if(v==='reach-aperture'){yaw=0;pitch=0}else if(v==='reach-weight'){yaw=0;pitch=-Math.PI/2}else if(v==='aperture-weight'){yaw=Math.PI/2;pitch=0}render()}",
    "function useView(v){activeView=v;if(v==='three-d'){yaw=-38*Math.PI/180;pitch=24*Math.PI/180}else if(v==='reach-aperture'){yaw=0;pitch=0}else if(v==='reach-weight'){yaw=0;pitch=-Math.PI/2}else if(v==='aperture-weight'){yaw=-Math.PI/2;pitch=0}render()}");

  replace('weight slider fill',
    "$('reachFill').style.left=`${left}%`;$('reachFill').style.right=`${right}%`;lo.style.zIndex=min>max-60?'5':'3';hi.style.zIndex='4';",
    "$('reachFill').style.left=`${left}%`;$('reachFill').style.right=`${right}%`;const w=$('maxWeight'),wSpan=(+w.max-+w.min)||1,wPct=((+w.value-+w.min)/wSpan*100);w.style.setProperty('--range-pct',`${wPct}%`);lo.style.zIndex=min>max-60?'5':'3';hi.style.zIndex='4';");

  replace('active first table sorting',
    "const ids=S.map(s=>s.i),key=sort.key,dir=sort.dir;ids.sort((ia,ib)=>{const a=S[ia],b=S[ib];let va=key==='name'?a.name:key==='pareto'?(frontier.has(ia)?1:0):a[key],vb=key==='name'?b.name:key==='pareto'?(frontier.has(ib)?1:0):b[key];return(typeof va==='string'?va.localeCompare(vb):va-vb)*dir});return ids;",
    "const ids=S.map(s=>s.i),key=sort.key,dir=sort.dir;ids.sort((ia,ib)=>{const aa=activeSet.has(ia),ab=activeSet.has(ib);if(aa!==ab)return aa?-1:1;const a=S[ia],b=S[ib];let va=key==='name'?a.name:key==='pareto'?(frontier.has(ia)?1:0):a[key],vb=key==='name'?b.name:key==='pareto'?(frontier.has(ib)?1:0):b[key];return(typeof va==='string'?va.localeCompare(vb):va-vb)*dir});return ids;");


  await (0,eval)(`${text}\n//# sourceURL=app-core.js`);

  const controlDrawer=document.querySelector('.control-drawer');
  const controlsToggle=controlDrawer?.querySelector('.panel-toggle[aria-controls]');
  const controlsBody=controlsToggle?document.getElementById(controlsToggle.getAttribute('aria-controls')):null;
  const setControlsOpen=open=>{
    if(!controlsToggle||!controlsBody)return;
    controlsToggle.setAttribute('aria-expanded',String(open));
    controlsBody.hidden=!open;
    controlDrawer?.classList.toggle('is-open',open);
  };
  controlsToggle?.addEventListener('click',()=>setControlsOpen(controlsToggle.getAttribute('aria-expanded')!=='true'));

  const infoHelp=document.getElementById('infoHelp');
  const infoButton=document.getElementById('infoButton');
  const infoPopover=document.getElementById('infoPopover');
  const infoClose=document.getElementById('infoClose');
  const setInfoOpen=open=>{
    if(!infoHelp||!infoButton||!infoPopover)return;
    infoHelp.classList.toggle('is-open',open);
    infoButton.setAttribute('aria-expanded',String(open));
    infoPopover.setAttribute('aria-hidden',String(!open));
  };

  const miniHelps=[...document.querySelectorAll('.mini-help')];
  const setMiniOpen=(help,open)=>{
    if(!help)return;
    const button=help.querySelector('.mini-info-button'),popover=help.querySelector('.mini-popover');
    help.classList.toggle('is-open',open);
    button?.setAttribute('aria-expanded',String(open));
    popover?.setAttribute('aria-hidden',String(!open));
  };
  const closeMiniHelps=except=>miniHelps.forEach(help=>{if(help!==except)setMiniOpen(help,false)});

  infoButton?.addEventListener('click',e=>{
    e.stopPropagation();
    closeMiniHelps();
    setInfoOpen(!infoHelp.classList.contains('is-open'));
  });
  infoClose?.addEventListener('click',e=>{
    e.stopPropagation();
    setInfoOpen(false);
    infoButton?.focus();
  });
  miniHelps.forEach(help=>{
    const button=help.querySelector('.mini-info-button');
    button?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const open=!help.classList.contains('is-open');
      setInfoOpen(false);closeMiniHelps(help);setMiniOpen(help,open);
    });
  });
  document.addEventListener('pointerdown',e=>{
    if(controlDrawer?.classList.contains('is-open')&&!controlDrawer.contains(e.target))setControlsOpen(false);
    if(infoHelp?.classList.contains('is-open')&&!infoHelp.contains(e.target))setInfoOpen(false);
    miniHelps.forEach(help=>{if(help.classList.contains('is-open')&&!help.contains(e.target))setMiniOpen(help,false)});
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    setControlsOpen(false);setInfoOpen(false);closeMiniHelps();
  });
})().catch(err=>{
  console.error(err);
  const detail=document.getElementById('detail');
  if(detail) detail.innerHTML='<strong>App load failed</strong><p class="hint">Please reload the page.</p>';
});
