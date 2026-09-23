const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Administradores", () => {
  const sufixo = Date.now();
  const dadosAdmin = {
    nomeCompleto: "Admin de Teste",
    email: `admin${sufixo}@teste.com`,
    usuario: `admin${sufixo}`,
    senha: "senha123",
    confirmarSenha: "senha123"
  };

  afterAll(async () => {
    await prisma.administrador.deleteMany({ where: { email: dadosAdmin.email } });
    await prisma.$disconnect();
  });

  it("deve rejeitar cadastro com dados inválidos", async () => {
    const resposta = await request(app).post("/api/administradores").send({});
    expect(resposta.status).toBe(400);
  });

  it("deve cadastrar um novo administrador sem expor a senha", async () => {
    const resposta = await request(app).post("/api/administradores").send(dadosAdmin);
    expect(resposta.status).toBe(201);
    expect(resposta.body).not.toHaveProperty("senha");
    expect(resposta.body).not.toHaveProperty("senhaHash");
  });

  it("deve autenticar com credenciais corretas e retornar um token", async () => {
    const resposta = await request(app)
      .post("/api/administradores/login")
      .send({ usuario: dadosAdmin.usuario, senha: dadosAdmin.senha });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveProperty("token");
  });

  it("deve rejeitar login com senha incorreta", async () => {
    const resposta = await request(app)
      .post("/api/administradores/login")
      .send({ usuario: dadosAdmin.usuario, senha: "senhaerrada" });

    expect(resposta.status).toBe(401);
  });
});
