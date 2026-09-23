const jwt = require("jsonwebtoken");

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

module.exports = { autenticar };
