(async()=>{
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const svg=$('plot'),detail=$('detail'),popup=$('pointPopup'),brandFilter=$('brandFilter');

function parseCSV(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}
    else{if(ch==='"')q=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=ch}
  }
  if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}
  const h=rows.shift();
  return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])));
}

let records;
try{
  const r=await fetch('data/systems.csv',{cache:'no-store'});
  if(!r.ok)throw Error(`HTTP ${r.status}`);
  records=parseCSV(await r.text());
}catch(e){
  detail.innerHTML='<strong>Data load failed</strong><p class="hint">Could not read <code>data/systems.csv</code>.</p>';
  console.error(e);return;
}

const S=records.map((r,i)=>({
  i,id:r.system_id,brand:r.brand,name:r.list_name,displayName:r.display_name,body:r.body,lens:r.lens,tc:r.teleconverter,
  fl:+r.equiv_focal_length_mm,fstop:+r.equiv_f_stop,weight:+r.system_weight_g/1000,price:+r.system_price_chf,priceDate:r.price_checked_date||'',priceBasis:r.price_basis||'',
  actualFl:+r.actual_focal_length_mm,actualF:+r.actual_f_stop,
  zoom:/\d+\s*[-–]\s*\d+/.test(r.lens)
}));
const brands=[...new Set(S.map(s=>s.brand))].sort();
const ranges={
  fl:[Math.min(...S.map(s=>s.fl)),Math.max(...S.map(s=>s.fl))],
  fstop:[Math.min(...S.map(s=>s.fstop)),Math.max(...S.map(s=>s.fstop))],
  weight:[Math.min(...S.map(s=>s.weight)),Math.max(...S.map(s=>s.weight))],
  price:[Math.min(...S.map(s=>s.price)),Math.max(...S.map(s=>s.price))]
};
const flMin=Math.floor(ranges.fl[0]/10)*10,flMax=Math.ceil(ranges.fl[1]/10)*10,wMax=Math.ceil(ranges.weight[1]*20)/20;
$('minReach').min=$('maxReach').min=flMin;$('minReach').max=$('maxReach').max=flMax;
$('maxWeight').min=Math.floor(ranges.weight[0]*20)/20;$('maxWeight').max=wMax;
const allBrandsLabel=document.createElement('label');allBrandsLabel.className='brand-all';allBrandsLabel.innerHTML='<input id="brandAll" type="checkbox" checked> Select all';brandFilter.appendChild(allBrandsLabel);brands.forEach(b=>{const l=document.createElement('label');l.innerHTML=`<input type="checkbox" data-brand="1" value="${b}" checked> ${b}`;brandFilter.appendChild(l)});

let selected=null,shortlist=[],hovered=null,sort={key:'seq',dir:1},yaw=-38*Math.PI/180,pitch=24*Math.PI/180,zoom=1,pointer=null,activeView='custom';
let baseIds=[],activeIds=[],baseSet=new Set(),activeSet=new Set(),frontier=new Set();

const mk=(tag,a={},p=svg)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(a))e.setAttribute(k,v);p.appendChild(e);return e};
const tx=(x,y,t,a={},p=svg)=>{const e=mk('text',{x,y,fill:'var(--text)','font-size':'10',...a},p);e.textContent=t;return e};
const nrm=(v,d)=>(v-ranges[d][0])/(ranges[d][1]-ranges[d][0])*2-1;
function project([x,y,z]){const cy=Math.cos(yaw),sy=Math.sin(yaw),x1=x*cy-z*sy,z1=x*sy+z*cy,cp=Math.cos(pitch),sp=Math.sin(pitch),y1=y*cp-z1*sp,z2=y*sp+z1*cp,sc=220*zoom;return[470+x1*sc,330-y1*sc,z2]}
function coords(s){return[nrm(s.fl,'fl'),nrm(s.fstop,'fstop'),nrm(s.weight,'weight')]}

