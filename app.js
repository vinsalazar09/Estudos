/* v5.6 — Fluxo Inteligente
   - Fluxo natural: área → tema (aula vista? rendimento inicial)
   - Gerador do dia com atividade sugerida e detalhe opcional
   - Backup amigável
   - Tema visual Minimalista/Lúdico
   - 100% localStorage, sem SW */

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const KEY=(k)=>`estudos_v56:${k}`;
const store={ get:(k,f)=>{try{const v=localStorage.getItem(KEY(k));return v?JSON.parse(v):f}catch{return f}},
              set:(k,v)=>{try{localStorage.setItem(KEY(k),JSON.stringify(v));}catch{}} };
const today=()=>new Date().toISOString().slice(0,10);
const uid=(p)=>`${p}_${Math.random().toString(36).slice(2,10)}`;

const state={
  theme: store.get('theme','minimal'),
  goal: store.get('goal',60),
  logs: store.get('logs',{}),
  notes: store.get('notes',''),
  areas: store.get('areas',[]), // {id,name,children:[subtema]}
  todayPick: store.get('todayPick',[])
};

// THEME
function applyTheme(){
  if(state.theme==='ludico'){ document.documentElement.setAttribute('data-theme','ludico'); $('#themeLabel').textContent='Lúdico'; }
  else { document.documentElement.removeAttribute('data-theme'); $('#themeLabel').textContent='Minimalista'; }
}
$('#themeToggle')?.addEventListener('click',()=>{ state.theme = (state.theme==='minimal'?'ludico':'minimal'); store.set('theme',state.theme); applyTheme(); });

