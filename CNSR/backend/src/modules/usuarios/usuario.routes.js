const { Router } = require("express");
const controller = require("./usuario.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar } = require("../../middlewares/auth");
const { cadastrarUsuarioSchema, atualizarUsuarioSchema } = require("./usuario.dto");

const router = Router();

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Cadastra um novo cidadão
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovoUsuario'
 *     responses:
 *       201:
 *         description: Usuário cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: CPF ou e-mail já cadastrado
 *   get:
 *     summary: Lista os cidadãos cadastrados
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
// Cadastro de cidadão: público
router.post("/", validate(cadastrarUsuarioSchema), controller.criar);

/**
 * @openapi
 * /usuarios/{id}:
 *   get:
 *     summary: Busca um cidadão pelo id
 *     tags: [Usuarios]
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
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuário não encontrado
 *   put:
 *     summary: Atualiza o cadastro de um cidadão
 *     tags: [Usuarios]
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
 *             $ref: '#/components/schemas/NovoUsuario'
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       404:
 *         description: Usuário não encontrado
 *   delete:
 *     summary: Remove o cadastro de um cidadão
 *     tags: [Usuarios]
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
 *         description: Usuário removido
 *       404:
 *         description: Usuário não encontrado
 */
// Consulta e gestão de cidadãos: restrita a administradores autenticados
router.get("/", autenticar, controller.listar);
router.get("/:id", autenticar, controller.buscarPorId);
router.put("/:id", autenticar, validate(atualizarUsuarioSchema), controller.atualizar);
router.delete("/:id", autenticar, controller.remover);

module.exports = router;
