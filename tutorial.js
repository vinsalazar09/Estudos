// tutorial.js — controle do tutorial do V Estudos

const fecharBtn = document.getElementById("fecharTutorial");
const naoMostrar = document.getElementById("naoMostrar");

// Fecha o tutorial e registra a escolha
fecharBtn.addEventListener("click", () => {
  if (naoMostrar.checked) {
    localStorage.setItem("vEstudos_skipTutorial", "true");
  }
  // Se for aberto em nova aba, simplesmente fecha
  if (window.opener) {
    window.close();
  } else {
    window.location.href = "index.html";
  }
});

// Exibe o tutorial automaticamente na primeira vez
window.addEventListener("load", () => {
  const skip = localStorage.getItem("vEstudos_skipTutorial");
  if (!skip) {
    // Primeira vez: tutorial será exibido automaticamente
    localStorage.setItem("vEstudos_skipTutorial", "false");
  }
});
