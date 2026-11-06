const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./administrador.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar, exigirAdministradorPrincipal } = require("../../middlewares/auth");
const {
  cadastrarAdministradorSchema,
  criarAdministradorSchema,
  bloqueioAdministradorSchema,
  alterarSenhaPropriaSchema,
  confirmarSenhaPrincipalSchema,
  criarConviteSchema,
  loginAdministradorSchema,
  recuperarSenhaSchema,
  atualizarAdministradorSchema
} = require("./administrador.dto");

// Limita tentativas de login/recuperação de senha para mitigar força bruta
const limitadorAutenticacao = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: "Muitas tentativas. Tente novamente em alguns minutos." }
});

const limitadorConfirmacaoSenha = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: "Muitas confirmações de senha. Tente novamente em alguns minutos." }
});

// Limita tentativas de cadastro para dificultar a adivinhação de tokens de convite
const limitadorCadastro = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: "Muitas tentativas. Tente novamente em alguns minutos." }
});

const router = Router();

/**
 * @openapi
 * /administradores:
 *   post:
 *     summary: Cadastra um novo administrador (exige token de convite do administrador principal)
 *     tags: [Administradores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovoAdministrador'
 *     responses:
 *       201:
 *         description: Administrador cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Administrador'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Convite ausente, inválido, expirado ou destinado a outro e-mail
 *       409:
 *         description: Usuário ou e-mail já cadastrado
 *   get:
 *     summary: Lista os administradores cadastrados
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de administradores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Administrador'
 */
router.post("/", limitadorCadastro, validate(cadastrarAdministradorSchema), controller.cadastrar);

/**
 * @openapi
 * /administradores/convites:
 *   post:
 *     summary: Gera um token de convite para um e-mail (apenas administrador principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Convite criado sem retornar o token
 *       403:
 *         description: Apenas o administrador principal pode convidar
 *       409:
 *         description: Já existe um administrador com este e-mail
 *   get:
 *     summary: Lista os convites pendentes (apenas administrador principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Convites pendentes e ainda válidos
 * /administradores/convites/{id}/token:
 *   post:
 *     summary: Visualiza token de convite válido mediante confirmação da senha do principal
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmarSenhaPrincipal'
 *     responses:
 *       200:
 *         description: Token de convite
 *       400:
 *         description: Senha de confirmação inválida
 *       404:
 *         description: Convite inexistente, usado ou expirado
 *       409:
 *         description: Token não recuperável; gere um novo convite
 * /administradores/convites/{id}:
 *   delete:
 *     summary: Revoga um convite pendente (apenas administrador principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Convite revogado
 *       404:
 *         description: Convite pendente não encontrado
 */
router.post("/convites", autenticar, exigirAdministradorPrincipal, validate(criarConviteSchema), controller.criarConvite);
router.get("/convites", autenticar, exigirAdministradorPrincipal, controller.listarConvites);
router.post("/convites/:id/token", autenticar, exigirAdministradorPrincipal, limitadorConfirmacaoSenha, validate(confirmarSenhaPrincipalSchema), controller.visualizarTokenConvite);
router.delete("/convites/:id", autenticar, exigirAdministradorPrincipal, controller.revogarConvite);

/**
 * @openapi
 * /administradores/login:
 *   post:
 *     summary: Autentica um administrador e retorna um token JWT
 *     tags: [Administradores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginAdministrador'
 *     responses:
 *       200:
 *         description: Autenticado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenAdministrador'
 *       401:
 *         description: Usuário ou senha inválidos
 *       429:
 *         description: Muitas tentativas, tente novamente mais tarde
 */
router.post("/login", limitadorAutenticacao, validate(loginAdministradorSchema), controller.login);

/**
 * @openapi
 * /administradores/minha-senha:
 *   patch:
 *     summary: Altera a senha do administrador principal autenticado
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlterarSenhaAdministrador'
 *     responses:
 *       200:
 *         description: Senha alterada
 *       400:
 *         description: Senha atual incorreta ou dados inválidos
 *       401:
 *         description: Autenticação necessária
 *       403:
 *         description: Apenas o administrador principal pode alterar a própria senha por esta rota
 */
