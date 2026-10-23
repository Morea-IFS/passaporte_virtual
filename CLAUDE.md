# Passaporte Virtual

Monorepo pnpm workspaces + Turborepo.

- `apps/web`: Next.js 16 (App Router, `src/`), React 19, Tailwind 4. Leia `apps/web/AGENTS.md`: esta versão do Next tem breaking changes, consulte `node_modules/next/dist/docs/` antes de escrever código.
- `apps/api`: AdonisJS 7, Lucid ORM, PostgreSQL. Imports via subpath (`#models/*`, `#controllers/*`, etc.).
- `packages/`: código compartilhado (vazio por enquanto).

## Interface

- **Sempre mobile first.** Toda tela é desenhada e implementada primeiro para celular (largura ~360px); telas maiores são adaptação via breakpoints do Tailwind (`sm:`, `md:`, `lg:`), nunca o contrário.
- Alvos de toque com no mínimo 44px, sem rolagem horizontal, conteúdo principal ao alcance do polegar.
- Identidade visual (23ª SNCT – Ciência Delas): referência em `docs/identidade-visual/index.html`. Tokens em `apps/web/src/app/globals.css`; usar só eles, nunca cor literal nem cores padrão do Tailwind (`zinc`, `gray`...).
  - Interface (mudam com o tema claro/escuro): `bg`, `surface`, `surface-2`, `fg`, `muted`, `line`, `accent`, `on-accent`.
  - Marca (fixas): `violeta`, `violeta-noite`, `creme`, `amarelo`, `verde`, `magenta`, `laranja`, `azul`, `turquesa`.
  - Categorias: `pesquisa`, `oficina`, `apresentacao`, `cultural`, `curso`. A mesma cor no chip, no carimbo e na capa do ponto.
  - Fontes: `font-display` (Montserrat, títulos), `font-sans` (Nunito Sans, texto), `font-mono` (Space Mono, códigos e datas).
- Se uma mudança no `globals.css` não aparecer no navegador, o cache do Turbopack está velho: `docker compose stop web && rm -rf apps/web/.next && docker compose start web`.

## Requisitos

- `Requisitos.md` (raiz) lista os requisitos funcionais (RF) e não funcionais (RNF) do produto, com coluna **Status** (⬜ pendente, ✅ concluído).
- Antes de implementar uma funcionalidade, consulte o requisito correspondente.
- **Sempre que concluir um requisito, marque-o como ✅ no `Requisitos.md`** no mesmo commit da implementação. Requisito parcialmente feito continua ⬜.

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
