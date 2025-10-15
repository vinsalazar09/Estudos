/* v6.0A — Projetos-Mãe
   - Múltiplos projetos independentes (Prova/Objetivo X, Y)
   - Onboarding: pede nome do primeiro projeto
   - Trocar/renomear/excluir projeto
   - Backup/Restore por projeto
   - Mantém TODA a lógica da v5.6 (gerador, atividades, etc.) em escopo do projeto ativo
*/

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const ROOT='estudos_v60a';

// ===== Storage base =====
const rootStore={
  get:(k,f)=>{ try{const v=localStorage.getItem(`${ROOT}:${k}`); return v?JSON.parse(v):f;}catch{return f} },
  set:(k,v)=>{ try{localStorage.setItem(`${ROOT}:${k}`, JSON.stringify(v));}catch{} },
  del:(k)=>{ try{localStorage.removeItem(`${ROOT}:${k}`);}catch{} }
};

// ===== Projetos (lista + ativo) =====
let projects = rootStore.get('projects', []);      // [{id,name}]
let activeId = rootStore.get('activeProjectId', null);

// Helpers por projeto (namespacing de chaves)
const PKEY = (id,k)=> `${ROOT}:proj:${id}:${k}`;
const pstore = (id)=>({
  get:(k,f)=>{ try{const v=localStorage.getItem(PKEY(id,k)); return v?JSON.parse(v):f;}catch{return f} },
  set:(k,v)=>{ try{localStorage.setItem(PKEY(id,k), JSON.stringify(v));}catch{} },
  del:(k)=>{ try{localStorage.removeItem(PKEY(id,k));}catch{} }
});

// ===== Estado do projeto ativo =====
let state = null;  // preenchido por loadProject()

function defaultProjectState(){
  return {
    theme: 'minimal',
    goal: 60,
    logs: {},
    notes: '',
    areas: [],
    todayPick: [],
    examDate: '',
    topicsPerDay: 2,
    showDone: 'Não'
  };
}

// ===== UI: seleção de projeto =====
function renderProjectSelector(){
  const sel = $('#projectSelect');
  sel.innerHTML = projects.map(p=> `<option value="${p.id}" ${p.id===activeId?'selected':''}>${p.name}</option>`).join('')
    || '<option value="">(Crie um projeto)</option>';
}

function ensureFirstProject(){
  if(projects.length) return;
  let name = prompt('Como quer chamar seu primeiro projeto? (ex: TEOT 2026)');
  if(!name){ name = 'Meu Projeto'; }
  const id = `p_${Date.now().toString(36)}`;
  projects = [{id,name}];
  rootStore.set('projects', projects);
  // cria estado padrão
  const s = defaultProjectState();
  pstore(id).set('state', s);
  activeId = id; rootStore.set('activeProjectId', activeId);
}

function loadProject(id){
  const ps = pstore(id);
  state = ps.get('state', defaultProjectState());
  // hidrata campos simples de UI
  $('#examDate').value = state.examDate || '';
  $('#topicsPerDay').value = state.topicsPerDay || 2;
  $('#showDone').value = state.showDone || 'Não';
  applyTheme();
  // renderiza telas
  showTab('hoje');
  renderProgress(); renderLogTable(); renderAreas(); renderThemesTable(); refreshAttachAreas(); renderToday();
}

function saveProject(){
  if(!activeId) return;
  pstore(activeId).set('state', state);
}

function setActiveProject(id){
  activeId = id; rootStore.set('activeProjectId', id);
  loadProject(id);
}

