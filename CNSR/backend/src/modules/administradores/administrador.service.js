const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const repository = require("./administrador.repository");
const { AppError } = require("../../utils/appError");

const SALT_ROUNDS = 10;

async function cadastrarAdministrador({ nomeCompleto, email, usuario, senha }) {
  const existente = await repository.buscarPorUsuarioOuEmail(usuario, email);
  if (existente) {
    throw new AppError("Já existe um administrador com este usuário ou e-mail.", 409);
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
  return repository.criar({ nomeCompleto, email, usuario, senhaHash });
}

async function autenticarAdministrador(usuario, senha) {
  const administrador = await repository.buscarPorUsuario(usuario);
  if (!administrador) throw new AppError("Usuário ou senha inválidos.", 401);

  const senhaValida = await bcrypt.compare(senha, administrador.senhaHash);
  if (!senhaValida) throw new AppError("Usuário ou senha inválidos.", 401);

  const token = jwt.sign(
    { id: administrador.id, usuario: administrador.usuario },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, administrador };
}

// Sem serviço de e-mail configurado: gera uma senha temporária e a devolve na resposta
async function recuperarSenha(email) {
  const administrador = await repository.buscarPorEmail(email);
  if (!administrador) throw new AppError("Nenhum administrador encontrado com este e-mail.", 404);

  const senhaTemporaria = crypto.randomBytes(6).toString("hex");
  const senhaHash = await bcrypt.hash(senhaTemporaria, SALT_ROUNDS);
  await repository.atualizarSenha(administrador.id, senhaHash);

  return { senhaTemporaria };
}

async function listarAdministradores() {
  return repository.listarTodos();
}

async function buscarAdministradorPorId(id) {
  const administrador = await repository.buscarPorId(id);
  if (!administrador) throw new AppError("Administrador não encontrado.", 404);
  return administrador;
}

async function atualizarAdministrador(id, dados) {
  await buscarAdministradorPorId(id);
  return repository.atualizar(id, dados);
}

async function removerAdministrador(id) {
  await buscarAdministradorPorId(id);
  return repository.remover(id);
}

module.exports = {
  cadastrarAdministrador,
  autenticarAdministrador,
  recuperarSenha,
  listarAdministradores,
  buscarAdministradorPorId,
  atualizarAdministrador,
  removerAdministrador
};
