const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const rotas = require("./routes");
const swaggerSpec = require("./config/swagger");
const { tratarErros } = require("./middlewares/errorHandler");

const app = express();

// Necessário atrás de proxies reversos (ex: Render) para o rate limiter identificar o IP real
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", rotas);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.use(tratarErros);

module.exports = app;
