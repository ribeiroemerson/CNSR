# CNSR Backend — API REST

API REST em Node.js/Express para o projeto **Conecta Nova Santa Rita**, com persistência em PostgreSQL via Prisma.

## Entidades e relacionamentos

- **Usuario** 1 — N **Chamado** (um cidadão pode abrir várias solicitações; o vínculo é opcional, pois chamados também podem ser abertos sem cadastro).
- **Administrador** 1 — N **Noticia** (um administrador publica várias notícias; o autor é sempre o administrador autenticado, nunca um valor enviado pelo cliente).

## Como rodar

1. `cp .env.example .env` e preencha `DATABASE_URL` (PostgreSQL) e `JWT_SECRET`.
2. `npm install`
3. `npx prisma migrate dev --name init`
4. `npm run dev`

## Testes automatizados

Requerem um banco PostgreSQL (pode ser local ou de teste) acessível via `DATABASE_URL`, com as migrations já aplicadas.

```
npm test
```

## Testes manuais

Use o arquivo [requests.http](requests.http) com a extensão **REST Client** do VS Code para exercitar os endpoints principais, incluindo o fluxo de login e uso do token JWT nas rotas protegidas.

## Documentação interativa (Swagger / OpenAPI)

Com o servidor rodando, acesse `http://localhost:3333/api/docs` para a interface do Swagger UI, onde é possível ver todos os endpoints, seus DTOs de entrada/saída e testá-los diretamente pelo navegador (inclusive rotas autenticadas, usando o botão **Authorize** com o token JWT).

## Tratamento de erros

Todas as respostas de erro seguem o formato `{ "mensagem": "..." }` (ou `{ "mensagem": "...", "erros": [...] }` para falhas de validação). O middleware `src/middlewares/errorHandler.js` centraliza:

- **400** — dados inválidos (DTO/Zod) ou JSON malformado no corpo da requisição.
- **401** — token ausente, inválido ou expirado.
- **404** — registro não encontrado.
- **409** — violação de unicidade (e-mail, usuário, CPF ou protocolo duplicado).
- **500** — erro interno, sem vazar detalhes internos ao cliente (log completo apenas no servidor).

## Deploy em produção (Render)

O arquivo [render.yaml](render.yaml) descreve um Blueprint do Render que provisiona automaticamente:

- Um banco **PostgreSQL** gerenciado (`cnsr-db`).
- Um serviço **Web** Node/Express com deploy contínuo a partir do GitHub (cada push na branch configurada gera um novo deploy).
- As variáveis de ambiente de produção (`DATABASE_URL` vinda do banco, `JWT_SECRET` gerado automaticamente, `NODE_ENV=production`), sem nenhuma credencial commitada no repositório.

Passos:
1. Suba o projeto para um repositório no GitHub.
2. No painel do Render, escolha **New > Blueprint** e selecione o repositório (ajuste o "Root Directory" para `backend`, se necessário).
3. Revise os recursos detectados a partir do `render.yaml` e confirme a criação.
4. Após o primeiro deploy, ajuste `CORS_ORIGIN` para o domínio real do front-end (em vez de `*`).

## Endpoints principais

| Método | Rota                              | Autenticação | Descrição                        |
|--------|------------------------------------|--------------|-----------------------------------|
| POST   | /api/usuarios                      | não          | Cadastro de cidadão               |
| GET    | /api/usuarios                      | sim          | Listagem de cidadãos              |
| POST   | /api/chamados                      | não          | Abertura de solicitação           |
| GET    | /api/chamados                      | não          | Listagem de solicitações          |
| GET    | /api/chamados/protocolo/:protocolo | não          | Consulta por protocolo            |
| PATCH  | /api/chamados/:id/status           | sim          | Alteração de status               |
| DELETE | /api/chamados/:id                  | sim          | Exclusão de solicitação           |
| POST   | /api/administradores               | não          | Cadastro de administrador         |
| POST   | /api/administradores/login         | não          | Login (retorna token JWT)         |
| POST   | /api/administradores/recuperar-senha | não        | Recuperação de senha              |
| GET    | /api/noticias                      | não          | Listagem de notícias              |
| POST   | /api/noticias                      | sim          | Publicação de notícia             |
| PUT    | /api/noticias/:id                  | sim          | Edição de notícia                 |
| DELETE | /api/noticias/:id                  | sim          | Remoção de notícia                |
| GET    | /api/docs                          | não          | Documentação Swagger / OpenAPI    |

Rotas autenticadas exigem o cabeçalho `Authorization: Bearer <token>` obtido no login do administrador.
