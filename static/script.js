let nomePlanilha = "";
let intervalo;
let grafico;
let modoAutomatico = false;
let casasDecimaisDisplay = 2;

function atualizarFeedbackUI(mensagem, nivel = "info", horario = "") {
  const statusBox = document.getElementById("status-box");
  const statusText = document.getElementById("status-text");
  const statusTime = document.getElementById("status-time");
  if (!statusBox || !statusText || !statusTime) return;

  statusText.textContent = mensagem || "Sem mensagens no momento.";
  statusTime.textContent = horario ? `Atualizado em: ${horario}` : "";
  statusBox.className = `status-box ${nivel || "info"}`;
}

async function iniciarMedicao() {
  modoAutomatico = false;
  const res = await fetch("/planilhas");
  const planilhas = await res.json();

  const select = document.getElementById("planilhas-select");
  const input = document.getElementById("nova-planilha");
  const campoNome = document.getElementById("campo-nome-planilha");

  select.innerHTML = '<option value="">-- criar nova --</option>';
  planilhas.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  input.value = "";
  campoNome.style.display = "block";

  // Limpa campos de metadados
  document.getElementById("responsavel").value = "";
  document.getElementById("coordenadas").value = "";
  document.getElementById("descricao").value = "";

  document.getElementById("modal").style.display = "flex";
}

async function iniciarMedicaoAutomatica() {
  modoAutomatico = true;
  const res = await fetch("/planilhas");
  const planilhas = await res.json();

  const select = document.getElementById("planilhas-select");
  const input = document.getElementById("nova-planilha");
  const campoNome = document.getElementById("campo-nome-planilha");

  select.innerHTML = '<option value="">-- criar nova --</option>';
  planilhas.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  input.value = "";
  campoNome.style.display = "block";

  // Limpa campos de metadados
  document.getElementById("responsavel").value = "";
  document.getElementById("coordenadas").value = "";
  document.getElementById("descricao").value = "";

  document.getElementById("modal").style.display = "flex";
}

function alternarCampoNome() {
  const select = document.getElementById("planilhas-select");
  const campo = document.getElementById("campo-nome-planilha");

  campo.style.display = select.value ? "none" : "block";
}

function confirmarEscolha() {
  const select = document.getElementById("planilhas-select");
  const input = document.getElementById("nova-planilha");

  nomePlanilha = select.value || (input.value.trim() + ".ods");

  if (!nomePlanilha || nomePlanilha === ".ods") {
    alert("Informe um nome válido para a planilha.");
    return;
  }

  fecharModal();
  
    if (modoAutomatico) {
        iniciarMedicaoAutomaticaBackend(nomePlanilha);
        console.log("automatica")
    } else {
        iniciarMedicaoBackend(nomePlanilha);
        console.log("manual")
    }
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

async function iniciarMedicaoBackend(planilha) {
  const responsavel = document.getElementById("responsavel").value.trim();
  const coordenadas = document.getElementById("coordenadas").value.trim();
  const descricao = document.getElementById("descricao").value.trim();

  await fetch('/start', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planilha,
      responsavel,
      coordenadas,
      descricao
    })
  });

  if (intervalo) clearInterval(intervalo);
  // criarGrafico();

  intervalo = setInterval(async () => {
    const res = await fetch("/data");
    const dados = await res.json();

    if (dados.length > 0) {
      const tempo = dados.map(d => d.tempo);
      const pressao = dados.map(d => d.pressao);

      // grafico.data.labels = tempo;
      // grafico.data.datasets[0].data = pressao;
      // grafico.update();

      // document.getElementById("pressure").innerText = pressao.at(-1);
    }
  }, 1000);
}

async function iniciarMedicaoAutomaticaBackend(planilha) {
    const responsavel = document.getElementById("responsavel").value.trim();
    const coordenadas = document.getElementById("coordenadas").value.trim();
    const descricao = document.getElementById("descricao").value.trim();

    alert("Iniciando Medição Automática. Por favor, aguarde a sequência de hardware.");

    await fetch('/start_auto', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            planilha, responsavel, coordenadas, descricao
        })
    });

    // Durante a medição automática o display de pressão continua vindo
    // apenas da rota /get_pressure (função atualizarPressao), evitando conflito.
    if (intervalo) clearInterval(intervalo);
}

