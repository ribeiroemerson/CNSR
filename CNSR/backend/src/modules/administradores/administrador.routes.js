const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./administrador.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar } = require("../../middlewares/auth");
const {
  cadastrarAdministradorSchema,
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

const router = Router();

/**
 * @openapi
 * /administradores:
 *   post:
 *     summary: Cadastra um novo administrador
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
router.post("/", validate(cadastrarAdministradorSchema), controller.cadastrar);

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
 *     summary: Gera uma senha temporária para o e-mail cadastrado
 *     tags: [Administradores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecuperarSenha'
 *     responses:
 *       200:
 *         description: Senha temporária gerada
 *       404:
 *         description: E-mail não encontrado
 *       429:
 *         description: Muitas tentativas, tente novamente mais tarde
 */
router.post("/recuperar-senha", limitadorAutenticacao, validate(recuperarSenhaSchema), controller.recuperarSenha);

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
