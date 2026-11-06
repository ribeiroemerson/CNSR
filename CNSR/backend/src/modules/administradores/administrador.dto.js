const { z } = require("zod");

// DTO de entrada: cadastro de um novo administrador
const cadastrarAdministradorSchema = z
  .object({
    nomeCompleto: z.string().trim().min(1, "O nome completo é obrigatório."),
    email: z.string().trim().email("Informe um e-mail válido."),
    usuario: z.string().trim().min(3, "O usuário deve ter ao menos 3 caracteres."),
    senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
    confirmarSenha: z.string(),
    tokenConvite: z.string().trim().min(1).optional()
  })
  .refine(dados => dados.senha === dados.confirmarSenha, {
    message: "As senhas informadas não conferem.",
    path: ["confirmarSenha"]
  });

// DTO de entrada: convite de novo administrador para um e-mail
const criarConviteSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.")
});

// DTO de entrada: autenticação
const loginAdministradorSchema = z.object({
  usuario: z.string().trim().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha.")
});

// DTO de entrada: recuperação de senha por e-mail cadastrado
const confirmarSenhaPrincipalSchema = z.object({
  senhaPrincipal: z.string().min(1, "Confirme sua senha de acesso.")
});

const recuperarSenhaSchema = confirmarSenhaPrincipalSchema.extend({
  email: z.string().trim().email("Informe um e-mail válido.")
});

// DTO de entrada: criação direta de administrador pelo principal (a senha temporária é gerada pelo sistema)
const criarAdministradorSchema = confirmarSenhaPrincipalSchema.extend({
  nomeCompleto: z.string().trim().min(1, "O nome completo é obrigatório."),
  email: z.string().trim().email("Informe um e-mail válido."),
  usuario: z.string().trim().min(3, "O usuário deve ter ao menos 3 caracteres.")
});

// DTO de entrada: bloqueio ou desbloqueio
const bloqueioAdministradorSchema = z.object({
  bloqueado: z.boolean({ required_error: "Informe se a conta deve ficar bloqueada." })
});

// DTO de entrada: alteração da própria senha pelo administrador principal
const alterarSenhaPropriaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres."),
    confirmarNovaSenha: z.string().min(1, "Confirme sua nova senha.")
  })
  .refine(dados => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas informadas não conferem.",
    path: ["confirmarNovaSenha"]
  });

// DTO de entrada: atualização parcial de cadastro
const atualizarAdministradorSchema = z.object({
  nomeCompleto: z.string().trim().min(1, "O nome completo é obrigatório.").optional(),
  email: z.string().trim().email("Informe um e-mail válido.").optional(),
  usuario: z.string().trim().min(3, "O usuário deve ter ao menos 3 caracteres.").optional()
});

// DTO de saída: nunca expõe o hash da senha
function paraSaidaAdministrador(administrador) {
  return {
    id: administrador.id,
    nomeCompleto: administrador.nomeCompleto,
    email: administrador.email,
    usuario: administrador.usuario,
    principal: administrador.principal,
    bloqueado: administrador.bloqueado,
    dataCadastro: administrador.dataCadastro
  };
}

// DTO de saída: nunca expõe o hash do token do convite
function paraSaidaConvite(convite) {
  return {
    id: convite.id,
    email: convite.email,
    expiraEm: convite.expiraEm,
    criadoEm: convite.criadoEm
  };
}

module.exports = {
  cadastrarAdministradorSchema,
  criarAdministradorSchema,
  confirmarSenhaPrincipalSchema,
  bloqueioAdministradorSchema,
  alterarSenhaPropriaSchema,
  criarConviteSchema,
  paraSaidaConvite,
  loginAdministradorSchema,
  recuperarSenhaSchema,
  atualizarAdministradorSchema,
  paraSaidaAdministrador
};
