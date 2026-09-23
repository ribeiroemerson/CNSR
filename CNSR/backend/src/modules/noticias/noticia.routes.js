const { Router } = require("express");
const controller = require("./noticia.controller");
const { validate } = require("../../middlewares/validate");
const { autenticar } = require("../../middlewares/auth");
const { criarNoticiaSchema, atualizarNoticiaSchema } = require("./noticia.dto");

const router = Router();

/**
 * @openapi
 * /noticias:
 *   get:
 *     summary: Lista as notícias publicadas nos painéis de Obras, Saúde e Educação
 *     tags: [Noticias]
 *     responses:
 *       200:
 *         description: Lista de notícias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Noticia'
 *   post:
 *     summary: Publica uma nova notícia
 *     tags: [Noticias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovaNoticia'
 *     responses:
 *       201:
 *         description: Notícia publicada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Noticia'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
// Leitura de notícias: pública (painéis de Obras, Saúde e Educação)
router.get("/", controller.listar);

/**
 * @openapi
 * /noticias/{id}:
 *   get:
 *     summary: Busca uma notícia pelo id
 *     tags: [Noticias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notícia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Noticia'
 *       404:
 *         description: Notícia não encontrada
 *   put:
 *     summary: Edita uma notícia existente
 *     tags: [Noticias]
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
 *             $ref: '#/components/schemas/NovaNoticia'
 *     responses:
 *       200:
 *         description: Notícia atualizada
 *       404:
 *         description: Notícia não encontrada
 *   delete:
 *     summary: Remove uma notícia
 *     tags: [Noticias]
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
 *         description: Notícia removida
 *       404:
 *         description: Notícia não encontrada
 */
router.get("/:id", controller.buscarPorId);

// Criação, edição e exclusão: restritas a administradores autenticados
router.post("/", autenticar, validate(criarNoticiaSchema), controller.criar);
router.put("/:id", autenticar, validate(atualizarNoticiaSchema), controller.atualizar);
router.delete("/:id", autenticar, controller.remover);

module.exports = router;
