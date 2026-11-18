# Passaporte Virtual

Monorepo com pnpm workspaces + Turborepo.

| App        | Stack                              | Porta |
| ---------- | ---------------------------------- | ----- |
| `apps/web` | Next.js 16 + React 19 + Tailwind 4 | 3000  |
| `apps/api` | AdonisJS 7 + Lucid ORM             | 3333  |
| Postgres   | PostgreSQL 18                      | 5432  |

`packages/` fica reservado para código compartilhado entre os apps.

Requer Node.js 24+ e pnpm 12.15.0 para execução no host. Os containers já utilizam Node 24.

O projeto inclui passaporte por QR, recuperação por código, ranking, cards Stories com foto local, avaliação configurável, painel de indicadores e exportação CSV. A PWA mantém uma fila offline sem credenciais e confirma os carimbos quando a conexão volta, com o aplicativo aberto.

O acompanhamento dos requisitos fica em [Requisitos.md](Requisitos.md); testes e evidências estão em [docs/validacao.md](docs/validacao.md).

## Rodando com Docker (recomendado)

```bash
cp .env.example .env
# gere um APP_KEY e cole no .env
openssl rand -base64 24 | tr '+/' '-_'

docker compose up --build --renew-anon-volumes
```

- Web: http://localhost:3000
- API: http://localhost:3333 (health check em `/health`)
- Painel da organização: http://localhost:3000/admin

Depois que a API subir, **rode os seeds** para criar o administrador padrão (não há cadastro público) e a massa de testes:

```bash
pnpm db:seed
```

- Painel: `admin@passaporte.local` / `admin12345` (troque com `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME` e `SEED_ADMIN_PASSWORD`; em produção `SEED_ADMIN_PASSWORD` é obrigatória e a massa de testes não roda).
- Massa de testes (só em desenvolvimento): administradores `maria.souza@`, `joao.lima@`, `ana.rocha@passaporte.local` com senha `senha12345` (`carla.mendes@` desativada, `pedro.alves@` removido), eventos em andamento, futuro, encerrado e excluído, pontos, visitantes, carimbos e auditoria.
- Visitante de teste: apelido `teste`, código de recuperação `TEST-2345` (em `/recuperar`).

Sem o seed, o banco fica só com o administrador padrão (ou nenhum): listas e filtros do painel, como "Administrador" na auditoria, aparecem praticamente vazios. Rodar de novo não duplica nada. Para recomeçar do zero, `pnpm db:fresh` (**apaga o banco**, roda migrations e seeds).

Outras contas de organizador podem ser criadas pelo painel ou com:

```bash
docker compose exec api node ace organizer:create
```

O código é montado via volume: alterações recarregam sozinhas (Next HMR / Adonis `--hmr`).
As migrations rodam automaticamente quando a API sobe.

Se a porta 5432 já estiver em uso na sua máquina, mude `POSTGRES_PORT` no `.env`.

Para testar os QR codes lendo com o celular, coloque no `.env` o IP da máquina na rede (ex.: `PUBLIC_WEB_URL=http://192.168.0.10:3000`) e rode `docker compose up -d api`.

### Comandos úteis

```bash
pnpm db:migrate                                   # roda migrations
pnpm db:rollback                                  # desfaz última migration
pnpm db:seed                                      # admin padrão + massa de testes
pnpm db:fresh                                     # APAGA o banco, migrations + seeds
docker compose exec api node ace make:model Nome -m   # cria model + migration
docker compose exec api node ace organizer:create     # cria conta de organizador
docker compose exec postgres psql -U postgres -d passaporte_virtual
```

Ao adicionar dependências, rode `pnpm install` no host e depois `docker compose up --build --renew-anon-volumes` (ou `pnpm docker:up`). Sem `--renew-anon-volumes`, os containers continuam com o `node_modules` antigo.

Se o ambiente já estava aberto durante uma atualização de dependências e aparecer `Cannot find package`, recrie somente os serviços da aplicação com `docker compose up -d --build --force-recreate --renew-anon-volumes web api`. Esse comando renova os volumes de `node_modules` e preserva o volume nomeado do Postgres.

Imagens enviadas pelo painel ficam em `apps/api/storage` (fora do git).

## Rodando sem Docker

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # ajuste DB_* e APP_KEY
pnpm --filter @passaporte/api exec node ace migration:run
pnpm dev
cd apps/api && node ace db:seed          # admin padrão + massa de testes
```

## Scripts da raiz

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format` · `pnpm format:check`

