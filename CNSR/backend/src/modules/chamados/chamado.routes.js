const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./chamado.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar } = require("../../middlewares/auth");
const { criarChamadoSchema, atualizarStatusChamadoSchema, consultaTelefoneSchema } = require("./chamado.dto");

const router = Router();
const limitarConsultaTelefone = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: "Muitas consultas por telefone. Tente novamente em alguns minutos." }
});

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
 *     summary: Lista chamados da secretaria do administrador ou todos para o principal
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
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
// A abertura e as estatísticas são públicas; a listagem exige autenticação.
router.post("/", validate(criarChamadoSchema), controller.criar);
router.get("/", autenticar, controller.listar);
/**
 * @openapi
 * /chamados/estatisticas:
 *   get:
 *     summary: Retorna totais agregados de chamados
 *     tags: [Chamados]
 *     responses:
 *       200:
 *         description: Total de chamados e total concluído
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 concluidos:
 *                   type: integer
 */
router.get("/estatisticas", controller.estatisticas);

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
 * /chamados/consulta-telefone:
 *   post:
 *     summary: Consulta solicitações pelo telefone completo com DDD
 *     tags: [Chamados]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telefone]
 *             properties:
 *               telefone:
 *                 type: string
 *                 example: "(86) 99999-1234"
 *     responses:
 *       200:
 *         description: Chamados com o telefone informado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chamado'
 *       400:
 *         description: Telefone inválido ou incompleto
 *       429:
 *         description: Limite de consultas excedido
 */
router.post("/consulta-telefone", limitarConsultaTelefone, validate(consultaTelefoneSchema), controller.buscarPorTelefone);

/**
 * @openapi
 * /chamados/{id}:
 *   get:
 *     summary: Busca um chamado pelo id
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
router.get("/:id", autenticar, controller.buscarPorId);

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
