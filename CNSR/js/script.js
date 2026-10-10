// ==========================================
// CONFIGURAÇÃO DA API E CLIENTE HTTP
// ==========================================

// Detecta automaticamente a URL da API: localhost em desenvolvimento (servido via http://),
// Render em produção (inclui o caso de abrir o index.html direto via file://)
const API_BASE_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3333/api"
  : "https://cnsr-backend.onrender.com/api";

const TOKEN_KEY = "conecta_nsr_token";
const ADMIN_PERFIL_KEY = "conecta_nsr_admin_perfil";

// Formata uma data ISO (vinda da API) no padrão brasileiro
function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

// Cliente HTTP central: injeta o token JWT, trata erros e respostas sem corpo (204)
async function apiFetch(caminho, opcoes = {}) {
  const cabecalhos = { "Content-Type": "application/json", ...(opcoes.headers || {}) };
  const token = obterToken();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, { ...opcoes, headers: cabecalhos });
  } catch (erroDeRede) {
    throw new Error("Não foi possível conectar à API. Verifique sua conexão ou se o servidor está rodando.");
  }

  let corpo = null;
  try {
    corpo = await resposta.json();
  } catch {
    corpo = null; // respostas sem corpo, ex: 204 No Content
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && administradorLogado()) {
      sairAdministrador();
      alert("Sua sessão expirou. Faça login novamente.");
    }

    const mensagemErro = corpo?.erros?.map(erro => erro.mensagem).join(" ") || corpo?.mensagem || "Erro ao comunicar com o servidor.";
    throw new Error(mensagemErro);
  }

  return corpo;
}

// ==========================================
// CHAMADOS: INTEGRAÇÃO COM A API
// ==========================================

let chamadosCache = [];

// Busca todos os chamados no backend
function listarChamados() {
  return apiFetch("/chamados");
}

// Registra um novo chamado via API
function criarChamadoApi(dadosFormulario) {
  return apiFetch("/chamados", {
    method: "POST",
    body: JSON.stringify(dadosFormulario)
  });
}