`pnpm test:e2e` executa os fluxos em Chromium/Android e WebKit/iPhone com web e API iniciados e um banco local de testes com seed. Configure `PV_WEB_URL` e `E2E_API_URL` para alterar as portas; instale os navegadores Playwright e suas dependências conforme [a validação](docs/validacao.md).

Em bancos existentes, rode as migrations; elas preservam os dados e vinculam os check-ins históricos às inscrições por evento. Não é necessário recriar o banco.

## Imagens de produção

```bash
docker build -f apps/api/Dockerfile --target prod -t passaporte-api .
docker build -f apps/web/Dockerfile --target prod -t passaporte-web --build-arg NEXT_PUBLIC_API_URL=https://api.exemplo.com .
```

### Publicação no GitHub Releases e no GHCR

Pushes em branches e pull requests executam os testes da API e da web. Para distribuir uma versão, envie uma tag SemVer estável de um commit revisado ao repositório público. Exemplo para a versão `v0.1.0`.

```bash
git tag -a v0.1.0 -m "Passaporte Virtual v0.1.0"
git push origin v0.1.0
```

O GitHub Actions repete os testes no commit da tag, constrói as imagens Linux/AMD64 e testa os arquivos exportados com PostgreSQL e Playwright. A Release publica as imagens da API e da web em formato Docker compactado e um arquivo `SHA256SUMS`. Antes da publicação, o workflow baixa os anexos do rascunho e verifica os checksums e a proveniência SLSA assinada pelo GitHub Actions. Em seguida, publica as mesmas imagens no GitHub Container Registry (GHCR), testa o download anônimo e inclui na descrição da Release os links dos pacotes e os comandos `docker pull` por tag e por digest.

Na primeira publicação, configure os pacotes `passaporte-api` e `passaporte-web` como **Public** em **Package settings**. Se o teste de acesso anônimo falhar, ajuste a visibilidade de ambos e repita o job de publicação na mesma execução. [Visibilidade de pacotes no GitHub](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#pushing-container-images)

### Roteiro de deploy de uma nova versão

Este roteiro considera um servidor Linux/AMD64 com Docker Compose, HTTPS configurado e PostgreSQL de produção em execução.

1. **Aprove a versão.** Envie o commit revisado para a `main` do GitHub e aguarde os testes da API e da web. Na primeira publicação, inclua o commit que adiciona o workflow de Release.
2. **Publique a tag.** No commit aprovado, crie e envie uma tag estável inédita, como `v0.1.1`, seguindo o exemplo acima. Aguarde o workflow **Release Docker** concluir e confira na aba **Releases** os dois arquivos `.tar.gz` e o `SHA256SUMS`.
3. **Verifique as imagens no servidor.** Na descrição da Release, copie as duas referências completas por digest (`ghcr.io/…@sha256:…`). Defina-as como `API_IMAGE` e `WEB_IMAGE` no ambiente do Compose e execute `docker pull "$API_IMAGE"` e `docker pull "$WEB_IMAGE"`. O Docker verifica o conteúdo baixado contra o digest da versão.
4. **Prepare a atualização.** Registre a versão atual para rollback. Faça backup do PostgreSQL e dos uploads. Confira o `.env` do Compose e o `apps/api/.env.production` usados pela instalação, preservando a `APP_KEY` e as credenciais. O Compose de produção já persiste o banco. Para os uploads, configure um volume persistente em `/app/storage` e, se houver arquivos no container atual, copie-os para esse volume antes de recriar a API. O usuário `node` do container precisa de permissão de escrita.
5. **Aplique a versão.** No diretório do Compose de produção, use um arquivo complementar chamado `compose.release.yml` para selecionar as duas imagens verificadas. Mantenha nesse arquivo, ou na configuração de produção já em uso, a montagem dos uploads preparada no passo anterior.

   ```yaml
   services:
     api:
       image: ${API_IMAGE:?}
     web:
       image: ${WEB_IMAGE:?}
   ```

   ```bash
   docker compose -f docker-compose.production.yml -f compose.release.yml \
     up -d --no-build --pull never --no-deps api web
   ```

   Na inicialização, a API aplica as migrações e executa o seed antes de atender requisições. O seed exige `SEED_ADMIN_PASSWORD` no ambiente de produção.

6. **Valide o deploy.** Consulte `/health` na URL pública da API e confirme `status: ok` e `database: up`. Abra o site por HTTPS, consulte um passaporte e confira se uma imagem de estande anterior continua acessível. Em caso de falha, consulte os logs de `api` e `web`. Se o esquema do banco for compatível, repita os passos 3 e 5 com os digests da versão anterior. Se a migração for incompatível, interrompa as escritas e avalie a recuperação do banco antes de reativar a versão anterior.
