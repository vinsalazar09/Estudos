// V Estudos v4.0 — núcleo (abas, tema, backup, SW, dados base)

// Abas
document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).style.display="block";
  });
});

// Atualizar app (service worker)
document.getElementById("btnUpdate")?.addEventListener("click",async()=>{
  if("serviceWorker" in navigator){
    const regs = await navigator.serviceWorker.getRegistrations();
    for(const r of regs) await r.unregister();
    const keys = await caches.keys();
    for(const k of keys) await caches.delete(k);
    location.reload(true);
  } else alert("Seu navegador não suporta SW.");
});

// Tema claro/escuro
(function(){
  const body=document.body, btn=document.getElementById("toggleTheme");
  function apply(){ const t=localStorage.getItem("v_theme")||"dark"; body.classList.toggle("light", t==="light"); body.style.background = t==="light" ? "#f5f5f5" : "linear-gradient(135deg,#0f0f0f,#1f1f1f)"; body.style.color = t==="light" ? "#222" : "#e8eef6"; }
  btn?.addEventListener("click",()=>{ const t=localStorage.getItem("v_theme")==="light"?"dark":"light"; localStorage.setItem("v_theme",t); apply(); });
  apply();
})();

// Backup
const backupBtn=document.getElementById("backupBtn");
const restoreBtn=document.getElementById("restoreBtn");
const fileInput=document.getElementById("fileInput");
backupBtn?.addEventListener("click",()=>{
  const data = localStorage.getItem("vEstudosData")||"{}";
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  a.download=`Backup_VEstudos_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});
restoreBtn?.addEventListener("click",()=>fileInput.click());
fileInput?.addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload = ev => { localStorage.setItem("vEstudosData", ev.target.result); alert("Dados restaurados!"); location.reload(); };
  r.readAsText(f);
});

// Tutorial
document.getElementById("tutorialBtn")?.addEventListener("click",()=>window.open("tutorial.html","_blank"));

// Dados base
let dados = JSON.parse(localStorage.getItem("vEstudosData")||"{}");
if(!dados.pastas) dados.pastas = [
  "Trauma membro superior","Trauma membro inferior","Trauma infantil",
  "Ortopedia pediátrica","Ombro e cotovelo","Mão","Coluna",
  "Quadril","Joelho","Pé e tornozelo","Tumores"
];
if(!dados.temas) dados.temas=[];
if(!dados.config) dados.config={ blockMin:30, descansoDomingo:true };
if(!dados.disponibilidade){
  dados.disponibilidade = { // horas
    seg:2, ter:0, qua:3, qui:0, sex:2, sab:4, dom:0
  };
}
if(!dados.planos) dados.planos = { hoje:[], semana:[] };

function salvar(){ localStorage.setItem("vEstudosData", JSON.stringify(dados)); }
window.dados=dados; window.salvar=salvar;

// Service Worker
if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js"); }

// Inputs padrão datas
const hojeInput = document.getElementById("hojeData");
const semIni = document.getElementById("semanaInicio");
if(hojeInput){ const d=new Date(); hojeInput.value = d.toISOString().slice(0,10); }
if(semIni){
  const d=new Date(); const day=d.getDay(); // 0 dom .. 6 sab
  const diff=(day===0?0:7-day); d.setDate(d.getDate()+diff); // próximo domingo
  semIni.value = d.toISOString().slice(0,10);
}

// Feedback
document.getElementById("sendFeedback")?.addEventListener("click",()=>{
  const t=document.getElementById("feedbackText").value.trim();
  if(!t) return;
  document.getElementById("feedbackResult").textContent="Obrigado pelo feedback! ✅";
  document.getElementById("feedbackText").value="";
});