// Atualiza o status de um chamado via API (restrito a administradores)
function atualizarStatusChamadoApi(id, status) {
  return apiFetch(`/chamados/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

// Remove um chamado via API (restrito a administradores)
function removerChamadoApi(id) {
  return apiFetch(`/chamados/${id}`, { method: "DELETE" });
}

// Busca a lista de cidadãos cadastrados (restrito a administradores)
function listarUsuariosApi() {
  return apiFetch("/usuarios");
}

// Recarrega os chamados do backend e atualiza tabela e estatísticas
async function carregarChamados() {
  try {
    chamadosCache = await listarChamados();
  } catch (erro) {
    console.error("Erro ao carregar chamados:", erro);
    chamadosCache = [];
  }
  renderizarTabelaChamados(chamadosCache);
  atualizarEstatisticas();
}

// ==========================================
// NOTÍCIAS: INTEGRAÇÃO COM A API
// ==========================================

let noticiasCache = [];

// Busca todas as notícias publicadas no backend
function listarNoticias() {
  return apiFetch("/noticias");
}

// Publica uma nova notícia via API (restrito a administradores)
function criarNoticiaApi(dadosNoticia) {
  return apiFetch("/noticias", {
    method: "POST",
    body: JSON.stringify(dadosNoticia)
  });
}

// Atualiza uma notícia existente via API (restrito a administradores)
function atualizarNoticiaApi(id, dadosNoticia) {
  return apiFetch(`/noticias/${id}`, {
    method: "PUT",
    body: JSON.stringify(dadosNoticia)
  });
}

// Remove uma notícia via API (restrito a administradores)
function removerNoticiaApi(id) {
  return apiFetch(`/noticias/${id}`, { method: "DELETE" });
}

// Recarrega as notícias do backend e atualiza os painéis
async function carregarNoticias() {
  try {
    noticiasCache = await listarNoticias();
  } catch (erro) {
    console.error("Erro ao carregar notícias:", erro);
    noticiasCache = [];
  }
  renderizarNoticias();
}

// ==========================================
// ATIVAÇÃO DO BOTÃO "+ NOVA SOLICITAÇÃO"
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // Captura o botão pelo ID ou pela classe e ícone
  const btnNovaSolicitacao = document.getElementById("btnNovoChamado") || 
                             document.querySelector("button.btn-primary");

  if (btnNovaSolicitacao) {
    btnNovaSolicitacao.addEventListener("click", (e) => {
      e.preventDefault();
      ativarNovaSolicitacao();
    });
  }
});

// Função responsável por conduzir o usuário ao formulário
function ativarNovaSolicitacao() {
  const secaoFormulario = document.getElementById("chamados") || 
                          document.getElementById("formChamado") || 
                          document.querySelector("form");

  const primeiroCampo = document.getElementById("nomeCidadao") || 
                        document.querySelector("form input, form select");

  if (secaoFormulario) {
    // 1. Rola suavemente até o formulário
    secaoFormulario.scrollIntoView({ behavior: "smooth", block: "start" });

    // 2. Posiciona o cursor no primeiro campo editável
    setTimeout(() => {
      if (primeiroCampo) {
        primeiroCampo.focus();
      }
    }, 500);
  } else {
    console.warn("Seção do formulário não foi encontrada no HTML.");
  }
}

// ==========================================
// ESTATÍSTICAS DA CIDADE (STAT CARDS)
// ==========================================

// Categorias de serviço geridas pela plataforma (usado para contar secretarias integradas)
const CATEGORIAS_SERVICO = [
  "Iluminação Pública",
  "Obras e Vias",
  "Limpeza Urbana",
  "Saneamento e Água",
  "Meio Ambiente",
  "Trânsito e Mobilidade"
];

// Recalcula e atualiza os cards de estatística com base nos dados reais da API
async function atualizarEstatisticas() {
  const totalChamados = chamadosCache.length;
  const concluidos = chamadosCache.filter(c => c.status === "CONCLUIDO").length;
  const taxaResolucao = totalChamados > 0 ? Math.round((concluidos / totalChamados) * 100) : 0;

  const elTotalChamados = document.getElementById("totalChamados");
  const elTaxaResolucao = document.getElementById("taxaResolucao");
  const elTotalCidadaos = document.getElementById("totalCidadaos");
  const elTotalSecretarias = document.getElementById("totalSecretarias");

  if (elTotalChamados) elTotalChamados.textContent = totalChamados.toLocaleString("pt-BR");
  if (elTaxaResolucao) elTaxaResolucao.textContent = `${taxaResolucao}%`;
  if (elTotalSecretarias) elTotalSecretarias.textContent = CATEGORIAS_SERVICO.length;

  if (!elTotalCidadaos) return;

  // A listagem de cidadãos exige autenticação; visitantes anônimos não têm acesso a essa contagem
  if (!administradorLogado()) {
    elTotalCidadaos.textContent = "—";
    return;
  }

  try {
    const usuarios = await listarUsuariosApi();
    elTotalCidadaos.textContent = usuarios.length.toLocaleString("pt-BR");
  } catch (erro) {
    elTotalCidadaos.textContent = "—";
  }
}

// ==========================================
// GESTÃO DE ADMINISTRADORES E SESSÃO ADMIN
// ==========================================

// Retorna o token JWT da sessão administrativa (ou null)
function obterToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Retorna o perfil do administrador logado (ou null)
function obterAdminPerfil() {
  const dados = localStorage.getItem(ADMIN_PERFIL_KEY);
  return dados ? JSON.parse(dados) : null;
}

// Verifica se existe um administrador autenticado no momento
function administradorLogado() {
  return Boolean(obterToken());
}

// Salva o token e o perfil retornados pelo login
function salvarSessaoAdmin(token, administrador) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_PERFIL_KEY, JSON.stringify(administrador));
}

// Cadastra um novo administrador via API
async function cadastrarAdministrador(event) {
  event.preventDefault();

  const nomeCompleto = document.getElementById("nomeAdmin").value.trim();
  const email = document.getElementById("emailAdmin").value.trim();
  const usuario = document.getElementById("usuarioAdmin").value.trim();
  const senha = document.getElementById("senhaAdmin").value;
  const confirmarSenha = document.getElementById("confirmarSenhaAdmin").value;

  if (senha !== confirmarSenha) {
    alert("As senhas informadas não conferem.");
    return;
  }

  try {
    await apiFetch("/administradores", {
      method: "POST",
      body: JSON.stringify({ nomeCompleto, email, usuario, senha, confirmarSenha })
    });

    document.getElementById("formAdminCadastro").reset();
    alert("Administrador cadastrado com sucesso! Faça login para continuar.");
    trocarModalAdmin(null, "modalAdminCadastro", "modalAdminLogin");
  } catch (erro) {
    alert(erro.message);
  }
}

// Autentica um administrador via API e abre a sessão administrativa
async function autenticarAdministrador(event) {
  event.preventDefault();

  const usuario = document.getElementById("loginUsuarioAdmin").value.trim();
  const senha = document.getElementById("loginSenhaAdmin").value;

  try {
    const { token, administrador } = await apiFetch("/administradores/login", {
      method: "POST",
      body: JSON.stringify({ usuario, senha })
    });

    salvarSessaoAdmin(token, administrador);

    document.getElementById("formAdminLogin").reset();
    fecharModal("modalAdminLogin");
    atualizarInterfaceAdmin();
    carregarChamados();
    carregarNoticias();
  } catch (erro) {
    alert(erro.message);
  }
}

// Encerra a sessão administrativa ativa
function sairAdministrador() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_PERFIL_KEY);
  atualizarInterfaceAdmin();
  carregarChamados();
  carregarNoticias();
}

// Solicita à API uma senha temporária para o e-mail cadastrado
async function recuperarSenhaAdministrador(event) {
  event.preventDefault();

  const email = document.getElementById("emailRecuperarAdmin").value.trim();

  try {
    const { senhaTemporaria } = await apiFetch("/administradores/recuperar-senha", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    document.getElementById("formAdminRecuperar").reset();
    alert(
      `Este sistema não possui envio real de e-mail. Sua senha temporária é: ${senhaTemporaria}\n\n` +
      "Utilize-a para entrar e, se desejar, cadastre uma nova senha."
    );
    trocarModalAdmin(null, "modalAdminRecuperar", "modalAdminLogin");
  } catch (erro) {
    alert(erro.message);
  }
}

// Alterna entre os modais de login, cadastro e recuperação de senha
function trocarModalAdmin(event, idAtual, idDestino) {
  if (event) event.preventDefault();
  fecharModal(idAtual);
  abrirModal(idDestino);
}

// Atualiza o cabeçalho conforme o estado da sessão administrativa
function atualizarInterfaceAdmin() {
  const perfil = obterAdminPerfil();
  const btnAreaAdmin = document.getElementById("btnAreaAdmin");
  const badgeSessao = document.getElementById("adminSessaoBadge");
  const nomeSessao = document.getElementById("adminSessaoNome");
  const btnNovaNoticia = document.getElementById("btnNovaNoticia");
  const botoesRelatorio = [
    document.getElementById("btnImprimirRelatorioChamados"),
    document.getElementById("btnBaixarRelatorioChamados")
  ];

  if (administradorLogado() && perfil) {
    if (btnAreaAdmin) btnAreaAdmin.classList.add("hidden");
    if (badgeSessao) badgeSessao.classList.remove("hidden");
    if (nomeSessao) nomeSessao.textContent = `Olá, ${perfil.nomeCompleto.split(" ")[0]}`;
    if (btnNovaNoticia) btnNovaNoticia.classList.remove("hidden");
    botoesRelatorio.forEach(botao => botao?.classList.remove("hidden"));
  } else {
    if (btnAreaAdmin) btnAreaAdmin.classList.remove("hidden");
    if (badgeSessao) badgeSessao.classList.add("hidden");
    if (btnNovaNoticia) btnNovaNoticia.classList.add("hidden");
    botoesRelatorio.forEach(botao => botao?.classList.add("hidden"));
  }
}

// ==========================================
// RENDERIZAÇÃO DA TABELA DE CHAMADOS
// ==========================================

const STATUS_INFO = {
  PENDENTE: { label: "Pendente", classe: "status-pendente" },
  EM_ANDAMENTO: { label: "Em Andamento", classe: "status-andamento" },
  CONCLUIDO: { label: "Concluído", classe: "status-concluido" }
};

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

// Desenha a lista de chamados na tabela de acompanhamento
function renderizarTabelaChamados(lista) {
  const corpoTabela = document.getElementById("tabelaChamadosBody");
  if (!corpoTabela) return;

  const chamados = lista || chamadosCache;

  if (chamados.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="8" style="text-align:center;">Nenhuma solicitação encontrada.</td></tr>`;
    return;
  }

  corpoTabela.innerHTML = chamados.map(chamado => {
    const infoStatus = STATUS_INFO[chamado.status] || STATUS_INFO.PENDENTE;
    const logado = administradorLogado();

    const colunaStatus = logado
      ? `<select class="form-control select-status" onchange="alterarStatusChamado(${chamado.id}, this.value)">
          ${Object.entries(STATUS_INFO).map(([valor, info]) =>
            `<option value="${valor}" ${valor === chamado.status ? "selected" : ""}>${info.label}</option>`
          ).join("")}
        </select>`
      : `<span class="status-badge ${infoStatus.classe}">${infoStatus.label}</span>`;

    const acoesDisponiveis = logado
      ? `<button type="button" class="btn-text" onclick="excluirChamado(${chamado.id}, '${chamado.protocolo}')" title="Excluir solicitação">
          <i class="fa-solid fa-trash"></i>
        </button>`
      : `<span title="Somente administradores podem excluir">&mdash;</span>`;

    const descricao = escaparHtml(chamado.descricao || "Descrição não informada.");
    const acoesDocumento = `
      <div class="description-actions">
        ${logado ? `<button type="button" class="btn btn-outline btn-sm" onclick="imprimirChamado(${chamado.id})">
          <i class="fa-solid fa-print"></i> Imprimir
        </button>` : ""}
        <button type="button" class="btn btn-outline btn-sm" onclick="gerarChamadoPDF(${chamado.id})">
          <i class="fa-solid fa-file-pdf"></i> Baixar PDF
        </button>
      </div>`;

    return `
      <tr>
        <td>${chamado.protocolo}</td>
        <td>${chamado.nome}</td>
        <td>${chamado.categoria}</td>
        <td>
          <details class="description-dropdown">
            <summary>Ver descrição</summary>
            <p>${descricao}</p>
            ${acoesDocumento}
          </details>
        </td>
        <td>${chamado.bairro}</td>
        <td>${formatarData(chamado.criadoEm)}</td>
        <td>${colunaStatus}</td>
        <td>${acoesDisponiveis}</td>
      </tr>
    `;
  }).join("");
}