function radioValue(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||'all'}
function setRadio(name,value){const el=document.querySelector(`input[name="${name}"][value="${value}"]`);if(el)el.checked=true}
function getFilters(){
  const checked=[...brandFilter.querySelectorAll('input[data-brand]:checked')].map(x=>x.value);
  return{min:+$('minReach').value,max:+$('maxReach').value,maxW:+$('maxWeight').value,lens:radioValue('lensType'),brands:new Set(checked),pareto:radioValue('paretoMode')};
}
function passesNonPareto(s,f){
  return s.fl>=f.min&&s.fl<=f.max&&s.weight<=f.maxW&&f.brands.has(s.brand)&&
    (f.lens==='all'||(f.lens==='zoom')===s.zoom);
}
function dominates(a,b){return a.fl>=b.fl&&a.fstop<=b.fstop&&a.weight<=b.weight&&(a.fl>b.fl||a.fstop<b.fstop||a.weight<b.weight)}
function computeFrontier(ids){const out=new Set();for(const i of ids){let dominated=false;for(const j of ids){if(i!==j&&dominates(S[j],S[i])){dominated=true;break}}if(!dominated)out.add(i)}return out}
function rebuildFilters(){
  const f=getFilters();
  baseIds=S.filter(s=>passesNonPareto(s,f)).map(s=>s.i);baseSet=new Set(baseIds);frontier=computeFrontier(baseIds);
  activeIds=f.pareto==='only'?baseIds.filter(i=>frontier.has(i)):[...baseIds];activeSet=new Set(activeIds);
}

