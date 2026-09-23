const prisma = require("../../config/prisma");

function criar(dados) {
  return prisma.noticia.create({ data: dados });
}

function listarTodas() {
  return prisma.noticia.findMany({ orderBy: { criadoEm: "desc" } });
}

function buscarPorId(id) {
  return prisma.noticia.findUnique({ where: { id } });
}

function atualizar(id, dados) {
  return prisma.noticia.update({ where: { id }, data: dados });
}

function remover(id) {
  return prisma.noticia.delete({ where: { id } });
}

module.exports = { criar, listarTodas, buscarPorId, atualizar, remover };
