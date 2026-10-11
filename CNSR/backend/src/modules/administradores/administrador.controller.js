const service = require("./administrador.service");
const { paraSaidaAdministrador, paraSaidaConvite } = require("./administrador.dto");
const { asyncHandler } = require("../../utils/asyncHandler");

const cadastrar = asyncHandler(async (req, res) => {
  const administrador = await service.cadastrarAdministrador(req.body);
  res.status(201).json(paraSaidaAdministrador(administrador));
});

const criarConvite = asyncHandler(async (req, res) => {
  const { convite, token, enviado } = await service.criarConvite(req.administrador.id, req.body.email);
  res.status(201).json({
    ...paraSaidaConvite(convite),
    enviado,
    ...(!enviado && { token }),
    mensagem: enviado
      ? "Convite enviado por e-mail."
      : "E-mail não enviado (Gmail não configurado ou falhou). Entregue este token ao convidado; ele não será exibido novamente."
  });
});

const listarConvites = asyncHandler(async (req, res) => {
  const convites = await service.listarConvites();
  res.json(convites.map(paraSaidaConvite));
});

const revogarConvite = asyncHandler(async (req, res) => {
  await service.revogarConvite(Number(req.params.id));
  res.status(204).send();
});

const login = asyncHandler(async (req, res) => {
  const { token, administrador } = await service.autenticarAdministrador(req.body.usuario, req.body.senha);
  res.json({ token, administrador: paraSaidaAdministrador(administrador) });
});

const recuperarSenha = asyncHandler(async (req, res) => {
  const { senhaTemporaria, enviado } = await service.recuperarSenha(req.body.email);
  res.json({
    enviado,
    ...(!enviado && { senhaTemporaria }),
    mensagem: enviado
      ? "Senha temporária enviada por e-mail ao administrador."
      : "E-mail não enviado (Gmail não configurado ou falhou). Entregue a senha temporária por um canal seguro."
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

module.exports = { cadastrar, criarConvite, listarConvites, revogarConvite, login, recuperarSenha, listar, buscarPorId, atualizar, remover };
