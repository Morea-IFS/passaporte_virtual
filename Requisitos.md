# Requisitos: Passaporte Virtual

> Documento derivado da reunião de alinhamento inicial (Rubens, Genisson, Guilherme).
> Status: **implementação concluída e validada localmente em 30/10/2026**. Evidências e comandos de reprodução em [docs/validacao.md](docs/validacao.md). Publicação e configuração dos eventos são etapas operacionais.

## 1. Visão geral

O Passaporte Virtual é uma aplicação web, utilizável no celular, que orienta visitantes em eventos e registra as atividades que eles visitaram ou concluíram. Cada estande ou atividade tem um QR code. Ao escaneá-lo, o visitante abre a página daquele ponto e o check-in é registrado no seu passaporte.

A solução complementa um passaporte físico, impresso, e serve também como vitrine de divulgação dos projetos e atividades do evento.

## 2. Objetivos

1. Guiar o visitante pelo evento, mostrando o que existe para visitar e o que ainda falta.
2. Registrar as visitas e atividades concluídas de cada participante.
3. Divulgar os projetos e atividades do evento, dentro da aplicação e nas redes sociais.
4. Manter o acesso simples e coletar o mínimo de dados pessoais.

## 3. Atores

| Ator                        | Descrição                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Visitante (participante)    | Pessoa que circula pelo evento, escaneia QR codes e acompanha o próprio passaporte |
| Organizador (administrador) | Equipe do evento: cadastra eventos e checkpoints, gera e imprime QR codes          |

## 4. Requisitos funcionais

Prioridade: **M** = obrigatório (Must), **S** = importante (Should), **C** = desejável (Could).

Status: ⬜ = pendente, ✅ = concluído.

### 4.1 Gestão de eventos e checkpoints (organizador)

| ID   | Requisito                                                                                                                                                             | Prio | Status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF01 | O organizador deve poder cadastrar eventos (nome, datas, local, hashtag oficial, descrição).                                                                          | M    | ✅     |
| RF02 | O organizador deve poder cadastrar checkpoints em um evento, com nome, resumo breve, imagem e logomarca ou símbolo do projeto.                                        | M    | ✅     |
| RF03 | O organizador deve poder classificar cada checkpoint por categoria, com as categorias cadastradas por evento (ex.: pesquisa, oficina, apresentação, cultural, curso). | S    | ✅     |
| RF04 | O organizador deve poder importar checkpoints em lote a partir de uma lista (ex.: planilha de projetos pré-cadastrados enviada pela Propex).                          | S    | ✅     |
| RF05 | O organizador deve poder editar, desativar e remover checkpoints.                                                                                                     | M    | ✅     |
| RF06 | O sistema deve manter os eventos separados: checkpoints e passaportes de um evento não se misturam com os de outro.                                                   | M    | ✅     |

### 4.2 QR codes

| ID   | Requisito                                                                                                                                        | Prio | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ------ |
| RF07 | O sistema deve gerar um QR code único por checkpoint, apontando para a URL de check-in daquele ponto.                                            | M    | ✅     |
| RF08 | O sistema deve exportar os QR codes em formato fácil de imprimir (ex.: PDF com um QR por página ou por etiqueta, com nome e logo do checkpoint). | M    | ✅     |
| RF09 | O sistema deve permitir exportar todos os QR codes de um evento de uma vez.                                                                      | S    | ✅     |

### 4.3 Passaporte do visitante

| ID   | Requisito                                                                                                                    | Prio | Status |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF11 | Ao escanear um QR code, o visitante deve ser levado à página do checkpoint e o check-in deve ser registrado automaticamente. | M    | ✅     |
| RF12 | A página do checkpoint deve exibir nome, imagem, logomarca e resumo do projeto ou atividade.                                 | M    | ✅     |
| RF13 | O visitante deve ver seu passaporte: checkpoints já visitados e checkpoints que ainda faltam.                                | M    | ✅     |
| RF14 | O visitante deve ver a lista completa de checkpoints do evento, filtrável por categoria.                                     | S    | ✅     |
| RF15 | Escanear o mesmo QR mais de uma vez não deve gerar check-in duplicado.                                                       | M    | ✅     |
| RF16 | O passaporte deve exibir o progresso do visitante (ex.: 7 de 20 visitados).                                                  | S    | ✅     |
| RF17 | O sistema pode exibir um ranking ou contagem ao final do evento com base nos apelidos dos visitantes.                        | C    | ✅     |

