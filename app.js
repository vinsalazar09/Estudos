// V Estudos — Cronograma Inteligente v3.1 Final
// Controle de abas, cronograma, temas, backup e IA adaptativa

// --- Alternância de abas ---
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).style.display = "block";
  });
});

// --- Atualização do app (Service Worker) ---
document.getElementById("btnUpdate").addEventListener("click", async () => {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (let reg of regs) reg.unregister();
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    location.reload(true);
  } else {
    alert("Seu navegador não suporta atualização automática.");
  }
});

// --- Tema claro/escuro ---
const body = document.body;
const themeBtn = document.getElementById("toggleTheme");
themeBtn.addEventListener("click", () => {
  body.classList.toggle("light");
  const isLight = body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  updateTheme();
});
function updateTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  if (theme === "light") {
    body.style.background = "#f5f5f5";
    body.style.color = "#222";
  } else {
    body.style.background = "linear-gradient(135deg,#0f0f0f,#1f1f1f)";
    body.style.color = "#e8eef6";
  }
}
updateTheme();

// --- Backup e restauração ---
const backupBtn = document.getElementById("backupBtn");
const restoreBtn = document.getElementById("restoreBtn");
const fileInput = document.getElementById("fileInput");

backupBtn.addEventListener("click", () => {
  const data = localStorage.getItem("vEstudosData") || "{}";
  const blob = new Blob([data], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const date = new Date().toISOString().split("T")[0];
  a.download = `Backup_VEstudos_${date}.json`;
  a.click();
});

restoreBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    localStorage.setItem("vEstudosData", event.target.result);
    alert("Dados restaurados com sucesso!");
    location.reload();
  };
  reader.readAsText(file);
});

// --- Dados do app ---
let dados = JSON.parse(localStorage.getItem("vEstudosData") || "{}");
if (!dados.temas) dados.temas = [];
if (!dados.pastas) dados.pastas = [
  "Trauma membro superior","Trauma membro inferior","Trauma infantil",
  "Ortopedia pediátrica","Ombro e cotovelo","Mão","Coluna",
  "Quadril","Joelho","Pé e tornozelo","Tumores"
];
salvar();

function salvar() {
  localStorage.setItem("vEstudosData", JSON.stringify(dados));
}

// --- Exibir pastas e temas ---
const pastasDiv = document.getElementById("pastas");
function renderPastas() {
  pastasDiv.innerHTML = "";
  dados.pastas.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${p}</strong><br><div class="muted">Temas:</div><div id="temas-${p}"></div>`;
    const temas = dados.temas.filter(t => t.pasta === p);
    const temasDiv = div.querySelector(`#temas-${p}`);
    temas.forEach(t => {
      const temaDiv = document.createElement("div");
      temaDiv.innerHTML = `<span class="pill">${t.nome}</span>`;
      temasDiv.appendChild(temaDiv);
    });
    pastasDiv.appendChild(div);
  });
}
renderPastas();

// --- Simular geração de plano do dia ---
function gerarPlanoDia() {
  const div = document.getElementById("plan-hoje");
  div.innerHTML = "";
  if (dados.temas.length === 0) {
    div.innerHTML = "<p class='muted'>Nenhum tema cadastrado ainda.</p>";
    return;
  }
  const tema = dados.temas[Math.floor(Math.random() * dados.temas.length)];
  div.innerHTML = `<p>Atividade sugerida: <strong>Revisar</strong> o tema <strong>${tema.nome}</strong> (${tema.pasta})</p>`;
}
gerarPlanoDia();

// --- Tutorial ---
document.getElementById("tutorialBtn").addEventListener("click", () => {
  window.open("tutorial.html", "_blank");
});

// --- Feedback ---
const sendFeedback = document.getElementById("sendFeedback");
sendFeedback.addEventListener("click", () => {
  const text = document.getElementById("feedbackText").value.trim();
  if (!text) return;
  document.getElementById("feedbackResult").textContent = "Obrigado pelo seu feedback!";
  document.getElementById("feedbackText").value = "";
});

// --- Service Worker registration ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
