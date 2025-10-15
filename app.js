/* Plataforma de Estudos — v5.5-classic
   - Visual inspirado no v4 + motor novo: prioridade, dificuldade, plano do dia
   - LocalStorage only. Sem libs externas. */

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const SKEY=(k)=>`estudos_v55:${k}`;
const store={ get:(k,f)=>{try{const v=localStorage.getItem(SKEY(k));return v?JSON.parse(v):f}catch{return f}},
              set:(k,v)=>{try{localStorage.setItem(SKEY(k),JSON.stringify(v));}catch{}} };
const today=()=>new Date().toISOString().slice(0,10);
const uid  =(p)=>`${p}_${Math.random().toString(36).slice(2,10)}`;

const state={
  goal:  store.get('goal',60),
  logs:  store.get('logs',{}),
  notes: store.get('notes',''),
  areas: store.get('areas',[]), // area:{id,name,children:[subtema]}
  todayPick: store.get('todayPick',[]) // array de {areaId, subId} selecionados no dia
};

// ---------- Navegação ----------
function showTab(tab){
  $$('.btn.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  $('#page-hoje').classList.add('hidden');
  $('#page-temas').classList.add('hidden');
  $('#page-areas').classList.add('hidden');
  if(tab==='hoje') $('#page-hoje').classList.remove('hidden');
  if(tab==='temas') $('#page-temas').classList.remove('hidden');
  if(tab==='areas') $('#page-areas').classList.remove('hidden');
}
$$('.btn.tab').forEach(b=> b.addEventListener('click', ()=> showTab(b.dataset.tab)));

// ---------- Progresso / Meta ----------
function renderProgress(){
  const g=Number(state.goal||0)||0;
  const d=today(), done=state.logs[d]||0;
  const pct = g? Math.min(100, Math.round(done/g*100)) : 0;
  $('#progressBar').style.width=pct+'%';
  $('#progressLabel').textContent = `${done} / ${g} min`;
  $('#goalInput').value = g || '';
}
$('#saveGoal')?.addEventListener('click', ()=>{
  const v=Number($('#goalInput').value||0); state.goal = v>0?v:0; store.set('goal',state.goal); renderProgress(); alert('Meta salva!');
});
$('#addQuick15')?.addEventListener('click', ()=>{
  const d=today(); state.logs[d]=(state.logs[d]||0)+15; store.set('logs',state.logs); renderProgress(); renderLogTable();
});

// ---------- Cronômetro ----------
let tmr=null, startTs=null, accum=0;
const fmt=(ms)=>{const s=Math.floor(ms/1000);const h=String(Math.floor(s/3600)).padStart(2,'0');const m=String(Math.floor((s%3600)/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');return `${h}:${m}:${ss}`;};
function tick(){ $('#timerDisplay').textContent = fmt((startTs?Date.now()-startTs:0)+accum); }
$('#startTimer')?.addEventListener('click',()=>{ if(tmr) return; startTs=Date.now(); tmr=setInterval(tick,1000); });
$('#stopTimer')?.addEventListener('click',()=>{
  if(!tmr) return; clearInterval(tmr); tmr=null;
  const elapsed=(startTs?Date.now()-startTs:0); accum+=elapsed; startTs=null;
  const add=Math.max(0,Math.round(accum/60000)); if(add){ const d=today(); state.logs[d]=(state.logs[d]||0)+add; store.set('logs',state.logs); accum=0; renderProgress(); renderLogTable(); }
  tick();
});
$('#resetTimer')?.addEventListener('click',()=>{ if(tmr){clearInterval(tmr);tmr=null;} startTs=null;accum=0;tick(); });

// ---------- Notas ----------
$('#quickNotes').value = state.notes || '';
$('#saveNotes')?.addEventListener('click',()=>{ state.notes=$('#quickNotes').value; store.set('notes',state.notes); });
$('#clearNotes')?.addEventListener('click',()=>{ if(!confirm('Limpar?'))return; $('#quickNotes').value=''; state.notes=''; store.set('notes',''); });

// ---------- Log do dia ----------
function renderLogTable(){
  const body=$('#logBody'); const arr=Object.entries(state.logs).sort((a,b)=>a[0]<b[0]?1:-1);
  body.innerHTML = arr.length? arr.map(([d,m])=>`<tr><td>${d}</td><td>${m}</td></tr>`).join('') : '<tr><td colspan="2">Nenhum registro ainda.</td></tr>';
}

// ---------- Áreas ----------
function saveAreas(){ store.set('areas',state.areas); }
function recalcAreaProgress(a){ const L=a.children||[]; a.progress = L.length? Math.round(L.reduce((s,x)=>s+(Number(x.progress)||0),0)/L.length):0; }
function renderAreas(){
  const host=$('#areasList');
  if(!state.areas.length){ host.innerHTML='<div class="card">Nenhuma área criada ainda.</div>'; return; }
  host.innerHTML = state.areas.map(a=>{
    const subs=(a.children||[]).map(s=>`
      <div class="hcard">
        <div class="row gap" style="justify-content:space-between;align-items:center">
          <div><strong>${s.name}</strong><br><small class="muted">Prio ${s.prioridade||3} • Dif ${s.dificuldade||'média'} • Prog ${Math.round(s.progress||0)}%</small></div>
          <div class="row gap">
            <button class="btn small" data-open="${s.id}" data-area="${a.id}">Abrir</button>
            <button class="btn small secondary" data-done="${s.id}" data-area="${a.id}">Concluído hoje</button>
            <button class="btn small ghost" data-del="${s.id}" data-area="${a.id}">Excluir</button>
          </div>
        </div>
      </div>`).join('');
    return `
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <h3>${a.name} <span class="badge">${Math.round(a.progress||0)}%</span></h3>
          <button class="btn small ghost" data-del-area="${a.id}">Excluir área</button>
        </div>
        <div class="row gap" style="margin:.6rem 0">
          <input class="flex1" type="text" placeholder="Novo subtema" data-area-input="${a.id}">
          <select data-area-prio="${a.id}">
            <option value="5">Prio 5</option><option value="4">4</option><option value="3" selected>3</option><option value="2">2</option><option value="1">1</option>
          </select>
          <select data-area-diff="${a.id}">
            <option value="alta">alta</option><option value="média" selected>média</option><option value="fácil">fácil</option>
          </select>
          <button class="btn" data-add-sub="${a.id}">Adicionar subtema</button>
        </div>
        <div class="stack">${subs || '<div class="hcard muted">Sem subtemas ainda.</div>'}</div>
      </div>`;
  }).join('');

  host.onclick = (e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.addSub){ const id=b.dataset.addSub; const a=state.areas.find(x=>x.id===id); if(!a) return;
      const name=($(`[data-area-input="${id}"]`).value||'').trim(); if(!name) return alert('Informe o nome do subtema.');
      const prio=Number($(`[data-area-prio="${id}"]`).value||3); const diff=$(`[data-area-diff="${id}"]`).value||'média';
      (a.children ||= []).unshift({id:uid('s'),name,notes:'',progress:0,prioridade:prio,dificuldade:diff,status:'pendente',log:{}});
      $(`[data-area-input="${id}"]`).value=''; recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return;
    }
    if(b.dataset.delArea){ if(!confirm('Excluir a área e subtemas?'))return; state.areas=state.areas.filter(x=>x.id!==b.dataset.delArea); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return; }
    if(b.dataset.del){ const a=state.areas.find(x=>x.id===b.dataset.area); if(!a) return;
      if(!confirm('Excluir este subtema?'))return;
      a.children=(a.children||[]).filter(s=>s.id!==b.dataset.del); recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return;
    }
    if(b.dataset.done){ markDoneToday(b.dataset.area, b.dataset.done); return; }
    if(b.dataset.open){ openSub(b.dataset.area, b.dataset.open); return; }
  };
}
$('#addArea')?.addEventListener('click', ()=>{
  const name=($('#areaName').value||'').trim(); if(!name) return alert('Informe o nome da área.');
  state.areas.unshift({id:uid('a'),name,progress:0,children:[]}); $('#areaName').value=''; saveAreas(); renderAreas(); refreshAttachAreas();
});

// ---------- Temas (tabela) ----------
function allSubthemes(){
  const list=[]; state.areas.forEach(a=> (a.children||[]).forEach(s=> list.push({area:a.name, areaId:a.id, ...s})));
  return list;
}
function renderThemesTable(){
  const body=$('#themesBody'); const list=allSubthemes();
  if(!list.length){ body.innerHTML='<tr><td colspan="8">Nenhum tema cadastrado.</td></tr>'; return; }
  body.innerHTML = list.map(s=>`
    <tr>
      <td>${s.name}</td><td>${s.area}</td><td>${s.prioridade||3}</td><td>${s.dificuldade||'média'}</td>
      <td>${s.status||'pendente'}</td><td>${Math.round(s.progress||0)}%</td>
      <td>${Object.keys(s.log||{}).sort().slice(-1)[0]||'-'}</td>
      <td class="row gap">
        <button class="btn small" data-open="${s.id}" data-area="${s.areaId}">Abrir</button>
        <button class="btn small secondary" data-done="${s.id}" data-area="${s.areaId}">Concluído hoje</button>
        <button class="btn small ghost" data-del="${s.id}" data-area="${s.areaId}">Excluir</button>
      </td>
    </tr>`).join('');

  body.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.open){ openSub(b.dataset.area,b.dataset.open); return; }
    if(b.dataset.done){ markDoneToday(b.dataset.area,b.dataset.done); return; }
    if(b.dataset.del){ const a=state.areas.find(x=>x.id===b.dataset.area); if(!a) return;
      if(!confirm('Excluir este subtema?'))return;
      a.children=(a.children||[]).filter(s=>s.id!==b.dataset.del); recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas();
    }
  };
}
function refreshAttachAreas(){
  const sel=$('#attachArea'), sel2=$('#bulkArea');
  const opt=state.areas.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  sel.innerHTML=opt||'<option value="">(Crie uma área primeiro)</option>';
  sel2.innerHTML=opt||'<option value="">(Crie uma área primeiro)</option>';
}
$('#addTheme')?.addEventListener('click', ()=>{
  const areaId=$('#attachArea').value; const a=state.areas.find(x=>x.id===areaId);
  const name=($('#newThemeName').value||'').trim(); if(!name) return alert('Informe o tema.');
  if(!a) return alert('Selecione uma área.');
  const prio=Number($('#newPriority').value||3); const diff=$('#newDifficulty').value||'média';
  (a.children ||= []).unshift({id:uid('s'),name,notes:$('#newComment').value||'',progress:0,prioridade:prio,dificuldade:diff,status:'pendente',log:{}});
  recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); $('#newThemeName').value=''; $('#newComment').value='';
});