### 4.4 Identificação do participante

| ID   | Requisito                                                                                                                                                                                                             | Prio | Status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF18 | O acesso não deve exigir cadastro com e-mail e senha.                                                                                                                                                                 | M    | ✅     |
| RF19 | O visitante é identificado por um apelido único global (vale para todos os eventos), escolhido no primeiro QR code lido; o sistema gera um token secreto guardado no dispositivo. Nenhum outro dado pessoal é pedido. | M    | ✅     |
| RF20 | O passaporte persiste entre acessos no mesmo dispositivo sem novo login: o token fica num cookie protegido (httpOnly) de longa duração.                                                                               | M    | ✅     |
| RF21 | O visitante pode recuperar o passaporte em outro dispositivo ou após limpar o navegador informando o apelido e o código de recuperação (ex.: K7Q2-MX9A), exibido no próprio passaporte.                               | C    | ✅     |

### 4.5 Redes sociais e cards compartilháveis

| ID   | Requisito                                                                                                                                   | Prio | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF22 | Após o check-in, o sistema deve oferecer um botão para compartilhar nas redes sociais (foco em Instagram Stories), com a hashtag do evento. | S    | ✅     |
| RF23 | O sistema deve gerar um card compartilhável (imagem no formato de Stories) com o nome da atividade, identidade visual do evento e hashtag.  | S    | ✅     |
| RF24 | O visitante deve poder adicionar uma foto própria (tirada na hora ou da galeria) ao card.                                                   | C    | ✅     |
| RF25 | O card deve poder ser baixado ou enviado pelo compartilhamento nativo do celular.                                                           | S    | ✅     |

### 4.6 Avaliação do evento

| ID   | Requisito                                                                                                                                                                     | Prio | Status |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF26 | A aplicação deve oferecer um botão "Avaliar o evento" que leva a um sistema externo de avaliação (ex.: formulário online). Avaliação do evento como um todo, não por estande. | S    | ✅     |
| RF27 | Avaliação integrada de 1 a 5 estrelas, armazenada pela aplicação, como alternativa configurável por evento ao formulário externo (decisão confirmada em 30/10/2026).          | C    | ✅     |

### 4.7 Administração, auditoria e participantes

| ID   | Requisito                                                                                                                                                                                                                 | Prio | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF28 | O administrador deve poder listar, cadastrar, editar, ativar, desativar e remover outros administradores.                                                                                                                 | M    | ✅     |
| RF29 | O sistema deve registrar as ações administrativas, identificando autor, ação, recurso afetado, data e detalhes relevantes, sem armazenar segredos como senhas, tokens ou códigos de recuperação.                          | M    | ✅     |
| RF30 | O administrador deve ter uma tela de auditoria com pesquisa, filtros e visualização dos detalhes de cada ação registrada.                                                                                                 | S    | ✅     |
| RF31 | O administrador deve ter uma tela consolidada de participantes, exibindo apelido (username), eventos, quantidade de check-ins, progresso, última atividade e checkpoints visitados, com recursos de pesquisa e filtragem. | S    | ✅     |

### 4.8 Painel de dados do evento

