// v4.0 — Algoritmo de Cronograma (dia e semana)

(function(){
  if(!window.dados) return;
  const btnDia=document.getElementById("btnGerarHoje");
  const btnSem=document.getElementById("btnGerarSemana");
  const hojeInput=document.getElementById("hojeData");
  const semIni=document.getElementById("semanaInicio");
  const planHojeEl=document.getElementById("plan-hoje");
  const planSemEl=document.getElementById("plan-semana");

  function weekdayKey(d){ const wd=new Date(d).getDay(); return ["dom","seg","ter","qua","qui","sex","sab"][wd]; }

  function prioridadeTema(t, hojeISO){
    let score=0;
    // pendência de revisão vence mais pontos
    if(t.proximaRevisao){
      const diff = (new Date(t.proximaRevisao)-new Date(hojeISO))/86400000;
      if(diff<=0) score+=5; else if(diff<=2) score+=3;
    }
    // desempenho
    const tent=(t.acertos||0)+(t.erros||0);
    const taxa=tent? (t.acertos/tent): 0;
    if(taxa<0.6) score+=3; else if(taxa<0.8) score+=2;
    // dificuldade
    if(t.dificuldade==="Alta") score+=2; else if(t.dificuldade==="Média") score+=1;
    // recenticidade (não repetir o mesmo de ontem)
    if(t.data===hojeISO) score-=2;
    return score;
  }

  function gerarPlanoDia(iso){
    const hojeISO = iso || new Date().toISOString().slice(0,10);
    const wd = weekdayKey(hojeISO);
    const horas = (dados.disponibilidade?.[wd] ?? 0);
    const block = dados.config.blockMin || 30;
    const totalMin = Math.max(0, Math.round(horas*60));
    const slots = Math.floor(totalMin / block);

    planHojeEl.innerHTML="";
    if(!slots){ planHojeEl.innerHTML=`<div class="muted">Sem horas disponíveis hoje.</div>`; dados.planos.hoje=[]; salvar(); return; }

    // ordenar temas por prioridade
    const candidatos = (dados.temas||[]).slice().sort((a,b)=> prioridadeTema(b,hojeISO)-prioridadeTema(a,hojeISO));
    const plano=[];
    let usados=0;

    for(const t of candidatos){
      if(usados>=slots) break;
      let tipoSug = "Revisão Passiva";
      if(t.proximaRevisao && new Date(t.proximaRevisao)<=new Date(hojeISO)) tipoSug="Revisão Ativa";
      else if((t.acertos||0)/(((t.acertos||0)+(t.erros||0))||1) < 0.7) tipoSug="Questões";
      else tipoSug = (t.tipo||"Aula");

      plano.push({pasta:t.pasta, tema:t.nome, tipo:tipoSug, duracaoMin:block, motivo:`pri=${prioridadeTema(t,hojeISO)}`});
      usados++;
    }

    if(!plano.length){ planHojeEl.innerHTML=`<div class="muted">Nada pendente. Sugestão: estudo teórico de tema recente.</div>`; }
    else {
      const ul=document.createElement("ul"); ul.style.margin="0"; ul.style.paddingLeft="18px";
      plano.forEach(i=>{
        const li=document.createElement("li");
        li.innerHTML = `<b>${i.tema}</b> <span class="muted">(${i.pasta})</span> — ${i.tipo} • ${i.duracaoMin}min <span class="muted">[${i.motivo}]</span>`;
        ul.appendChild(li);
      });
      planHojeEl.appendChild(ul);
    }

    dados.planos.hoje = plano; salvar();
  }

  function gerarPlanoSemana(inicioISO){
    const d0 = new Date(inicioISO || new Date().toISOString().slice(0,10)); d0.setHours(0,0,0,0);
    planSemEl.innerHTML="";

    const wrap=document.createElement("div");
    for(let i=0;i<7;i++){
      const d=new Date(d0); d.setDate(d0.getDate()+i);
      const iso=d.toISOString().slice(0,10);
      const wd=weekdayKey(iso);
      const horas=(dados.disponibilidade?.[wd]??0);
      const block=dados.config.blockMin||30;
      const slots=Math.floor(Math.max(0,Math.round(horas*60))/block);

      const dayDiv=document.createElement("div"); dayDiv.className="card";
      dayDiv.innerHTML=`<strong>${iso}</strong> — <span class="muted">${wd.toUpperCase()}</span> • ${horas}h`;
      const list=document.createElement("ul"); list.style.margin="6px 0 0 18px";

      if(slots===0){ list.innerHTML=`<span class="muted">Sem horas.</span>`; }
      else{
        // Reuso do algoritmo diário, mas mantendo “memória” simples pra semana
        const candidatos=(dados.temas||[]).slice().sort((a,b)=> prioridadeTema(b,iso)-prioridadeTema(a,iso));
        let usados=0;
        for(const t of candidatos){
          if(usados>=slots) break;
          let tipoSug="Revisão Passiva";
          if(t.proximaRevisao && new Date(t.proximaRevisao)<=new Date(iso)) tipoSug="Revisão Ativa";
          else if((t.acertos||0)/(((t.acertos||0)+(t.erros||0))||1) < 0.7) tipoSug="Questões";
          else tipoSug=(t.tipo||"Aula");
          const li=document.createElement("li");
          li.innerHTML=`<b>${t.nome}</b> <span class="muted">(${t.pasta})</span> — ${tipoSug} • ${block}min`;
          list.appendChild(li);
          usados++;
        }
      }
      dayDiv.appendChild(list);
      wrap.appendChild(dayDiv);
    }
    planSemEl.appendChild(wrap);
    dados.planos.semana = planSemEl.innerHTML; salvar();
  }

  // Botões
  btnDia?.addEventListener("click",()=> gerarPlanoDia(hojeInput?.value));
  btnSem?.addEventListener("click",()=> gerarPlanoSemana(semIni?.value));

  // Gera na primeira vista da aba "Hoje/Semana"
  const tabHoje=document.querySelector('.tab[data-tab="hoje"]');
  const tabSemana=document.querySelector('.tab[data-tab="semana"]');
  tabHoje?.addEventListener("click",()=> gerarPlanoDia(hojeInput?.value));
  tabSemana?.addEventListener("click",()=> gerarPlanoSemana(semIni?.value));
})();