// Adição em massa
$('#bulkToggle')?.addEventListener('click', ()=> $('#bulkWrap').classList.toggle('hidden'));
$('#bulkAdd')?.addEventListener('click', ()=>{
  const areaId=$('#bulkArea').value; const a=state.areas.find(x=>x.id===areaId); if(!a) return alert('Selecione uma área.');
  const lines = ($('#bulkText').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  lines.forEach(line=>{
    let name=line, prio=3, diff='média';
    const parts=line.split('|').map(s=>s.trim());
    if(parts.length>1){ name=parts[0]; parts.slice(1).forEach(p=>{
      const [k,v]=p.split('=').map(x=>x.trim().toLowerCase());
      if(k==='prio') prio=Number(v)||3;
      if(k==='dif') diff=(v==='alta'||v==='fácil'||v==='média')?v:'média';
    });}
    (a.children ||= []).push({id:uid('s'),name,notes:'',progress:0,prioridade:prio,dificuldade:diff,status:'pendente',log:{}});
  });
  recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); $('#bulkText').value='';
});

// Export / Import
$('#exportJson')?.addEventListener('click', ()=>{
  const data={areas:state.areas}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='temas_estudos.json'; a.click();
});
$('#importJson')?.addEventListener('change', (e)=>{
  const f=e.target.files?.[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ const obj=JSON.parse(String(r.result||'{}')); if(Array.isArray(obj.areas)){ state.areas=obj.areas; saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); alert('Importado!'); } else alert('JSON inválido.'); }catch{ alert('Falha ao importar.'); }};
  r.readAsText(f);
});

