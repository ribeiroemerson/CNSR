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
  return prisma.administrador.findFirst({ where: { OR: [{ usuario }, { email }] } });
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
  atualizarSenha,
  atualizar,
  remover
};