function addProject(){
  let name = prompt('Nome do novo projeto (ex: Prova Y):');
  if(!name) return;
  const id = `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
  projects.push({id,name});
  rootStore.set('projects', projects);
  pstore(id).set('state', defaultProjectState());
  setActiveProject(id);
  renderProjectSelector();
}

function renameProject(){
  if(!activeId) return;
  const p = projects.find(x=>x.id===activeId); if(!p) return;
  const name = prompt('Novo nome do projeto:', p.name);
  if(!name) return;
  p.name = name; rootStore.set('projects', projects); renderProjectSelector();
}

function deleteProject(){
  if(!activeId) return;
  const p = projects.find(x=>x.id===activeId);
  if(!p) return;
  if(!confirm(`Excluir o projeto "${p.name}" e todos os dados dele?`)) return;

  // remove chaves do projeto
  const prefix = `${ROOT}:proj:${activeId}:`;
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith(prefix)) localStorage.removeItem(k);
  });

  projects = projects.filter(x=>x.id!==activeId);
  rootStore.set('projects', projects);
  if(projects.length){
    activeId = projects[0].id; rootStore.set('activeProjectId', activeId);
    loadProject(activeId);
  } else {
    activeId = null; rootStore.del('activeProjectId');
    ensureFirstProject(); renderProjectSelector(); loadProject(activeId);
  }
}

// binds seletor
$('#projectSelect')?.addEventListener('change', (e)=> setActiveProject(e.target.value));
$('#projectNew')?.addEventListener('click', addProject);
$('#projectRename')?.addEventListener('click', renameProject);
$('#projectDelete')?.addEventListener('click', deleteProject);

// ===== Theme (por projeto) =====
function applyTheme(){
  if(state.theme==='ludico'){ document.documentElement.setAttribute('data-theme','ludico'); $('#themeLabel').textContent='Lúdico'; }
  else { document.documentElement.removeAttribute('data-theme'); $('#themeLabel').textContent='Minimalista'; }
}
$('#themeToggle')?.addEventListener('click',()=>{
  state.theme = (state.theme==='minimal'?'ludico':'minimal');
  saveProject(); applyTheme();
});

// ===== Navegação =====
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

// ===== Progresso / Meta (por projeto) =====
function renderProgress(){
  const g=Number(state.goal||0)||0;
  const d=today(), done=state.logs[d]||0;
  const pct = g? Math.min(100, Math.round(done/g*100)) : 0;
  $('#progressBar').style.width=pct+'%';
  $('#progressLabel').textContent = `${done} / ${g} min`;
  $('#goalInput').value = g || '';
}
$('#saveGoal')?.addEventListener('click', ()=>{
  const v=Number($('#goalInput').value||0); state.goal=v>0?v:0; saveProject(); renderProgress(); alert('Meta salva!');
});
$('#addQuick15')?.addEventListener('click', ()=>{
  const d=today(); state.logs[d]=(state.logs[d]||0)+15; saveProject(); renderProgress(); renderLogTable();
});

// ===== Cronômetro =====
let tmr=null,startTs=null,accum=0;
const fmt=(ms)=>{const s=Math.floor(ms/1000);const h=String(Math.floor(s/3600)).padStart(2,'0');const m=String(Math.floor((s%3600)/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');return `${h}:${m}:${ss}`;};
function tick(){ $('#timerDisplay').textContent=fmt((startTs?Date.now()-startTs:0)+accum); }
$('#startTimer')?.addEventListener('click',()=>{ if(tmr) return; startTs=Date.now(); tmr=setInterval(tick,1000); });
$('#stopTimer')?.addEventListener('click',()=>{
  if(!tmr) return; clearInterval(tmr); tmr=null;
  const elapsed=(startTs?Date.now()-startTs:0); accum+=elapsed; startTs=null;
  const add=Math.max(0,Math.round(accum/60000)); if(add){ const d=today(); state.logs[d]=(state.logs[d]||0)+add; saveProject(); accum=0; renderProgress(); renderLogTable(); }
  tick();
});
$('#resetTimer')?.addEventListener('click',()=>{ if(tmr){clearInterval(tmr);tmr=null;} startTs=null;accum=0;tick(); });

// ===== Notas =====
$('#quickNotes').value = ''; // hidrata no loadProject
$('#saveNotes')?.addEventListener('click',()=>{ state.notes=$('#quickNotes').value; saveProject(); });
$('#clearNotes')?.addEventListener('click',()=>{ if(!confirm('Limpar?'))return; $('#quickNotes').value=''; state.notes=''; saveProject(); });

// ===== Log =====
function renderLogTable(){
  const body=$('#logBody'); const arr=Object.entries(state.logs||{}).sort((a,b)=>a[0]<b[0]?1:-1);
  body.innerHTML = arr.length? arr.map(([d,m])=>`<tr><td>${d}</td><td>${m}</td></tr>`).join('') : '<tr><td colspan="2">Nenhum registro ainda.</td></tr>';
}

// ===== Áreas / Temas (por projeto) =====
function recalcAreaProgress(a){ const L=a.children||[]; a.progress = L.length? Math.round(L.reduce((s,x)=>s+(Number(x.progress)||0),0)/L.length):0; }
$('#addArea')?.addEventListener('click', ()=>{
  const name=($('#areaName').value||'').trim(); if(!name) return alert('Informe o nome da área.');
  (state.areas ||= []).unshift({id:`a_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,name,progress:0,children:[]});
  $('#areaName').value=''; saveProject(); renderAreas(); renderThemesTable(); refreshAttachAreas();
});

