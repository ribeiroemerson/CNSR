const { ZodError } = require("zod");
const { AppError } = require("../utils/appError");

// Middleware central de tratamento de erros do Express
function tratarErros(erro, req, res, next) {
  if (erro instanceof AppError) {
    return res.status(erro.statusCode).json({ mensagem: erro.message });
  }

  // Corpo da requisição não é um JSON válido (express.json())
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ mensagem: "O corpo da requisição não é um JSON válido." });
  }

  // Erro de validação do Zod que escapou do middleware "validate"
  if (erro instanceof ZodError) {
    return res.status(400).json({
      mensagem: "Dados inválidos.",
      erros: erro.issues.map(issue => ({ campo: issue.path.join("."), mensagem: issue.message }))
    });
  }

  // Violação de restrição única do Prisma (ex: e-mail, usuário ou protocolo duplicado)
  if (erro.code === "P2002") {
    const campo = Array.isArray(erro.meta?.target) ? erro.meta.target.join(", ") : erro.meta?.target;
    return res.status(409).json({ mensagem: `Já existe um registro com este ${campo || "valor"}.` });
  }

  // Registro não encontrado em operação de update/delete do Prisma
  if (erro.code === "P2025") {
    return res.status(404).json({ mensagem: "Registro não encontrado." });
  }

  console.error(erro);
  return res.status(500).json({ mensagem: "Erro interno no servidor." });
}

module.exports = { tratarErros };
