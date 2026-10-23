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
  - Categorias de ponto: cadastradas por evento (tabela `checkpoint_categories`, tela `/admin/eventos/[id]/categorias`). A cor é atribuída pela API (a menos usada da paleta `azul`, `laranja`, `magenta`, `verde`, `turquesa`, `amarelo`); o usuário não escolhe. Classes por cor em `apps/web/src/lib/categories.ts`. Evento novo nasce com Pesquisa, Oficina, Apresentação, Cultural e Curso. A mesma cor no chip, no carimbo e na capa do ponto.
  - Tema: segue o sistema até o usuário escolher no botão `ThemeToggle` (`src/components/theme-toggle.tsx`); a escolha fica no `localStorage` e um script no `<head>` (`src/lib/theme.ts`) aplica antes da pintura. Para variar algo por tema, use a variante `dark:` (cobre sistema e escolha manual), nunca estado React.
  - Fontes: `font-display` (Montserrat, títulos), `font-sans` (Nunito Sans, texto), `font-mono` (Space Mono, códigos e datas).
- Se uma mudança no `globals.css` não aparecer no navegador, o cache do Turbopack está velho: `docker compose stop web && rm -rf apps/web/.next && docker compose start web`.

## Componentização (sempre)

- **Nada de código repetido.** Antes de escrever marcação ou lógica, procure um componente ou helper que já faça isso; se algo vai aparecer em dois lugares, extraia na hora (componente, função ou classe utilitária) em vez de copiar.
- Web — peças base em `apps/web/src/components/ui/` (genéricas, sem regra de negócio):
  - Botões: `buttonClass(variant, { size, block, blockOnMobile })`, `quietButtonClass`, `iconButtonClass` (`button.ts`); `SubmitButton`.
  - Campos: `Field` (casca com rótulo e mensagem; `as="group"` para fieldset), `TextField`, `TextAreaField`, `InlineField` (campo + botão), `DateField`, `SelectField` (lista em modal, nunca `<select>` nativo), `Switch`, `inputClass`, `FieldMessage`.
  - Estrutura: `Card` + `CardFooter`, `Panel`, `Disclosure` (seção que abre e fecha), `Actions` (botões de formulário/modal), `Modal`, `ConfirmDialog`, `ImageCropDialog`, `FilterChip`, `CategoryChip`, `OptionCard` (rádio em cartão), `QrCode`, `CopyButton`, ícones em `icons.tsx`.
  - Feedback: `Notice` (erro/sucesso/neutro), `InlineError`, `EmptyState`.
  - Explicação longa de campo: prop `info` do `Field` (ícone ⓘ que abre modal, `InfoButton`). A dica abaixo do campo fica curta.
- Passaporte (visitante): `VisitorShell`, `Stamp`/`StampSlot`, `ProgressBar`, `CheckinFlow`, `NicknameForm`, `RecoveryCode`, `EventChoiceCard` em `apps/web/src/components/passport/`.
- Marca: `BrandLockup`, `BrandMark` e `BrandMosaic` (mosaico + constelação, fundo de impacto) em `apps/web/src/components/`.
- Web — componentes de domínio em `apps/web/src/components/admin/` (ex.: `AdminNav`, `ImageInput`, `CategoryPicker`, `DangerZone`, `CheckpointCard`, `EventCard`, `CheckpointFilters`, `Pagination`, `PageHeader`).
- Helpers em `apps/web/src/lib/` (`hrefWith`, `firstParam`, `parseId`, `parsePage`, `pluralize`, `formatEventPeriod`, `colorStyles`, `IMAGE_SPECS`/`cropToFile`).
- Imagens enviadas saem no tamanho do formato (`IMAGE_SPECS` em `lib/image.ts`: capa 1200 × 675 JPG, logomarca 512 × 512 PNG); proporção diferente abre o enquadramento antes do envio.
- API: comportamento comum de models vira mixin (`app/models/mixins/`); regras de validação reaproveitadas ficam nos validators; lógica de arquivos em `app/services/`.

## Requisitos

- `Requisitos.md` (raiz) lista os requisitos funcionais (RF) e não funcionais (RNF) do produto, com coluna **Status** (⬜ pendente, ✅ concluído).
- Antes de implementar uma funcionalidade, consulte o requisito correspondente.
- **Sempre que concluir um requisito, marque-o como ✅ no `Requisitos.md`** no mesmo commit da implementação. Requisito parcialmente feito continua ⬜.

## Exclusão de dados

- **Nada é apagado de verdade: toda exclusão é lógica (soft delete).** Registros excluídos ganham `deleted_at` e continuam no banco, para poderem ser restaurados manualmente (`UPDATE ... SET deleted_at = NULL`).
- Toda tabela de dados de negócio nova nasce com `deleted_at timestamp null` e o model usa o mixin `SoftDeletes` (`app/models/mixins/soft_deletes.ts`): `class X extends compose(XSchema, SoftDeletes)`. Ele filtra excluídos em find, fetch e paginate e dá `softDelete()`. Nunca usar `.delete()` de model nem `DELETE` em SQL nesses dados.
- Unicidade só entre não excluídos: índice parcial `WHERE deleted_at IS NULL` e `filter: db.whereNull('deleted_at')` no `unique` do Vine.
- Exclusão em cascata é feita à mão com o mesmo `deleted_at` (ex.: evento e seus pontos), para restaurar tudo junto pelo horário. Não sobrescrever `deleted_at` de quem já estava excluído.
- Arquivos (imagens) não são apagados do storage, nem ao trocar ou remover a imagem de um ponto.
- Consultas que precisam enxergar excluídos (ex.: próximo código `CP-xxx`, que nunca é reaproveitado) usam o query builder do `db`, não o model.
- Exceção técnica: tokens de acesso apagados no logout (não são dado de negócio).

