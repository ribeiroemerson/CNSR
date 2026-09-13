// ==========================================
// CONFIGURAÇÃO DE CHAVES E INICIALIZAÇÃO
// ==========================================
const STORAGE_KEYS = {
  CHAMADOS: "conecta_nsr_chamados",
  USUARIOS: "conecta_nsr_usuarios",
  SESSAO_ATIVA: "conecta_nsr_sessao"
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
  usuarios: []
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

// Limpa todos os dados da aplicação no Storage
function resetarStorage() {
  localStorage.removeItem(STORAGE_KEYS.CHAMADOS);
  localStorage.removeItem(STORAGE_KEYS.USUARIOS);
  localStorage.removeItem(STORAGE_KEYS.SESSAO_ATIVA);
  location.reload();
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

// ... (seus códigos anteriores do script.js) ...


// ==========================================
// CÓDIGO DO BOTÃO "+ NOVA SOLICITAÇÃO"
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const btnNovaSolicitacao = document.getElementById("btnNovoChamado");

  if (btnNovaSolicitacao) {
    btnNovaSolicitacao.addEventListener("click", (e) => {
      e.preventDefault();
      
      const secaoFormulario = document.getElementById("chamados") || document.querySelector("form");
      const primeiroCampo = document.getElementById("nomeCidadao") || document.querySelector("form input");

      if (secaoFormulario) {
        secaoFormulario.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          if (primeiroCampo) primeiroCampo.focus();
        }, 400);
      }
    });
  }
});