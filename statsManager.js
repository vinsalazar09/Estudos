// v4.0 — Estatísticas por pasta

(function(){
  if(!window.dados) window.dados={pastas:[],temas:[]};
  const statsDiv=document.getElementById("graficos"); if(!statsDiv) return;

  function sum(a){return a.reduce((x,y)=>x+(Number(y)||0),0);}
  function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
  function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }

  function gerar(){
    statsDiv.innerHTML="";
    if(!dados.pastas.length){ statsDiv.innerHTML=`<div class="muted">Nenhuma pasta cadastrada.</div>`; return; }

    dados.pastas.forEach(p=>{
      const temas=dados.temas.filter(t=>t.pasta===p);
      if(!temas.length) return;
      const total=temas.length;
      const concl=temas.filter(t=>t.status==="Concluído").length;
      const pend=temas.filter(t=>t.proximaRevisao && daysBetween(todayISO(),t.proximaRevisao)<=0).length;
      const ac=sum(temas.map(t=>t.acertos||0)), er=sum(temas.map(t=>t.erros||0));
      const tent=ac+er, taxa=tent?Math.round((ac/tent)*100):0;
      const pc=Math.round((concl/total)*100), pr=Math.round((pend/total)*100);

      const card=document.createElement("div"); card.className="card";
      card.innerHTML=`
        <h4>${p}</h4>
        <div class="muted" style="font-size:13px;margin-bottom:6px;">
          Temas: <b>${total}</b> • Concluídos: <b>${concl}</b> • Revisões pendentes: <b>${pend}</b>
        </div>
        <div style="margin-bottom:6px;"><div style="font-size:12px;">Progresso:</div><div class="barWrap"><div class="bar azul" style="width:${pc}%;"></div></div></div>
        <div style="margin-bottom:6px;"><div style="font-size:12px;">Revisões pendentes:</div><div class="barWrap"><div class="bar amarela" style="width:${pr}%;"></div></div></div>
        <div style="margin-bottom:6px;"><div style="font-size:12px;">Taxa de acerto:</div><div class="barWrap"><div class="bar verde" style="width:${taxa}%;"></div></div></div>
        <div class="muted" style="font-size:12px;">✅ ${taxa}% acertos — 🔁 ${pr}% revisões pendentes</div>
      `;
      statsDiv.appendChild(card);
    });
  }

  const style=document.createElement("style");
  style.textContent=`.barWrap{width:100%;height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden;margin-top:2px;}
  .bar{height:8px;border-radius:4px;transition:width .8s ease;}
  .azul{background:#6ea8fe}.verde{background:#4cd37b}.amarela{background:#e8d86e}`;
  document.head.appendChild(style);

  document.getElementById("btnAnalisar")?.addEventListener("click",function(){ gerar(); this.textContent="✅ Análise concluída"; setTimeout(()=>this.textContent="🔍 Analisar agora",2000); });

  gerar();
  window.addEventListener("dados:changed", gerar);
})();
