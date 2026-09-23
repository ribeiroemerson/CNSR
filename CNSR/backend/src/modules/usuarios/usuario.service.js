const repository = require("./usuario.repository");
const { AppError } = require("../../utils/appError");

async function cadastrarUsuario(dados) {
  const existente = await repository.buscarPorCpfOuEmail(dados.cpf, dados.email);
  if (existente) {
    throw new AppError("Já existe um usuário cadastrado com este CPF ou e-mail.", 409);
  }
  return repository.criar(dados);
}

async function listarUsuarios() {
  return repository.listarTodos();
}

async function buscarUsuarioPorId(id) {
  const usuario = await repository.buscarPorId(id);
  if (!usuario) throw new AppError("Usuário não encontrado.", 404);
  return usuario;
}

async function atualizarUsuario(id, dados) {
  await buscarUsuarioPorId(id);
  return repository.atualizar(id, dados);
}

async function removerUsuario(id) {
  await buscarUsuarioPorId(id);
  return repository.remover(id);
}

module.exports = {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  removerUsuario
};
