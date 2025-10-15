// Plataforma de Estudos Inteligente — v5.3 (completa)
// Funciona só em localStorage. Sem libs externas.

// =============== Helpers & Storage ===============
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const SKEY = (k) => `estudos_v53:${k}`;
const store = {
  get: (k, fallback) => {
    try { const v = localStorage.getItem(SKEY(k)); return v? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(SKEY(k), JSON.stringify(v)); } catch {} }
};

const today = () => new Date().toISOString().slice(0,10);
const uid   = (p) => `${p}_${Math.random().toString(36).slice(2,10)}`;
const esc   = (s='') => s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// =============== Estado ===============
const state = {
  goal:  store.get('goal', 60),
  logs:  store.get('logs', {}),
  notes: store.get('notes',''),
  areas: store.get('areas', []) // [{id,name,progress,children:[{id,name,notes,progress,log:{day:min}}]}]
};

// =============== Abas (Início/Hierarquia) ===============
function hookTabs(){
  const sections = { home: $('#home'), hierarquia: $('#hierarquia') };
  function show(tab){
    $$('.h-row .btn[data-tab], header .btn[data-tab]').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
    Object.keys(sections).forEach(k => sections[k].style.display = (k===tab? '':'none'));
  }
  $$('button[data-tab]').forEach(b => b.addEventListener('click', ()=> show(b.dataset.tab)));
  // abre sempre no Início
  show('home');
}

// =============== Progresso/Meta ===============
function renderProgress(){
  const g = Number(state.goal||0) || 0;
  const d = today();
  const done = state.logs[d] || 0;
  const pct = g? Math.min(100, Math.round(done/g*100)) : 0;
  const bar = $('#progressBar'); if(bar) bar.style.width = pct+'%';
  const label = $('#progressLabel'); if(label) label.textContent = `${done} / ${g} min`;
  const input = $('#goalInput'); if(input) input.value = g || '';
}

function saveGoal(){
  const val = Number($('#goalInput')?.value||0);
  state.goal = val>0? val : 0;
  store.set('goal', state.goal);
  renderProgress();
  alert('Meta diária salva!');
}

function addQuick15(){
  const d = today();
  state.logs[d] = (state.logs[d]||0) + 15;
  store.set('logs', state.logs);
  renderProgress();
  renderLogTable();
}

// =============== Cronômetro (opcional) ===============
let tmr=null, startTs=null, accum=0;
const fmt = (ms)=>{
  const s=Math.floor(ms/1000);
  const h=String(Math.floor(s/3600)).padStart(2,'0');
  const m=String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss=String(s%60).padStart(2,'0');
  return `${h}:${m}:${ss}`;
};

function tick(){
  const disp=$('#timerDisplay');
  if(!disp) return;
  const elapsed = (startTs? Date.now()-startTs : 0) + accum;
  disp.textContent = fmt(elapsed);
}

function startTimer(){
  if(tmr) return;
  startTs = Date.now();
  tmr = setInterval(tick,1000);
}

function stopTimer(){
  if(!tmr) return;
  clearInterval(tmr); tmr=null;
  const elapsed = (startTs? Date.now()-startTs : 0);
  accum += elapsed; startTs=null;
  const addMin = Math.max(0, Math.round(accum/60000));
  if(addMin){
    const d=today();
    state.logs[d]=(state.logs[d]||0)+addMin;
    store.set('logs', state.logs);
    accum=0; tick(); renderProgress(); renderLogTable();
  }
}

function resetTimer(){
  if(tmr){ clearInterval(tmr); tmr=null; }
  startTs=null; accum=0; tick();
}

function hookTimerCollapse(){
  $('[data-collapse="timer"]')?.addEventListener('click', ()=>{
    const el=$('#timerWrap');
    el.style.display = (el.style.display==='block'? 'none':'block');
  });
}

