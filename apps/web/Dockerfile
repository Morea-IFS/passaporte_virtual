# Build context: raiz do monorepo (docker build -f apps/web/Dockerfile .)

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app
RUN chown node:node /app
# Usuário node (uid 1000): arquivos criados via volume ficam com o dono do host
USER node

# Instala dependências do workspace (camada cacheada pelos manifests)
FROM base AS deps
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @passaporte/web...

# Desenvolvimento: código montado via volume, hot reload pelo `next dev`
FROM deps AS dev
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build de produção (output standalone)
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3333
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --chown=node:node apps/web apps/web
RUN pnpm --filter @passaporte/web build

FROM node:24-alpine AS prod
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
