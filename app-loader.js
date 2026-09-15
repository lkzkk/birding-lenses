(async()=>{
  const r=await fetch('app.js.gz?v=20260915g',{cache:'no-store'});
  if(!r.ok) throw new Error(`App load failed: HTTP ${r.status}`);
  if(typeof DecompressionStream!=='function') throw new Error('This browser does not support DecompressionStream.');
  const text=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();
  (0,eval)(`${text}\n//# sourceURL=app.js`);
})().catch(err=>{
  console.error(err);
  const detail=document.getElementById('detail');
  if(detail) detail.innerHTML='<strong>App load failed</strong><p class="hint">Please use a current browser.</p>';
});