// Altera o status de um chamado via API (restrito a administradores)
async function alterarStatusChamado(id, novoStatus) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem alterar o status das solicitações.");
    renderizarTabelaChamados();
    return;
  }

  try {
    await atualizarStatusChamadoApi(id, novoStatus);
    await carregarChamados();
  } catch (erro) {
    alert(erro.message);
    renderizarTabelaChamados();
  }
}

// Retorna os chamados (já carregados) que atendem ao termo digitado na busca
function obterChamadosFiltrados() {
  const campoBusca = document.getElementById("inputBuscaProtocolo");
  const termo = campoBusca ? campoBusca.value.trim().toLowerCase() : "";

  if (!termo) return chamadosCache;

  return chamadosCache.filter(chamado =>
    chamado.protocolo.toLowerCase().includes(termo) ||
    chamado.bairro.toLowerCase().includes(termo) ||
    chamado.nome.toLowerCase().includes(termo) ||
    chamado.categoria.toLowerCase().includes(termo)
  );
}

// Filtra as linhas da tabela conforme o termo digitado na busca
function filtrarChamados() {
  renderizarTabelaChamados(obterChamadosFiltrados());
}

// ==========================================
// RELATÓRIO DE ACOMPANHAMENTO DE SOLICITAÇÕES
// ==========================================

