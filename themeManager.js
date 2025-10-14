// v4.0 — Gerenciador de Temas/Atividades + revisão espaçada

(function(){
  if(!window.dados) window.dados={pastas:[],temas:[]};
  if(!Array.isArray(dados.temas)) dados.temas=[];
  if(typeof window.salvar!=="function") window.salvar=()=>localStorage.setItem("vEstudosData", JSON.stringify(dados));

  const modal=document.getElementById("modalTema");
  const titulo=document.getElementById("temaTitulo");
  const hint=document.getElementById("temaHint");
  const info=document.getElementById("temaInfo");
  const selPasta=document.getElementById("temaPasta");
  const inpNome=document.getElementById("temaNome");
  const selTipo=document.getElementById("temaTipo");
  const inpAE=document.getElementById("temaAE");
  const selDiff=document.getElementById("temaDiff");
  const selStatus=document.getElementById("temaStatus");
  const txtObs=document.getElementById("temaObs");
  const btCancelar=document.getElementById("temaCancelar");
  const btSalvar=document.getElementById("temaSalvar");

  let editId=null, presetPasta="";

  function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
  function addDays(iso,n){ const d=new Date(iso); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }

  function calcProxRev(diff,tipo,baseISO){
    const base=baseISO||todayISO();
    let seq=[1,3,7,15,30];
    if(diff==="Alta") seq=[1,2,4,7,15];
    if(diff==="Fácil") seq=[2,4,7,15,30];
    if(tipo.includes("Quest")) seq=seq.map(x=>Math.max(1,x-1));
    return addDays(base, seq[0]);
  }

  function fillPastas(){
    selPasta.innerHTML=""; (dados.pastas||[]).forEach(p=>{ const o=document.createElement("option"); o.value=p;o.textContent=p; selPasta.appendChild(o); });
  }

  function openModal(pasta=""){
    presetPasta=pasta||""; editId=null; fillPastas();
    titulo.textContent="Novo Tema"; hint.textContent="Preencha os dados da atividade.";
    if(presetPasta) selPasta.value=presetPasta;
    inpNome.value=""; selTipo.value="Aula"; inpAE.value="0/0"; selDiff.value="Média"; selStatus.value="Concluído"; txtObs.value=""; info.textContent="";
    modal.style.display="flex";
  }
  function openEdit(tema){
    editId=tema.id; fillPastas();
    titulo.textContent="Editar Tema"; hint.textContent="Atualize os dados da atividade.";
    selPasta.value=tema.pasta||""; inpNome.value=tema.nome||"";
    selTipo.value=tema.tipo||"Aula"; inpAE.value=`${tema.acertos||0}/${(tema.acertos||0)+(tema.erros||0)}`;
    selDiff.value=tema.dificuldade||"Média"; selStatus.value=tema.status||"Concluído";
    txtObs.value=tema.obs||""; info.textContent=tema.proximaRevisao?`Próxima revisão: ${tema.proximaRevisao}`:"";
    modal.style.display="flex";
  }
  function close(){ modal.style.display="none"; presetPasta=""; editId=null; }
  btCancelar.addEventListener("click", close);
  modal.addEventListener("click", e=>{ if(e.target===modal) close(); });

  function parseAE(s){
    const m=String(s||"0/0").match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if(!m) return {acertos:0,erros:0};
    const a=+m[1], total=+m[2]; return {acertos:a,erros:Math.max(0,total-a)};
  }

  btSalvar.addEventListener("click",()=>{
    const pasta=selPasta.value, nome=inpNome.value.trim();
    if(!pasta) return alert("Escolha a pasta."); if(!nome) return alert("Informe o nome do tema.");
    const {acertos,erros}=parseAE(inpAE.value);
    const dificuldade=selDiff.value, tipo=selTipo.value, status=selStatus.value, obs=txtObs.value.trim();
    const hoje=todayISO();

    if(editId){
      const t=dados.temas.find(x=>x.id===editId); if(!t) return alert("Tema não encontrado.");
      Object.assign(t,{pasta,nome,tipo,acertos,erros,dificuldade,status,obs,data:hoje,proximaRevisao:calcProxRev(dificuldade,tipo,hoje)});
    } else {
      const id="t_"+Math.random().toString(36).slice(2,9);
      dados.temas.push({id,pasta,nome,tipo,acertos,erros,dificuldade,status,obs,data:hoje,proximaRevisao:calcProxRev(dificuldade,tipo,hoje)});
    }
    salvar(); close(); renderTemasInPastas(); window.dispatchEvent(new CustomEvent("dados:changed"));
  });

  function cssId(s){ return String(s).replace(/\s+/g,'-').replace(/[^\w\-]/g,'').toLowerCase(); }

  function renderTemasInPastas(){
    (dados.pastas||[]).forEach(p=>{
      const el=document.querySelector(`#temas-${cssId(p)}`); if(!el) return;
      const temas=(dados.temas||[]).filter(t=>t.pasta===p);
      if(!temas.length){ el.innerHTML=`<span class="muted">Sem temas nesta pasta. Clique em “➕ Adicionar tema”.</span>`; return; }
      el.innerHTML=`
        <div style="overflow:auto;">
          <table>
            <thead><tr>
              <th>Tema</th><th>Atividade</th><th>Acertos/Erros</th><th>Dificuldade</th><th>Status</th><th>Data</th><th>Próx. revisão</th><th>Ações</th>
            </tr></thead>
            <tbody id="tbody-${cssId(p)}"></tbody>
          </table>
        </div>`;
      const tb=el.querySelector(`#tbody-${cssId(p)}`);
      temas.sort((a,b)=> (a.status==="Concluído")-(b.status==="Concluído") || (new Date(b.data)-new Date(a.data)) )
           .forEach(t=>{
        const tr=document.createElement("tr");
        tr.innerHTML=`
          <td>${t.nome}</td><td>${t.tipo}</td><td>${t.acertos||0}/${(t.acertos||0)+(t.erros||0)}</td>
          <td>${t.dificuldade||"-"}</td><td>${t.status||"-"}</td><td>${t.data||"-"}</td><td>${t.proximaRevisao||"-"}</td>
          <td><button class="small" data-edit="${t.id}">✏️</button> <button class="small" data-del="${t.id}">🗑️</button></td>`;
        tb.appendChild(tr);
      });
      el.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{
        const id=b.getAttribute("data-edit"); const tema=(dados.temas||[]).find(x=>x.id===id); if(tema) openEdit(tema);
      }));
      el.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
        const id=b.getAttribute("data-del"); const tema=(dados.temas||[]).find(x=>x.id===id); if(!tema) return;
        if(!confirm(`Excluir o tema “${tema.nome}”?`)) return;
        dados.temas=dados.temas.filter(x=>x.id!==id); salvar(); renderTemasInPastas(); window.dispatchEvent(new CustomEvent("dados:changed"));
      }));
    });
  }

  // eventos
  window.addEventListener("dados:changed", renderTemasInPastas);
  const tabTemas=document.querySelector('.tab[data-tab="temas"]'); tabTemas?.addEventListener("click", renderTemasInPastas);
  window.addEventListener("tema:novo", (ev)=>openModal(ev.detail?.pasta||""));

  // primeira carga
  renderTemasInPastas();
})();
