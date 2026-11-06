const service = require("./administrador.service");
const { paraSaidaAdministrador, paraSaidaConvite } = require("./administrador.dto");
const { asyncHandler } = require("../../utils/asyncHandler");
const { AppError } = require("../../utils/appError");

const cadastrar = asyncHandler(async (req, res) => {
  const administrador = await service.cadastrarAdministrador(req.body);
  res.status(201).json(paraSaidaAdministrador(administrador));
});

const criarConvite = asyncHandler(async (req, res) => {
  const { convite, enviado } = await service.criarConvite(req.administrador.id, req.body.email);
  res.status(201).json({
    ...paraSaidaConvite(convite),
    enviado,
    mensagem: enviado
      ? "Convite enviado por e-mail."
      : "E-mail não enviado. Confirme sua senha para visualizar e entregar o token por um canal seguro."
  });
});

const listarConvites = asyncHandler(async (req, res) => {
  const convites = await service.listarConvites();
  res.json(convites.map(paraSaidaConvite));
});

const visualizarTokenConvite = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError("Identificador de convite inválido.", 400);
  const resultado = await service.visualizarTokenConvite(
    req.administrador.id, id, req.body.senhaPrincipal
  );
  res.set("Cache-Control", "no-store").json(resultado);
});

const revogarConvite = asyncHandler(async (req, res) => {
  await service.revogarConvite(Number(req.params.id));
  res.status(204).send();
});

const login = asyncHandler(async (req, res) => {
  const { token, administrador } = await service.autenticarAdministrador(req.body.usuario, req.body.senha);
  res.json({ token, administrador: paraSaidaAdministrador(administrador) });
});

const alterarMinhaSenha = asyncHandler(async (req, res) => {
  await service.alterarSenhaPropria(req.administrador.id, req.body.senhaAtual, req.body.novaSenha);
  res.json({ mensagem: "Senha alterada com sucesso." });
});

const recuperarSenha = asyncHandler(async (req, res) => {
  const { senhaTemporaria, enviado } = await service.recuperarSenha(
    req.administrador.id,
    req.body.email,
    req.body.senhaPrincipal
  );
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
  await service.removerAdministrador(Number(req.params.id), req.administrador.id);
  res.status(204).send();
});

const criarPeloPrincipal = asyncHandler(async (req, res) => {
  const { senhaPrincipal, ...dadosAdministrador } = req.body;
  const { administrador, senhaTemporaria, enviado } = await service.criarAdministradorPeloPrincipal(
    req.administrador.id,
    dadosAdministrador,
    senhaPrincipal
  );
  res.status(201).json({
    ...paraSaidaAdministrador(administrador),
    enviado,
    ...(!enviado && { senhaTemporaria }),
    mensagem: enviado
      ? "Conta criada. A senha temporária foi enviada por e-mail."
      : "Conta criada. E-mail não enviado: entregue a senha temporária por um canal seguro; ela não será exibida novamente."
  });
});

const alterarBloqueio = asyncHandler(async (req, res) => {
  const administrador = await service.alterarBloqueio(Number(req.params.id), req.body.bloqueado, req.administrador.id);
  res.json(paraSaidaAdministrador(administrador));
});

const redefinirSenha = asyncHandler(async (req, res) => {
  const { senhaTemporaria, enviado } = await service.redefinirSenhaAdministrador(
    req.administrador.id,
    Number(req.params.id),
    req.body.senhaPrincipal
  );
  res.json({
    enviado,
    ...(!enviado && { senhaTemporaria }),
    mensagem: enviado
      ? "Senha temporária enviada por e-mail ao administrador."
      : "E-mail não enviado. Entregue a senha temporária por um canal seguro; ela não será exibida novamente."
  });
});

module.exports = {
  cadastrar, criarConvite, listarConvites, visualizarTokenConvite, revogarConvite, login, alterarMinhaSenha, recuperarSenha,
  listar, buscarPorId, atualizar, remover, criarPeloPrincipal, alterarBloqueio, redefinirSenha
};
