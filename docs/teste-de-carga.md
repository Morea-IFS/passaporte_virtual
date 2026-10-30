# Teste de carga HTTP — 300 visitantes simultâneos

Executado em 30/10/2026, em banco local isolado, com dados identificados por `Carga`. O teste de produção passou com 300 visitantes distintos, sem erros HTTP ou de conteúdo e p95 dos carimbos abaixo de 2 segundos. A segunda execução também passou acrescentando 300 ms de latência de ida e volta no cliente.

## Reprodução

Requer Node.js 24 ou superior, API iniciada, banco **local descartável** migrado e seed de desenvolvimento. O script não instala dependências. As credenciais administrativas vêm de `LOAD_ADMIN_EMAIL` e `LOAD_ADMIN_PASSWORD`; quando ausentes, usa a conta padrão do seed de desenvolvimento. Nenhuma credencial é gravada no relatório.

```bash
node scripts/load-test.mjs --confirm-local-fixtures \
  --api http://localhost:3334 --web http://localhost:3001 \
  --profile production --output docs/validacao/carga-producao-300.json

node scripts/load-test.mjs --confirm-local-fixtures \
  --api http://localhost:3334 --profile production --latency-ms 300 \
  --output docs/validacao/carga-producao-300-latencia-300ms.json
```

Para o baseline de desenvolvimento, use `--api http://localhost:3333` sem `--web`. Para medir SSR, inicie a API e o Next a partir dos respectivos builds de produção e configure `API_URL` do web para a API medida. O script faz uma leitura de aquecimento antes da fase web. `node scripts/load-test.mjs --help` lista as opções.

A origem precisa ser `localhost`, `127.0.0.1` ou `::1`, sem caminho, credenciais ou parâmetros na URL. Destinos remotos são recusados antes de qualquer requisição. `--confirm-local-fixtures` torna explícita a criação de dados. Não use um serviço local que encaminhe para banco de produção.

## Cenários e critérios

Cada execução cria um evento e um checkpoint exclusivos por HTTP, sem acesso direto ao banco. Registra 300 visitantes, cada um com seu próprio token. Os nomes começam por `Carga`.

| Fase                                | Requisições | Concorrência | Validação de conteúdo                                             |
| ----------------------------------- | ----------: | -----------: | ----------------------------------------------------------------- |
| Registro em rampa                   |         300 |           25 | Apelido esperado e token de sessão presente                       |
| Inscrição no evento                 |         300 |          300 | Slug do evento correto                                            |
| Primeiro carimbo                    |         300 |          300 | Novo carimbo e progresso 1 de 1                                   |
| Carimbo repetido, 3 rodadas         |         900 |          300 | Duplicata reconhecida e progresso preservado                      |
| Passaporte API, 3 rodadas           |         900 |          300 | Apelido correto e progresso 1 de 1                                |
| Passaporte web, opcional, 3 rodadas |         900 |          300 | HTML autenticado contém apelido e não retorna página de erro Next |

Uma barreira só libera a rodada seguinte quando todas as respostas anteriores chegaram. O relatório mede o tempo até receber o corpo completo, usa percentil por posição ordenada e registra p50, p95, p99, máximo, erros, status HTTP, vazão e máximo de requisições em voo. Cada fase dispara uma requisição por visitante; o carimbo repetido e as leituras repetem a barreira três vezes.

Critérios obrigatórios: pelo menos 300 visitantes; concorrência igual ao número de visitantes nos dois cenários de carimbo; todas as requisições planejadas concluídas; zero falhas HTTP, de rede ou de conteúdo; p95 dos carimbos novo e repetido inferior a 2.000 ms; limpeza concluída. O processo retorna código 1 se qualquer critério falhar. A leitura web registra seus percentis separadamente e exige zero erros, sem impor a meta de 2 segundos reservada ao carimbo.

Após a carga, o script consulta os indicadores e exige exatamente 300 inscrições, 300 check-ins e 300 passaportes completos no evento de teste. Isso verifica também a ausência de duplicatas sob concorrência.

