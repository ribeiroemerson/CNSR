-- AlterTable
ALTER TABLE "administradores" ADD COLUMN "principal" BOOLEAN NOT NULL DEFAULT false;

-- Em bancos já existentes, o administrador mais antigo passa a ser o principal
UPDATE "administradores" SET "principal" = true
WHERE "id" = (SELECT MIN("id") FROM "administradores");

-- CreateTable
CREATE TABLE "convites_administrador" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" INTEGER NOT NULL,

    CONSTRAINT "convites_administrador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convites_administrador_tokenHash_key" ON "convites_administrador"("tokenHash");

-- CreateIndex
CREATE INDEX "convites_administrador_email_idx" ON "convites_administrador"("email");

-- AddForeignKey
ALTER TABLE "convites_administrador" ADD CONSTRAINT "convites_administrador_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "administradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
