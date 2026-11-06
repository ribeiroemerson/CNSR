const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Acesso a chamados por secretaria", () => {
  const sufixo = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const ids = [];
  let principal, admin, semSecretaria, chamadoA, chamadoB;

  function token(administrador) {
    return `Bearer ${jwt.sign({ id: administrador.id }, process.env.JWT_SECRET)}`;
  }

  beforeAll(async () => {
    const senhaHash = await bcrypt.hash("senha-teste", 4);
    async function criarAdmin(tipo, dados = {}) {
      const administrador = await prisma.administrador.create({
        data: { nomeCompleto: tipo, email: `${tipo}-${sufixo}@teste.com`, usuario: `${tipo}-${sufixo}`, senhaHash, ...dados }
      });
      ids.push(administrador.id);
      return administrador;
    }
    principal = await criarAdmin("principal", { principal: true });
    admin = await criarAdmin("comum", { secretaria: "Iluminação Pública" });
    semSecretaria = await criarAdmin("semsecretaria");
    const dados = { nome: "Teste", telefone: "86999990000", bairro: "Centro", endereco: "Rua", descricao: "Teste" };
    chamadoA = await prisma.chamado.create({ data: { ...dados, protocolo: `TEST-A-${sufixo}`, categoria: "Iluminação Pública" } });
    chamadoB = await prisma.chamado.create({ data: { ...dados, protocolo: `TEST-B-${sufixo}`, categoria: "Obras e Vias" } });
  });

  afterAll(async () => {
    await prisma.chamado.deleteMany({ where: { protocolo: { in: [chamadoA?.protocolo, chamadoB?.protocolo].filter(Boolean) } } });
    await prisma.administrador.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it("exige autenticação para listar e consultar por id, mas permite consulta pública por protocolo", async () => {
    expect((await request(app).get("/api/chamados")).status).toBe(401);
    expect((await request(app).get(`/api/chamados/${chamadoA.id}`)).status).toBe(401);
    expect((await request(app).get(`/api/chamados/protocolo/${chamadoA.protocolo}`)).status).toBe(200);
    const estatisticas = await request(app).get("/api/chamados/estatisticas");
    expect(estatisticas.status).toBe(200);
    expect(Object.keys(estatisticas.body).sort()).toEqual(["concluidos", "total"]);
    expect(estatisticas.body.total).toBeGreaterThanOrEqual(2);
  });

  it("filtra a listagem e bloqueia leitura e alterações em outra secretaria", async () => {
    const listaPrincipal = await request(app).get("/api/chamados").set("Authorization", token(principal));
    expect(listaPrincipal.body.map(c => c.id)).toEqual(expect.arrayContaining([chamadoA.id, chamadoB.id]));
    const lista = await request(app).get("/api/chamados").set("Authorization", token(admin));
    expect(lista.status).toBe(200);
    expect(lista.body.some(c => c.id === chamadoA.id)).toBe(true);
    expect(lista.body.every(c => c.categoria === "Iluminação Pública")).toBe(true);
    expect((await request(app).get(`/api/chamados/${chamadoB.id}`).set("Authorization", token(admin))).status).toBe(404);
    expect((await request(app).patch(`/api/chamados/${chamadoB.id}/status`).set("Authorization", token(admin)).send({ status: "CONCLUIDO" })).status).toBe(404);
    expect((await request(app).delete(`/api/chamados/${chamadoB.id}`).set("Authorization", token(admin))).status).toBe(404);
    const salvo = await prisma.chamado.findUnique({ where: { id: chamadoB.id } });
    expect(salvo.status).toBe("PENDENTE");
    expect((await request(app).patch(`/api/chamados/${chamadoA.id}/status`).set("Authorization", token(admin)).send({ status: "CONCLUIDO" })).status).toBe(200);
  });

  it("nega acesso aos administradores antigos sem secretaria e permite ao principal atribuir uma", async () => {
    expect((await request(app).get("/api/chamados").set("Authorization", token(semSecretaria))).status).toBe(403);
    expect((await request(app).get(`/api/chamados/${chamadoA.id}`).set("Authorization", token(semSecretaria))).status).toBe(403);
    const atribuicao = await request(app).put(`/api/administradores/${semSecretaria.id}`)
      .set("Authorization", token(principal)).send({ secretaria: "Obras e Vias" });
    expect(atribuicao.status).toBe(200);
    const lista = await request(app).get("/api/chamados").set("Authorization", token(semSecretaria));
    expect(lista.status).toBe(200);
    expect(lista.body.some(c => c.id === chamadoB.id)).toBe(true);
    expect(lista.body.every(c => c.categoria === "Obras e Vias")).toBe(true);
    expect((await request(app).delete(`/api/chamados/${chamadoB.id}`).set("Authorization", token(semSecretaria))).status).toBe(204);
  });

  it("permite ao principal acessar chamados de todas as secretarias", async () => {
    const lista = await request(app).get("/api/chamados").set("Authorization", token(principal));
    expect(lista.status).toBe(200);
    expect(lista.body.map(c => c.id)).toContain(chamadoA.id);
    expect((await request(app).get(`/api/chamados/${chamadoA.id}`).set("Authorization", token(principal))).status).toBe(200);
    expect((await request(app).delete(`/api/chamados/${chamadoA.id}`).set("Authorization", token(principal))).status).toBe(204);
  });
});
