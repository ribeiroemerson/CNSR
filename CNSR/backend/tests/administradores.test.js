const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Administradores", () => {
  const sufixo = Date.now();
  const senhaPrincipal = "principal123";
  const dadosPrincipal = {
    nomeCompleto: "Principal de Teste",
    email: `principal${sufixo}@teste.com`,
    usuario: `principal${sufixo}`
  };
  const dadosAdmin = {
    nomeCompleto: "Admin de Teste",
    email: `admin${sufixo}@teste.com`,
    usuario: `admin${sufixo}`,
    senha: "senha123",
    confirmarSenha: "senha123"
  };

  let tokenPrincipal;
  let tokenComum;
  let tokenConvite;

  beforeAll(async () => {
    await prisma.administrador.create({
      data: { ...dadosPrincipal, senhaHash: await bcrypt.hash(senhaPrincipal, 4), principal: true }
    });

    const login = await request(app)
      .post("/api/administradores/login")
      .send({ usuario: dadosPrincipal.usuario, senha: senhaPrincipal });
    tokenPrincipal = login.body.token;
  });

  afterAll(async () => {
    // Os convites são removidos em cascata junto com o administrador principal que os criou
    await prisma.administrador.deleteMany({
      where: { usuario: { in: [dadosPrincipal.usuario, dadosAdmin.usuario] } }
    });
    await prisma.$disconnect();
  });

  it("deve rejeitar cadastro com dados inválidos", async () => {
    const resposta = await request(app).post("/api/administradores").send({});
    expect(resposta.status).toBe(400);
  });

  it("deve rejeitar cadastro sem token de convite", async () => {
    const resposta = await request(app).post("/api/administradores").send(dadosAdmin);
    expect(resposta.status).toBe(403);
  });

  it("deve rejeitar cadastro com token de convite inexistente", async () => {
    const resposta = await request(app)
      .post("/api/administradores")
      .send({ ...dadosAdmin, tokenConvite: "token-que-nao-existe" });
    expect(resposta.status).toBe(403);
  });

  it("deve negar a criação de convite sem autenticação", async () => {
    const resposta = await request(app).post("/api/administradores/convites").send({ email: dadosAdmin.email });
    expect(resposta.status).toBe(401);
  });

  it("deve permitir que o principal gere um convite para um e-mail", async () => {
    const resposta = await request(app)
      .post("/api/administradores/convites")
      .set("Authorization", `Bearer ${tokenPrincipal}`)
      .send({ email: dadosAdmin.email.toUpperCase() });

    expect(resposta.status).toBe(201);
    expect(resposta.body.email).toBe(dadosAdmin.email);
    expect(typeof resposta.body.token).toBe("string");
    expect(resposta.body).not.toHaveProperty("tokenHash");
    tokenConvite = resposta.body.token;

    const salvo = await prisma.conviteAdministrador.findFirst({ where: { email: dadosAdmin.email } });
    expect(salvo.tokenHash).not.toBe(tokenConvite);
  });

  it("deve rejeitar o token usado com outro e-mail", async () => {
    const resposta = await request(app)
      .post("/api/administradores")
      .send({ ...dadosAdmin, email: `outro${sufixo}@teste.com`, usuario: `outro${sufixo}`, tokenConvite });
    expect(resposta.status).toBe(403);
  });

  it("deve cadastrar o administrador convidado sem expor a senha", async () => {
    const resposta = await request(app)
      .post("/api/administradores")
      .send({ ...dadosAdmin, tokenConvite });

    expect(resposta.status).toBe(201);
    expect(resposta.body.principal).toBe(false);
    expect(resposta.body).not.toHaveProperty("senha");
    expect(resposta.body).not.toHaveProperty("senhaHash");
  });

  it("deve invalidar o convite após o uso", async () => {
    const usuarioReuso = `reuso${sufixo}`;
    const resposta = await request(app)
      .post("/api/administradores")
      .send({ ...dadosAdmin, usuario: usuarioReuso, tokenConvite });
    expect([403, 409]).toContain(resposta.status);

    const criado = await prisma.administrador.findUnique({ where: { usuario: usuarioReuso } });
    expect(criado).toBeNull();
  });

  it("deve autenticar com credenciais corretas e retornar um token", async () => {
    const resposta = await request(app)
      .post("/api/administradores/login")
      .send({ usuario: dadosAdmin.usuario, senha: dadosAdmin.senha });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveProperty("token");
    tokenComum = resposta.body.token;
  });

  it("deve rejeitar login com senha incorreta", async () => {
    const resposta = await request(app)
      .post("/api/administradores/login")
      .send({ usuario: dadosAdmin.usuario, senha: "senhaerrada" });

    expect(resposta.status).toBe(401);
  });

  it("deve negar a criação de convite a administrador não principal", async () => {
    const resposta = await request(app)
      .post("/api/administradores/convites")
      .set("Authorization", `Bearer ${tokenComum}`)
      .send({ email: `novo${sufixo}@teste.com` });

    expect(resposta.status).toBe(403);
  });

  it("deve negar a recuperação de senha sem autenticação", async () => {
    const resposta = await request(app)
      .post("/api/administradores/recuperar-senha")
      .send({ email: dadosAdmin.email });

    expect(resposta.status).toBe(401);
  });

  it("deve permitir revogar um convite pendente", async () => {
    const emailRevogado = `revogado${sufixo}@teste.com`;
    const criado = await request(app)
      .post("/api/administradores/convites")
      .set("Authorization", `Bearer ${tokenPrincipal}`)
      .send({ email: emailRevogado });
    expect(criado.status).toBe(201);

    const removido = await request(app)
      .delete(`/api/administradores/convites/${criado.body.id}`)
      .set("Authorization", `Bearer ${tokenPrincipal}`);
    expect(removido.status).toBe(204);

    const tentativa = await request(app)
      .post("/api/administradores")
      .send({ ...dadosAdmin, email: emailRevogado, usuario: `rev${sufixo}`, tokenConvite: criado.body.token });
    expect(tentativa.status).toBe(403);
  });
});
