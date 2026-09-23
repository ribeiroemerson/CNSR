const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Conecta Nova Santa Rita — API",
      version: "1.0.0",
      description:
        "API REST para abertura e acompanhamento de solicitações, cadastro de cidadãos, administração e notícias do portal CNSR."
    },
    servers: [{ url: "/api", description: "Servidor atual" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Erro: {
          type: "object",
          properties: {
            mensagem: { type: "string" },
            erros: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  campo: { type: "string" },
                  mensagem: { type: "string" }
                }
              }
            }
          }
        },
        NovoUsuario: {
          type: "object",
          required: ["nome", "cpf", "email", "telefone"],
          properties: {
            nome: { type: "string", example: "Maria das Dores" },
            cpf: { type: "string", example: "555.666.777-88" },
            email: { type: "string", format: "email", example: "maria@example.com" },
            telefone: { type: "string", example: "(86) 99999-1111" }
          }
        },
        Usuario: {
          allOf: [
            { $ref: "#/components/schemas/NovoUsuario" },
            {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                dataCadastro: { type: "string", format: "date-time" }
              }
            }
          ]
        },
        NovoChamado: {
          type: "object",
          required: ["nome", "telefone", "categoria", "bairro", "endereco", "descricao"],
          properties: {
            nome: { type: "string" },
            telefone: { type: "string" },
            categoria: {
              type: "string",
              enum: [
                "Iluminação Pública",
                "Obras e Vias",
                "Limpeza Urbana",
                "Saneamento e Água",
                "Meio Ambiente",
                "Trânsito e Mobilidade"
              ]
            },
            bairro: { type: "string" },
            endereco: { type: "string" },
            descricao: { type: "string" },
            usuarioId: { type: "integer", nullable: true }
          }
        },
        Chamado: {
          allOf: [
            { $ref: "#/components/schemas/NovoChamado" },
            {
              type: "object",
              properties: {
                id: { type: "integer" },
                protocolo: { type: "string", example: "NSR-2026-1234" },
                status: { type: "string", enum: ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"] },
                statusLabel: { type: "string", example: "Pendente" },
                criadoEm: { type: "string", format: "date-time" }
              }
            }
          ]
        },
        AtualizarStatusChamado: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"] }
          }
        },
        NovoAdministrador: {
          type: "object",
          required: ["nomeCompleto", "email", "usuario", "senha", "confirmarSenha"],
          properties: {
            nomeCompleto: { type: "string" },
            email: { type: "string", format: "email" },
            usuario: { type: "string" },
            senha: { type: "string", format: "password", minLength: 6 },
            confirmarSenha: { type: "string", format: "password" }
          }
        },
        Administrador: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nomeCompleto: { type: "string" },
            email: { type: "string" },
            usuario: { type: "string" },
            dataCadastro: { type: "string", format: "date-time" }
          }
        },
        LoginAdministrador: {
          type: "object",
          required: ["usuario", "senha"],
          properties: {
            usuario: { type: "string" },
            senha: { type: "string", format: "password" }
          }
        },
        TokenAdministrador: {
          type: "object",
          properties: {
            token: { type: "string" },
            administrador: { $ref: "#/components/schemas/Administrador" }
          }
        },
        RecuperarSenha: {
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" } }
        },
        NovaNoticia: {
          type: "object",
          required: ["categoria", "titulo", "resumo", "conteudo"],
          properties: {
            categoria: { type: "string", enum: ["Obras", "Saúde", "Educação"] },
            titulo: { type: "string" },
            resumo: { type: "string" },
            conteudo: { type: "string" },
            urlImagem: { type: "string", format: "uri", nullable: true }
          }
        },
        Noticia: {
          allOf: [
            { $ref: "#/components/schemas/NovaNoticia" },
            {
              type: "object",
              properties: {
                id: { type: "integer" },
                criadoEm: { type: "string", format: "date-time" },
                administradorId: { type: "integer" }
              }
            }
          ]
        }
      }
    }
  },
  // Lê as anotações @openapi presentes nos arquivos de rotas de cada módulo
  apis: ["./src/modules/**/*.routes.js"]
};

module.exports = swaggerJsdoc(options);
