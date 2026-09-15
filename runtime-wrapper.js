(async()=>{
  const r=await fetch('app.js?v=20260916a',{cache:'no-store'});
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
    "const bar=$('legendBar'),recalc=$('recalcResidualToggle');bar.className='legendbar '+(cs.mode==='neutral'?'neutral':'metric');if(recalc)recalc.disabled=cs.mode==='neutral'||cs.kind!=='res';");
  replace('residual legend note',
    "$('legendNote').textContent=cs.kind==='abs'?`Green = ${better[cs.dep]}; red = less favorable. Filtered-out kits stay grey.`:`Green = ${better[cs.dep]} than predicted from the other two metrics. Filtered-out kits stay grey.`;",
    "$('legendNote').textContent=cs.kind==='abs'?`Green = ${better[cs.dep]}; red = less favorable. Filtered-out kits stay grey.`:`Green = ${better[cs.dep]} than predicted from the other two metrics. ${cs.recalc?'Regression uses only currently active filtered kits.':'Regression uses the full dataset.'} Filtered-out kits stay grey.`;");
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

  await (0,eval)(`${text}\n//# sourceURL=app-core.js`);

  const infoHelp=document.getElementById('infoHelp');
  const infoButton=document.getElementById('infoButton');
  const infoPopover=document.getElementById('infoPopover');
  const setInfoOpen=open=>{
    if(!infoHelp||!infoButton||!infoPopover)return;
    infoHelp.classList.toggle('is-open',open);
    infoButton.setAttribute('aria-expanded',String(open));
    infoPopover.setAttribute('aria-hidden',String(!open));
  };
  infoButton?.addEventListener('click',e=>{
    e.stopPropagation();
    setInfoOpen(!infoHelp.classList.contains('is-open'));
  });
  document.addEventListener('pointerdown',e=>{
    if(infoHelp?.classList.contains('is-open')&&!infoHelp.contains(e.target))setInfoOpen(false);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setInfoOpen(false)});
})().catch(err=>{
  console.error(err);
  const detail=document.getElementById('detail');
  if(detail) detail.innerHTML='<strong>App load failed</strong><p class="hint">Please reload the page.</p>';
});
