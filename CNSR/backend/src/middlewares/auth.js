const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// Exige um token JWT válido de administrador (Authorization: Bearer <token>).
// Confere no banco para que bloqueio ou remoção valham imediatamente, sem esperar o token expirar.
async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token de autenticação não informado." });
  }

  let payload;
  try {
    payload = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (erro) {
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }

  try {
    const administrador = await prisma.administrador.findUnique({ where: { id: payload.id } });
    if (!administrador || administrador.bloqueado) {
      return res.status(401).json({ mensagem: "Conta bloqueada ou inexistente." });
    }
    req.administrador = { id: administrador.id, usuario: administrador.usuario, principal: administrador.principal };
    next();
  } catch (erro) {
    next(erro);
  }
}

// Exige que o administrador autenticado seja o principal
function exigirAdministradorPrincipal(req, res, next) {
  if (!req.administrador?.principal) {
    return res.status(403).json({ mensagem: "Apenas o administrador principal pode realizar esta ação." });
  }
  next();
}

module.exports = { autenticar, exigirAdministradorPrincipal };
