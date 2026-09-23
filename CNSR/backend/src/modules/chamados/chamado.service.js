const repository = require("./chamado.repository");
const { AppError } = require("../../utils/appError");

async function criarChamado(dados) {
  return repository.criar(dados);
}

async function listarChamados() {
  return repository.listarTodos();
}

async function buscarChamadoPorId(id) {
  const chamado = await repository.buscarPorId(id);
  if (!chamado) throw new AppError("Chamado não encontrado.", 404);
  return chamado;
}

async function buscarChamadoPorProtocolo(protocolo) {
  const chamado = await repository.buscarPorProtocolo(protocolo);
  if (!chamado) throw new AppError("Chamado não encontrado.", 404);
  return chamado;
}

async function atualizarStatusChamado(id, status) {
  await buscarChamadoPorId(id);
  return repository.atualizarStatus(id, status);
}

async function removerChamado(id) {
  await buscarChamadoPorId(id);
  return repository.remover(id);
}

module.exports = {
  criarChamado,
  listarChamados,
  buscarChamadoPorId,
  buscarChamadoPorProtocolo,
  atualizarStatusChamado,
  removerChamado
};
