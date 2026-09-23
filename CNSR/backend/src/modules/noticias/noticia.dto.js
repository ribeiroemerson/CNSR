const { z } = require("zod");

const CATEGORIAS_VALIDAS = ["Obras", "Saúde", "Educação"];

// DTO de entrada: criação de notícia
const criarNoticiaSchema = z.object({
  categoria: z.enum(CATEGORIAS_VALIDAS, { errorMap: () => ({ message: "Painel inválido." }) }),
  titulo: z.string().trim().min(1, "O título não pode ser vazio."),
  resumo: z.string().trim().min(1, "O resumo não pode ser vazio."),
  conteudo: z.string().trim().min(1, "O conteúdo não pode ser vazio."),
  urlImagem: z.union([z.string().url("Informe uma URL de imagem válida."), z.literal("")]).optional()
});

// DTO de entrada: atualização parcial de notícia
const atualizarNoticiaSchema = criarNoticiaSchema.partial();

// DTO de saída: formato exposto pela API
function paraSaidaNoticia(noticia) {
  return {
    id: noticia.id,
    categoria: noticia.categoria,
    titulo: noticia.titulo,
    resumo: noticia.resumo,
    conteudo: noticia.conteudo,
    urlImagem: noticia.urlImagem,
    criadoEm: noticia.criadoEm,
    administradorId: noticia.administradorId
  };
}

module.exports = { CATEGORIAS_VALIDAS, criarNoticiaSchema, atualizarNoticiaSchema, paraSaidaNoticia };
