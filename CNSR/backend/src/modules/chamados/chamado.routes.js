const { Router } = require("express");
const controller = require("./chamado.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar } = require("../../middlewares/auth");
const { criarChamadoSchema, atualizarStatusChamadoSchema } = require("./chamado.dto");

const router = Router();

/**
 * @openapi
 * /chamados:
 *   post:
 *     summary: Abre uma nova solicitação (chamado)
 *     tags: [Chamados]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovoChamado'
 *     responses:
 *       201:
 *         description: Chamado criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   get:
 *     summary: Lista todas as solicitações
 *     tags: [Chamados]
 *     responses:
 *       200:
 *         description: Lista de chamados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chamado'
 */
// Abertura e consulta de solicitações: públicas
router.post("/", validate(criarChamadoSchema), controller.criar);
router.get("/", controller.listar);

/**
 * @openapi
 * /chamados/protocolo/{protocolo}:
 *   get:
 *     summary: Consulta um chamado pelo número de protocolo
 *     tags: [Chamados]
 *     parameters:
 *       - in: path
 *         name: protocolo
 *         required: true
 *         schema:
 *           type: string
 *         example: NSR-2026-1234
 *     responses:
 *       200:
 *         description: Chamado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       404:
 *         description: Chamado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/protocolo/:protocolo", controller.buscarPorProtocolo);

/**
 * @openapi
 * /chamados/{id}:
 *   get:
 *     summary: Busca um chamado pelo id
 *     tags: [Chamados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       404:
 *         description: Chamado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/:id", controller.buscarPorId);

/**
 * @openapi
 * /chamados/{id}/status:
 *   patch:
 *     summary: Altera o status de um chamado (restrito a administradores)
 *     tags: [Chamados]
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
 *             $ref: '#/components/schemas/AtualizarStatusChamado'
 *     responses:
 *       200:
 *         description: Status atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Chamado não encontrado
 *   delete:
 *     summary: Remove um chamado (restrito a administradores)
 *     tags: [Chamados]
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
 *         description: Chamado removido
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Chamado não encontrado
 */
// Alteração de status e exclusão: restritas a administradores autenticados
router.patch("/:id/status", autenticar, validate(atualizarStatusChamadoSchema), controller.atualizarStatus);
router.delete("/:id", autenticar, controller.remover);

module.exports = router;