function solve3(A,b){const m=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<3;c++){let p=c;for(let r=c+1;r<3;r++)if(Math.abs(m[r][c])>Math.abs(m[p][c]))p=r;[m[c],m[p]]=[m[p],m[c]];const q=m[c][c];if(Math.abs(q)<1e-12)return[0,0,0];for(let j=c;j<4;j++)m[c][j]/=q;for(let r=0;r<3;r++)if(r!==c){const f=m[r][c];for(let j=c;j<4;j++)m[r][j]-=f*m[c][j]}}return m.map(r=>r[3])}
function fit(dep,p1,p2,ids){let n=0,s1=0,s2=0,sd=0,s11=0,s22=0,s12=0,s1d=0,s2d=0;for(const i of ids){const s=S[i],x=s[p1],y=s[p2],d=s[dep];n++;s1+=x;s2+=y;sd+=d;s11+=x*x;s22+=y*y;s12+=x*y;s1d+=x*d;s2d+=y*d}if(n<3)return{dep,p1,p2,a:0,b:0,c:0};const[a,b,c]=solve3([[n,s1,s2],[s1,s11,s12],[s2,s12,s22]],[sd,s1d,s2d]);return{dep,p1,p2,a,b,c}}
function expected(s,m){return m.a+m.b*s[m.p1]+m.c*s[m.p2]}
const fullIds=S.map(s=>s.i),fullReachModel=fit('fl','fstop','weight',fullIds);
for(const s of S)s.reachResidual=s.fl-expected(s,fullReachModel);
[...S].sort((a,b)=>a.brand.localeCompare(b.brand)||b.reachResidual-a.reachResidual||b.fl-a.fl||a.name.localeCompare(b.name)).forEach((s,idx)=>s.seq=idx+1);
function colorState(ids){
  const mode=$('colorMode').value;if(mode==='neutral')return{mode};
  const[kind,dep]=mode.split('-'),pred={fl:['fstop','weight'],fstop:['fl','weight'],weight:['fl','fstop']}[dep];
  const base=ids.length?ids:S.map(s=>s.i),model=fit(dep,pred[0],pred[1],base);
  let vals=base.map(i=>kind==='abs'?S[i][dep]:S[i][dep]-expected(S[i],model));if(!vals.length)vals=[0];
  const lo=Math.min(...vals),hi=Math.max(...vals),maxabs=Math.max(Math.abs(lo),Math.abs(hi))||1;return{mode,kind,dep,model,lo,hi,maxabs};
}
function colorFor(s,cs){
  if(cs.mode==='neutral')return'var(--neutral)';let score;
  if(cs.kind==='abs'){const q=(s[cs.dep]-cs.lo)/((cs.hi-cs.lo)||1);score=cs.dep==='fl'?q:1-q}
  else{const rv=s[cs.dep]-expected(s,cs.model),q=(rv+cs.maxabs)/(2*cs.maxabs);score=cs.dep==='fl'?q:1-q}
  score=Math.max(0,Math.min(1,score));return`hsl(${score*120} 72% 43%)`;
}
function updateLegend(cs){
  const bar=$('legendBar');bar.className='legendbar '+(cs.mode==='neutral'?'neutral':'metric');
  if(cs.mode==='neutral'){$('legendTitle').textContent='Neutral color';$('scale').innerHTML='';$('legendNote').textContent='Active kits use one neutral color. Every filtered-out kit is faint grey.';$('planeToggle').disabled=true;$('planeToggle').checked=false;return}
  const names={fl:'Reach',fstop:'Equivalent aperture',weight:'Kit weight'},better={fl:'longer',fstop:'faster / lower f-number',weight:'lighter'};
  $('legendTitle').textContent=`${names[cs.dep]} — ${cs.kind==='abs'?'absolute':'efficiency residual'}`;
  $('legendNote').textContent=cs.kind==='abs'?`Green = ${better[cs.dep]}; red = less favorable. Filtered-out kits stay grey.`:`Green = ${better[cs.dep]} than predicted from the other two metrics. Filtered-out kits stay grey.`;
  $('planeToggle').disabled=cs.kind!=='res';if(cs.kind!=='res')$('planeToggle').checked=false;
  if(cs.kind==='abs'){const good=cs.dep==='fl'?cs.hi:cs.lo,bad=cs.dep==='fl'?cs.lo:cs.hi,mid=(cs.lo+cs.hi)/2;const f=v=>cs.dep==='fl'?`${Math.round(v)} mm`:cs.dep==='weight'?`${v.toFixed(2)} kg`:`f/${v.toFixed(2)}`;$('scale').innerHTML=`<span>${f(good)}</span><span>${f(mid)}</span><span>${f(bad)}</span>`}
  else $('scale').innerHTML='<span>better</span><span>expected</span><span>worse</span>';
}