// NAV
function showTab(t){
  $$('.btn.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===t));
  $('#page-hoje').classList.add('hidden');
  $('#page-temas').classList.add('hidden');
  $('#page-areas').classList.add('hidden');
  if(t==='hoje') $('#page-hoje').classList.remove('hidden');
  if(t==='temas') $('#page-temas').classList.remove('hidden');
  if(t==='areas') $('#page-areas').classList.remove('hidden');
}
$$('.btn.tab').forEach(b=> b.addEventListener('click', ()=> showTab(b.dataset.tab)));

// PROGRESSO
function renderProgress(){
  const g=Number(state.goal||0)||0;
  const d=today(), done=state.logs[d]||0;
  const pct = g? Math.min(100, Math.round(done/g*100)) : 0;
  $('#progressBar').style.width=pct+'%';
  $('#progressLabel').textContent = `${done} / ${g} min`;
  $('#goalInput').value = g || '';
}
$('#saveGoal')?.addEventListener('click', ()=>{
  const v=Number($('#goalInput').value||0); state.goal=v>0?v:0; store.set('goal',state.goal); renderProgress(); alert('Meta salva!');
});
$('#addQuick15')?.addEventListener('click', ()=>{
  const d=today(); state.logs[d]=(state.logs[d]||0)+15; store.set('logs',state.logs); renderProgress(); renderLogTable();
});

// TIMER
let tmr=null,startTs=null,accum=0;
const fmt=(ms)=>{const s=Math.floor(ms/1000);const h=String(Math.floor(s/3600)).padStart(2,'0');const m=String(Math.floor((s%3600)/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');return `${h}:${m}:${ss}`;};
function tick(){ $('#timerDisplay').textContent=fmt((startTs?Date.now()-startTs:0)+accum); }
$('#startTimer')?.addEventListener('click',()=>{ if(tmr) return; startTs=Date.now(); tmr=setInterval(tick,1000); });
$('#stopTimer')?.addEventListener('click',()=>{
  if(!tmr) return; clearInterval(tmr); tmr=null;
  const elapsed=(startTs?Date.now()-startTs:0); accum+=elapsed; startTs=null;
  const add=Math.max(0,Math.round(accum/60000)); if(add){ const d=today(); state.logs[d]=(state.logs[d]||0)+add; store.set('logs',state.logs); accum=0; renderProgress(); renderLogTable(); }
  tick();
});
$('#resetTimer')?.addEventListener('click',()=>{ if(tmr){clearInterval(tmr);tmr=null;} startTs=null;accum=0;tick(); });

// NOTAS
$('#quickNotes').value = state.notes || '';
$('#saveNotes')?.addEventListener('click',()=>{ state.notes=$('#quickNotes').value; store.set('notes',state.notes); });
$('#clearNotes')?.addEventListener('click',()=>{ if(!confirm('Limpar?'))return; $('#quickNotes').value=''; state.notes=''; store.set('notes',''); });

// LOG
function renderLogTable(){
  const body=$('#logBody'); const arr=Object.entries(state.logs).sort((a,b)=>a[0]<b[0]?1:-1);
  body.innerHTML = arr.length? arr.map(([d,m])=>`<tr><td>${d}</td><td>${m}</td></tr>`).join('') : '<tr><td colspan="2">Nenhum registro ainda.</td></tr>';
}

// ÁREAS
function saveAreas(){ store.set('areas',state.areas); }
function recalcAreaProgress(a){ const L=a.children||[]; a.progress = L.length? Math.round(L.reduce((s,x)=>s+(Number(x.progress)||0),0)/L.length):0; }
$('#addArea')?.addEventListener('click', ()=>{
  const name=($('#areaName').value||'').trim(); if(!name) return alert('Informe o nome da área.');
  state.areas.unshift({id:uid('a'),name,progress:0,children:[]});
  $('#areaName').value=''; saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas();
});

function renderAreas(){
  const host=$('#areasList');
  if(!state.areas.length){ host.innerHTML='<div class="card">Nenhuma área criada ainda.</div>'; return; }
  host.innerHTML = state.areas.map(a=>{
    const subs=(a.children||[]).map(s=>`
      <div class="hcard">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div><strong>${s.name}</strong><br><small class="muted">Prio ${s.prioridade||3} • Dif ${s.dificuldade||'média'} • Prog ${Math.round(s.progress||0)}% • Aula ${s.aulaVista?'sim':'não'} • Rend ${s.rendimento||'-'}</small></div>
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
        <div class="stack">${subs || '<div class="hcard muted">Sem subtemas ainda.</div>'}</div>
      </div>`;
  }).join('');

  host.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.delArea){ if(!confirm('Excluir a área e subtemas?'))return; state.areas=state.areas.filter(x=>x.id!==b.dataset.delArea); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return; }
    if(b.dataset.del){ const a=state.areas.find(x=>x.id===b.dataset.area); if(!a) return;
      if(!confirm('Excluir este subtema?'))return;
      a.children=(a.children||[]).filter(s=>s.id!==b.dataset.del); recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return; }
    if(b.dataset.done){ markDoneToday(b.dataset.area,b.dataset.done); return; }
    if(b.dataset.open){ openSub(b.dataset.area,b.dataset.open); return; }
  };
}

// TEMAS (tabela + adição)
function allSubthemes(){
  const list=[]; state.areas.forEach(a=> (a.children||[]).forEach(s=> list.push({area:a.name, areaId:a.id, ...s})));
  return list;
}
function refreshAttachAreas(){
  const sel=$('#attachArea'), selB=$('#bulkArea');
  const opt=state.areas.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  sel.innerHTML=opt||'<option value="">(Crie uma área primeiro)</option>';
  selB.innerHTML=opt||'<option value="">(Crie uma área primeiro)</option>';
}

function renderThemesTable(){
  const body=$('#themesBody'); const list=allSubthemes();
  if(!list.length){ body.innerHTML='<tr><td colspan="9">Nenhum tema cadastrado.</td></tr>'; return; }
  body.innerHTML = list.map(s=>`
    <tr>
      <td>${s.name}</td><td>${s.area}</td><td>${s.prioridade||3}</td><td>${s.dificuldade||'média'}</td>
      <td>${s.aulaVista?'sim':'não'}</td><td>${s.rendimento||'-'}</td>
      <td>${Math.round(s.progress||0)}%</td><td>${Object.keys(s.log||{}).sort().slice(-1)[0]||'-'}</td>
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
      a.children=(a.children||[]).filter(s=>s.id!==b.dataset.del); recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); refreshAttachAreas(); }
  };
}

$('#addTheme')?.addEventListener('click', ()=>{
  const areaId=$('#attachArea').value; const a=state.areas.find(x=>x.id===areaId); if(!a) return alert('Selecione uma área.');
  const name=($('#newThemeName').value||'').trim(); if(!name) return alert('Informe o tema.');
  const prio=Number($('#newPriority').value||3);
  const diff=$('#newDifficulty').value||'média';
  const aula=$('#seenClass').value==='sim';
  const rend=$('#initialYield').value; // ruim/medio/bom
  const score=Number($('#initialScore').value||0);
  const notes=$('#newComment').value||'';

  (a.children ||= []).unshift({
    id:uid('s'), name, notes, prioridade:prio, dificuldade:diff,
    aulaVista:aula, rendimento:rend, scoreInicial:score,
    status:'pendente', progress:0, log:{} // progress vai subindo
  });

  recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable();
  $('#newThemeName').value=''; $('#newComment').value=''; $('#initialScore').value='';
});

// bulk
$('#bulkToggle')?.addEventListener('click',()=> $('#bulkWrap').classList.toggle('hidden'));
$('#bulkAdd')?.addEventListener('click', ()=>{
  const areaId=$('#bulkArea').value; const a=state.areas.find(x=>x.id===areaId); if(!a) return alert('Selecione uma área.');
  const lines = ($('#bulkText').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  lines.forEach(line=>{
    let name=line, prio=3, dif='média', aula=false, rend='medio', score=0;
    const parts=line.split('|').map(s=>s.trim());
    if(parts.length>1){ name=parts[0]; parts.slice(1).forEach(p=>{
      const [k,v]=p.split('=').map(x=>x.trim().toLowerCase());
      if(k==='prio') prio=Number(v)||3;
      if(k==='dif') dif=(v==='alta'||v==='fácil'||v==='média')?v:'média';
      if(k==='aula') aula=(v==='sim');
      if(k==='rend') rend=(v==='ruim'||v==='medio'||v==='bom')?v:'medio';
      if(k==='score') score=Number(v)||0;
    });}
    (a.children ||= []).push({id:uid('s'),name:parts[0],notes:'',prioridade:prio,dificuldade:dif,aulaVista:aula,rendimento:rend,scoreInicial:score,status:'pendente',progress:0,log:{}});
  });
  recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); $('#bulkText').value='';
});

// BACKUP amigável
$('#backupExport')?.addEventListener('click', ()=>{
  const data={areas:state.areas, goal:state.goal, logs:state.logs, notes:state.notes};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='backup_estudos.json'; a.click();
});
$('#backupImport')?.addEventListener('change',(e)=>{
  const f=e.target.files?.[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{
    try{ const obj=JSON.parse(String(r.result||'{}'));
      if(obj?.areas){ state.areas=obj.areas; if(obj.goal!=null)state.goal=obj.goal; if(obj.logs)obj.logs=obj.logs; if(obj.notes!=null)state.notes=obj.notes;
        saveAreas(); store.set('goal',state.goal); store.set('logs',state.logs); store.set('notes',state.notes);
        renderAreas(); renderThemesTable(); refreshAttachAreas(); renderProgress(); renderLogTable();
        alert('Backup restaurado com sucesso!');
      } else alert('Arquivo inválido.');
    }catch{ alert('Falha ao importar.'); }
  }; r.readAsText(f);
});

// ATIVIDADE SUGERIDA
function difficultyWeight(d){ if(d==='alta')return 1.0; if(d==='média')return 0.8; return 0.6; }
function rendimentoFactor(r){ if(r==='ruim')return 2; if(r==='medio')return 1; return 0; }
function lastStudyPenalty(s){
  const daysSince = (()=>{ const last=Object.keys(s.log||{}).sort().slice(-1)[0]; if(!last) return 999; const diff=(new Date().setHours(0,0,0,0)-new Date(last).getTime())/(1000*60*60*24); return Math.max(0, Math.round(diff)); })();
  return Math.min(10, Math.floor(daysSince/3)); // mais tempo parado, mais prioridade
}
function scoreSub(s){
  const prio=Number(s.prioridade||3);
  const prog=100-Number(s.progress||0);
  return prio*2 + prog*0.4 + difficultyWeight(s.dificuldade||'média')*0.8 + rendimentoFactor(s.rendimento||'medio') + lastStudyPenalty(s);
}
function suggestedAction(s){
  // Regra de ouro: se não viu aula → "Assistir aula + questões"
  if(!s.aulaVista) return {kind:'aula', text:'Assistir aula/ler conteúdo + fazer questões', cls:'bad'};
  // Se viu aula:
  if((s.rendimento||'medio')==='bom' || (s.scoreInicial||0)>=70) return {kind:'ativa', text:'Revisão ativa: questões/flashcards', cls:'good'};
  if((s.rendimento||'medio')==='medio' || ((s.scoreInicial||0)>=40&&(s.scoreInicial||0)<70)) return {kind:'mista', text:'Resumo rápido + questões/flashcards', cls:'warn'};
  return {kind:'aula', text:'Revisão passiva (aula/resumo) + questões leves', cls:'bad'};
}

// GERADOR DO DIA
function daysToExam(){
  const v=$('#examDate').value; if(!v) return '-';
  const d=(new Date(v).getTime() - new Date().setHours(0,0,0,0))/(1000*60*60*24);
  return d>=0? Math.round(d) : '-';
}
function generateToday(){
  const perDay=Math.max(1, Number($('#topicsPerDay').value||2));
  const subs=allSubthemes().sort((a,b)=> scoreSub(b)-scoreSub(a));
  const pick=subs.slice(0,perDay).map(x=>({areaId:x.areaId, subId:x.id}));
  state.todayPick=pick; store.set('todayPick',state.todayPick); renderToday();
}
function clearToday(){ state.todayPick=[]; store.set('todayPick',[]); renderToday(); }

function renderToday(){
  $('#kpiDays').textContent = `Dias até a prova: ${daysToExam()}`;
  const host=$('#todayList'); host.innerHTML='';
  const showDone = $('#showDone').value==='Sim';

  let doneCount=0;
  state.todayPick.forEach(p=>{
    const a=state.areas.find(x=>x.id===p.areaId); const s=a?.children?.find(z=>z.id===p.subId); if(!a||!s) return;
    if(!showDone && s.status==='feito') return;
    if(s.status==='feito') doneCount++;

    const sug = suggestedAction(s);
    const wrap=document.createElement('div'); wrap.className='card';
    wrap.innerHTML = `
      <div class="row" style="justify-content:space-between;align-items:center">
        <div>
          <strong>${s.name}</strong> <span class="badge">${a.name}</span>
          <div class="suggestion ${sug.cls}">
            <strong>Atividade sugerida:</strong> ${sug.text}
            <button class="btn small ghost" data-toggle="details">ver detalhes</button>
            <div class="details">
              <small class="muted">
                Prioridade: ${s.prioridade} • Dificuldade: ${s.dificuldade} • Progresso: ${Math.round(s.progress||0)}% • Aula: ${s.aulaVista?'sim':'não'} • Rendimento: ${s.rendimento||'-'} • Score inicial: ${s.scoreInicial||'-'}
              </small>
            </div>
          </div>
        </div>
        <div class="row gap">
          <button class="btn small" data-open="${s.id}" data-area="${a.id}">Abrir</button>
          <button class="btn small secondary" data-done="${s.id}" data-area="${a.id}">Marcar concluído</button>
          <button class="btn small ghost" data-remove="${s.id}" data-area="${a.id}">Remover</button>
        </div>
      </div>
    `;
    host.appendChild(wrap);
  });

  // KPIs topo
  $('#kpiTopics').textContent = `Temas: ${state.todayPick.length}`;
  $('#kpiDone').textContent = `Concluídos: ${doneCount}`;
  const d=today(), g=Number(state.goal||0)||0, prog = g? Math.round(((state.logs[d]||0)/g)*100):0;
  $('#kpiProg').textContent = `Progresso do dia: ${Math.max(0,prog)}%`;

  host.onclick=(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    if(btn.dataset.toggle==='details'){ const box=btn.parentElement.querySelector('.details'); box.classList.toggle('show'); return; }
    if(btn.dataset.open){ openSub(btn.dataset.area,btn.dataset.open); return; }
    if(btn.dataset.done){ markDoneToday(btn.dataset.area,btn.dataset.done); renderToday(); return; }
    if(btn.dataset.remove){
      state.todayPick = state.todayPick.filter(x=> !(x.areaId===btn.dataset.area && x.subId===btn.dataset.remove));
      store.set('todayPick',state.todayPick); renderToday();
    }
  };
}
$('#genToday')?.addEventListener('click', generateToday);
$('#clearToday')?.addEventListener('click', clearToday);
$('#btnPlan')?.addEventListener('click', generateToday);

// AÇÕES COMUNS
function markDoneToday(areaId, subId){
  const a=state.areas.find(x=>x.id===areaId); if(!a) return;
  const s=a.children?.find(z=>z.id===subId); if(!s) return;
  s.status='feito';
  s.progress = Math.min(100, Number(s.progress||0)+20);
  const d=today(); s.log[d]=(s.log[d]||0)+1;
  recalcAreaProgress(a); saveAreas();
  renderAreas(); renderThemesTable();
  renderProgress(); renderLogTable();
}

function openSub(areaId, subId){
  const a=state.areas.find(x=>x.id===areaId); if(!a) return;
  const s=a.children?.find(z=>z.id===subId); if(!s) return;
  const wrap=document.createElement('div');
  wrap.className='modal';
  wrap.innerHTML=`
    <div class="card" style="max-width:760px;margin:8vh auto;background:#0f131c">
      <h3>${a.name} → ${s.name}</h3>
      <div class="grid4" style="margin:.5rem 0">
        <label>Progresso (%)<input id="p_edit" type="number" min="0" max="100" value="${Math.round(s.progress||0)}"></label>
        <label>Prioridade
          <select id="prio_edit">${[5,4,3,2,1].map(n=>`<option ${s.prioridade==n?'selected':''}>${n}</option>`).join('')}</select>
        </label>
        <label>Dificuldade
          <select id="diff_edit">${['alta','média','fácil'].map(d=>`<option ${s.dificuldade===d?'selected':''}>${d}</option>`).join('')}</select>
        </label>
        <label>Aula vista?
          <select id="seen_edit"><option ${s.aulaVista?'selected':''}>sim</option><option ${!s.aulaVista?'selected':''}>não</option></select>
        </label>
      </div>
      <div class="grid4" style="margin:.2rem 0">
        <label>Rendimento
          <select id="rend_edit">${['ruim','medio','bom'].map(r=>`<option value="${r}" ${s.rendimento===r?'selected':''}>${r}</option>`).join('')}</select>
        </label>
        <label>% acertos (opcional)
          <input id="score_edit" type="number" min="0" max="100" value="${Number(s.scoreInicial||0)}">
        </label>
        <label>Status
          <select id="status_edit">${['pendente','feito'].map(st=>`<option ${s.status===st?'selected':''}>${st}</option>`).join('')}</select>
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
    s.aulaVista=$('#seen_edit').value==='sim';
    s.rendimento=$('#rend_edit').value||'medio';
    s.scoreInicial=Number($('#score_edit').value||0);
    s.status=$('#status_edit').value||'pendente';
    s.notes=$('#n_edit').value||'';
    recalcAreaProgress(a); saveAreas(); renderAreas(); renderThemesTable(); renderToday(); wrap.remove();
  };
  $('#exportSub').onclick=()=>{
    const blob=new Blob([`# ${a.name} → ${s.name}
Progresso: ${Math.round(s.progress||0)}%
Prioridade: ${s.prioridade}
Dificuldade: ${s.dificuldade}
Aula vista: ${s.aulaVista?'sim':'não'}
Rendimento: ${s.rendimento||'-'}  |  Score inicial: ${s.scoreInicial||'-'}
Status: ${s.status}

Notas:
${s.notes||''}`],{type:'text/plain'});
    const el=document.createElement('a'); el.href=URL.createObjectURL(blob); el.download=`${a.name} - ${s.name}.txt`; el.click();
  };
}

// INIT
function init(){
  applyTheme();
  showTab('hoje');
  renderProgress(); renderLogTable(); renderAreas(); renderThemesTable(); refreshAttachAreas(); renderToday();
}
document.addEventListener('DOMContentLoaded', init);