function renderAreas(){
  const host=$('#areasList');
  if(!state.areas?.length){ host.innerHTML='<div class="card">Nenhuma área criada ainda.</div>'; return; }
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
    if(b.dataset.delArea){ if(!confirm('Excluir a área e subtemas?'))return; state.areas=state.areas.filter(x=>x.id!==b.dataset.delArea); saveProject(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return; }
    if(b.dataset.del){ const a=state.areas.find(x=>x.id===b.dataset.area); if(!a) return;
      if(!confirm('Excluir este subtema?'))return;
      a.children=(a.children||[]).filter(s=>s.id!==b.dataset.del); recalcAreaProgress(a); saveProject(); renderAreas(); renderThemesTable(); refreshAttachAreas(); return; }
    if(b.dataset.done){ markDoneToday(b.dataset.area,b.dataset.done); return; }
    if(b.dataset.open){ openSub(b.dataset.area,b.dataset.open); return; }
  };
}

// Tabela de temas
function allSubthemes(){
  const list=[]; (state.areas||[]).forEach(a=> (a.children||[]).forEach(s=> list.push({area:a.name, areaId:a.id, ...s})));
  return list;
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
      a.children=(a.children||[]).filter(s=>s.id!==b.dataset.del); recalcAreaProgress(a); saveProject(); renderAreas(); renderThemesTable(); refreshAttachAreas(); }
  };
}
function refreshAttachAreas(){
  const sel=$('#attachArea'), selB=$('#bulkArea');
  const opt=(state.areas||[]).map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  sel.innerHTML=opt||'<option value="">(Crie uma área primeiro)</option>';
  selB.innerHTML=opt||'<option value="">(Crie uma área primeiro)</option>';
}

// Adicionar tema
$('#addTheme')?.addEventListener('click', ()=>{
  const areaId=$('#attachArea').value; const a=(state.areas||[]).find(x=>x.id===areaId); if(!a) return alert('Selecione uma área.');
  const name=($('#newThemeName').value||'').trim(); if(!name) return alert('Informe o tema.');
  const prio=Number($('#newPriority').value||3);
  const diff=$('#newDifficulty').value||'média';
  const aula=$('#seenClass').value==='sim';
  const rend=$('#initialYield').value;
  const score=Number($('#initialScore').value||0);
  const notes=$('#newComment').value||'';

  (a.children ||= []).unshift({
    id:`s_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,
    name, notes, prioridade:prio, dificuldade:diff,
    aulaVista:aula, rendimento:rend, scoreInicial:score,
    status:'pendente', progress:0, log:{}
  });

  recalcAreaProgress(a); saveProject(); renderAreas(); renderThemesTable();
  $('#newThemeName').value=''; $('#newComment').value=''; $('#initialScore').value='';
});

// Adição em massa
$('#bulkToggle')?.addEventListener('click',()=> $('#bulkWrap').classList.toggle('hidden'));
$('#bulkAdd')?.addEventListener('click', ()=>{
  const areaId=$('#bulkArea').value; const a=(state.areas||[]).find(x=>x.id===areaId); if(!a) return alert('Selecione uma área.');
  const lines = ($('#bulkText').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  lines.forEach(line=>{
    let name=line, prio=3, dif='média', aula=false, rend='medio', score=0;
    const parts=line.split('|').map(s=>s.trim());
    if(parts.length>1){ name=parts[0]; parts.slice(1).forEach(p=>{
      const [k,vRaw]=p.split('=').map(x=>x.trim()); const v=vRaw?.toLowerCase?.()||'';
      if(k.toLowerCase()==='prio') prio=Number(v)||3;
      if(k.toLowerCase()==='dif') dif=(v==='alta'||v==='fácil'||v==='média')?v:'média';
      if(k.toLowerCase()==='aula') aula=(v==='sim');
      if(k.toLowerCase()==='rend') rend=(['ruim','medio','bom'].includes(v)?v:'medio');
      if(k.toLowerCase()==='score') score=Number(v)||0;
    });}
    (a.children ||= []).push({
      id:`s_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,
      name, notes:'', prioridade:prio, dificuldade:dif, aulaVista:aula, rendimento:rend, scoreInicial:score, status:'pendente', progress:0, log:{}
    });
  });
  recalcAreaProgress(a); saveProject(); renderAreas(); renderThemesTable(); $('#bulkText').value='';
});