// =============== Notas rápidas ===============
function loadNotes(){
  const ta=$('#quickNotes');
  if(ta) ta.value = state.notes || '';
}
function saveNotes(){
  const ta=$('#quickNotes'); if(!ta) return;
  state.notes = ta.value;
  store.set('notes', state.notes);
}
function clearNotes(){
  if(!confirm('Limpar todas as notas?')) return;
  const ta=$('#quickNotes'); if(ta) ta.value='';
  state.notes='';
  store.set('notes','');
}

// =============== Log do dia ("Hoje em Foco") ===============
function renderLogTable(){
  const body=$('#logBody'); if(!body) return;
  const entries = Object.entries(state.logs).sort((a,b)=> a[0]<b[0]?1:-1);
  if(!entries.length){ body.innerHTML='<tr><td colspan="2">Nenhum registro ainda.</td></tr>'; return; }
  body.innerHTML = entries.map(([date,min])=> `<tr><td>${date}</td><td>${min}</td></tr>`).join('');
}

// =============== Hierarquia (Áreas → Subtemas) ===============
function saveAreas(){ store.set('areas', state.areas); }

function recalcAreaProgress(area){
  const list = area.children||[];
  area.progress = list.length? Math.round(list.reduce((acc,s)=> acc + (Number(s.progress)||0),0)/list.length) : 0;
}

function addArea(){
  const name = ($('#areaName')?.value||'').trim();
  if(!name) return alert('Informe o nome da área.');
  state.areas.unshift({ id:uid('a'), name, progress:0, children:[] });
  $('#areaName').value='';
  saveAreas(); renderAreas();
}

function addSub(areaId){
  const ar = state.areas.find(a=>a.id===areaId); if(!ar) return;
  const input = $(`[data-area-input="${areaId}"]`);
  const name = (input?.value||'').trim();
  if(!name) return alert('Informe o nome do subtema.');
  (ar.children ||= []).unshift({ id:uid('s'), name, notes:'', progress:0, log:{} });
  input.value=''; recalcAreaProgress(ar); saveAreas(); renderAreas();
}

function delArea(areaId){
  if(!confirm('Excluir esta área e todos os subtemas?')) return;
  state.areas = state.areas.filter(a=>a.id!==areaId);
  saveAreas(); renderAreas();
}

function delSub(areaId, subId){
  const ar = state.areas.find(a=>a.id===areaId); if(!ar) return;
  if(!confirm('Excluir este subtema?')) return;
  ar.children = (ar.children||[]).filter(s=>s.id!==subId);
  recalcAreaProgress(ar); saveAreas(); renderAreas();
}

function openSub(areaId, subId){
  const ar = state.areas.find(a=>a.id===areaId); if(!ar) return;
  const st = (ar.children||[]).find(s=>s.id===subId); if(!st) return;

  const wrap = document.createElement('div');
  wrap.className='modal-backdrop';
  wrap.innerHTML = `
    <div class="modal">
      <h2 style="margin-top:0">${esc(ar.name)} → ${esc(st.name)}</h2>
      <label>Progresso (%):</label>
      <input type="number" id="p_edit" min="0" max="100" value="${Math.round(st.progress||0)}" style="width:140px;margin:.35rem 0 1rem"/>
      <label>Notas:</label>
      <textarea id="n_edit" rows="10" placeholder="Anote conteúdo, Q&A, referências...">${(st.notes||'').replace(/</g,'&lt;')}</textarea>
      <div class="btn-row" style="margin-top:.8rem">
        <button id="saveSub" class="btn">Salvar</button>
        <button id="exportSub" class="btn ghost">Exportar .txt</button>
        <button id="closeSub" class="btn secondary">Fechar</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  $('#closeSub',wrap).onclick = ()=> wrap.remove();
  $('#saveSub',wrap).onclick  = ()=>{
    const p = Math.max(0, Math.min(100, Number($('#p_edit',wrap).value||0)));
    const n = $('#n_edit',wrap).value||'';
    st.progress=p; st.notes=n; recalcAreaProgress(ar); saveAreas(); renderAreas(); wrap.remove();
  };
  $('#exportSub',wrap).onclick = ()=>{
    const blob = new Blob([`# ${ar.name} → ${st.name}\n\nProgresso: ${Math.round(st.progress||0)}%\n\nNotas:\n${st.notes||''}`], {type:'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${ar.name} - ${st.name}.txt`; document.body.appendChild(a); a.click(); a.remove();
  };

  // fechar clicando no fundo
  wrap.addEventListener('click', (e)=> { if(e.target===wrap) wrap.remove(); });
}

