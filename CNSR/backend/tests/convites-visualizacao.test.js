jest.mock("../src/services/emailService", () => ({
  enviarEmail: jest.fn().mockResolvedValue(true)
}));

const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const prisma = require("../src/config/prisma");
const { enviarEmail } = require("../src/services/emailService");

describe("Visualização de tokens de convite", () => {
  const sufixo = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const senhaPrincipal = "senha-principal-teste";
  const email = `convite-${sufixo}@teste.com`;
  let principal;
  let comum;
  let autorizacaoPrincipal;
  let autorizacaoComum;
  let conviteId;
  let token;

  beforeAll(async () => {
    principal = await prisma.administrador.create({
      data: {
        nomeCompleto: "Principal de teste",
        email: `principal-${sufixo}@teste.com`,
        usuario: `principal-${sufixo}`,
        senhaHash: await bcrypt.hash(senhaPrincipal, 4),
        principal: true
      }
    });
    comum = await prisma.administrador.create({
      data: {
        nomeCompleto: "Administrador comum",
        email: `comum-${sufixo}@teste.com`,
        usuario: `comum-${sufixo}`,
        senhaHash: await bcrypt.hash("senha-comum", 4)
      }
    });
    autorizacaoPrincipal = `Bearer ${jwt.sign({ id: principal.id }, process.env.JWT_SECRET)}`;
    autorizacaoComum = `Bearer ${jwt.sign({ id: comum.id }, process.env.JWT_SECRET)}`;
  });

  afterAll(async () => {
    await prisma.administrador.deleteMany({ where: { id: { in: [principal?.id, comum?.id].filter(Boolean) } } });
    await prisma.$disconnect();
  });

  it("não devolve o token ao criar ou listar, mesmo quando o e-mail foi enviado", async () => {
    const criado = await request(app)
      .post("/api/administradores/convites")
      .set("Authorization", autorizacaoPrincipal)
      .send({ email });
    expect(criado.status).toBe(201);
    expect(criado.body.enviado).toBe(true);
    expect(criado.body.tokenDisponivel).toBe(true);
    expect(criado.body).not.toHaveProperty("token");
    conviteId = criado.body.id;

    const listagem = await request(app).get("/api/administradores/convites").set("Authorization", autorizacaoPrincipal);
    const convite = listagem.body.find(item => item.id === conviteId);
    expect(convite.tokenDisponivel).toBe(true);
    expect(convite).not.toHaveProperty("token");
    expect(convite).not.toHaveProperty("tokenNonce");
  });

  it("rejeita outros administradores e senha ausente", async () => {
    const comumResposta = await request(app)
      .post(`/api/administradores/convites/${conviteId}/token`)
      .set("Authorization", autorizacaoComum)
      .send({ senhaPrincipal });
    expect(comumResposta.status).toBe(403);
    expect(comumResposta.body).not.toHaveProperty("token");

    const ausente = await request(app)
      .post(`/api/administradores/convites/${conviteId}/token`)
      .set("Authorization", autorizacaoPrincipal)
      .send({});
    expect(ausente.status).toBe(400);
    expect(ausente.body).not.toHaveProperty("token");
  });

  it("retorna o mesmo token enviado por e-mail após confirmar a senha", async () => {
    const resposta = await request(app)
      .post(`/api/administradores/convites/${conviteId}/token`)
      .set("Authorization", autorizacaoPrincipal)
      .send({ senhaPrincipal });
    expect(resposta.status).toBe(200);
    expect(resposta.body.email).toBe(email);
    token = resposta.body.token;
    expect(enviarEmail.mock.calls[0][0].texto).toContain(token);
    const salvo = await prisma.conviteAdministrador.findUnique({ where: { id: conviteId } });
    expect(salvo.tokenHash).not.toBe(token);
    expect(salvo.tokenNonce).not.toBe(token);
  });

  it("não permite recuperar tokens de convites antigos ou expirados", async () => {
    await prisma.conviteAdministrador.update({ where: { id: conviteId }, data: { tokenNonce: null } });
    const antigo = await request(app)
      .post(`/api/administradores/convites/${conviteId}/token`)
      .set("Authorization", autorizacaoPrincipal)
      .send({ senhaPrincipal });
    expect(antigo.status).toBe(409);
    expect(antigo.body).not.toHaveProperty("token");

    await prisma.conviteAdministrador.update({ where: { id: conviteId }, data: { expiraEm: new Date(0) } });
    const expirado = await request(app)
      .post(`/api/administradores/convites/${conviteId}/token`)
      .set("Authorization", autorizacaoPrincipal)
      .send({ senhaPrincipal });
    expect(expirado.status).toBe(404);
    expect(expirado.body).not.toHaveProperty("token");
  });
});
