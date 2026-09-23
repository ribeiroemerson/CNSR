const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Chamados", () => {
  let protocoloCriado;

  afterAll(async () => {
    if (protocoloCriado) {
      await prisma.chamado.deleteMany({ where: { protocolo: protocoloCriado } });
    }
    await prisma.$disconnect();
  });

  it("deve rejeitar a criação de chamado sem campos obrigatórios", async () => {
    const resposta = await request(app).post("/api/chamados").send({});
    expect(resposta.status).toBe(400);
  });

  it("deve criar um novo chamado com dados válidos", async () => {
    const resposta = await request(app).post("/api/chamados").send({
      nome: "Cidadão de Teste",
      telefone: "(86) 99999-0000",
      categoria: "Iluminação Pública",
      bairro: "Centro",
      endereco: "Rua Teste, 123",
      descricao: "Lâmpada queimada em frente à escola."
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toHaveProperty("protocolo");
    protocoloCriado = resposta.body.protocolo;
  });

  it("deve listar os chamados cadastrados", async () => {
    const resposta = await request(app).get("/api/chamados");
    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
  });

  it("deve bloquear alteração de status sem autenticação", async () => {
    const respostaBusca = await request(app).get(`/api/chamados/protocolo/${protocoloCriado}`);
    const chamado = respostaBusca.body;

    const respostaStatus = await request(app)
      .patch(`/api/chamados/${chamado.id}/status`)
      .send({ status: "CONCLUIDO" });

    expect(respostaStatus.status).toBe(401);
  });
});
