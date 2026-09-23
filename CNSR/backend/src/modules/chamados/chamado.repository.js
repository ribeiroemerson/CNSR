const prisma = require("../../config/prisma");

function gerarProtocolo() {
  const ano = new Date().getFullYear();
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `NSR-${ano}-${numero}`;
}

function criar(dados) {
  return prisma.chamado.create({
    data: { ...dados, protocolo: gerarProtocolo() }
  });
}

function listarTodos() {
  return prisma.chamado.findMany({ orderBy: { criadoEm: "desc" } });
}

function buscarPorId(id) {
  return prisma.chamado.findUnique({ where: { id } });
}

function buscarPorProtocolo(protocolo) {
  return prisma.chamado.findUnique({ where: { protocolo } });
}

function atualizarStatus(id, status) {
  return prisma.chamado.update({ where: { id }, data: { status } });
}

function remover(id) {
  return prisma.chamado.delete({ where: { id } });
}

module.exports = {
  criar,
  listarTodos,
  buscarPorId,
  buscarPorProtocolo,
  atualizarStatus,
  remover
};
