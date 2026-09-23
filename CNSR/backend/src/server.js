require("dotenv").config();
const app = require("./app");

const PORTA = process.env.PORT || 3333;

app.listen(PORTA, () => {
  console.log(`Servidor da API CNSR rodando na porta ${PORTA}`);
});