| ID   | Requisito                                                                                                                                                                                                              | Prio | Status |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF32 | O administrador deve ter, para cada evento, um painel de dados com os principais indicadores: total de participantes inscritos (passaportes criados), total de check-ins e média de pontos visitados por participante. | S    | ✅     |
| RF33 | O painel deve exibir o ranking dos checkpoints mais visitados e dos menos visitados, para identificar destaques e estandes com pouca procura.                                                                          | S    | ✅     |
| RF34 | O painel deve exibir as visitas por categoria (pesquisa, oficina, apresentação, cultural, curso).                                                                                                                      | S    | ✅     |
| RF35 | O painel deve exibir a distribuição das visitas ao longo do tempo (por dia e por hora), para mostrar os horários de pico.                                                                                              | C    | ✅     |
| RF36 | O painel deve exibir quantos participantes completaram o passaporte e a distribuição do progresso (ex.: quantos visitaram 25%, 50%, 75% e 100% dos pontos).                                                            | C    | ✅     |
| RF37 | Os dados do painel devem poder ser exportados (ex.: planilha CSV), para relatórios aos financiadores e à organização.                                                                                                  | C    | ✅     |

## 5. Requisitos não funcionais

| ID    | Requisito                                                                                                                                                                            | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| RNF01 | Aplicação web responsiva, pensada primeiro para celular, funcionando em Android e iPhone sem instalar app de loja.                                                                   | ✅     |
| RNF02 | Instalável na tela inicial como PWA, funcionando "como aplicativo" e como site.                                                                                                      | ✅     |
| RNF03 | Check-in rápido: do escaneamento ao registro em poucos segundos, mesmo em rede móvel instável.                                                                                       | ✅     |
| RNF04 | Tolerância a conexão ruim: guardar check-ins localmente e sincronizar quando a conexão voltar. Histórico confirmado no servidor; fila temporária no dispositivo até a sincronização. | ✅     |
| RNF05 | Coleta mínima de dados pessoais (princípio da LGPD): guardar só o essencial para o funcionamento.                                                                                    | ✅     |
| RNF06 | Suportar o volume de visitantes simultâneos do evento multicampi. Meta confirmada: de 100 a 300 visitantes simultâneos, validada com 300 em carga local.                             | ✅     |
| RNF07 | QR codes legíveis quando impressos em tamanho de etiqueta ou cartaz.                                                                                                                 | ✅     |
| RNF08 | Interface em português, acessível (contraste, tamanho de toque, leitores de tela).                                                                                                   | ✅     |

## 6. Regras de negócio

| ID   | Regra                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN01 | Um visitante tem no máximo um check-in por checkpoint.                                                                                            |
| RN02 | Um checkpoint pertence a exatamente um evento.                                                                                                    |
| RN03 | Apelidos são únicos no sistema todo (sem diferenciar maiúsculas).                                                                                 |
| RN04 | Checkpoints desativados não aceitam novos check-ins, mas os check-ins já feitos continuam.                                                        |
| RN05 | Somente administradores autorizados podem gerenciar outros administradores, consultar a auditoria e acessar a visão consolidada de participantes. |
| RN06 | O sistema não permite desativar ou remover o último administrador ativo.                                                                          |
| RN07 | Os registros de auditoria não podem ser editados nem removidos pela interface administrativa.                                                     |
| RN08 | As funcionalidades administrativas e de auditoria não ampliam a coleta de dados pessoais dos visitantes.                                          |

## 7. Decisões e configuração operacional

1. Categorias são configuráveis por evento; pesquisa, oficina, apresentação, cultural e curso são os valores iniciais.
2. O servidor guarda o histórico confirmado; o dispositivo mantém uma fila temporária de visitas pendentes, sem credenciais, e sincroniza com o aplicativo aberto.
3. A organização escolhe por evento entre formulário externo e avaliação integrada de 1 a 5 estrelas, conforme confirmação de 30/10/2026.
4. O público informado é de 100 a 300 visitantes simultâneos. O teste local de produção utilizou 300, incluindo uma execução com 300 ms de latência adicional.
5. Datas, festival de curtas, atividades e lista final de projetos devem ser cadastrados ou importados pela organização antes do evento.
6. A importação de planilhas está disponível. Uma integração direta com a API do WebEvents não integra os requisitos funcionais atuais e depende de definição futura de escopo e acesso.
7. Para publicar, configurar domínio HTTPS, `PUBLIC_WEB_URL`, credenciais e banco do ambiente definitivo. PWA e compartilhamento nativo dependem de HTTPS (localhost é permitido para desenvolvimento).
