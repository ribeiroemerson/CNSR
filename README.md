# CNSR

## Deploy integrado: Vercel + Render

O frontend estático é publicado na Vercel e a API Node.js/PostgreSQL no Render. A Vercel encaminha as requisições em `/api` para a API do Render, mantendo as chamadas do navegador na mesma origem.

### Render (backend)

1. No Render, crie um **Blueprint** e selecione este repositório.
2. Confirme os recursos descritos em [`render.yaml`](./render.yaml): banco PostgreSQL e serviço `cnsr-backend`.
3. Aguarde o deploy e confirme que `https://cnsr-backend.onrender.com/api/docs` está acessível. Se o Render gerar outro domínio para o serviço, atualize o destino em [`CNSR/vercel.json`](./CNSR/vercel.json) e a URL de fallback em [`CNSR/js/script.js`](./CNSR/js/script.js).

O Blueprint configura as migrations, `DATABASE_URL` e `JWT_SECRET`; não adicione credenciais ao repositório.

### Vercel (frontend)

1. Na Vercel, importe este repositório Git.
2. Em **Root Directory**, selecione `CNSR` (a pasta que contém `index.html`, `js/` e `css/`).
3. Use o preset **Other**, sem comando de build e sem diretório de saída customizado. A Vercel servirá os arquivos estáticos dessa pasta e aplicará o rewrite definido em `CNSR/vercel.json`.
4. Faça o deploy. Cada push na branch conectada publica uma nova versão.

O frontend usa `http://localhost:3333/api` em desenvolvimento local, `/api` na Vercel e o domínio público do Render quando `index.html` é aberto diretamente via `file://`.
