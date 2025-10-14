(function(){
  const SCOPE='ortopedia_v3';const nowKey=()=>new Date().toISOString().slice(0,10);
  const store={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(SCOPE+':'+k))||f}catch(e){return f}},
               set:(k,v)=>{try{localStorage.setItem(SCOPE+':'+k,JSON.stringify(v))}catch(e){}}};
  const $=s=>document.querySelector(s);
  const state={goal:store.get('goal',60),logs:store.get('logs',{}),notes:store.get('notes','')};

  // ---- Progresso e metas ----
  const goalInput=$('#dailyGoal'),goalStatus=$('#goalStatus'),pbar=$('#progressBar'),ptext=$('#progressText');
  function renderProgress(){
    const d=nowKey(),tot=state.logs[d]||0,g=Number(state.goal||0)||0;
    const pct=g>0?Math.min(100,Math.round(tot/g*100)):0;
    if(pbar)pbar.style.width=pct+'%';
    if(ptext)ptext.textContent=`${tot} / ${g} min`;
    if(goalStatus)goalStatus.textContent=g?`Meta: ${g} min`:'Defina uma meta';
    if(goalInput)goalInput.value=g||'';
  }
  $('#dailyGoalForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const val=Number(goalInput.value||0);
    state.goal=val; store.set('goal',val); renderProgress();
  });

  // ---- Cronômetro ----
  let tmr=null,start=null,acc=0; const disp=$('#timerDisplay');
  function fmt(ms){const s=Math.floor(ms/1000),h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');return`${h}:${m}:${ss}`;}
  function tick(){ if(disp){ const el=(start?Date.now()-start:0)+acc; disp.textContent=fmt(el);} }
  $('#startTimer')?.addEventListener('click',()=>{ if(tmr) return; start=Date.now(); tmr=setInterval(tick,1000); });
  $('#stopTimer')?.addEventListener('click',()=>{
    if(!tmr) return; clearInterval(tmr); tmr=null;
    const el=(start?Date.now()-start:0); acc+=el; start=null;
    const add=Math.max(0,Math.round(acc/60000));
    if(add){ const d=nowKey(); state.logs[d]=(state.logs[d]||0)+add; store.set('logs',state.logs); acc=0; renderProgress(); renderLogTable(); }
    tick();
  });
  $('#resetTimer')?.addEventListener('click',()=>{ if(tmr){clearInterval(tmr);tmr=null;} acc=0; start=null; tick(); });
  $('#addQuick15')?.addEventListener('click',()=>{ const d=nowKey(); state.logs[d]=(state.logs[d]||0)+15; store.set('logs',state.logs); renderProgress(); renderLogTable(); });

  // ---- Notas ----
  const area=$('#quickNotes'); if(area) area.value=state.notes||'';
  $('#saveNotes')?.addEventListener('click',()=>{ state.notes=area.value; store.set('notes',state.notes); });
  $('#clearNotes')?.addEventListener('click',()=>{ area.value=''; state.notes=''; store.set('notes',''); });

  // ---- Log Diário ----
  function renderLogTable(){
    const body=$('#logBody'); if(!body) return;
    const entries=Object.entries(state.logs).sort((a,b)=>a[0]<b[0]?1:-1);
    if(!entries.length){ body.innerHTML='<tr><td colspan="2">Nenhum registro ainda.</td></tr>'; return; }
    body.innerHTML = entries.map(([date,min])=>`<tr><td>${date}</td><td>${min}</td></tr>`).join('');
  }

  // Inicializa
  renderProgress(); tick(); renderLogTable();
})();