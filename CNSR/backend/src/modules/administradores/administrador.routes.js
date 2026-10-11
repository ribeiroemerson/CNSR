const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./administrador.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar, exigirAdministradorPrincipal } = require("../../middlewares/auth");
const {
  cadastrarAdministradorSchema,
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
 *         description: Convite criado; o token é exibido uma única vez
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
 *       404:
 *         description: E-mail não encontrado
 */
router.post("/recuperar-senha", autenticar, exigirAdministradorPrincipal, validate(recuperarSenhaSchema), controller.recuperarSenha);

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
 *     responses:
 *       200:
 *         description: Administrador atualizado
 *       404:
 *         description: Administrador não encontrado
 *   delete:
 *     summary: Remove um administrador
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
 *       404:
 *         description: Administrador não encontrado
 */
// Gestão de administradores: restrita a administradores autenticados
router.get("/", autenticar, controller.listar);
router.get("/:id", autenticar, controller.buscarPorId);
router.put("/:id", autenticar, validate(atualizarAdministradorSchema), controller.atualizar);
router.delete("/:id", autenticar, controller.remover);

module.exports = router;
