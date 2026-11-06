const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const repository = require("./administrador.repository");
const { AppError } = require("../../utils/appError");
const { enviarEmail } = require("../../services/emailService");

const SALT_ROUNDS = 10;
const VALIDADE_CONVITE_MS = 48 * 60 * 60 * 1000;

function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

function gerarHashToken(token) {
  return crypto.createHash("sha256").update(String(token).trim()).digest("hex");
}

// Valida o convite sem revelar o motivo da recusa (inexistente, expirado, usado ou de outro e-mail)
async function obterConviteValido(tokenConvite, email) {
  const convite = await repository.buscarConvitePorTokenHash(gerarHashToken(tokenConvite));
  const valido =
    convite &&
    !convite.usadoEm &&
    convite.expiraEm > new Date() &&
    convite.email === email;

  if (!valido) {
    throw new AppError("Convite inválido, expirado ou não destinado a este e-mail.", 403);
  }
  return convite;
}

// O primeiro administrador (principal) só pode ser criado com o e-mail definido em ADMIN_PRINCIPAL_EMAIL
async function podeCriarPrincipal(email) {
  const emailPrincipal = process.env.ADMIN_PRINCIPAL_EMAIL;
  if (!emailPrincipal || normalizarEmail(emailPrincipal) !== email) return false;
  return !(await repository.existePrincipal());
}

async function cadastrarAdministrador({ nomeCompleto, email, usuario, senha, tokenConvite }) {
  const emailNormalizado = normalizarEmail(email);

  const existente = await repository.buscarPorUsuarioOuEmail(usuario, emailNormalizado);
  if (existente) {
    throw new AppError("Já existe um administrador com este usuário ou e-mail.", 409);
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
  const dados = { nomeCompleto, email: emailNormalizado, usuario, senhaHash };

  if (!tokenConvite) {
    if (!(await podeCriarPrincipal(emailNormalizado))) {
      throw new AppError("O cadastro de administradores exige um convite do administrador principal.", 403);
    }
    return repository.criar({ ...dados, principal: true });
  }

  const convite = await obterConviteValido(tokenConvite, emailNormalizado);
  const administrador = await repository.criarComConvite(dados, convite.id);
  if (!administrador) {
    throw new AppError("Convite inválido, expirado ou não destinado a este e-mail.", 403);
  }
  return administrador;
}

async function criarConvite(administradorId, email) {
  const emailNormalizado = normalizarEmail(email);

  const existente = await repository.buscarPorEmailSemCaixa(emailNormalizado);
  if (existente) {
    throw new AppError("Já existe um administrador com este e-mail.", 409);
  }

  // Um único convite pendente por e-mail: gerar outro invalida o anterior
  await repository.removerConvitesPendentesPorEmail(emailNormalizado);

  const token = crypto.randomBytes(24).toString("base64url");
  const convite = await repository.criarConvite({
    email: emailNormalizado,
    tokenHash: gerarHashToken(token),
    expiraEm: new Date(Date.now() + VALIDADE_CONVITE_MS),
    criadoPorId: administradorId
  });

  const enviado = await enviarEmail({
    para: emailNormalizado,
    assunto: "Convite de administrador - Conecta Nova Santa Rita",
    texto:
      "Você foi convidado para ser administrador do portal Conecta Nova Santa Rita.\n\n" +
      `Token de convite: ${token}\n\n` +
      "Use este token, com este mesmo e-mail, no cadastro de administrador. Ele vale por 48 horas e só pode ser usado uma vez."
  });

  return { convite, token, enviado };
}

function listarConvites() {
  return repository.listarConvitesPendentes();
}

async function revogarConvite(id) {
  const { count } = await repository.removerConvitePendente(id);
  if (count === 0) throw new AppError("Convite pendente não encontrado.", 404);
}

async function autenticarAdministrador(usuario, senha) {
  const administrador = await repository.buscarPorUsuario(usuario);
  if (!administrador) throw new AppError("Usuário ou senha inválidos.", 401);

  const senhaValida = await bcrypt.compare(senha, administrador.senhaHash);
  if (!senhaValida) throw new AppError("Usuário ou senha inválidos.", 401);

  if (administrador.bloqueado) {
    throw new AppError("Esta conta está bloqueada. Procure o administrador principal.", 403);
  }

  const token = jwt.sign(
    { id: administrador.id, usuario: administrador.usuario },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, administrador };
}

async function alterarSenhaPropria(id, senhaAtual, novaSenha) {
  const administrador = await buscarAdministradorPorId(id);
  const senhaAtualValida = await bcrypt.compare(senhaAtual, administrador.senhaHash);
  if (!senhaAtualValida) throw new AppError("A senha atual está incorreta.", 400);

  if (senhaAtual === novaSenha) {
    throw new AppError("A nova senha deve ser diferente da senha atual.", 400);
  }

  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  await repository.atualizarSenha(id, senhaHash);
}

// Gera e grava uma senha temporária; se o Gmail estiver configurado, ela vai por e-mail ao administrador
async function gerarSenhaTemporaria(administrador, assunto, abertura) {
  const senhaTemporaria = crypto.randomBytes(6).toString("hex");
  const senhaHash = await bcrypt.hash(senhaTemporaria, SALT_ROUNDS);
  await repository.atualizarSenha(administrador.id, senhaHash);

  const enviado = await enviarEmail({
    para: administrador.email,
    assunto,
    texto:
      `Olá, ${administrador.nomeCompleto}.\n\n${abertura}\n\n` +
      `Senha temporária: ${senhaTemporaria}\n\n` +
      "Entre com ela e altere a senha assim que possível."
  });

  return { senhaTemporaria, enviado };
}

async function recuperarSenha(email) {
  const administrador = await repository.buscarPorEmail(email);
  if (!administrador) throw new AppError("Nenhum administrador encontrado com este e-mail.", 404);

  return gerarSenhaTemporaria(administrador, "Senha temporária - Conecta Nova Santa Rita", "Sua senha foi redefinida.");
}

async function redefinirSenhaAdministrador(id) {
  const administrador = await buscarAdministradorPorId(id);
  return gerarSenhaTemporaria(administrador, "Senha temporária - Conecta Nova Santa Rita", "Sua senha foi redefinida pelo administrador principal.");
}

async function listarAdministradores() {
  return repository.listarTodos();
}

async function buscarAdministradorPorId(id) {
  const administrador = await repository.buscarPorId(id);
  if (!administrador) throw new AppError("Administrador não encontrado.", 404);
  return administrador;
}

// O principal cria a conta diretamente; a senha temporária é gerada pelo sistema
async function criarAdministradorPeloPrincipal({ nomeCompleto, email, usuario }) {
  const emailNormalizado = normalizarEmail(email);

  const existente = await repository.buscarPorUsuarioOuEmail(usuario, emailNormalizado);
  if (existente) throw new AppError("Já existe um administrador com este usuário ou e-mail.", 409);

  const administrador = await repository.criar({
    nomeCompleto,
    email: emailNormalizado,
    usuario,
    senhaHash: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), SALT_ROUNDS)
  });

  const credenciais = await gerarSenhaTemporaria(
    administrador,
    "Sua conta de administrador - Conecta Nova Santa Rita",
    `Sua conta de administrador foi criada. Usuário: ${usuario}`
  );

  return { administrador, ...credenciais };
}

