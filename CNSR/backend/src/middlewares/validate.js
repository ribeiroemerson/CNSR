// Middleware genérico de validação de DTOs de entrada usando um schema Zod
function validate(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      return res.status(400).json({
        mensagem: "Dados inválidos.",
        erros: resultado.error.issues.map(issue => ({
          campo: issue.path.join(".") || "corpo",
          mensagem: issue.message
        }))
      });
    }

    req.body = resultado.data;
    next();
  };
}

module.exports = { validate };