// Monta o HTML do relatório (cabeçalho + tabela) a partir dos chamados filtrados
function montarHtmlRelatorioChamados() {
  const chamados = obterChamadosFiltrados();
  const dataEmissao = new Date().toLocaleString("pt-BR");

  const linhas = chamados.map(chamado => `
    <tr>
      <td>${chamado.protocolo}</td>
      <td>${chamado.nome}</td>
      <td>${chamado.categoria}</td>
      <td>${chamado.bairro}</td>
      <td>${formatarData(chamado.criadoEm)}</td>
      <td>${STATUS_INFO[chamado.status]?.label || chamado.status}</td>
    </tr>
  `).join("");

  return `
    <h1>Relatório de Acompanhamento de Solicitações</h1>
    <p>Conecta Nova Santa Rita &mdash; Emitido em ${dataEmissao}</p>
    <table>
      <thead>
        <tr>
          <th>Protocolo</th>
          <th>Solicitante</th>
          <th>Categoria</th>
          <th>Bairro</th>
          <th>Data</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${linhas || `<tr><td colspan="6">Nenhuma solicitação encontrada.</td></tr>`}</tbody>
    </table>
  `;
}

// Abre uma janela de impressão com o relatório de solicitações
function imprimirRelatorioChamados() {
  const janelaImpressao = window.open("", "_blank", "width=900,height=700");
  if (!janelaImpressao) {
    alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }

  janelaImpressao.document.write(`
    <html>
      <head>
        <title>Relatório de Solicitações</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 2rem; color: #0f172a; }
          h1 { font-size: 1.3rem; margin-bottom: 0.25rem; }
          p { color: #64748b; margin-bottom: 1.5rem; font-size: 0.9rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: left; font-size: 0.85rem; }
          th { background-color: #f8fafc; }
        </style>
      </head>
      <body onload="window.print()">${montarHtmlRelatorioChamados()}</body>
    </html>
  `);
  janelaImpressao.document.close();
}

