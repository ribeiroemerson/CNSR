const { z } = require("zod");

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

// DTO de entrada: cadastro de cidadão
const cadastrarUsuarioSchema = z.object({
  nome: z.string().trim().min(1, "O nome é obrigatório."),
  cpf: z.string().trim().regex(cpfRegex, "Informe um CPF no formato 000.000.000-00."),
  email: z.string().trim().email("Informe um e-mail válido."),
  telefone: z.string().trim().min(8, "Informe um telefone válido.")
});

// DTO de entrada: atualização parcial de cadastro
const atualizarUsuarioSchema = cadastrarUsuarioSchema.partial();

// DTO de saída: formato exposto pela API
function paraSaidaUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    email: usuario.email,
    telefone: usuario.telefone,
    dataCadastro: usuario.dataCadastro
  };
}

module.exports = { cadastrarUsuarioSchema, atualizarUsuarioSchema, paraSaidaUsuario };
