# Validação do Passaporte Virtual

Execução local em **30/10/2026**, branch `codex/concluir-requisitos`, com Node 24.22.2, pnpm 12.15.0 e PostgreSQL 18 em container isolado. Nenhum serviço externo foi publicado e nenhum banco existente do usuário foi alterado.

## Requisitos e decisões

- RF17, RF32–RF37: inscrição explícita por evento, ranking público, painel com agregações SQL, visitas por categoria/dia/hora, progresso, exportação CSV e auditoria do download. Inscrições sem carimbo entram no total de participantes. Inscrição e primeiro cadastro são atômicos.
- RF22–RF25: PNG Stories 1080×1920 com atividade, evento e hashtag, foto opcional processada apenas no dispositivo, download e compartilhamento nativo. Quando o navegador não oferece compartilhamento de arquivos, a interface orienta baixar o PNG. A escolha do Instagram no menu depende do sistema operacional.
- RF26/RF27: o organizador escolhe formulário externo HTTP/HTTPS ou avaliação integrada de 1 a 5 estrelas. Uma resposta ativa por visitante/evento, atualizável; o painel exibe apenas os agregados. Avaliações e inscrições participam da exclusão lógica do evento.
- RNF01/RNF08: fluxos responsivos em Chromium com perfil Android e WebKit com perfil iPhone, além da varredura em 360 px; rótulos, foco, link para pular ao conteúdo, alvos de 44 px, contraste e estados de erro/sucesso revisados. Não foram utilizados aparelhos físicos nem ensaios com usuários de leitores de tela; a evidência cobre os motores emulados, semântica e verificações automatizadas.
- RNF02/RNF04: manifesto, ícones e service worker; QR ainda não visitado pode entrar na fila offline após uma sessão previamente criada online. A fila guarda apenas um escopo não autenticante e metadados públicos do ponto. Troca/revogação de sessão bloqueia o envio para outro visitante. HTML pessoal, RSC, administração, APIs, tokens e códigos de recuperação não entram no cache. Chunks Next só são cacheados quando imutáveis.
- RNF05: cadastro pede somente apelido; cookies httpOnly, tokens com hash no servidor, código de recuperação criptografado e ausência de upload da foto dos cards. A página `/privacidade` explica o uso dos dados e a exibição do apelido no ranking.
- RNF03/RNF06: 300 visitantes simultâneos, sem erros, incluindo execução com 300 ms adicionais de latência no cliente. A capacidade do ambiente de hospedagem definitivo precisa ser medida nesse ambiente; os números abaixo são locais.
- RNF07: etiquetas, cartazes e entrada rasterizados em 150/300 dpi e decodificados com ZXing. Não houve ensaio em papel físico. Fontes estão incluídas no build de produção da API.

## Verificações automatizadas

| Verificação                     | Resultado                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API/Japa                        | 18 testes funcionais passaram: sessão, recuperação, idempotência, concorrência, métricas, fuso, exclusões, CSV, auditoria, avaliações e cadastro atômico |
| Web/Node                        | 18 testes passaram: Canvas real, foto local, compartilhamento, fila offline, troca de sessão e política de cache                                         |
| Navegador                       | 8 cenários passaram em Chromium/Android e WebKit/iPhone: 6 de offline/isolamento e 2 do fluxo completo com avaliação, ranking, indicadores e exportação  |
| TypeScript, ESLint e formatação | Verificados na raiz do monorepo                                                                                                                          |
| Build                           | API Adonis e web Next standalone gerados                                                                                                                 |
| Acessibilidade                  | 46 combinações de tela/tema em 360 px; sem violações automáticas, alvos menores que 44 px ou overflow; itens inconclusivos revisados separadamente       |
| QR rasterizado                  | 26/26 códigos decodificados em 16 verificações de página/resolução                                                                                       |

A exportação CSV é validada pelos bytes, conteúdo e cabeçalhos com a sessão administrativa; o Chromium também confirma o evento de download. O WebKit móvel pode apresentar uma prévia do arquivo em vez do evento de download do navegador automatizado.

## Carga

| Cenário de produção          | Simultâneos | p95 do check-in novo | p95 do repetido | Erros |
| ---------------------------- | ----------: | -------------------: | --------------: | ----: |
| Rede local                   |         300 |               555 ms |          475 ms |     0 |
| 300 ms de latência adicional |         300 |               913 ms |          859 ms |     0 |

A leitura HTML autenticada teve p95 de 3,01 s com 300 requisições simultâneas. Cada execução também verifica 300 inscrições, 300 check-ins e 300 passaportes completos, sem duplicatas. Cenários, limites, dados do equipamento e relatórios brutos estão em [teste-de-carga.md](teste-de-carga.md) e [validacao/](validacao/).

## Reprodução

Use um banco local de testes migrado, com o seed de desenvolvimento, e os serviços iniciados.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build

# Chrome local para o perfil Android; WebKit para o perfil iPhone
pnpm exec playwright install webkit # o perfil Android usa o Chrome instalado
pnpm test:e2e

# Portas diferentes, se necessário
PV_WEB_URL=https://localhost:3002 E2E_API_URL=http://localhost:3334 E2E_LOCAL_TLS=1 pnpm test:e2e
node scripts/verify_accessibility.mjs
node scripts/verify_share_ui.mjs
```

A rodada final de produção usa HTTPS local com certificado de teste: o WebKit exige HTTPS para persistir o cookie Secure de produção. `E2E_LOCAL_TLS=1` autoriza somente o navegador de testes a aceitar esse certificado; o produto mantém seus cookies protegidos.

Com o web de produção na porta 3001, o proxy local pode ser reproduzido em outro terminal:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 2 \
  -keyout /tmp/passaporte-key.pem -out /tmp/passaporte-cert.pem \
  -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
PV_TLS_CERT=/tmp/passaporte-cert.pem PV_TLS_KEY=/tmp/passaporte-key.pem \
  node scripts/serve-local-https.mjs
```

O WebKit exige bibliotecas do sistema compatíveis com a versão instalada do Playwright. Neste host Fedora, as bibliotecas ICU 74 e JPEG 8 foram extraídas em uma pasta temporária para a execução, sem alterar pacotes do sistema.

Para os QR codes, use Python com `Pillow`, `pypdf`, `zxing-cpp` e Poppler (`pdftoppm`) disponível no PATH:

```bash
python scripts/verify_printed_qr.py --api-url http://localhost:3333
```

Os scripts utilizam por padrão as contas conhecidas do seed e aceitam variáveis de ambiente para credenciais alternativas; não gravam credenciais nos relatórios. A carga exige confirmação explícita de fixtures locais e só aceita destinos loopback.

## Publicação e operação

Aplicar as migrations no ambiente definitivo, cadastrar o conteúdo final e configurar domínio HTTPS, `PUBLIC_WEB_URL`, APP_KEY e credenciais próprias. HTTPS é necessário para instalação PWA e recursos nativos fora de localhost. O histórico confirmado fica no servidor; pendências locais sincronizam com o aplicativo aberto. A integração direta com a API do WebEvents permanece fora dos requisitos funcionais definidos; a importação de planilhas está pronta.
