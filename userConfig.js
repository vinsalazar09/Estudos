// v4.0 — Configura disponibilidade semanal e preferências

(function(){
  if(!window.dados) window.dados={disponibilidade:{},config:{},pastas:[],temas:[]};
  if(!dados.disponibilidade) dados.disponibilidade={seg:2,ter:0,qua:3,qui:0,sex:2,sab:4,dom:0};
  if(!dados.config) dados.config={ blockMin:30, descansoDomingo:true };

  const dispEl=document.getElementById("configDisponibilidade");
  const prefEl=document.getElementById("configPreferencias");

  function renderDisp(){
    if(!dispEl) return;
    dispEl.innerHTML=`
      <table>
        <thead><tr><th>Dia</th><th>Horas livres</th></tr></thead>
        <tbody>
          ${linha("Segunda","seg")}${linha("Terça","ter")}${linha("Quarta","qua")}
          ${linha("Quinta","qui")}${linha("Sexta","sex")}${linha("Sábado","sab")}${linha("Domingo","dom")}
        </tbody>
      </table>
    `;
    function linha(nome,key){ const v=dados.disponibilidade[key]??0;
      return `<tr><td>${nome}</td><td><input type="number" min="0" step="0.5" value="${v}" data-dia="${key}" style="width:100px"></td></tr>`;
    }
    dispEl.querySelectorAll("input[data-dia]").forEach(inp=>{
      inp.addEventListener("change",()=>{ const k=inp.getAttribute("data-dia"); dados.disponibilidade[k]=+inp.value||0; salvar(); });
    });
  }

  function renderPref(){
    if(!prefEl) return;
    prefEl.innerHTML=`
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div>
          <label class="muted" style="font-size:12px;">Tamanho do bloco (min)</label><br>
          <select id="prefBlock" style="min-width:140px;">
            <option ${sel(20)}>20</option><option ${sel(30)}>30</option>
            <option ${sel(45)}>45</option><option ${sel(60)}>60</option>
          </select>
        </div>
        <div>
          <label class="muted" style="font-size:12px;">Descanso no domingo</label><br>
          <select id="prefDom" style="min-width:140px;">
            <option value="true" ${dados.config.descansoDomingo?"selected":""}>Sim</option>
            <option value="false" ${!dados.config.descansoDomingo?"selected":""}>Não</option>
          </select>
        </div>
      </div>
    `;
    function sel(n){ return (dados.config.blockMin===n)?"selected":""; }
    document.getElementById("prefBlock").addEventListener("change",e=>{ dados.config.blockMin=+e.target.value; salvar(); });
    document.getElementById("prefDom").addEventListener("change",e=>{ dados.config.descansoDomingo=(e.target.value==="true"); salvar(); });
  }

  renderDisp(); renderPref();
})();