function pararMedicaoAutomatica() {
  fetch("/stop_auto", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
    .then(response => response.json())
    .then(data => {
      alert(data.status);
      if (intervalo) clearInterval(intervalo);
    })
    .catch(error => {
      console.log("Erro:", error);
      alert("Ocorreu um erro ao parar a medição automática.");
    });
}

async function iniciarMediçãoBackend(planilha) {
  const responsavel = document.getElementById("responsavel").value.trim();
  const coordenadas = document.getElementById("coordenadas").value.trim();
  const descricao = document.getElementById("descricao").value.trim();

  await fetch('/start', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planilha,
      responsavel,
      coordenadas,
      descricao
    })
  });

  if (intervalo) clearInterval(intervalo);
  // criarGrafico();

  intervalo = setInterval(async () => {
    const res = await fetch("/data");
    const dados = await res.json();

    if (dados.length > 0) {
      const tempo = dados.map(d => d.tempo);
      const pressao = dados.map(d => d.pressao);

      // grafico.data.labels = tempo;
      // grafico.data.datasets[0].data = pressao;
      // grafico.update();

      // document.getElementById("pressure").innerText = pressao.at(-1);
    }
  }, 1000);
}

async function finalizarMedicao() {
  const res = await fetch("/stop", { method: "POST" });
  const data = await res.json();
  console.log(data.status);
  alert("Medição finalizada! Planilha salva.");
  if (intervalo) clearInterval(intervalo);
}

function criarGrafico() {
  const ctx = document.getElementById('graficoPressao').getContext('2d');
  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Pressão (Pa)',
        data: [],
        borderColor: '#0066ff',
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#0066ff',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Tempo (s)' } },
        y: { title: { display: true, text: 'Pressão (Pa)' }, beginAtZero: true }
      }
    }
  });
}

async function ajustarOffset() {
  fetch("/ajustar_offset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(data => {
      alert(data.status);  // Exibe o status do ajuste de offset
    })
    .catch(error => {
      console.log("Erro:", error);
      alert("Ocorreu um erro ao ajustar o offset.");
    });
}

function calibrarCilindro() {
  // Desabilita o botão para evitar múltiplos cliques enquanto a calibração está em andamento
  document.getElementById("calibrar-btn").disabled = true;

  fetch("/calibrar_cilindro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(data => {
      alert(data.status);  // Exibe o status da calibração
      // Habilita o botão novamente
      document.getElementById("calibrar-btn").disabled = false;
    })
    .catch(error => {
      console.log("Erro:", error);
      alert("Ocorreu um erro ao iniciar a calibração.");
    });
}

function esvaziarCilindro() {
  // Desabilita o botão para evitar múltiplos cliques enquanto a calibração está em andamento
  document.getElementById("esvaziar-btn").disabled = true;

  fetch("/esvaziar_cilindro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(data => {
      alert(data.status);  // Exibe o status da calibração
      document.getElementById("esvaziar-btn").disabled = false;
    })
    .catch(error => {
      console.log("Erro:", error);
      alert("Ocorreu um erro ao esvaziar cilindro.");
    });
}

function abrirModalPlanilhas() {
  fetch('/planilhas')
    .then(res => res.json())
    .then(planilhas => {
      const lista = document.getElementById("lista-planilhas");
      lista.innerHTML = "";

      if (planilhas.length === 0) {
        lista.innerHTML = "<li class='lista-vazia'>Nenhuma planilha encontrada.</li>";
      } else {
        planilhas.forEach(p => {
          const item = document.createElement("li");
          item.className = "planilha-item"; // Classe do item

          const link = document.createElement("a");
          link.href = `/download/${encodeURIComponent(p)}`;
          link.textContent = p;
          link.className = "planilha-link"; // Classe do estilo que criamos
          link.target = "_blank";
          
          item.appendChild(link);
          lista.appendChild(item);
        });
      }

      document.getElementById("modal-planilhas").style.display = "flex";
    });
}

function fecharModalPlanilhas() {
  document.getElementById("modal-planilhas").style.display = "none";
}

function abrirModalConfig() {
  // Requisição para carregar valores existentes
  fetch("/config")
    .then(res => res.json())
    .then(config => {
      document.getElementById("config-cilindroAr").value = config.cilindroAr;
      document.getElementById("config-alturaCilindro").value = config.alturaCilindro;
      document.getElementById("config-diametroCilindro").value = config.diametroCilindro;
      document.getElementById("config-pressao").value = config.pressaoAtmosferica;
      document.getElementById("config-pressao-calibracao-max").value = config.pressaoCalibracaoMaxima;
      document.getElementById("config-pressao-final").value = config.pressaoFinalMedicao;
      document.getElementById("config-pressao-auto-min").value = config.pressaoAutoMinima;
      document.getElementById("config-pressao-auto-max").value = config.pressaoAutoMaxima;
      document.getElementById("config-janela-estabilizacao").value = config.janelaLeituraEstabilizacao;
      document.getElementById("config-variacao-estabilizacao").value = config.variacaoEstabilizacaoPa;
      document.getElementById("config-timeout-estabilizacao").value = config.timeoutEstabilizacao;
      document.getElementById("config-tempo-esvaziamento").value = config.tempoEsvaziamentoCilindro;
      document.getElementById("config-casas-decimais").value = config.casasDecimaisDisplay;
      document.getElementById("config-tempo-offset").value = config.tempoCalculoOffset;
    });

  document.getElementById("modal-config").style.display = "flex";
}

