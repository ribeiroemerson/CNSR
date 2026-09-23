const service = require("./usuario.service");
const { paraSaidaUsuario } = require("./usuario.dto");
const { asyncHandler } = require("../../utils/asyncHandler");

const criar = asyncHandler(async (req, res) => {
  const usuario = await service.cadastrarUsuario(req.body);
  res.status(201).json(paraSaidaUsuario(usuario));
});

const listar = asyncHandler(async (req, res) => {
  const usuarios = await service.listarUsuarios();
  res.json(usuarios.map(paraSaidaUsuario));
});

const buscarPorId = asyncHandler(async (req, res) => {
  const usuario = await service.buscarUsuarioPorId(Number(req.params.id));
  res.json(paraSaidaUsuario(usuario));
});

const atualizar = asyncHandler(async (req, res) => {
  const usuario = await service.atualizarUsuario(Number(req.params.id), req.body);
  res.json(paraSaidaUsuario(usuario));
});

const remover = asyncHandler(async (req, res) => {
  await service.removerUsuario(Number(req.params.id));
  res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, remover };
