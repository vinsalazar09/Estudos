// ===== Plataforma de Estudos Inteligente — Ortopedia (v5.2) =====

// ===== Utilidades =====
const $ = s => document.querySelector(s);
const store = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const today = () => new Date().toISOString().slice(0, 10);

// ===== Estado Global =====
const state = {
  goal: store.get('goal') || 60,
  logs: store.get('logs') || {},
  notes: store.get('notes') || '',
  areas: store.get('areas') || []
};

// ===== Renderizar Progresso =====
function renderProgress() {
  const done = state.logs[today()] || 0;
  const goal = state.goal || 0;
  const percent = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const bar = document.getElementById('progressBar');
  if (bar) bar.style.width = percent + '%';
  const label = document.getElementById('progressLabel');
  if (label) label.textContent = `${done} / ${goal} min`;
}

// ===== Salvar Meta =====
document.getElementById('saveGoal')?.addEventListener('click', () => {
  const val = Number(document.getElementById('goalInput').value) || 0;
  state.goal = val;
  store.set('goal', val);
  renderProgress();
  alert('Meta diária salva com sucesso!');
});

// ===== +15 min rápido =====
document.getElementById('addQuick15')?.addEventListener('click', () => {
  const d = today();
  state.logs[d] = (state.logs[d] || 0) + 15;
  store.set('logs', state.logs);
  renderProgress();
  renderLogTable();
});

// ===== Notas rápidas =====
const areaNotes = $('#quickNotes');
if (areaNotes) areaNotes.value = state.notes || '';
$('#saveNotes')?.addEventListener('click', () => {
  state.notes = areaNotes.value;
  store.set('notes', state.notes);
});
$('#clearNotes')?.addEventListener('click', () => {
  if (!confirm('Deseja limpar todas as notas?')) return;
  areaNotes.value = '';
  state.notes = '';
  store.set('notes', '');
});

// ===== Log Diário =====
function renderLogTable() {
  const body = $('#logBody');
  if (!body) return;
  const entries = Object.entries(state.logs).sort((a, b) => a[0] < b[0] ? 1 : -1);
  if (!entries.length) {
    body.innerHTML = '<tr><td colspan="2">Nenhum registro ainda.</td></tr>';
    return;
  }
  body.innerHTML = entries.map(([date, min]) => `<tr><td>${date}</td><td>${min}</td></tr>`).join('');
}

// ===== Áreas e Subtemas =====
function uid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 10); }
function saveAreas() { store.set('areas', state.areas); }
function renderAreas() {
  const list = $('#areasList');
  if (!list) return;
  if (!state.areas.length) {
    list.innerHTML = '<p class="muted">Nenhuma área criada ainda.</p>';
    return;
  }
  list.innerHTML = state.areas.map(a => `
    <div class="h-card">
      <h3>${a.name}</h3>
      ${(a.children || []).map(s => `<div class="sub"><strong>${s.name}</strong></div>`).join('')}
    </div>`).join('');
}
$('#addArea')?.addEventListener('click', () => {
  const name = ($('#areaName')?.value || '').trim();
  if (!name) return alert('Informe o nome da área.');
  state.areas.push({ id: uid('a'), name, children: [] });
  saveAreas();
  renderAreas();
});

// ===== Inicialização =====
function init() {
  renderProgress();
  renderLogTable();
  renderAreas();
}
init();