// Gera e baixa um arquivo PDF com o relatório de solicitações (via jsPDF)
function gerarRelatorioChamadosPDF() {
  if (!window.jspdf) {
    alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet.");
    return;
  }

  const chamados = obterChamadosFiltrados();
  const { jsPDF } = window.jspdf;
  const documentoPdf = new jsPDF();

  documentoPdf.setFontSize(14);
  documentoPdf.text("Relatório de Acompanhamento de Solicitações", 14, 15);
  documentoPdf.setFontSize(9);
  documentoPdf.setTextColor(100);
  documentoPdf.text(`Conecta Nova Santa Rita — Emitido em ${new Date().toLocaleString("pt-BR")}`, 14, 21);

  documentoPdf.autoTable({
    startY: 27,
    head: [["Protocolo", "Solicitante", "Categoria", "Bairro", "Data", "Status"]],
    body: chamados.map(chamado => [
      chamado.protocolo,
      chamado.nome,
      chamado.categoria,
      chamado.bairro,
      formatarData(chamado.criadoEm),
      STATUS_INFO[chamado.status]?.label || chamado.status
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 132, 199] }
  });

  documentoPdf.save(`relatorio-solicitacoes-${Date.now()}.pdf`);
}

function obterChamadoPorId(id) {
  const chamado = chamadosCache.find(item => item.id === id);
  if (!chamado) {
    alert("Não foi possível encontrar os dados desta solicitação.");
    return null;
  }
  return chamado;
}