function axisTitle(g,a,b,label,cls){const A=project(a),B=project(b),len=Math.hypot(B[0]-A[0],B[1]-A[1]);if(len<55)return;const vx=B[0]-470,vy=B[1]-330,vl=Math.hypot(vx,vy)||1,rawX=B[0]+vx/vl*18,rawY=B[1]+vy/vl*18,x=Math.max(55,Math.min(885,rawX)),y=Math.max(28,Math.min(642,rawY)),anchor=x<180?'start':x>760?'end':'middle';tx(x,y,label,{'class':`axis-svg-label ${cls}`,'text-anchor':anchor},g)}
function drawSegment(g,a,b,attrs){const A=project(a),B=project(b);mk('line',{x1:A[0],y1:A[1],x2:B[0],y2:B[1],...attrs},g)}
function drawAxes(g){
  const c=[[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]],E=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  for(const[a,b]of E)drawSegment(g,c[a],c[b],{stroke:'var(--grid)','stroke-width':'1.05'});
  for(const t of[-.5,0,.5])for(const[a,b]of [[[t,-1,-1],[t,1,-1]],[[-1,t,-1],[1,t,-1]],[[-1,-1,t],[-1,1,t]]])drawSegment(g,a,b,{stroke:'var(--grid)',opacity:'.18'});
  drawSegment(g,[-1,-1,-1],[1,-1,-1],{stroke:'var(--axis-reach)','stroke-width':'2.5'});
  drawSegment(g,[-1,-1,-1],[-1,1,-1],{stroke:'var(--axis-aperture)','stroke-width':'2.5'});
  drawSegment(g,[-1,-1,-1],[-1,-1,1],{stroke:'var(--axis-weight)','stroke-width':'2.5'});
  const axisVisible=(a,b)=>{const A=project(a),B=project(b);return Math.hypot(B[0]-A[0],B[1]-A[1])>=55},linearTicks=(d,n)=>Array.from({length:n},(_,i)=>ranges[d][0]+(ranges[d][1]-ranges[d][0])*i/(n-1));
  const showReach=axisVisible([-1,-1,-1],[1,-1,-1]),showAperture=axisVisible([-1,-1,-1],[-1,1,-1]),showWeight=axisVisible([-1,-1,-1],[-1,-1,1]);
  const reachStep=(ranges.fl[1]-ranges.fl[0])>350?100:50,reachTicks=[];
  for(let v=Math.ceil(ranges.fl[0]/reachStep)*reachStep;v<=Math.floor(ranges.fl[1]/reachStep)*reachStep;v+=reachStep)reachTicks.push(v);
  if(showReach)for(const v of reachTicks){const p=project([nrm(v,'fl'),-1,-1]);tx(p[0],p[1]+16,`${Math.round(v)}`,{'text-anchor':'middle',fill:'var(--axis-reach)'},g)}
  const standardFStops=[1,1.4,2,2.8,4,5.6,8,11,16,22,32].filter(v=>v>=ranges.fstop[0]&&v<=ranges.fstop[1]);
  if(showAperture)for(const v of standardFStops){const p=project([-1,nrm(v,'fstop'),-1]);tx(p[0]-8,p[1]+3,`f/${v}`,{'text-anchor':'end',fill:'var(--axis-aperture)'},g)}
  if(showWeight)for(const v of linearTicks('weight',5)){const p=project([-1,-1,nrm(v,'weight')]);tx(p[0]-8,p[1]+3,`${v.toFixed(1)}kg`,{'text-anchor':'end',fill:'var(--axis-weight)'},g)}
  axisTitle(g,[-1,-1,-1],[1,-1,-1],'Reach','axis-reach');
  axisTitle(g,[-1,-1,-1],[-1,1,-1],'Equivalent aperture','axis-aperture');
  axisTitle(g,[-1,-1,-1],[-1,-1,1],'Kit weight','axis-weight');
}

function pointRadius(s){
  if(!$('sizePriceToggle').checked)return 7;
  const [lo,hi]=ranges.price,q=Math.max(0,Math.min(1,(s.price-lo)/((hi-lo)||1)));
  return 6+9*Math.sqrt(q);
}
function pointLabel(s){return s.name.split(' — ').slice(1).join(' — ')}