## Git

- **Todo commit é sem coautor.** Nunca adicionar `Co-Authored-By: Claude ...` nem qualquer atribuição ao Claude em commits ou PRs.
- Mensagens no padrão Conventional Commits (`feat:`, `fix:`, `chore:`...).

## Comandos

```bash
pnpm docker:up                   # sobe postgres + api + web com hot reload
pnpm dev | build | lint | typecheck | test   # via turbo, na raiz
pnpm format | format:check       # prettier, config única na raiz
pnpm db:migrate | db:rollback    # migrations dentro do container
docker compose exec api node ace make:model Nome -m
docker compose exec api node ace organizer:create   # conta do painel /admin
```

## Convenções e cuidados

- Prettier único na raiz (`.prettierrc.json`): sem ponto e vírgula, aspas simples, 100 colunas, plugin Tailwind. Rodar `pnpm format` antes de commitar.
- Dependências: rodar `pnpm install` na raiz (lockfile único) e depois `pnpm docker:up` (`--build --renew-anon-volumes`). Sem renovar os volumes anônimos, o container segue com o `node_modules` antigo. Os Dockerfiles usam `--frozen-lockfile`.
- Containers de dev rodam como usuário `node` (uid 1000) para não criar arquivos root no repo. Não adicionar volumes anônimos em pastas que não existem no host (o Docker cria a pasta como root).
- `apps/api/database/schema.ts` é gerado pelo Lucid nas migrations. Não editar à mão. Models estendem as classes dele (`EventSchema`, `CheckpointSchema`...).
- Listas são paginadas com 20 itens (`PER_PAGE` em `app/validators/pagination.ts`, `?page=N`; resposta `{ data, metadata }`). No web, o componente `Pagination` usa `?pagina=N`.
- API: rotas do organizador em `/api/v1/admin/*` (token Bearer). Respostas passam por transformers (`app/transformers`) e saem em `{ data }`. Mensagens de validação em português em `start/validator.ts`.
- Web: painel em `src/app/admin`. Dados vêm de `src/lib/api.ts` (server-only, token do cookie httpOnly); mutações são Server Actions em `src/app/admin/actions.ts`. Com `cacheComponents`, toda página que busca dados precisa de `loading.tsx` no próprio segmento (senão o Next acusa "uncached data outside Suspense").
- Typecheck do web roda `next typegen` antes do `tsc` (tipos globais como `LayoutProps`).
- Entrada do visitante: home `/` (QR de entrada da recepção, não conta como ponto). Um evento aberto → vai direto para `/passaporte/[slug]`; vários → escolha (`/?escolher=1` força a lista: link "Trocar de evento"). Link "Área da organização" no rodapé. "Sair (dev)" só existe com NODE_ENV=development. Sem passaporte, o passaporte do evento pede o apelido; o QR de um estande também cria e já carimba.
- Visitante (passaporte): só apelido (único no sistema todo). Token por dispositivo em cookie httpOnly `pv_visitor` (1 ano), enviado pelo servidor do web à API no header `X-Visitor-Token` (middleware `visitor` na API). Recuperação em outro celular: apelido + código (`/recuperar`). O carimbo roda numa Server Action disparada pela página `/c/[token]` (nunca na renderização). Rotas da API em `/api/v1/visitor/*` e `/api/v1/public/*`.
- Auditoria registra tudo do painel: mutações, login/logout/login recusado, downloads (PDF de QR, modelos) e cada tela aberta (`ActivityTracker` no layout chama `POST /admin/audit-logs/track`; link de arquivo estático usa `TrackedDownload`). Toda ação nova chama `audit(actor, { action, resourceType, ... }, trx)` (`app/services/audit.ts`, lista única de ações/recursos), só com campos permitidos (nunca senha, token ou código de recuperação). Tabela `audit_logs` é imutável (sem soft delete). Rótulos no web em `src/lib/audit.ts`. Telas: `/admin/administradores`, `/admin/auditoria`, `/admin/participantes`.
- Cliente da API (`src/lib/api.ts`): opção `auth` = `admin` (padrão), `visitor` ou `none`. Sessões por cookie em `src/lib/session.ts` (`adminSession`, `visitorSession`).
- QR codes: link `PUBLIC_WEB_URL/c/<qrToken>` (token aleatório, nunca o código CP-xxx). PDF de impressão gerado na API (`app/services/qr_codes_pdf.ts`, pdfkit + fontes da marca em `apps/api/resources/fonts`), repassado pelo web em `/admin/eventos/[id]/qrcodes/pdf`. Página pública do ponto em `apps/web/src/app/c/[token]`.
- Env: `.env` da raiz alimenta o `docker-compose.yml` (inclui `APP_KEY`). `apps/api/.env` é usado só fora do Docker. Nenhum `.env` com segredo vai pro git.
- Browser chama a API por `NEXT_PUBLIC_API_URL` (localhost:3333). Código server-side do Next usa `API_URL` (`http://api:3333` na rede do compose).
