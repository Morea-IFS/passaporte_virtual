# Passaporte Virtual

Monorepo pnpm workspaces + Turborepo.

- `apps/web`: Next.js 16 (App Router, `src/`), React 19, Tailwind 4. Leia `apps/web/AGENTS.md`: esta versão do Next tem breaking changes, consulte `node_modules/next/dist/docs/` antes de escrever código.
- `apps/api`: AdonisJS 7, Lucid ORM, PostgreSQL. Imports via subpath (`#models/*`, `#controllers/*`, etc.).
- `packages/`: código compartilhado (vazio por enquanto).

## Git

- **Todo commit é sem coautor.** Nunca adicionar `Co-Authored-By: Claude ...` nem qualquer atribuição ao Claude em commits ou PRs.
- Mensagens no padrão Conventional Commits (`feat:`, `fix:`, `chore:`...).

## Comandos

```bash
docker compose up --build        # sobe postgres + api + web com hot reload
pnpm dev | build | lint | typecheck | test   # via turbo, na raiz
pnpm format | format:check       # prettier, config única na raiz
pnpm db:migrate | db:rollback    # migrations dentro do container
docker compose exec api node ace make:model Nome -m
```

## Convenções e cuidados

- Prettier único na raiz (`.prettierrc.json`): sem ponto e vírgula, aspas simples, 100 colunas, plugin Tailwind. Rodar `pnpm format` antes de commitar.
- Dependências: rodar `pnpm install` na raiz (lockfile único) e depois `docker compose up --build`. Os Dockerfiles usam `--frozen-lockfile`.
- Containers de dev rodam como usuário `node` (uid 1000) para não criar arquivos root no repo. Não adicionar volumes anônimos em pastas que não existem no host (o Docker cria a pasta como root).
- `apps/api/database/schema.ts` é gerado pelo Lucid nas migrations. Não editar à mão.
- Typecheck do web roda `next typegen` antes do `tsc` (tipos globais como `LayoutProps`).
- Env: `.env` da raiz alimenta o `docker-compose.yml` (inclui `APP_KEY`). `apps/api/.env` é usado só fora do Docker. Nenhum `.env` com segredo vai pro git.
- Browser chama a API por `NEXT_PUBLIC_API_URL` (localhost:3333). Código server-side do Next usa `API_URL` (`http://api:3333` na rede do compose).
