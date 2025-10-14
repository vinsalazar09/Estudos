// v4.0 — Gerenciador de Pastas (criar/renomear/excluir) + lista básica

(function(){
  if(!window.dados) window.dados={pastas:[],temas:[]};
  if(!Array.isArray(dados.pastas)) dados.pastas=[];
  if(!Array.isArray(dados.temas)) dados.temas=[];
  if(typeof window.salvar!=="function") window.salvar=()=>localStorage.setItem("vEstudosData", JSON.stringify(dados));

  const pastasDiv=document.getElementById("pastas");
  const btnNova = document.getElementById("btnNovaPasta");
  const btnRenomear = document.getElementById("btnRenomearPasta");
  const btnExcluir = document.getElementById("btnExcluirPasta");

  // Modal
  const modal=document.getElementById("modalPastas");
  const modalTitulo=document.getElementById("modalTitulo");
  const modalHint=document.getElementById("modalHint");
  const modalObs=document.getElementById("modalObs");
  const modalSelect=document.getElementById("modalSelect");
  const modalInput=document.getElementById("modalInput");
  const modalCancelar=document.getElementById("modalCancelar");
  const modalConfirmar=document.getElementById("modalConfirmar");

  let mode=null, lastEdited=null;

  function cssId(s){ return String(s).replace(/\s+/g,'-').replace(/[^\w\-]/g,'').toLowerCase(); }
  function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
  function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
  const sum = a => a.reduce((x,y)=>x+(Number(y)||0),0);

  function suggestionFromFolder(nome, temas){
    const acertos=sum(temas.map(t=>t.acertos||0)), erros=sum(temas.map(t=>t.erros||0));
    const pend=temas.some(t=>t.proximaRevisao && daysBetween(todayISO(), t.proximaRevisao)<=0);
    const score=(pend?2:0)+(erros>acertos?2:0);
    if(score>=3) return "🧠 Reforçar questões (revisão ativa)";
    if(pend) return "📘 Revisar teoria";
    return "🩻 Estudo teórico + resumo";
  }

  function renderPastas(){
    if(!pastasDiv) return;
    pastasDiv.innerHTML="";
    if(!dados.pastas.length){
      const c=document.createElement("div"); c.className="card";
      c.innerHTML=`<div class="muted">Nenhuma pasta. Use “➕ Nova Pasta”.</div>`;
      pastasDiv.appendChild(c); return;
    }
    dados.pastas.forEach(nome=>{
      const temas=dados.temas.filter(t=>t.pasta===nome);
      const concl=temas.filter(t=>t.status==="Concluído").length;
      const pendRev=temas.filter(t=>t.proximaRevisao && daysBetween(todayISO(),t.proximaRevisao)<=0).length;

      const card=document.createElement("div"); card.className="card";
      if(lastEdited===nome) card.style.boxShadow="0 0 0 2px rgba(110,168,254,.65)";
      card.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <div>
            <strong>${nome}</strong>
            <div class="muted" style="font-size:12px;margin-top:2px;">Temas: <b>${temas.length}</b> • Concluídos: <b>${concl}</b> • Revisões pendentes: <b>${pendRev}</b></div>
          </div>
          <div><span class="pill">${suggestionFromFolder(nome, temas)}</span></div>
        </div>
        <div class="temaToolbar" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;margin-bottom:4px;">
          <button class="small primary" data-addtema="${nome}">➕ Adicionar tema</button>
        </div>
        <div id="temas-${cssId(nome)}"></div>
      `;
      pastasDiv.appendChild(card);
    });
    // deixa a listagem de temas para o themeManager renderizar
    window.dispatchEvent(new CustomEvent("dados:changed"));
  }

  function openModal(m){
    mode=m; modal.style.display="flex"; modalInput.value=""; modalSelect.innerHTML=""; modalObs.textContent="";
    if(m==="novo"){
      modalTitulo.textContent="Nova Pasta"; modalHint.textContent="Digite um nome para a nova pasta.";
      modalSelect.style.display="none"; modalInput.style.display="block"; modalInput.focus();
    }
    if(m==="renomear"){
      modalTitulo.textContent="Renomear Pasta"; modalHint.textContent="Escolha e informe o novo nome.";
      fillSelect(); modalSelect.style.display="inline-block"; modalInput.style.display="inline-block";
    }
    if(m==="excluir"){
      modalTitulo.textContent="Excluir Pasta"; modalHint.textContent="Escolha a pasta a excluir (temas permanecem).";
      fillSelect(); modalSelect.style.display="inline-block"; modalInput.style.display="none";
      modalObs.textContent="Os temas dessa pasta não serão apagados; ficarão sem pasta até você mover.";
    }
  }
  function closeModal(){ modal.style.display="none"; mode=null; }
  modalCancelar.addEventListener("click", closeModal);
  modal.addEventListener("click", e=>{ if(e.target===modal) closeModal(); });

  function fillSelect(){
    modalSelect.innerHTML="";
    dados.pastas.forEach(p=>{
      const o=document.createElement("option"); o.value=p; o.textContent=p; modalSelect.appendChild(o);
    });
  }

  btnNova?.addEventListener("click",()=>openModal("novo"));
  btnRenomear?.addEventListener("click",()=>openModal("renomear"));
  btnExcluir?.addEventListener("click",()=>openModal("excluir"));

  modalConfirmar.addEventListener("click",()=>{
    if(mode==="novo"){
      const nome=(modalInput.value||"").trim(); if(!nome) return alert("Informe um nome.");
      if(dados.pastas.includes(nome)) return alert("Já existe uma pasta com esse nome.");
      dados.pastas.push(nome); lastEdited=nome; salvar(); renderPastas(); return closeModal();
    }
    if(mode==="renomear"){
      const old=modalSelect.value, novo=(modalInput.value||"").trim();
      if(!old||!novo) return alert("Preencha tudo.");
      if(dados.pastas.includes(novo)) return alert("Já existe uma pasta com esse nome.");
      const idx=dados.pastas.indexOf(old); if(idx>=0) dados.pastas[idx]=novo;
      dados.temas.forEach(t=>{ if(t.pasta===old) t.pasta=novo; });
      lastEdited=novo; salvar(); renderPastas(); return closeModal();
    }
    if(mode==="excluir"){
      const alvo=modalSelect.value; if(!alvo) return alert("Escolha a pasta.");
      if(!confirm(`Excluir “${alvo}”? Temas ficam sem pasta.`)) return;
      dados.pastas = dados.pastas.filter(p=>p!==alvo);
      dados.temas.forEach(t=>{ if(t.pasta===alvo) t.pasta=""; });
      lastEdited=null; salvar(); renderPastas(); return closeModal();
    }
  });

  // Botão "Adicionar tema" (delegação)
  pastasDiv?.addEventListener("click",(e)=>{
    const btn=e.target.closest("[data-addtema]"); if(!btn) return;
    const pasta=btn.getAttribute("data-addtema");
    window.dispatchEvent(new CustomEvent("tema:novo",{detail:{pasta}}));
  });

  renderPastas();
  window.addEventListener("dados:changed", renderPastas);
})();
