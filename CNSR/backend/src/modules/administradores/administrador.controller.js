const service = require("./administrador.service");
const { paraSaidaAdministrador } = require("./administrador.dto");
const { asyncHandler } = require("../../utils/asyncHandler");

const cadastrar = asyncHandler(async (req, res) => {
  const administrador = await service.cadastrarAdministrador(req.body);
  res.status(201).json(paraSaidaAdministrador(administrador));
});

const login = asyncHandler(async (req, res) => {
  const { token, administrador } = await service.autenticarAdministrador(req.body.usuario, req.body.senha);
  res.json({ token, administrador: paraSaidaAdministrador(administrador) });
});

const recuperarSenha = asyncHandler(async (req, res) => {
  const { senhaTemporaria } = await service.recuperarSenha(req.body.email);
  res.json({
    mensagem: "Senha temporária gerada. Em produção, ela seria enviada por e-mail.",
    senhaTemporaria
  });
});

const listar = asyncHandler(async (req, res) => {
  const administradores = await service.listarAdministradores();
  res.json(administradores.map(paraSaidaAdministrador));
});

const buscarPorId = asyncHandler(async (req, res) => {
  const administrador = await service.buscarAdministradorPorId(Number(req.params.id));
  res.json(paraSaidaAdministrador(administrador));
});

const atualizar = asyncHandler(async (req, res) => {
  const administrador = await service.atualizarAdministrador(Number(req.params.id), req.body);
  res.json(paraSaidaAdministrador(administrador));
});

const remover = asyncHandler(async (req, res) => {
  await service.removerAdministrador(Number(req.params.id));
  res.status(204).send();
});

module.exports = { cadastrar, login, recuperarSenha, listar, buscarPorId, atualizar, remover };
