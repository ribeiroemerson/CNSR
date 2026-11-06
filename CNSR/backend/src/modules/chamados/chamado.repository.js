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

function listarTodos(categoria) {
  return prisma.chamado.findMany({ where: categoria ? { categoria } : {}, orderBy: { criadoEm: "desc" } });
}

function buscarPorId(id, categoria) {
  return prisma.chamado.findFirst({ where: { id, ...(categoria && { categoria }) } });
}

function buscarPorProtocolo(protocolo) {
  return prisma.chamado.findUnique({ where: { protocolo } });
}

function buscarPorTelefone(telefone) {
  return prisma.$queryRaw`
    SELECT * FROM "chamados"
    WHERE regexp_replace("telefone", '[^0-9]', '', 'g') = ${telefone}
    ORDER BY "criadoEm" DESC
  `;
}

function atualizarStatus(id, status, categoria) {
  return prisma.chamado.updateMany({ where: { id, ...(categoria && { categoria }) }, data: { status } });
}

function remover(id, categoria) {
  return prisma.chamado.deleteMany({ where: { id, ...(categoria && { categoria }) } });
}

async function estatisticas() {
  const [total, concluidos] = await prisma.$transaction([
    prisma.chamado.count(),
    prisma.chamado.count({ where: { status: "CONCLUIDO" } })
  ]);
  return { total, concluidos };
}

module.exports = {
  criar,
  listarTodos,
  buscarPorId,
  buscarPorProtocolo,
  buscarPorTelefone,
  atualizarStatus,
  remover,
  estatisticas
};
