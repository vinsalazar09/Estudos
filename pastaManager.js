// pastaManager.js — v3.4.0
// Gerenciador visual de pastas: criar, renomear, excluir + integração com temas e stats

(function(){
  if (!window.dados) window.dados = { pastas: [], temas: [] };
  if (!Array.isArray(window.dados.pastas)) window.dados.pastas = [];
  if (!Array.isArray(window.dados.temas)) window.dados.temas = [];
  if (typeof window.salvar !== "function") window.salvar = () => localStorage.setItem("vEstudosData", JSON.stringify(window.dados));

  const pastasDiv = document.getElementById("pastas");
  const btnNova = document.getElementById("btnNovaPasta");
  const btnRenomear = document.getElementById("btnRenomearPasta");
  const btnExcluir = document.getElementById("btnExcluirPasta");

  const modal = document.getElementById("modalPastas");
  const modalTitulo = document.getElementById("modalTitulo");
  const modalHint = document.getElementById("modalHint");
  const modalObs = document.getElementById("modalObs");
  const modalSelect = document.getElementById("modalSelect");
  const modalInput = document.getElementById("modalInput");
  const modalCancelar = document.getElementById("modalCancelar");
  const modalConfirmar = document.getElementById("modalConfirmar");

  let mode = null;
  let lastEdited = null;

  function renderPastasEnhanced(){
    if(!pastasDiv) return;
    pastasDiv.innerHTML = "";

    if (!window.dados.pastas.length) {
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = `<div class="muted">Nenhuma pasta criada ainda. Use “➕ Nova Pasta”.</div>`;
      pastasDiv.appendChild(c);
      return;
    }

    window.dados.pastas.forEach(nome => {
      const temasDaPasta = window.dados.temas.filter(t => t.pasta === nome);
      const concluidos = temasDaPasta.filter(t => t.status === "concluido").length;
      const total = temasDaPasta.length;
      const revisoesPend = temasDaPasta.filter(t => t.proximaRevisao && (daysBetween(todayISO(), t.proximaRevisao) <= 0)).length;

      const card = document.createElement("div");
      card.className = "card";
      if (lastEdited && lastEdited === nome) card.style.boxShadow = "0 0 0 2px rgba(110,168,254,.65)";

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <div>
            <strong>${nome}</strong>
            <div class="muted" style="font-size:12px; margin-top:2px;">
              Temas: <b>${total}</b> • Concluídos: <b>${concluidos}</b> • Revisões pendentes: <b>${revisoesPend}</b>
            </div>
          </div>
          <div>
            <span class="pill">${suggestionFromFolder(nome, temasDaPasta)}</span>
          </div>
        </div>
        <div style="margin-top:8px;" id="temas-${cssId(nome)}"></div>
      `;

      const temasBox = card.querySelector(`#temas-${cssId(nome)}`);
      if (temasDaPasta.length === 0) {
        temasBox.innerHTML = `<span class="muted">Sem temas nesta pasta.</span>`;
      } else {
        temasDaPasta.forEach(t => {
          const el = document.createElement("span");
          el.className = "pill";
          el.textContent = t.nome || t.tema || "(sem nome)";
          temasBox.appendChild(el);
        });
      }

      pastasDiv.appendChild(card);
    });
  }

  function suggestionFromFolder(nome, temas){
    const erros = sum(temas.map(t=>t.erros||0));
    const acertos = sum(temas.map(t=>t.acertos||0));
    const revisao = temas.some(t => t.proximaRevisao && daysBetween(todayISO(), t.proximaRevisao) <= 0);
    const score = (revisao?2:0)+(erros>acertos?2:0);
    if(score>=3) return "🧠 Reforçar questões";
    if(revisao) return "📘 Revisar teoria";
    return "🩻 Estudo teórico";
  }

  function openModal(m){
    mode = m;
    modal.style.display = "flex";
    modalInput.value = "";
    modalSelect.innerHTML = "";
    modalObs.textContent = "";

    if (mode === "novo") {
      modalTitulo.textContent = "Nova Pasta";
      modalHint.textContent = "Digite um nome para a nova pasta.";
      modalSelect.style.display = "none";
      modalInput.style.display = "block";
      modalInput.focus();
    }
    if (mode === "renomear") {
      modalTitulo.textContent = "Renomear Pasta";
      modalHint.textContent = "Escolha a pasta e informe o novo nome.";
      fillSelect();
      modalSelect.style.display = "inline-block";
      modalInput.style.display = "inline-block";
    }
    if (mode === "excluir") {
      modalTitulo.textContent = "Excluir Pasta";
      modalHint.textContent = "Escolha a pasta a excluir. Temas dentro não serão apagados.";
      fillSelect();
      modalSelect.style.display = "inline-block";
      modalInput.style.display = "none";
    }
  }

  function closeModal(){ modal.style.display = "none"; mode = null; }
  modalCancelar.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if(e.target===modal) closeModal(); });

  btnNova?.addEventListener("click", ()=> openModal("novo"));
  btnRenomear?.addEventListener("click", ()=> openModal("renomear"));
  btnExcluir?.addEventListener("click", ()=> openModal("excluir"));

  modalConfirmar.addEventListener("click", ()=>{
    if (mode === "novo") {
      const nome = modalInput.value.trim();
      if (!nome) return alert("Informe um nome.");
      if (window.dados.pastas.includes(nome)) return alert("Já existe uma pasta com esse nome.");
      window.dados.pastas.push(nome);
      lastEdited = nome;
      window.salvar();
      renderPastasEnhanced();
      closeModal();
      return;
    }

    if (mode === "renomear") {
      const old = modalSelect.value;
      const novo = modalInput.value.trim();
      if (!old || !novo) return alert("Preencha tudo.");
      const i = window.dados.pastas.indexOf(old);
      if (i>=0) window.dados.pastas[i] = novo;
      window.dados.temas.forEach(t => { if(t.pasta===old) t.pasta = novo; });
      lastEdited = novo;
      window.salvar();
      renderPastasEnhanced();
      closeModal();
      return;
    }

    if (mode === "excluir") {
      const alvo = modalSelect.value;
      if (!alvo) return alert("Escolha a pasta.");
      if (!confirm(`Excluir a pasta “${alvo}”? Temas não serão apagados.`)) return;
      window.dados.pastas = window.dados.pastas.filter(p => p!==alvo);
      window.dados.temas.forEach(t => { if(t.pasta===alvo) t.pasta=""; });
      lastEdited = null;
      window.salvar();
      renderPastasEnhanced();
      closeModal();
    }
  });

  function fillSelect(){
    modalSelect.innerHTML = "";
    window.dados.pastas.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p; opt.textContent = p;
      modalSelect.appendChild(opt);
    });
  }
  function cssId(s){return s.replace(/\s+/g,'-').toLowerCase();}
  function sum(a){return a.reduce((x,y)=>x+(Number(y)||0),0);}
  function todayISO(){const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);}
  function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000);}

  renderPastasEnhanced();
})();
