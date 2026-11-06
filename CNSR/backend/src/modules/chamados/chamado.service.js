const repository = require("./chamado.repository");
const { AppError } = require("../../utils/appError");

async function criarChamado(dados) {
  return repository.criar(dados);
}

function categoriaPermitida(administrador) {
  if (administrador.principal) return null;
  if (!administrador.secretaria) throw new AppError("Sua conta ainda não está vinculada a uma secretaria. Contate o administrador principal.", 403);
  return administrador.secretaria;
}

async function listarChamados(administrador) {
  return repository.listarTodos(categoriaPermitida(administrador));
}

async function buscarChamadoPorId(id, administrador) {
  const chamado = await repository.buscarPorId(id, categoriaPermitida(administrador));
  if (!chamado) throw new AppError("Chamado não encontrado.", 404);
  return chamado;
}

async function buscarChamadoPorProtocolo(protocolo) {
  const chamado = await repository.buscarPorProtocolo(protocolo);
  if (!chamado) throw new AppError("Chamado não encontrado.", 404);
  return chamado;
}

async function atualizarStatusChamado(id, status, administrador) {
  const categoria = categoriaPermitida(administrador);
  const { count } = await repository.atualizarStatus(id, status, categoria);
  if (!count) throw new AppError("Chamado não encontrado.", 404);
  return buscarChamadoPorId(id, administrador);
}

async function removerChamado(id, administrador) {
  const { count } = await repository.remover(id, categoriaPermitida(administrador));
  if (!count) throw new AppError("Chamado não encontrado.", 404);
}

module.exports = {
  criarChamado,
  listarChamados,
  buscarChamadoPorId,
  buscarChamadoPorProtocolo,
  buscarChamadosPorTelefone: repository.buscarPorTelefone,
  atualizarStatusChamado,
  removerChamado,
  estatisticas: repository.estatisticas
};
