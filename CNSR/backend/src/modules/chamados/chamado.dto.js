const { z } = require("zod");

const CATEGORIAS_VALIDAS = [
  "Iluminação Pública",
  "Obras e Vias",
  "Limpeza Urbana",
  "Saneamento e Água",
  "Meio Ambiente",
  "Trânsito e Mobilidade"
];

const STATUS_VALIDOS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"];

const STATUS_LABELS = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDO: "Concluído"
};

// DTO de entrada: criação de uma nova solicitação
const criarChamadoSchema = z.object({
  nome: z.string().trim().min(1, "O nome é obrigatório."),
  telefone: z.string().trim().min(8, "Informe um telefone válido."),
  categoria: z.enum(CATEGORIAS_VALIDAS, { errorMap: () => ({ message: "Categoria de serviço inválida." }) }),
  bairro: z.string().trim().min(1, "O bairro é obrigatório."),
  endereco: z.string().trim().min(1, "O endereço é obrigatório."),
  descricao: z.string().trim().min(1, "A descrição é obrigatória."),
  usuarioId: z.number().int().positive().optional()
});

// DTO de entrada: alteração de status (restrita a administradores)
const atualizarStatusChamadoSchema = z.object({
  status: z.enum(STATUS_VALIDOS, { errorMap: () => ({ message: "Status inválido." }) })
});

// DTO de saída: formato exposto pela API
function paraSaidaChamado(chamado) {
  return {
    id: chamado.id,
    protocolo: chamado.protocolo,
    nome: chamado.nome,
    telefone: chamado.telefone,
    categoria: chamado.categoria,
    bairro: chamado.bairro,
    endereco: chamado.endereco,
    descricao: chamado.descricao,
    status: chamado.status,
    statusLabel: STATUS_LABELS[chamado.status],
    criadoEm: chamado.criadoEm,
    usuarioId: chamado.usuarioId
  };
}

module.exports = {
  CATEGORIAS_VALIDAS,
  STATUS_VALIDOS,
  criarChamadoSchema,
  atualizarStatusChamadoSchema,
  paraSaidaChamado
};
