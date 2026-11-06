const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Consulta pública por telefone", () => {
  const sufixo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const protocolos = [`TELEFONE-A-${sufixo}`, `TELEFONE-B-${sufixo}`, `TELEFONE-C-${sufixo}`];
  const telefone = `86${String(Math.floor(Math.random() * 1000000000)).padStart(9, "0")}`;
  const outroTelefone = `87${telefone.slice(2)}`;
  let ids;

  beforeAll(async () => {
    const dados = { nome: "Teste", bairro: "Centro", endereco: "Rua", descricao: "Teste" };
    const registros = [
      { ...dados, protocolo: protocolos[0], telefone: `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`, categoria: "Iluminação Pública" },
      { ...dados, protocolo: protocolos[1], telefone, categoria: "Obras e Vias" },
      { ...dados, protocolo: protocolos[2], telefone: outroTelefone, categoria: "Obras e Vias" }
    ];
    ids = [];
    for (const data of registros) {
      const chamado = await prisma.chamado.create({ data });
      ids.push(chamado.id);
    }
  });

  afterAll(async () => {
    await prisma.chamado.deleteMany({ where: { protocolo: { in: protocolos } } });
    await prisma.$disconnect();
  });

  it("retorna somente os chamados com o número completo, independentemente da formatação ou secretaria", async () => {
    const resposta = await request(app).post("/api/chamados/consulta-telefone")
      .send({ telefone: `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}` });
    expect(resposta.status).toBe(200);
    expect(resposta.headers["cache-control"]).toBe("no-store");
    const encontrados = resposta.body.map(chamado => chamado.id);
    expect(encontrados).toEqual(expect.arrayContaining(ids.slice(0, 2)));
    expect(encontrados).not.toContain(ids[2]);
    expect(resposta.body.every(chamado => chamado.telefone.replace(/\D/g, "") === telefone)).toBe(true);
  });

  it("rejeita números incompletos e entradas inválidas", async () => {
    for (const telefoneInvalido of ["", "9999", "abcdefghij", `${telefone} OR 1=1`]) {
      const resposta = await request(app).post("/api/chamados/consulta-telefone").send({ telefone: telefoneInvalido });
      expect(resposta.status).toBe(400);
    }
  });

  it("retorna uma lista vazia quando não há correspondência", async () => {
    const resposta = await request(app).post("/api/chamados/consulta-telefone").send({ telefone: "00000000000" });
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });
});