router.patch(
  "/minha-senha",
  autenticar,
  exigirAdministradorPrincipal,
  limitadorAutenticacao,
  validate(alterarSenhaPropriaSchema),
  controller.alterarMinhaSenha
);

/**
 * @openapi
 * /administradores/recuperar-senha:
 *   post:
 *     summary: Gera senha temporária para um administrador (apenas administrador principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecuperarSenha'
 *     responses:
 *       200:
 *         description: Senha temporária gerada
 *       403:
 *         description: Apenas o administrador principal pode redefinir senhas
 *       400:
 *         description: Senha de acesso do administrador principal incorreta
 *       404:
 *         description: E-mail não encontrado
 */
router.post(
  "/recuperar-senha",
  autenticar,
  exigirAdministradorPrincipal,
  limitadorConfirmacaoSenha,
  validate(recuperarSenhaSchema),
  controller.recuperarSenha
);

/**
 * @openapi
 * /administradores/{id}:
 *   get:
 *     summary: Busca um administrador pelo id
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Administrador encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Administrador'
 *       404:
 *         description: Administrador não encontrado
 *   put:
 *     summary: Atualiza os dados de um administrador
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               usuario:
 *                 type: string
 *               secretaria:
 *                 type: string
 *                 enum: [Iluminação Pública, Obras e Vias, Limpeza Urbana, Saneamento e Água, Meio Ambiente, Trânsito e Mobilidade]
 *     responses:
 *       200:
 *         description: Administrador atualizado
 *       409:
 *         description: Usuário ou e-mail já em uso
 *       404:
 *         description: Administrador não encontrado
 *   delete:
 *     summary: Remove um administrador (apenas principal; as notícias passam ao principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Administrador removido
 *       400:
 *         description: Não é possível remover o principal nem a própria conta
 *       404:
 *         description: Administrador não encontrado
 * /administradores/criar:
 *   post:
 *     summary: Cria um administrador diretamente (apenas principal); gera senha temporária
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomeCompleto, email, usuario, secretaria, senhaPrincipal]
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               usuario:
 *                 type: string
 *               secretaria:
 *                 type: string
 *                 enum: [Iluminação Pública, Obras e Vias, Limpeza Urbana, Saneamento e Água, Meio Ambiente, Trânsito e Mobilidade]
 *               senhaPrincipal:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Conta criada; senha temporária enviada por e-mail ou devolvida uma única vez
 *       400:
 *         description: Senha de acesso do administrador principal incorreta ou dados inválidos
 *       409:
 *         description: Usuário ou e-mail já em uso
 * /administradores/{id}/bloqueio:
 *   patch:
 *     summary: Bloqueia ou desbloqueia um administrador (apenas principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bloqueado]
 *             properties:
 *               bloqueado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Situação da conta atualizada
 *       400:
 *         description: Não é possível bloquear o principal nem a própria conta
 * /administradores/{id}/redefinir-senha:
 *   post:
 *     summary: Gera nova senha temporária para um administrador (apenas principal)
 *     tags: [Administradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmarSenhaPrincipal'
 *     responses:
 *       200:
 *         description: Senha temporária enviada por e-mail ou devolvida uma única vez
 */
// Gestão de administradores: restrita ao administrador principal
router.post(
  "/criar",
  autenticar,
  exigirAdministradorPrincipal,
  limitadorConfirmacaoSenha,
  validate(criarAdministradorSchema),
  controller.criarPeloPrincipal
);
router.get("/", autenticar, exigirAdministradorPrincipal, controller.listar);
router.get("/:id", autenticar, exigirAdministradorPrincipal, controller.buscarPorId);
router.put("/:id", autenticar, exigirAdministradorPrincipal, validate(atualizarAdministradorSchema), controller.atualizar);
router.patch("/:id/bloqueio", autenticar, exigirAdministradorPrincipal, validate(bloqueioAdministradorSchema), controller.alterarBloqueio);
router.post(
  "/:id/redefinir-senha",
  autenticar,
  exigirAdministradorPrincipal,
  limitadorConfirmacaoSenha,
  validate(confirmarSenhaPrincipalSchema),
  controller.redefinirSenha
);
router.delete("/:id", autenticar, exigirAdministradorPrincipal, controller.remover);

module.exports = router;