function fecharModalConfig() {
  document.getElementById("modal-config").style.display = "none";
}

function salvarConfiguracoes() {
  const config = {
    cilindroAr: parseFloat(document.getElementById("config-cilindroAr").value),
    alturaCilindro: parseFloat(document.getElementById("config-alturaCilindro").value),
    diametroCilindro: parseFloat(document.getElementById("config-diametroCilindro").value),
    pressaoAtmosferica: parseFloat(document.getElementById("config-pressao").value),
    pressaoCalibracaoMaxima: parseFloat(document.getElementById("config-pressao-calibracao-max").value),
    pressaoFinalMedicao: parseFloat(document.getElementById("config-pressao-final").value),
    pressaoAutoMinima: parseFloat(document.getElementById("config-pressao-auto-min").value),
    pressaoAutoMaxima: parseFloat(document.getElementById("config-pressao-auto-max").value),
    janelaLeituraEstabilizacao: parseInt(document.getElementById("config-janela-estabilizacao").value, 10),
    variacaoEstabilizacaoPa: parseFloat(document.getElementById("config-variacao-estabilizacao").value),
    timeoutEstabilizacao: parseInt(document.getElementById("config-timeout-estabilizacao").value, 10),
    tempoEsvaziamentoCilindro: parseFloat(document.getElementById("config-tempo-esvaziamento").value),
    casasDecimaisDisplay: parseInt(document.getElementById("config-casas-decimais").value, 10),
    tempoCalculoOffset: parseFloat(document.getElementById("config-tempo-offset").value)
  };

  fetch("/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config)
  })
    .then(res => res.json())
    .then(data => {
      alert(data.status);
      casasDecimaisDisplay = Number.isInteger(config.casasDecimaisDisplay) ? config.casasDecimaisDisplay : 2;
      fecharModalConfig();
    });
}

function reiniciarPermeametro() {
  const confirmado = confirm("Deseja reiniciar o serviço do permeâmetro agora?");
  if (!confirmado) return;

  fetch("/restart_service", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
    .then(response => response.json())
    .then(data => {
      alert(data.status);
    })
    .catch(error => {
      console.log("Erro:", error);
      alert("Ocorreu um erro ao reiniciar o serviço.");
    });
}

function desligarSistema() {
  const confirmado = confirm("Deseja desligar o sistema agora?");
  if (!confirmado) return;

  fetch("/shutdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
    .then(response => response.json())
    .then(data => {
      alert(data.status);
    })
    .catch(error => {
      console.log("Erro:", error);
      alert("Ocorreu um erro ao desligar o sistema.");
    });
}

function atualizarPressao() {
  fetch("/get_pressure")
    .then(response => response.json())
    .then(data => {
      // Atualiza o valor da pressão na interface
      const casas = Number.isInteger(casasDecimaisDisplay) ? casasDecimaisDisplay : 2;
      document.getElementById("pressure").textContent = data.pressao.toFixed(casas);
    })
    .catch(error => {
      console.error("Erro ao obter a pressão:", error);
    });
}

function atualizarStatusSistema() {
  fetch("/status")
    .then(response => response.json())
    .then(data => {
      atualizarFeedbackUI(data.mensagem, data.nivel, data.atualizado_em);
    })
    .catch(error => {
      console.error("Erro ao obter status do sistema:", error);
    });
}

function carregarConfiguracaoDisplay() {
  fetch("/config")
    .then(res => res.json())
    .then(config => {
      const casas = parseInt(config.casasDecimaisDisplay, 10);
      casasDecimaisDisplay = Number.isInteger(casas) ? casas : 2;
    })
    .catch(() => {
      casasDecimaisDisplay = 2;
    });
}

// Atualiza a pressão a cada 1 segundo (1000ms)
carregarConfiguracaoDisplay();
setInterval(atualizarPressao, 1000);
setInterval(atualizarStatusSistema, 1000);
atualizarStatusSistema();