function imprimirChamado(id) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem imprimir solicitações.");
    return;
  }

  const chamado = obterChamadoPorId(id);
  if (!chamado) return;

  const campos = [
    ["Protocolo", chamado.protocolo],
    ["Data de abertura", formatarData(chamado.criadoEm)],
    ["Solicitante", chamado.nome],
    ["Telefone", chamado.telefone],
    ["Status", STATUS_INFO[chamado.status]?.label || chamado.status],
    ["Categoria", chamado.categoria],
    ["Bairro/Localidade", chamado.bairro],
    ["Endereço", chamado.endereco],
    ["Descrição do problema", chamado.descricao || "Descrição não informada."]
  ];
  const conteudo = campos.map(([rotulo, valor]) =>
    `<section><strong>${escaparHtml(rotulo)}</strong><p>${escaparHtml(valor)}</p></section>`
  ).join("");

  const janelaImpressao = window.open("", "_blank", "width=700,height=800");
  if (!janelaImpressao) {
    alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }

  janelaImpressao.document.write(`
    <html>
      <head>
        <title>Solicitação ${escaparHtml(chamado.protocolo)}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 2rem; color: #0f172a; }
          h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
          header { margin-bottom: 1.5rem; }
          header p { color: #64748b; }
          section { margin: 0 0 1rem; break-inside: avoid; }
          section p { margin: 0.25rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body onload="window.print()">
        <header>
          <h1>Detalhes da solicitação</h1>
          <p>Conecta Nova Santa Rita</p>
        </header>
        ${conteudo}
      </body>
    </html>
  `);
  janelaImpressao.document.close();
}

function gerarChamadoPDF(id) {
  const chamado = obterChamadoPorId(id);
  if (!chamado) return;

  if (!window.jspdf) {
    alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const documentoPdf = new jsPDF();
  documentoPdf.setFontSize(16);
  documentoPdf.text("Detalhes da solicitação", 14, 18);
  documentoPdf.setFontSize(10);
  documentoPdf.setTextColor(100);
  documentoPdf.text("Conecta Nova Santa Rita", 14, 25);
  documentoPdf.setTextColor(15, 23, 42);

  documentoPdf.autoTable({
    startY: 32,
    body: [
      ["Protocolo", chamado.protocolo],
      ["Data de abertura", formatarData(chamado.criadoEm)],
      ["Solicitante", chamado.nome],
      ["Telefone", chamado.telefone],
      ["Status", STATUS_INFO[chamado.status]?.label || chamado.status],
      ["Categoria", chamado.categoria],
      ["Bairro/Localidade", chamado.bairro],
      ["Endereço", chamado.endereco],
      ["Descrição do problema", chamado.descricao || "Descrição não informada."]
    ],
    styles: { fontSize: 10, cellPadding: 3, overflow: "linebreak" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 48 }, 1: { cellWidth: "auto" } },
    theme: "grid"
  });

  const protocoloArquivo = String(chamado.protocolo).replace(/[^a-zA-Z0-9-]/g, "-");
  documentoPdf.save(`solicitacao-${protocoloArquivo}.pdf`);
}

// Remove um chamado via API após confirmação do usuário (restrito a administradores)
async function excluirChamado(id, protocolo) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem excluir solicitações.");
    return;
  }

  if (!confirm(`Deseja realmente excluir a solicitação ${protocolo}?`)) return;

  try {
    await removerChamadoApi(id);
    await carregarChamados();
  } catch (erro) {
    alert(erro.message);
  }
}

// ==========================================
// REGISTRO DE NOVA SOLICITAÇÃO (FORMULÁRIO)
// ==========================================

// Preenche automaticamente a categoria ao clicar em um card de serviço
function selecionarCategoria(categoria) {
  const selectCategoria = document.getElementById("categoriaChamado");
  if (selectCategoria) {
    selectCategoria.value = categoria;
  }
  ativarNovaSolicitacao();
}

// Guarda o chamado exibido no modal de sucesso para impressão/download do comprovante
let ultimoChamadoRegistrado = null;

// Trata o envio do formulário de nova solicitação via API
async function salvarChamado(event) {
  event.preventDefault();

  const dadosFormulario = {
    nome: document.getElementById("nomeCidadao").value.trim(),
    telefone: document.getElementById("telefoneCidadao").value.trim(),
    categoria: document.getElementById("categoriaChamado").value,
    bairro: document.getElementById("bairroChamado").value.trim(),
    endereco: document.getElementById("enderecoChamado").value.trim(),
    descricao: document.getElementById("descricaoChamado").value.trim()
  };

  try {
    const chamadoCriado = await criarChamadoApi(dadosFormulario);

    document.getElementById("formNovoChamado").reset();
    await carregarChamados();

    ultimoChamadoRegistrado = chamadoCriado;

    const campoProtocolo = document.getElementById("modalProtocoloNumero");
    if (campoProtocolo) {
      campoProtocolo.textContent = chamadoCriado.protocolo;
    }
    abrirModal("modalSucesso");
  } catch (erro) {
    alert(erro.message || "Não foi possível registrar a solicitação.");
  }
}

