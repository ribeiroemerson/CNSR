const { z } = require("zod");

// DTO de entrada: cadastro de um novo administrador
const cadastrarAdministradorSchema = z
  .object({
    nomeCompleto: z.string().trim().min(1, "O nome completo é obrigatório."),
    email: z.string().trim().email("Informe um e-mail válido."),
    usuario: z.string().trim().min(3, "O usuário deve ter ao menos 3 caracteres."),
    senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
    confirmarSenha: z.string()
  })
  .refine(dados => dados.senha === dados.confirmarSenha, {
    message: "As senhas informadas não conferem.",
    path: ["confirmarSenha"]
  });

// DTO de entrada: autenticação
const loginAdministradorSchema = z.object({
  usuario: z.string().trim().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha.")
});

// DTO de entrada: recuperação de senha por e-mail cadastrado
const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.")
});

// DTO de entrada: atualização parcial de cadastro
const atualizarAdministradorSchema = z.object({
  nomeCompleto: z.string().trim().min(1, "O nome completo é obrigatório.").optional(),
  email: z.string().trim().email("Informe um e-mail válido.").optional()
});

// DTO de saída: nunca expõe o hash da senha
function paraSaidaAdministrador(administrador) {
  return {
    id: administrador.id,
    nomeCompleto: administrador.nomeCompleto,
    email: administrador.email,
    usuario: administrador.usuario,
    dataCadastro: administrador.dataCadastro
  };
}

module.exports = {
  cadastrarAdministradorSchema,
  loginAdministradorSchema,
  recuperarSenhaSchema,
  atualizarAdministradorSchema,
  paraSaidaAdministrador
};
