const repository = require("./noticia.repository");
const { AppError } = require("../../utils/appError");

async function criarNoticia(dados) {
  return repository.criar(dados);
}

async function listarNoticias() {
  return repository.listarTodas();
}

async function buscarNoticiaPorId(id) {
  const noticia = await repository.buscarPorId(id);
  if (!noticia) throw new AppError("Notícia não encontrada.", 404);
  return noticia;
}

async function atualizarNoticia(id, dados) {
  await buscarNoticiaPorId(id);
  return repository.atualizar(id, dados);
}

async function removerNoticia(id) {
  await buscarNoticiaPorId(id);
  return repository.remover(id);
}

module.exports = {
  criarNoticia,
  listarNoticias,
  buscarNoticiaPorId,
  atualizarNoticia,
  removerNoticia
};