// Monta o texto do comprovante a partir do chamado registrado
function montarTextoComprovante(chamado) {
  return `COMPROVANTE DE SOLICITAÇÃO - CONECTA NOVA SANTA RITA
========================================================
Protocolo: ${chamado.protocolo}
Data de Abertura: ${formatarData(chamado.criadoEm)}
Status: ${chamado.statusLabel}

Solicitante: ${chamado.nome}
Telefone: ${chamado.telefone}

Categoria: ${chamado.categoria}
Bairro/Localidade: ${chamado.bairro}
Endereço: ${chamado.endereco}

Descrição:
${chamado.descricao}
========================================================
Guarde este comprovante para acompanhar o andamento do serviço.`;
}

// Abre uma janela de impressão com os dados do comprovante
function imprimirComprovante() {
  if (!ultimoChamadoRegistrado) return;

  const janelaImpressao = window.open("", "_blank", "width=600,height=700");
  if (!janelaImpressao) {
    alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }

  const textoComprovante = montarTextoComprovante(ultimoChamadoRegistrado)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br>");

  janelaImpressao.document.write(`
    <html>
      <head>
        <title>Comprovante ${ultimoChamadoRegistrado.protocolo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 2rem; color: #0f172a; }
        </style>
      </head>
      <body onload="window.print()">${textoComprovante}</body>
    </html>
  `);
  janelaImpressao.document.close();
}

