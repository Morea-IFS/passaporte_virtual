# Build context: raiz do monorepo (docker build -f apps/api/Dockerfile .)

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
RUN chown node:node /app
# Usuário node (uid 1000): arquivos criados via volume ficam com o dono do host
USER node

# Instala dependências do workspace (camada cacheada pelos manifests)
FROM base AS deps
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @passaporte/api...

# Desenvolvimento: código montado via volume, hot reload pelo `node ace serve --hmr`
FROM deps AS dev
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["pnpm", "dev"]

# Build de produção
FROM deps AS build
COPY --chown=node:node apps/api apps/api
RUN pnpm --filter @passaporte/api build \
  && pnpm --filter @passaporte/api deploy --prod --legacy /tmp/deploy \
  && cp -r apps/api/build/. /tmp/deploy/

FROM node:24-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /tmp/deploy ./
USER node
EXPOSE 3333
CMD ["node", "bin/server.js"]