async function atualizarAdministrador(id, dados) {
  await buscarAdministradorPorId(id);

  const alteracoes = { ...dados };
  if (alteracoes.email) alteracoes.email = normalizarEmail(alteracoes.email);

  const conflito = await repository.buscarConflito(id, alteracoes.usuario, alteracoes.email);
  if (conflito) throw new AppError("Já existe um administrador com este usuário ou e-mail.", 409);

  return repository.atualizar(id, alteracoes);
}

// O principal não pode ser bloqueado nem removido, e ninguém age sobre a própria conta
async function buscarAdministradorGerenciavel(id, solicitanteId, acao) {
  const administrador = await buscarAdministradorPorId(id);
  if (administrador.principal || administrador.id === solicitanteId) {
    throw new AppError(`Não é possível ${acao} a conta do administrador principal.`, 400);
  }
  return administrador;
}

async function alterarBloqueio(id, bloqueado, solicitanteId) {
  await buscarAdministradorGerenciavel(id, solicitanteId, "bloquear");
  return repository.atualizar(id, { bloqueado });
}

async function removerAdministrador(id, solicitanteId) {
  await buscarAdministradorGerenciavel(id, solicitanteId, "remover");
  await repository.removerTransferindoNoticias(id, solicitanteId);
}

module.exports = {
  cadastrarAdministrador,
  criarConvite,
  listarConvites,
  revogarConvite,
  autenticarAdministrador,
  alterarSenhaPropria,
  recuperarSenha,
  redefinirSenhaAdministrador,
  criarAdministradorPeloPrincipal,
  alterarBloqueio,
  listarAdministradores,
  buscarAdministradorPorId,
  atualizarAdministrador,
  removerAdministrador
};
