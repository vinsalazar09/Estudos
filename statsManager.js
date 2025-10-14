// statsManager.js — v3.5.0
// Geração automática de estatísticas e gráficos por pasta

(function(){
  if (!window.dados) window.dados = { pastas: [], temas: [] };
  const statsDiv = document.getElementById("graficos");
  if (!statsDiv) return;

  function gerarEstatisticas(){
    statsDiv.innerHTML = "";
    if (!window.dados.pastas.length){
      statsDiv.innerHTML = `<div class="muted">Nenhuma pasta cadastrada ainda.</div>`;
      return;
    }

    window.dados.pastas.forEach(pasta => {
      const temas = window.dados.temas.filter(t => t.pasta === pasta);
      if (!temas.length) return;

      const total = temas.length;
      const concluidos = temas.filter(t => t.status === "concluido").length;
      const revisoesPend = temas.filter(t => t.proximaRevisao && (daysBetween(todayISO(), t.proximaRevisao) <= 0)).length;
      const acertos = sum(temas.map(t => t.acertos || 0));
      const erros = sum(temas.map(t => t.erros || 0));
      const totalTentativas = acertos + erros;
      const taxaAcerto = totalTentativas ? Math.round((acertos / totalTentativas) * 100) : 0;

      const percConcl = Math.round((concluidos / total) * 100);
      const percRevisao = Math.round((revisoesPend / total) * 100);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h4>${pasta}</h4>
        <div class="muted" style="font-size:13px;margin-bottom:6px;">
          Total de temas: <b>${total}</b> • Concluídos: <b>${concluidos}</b> • Revisões pendentes: <b>${revisoesPend}</b>
        </div>
        <div style="margin-bottom:6px;">
          <div style="font-size:12px;">Progresso geral:</div>
          <div class="barWrap"><div class="bar azul" style="width:${percConcl}%;"></div></div>
        </div>
        <div style="margin-bottom:6px;">
          <div style="font-size:12px;">Revisões pendentes:</div>
          <div class="barWrap"><div class="bar amarela" style="width:${percRevisao}%;"></div></div>
        </div>
        <div style="margin-bottom:6px;">
          <div style="font-size:12px;">Taxa de acerto:</div>
          <div class="barWrap"><div class="bar verde" style="width:${taxaAcerto}%;"></div></div>
        </div>
        <div class="muted" style="font-size:12px;">✅ ${taxaAcerto}% acertos — 🔁 ${percRevisao}% revisões pendentes</div>
      `;
      statsDiv.appendChild(card);
    });
  }

  function todayISO(){const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);}
  function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000);}
  function sum(a){return a.reduce((x,y)=>x+(Number(y)||0),0);}

  // Estilos para barras
  const style = document.createElement("style");
  style.textContent = `
    .barWrap{width:100%;height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden;margin-top:2px;}
    .bar{height:8px;border-radius:4px;transition:width 0.8s ease;}
    .azul{background:#6ea8fe;}
    .verde{background:#4cd37b;}
    .amarela{background:#e8d86e;}
  `;
  document.head.appendChild(style);

  // Botão “Analisar agora”
  const btn = document.createElement("button");
  btn.textContent = "🔍 Analisar agora";
  btn.className = "small primary";
  btn.style.marginBottom = "10px";
  btn.onclick = () => {
    gerarEstatisticas();
    btn.textContent = "✅ Análise concluída";
    setTimeout(()=>btn.textContent="🔍 Analisar agora", 2500);
  };
  statsDiv.before(btn);

  // Geração automática inicial
  gerarEstatisticas();

  console.log("📊 statsManager.js — v3.5.0 carregado com sucesso");
})();
