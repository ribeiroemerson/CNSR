const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// Exige um token JWT válido de administrador (Authorization: Bearer <token>)
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token de autenticação não informado." });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.administrador = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (erro) {
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
}

// Exige que o administrador autenticado seja o principal; confere no banco para refletir revogações
async function exigirAdministradorPrincipal(req, res, next) {
  try {
    const administrador = await prisma.administrador.findUnique({ where: { id: req.administrador.id } });
    if (!administrador || !administrador.principal) {
      return res.status(403).json({ mensagem: "Apenas o administrador principal pode realizar esta ação." });
    }
    next();
  } catch (erro) {
    next(erro);
  }
}

module.exports = { autenticar, exigirAdministradorPrincipal };