## Resultados de produção

Ambiente: Node v24.22.2, Linux, 13th Gen Intel(R) Core(TM) i5-13420H, 12 CPUs disponíveis, 15.31 GiB de memória. API, PostgreSQL, Next e gerador de carga compartilham a mesma máquina. API e web foram iniciados com `NODE_ENV=production` a partir de builds locais.

| Cenário            | HTTP | Simultâneos | p50 (ms) | p95 (ms) | p99 (ms) | Máximo (ms) | Erros |
| ------------------ | ---: | ----------: | -------: | -------: | -------: | ----------: | ----: |
| registro-rampa     |  300 |          25 |    29.26 |    68.13 |    79.29 |       79.75 |     0 |
| inscricao          |  300 |         300 |   308.02 |   583.59 |   612.89 |      620.19 |     0 |
| checkin-novo       |  300 |         300 |   541.01 |   554.52 |   556.22 |      558.49 |     0 |
| checkin-repetido   |  900 |         300 |   431.39 |   475.16 |   484.87 |      488.63 |     0 |
| passaporte-api     |  900 |         300 |   288.18 |   384.16 |   391.62 |      392.97 |     0 |
| passaporte-web-ssr |  900 |         300 |  2046.12 |  3011.91 |  3201.91 |     3202.97 |     0 |

Foram 3.600 requisições medidas, com 300 simultâneas nas fases de uso. Preparação, aquecimento e limpeza ficam fora dos percentis. [Relatório JSON completo](validacao/carga-producao-300.json).

## Produção com 300 ms de latência adicional

A espera adicional é dividida entre antes do envio e depois da leitura do corpo. Ela representa um atraso de ida e volta no cliente; não altera a banda nem injeta perda de pacotes.

| Cenário          | HTTP | Simultâneos | p50 (ms) | p95 (ms) | p99 (ms) | Máximo (ms) | Erros |
| ---------------- | ---: | ----------: | -------: | -------: | -------: | ----------: | ----: |
| registro-rampa   |  300 |          25 |   321.88 |   368.71 |    371.6 |      372.68 |     0 |
| inscricao        |  300 |         300 |    777.3 |   911.97 |   915.24 |      916.41 |     0 |
| checkin-novo     |  300 |         300 |   890.24 |   913.49 |    914.6 |       915.7 |     0 |
| checkin-repetido |  900 |         300 |   585.38 |   858.77 |   863.24 |      864.37 |     0 |
| passaporte-api   |  900 |         300 |   592.39 |   685.89 |   697.41 |      701.49 |     0 |

Foram 2.700 requisições medidas, sem erros. [Relatório JSON completo](validacao/carga-producao-300-latencia-300ms.json).

## Baseline de desenvolvimento

O servidor de desenvolvimento também passou com 2.700 requisições e zero erros. O p95 foi 1.347,69 ms para carimbo novo e 1.950,79 ms para repetido. Essa medição inclui o custo do ambiente de desenvolvimento e oferece menos margem que o build de produção. [Relatório JSON completo](validacao/carga-api-dev-300.json).

## Limpeza e limites da evidência

As três execuções revogaram os 900 tokens de visitantes criados, revogaram os tokens administrativos e excluíram logicamente os três eventos de carga. Inscrições e avaliações seguem a cascata de soft delete do evento. Os apelidos e históricos de negócio permanecem no banco, conforme a regra do projeto; todos os visitantes criados têm prefixo `Carga`. O relatório guarda somente identificadores públicos das fixtures e estatísticas, sem tokens, senha ou códigos de recuperação.

O resultado demonstra a meta local de 300 visitantes concorrentes, com margem para 300 ms adicionais de latência nos carimbos. Ele não certifica hardware de hospedagem, operação durante horas, navegação em celular real, tempo da câmera, pintura do navegador, perda de pacotes ou cobertura móvel. Reexecute no ambiente de implantação antes de um evento real. A tolerância a desconexão depende dos testes da fila offline e da sincronização, que são verificados separadamente.