const cube=[[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]],edges=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
function orientPlaneEdgeOn(cs){
  if(cs.kind!=='res'||!cs.model)return;
  const m=cs.model,raw=q=>({fl:ranges.fl[0]+(q[0]+1)/2*(ranges.fl[1]-ranges.fl[0]),fstop:ranges.fstop[0]+(q[1]+1)/2*(ranges.fstop[1]-ranges.fstop[0]),weight:ranges.weight[0]+(q[2]+1)/2*(ranges.weight[1]-ranges.weight[0])}),fn=q=>{const v=raw(q);return v[m.dep]-expected(v,m)};
  let n=[(fn([1,0,0])-fn([-1,0,0]))/2,(fn([0,1,0])-fn([0,-1,0]))/2,(fn([0,0,1])-fn([0,0,-1]))/2];
  const favorable=m.dep==='fl'?1:-1,len=Math.hypot(...n);if(len<1e-8)return;n=n.map(x=>x/len*favorable);
  const h=Math.hypot(n[0],n[2]);
  if(h<1e-8){yaw=0;pitch=n[1]>=0?0:Math.PI}
  else{const sy=-n[0]/h,cy=-n[2]/h;yaw=Math.atan2(sy,cy);pitch=Math.atan2(h,n[1])}
  activeView='custom';
}
function drawPlane(g,cs){
  if(!$('planeToggle').checked||cs.kind!=='res'||activeIds.length<3)return;
  const m=cs.model,raw=q=>({fl:ranges.fl[0]+(q[0]+1)/2*(ranges.fl[1]-ranges.fl[0]),fstop:ranges.fstop[0]+(q[1]+1)/2*(ranges.fstop[1]-ranges.fstop[0]),weight:ranges.weight[0]+(q[2]+1)/2*(ranges.weight[1]-ranges.weight[0])}),fn=q=>{const s=raw(q);return s[m.dep]-expected(s,m)};
  const pts=[],add=q=>{if(!pts.some(p=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])<1e-6))pts.push(q)};
  for(const[ia,ib]of edges){const A=cube[ia],B=cube[ib],ga=fn(A),gb=fn(B);if(Math.abs(ga)<1e-9)add(A);if(Math.abs(gb)<1e-9)add(B);if(ga*gb<0){const t=ga/(ga-gb);add([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1]),A[2]+t*(B[2]-A[2])])}}
  if(pts.length<3)return;const pp=pts.map(project),cx=pp.reduce((a,p)=>a+p[0],0)/pp.length,cy=pp.reduce((a,p)=>a+p[1],0)/pp.length;pp.sort((a,b)=>Math.atan2(a[1]-cy,a[0]-cx)-Math.atan2(b[1]-cy,b[0]-cx));mk('polygon',{points:pp.map(p=>`${p[0]},${p[1]}`).join(' '),fill:'var(--plane)','fill-opacity':'.15',stroke:'var(--plane)','stroke-width':'1.6','stroke-dasharray':'7 5','pointer-events':'none'},g);
}

function render(){
  const cs=colorState(activeIds);updateLegend(cs);svg.innerHTML='';const g=mk('g');drawAxes(g);drawPlane(g,cs);
  const pts=S.map(s=>({i:s.i,s,p:project(coords(s))})).sort((a,b)=>a.p[2]-b.p[2]);
  for(const{i,s,p}of pts){
    const active=activeSet.has(i),isSel=i===selected,isShort=shortlist.includes(i),shortNo=isShort?shortlist.indexOf(i)+1:0;
    const grp=mk('g',active?{'data-i':i}:{'data-filtered-i':i},g);grp.style.opacity=active?'1':isShort?'.72':'.16';if(!active)grp.style.pointerEvents='none';
    const baseR=pointRadius(s),r=isSel?baseR+4:isShort?baseR+3:baseR,fill=active?colorFor(s,cs):'var(--filtered)';
    mk('circle',{cx:p[0],cy:p[1],r,fill,stroke:isSel?'var(--accent)':isShort?'var(--text)':active?'rgba(255,255,255,.9)':'var(--grid)','stroke-width':isSel?'4':isShort?'3':'1.2',style:`cursor:${active?'pointer':'default'}`},grp);
    if(isSel||isShort)tx(p[0]+10,p[1]-9,isShort?`${shortNo}. ${pointLabel(s)}`:pointLabel(s),{'font-size':'10','font-weight':isSel?'800':'650'},g);
    if(active){
      grp.addEventListener('mouseenter',()=>{hovered=i;showPopup(i,p);const old=svg.querySelector('[data-hover-label]');if(old)old.remove();tx(p[0]+10,p[1]-9,pointLabel(s),{'font-size':'10','font-weight':'650','data-hover-label':'1'},svg)});
      grp.addEventListener('mouseleave',()=>{hovered=null;const old=svg.querySelector('[data-hover-label]');if(old)old.remove();if(selected===null)popup.hidden=true;else updatePopupSelected()});
    }
  }
  updatePopupSelected();updateViewButtons();
}
function showPopup(i,p){const s=S[i];popup.hidden=false;popup.style.left=`${p[0]/940*100}%`;popup.style.top=`${p[1]/670*100}%`;popup.dataset.side=p[0]>650?'left':'right';popup.innerHTML=`<strong>${s.name}</strong><span>${Math.round(s.fl)} mm eq · f/${s.fstop} eq · ${s.weight.toFixed(3)} kg${$('sizePriceToggle').checked?` · CHF ${Math.round(s.price).toLocaleString('de-CH')}`:''}</span>`}
function updatePopupSelected(){if(selected===null){if(hovered===null)popup.hidden=true;return}showPopup(selected,project(coords(S[selected])))}
function updateViewButtons(){document.querySelectorAll('.viewbtn').forEach(b=>b.classList.toggle('active',b.dataset.view===activeView))}
function useView(v){activeView=v;if(v==='reach-aperture'){yaw=0;pitch=0}else if(v==='reach-weight'){yaw=0;pitch=-Math.PI/2}else if(v==='aperture-weight'){yaw=Math.PI/2;pitch=0}render()}

