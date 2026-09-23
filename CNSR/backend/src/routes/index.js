const { Router } = require("express");
const usuarioRoutes = require("../modules/usuarios/usuario.routes");
const administradorRoutes = require("../modules/administradores/administrador.routes");
const chamadoRoutes = require("../modules/chamados/chamado.routes");
const noticiaRoutes = require("../modules/noticias/noticia.routes");

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/administradores", administradorRoutes);
router.use("/chamados", chamadoRoutes);
router.use("/noticias", noticiaRoutes);

module.exports = router;
