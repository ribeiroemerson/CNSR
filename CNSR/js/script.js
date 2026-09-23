// ==========================================
// CONFIGURAÇÃO DE CHAVES E INICIALIZAÇÃO
// ==========================================
const STORAGE_KEYS = {
  CHAMADOS: "conecta_nsr_chamados",
  USUARIOS: "conecta_nsr_usuarios",
  SESSAO_ATIVA: "conecta_nsr_sessao",
  ADMINISTRADORES: "conecta_nsr_administradores",
  SESSAO_ADMIN: "conecta_nsr_sessao_admin",
  NOTICIAS: "conecta_nsr_noticias"
};

// Dados padrão carregados na primeira execução
const DADOS_INICIAIS = {
  chamados: [
    {
      protocolo: "NSR-2026-1042",
      nome: "João Pedro Alves",
      cpf: "111.222.333-44",
      categoria: "Iluminação Pública",
      bairro: "Centro",
      descricao: "Lâmpada queimada na rua principal",
      data: "12/09/2026",
      status: "Em Andamento"
    },
    {
      protocolo: "NSR-2026-1041",
      nome: "Maria das Dores",
      cpf: "555.666.777-88",
      categoria: "Obras e Vias",
      bairro: "Bairro Novo",
      descricao: "Buraco na pista oferecendo risco de acidente",
      data: "11/09/2026",
      status: "Pendente"
    }
  ],
  usuarios: [],
  noticias: [
    {
      id: "NOT-1",
      categoria: "Obras",
      titulo: "Mutirão de pavimentação chega aos bairros da zona sul nesta semana",
      resumo: "Equipes de infraestrutura iniciam a aplicação de asfalto em mais de 10 ruas principais.",
      conteudo: "Equipes de infraestrutura iniciam a aplicação de asfalto em mais de 10 ruas principais da zona sul. A previsão é concluir a primeira etapa até a próxima sexta-feira.",
      data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "NOT-2",
      categoria: "Saúde",
      titulo: "Campanha de Vacinação no Posto Central ganha horário estendido",
      resumo: "Unidade de saúde funcionará até às 20h para atender trabalhadores e famílias.",
      conteudo: "A Secretaria Municipal de Saúde informa que o Posto Central estará com atendimento estendido das 17h às 20h durante toda a semana para atualização da caderneta de vacinação.",
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "NOT-3",
      categoria: "Educação",
      titulo: "Inscrições abertas para novos cursos técnicos de informática",
      resumo: "Parceria oferece 150 vagas gratuitas para jovens e adultos do município.",
      conteudo: "Estão abertas as inscrições para os módulos de Informática e Automação Industrial. Garantia de qualificação profissional com certificação oficial.",
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// ==========================================
// FUNÇÕES GENÉRICAS DO LOCALSTORAGE
// ==========================================

// Lê dados do localStorage de forma segura
function lerStorage(chave) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : null;
  } catch (erro) {
    console.error(`Erro ao ler chave "${chave}" do Storage:`, erro);
    return null;
  }
}

// Grava dados no localStorage
function gravarStorage(chave, dados) {
  try {
    localStorage.setItem(chave, JSON.stringify(dados));
    return true;
  } catch (erro) {
    console.error(`Erro ao salvar dados na chave "${chave}":`, erro);
    alert("Não foi possível salvar os dados. Verifique o espaço do navegador.");
    return false;
  }
}

// ==========================================
// GESTÃO DE USUÁRIOS NO STORAGE
// ==========================================

// Retorna todos os usuários
function obterUsuarios() {
  const usuarios = lerStorage(STORAGE_KEYS.USUARIOS);
  return usuarios || [];
}

// Salva um novo usuário
function cadastrarUsuarioNoStorage(usuarioData) {
  const usuarios = obterUsuarios();

  // Verificar se o CPF ou E-mail já existem
  const existe = usuarios.some(
    u => u.cpf === usuarioData.cpf || u.email.toLowerCase() === usuarioData.email.toLowerCase()
  );

  if (existe) {
    return { sucesso: false, mensagem: "Já existe um usuário cadastrado com este CPF ou E-mail." };
  }

  const novoUsuario = {
    id: "USR-" + Date.now(),
    ...usuarioData,
    dataCadastro: new Date().toLocaleDateString("pt-BR")
  };

  usuarios.push(novoUsuario);
  
  if (gravarStorage(STORAGE_KEYS.USUARIOS, usuarios)) {
    // Define o usuário recém-cadastrado como sessão ativa
    gravarStorage(STORAGE_KEYS.SESSAO_ATIVA, novoUsuario);
    return { sucesso: true, usuario: novoUsuario };
  }

  return { sucesso: false, mensagem: "Erro interno ao gravar usuário." };
}

// Retorna a sessão ativa
function obterSessaoAtiva() {
  return lerStorage(STORAGE_KEYS.SESSAO_ATIVA);
}

// Encerra a sessão atual
function encerrarSessao() {
  localStorage.removeItem(STORAGE_KEYS.SESSAO_ATIVA);
}

// ==========================================
// GESTÃO DE CHAMADOS NO STORAGE
// ==========================================

// Retorna todos os chamados salvos
function obterChamados() {
  let chamados = lerStorage(STORAGE_KEYS.CHAMADOS);
  if (!chamados) {
    // Se for o primeiro acesso, inicializa com os dados de demonstração
    chamados = DADOS_INICIAIS.chamados;
    gravarStorage(STORAGE_KEYS.CHAMADOS, chamados);
  }
  return chamados;
}

// Registra um novo chamado
function criarChamadoNoStorage(dadosFormulario) {
  const chamados = obterChamados();

  const protocolo = "NSR-2026-" + Math.floor(1000 + Math.random() * 9000);
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  const novoChamado = {
    protocolo: protocolo,
    ...dadosFormulario,
    data: dataHoje,
    status: "Pendente"
  };

  chamados.unshift(novoChamado); // Adiciona no início da lista

  if (gravarStorage(STORAGE_KEYS.CHAMADOS, chamados)) {
    return { sucesso: true, protocolo: protocolo, chamado: novoChamado };
  }

  return { sucesso: false, mensagem: "Erro ao gravar chamado." };
}

// Remove um chamado por protocolo
function excluirChamadoDoStorage(protocolo) {
  let chamados = obterChamados();
  chamados = chamados.filter(item => item.protocolo !== protocolo);
  return gravarStorage(STORAGE_KEYS.CHAMADOS, chamados);
}

// Atualiza o status de um chamado por protocolo
function atualizarStatusChamadoNoStorage(protocolo, novoStatus) {
  const chamados = obterChamados();
  const chamado = chamados.find(item => item.protocolo === protocolo);

  if (!chamado) return false;

  chamado.status = novoStatus;
  return gravarStorage(STORAGE_KEYS.CHAMADOS, chamados);
}

// Limpa todos os dados da aplicação no Storage
function resetarStorage() {
  localStorage.removeItem(STORAGE_KEYS.CHAMADOS);
  localStorage.removeItem(STORAGE_KEYS.USUARIOS);
  localStorage.removeItem(STORAGE_KEYS.SESSAO_ATIVA);
  localStorage.removeItem(STORAGE_KEYS.NOTICIAS);
  location.reload();
}

// ==========================================
// GESTÃO DE NOTÍCIAS NO STORAGE
// ==========================================

// Retorna todas as notícias salvas (mais recentes primeiro)
function obterNoticias() {
  let noticias = lerStorage(STORAGE_KEYS.NOTICIAS);
  if (!noticias) {
    // Se for o primeiro acesso, inicializa com as notícias de demonstração
    noticias = DADOS_INICIAIS.noticias;
    gravarStorage(STORAGE_KEYS.NOTICIAS, noticias);
  }
  return noticias;
}

// Cria ou atualiza uma notícia no Storage (restrito a administradores)
function salvarNoticiaNoStorage(dadosNoticia, idExistente) {
  const noticias = obterNoticias();

  if (idExistente) {
    const noticiaExistente = noticias.find(n => n.id === idExistente);
    if (!noticiaExistente) {
      return { sucesso: false, mensagem: "Notícia não encontrada." };
    }
    Object.assign(noticiaExistente, dadosNoticia);
  } else {
    noticias.unshift({
      id: "NOT-" + Date.now(),
      ...dadosNoticia,
      data: new Date().toISOString()
    });
  }

  if (gravarStorage(STORAGE_KEYS.NOTICIAS, noticias)) {
    return { sucesso: true };
  }

  return { sucesso: false, mensagem: "Erro ao gravar notícia." };
}

// Remove uma notícia por id
function excluirNoticiaDoStorage(id) {
  let noticias = obterNoticias();
  noticias = noticias.filter(item => item.id !== id);
  return gravarStorage(STORAGE_KEYS.NOTICIAS, noticias);
}

// Função para ativar a rolagem até o formulário de solicitação e focar no primeiro campo
function rolarParaFormulario() {
  const secaoFormulario = document.getElementById("chamados");
  const primeiroCampo = document.getElementById("nomeCidadao");

  if (secaoFormulario) {
    // Rola a página suavemente até o formulário
    secaoFormulario.scrollIntoView({ behavior: 'smooth' });

    // Foca o cursor no campo de nome após a rolagem
    setTimeout(() => {
      if (primeiroCampo) {
        primeiroCampo.focus();
      }
    }, 400);
  }
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

// Recalcula e atualiza os cards de estatística com base nos dados reais do Storage
function atualizarEstatisticas() {
  const chamados = obterChamados();
  const usuarios = obterUsuarios();

  const totalChamados = chamados.length;
  const concluidos = chamados.filter(c => c.status === "Concluído").length;
  const taxaResolucao = totalChamados > 0 ? Math.round((concluidos / totalChamados) * 100) : 0;

  const elTotalChamados = document.getElementById("totalChamados");
  const elTaxaResolucao = document.getElementById("taxaResolucao");
  const elTotalCidadaos = document.getElementById("totalCidadaos");
  const elTotalSecretarias = document.getElementById("totalSecretarias");

  if (elTotalChamados) elTotalChamados.textContent = totalChamados.toLocaleString("pt-BR");
  if (elTaxaResolucao) elTaxaResolucao.textContent = `${taxaResolucao}%`;
  if (elTotalCidadaos) elTotalCidadaos.textContent = usuarios.length.toLocaleString("pt-BR");
  if (elTotalSecretarias) elTotalSecretarias.textContent = CATEGORIAS_SERVICO.length;
}

// ==========================================
// GESTÃO DE ADMINISTRADORES E SESSÃO ADMIN
// ==========================================

// Gera um hash da senha para não armazenar texto puro no Storage
async function hashSenha(senha) {
  // crypto.subtle exige contexto seguro (https ou localhost); em file:// usa-se o fallback abaixo
  if (window.crypto && window.crypto.subtle) {
    const dadosCodificados = new TextEncoder().encode(senha);
    const bufferHash = await crypto.subtle.digest("SHA-256", dadosCodificados);
    return Array.from(new Uint8Array(bufferHash))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return hashSenhaFallback(senha);
}

// Hash simples (não criptográfico) usado apenas quando crypto.subtle não está disponível
function hashSenhaFallback(senha) {
  let hash = 0;
  for (let i = 0; i < senha.length; i++) {
    hash = (hash << 5) - hash + senha.charCodeAt(i);
    hash |= 0;
  }
  return "fb" + Math.abs(hash).toString(16);
}

// Retorna todos os administradores cadastrados
function obterAdministradores() {
  return lerStorage(STORAGE_KEYS.ADMINISTRADORES) || [];
}

// Retorna o administrador com sessão ativa (ou null)
function obterSessaoAdmin() {
  return lerStorage(STORAGE_KEYS.SESSAO_ADMIN);
}

// Verifica se existe um administrador autenticado no momento
function administradorLogado() {
  return obterSessaoAdmin() !== null;
}

// Cadastra um novo administrador a partir do formulário
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

  const administradores = obterAdministradores();
  const jaExiste = administradores.some(
    admin => admin.usuario.toLowerCase() === usuario.toLowerCase() || admin.email.toLowerCase() === email.toLowerCase()
  );

  if (jaExiste) {
    alert("Já existe um administrador cadastrado com este usuário ou e-mail.");
    return;
  }

  const novoAdmin = {
    id: "ADM-" + Date.now(),
    nomeCompleto,
    email,
    usuario,
    senhaHash: await hashSenha(senha),
    dataCadastro: new Date().toLocaleDateString("pt-BR")
  };

  administradores.push(novoAdmin);
  gravarStorage(STORAGE_KEYS.ADMINISTRADORES, administradores);

  document.getElementById("formAdminCadastro").reset();
  alert("Administrador cadastrado com sucesso! Faça login para continuar.");
  trocarModalAdmin(null, "modalAdminCadastro", "modalAdminLogin");
}

// Autentica um administrador e abre a sessão administrativa
async function autenticarAdministrador(event) {
  event.preventDefault();

  const usuario = document.getElementById("loginUsuarioAdmin").value.trim();
  const senha = document.getElementById("loginSenhaAdmin").value;

  const administradores = obterAdministradores();
  const senhaHash = await hashSenha(senha);

  const admin = administradores.find(
    a => a.usuario.toLowerCase() === usuario.toLowerCase() && a.senhaHash === senhaHash
  );

  if (!admin) {
    alert("Usuário ou senha inválidos.");
    return;
  }

  gravarStorage(STORAGE_KEYS.SESSAO_ADMIN, {
    id: admin.id,
    nomeCompleto: admin.nomeCompleto,
    usuario: admin.usuario
  });

  document.getElementById("formAdminLogin").reset();
  fecharModal("modalAdminLogin");
  atualizarInterfaceAdmin();
  renderizarTabelaChamados();
  renderizarNoticias();
}

// Encerra a sessão administrativa ativa
function sairAdministrador() {
  localStorage.removeItem(STORAGE_KEYS.SESSAO_ADMIN);
  atualizarInterfaceAdmin();
  renderizarTabelaChamados();
  renderizarNoticias();
}

// Simula a recuperação de senha por e-mail: como não há backend de envio,
// uma senha temporária é gerada e exibida na tela no lugar do e-mail real
async function recuperarSenhaAdministrador(event) {
  event.preventDefault();

  const email = document.getElementById("emailRecuperarAdmin").value.trim();
  const administradores = obterAdministradores();
  const admin = administradores.find(a => a.email.toLowerCase() === email.toLowerCase());

  if (!admin) {
    alert("Não encontramos nenhum administrador cadastrado com este e-mail.");
    return;
  }

  const senhaTemporaria = Math.random().toString(36).slice(-8);
  admin.senhaHash = await hashSenha(senhaTemporaria);
  gravarStorage(STORAGE_KEYS.ADMINISTRADORES, administradores);

  document.getElementById("formAdminRecuperar").reset();
  alert(
    `Este sistema não possui envio real de e-mail. Sua senha temporária é: ${senhaTemporaria}\n\n` +
    "Utilize-a para entrar e, se desejar, cadastre uma nova senha."
  );
  trocarModalAdmin(null, "modalAdminRecuperar", "modalAdminLogin");
}

// Alterna entre os modais de login, cadastro e recuperação de senha
function trocarModalAdmin(event, idAtual, idDestino) {
  if (event) event.preventDefault();
  fecharModal(idAtual);
  abrirModal(idDestino);
}

// Atualiza o cabeçalho conforme o estado da sessão administrativa
function atualizarInterfaceAdmin() {
  const sessao = obterSessaoAdmin();
  const btnAreaAdmin = document.getElementById("btnAreaAdmin");
  const badgeSessao = document.getElementById("adminSessaoBadge");
  const nomeSessao = document.getElementById("adminSessaoNome");
  const btnNovaNoticia = document.getElementById("btnNovaNoticia");

  if (sessao) {
    if (btnAreaAdmin) btnAreaAdmin.classList.add("hidden");
    if (badgeSessao) badgeSessao.classList.remove("hidden");
    if (nomeSessao) nomeSessao.textContent = `Olá, ${sessao.nomeCompleto.split(" ")[0]}`;
    if (btnNovaNoticia) btnNovaNoticia.classList.remove("hidden");
  } else {
    if (btnAreaAdmin) btnAreaAdmin.classList.remove("hidden");
    if (badgeSessao) badgeSessao.classList.add("hidden");
    if (btnNovaNoticia) btnNovaNoticia.classList.add("hidden");
  }
}

// ==========================================
// RENDERIZAÇÃO DA TABELA DE CHAMADOS
// ==========================================

const STATUS_CLASSES = {
  "Pendente": "status-pendente",
  "Em Andamento": "status-andamento",
  "Concluído": "status-concluido"
};

// Desenha a lista de chamados na tabela de acompanhamento
function renderizarTabelaChamados(lista) {
  const corpoTabela = document.getElementById("tabelaChamadosBody");
  if (!corpoTabela) return;

  const chamados = lista || obterChamados();

  if (chamados.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhuma solicitação encontrada.</td></tr>`;
    return;
  }

  corpoTabela.innerHTML = chamados.map(chamado => {
    const classeStatus = STATUS_CLASSES[chamado.status] || "status-pendente";
    const logado = administradorLogado();

    const colunaStatus = logado
      ? `<select class="form-control select-status" onchange="alterarStatusChamado('${chamado.protocolo}', this.value)">
          ${Object.keys(STATUS_CLASSES).map(status =>
            `<option value="${status}" ${status === chamado.status ? "selected" : ""}>${status}</option>`
          ).join("")}
        </select>`
      : `<span class="status-badge ${classeStatus}">${chamado.status}</span>`;

    const acoesDisponiveis = logado
      ? `<button type="button" class="btn-text" onclick="excluirChamado('${chamado.protocolo}')" title="Excluir solicitação">
          <i class="fa-solid fa-trash"></i>
        </button>`
      : `<span title="Somente administradores podem excluir">&mdash;</span>`;

    return `
      <tr>
        <td>${chamado.protocolo}</td>
        <td>${chamado.nome}</td>
        <td>${chamado.categoria}</td>
        <td>${chamado.bairro}</td>
        <td>${chamado.data}</td>
        <td>${colunaStatus}</td>
        <td>${acoesDisponiveis}</td>
      </tr>
    `;
  }).join("");
}

// Altera o status de um chamado (restrito a administradores)
function alterarStatusChamado(protocolo, novoStatus) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem alterar o status das solicitações.");
    renderizarTabelaChamados();
    return;
  }

  if (atualizarStatusChamadoNoStorage(protocolo, novoStatus)) {
    renderizarTabelaChamados();
    atualizarEstatisticas();
  }
}

// Retorna os chamados que atendem ao termo digitado na busca (ou todos, se vazio)
function obterChamadosFiltrados() {
  const campoBusca = document.getElementById("inputBuscaProtocolo");
  const termo = campoBusca ? campoBusca.value.trim().toLowerCase() : "";
  const chamados = obterChamados();

  if (!termo) return chamados;

  return chamados.filter(chamado =>
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
      <td>${chamado.data}</td>
      <td>${chamado.status}</td>
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
      chamado.data,
      chamado.status
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 132, 199] }
  });

  documentoPdf.save(`relatorio-solicitacoes-${Date.now()}.pdf`);
}

// Remove um chamado da lista após confirmação do usuário (restrito a administradores)
function excluirChamado(protocolo) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem excluir solicitações.");
    return;
  }

  if (!confirm(`Deseja realmente excluir a solicitação ${protocolo}?`)) return;

  if (excluirChamadoDoStorage(protocolo)) {
    renderizarTabelaChamados();
    atualizarEstatisticas();
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

// Trata o envio do formulário de nova solicitação
function salvarChamado(event) {
  event.preventDefault();

  const dadosFormulario = {
    nome: document.getElementById("nomeCidadao").value.trim(),
    telefone: document.getElementById("telefoneCidadao").value.trim(),
    categoria: document.getElementById("categoriaChamado").value,
    bairro: document.getElementById("bairroChamado").value.trim(),
    endereco: document.getElementById("enderecoChamado").value.trim(),
    descricao: document.getElementById("descricaoChamado").value.trim()
  };

  const resultado = criarChamadoNoStorage(dadosFormulario);

  if (resultado.sucesso) {
    document.getElementById("formNovoChamado").reset();
    renderizarTabelaChamados();
    atualizarEstatisticas();

    ultimoChamadoRegistrado = resultado.chamado;

    const campoProtocolo = document.getElementById("modalProtocoloNumero");
    if (campoProtocolo) {
      campoProtocolo.textContent = resultado.protocolo;
    }
    abrirModal("modalSucesso");
  } else {
    alert(resultado.mensagem || "Não foi possível registrar a solicitação.");
  }
}

// Monta o texto do comprovante a partir do chamado registrado
function montarTextoComprovante(chamado) {
  return `COMPROVANTE DE SOLICITAÇÃO - CONECTA NOVA SANTA RITA
========================================================
Protocolo: ${chamado.protocolo}
Data de Abertura: ${chamado.data}
Status: ${chamado.status}

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
  const noticia = obterNoticias().find(n => n.id === id);
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

  const noticias = obterNoticias();
  const logado = administradorLogado();

  if (noticias.length === 0) {
    container.innerHTML = `<p class="section-description">Nenhuma notícia publicada no momento.</p>`;
    return;
  }

  container.innerHTML = noticias.map(noticia => {
    const classeBadge = CATEGORIA_NOTICIA_CLASSES[noticia.categoria] || "";
    const acoesAdmin = logado
      ? `<div class="news-admin-actions">
          <button type="button" class="btn-text" onclick="abrirModalNoticiaForm('${noticia.id}')" title="Editar notícia">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button type="button" class="btn-text" onclick="excluirNoticia('${noticia.id}')" title="Excluir notícia">
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
          <span><i class="fa-regular fa-clock"></i> ${calcularTempoRelativo(noticia.data)}</span>
          <button class="btn-text" onclick="abrirNoticia('${noticia.id}')">Ler mais <i class="fa-solid fa-arrow-right"></i></button>
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
    const noticia = obterNoticias().find(n => n.id === id);
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

// Trata o envio do formulário de criação/edição de notícia
function salvarNoticia(event) {
  event.preventDefault();

  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem gerenciar notícias.");
    return;
  }

  const idExistente = document.getElementById("noticiaIdForm").value || null;
  const dadosNoticia = {
    categoria: document.getElementById("noticiaCategoriaForm").value,
    titulo: document.getElementById("noticiaTituloForm").value.trim(),
    resumo: document.getElementById("noticiaResumoForm").value.trim(),
    conteudo: document.getElementById("noticiaConteudoForm").value.trim()
  };

  const resultado = salvarNoticiaNoStorage(dadosNoticia, idExistente);

  if (resultado.sucesso) {
    fecharModal("modalNoticiaForm");
    renderizarNoticias();
  } else {
    alert(resultado.mensagem || "Não foi possível salvar a notícia.");
  }
}

// Remove uma notícia após confirmação do usuário (restrito a administradores)
function excluirNoticia(id) {
  if (!administradorLogado()) {
    alert("Apenas administradores autenticados podem excluir notícias.");
    return;
  }

  if (!confirm("Deseja realmente excluir esta notícia?")) return;

  if (excluirNoticiaDoStorage(id)) {
    renderizarNoticias();
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
  renderizarTabelaChamados();
  atualizarEstatisticas();
  atualizarInterfaceAdmin();
  renderizarNoticias();

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