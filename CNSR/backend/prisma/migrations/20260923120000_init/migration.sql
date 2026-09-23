-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administradores" (
    "id" SERIAL NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamados" (
    "id" SERIAL NOT NULL,
    "protocolo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusChamado" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER,

    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticias" (
    "id" SERIAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "urlImagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "administradorId" INTEGER NOT NULL,

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_email_key" ON "administradores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_usuario_key" ON "administradores"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "chamados_protocolo_key" ON "chamados"("protocolo");

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