// ---------- Gerador do Dia ----------
function daysToExam(){
  const v=$('#examDate').value; if(!v) return '-';
  const d=(new Date(v).getTime() - new Date().setHours(0,0,0,0))/(1000*60*60*24);
  return d>=0? Math.round(d) : '-';
}
function difficultyWeight(d){ if(d==='alta')return 1.0; if(d==='média')return 0.8; return 0.6; }
function scoreSub(s){
  const prio=Number(s.prioridade||3), prog=100-Number(s.progress||0);
  return prio*2 + prog*0.5 + difficultyWeight(s.dificuldade||'média')*10;
}
function generateToday(){
  const perDay=Math.max(1, Number($('#topicsPerDay').value||2));
  const list=allSubthemes().sort((a,b)=> scoreSub(b)-scoreSub(a)).slice(0, perDay);
  state.todayPick = list.map(x=>({areaId:x.areaId, subId:x.id}));
  store.set('todayPick', state.todayPick); renderToday();
}
function clearToday(){ state.todayPick=[]; store.set('todayPick',[]); renderToday(); }

function renderToday(){
  const days = daysToExam();
  $('#kpiDays').textContent = `Dias até a prova: ${days}`;
  const doneCount = state.todayPick.reduce((acc,p)=>{
    const a=state.areas.find(x=>x.id===p.areaId); const s=a?.children?.find(z=>z.id===p.subId);
    return acc + (s?.status==='feito'?1:0);
  },0);
  $('#kpiTopics').textContent = `Temas: ${state.todayPick.length}`;
  $('#kpiDone').textContent   = `Concluídos: ${doneCount}`;
  const d=today(); const g=Number(state.goal||0)||0; const prog = g? Math.round(((state.logs[d]||0)/g)*100):0;
  $('#kpiProg').textContent   = `Progresso: ${Math.max(0,prog)}%`;

  const host=$('#todayList'); host.innerHTML='';
  const showDone = $('#showDone').value==='Sim';
  state.todayPick.forEach(p=>{
    const a=state.areas.find(x=>x.id===p.areaId); const s=a?.children?.find(z=>z.id===p.subId);
    if(!a||!s) return;
    if(!showDone && s.status==='feito') return;
    const box=document.createElement('div');
    box.className='card';
    box.innerHTML=`
      <div class="row" style="justify-content:space-between;align-items:center">
        <div>
          <strong>${s.name}</strong> <span class="badge">${a.name}</span><br>
          <small class="muted">Prio ${s.prioridade} • Dif ${s.dificuldade} • Prog ${Math.round(s.progress||0)}%</small>
        </div>
        <div class="row gap">
          <button class="btn small" data-open="${s.id}" data-area="${a.id}">Abrir</button>
          <button class="btn small secondary" data-done="${s.id}" data-area="${a.id}">Marcar concluído hoje</button>
          <button class="btn small ghost" data-remove="${s.id}" data-area="${a.id}">Remover de hoje</button>
        </div>
      </div>`;
    host.appendChild(box);
  });

  host.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.open){ openSub(b.dataset.area,b.dataset.open); return; }
    if(b.dataset.done){ markDoneToday(b.dataset.area,b.dataset.done); renderToday(); return; }
    if(b.dataset.remove){
      state.todayPick = state.todayPick.filter(x=> !(x.areaId===b.dataset.area && x.subId===b.dataset.remove));
      store.set('todayPick',state.todayPick); renderToday();
    }
  };
}
$('#genToday')?.addEventListener('click', generateToday);
$('#clearToday')?.addEventListener('click', clearToday);
$('#btnPlan')?.addEventListener('click', generateToday);

