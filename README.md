# Passaporte Virtual

Monorepo com pnpm workspaces + Turborepo.

| App        | Stack                              | Porta |
| ---------- | ---------------------------------- | ----- |
| `apps/web` | Next.js 16 + React 19 + Tailwind 4 | 3000  |
| `apps/api` | AdonisJS 7 + Lucid ORM             | 3333  |
| Postgres   | PostgreSQL 18                      | 5432  |

`packages/` fica reservado para código compartilhado entre os apps.

## Rodando com Docker (recomendado)

```bash
cp .env.example .env
# gere um APP_KEY e cole no .env
openssl rand -base64 24 | tr '+/' '-_'

docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:3333 (health check em `/health`)

O código é montado via volume: alterações recarregam sozinhas (Next HMR / Adonis `--hmr`).
As migrations rodam automaticamente quando a API sobe.

Se a porta 5432 já estiver em uso na sua máquina, mude `POSTGRES_PORT` no `.env`.

### Comandos úteis

```bash
pnpm db:migrate                                   # roda migrations
pnpm db:rollback                                  # desfaz última migration
docker compose exec api node ace make:model Nome -m   # cria model + migration
docker compose exec postgres psql -U postgres -d passaporte_virtual
```

Ao adicionar dependências, rode `pnpm install` no host e depois `docker compose up --build`.

## Rodando sem Docker

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # ajuste DB_* e APP_KEY
pnpm dev
```

## Scripts da raiz

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format` · `pnpm format:check`

## Imagens de produção

```bash
docker build -f apps/api/Dockerfile --target prod -t passaporte-api .
docker build -f apps/web/Dockerfile --target prod -t passaporte-web --build-arg NEXT_PUBLIC_API_URL=https://api.exemplo.com .
```