// Gera e baixa um arquivo .txt com os dados do comprovante
function salvarComprovante() {
  if (!ultimoChamadoRegistrado) return;

  const conteudo = montarTextoComprovante(ultimoChamadoRegistrado);
  const arquivo = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);

  const link = document.createElement("a");
  link.href = url;
  link.download = `comprovante-${ultimoChamadoRegistrado.protocolo}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// CONTROLE DE MODAIS
// ==========================================

// Exibe um modal pelo id
function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.add("active");
}

// Oculta um modal pelo id
function fecharModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.remove("active");
}

// Preenche e exibe o modal de leitura da notícia
function abrirNoticia(id) {
  const noticia = noticiasCache.find(n => n.id === id);
  if (!noticia) return;

  document.getElementById("noticiaTitulo").textContent = noticia.titulo;
  document.getElementById("noticiaConteudo").textContent = noticia.conteudo;
  abrirModal("modalNoticia");
}

// ==========================================
// GESTÃO E RENDERIZAÇÃO DE NOTÍCIAS (ADMINISTRADOR)
// ==========================================

// Classe de cor do selo conforme o painel/categoria da notícia
const CATEGORIA_NOTICIA_CLASSES = {
  "Obras": "",
  "Saúde": "bg-green",
  "Educação": "bg-purple"
};

// Calcula um texto relativo ("Há X dias/horas") a partir de uma data ISO
function calcularTempoRelativo(dataIso) {
  const diferencaMs = Date.now() - new Date(dataIso).getTime();
  const horas = Math.floor(diferencaMs / (1000 * 60 * 60));

  if (horas < 1) return "Publicado agora";
  if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;

  const dias = Math.floor(horas / 24);
  return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
}

// Desenha os cards de notícias nos painéis de Obras, Saúde e Educação
function renderizarNoticias() {
  const container = document.getElementById("newsGridContainer");
  if (!container) return;

  const logado = administradorLogado();

  if (noticiasCache.length === 0) {
    container.innerHTML = `<p class="section-description">Nenhuma notícia publicada no momento.</p>`;
    return;
  }

  container.innerHTML = noticiasCache.map(noticia => {
    const classeBadge = CATEGORIA_NOTICIA_CLASSES[noticia.categoria] || "";
    const acoesAdmin = logado
      ? `<div class="news-admin-actions">
          <button type="button" class="btn-text" onclick="abrirModalNoticiaForm(${noticia.id})" title="Editar notícia">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button type="button" class="btn-text" onclick="excluirNoticia(${noticia.id})" title="Excluir notícia">
            <i class="fa-solid fa-trash"></i> Excluir
          </button>
        </div>`
      : "";

    return `
      <article class="news-card">
        <div class="news-badge ${classeBadge}">${noticia.categoria}</div>
        <h3 class="news-title">${noticia.titulo}</h3>
        <p class="news-excerpt">${noticia.resumo}</p>
        ${acoesAdmin}
        <div class="news-footer">
          <span><i class="fa-regular fa-clock"></i> ${calcularTempoRelativo(noticia.criadoEm)}</span>
          <button class="btn-text" onclick="abrirNoticia(${noticia.id})">Ler mais <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </article>
    `;
  }).join("");
}

// Abre o modal de criação/edição de notícia (sem id = nova notícia)
function abrirModalNoticiaForm(id) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem gerenciar notícias.");
    return;
  }

  const formulario = document.getElementById("formNoticia");
  const tituloModal = document.getElementById("tituloModalNoticiaForm");
  formulario.reset();

  if (id) {
    const noticia = noticiasCache.find(n => n.id === id);
    if (!noticia) return;

    tituloModal.textContent = "Editar Notícia";
    document.getElementById("noticiaIdForm").value = noticia.id;
    document.getElementById("noticiaCategoriaForm").value = noticia.categoria;
    document.getElementById("noticiaTituloForm").value = noticia.titulo;
    document.getElementById("noticiaResumoForm").value = noticia.resumo;
    document.getElementById("noticiaConteudoForm").value = noticia.conteudo;
  } else {
    tituloModal.textContent = "Nova Notícia";
    document.getElementById("noticiaIdForm").value = "";
  }

  abrirModal("modalNoticiaForm");
}

// Trata o envio do formulário de criação/edição de notícia via API
async function salvarNoticia(event) {
  event.preventDefault();

  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem gerenciar notícias.");
    return;
  }

  const valorIdForm = document.getElementById("noticiaIdForm").value;
  const idExistente = valorIdForm ? Number(valorIdForm) : null;
  const dadosNoticia = {
    categoria: document.getElementById("noticiaCategoriaForm").value,
    titulo: document.getElementById("noticiaTituloForm").value.trim(),
    resumo: document.getElementById("noticiaResumoForm").value.trim(),
    conteudo: document.getElementById("noticiaConteudoForm").value.trim()
  };

  try {
    if (idExistente) {
      await atualizarNoticiaApi(idExistente, dadosNoticia);
    } else {
      await criarNoticiaApi(dadosNoticia);
    }

    fecharModal("modalNoticiaForm");
    await carregarNoticias();
  } catch (erro) {
    alert(erro.message || "Não foi possível salvar a notícia.");
  }
}

// Remove uma notícia via API após confirmação do usuário (restrito a administradores)
async function excluirNoticia(id) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem excluir notícias.");
    return;
  }

  if (!confirm("Deseja realmente excluir esta notícia?")) return;

  try {
    await removerNoticiaApi(id);
    await carregarNoticias();
  } catch (erro) {
    alert(erro.message);
  }
}

// ==========================================
// CONSULTA DE PROTOCOLO
// ==========================================

// Direciona o cidadão até a busca de solicitações
function ativarConsultaProtocolo() {
  const inputBusca = document.getElementById("inputBuscaProtocolo");
  if (inputBusca) {
    inputBusca.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputBusca.focus(), 400);
  }
}

// ==========================================
// INICIALIZAÇÃO GERAL DA PÁGINA
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  atualizarInterfaceAdmin();
  carregarChamados();
  carregarNoticias();

  const btnConsulta = document.getElementById("btnConsultarProtocolo");
  if (btnConsulta) {
    btnConsulta.addEventListener("click", (e) => {
      e.preventDefault();
      ativarConsultaProtocolo();
    });
  }

  const btnAreaAdmin = document.getElementById("btnAreaAdmin");
  if (btnAreaAdmin) {
    btnAreaAdmin.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal("modalAdminLogin");
    });
  }
});