// ---------- Ações comuns ----------
function markDoneToday(areaId, subId){
  const a=state.areas.find(x=>x.id===areaId); if(!a) return;
  const s=(a.children||[]).find(z=>z.id===subId); if(!s) return;
  s.status='feito';
  s.progress = Math.min(100, Number(s.progress||0)+20);
  const d=today(); s.log[d]=(s.log[d]||0)+1;
  recalcAreaProgress(a); saveAreas();
  renderAreas(); renderThemesTable(); renderToday();
}

function openSub(areaId, subId){
  const a=state.areas.find(x=>x.id===areaId); if(!a) return;
  const s=(a.children||[]).find(z=>z.id===subId); if(!s) return;
  const wrap=document.createElement('div');
  wrap.className='modal'; // estilizado via .card padrão
  wrap.innerHTML=`
    <div class="card" style="max-width:760px;margin:8vh auto;background:#0f131c">
      <h3>${a.name} → ${s.name}</h3>
      <div class="grid4" style="margin:.5rem 0">
        <label>Progresso (%)<input id="p_edit" type="number" min="0" max="100" value="${Math.round(s.progress||0)}"></label>
        <label>Prioridade
          <select id="prio_edit">
            ${[5,4,3,2,1].map(n=>`<option ${s.prioridade==n?'selected':''}>${n}</option>`).join('')}
          </select>
        </label>
        <label>Dificuldade
          <select id="diff_edit">
            ${['alta','média','fácil'].map(d=>`<option ${s.dificuldade===d?'selected':''}>${d}</option>`).join('')}
          </select>
        </label>
        <label>Status
          <select id="status_edit">
            ${['pendente','feito'].map(st=>`<option ${s.status===st?'selected':''}>${st}</option>`).join('')}
          </select>
        </label>
      </div>
      <label>Notas</label>
      <textarea id="n_edit" rows="8">${(s.notes||'').replace(/</g,'&lt;')}</textarea>
      <div class="row gap" style="margin-top:.6rem">
        <button class="btn" id="saveSub">Salvar</button>
        <button class="btn ghost" id="exportSub">Exportar .txt</button>
        <button class="btn secondary" id="closeSub">Fechar</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  wrap.addEventListener('click',(e)=>{ if(e.target===wrap) wrap.remove(); });
  $('#closeSub').onclick=()=>wrap.remove();
  $('#saveSub').onclick=()=>{
    s.progress=Math.max(0,Math.min(100,Number($('#p_edit').value||0)));
    s.prioridade=Number($('#prio_edit').value||3);
    s.dificuldade=$('#diff_edit').value||'média';
    s.status=$('#status_edit').value||'pendente';
    s.notes=$('#n_edit').value||'';
    recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); renderToday(); wrap.remove();
  };
  $('#exportSub').onclick=()=>{
    const blob=new Blob([`# ${a.name} → ${s.name}
Progresso: ${Math.round(s.progress||0)}%
Prioridade: ${s.prioridade}
Dificuldade: ${s.dificuldade}
Status: ${s.status}

Notas:
${s.notes||''}`],{type:'text/plain'});
    const el=document.createElement('a'); el.href=URL.createObjectURL(blob); el.download=`${a.name} - ${s.name}.txt`; el.click();
  };
}

// ---------- Init ----------
function init(){
  showTab('hoje');
  renderProgress(); renderLogTable(); renderAreas(); renderThemesTable(); refreshAttachAreas(); renderToday();
}
document.addEventListener('DOMContentLoaded', init);
