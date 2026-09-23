const service = require("./chamado.service");
const { paraSaidaChamado } = require("./chamado.dto");
const { asyncHandler } = require("../../utils/asyncHandler");

const criar = asyncHandler(async (req, res) => {
  const chamado = await service.criarChamado(req.body);
  res.status(201).json(paraSaidaChamado(chamado));
});

const listar = asyncHandler(async (req, res) => {
  const chamados = await service.listarChamados();
  res.json(chamados.map(paraSaidaChamado));
});

const buscarPorId = asyncHandler(async (req, res) => {
  const chamado = await service.buscarChamadoPorId(Number(req.params.id));
  res.json(paraSaidaChamado(chamado));
});

const buscarPorProtocolo = asyncHandler(async (req, res) => {
  const chamado = await service.buscarChamadoPorProtocolo(req.params.protocolo);
  res.json(paraSaidaChamado(chamado));
});

const atualizarStatus = asyncHandler(async (req, res) => {
  const chamado = await service.atualizarStatusChamado(Number(req.params.id), req.body.status);
  res.json(paraSaidaChamado(chamado));
});

const remover = asyncHandler(async (req, res) => {
  await service.removerChamado(Number(req.params.id));
  res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, buscarPorProtocolo, atualizarStatus, remover };
