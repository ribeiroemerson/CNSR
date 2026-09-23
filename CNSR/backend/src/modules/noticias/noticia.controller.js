const service = require("./noticia.service");
const { paraSaidaNoticia } = require("./noticia.dto");
const { asyncHandler } = require("../../utils/asyncHandler");

const criar = asyncHandler(async (req, res) => {
  // O autor é sempre o administrador autenticado, nunca um valor vindo do cliente
  const noticia = await service.criarNoticia({ ...req.body, administradorId: req.administrador.id });
  res.status(201).json(paraSaidaNoticia(noticia));
});

const listar = asyncHandler(async (req, res) => {
  const noticias = await service.listarNoticias();
  res.json(noticias.map(paraSaidaNoticia));
});

const buscarPorId = asyncHandler(async (req, res) => {
  const noticia = await service.buscarNoticiaPorId(Number(req.params.id));
  res.json(paraSaidaNoticia(noticia));
});

const atualizar = asyncHandler(async (req, res) => {
  const noticia = await service.atualizarNoticia(Number(req.params.id), req.body);
  res.json(paraSaidaNoticia(noticia));
});

const remover = asyncHandler(async (req, res) => {
  await service.removerNoticia(Number(req.params.id));
  res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, remover };
