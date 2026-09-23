const prisma = require("../../config/prisma");

function criar(dados) {
  return prisma.usuario.create({ data: dados });
}

function listarTodos() {
  return prisma.usuario.findMany({ orderBy: { dataCadastro: "desc" } });
}

function buscarPorId(id) {
  return prisma.usuario.findUnique({ where: { id } });
}

function buscarPorCpfOuEmail(cpf, email) {
  return prisma.usuario.findFirst({ where: { OR: [{ cpf }, { email }] } });
}

function atualizar(id, dados) {
  return prisma.usuario.update({ where: { id }, data: dados });
}

function remover(id) {
  return prisma.usuario.delete({ where: { id } });
}

module.exports = { criar, listarTodos, buscarPorId, buscarPorCpfOuEmail, atualizar, remover };