function select(i){
  if(!activeSet.has(i))return;selected=i;const s=S[i],isP=frontier.has(i);
  detail.innerHTML=`<strong>${s.name}</strong><div class="detailgrid"><div>Equivalent reach</div><div>${Math.round(s.fl)} mm</div><div>Equivalent aperture</div><div>f/${s.fstop}</div><div>Kit weight</div><div>${s.weight.toFixed(3)} kg</div><div>Price snapshot</div><div>CHF ${Math.round(s.price).toLocaleString('de-CH')}</div>${s.priceDate?`<div>Price checked</div><div>${s.priceDate}</div>`:''}<div>Lens type</div><div>${s.zoom?'Zoom':'Prime'}</div><div>Pareto-efficient</div><div>${isP?'Yes':'No'}</div></div><div class="detail-actions"><button id="detailCompare" type="button">${shortlist.includes(i)?'Remove from compare':'Add to compare'}</button><button id="detailClear" type="button">Deselect</button></div>`;
  $('detailCompare').onclick=()=>toggleCompare(i);$('detailClear').onclick=clearSelection;render();renderTable();
}
function clearSelection(){selected=null;detail.innerHTML='<strong>Select a kit</strong><p class="hint">Use “Compare” to add up to five kits to the shortlist.</p>';render();renderTable()}
function toggleCompare(i){
  const p=shortlist.indexOf(i);if(p>=0)shortlist.splice(p,1);else{if(!activeSet.has(i))return;if(shortlist.length>=4){alert('Shortlist is limited to four kits.');return}shortlist.push(i)}
  if(selected===i)select(i);render();renderTable();renderCompare();
}
function renderCompare(){
  const table=$('compareTable'),empty=$('compareEmpty'),status=$('shortlistStatus'),thead=table.querySelector('thead'),tb=table.querySelector('tbody');
  if(status)status.textContent=`${shortlist.length} / 4 shortlisted`;
  thead.innerHTML='';tb.innerHTML='';
  if(!shortlist.length){table.hidden=true;empty.hidden=false;return}
  empty.hidden=true;table.hidden=false;
  const hr=document.createElement('tr');
  hr.innerHTML='<th class="compare-metric-head">Metric</th>'+shortlist.map((i,n)=>{const s=S[i],filtered=!activeSet.has(i);return `<th class="compare-kit-head"><span class="compare-number">${n+1}</span><strong>${s.name}</strong>${filtered?'<span class="compare-filtered">currently filtered out</span>':''}<button type="button" data-remove="${i}">Remove</button></th>`}).join('');
  thead.appendChild(hr);
  const rows=[
    ['Reach',i=>`${Math.round(S[i].fl)} mm`],
    ['Equivalent aperture',i=>`f/${S[i].fstop}`],
    ['Weight',i=>`${S[i].weight.toFixed(3)} kg`],
    ['Price',i=>`CHF ${Math.round(S[i].price).toLocaleString('de-CH')}`],
    ['Price checked',i=>S[i].priceDate||'—'],
    ['Lens type',i=>S[i].zoom?'Zoom':'Prime'],
    ['Pareto-efficient',i=>frontier.has(i)&&baseSet.has(i)?'Yes':'No']
  ];
  for(const [label,fmt] of rows){const tr=document.createElement('tr');tr.innerHTML=`<th scope="row">${label}</th>`+shortlist.map(i=>`<td>${fmt(i)}</td>`).join('');tb.appendChild(tr)}
  table.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>toggleCompare(+b.dataset.remove));
}
function metricBar(v,d){const[lo,hi]=ranges[d],pct=(v-lo)/((hi-lo)||1)*100;return`<div class="barbg"><div class="barfill" style="width:${pct}%"></div></div>`}
function sortedIds(){
  const ids=S.map(s=>s.i),key=sort.key,dir=sort.dir;ids.sort((ia,ib)=>{const a=S[ia],b=S[ib];let va=key==='name'?a.name:key==='pareto'?(frontier.has(ia)?1:0):a[key],vb=key==='name'?b.name:key==='pareto'?(frontier.has(ib)?1:0):b[key];return(typeof va==='string'?va.localeCompare(vb):va-vb)*dir});return ids;
}
function renderTable(){
  const ids=sortedIds(),tb=$('rankTable').querySelector('tbody');tb.innerHTML='';
  for(const i of ids){const s=S[i],active=activeSet.has(i),tr=document.createElement('tr');if(i===selected)tr.classList.add('row-selected');if(!active)tr.classList.add('row-filtered');const inShort=shortlist.includes(i);
    tr.innerHTML=`<td class="num ranknum">${s.seq}</td><td class="systemcell"><div class="systemname">${s.name}</div></td><td class="metric-cell">${Math.round(s.fl)} mm${metricBar(s.fl,'fl')}</td><td class="metric-cell">f/${s.fstop}${metricBar(s.fstop,'fstop')}</td><td class="metric-cell">${s.weight.toFixed(3)} kg${metricBar(s.weight,'weight')}</td><td>${frontier.has(i)&&baseSet.has(i)?'<span class="pareto-badge">frontier</span>':''}</td><td><button class="compare-btn ${inShort?'in':''}" data-compare="${i}" ${!active&&!inShort?'disabled':''}>${inShort?'✓ Compare':'+ Compare'}</button></td>`;
    tr.addEventListener('click',e=>{if(active&&!e.target.closest('button'))select(i)});tb.appendChild(tr);
  }
  tb.querySelectorAll('[data-compare]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleCompare(+b.dataset.compare)});
  document.querySelectorAll('#rankTable th[data-sort]').forEach(h=>{const m=h.querySelector('.sortmark');m.textContent=sort.key===h.dataset.sort?(sort.dir>0?'▲':'▼'):''});
  $('tableCount').textContent=`${activeIds.length} active · ${S.length-activeIds.length} filtered out · ${S.length} total kits`;
}

function updateSliderLabels(){
  const lo=$('minReach'),hi=$('maxReach'),min=+lo.value,max=+hi.value,span=(+lo.max-+lo.min)||1,left=(min-+lo.min)/span*100,right=(+lo.max-max)/span*100;
  $('minReachValue').textContent=`${Math.round(min)} mm`;$('maxReachValue').textContent=`${Math.round(max)} mm`;$('reachRangeValue').textContent=`${Math.round(min)}–${Math.round(max)} mm eq.`;$('maxWeightValue').textContent=`${(+$('maxWeight').value).toFixed(2)} kg`;
  $('reachFill').style.left=`${left}%`;$('reachFill').style.right=`${right}%`;lo.style.zIndex=min>max-60?'5':'3';hi.style.zIndex='4';
}
function syncReach(changed){const lo=$('minReach'),hi=$('maxReach');if(+lo.value>+hi.value){if(changed==='min')hi.value=lo.value;else lo.value=hi.value}}
function refresh(){
  rebuildFilters();updateSliderLabels();
  $('filterSummary').textContent=`${activeIds.length} active kits · ${S.length-activeIds.length} filtered out but still visible`;
  if(selected!==null&&!activeSet.has(selected)){selected=null;detail.innerHTML='<strong>Select a kit</strong><p class="hint">Use “Compare” to add up to five kits to the shortlist.</p>'}
  render();renderTable();renderCompare();
}
function resetFilters(){
  brandFilter.querySelectorAll('input').forEach(cb=>{cb.checked=true;cb.indeterminate=false});$('minReach').value=flMin;$('maxReach').value=flMax;$('maxWeight').value=wMax;setRadio('lensType','all');setRadio('paretoMode','all');refresh();
}

$('minReach').value=flMin;$('maxReach').value=flMax;$('maxWeight').value=wMax;
$('minReach').addEventListener('input',()=>{syncReach('min');refresh()});$('maxReach').addEventListener('input',()=>{syncReach('max');refresh()});$('maxWeight').addEventListener('input',refresh);
document.querySelectorAll('input[name="lensType"],input[name="paretoMode"]').forEach(el=>el.addEventListener('change',refresh));$('colorMode').addEventListener('change',()=>{refresh();if($('planeToggle').checked){orientPlaneEdgeOn(colorState(activeIds));render()}});$('sizePriceToggle').addEventListener('change',()=>{if(selected!==null)select(selected);else refresh()});brandFilter.addEventListener('change',e=>{const all=$('brandAll'),boxes=[...brandFilter.querySelectorAll('input[data-brand]')];if(e.target===all){boxes.forEach(cb=>cb.checked=all.checked);all.indeterminate=false}else{const n=boxes.filter(cb=>cb.checked).length;all.checked=n===boxes.length;all.indeterminate=n>0&&n<boxes.length}refresh()});$('resetFilters').onclick=resetFilters;$('clearSelection').onclick=clearSelection;$('clearCompare').onclick=()=>{shortlist=[];renderCompare();renderTable();render()};$('planeToggle').addEventListener('change',()=>{if($('planeToggle').checked)orientPlaneEdgeOn(colorState(activeIds));render()});document.querySelectorAll('.viewbtn').forEach(b=>b.onclick=()=>useView(b.dataset.view));
document.querySelectorAll('#rankTable th[data-sort]').forEach(h=>h.onclick=()=>{const k=h.dataset.sort;if(sort.key===k)sort.dir*=-1;else{sort.key=k;sort.dir=k==='fl'?-1:1}renderTable()});

svg.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==undefined)return;const hit=e.target.closest?.('[data-i]');pointer={id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,drag:false,hit:hit?+hit.dataset.i:null}});
svg.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-pointer.sx,e.clientY-pointer.sy);if(!pointer.drag&&moved>5){pointer.drag=true;activeView='custom';try{svg.setPointerCapture(e.pointerId)}catch(_){}}if(!pointer.drag)return;const dx=e.clientX-pointer.lx,dy=e.clientY-pointer.ly;pointer.lx=e.clientX;pointer.ly=e.clientY;yaw+=dx*.01;pitch=Math.max(-1.48,Math.min(1.48,pitch+dy*.008));render()});
svg.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(!p.drag){if(Number.isInteger(p.hit)&&activeSet.has(p.hit))select(p.hit);else clearSelection()}});
svg.addEventListener('pointercancel',()=>pointer=null);svg.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.5,zoom*(e.deltaY>0?.94:1.06)));activeView='custom';render()},{passive:false});

refresh();renderCompare();
})();
