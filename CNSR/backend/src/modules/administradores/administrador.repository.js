const prisma = require("../../config/prisma");

function criar(dados) {
  return prisma.administrador.create({ data: dados });
}

function listarTodos() {
  return prisma.administrador.findMany({ orderBy: { dataCadastro: "desc" } });
}

function buscarPorId(id) {
  return prisma.administrador.findUnique({ where: { id } });
}

function buscarPorUsuario(usuario) {
  return prisma.administrador.findUnique({ where: { usuario } });
}

function buscarPorEmail(email) {
  return prisma.administrador.findUnique({ where: { email } });
}

function buscarPorUsuarioOuEmail(usuario, email) {
  return prisma.administrador.findFirst({
    where: { OR: [{ usuario }, { email: { equals: email, mode: "insensitive" } }] }
  });
}

function buscarPorEmailSemCaixa(email) {
  return prisma.administrador.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
}

function existePrincipal() {
  return prisma.administrador.count({ where: { principal: true } }).then(total => total > 0);
}

function buscarConvitePorTokenHash(tokenHash) {
  return prisma.conviteAdministrador.findUnique({ where: { tokenHash } });
}

function criarConvite(dados) {
  return prisma.conviteAdministrador.create({ data: dados });
}

function removerConvitesPendentesPorEmail(email) {
  return prisma.conviteAdministrador.deleteMany({
    where: { email, usadoEm: null }
  });
}

function listarConvitesPendentes() {
  return prisma.conviteAdministrador.findMany({
    where: { usadoEm: null, expiraEm: { gt: new Date() } },
    orderBy: { criadoEm: "desc" }
  });
}

function removerConvitePendente(id) {
  return prisma.conviteAdministrador.deleteMany({ where: { id, usadoEm: null } });
}

// Cria o administrador e consome o convite na mesma transação.
// O updateMany condicional impede que o mesmo convite seja usado duas vezes em requisições simultâneas.
function criarComConvite(dadosAdministrador, conviteId) {
  return prisma.$transaction(async tx => {
    const consumido = await tx.conviteAdministrador.updateMany({
      where: { id: conviteId, usadoEm: null, expiraEm: { gt: new Date() } },
      data: { usadoEm: new Date() }
    });
    if (consumido.count !== 1) return null;
    return tx.administrador.create({ data: dadosAdministrador });
  });
}

function atualizarSenha(id, senhaHash) {
  return prisma.administrador.update({ where: { id }, data: { senhaHash } });
}

function atualizar(id, dados) {
  return prisma.administrador.update({ where: { id }, data: dados });
}

function remover(id) {
  return prisma.administrador.delete({ where: { id } });
}

module.exports = {
  criar,
  listarTodos,
  buscarPorId,
  buscarPorUsuario,
  buscarPorEmail,
  buscarPorUsuarioOuEmail,
  buscarPorEmailSemCaixa,

  buscarConvitePorTokenHash,
  criarConvite,
  removerConvitesPendentesPorEmail,
  listarConvitesPendentes,
  removerConvitePendente,
  criarComConvite,
  atualizarSenha,
  atualizar,
  remover
};