// Backup por projeto
$('#backupExport')?.addEventListener('click', ()=>{
  const data = { projectId:activeId, projectName: (projects.find(p=>p.id===activeId)?.name||''), state };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`backup_${data.projectName||'projeto'}.json`; a.click();
});
$('#backupImport')?.addEventListener('change',(e)=>{
  const f=e.target.files?.[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{
    try{
      const obj=JSON.parse(String(r.result||'{}'));
      if(obj?.state){
        state = obj.state;
        saveProject();
        // Hidratar UI
        $('#quickNotes').value = state.notes||'';
        $('#examDate').value = state.examDate||'';
        $('#topicsPerDay').value = state.topicsPerDay||2;
        $('#showDone').value = state.showDone||'Não';
        applyTheme();
        renderProgress(); renderLogTable(); renderAreas(); renderThemesTable(); refreshAttachAreas(); renderToday();
        alert('Backup restaurado neste projeto!');
      } else alert('Arquivo inválido.');
    }catch{ alert('Falha ao importar.'); }
  }; r.readAsText(f);
});

// ===== Gerador do dia (mesmo motor da v5.6, escopo do projeto) =====
function difficultyWeight(d){ if(d==='alta')return 1.0; if(d==='média')return 0.8; return 0.6; }
function rendimentoFactor(r){ if(r==='ruim')return 2; if(r==='medio')return 1; return 0; }
function lastStudyPenalty(s){
  const last=Object.keys(s.log||{}).sort().slice(-1)[0]; if(!last) return 5;
  const diff=(new Date().setHours(0,0,0,0)-new Date(last).getTime())/(1000*60*60*24);
  return Math.min(10, Math.max(0, Math.round(diff/3)));
}
function scoreSub(s){
  const prio=Number(s.prioridade||3);
  const prog=100-Number(s.progress||0);
  return prio*2 + prog*0.4 + difficultyWeight(s.dificuldade||'média')*0.8 + rendimentoFactor(s.rendimento||'medio') + lastStudyPenalty(s);
}
function suggestedAction(s){
  if(!s.aulaVista) return {kind:'aula', text:'Assistir aula/ler conteúdo + fazer questões', cls:'bad'};
  if((s.rendimento||'medio')==='bom' || (s.scoreInicial||0)>=70) return {kind:'ativa', text:'Revisão ativa: questões/flashcards', cls:'good'};
  if((s.rendimento||'medio')==='medio' || ((s.scoreInicial||0)>=40&&(s.scoreInicial||0)<70)) return {kind:'mista', text:'Resumo rápido + questões/flashcards', cls:'warn'};
  return {kind:'aula', text:'Revisão passiva (aula/resumo) + questões leves', cls:'bad'};
}
function daysToExam(){
  const v=$('#examDate').value; if(!v) return '-';
  const d=(new Date(v).getTime() - new Date().setHours(0,0,0,0))/(1000*60*60*24);
  return d>=0? Math.round(d) : '-';
}
function allSubthemes(){ const list=[]; (state.areas||[]).forEach(a=> (a.children||[]).forEach(s=> list.push({area:a.name, areaId:a.id, ...s}))); return list; }

$('#examDate')?.addEventListener('change',()=>{ state.examDate=$('#examDate').value||''; saveProject(); renderToday(); });
$('#topicsPerDay')?.addEventListener('change',()=>{ state.topicsPerDay=Math.max(1,Number($('#topicsPerDay').value||2)); saveProject(); });
$('#showDone')?.addEventListener('change',()=>{ state.showDone=$('#showDone').value; saveProject(); renderToday(); });

function generateToday(){
  const perDay=Math.max(1, Number($('#topicsPerDay').value||2));
  const subs=allSubthemes().sort((a,b)=> scoreSub(b)-scoreSub(a));
  const pick=subs.slice(0,perDay).map(x=>({areaId:x.areaId, subId:x.id}));
  state.todayPick=pick; saveProject(); renderToday();
}
function clearToday(){ state.todayPick=[]; saveProject(); renderToday(); }

function renderToday(){
  $('#kpiDays').textContent = `Dias até a prova: ${daysToExam()}`;
  const host=$('#todayList'); host.innerHTML='';
  const showDone = (state.showDone==='Sim');

  // hidratar notas
  $('#quickNotes').value = state.notes || '';

  let doneCount=0;
  state.todayPick.forEach(p=>{
    const a=(state.areas||[]).find(x=>x.id===p.areaId); const s=a?.children?.find(z=>z.id===p.subId); if(!a||!s) return;
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
    if(btn.dataset.open){ openSub(btn.dataset.area,btn.dataset.open); return; }
    if(btn.dataset.done){
      // Confirmação de feedback básico (v6.0B vai aprofundar)
      if(!confirm('Confirmar conclusão desta atividade?')) return;
      markDoneToday(btn.dataset.area,btn.dataset.done); renderToday(); return;
    }
    if(btn.dataset.remove){
      state.todayPick = state.todayPick.filter(x=> !(x.areaId===btn.dataset.area && x.subId===btn.dataset.remove));
      saveProject(); renderToday();
    }
  };
}
$('#genToday')?.addEventListener('click', generateToday);
$('#clearToday')?.addEventListener('click', clearToday);
$('#btnPlan')?.addEventListener('click', generateToday);

// ===== Ações comuns =====
function markDoneToday(areaId, subId){
  const a=(state.areas||[]).find(x=>x.id===areaId); if(!a) return;
  const s=a.children?.find(z=>z.id===subId); if(!s) return;
  s.status='feito';
  s.progress = Math.min(100, Number(s.progress||0)+20);
  const d=today(); s.log[d]=(s.log[d]||0)+1;
  recalcAreaProgress(a); saveProject();
  renderAreas(); renderThemesTable(); renderProgress(); renderLogTable();
}

function openSub(areaId, subId){
  const a=(state.areas||[]).find(x=>x.id===areaId); if(!a) return;
  const s=a.children?.find(z=>z.id===subId); if(!s) return;
  const wrap=document.createElement('div');
  wrap.className='modal';
  wrap.innerHTML=`
    <div class="card" style="max-width:760px;margin:8vh auto;background:#0f131c">
      <h3>${a.name} → ${s.name}</h3>
      <p class="muted">Edite com cuidado. Em breve (v6.0B) algumas edições ficarão bloqueadas durante a execução de atividades para manter a integridade do algoritmo.</p>
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
    recalcAreaProgress(a); saveProject(); renderAreas(); renderThemesTable(); renderToday(); wrap.remove();
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

// ===== Init geral =====
function init(){
  // Garantir que exista ao menos um projeto
  ensureFirstProject();
  renderProjectSelector();
  setActiveProject(activeId || projects[0]?.id);

  // Binds do gerador/hoje
  // (já definidos acima)
  // Forçar timer 00:00:00 na primeira carga
  $('#timerDisplay') && ($('#timerDisplay').textContent='00:00:00');
}
document.addEventListener('DOMContentLoaded', init);
