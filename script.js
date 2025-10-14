// Plataforma Ortopedia — JS simples e robusto (localStorage + try/catch)
(function(){
  const SCOPE = 'ortopedia_teot_v1';
  const nowKey = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD

  // Helpers de storage seguros
  const store = {
    get(k, fallback){
      try { const v = localStorage.getItem(`${SCOPE}:${k}`); return v? JSON.parse(v) : fallback; } catch(e){ return fallback; }
    },
    set(k, v){
      try { localStorage.setItem(`${SCOPE}:${k}`, JSON.stringify(v)); } catch(e){ /* storage cheio ou bloqueado */ }
    },
    remove(k){ try{ localStorage.removeItem(`${SCOPE}:${k}`);}catch(e){} }
  };

  // Estado inicial
  const state = {
    goalMin: store.get('dailyGoal', 60),
    logs: store.get('studyLogs', {}), // { 'YYYY-MM-DD': totalMin }
    notes: store.get('quickNotes', '')
  };

  // ---- UI binding (só se existir na página) ----
  const $ = sel => document.querySelector(sel);

  // Meta diária
  const goalInput = $('#dailyGoal');
  const goalStatus = $('#goalStatus');
  const progressText = $('#progressText');
  const progressBar = $('#progressBar');
  function renderGoal(){
    if(!progressText || !progressBar) return;
    const day = nowKey();
    const total = (state.logs[day] || 0);
    const goal = Math.max(0, Number(state.goalMin||0));
    const pct = goal>0 ? Math.min(100, Math.round((total/goal)*100)) : 0;
    progressBar.style.width = pct + '%';
    progressText.textContent = `${total} / ${goal} min`;
    if(goalStatus) goalStatus.textContent = goal ? `Meta do dia: ${goal} min` : 'Defina uma meta para acompanhar.';
    if(goalInput) goalInput.value = goal || '';
  }
  const goalForm = $('#dailyGoalForm');
  if(goalForm){
    goalForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const val = Number(goalInput.value||0);
      state.goalMin = Math.max(0, val);
      store.set('dailyGoal', state.goalMin);
      renderGoal();
    });
  }

  // Cronômetro simples
  let timer = null, startTs = null, accMs = 0;
  const timerDisplay = $('#timerDisplay');
  const startBtn = $('#startTimer'), stopBtn = $('#stopTimer'), resetBtn = $('#resetTimer');
  function fmt(ms){
    const s = Math.floor(ms/1000);
    const hh = String(Math.floor(s/3600)).padStart(2,'0');
    const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  }
  function tick(){
    if(timerDisplay){
      const elapsed = (startTs? (Date.now()-startTs):0) + accMs;
      timerDisplay.textContent = fmt(elapsed);
    }
  }
  if(startBtn){
    startBtn.addEventListener('click', ()=>{
      if(timer) return;
      startTs = Date.now();
      timer = setInterval(tick, 1000);
    });
  }
  if(stopBtn){
    stopBtn.addEventListener('click', ()=>{
      if(!timer) return;
      clearInterval(timer); timer = null;
      const elapsed = (startTs? (Date.now()-startTs):0); accMs += elapsed; startTs = null;
      // Converte para minutos inteiros e salva no dia
      const addMin = Math.max(0, Math.round(accMs/60000));
      if(addMin>0){
        const day = nowKey();
        state.logs[day] = (state.logs[day]||0) + addMin;
        store.set('studyLogs', state.logs);
        accMs = 0;
        renderGoal();
      }
      tick();
    });
  }
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      if(timer){ clearInterval(timer); timer = null; }
      accMs = 0; startTs = null; tick();
    });
  }

  const quick15 = $('#addQuick15');
  if(quick15){
    quick15.addEventListener('click', ()=>{
      const day = nowKey();
      state.logs[day] = (state.logs[day]||0) + 15;
      store.set('studyLogs', state.logs);
      renderGoal();
    });
  }

  // Notas rápidas
  const notesArea = $('#quickNotes');
  const saveNotes = $('#saveNotes');
  const clearNotes = $('#clearNotes');
  if(notesArea){ notesArea.value = state.notes || ''; }
  if(saveNotes){
    saveNotes.addEventListener('click', ()=>{
      const val = (notesArea && notesArea.value) || '';
      state.notes = val; store.set('quickNotes', state.notes);
    });
  }
  if(clearNotes){
    clearNotes.addEventListener('click', ()=>{
      if(notesArea) notesArea.value='';
      state.notes=''; store.set('quickNotes', '');
    });
  }

  // Checklists modulares (em páginas de módulo)
  // Qualquer <input type="checkbox" data-key="..."> será persistido por página
  function bindModuleChecklist(){
    const boxes = document.querySelectorAll('input[type="checkbox"][data-key]');
    if(!boxes.length) return;
    const pageKey = location.pathname.split('/').pop() || 'page';
    const saved = store.get('check:'+pageKey, {});
    boxes.forEach(cb=>{
      const key = cb.getAttribute('data-key');
      cb.checked = !!saved[key];
      cb.addEventListener('change', ()=>{
        const curr = store.get('check:'+pageKey, {});
        curr[key] = cb.checked ? 1 : 0;
        store.set('check:'+pageKey, curr);
      });
    });
  }

  // Inicializa
  renderGoal(); tick(); bindModuleChecklist();
})();
