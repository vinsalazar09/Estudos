// v6.0B.2A - Plataforma Inteligente de Estudos

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const state = { project:null, style:null, areas:[], exam:{}, schedule:'' };

$('#startProject').onclick = ()=>{
  const name = $('#projectName').value.trim();
  if(!name) return alert('Dê um nome ao seu projeto.');
  state.project = name;
  state.style = document.querySelector('.style-btn.active')?.dataset.style || 'minimalista';
  $('#projTitle').textContent = name;
  $('#gate').classList.add('hidden');
  $('#dashboard').classList.remove('hidden');
  localStorage.setItem('project', name);
};

$$('.style-btn').forEach(b=>b.onclick=()=>$$('.style-btn').forEach(x=>x.classList.remove('active')) || b.classList.add('active'));

$$('[data-tab]').forEach(b=>b.onclick=()=>{
  const tab=b.dataset.tab;
  $$('.tab').forEach(t=>t.classList.add('hidden'));
  $('#tab-'+tab).classList.remove('hidden');
});

// Áreas e temas
$('#addArea').onclick=()=>{
  const val=$('#areaName').value.trim();
  if(!val) return;
  const area={name:val,subs:[]};
  state.areas.push(area);
  renderAreas();
  $('#areaName').value='';
};
function renderAreas(){
  const el=$('#areasList');
  if(!el) return;
  el.innerHTML=state.areas.map(a=>`
    <div class="h-card">
      <strong>${a.name}</strong>
      <input placeholder="Novo subtema" data-area="${a.name}" class="subIn">
      <button data-addsub="${a.name}">Adicionar</button>
      <div>${a.subs.map(s=>`<div class="box">${s}</div>`).join('')}</div>
    </div>`).join('');
  $$('[data-addsub]').forEach(b=>b.onclick=()=>{
    const nm=b.dataset.addsub;
    const input=document.querySelector('[data-area="'+nm+'"]');
    const val=input.value.trim();
    if(!val) return;
    const area=state.areas.find(x=>x.name===nm);
    area.subs.push(val);
    renderAreas();
  });
}

// Salvar prova
$('#saveExam').onclick=()=>{
  state.exam={
    name:$('#examName').value,
    date:$('#examDate').value,
    type:$('#examType').value,
    notes:$('#examNotes').value
  };
  localStorage.setItem('exam',JSON.stringify(state.exam));
  alert('Informações salvas!');
};

// Salvar programa
$('#saveSchedule').onclick=()=>{
  state.schedule=$('#studySchedule').value;
  localStorage.setItem('schedule',state.schedule);
  alert('Programa salvo!');
};

// IA
$$('[data-ia]').forEach(b=>b.onclick=()=>{
  const provider=b.dataset.ia;
  const prompt=$('#iaPrompt').value.trim()||'Gerar plano de estudos para '+(state.project||'meu objetivo');
  const urlMap={
    chatgpt:'https://chat.openai.com/',
    claude:'https://claude.ai/',
    perplexity:'https://www.perplexity.ai/'
  };
  window.open(urlMap[provider],'_blank');
  alert('Abra a IA e cole o prompt:\n\n'+prompt);
});

// Gerar atividade
$('#generatePlan').onclick=()=>{
  $('#feedbackArea').innerHTML='<p>🪄 Gerando atividade personalizada com base no progresso...</p>';
  setTimeout(()=>$('#feedbackArea').innerHTML='<p>✅ Atividade gerada! Complete-a e registre seu feedback.</p>',2000);
};