function renderAreas(){
  const host = $('#areasList'); if(!host) return;
  if(!state.areas.length){ host.innerHTML = '<p class="muted">Nenhuma área criada ainda.</p>'; return; }

  host.innerHTML = state.areas.map(a=>{
    const subs = (a.children||[]).map(s=>`
      <div class="box" style="display:flex;justify-content:space-between;align-items:center;margin:.5rem 0">
        <div><strong>${esc(s.name)}</strong><br/><small class="muted">Progresso: ${Math.round(s.progress||0)}%</small></div>
        <div class="btn-row">
          <button class="btn" data-act="open-sub" data-area="${a.id}" data-id="${s.id}">Abrir</button>
          <button class="btn secondary" data-act="del-sub" data-area="${a.id}" data-id="${s.id}">Excluir</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="h-card">
        <h3>${esc(a.name)} <span class="badge">${Math.round(a.progress||0)}%</span></h3>
        <div class="h-row">
          <input type="text" placeholder="Novo subtema (ex.: Sd Manguito Rotador)" data-area-input="${a.id}" style="flex:1">
          <button class="btn" data-act="add-sub" data-area="${a.id}">Adicionar Subtema</button>
          <button class="btn secondary" data-act="del-area" data-area="${a.id}">Excluir Área</button>
        </div>
        <div style="margin-top:.5rem">${subs || '<p class="muted">Sem subtemas ainda.</p>'}</div>
      </div>
    `;
  }).join('');

  // binds
  $$('[data-act="add-sub"]', host).forEach(b=> b.addEventListener('click', ()=> addSub(b.dataset.area)));
  $$('[data-act="del-area"]', host).forEach(b=> b.addEventListener('click', ()=> delArea(b.dataset.area)));
  $$('[data-act="del-sub"]', host).forEach(b=> b.addEventListener('click', ()=> delSub(b.dataset.area, b.dataset.id)));
  $$('[data-act="open-sub"]', host).forEach(b=> b.addEventListener('click', ()=> openSub(b.dataset.area, b.dataset.id)));
}

// =============== Gerar Atividade (plano do dia) ===============
function minutesRemaining(){
  const g = Number(state.goal||0)||0;
  const d = today();
  const done = state.logs[d]||0;
  return Math.max(0, g - done);
}
function flatSubsSorted(){
  const list=[];
  state.areas.forEach(a => (a.children||[]).forEach(s=>{
    list.push({ areaId:a.id, areaName:a.name, subId:s.id, subName:s.name, progress:Number(s.progress||0) });
  }));
  return list.sort((x,y)=> x.progress - y.progress); // prioriza menor progresso
}
function planBlocks(total){
  const subs = flatSubsSorted();
  if(!subs.length) return { blocks:[], note:'Crie áreas e subtemas na aba Hierarquia.' };
  let rest = Math.max(0,total), i=0, blocks=[];
  while(rest>0 && i<subs.length){
    const slot = Math.min(25, rest);
    blocks.push({ ...subs[i], minutes: slot });
    rest -= slot; i++;
  }
  return { blocks, note: rest>0 ? `Sobraram ${rest} min` : '' };
}
function showPlanModal(){
  const wrap=document.createElement('div'); wrap.className='modal-backdrop';
  const defaultTime = minutesRemaining() || 25;
  const plan = planBlocks(defaultTime);
  wrap.innerHTML = `
    <div class="modal">
      <h2 style="margin-top:0">🪄 Atividade do Dia</h2>
      <p class="muted">Gerado com base na sua meta, no que já fez hoje e no progresso por subtemas.</p>
      <label>Tempo disponível agora (min):</label>
      <input type="number" id="availMin" min="10" step="5" value="${defaultTime}" style="max-width:150px;margin:.35rem 0"/>
      <div class="h-row" style="align-items:center">
        <label style="display:flex;gap:.5rem;align-items:center">
          <input type="checkbox" id="useTimer"/> <span>Iniciar com cronômetro</span>
        </label>
      </div>
      <div id="planList" style="margin:.75rem 0">${renderBlocksList(plan.blocks)}</div>
      <div class="btn-row">
        <button id="regen" class="btn ghost">Regenerar</button>
        <button id="startPlan" class="btn">Começar agora</button>
        <button id="closePlan" class="btn secondary">Fechar</button>
      </div>
      <small class="muted">${plan.note||''}</small>
    </div>`;
  document.body.appendChild(wrap);

  function renderBlocksList(blocks){
    if(!blocks.length) return '<p class="muted">Nenhum subtema sugerido. Crie itens na aba Hierarquia.</p>';
    return blocks.map((b,idx)=>`
      <div class="box" style="display:flex;justify-content:space-between;align-items:center;margin:.5rem 0">
        <div>
          <strong>${esc(b.areaName)}</strong> → ${esc(b.subName)}<br/>
          <small class="muted">Progresso atual: ${Math.round(b.progress)}%</small>
        </div>
        <div class="h-row" style="align-items:center">
          <span class="badge">${b.minutes} min</span>
          <label style="display:flex;gap:.35rem;align-items:center">
            <input type="radio" name="chosen" value="${idx}" ${idx===0?'checked':''}/> foco
          </label>
        </div>
      </div>
    `).join('');
  }

  $('#regen',wrap).onclick = ()=>{
    const t = Math.max(10, Number($('#availMin',wrap).value||0));
    const p = planBlocks(t);
    $('#planList',wrap).innerHTML = renderBlocksList(p.blocks);
  };
  $('#closePlan',wrap).onclick = ()=> wrap.remove();
  $('#startPlan',wrap).onclick = ()=>{
    const radios = $$('input[name="chosen"]',wrap);
    let idx=0; radios.forEach(r=>{ if(r.checked) idx = Number(r.value) });
    const t = Math.max(10, Number($('#availMin',wrap).value||0));
    const p = planBlocks(t);
    const chosen = p.blocks[idx];
    if(!chosen){ alert('Crie áreas e subtemas primeiro.'); return; }

    // abrir subtema escolhido
    $$('button[data-tab]').find(b=>b.dataset.tab==='hierarquia')?.click();
    setTimeout(()=> openSub(chosen.areaId, chosen.subId), 80);

    // iniciar cronômetro se marcado
    if($('#useTimer',wrap).checked){
      $$('button[data-tab]').find(b=>b.dataset.tab==='home')?.click();
      const wrapT = $('#timerWrap'); wrapT.style.display='block';
      setTimeout(()=> $('#startTimer')?.click(), 120);
    }
    wrap.remove();
  };

  wrap.addEventListener('click', (e)=>{ if(e.target===wrap) wrap.remove(); });
}

// =============== Bind de eventos ===============
function bindEvents(){
  $('#saveGoal')    ?.addEventListener('click', saveGoal);
  $('#addQuick15')  ?.addEventListener('click', addQuick15);
  $('#startTimer')  ?.addEventListener('click', startTimer);
  $('#stopTimer')   ?.addEventListener('click', stopTimer);
  $('#resetTimer')  ?.addEventListener('click', resetTimer);
  $('#saveNotes')   ?.addEventListener('click', saveNotes);
  $('#clearNotes')  ?.addEventListener('click', clearNotes);
  $('#addArea')     ?.addEventListener('click', addArea);
  $('#generatePlan')?.addEventListener('click', showPlanModal);
  hookTimerCollapse();
}

// =============== Init ===============
function init(){
  hookTabs();
  bindEvents();
  loadNotes();
  renderProgress();
  renderLogTable();
  renderAreas();
  // timer display inicial
  tick();
}

document.addEventListener('DOMContentLoaded', init);
