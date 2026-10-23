# Requisitos: Passaporte Virtual

> Documento derivado da reunião de alinhamento inicial (Rubens, Genisson, Guilherme).
> Status: **rascunho para avaliação**. Itens marcados com **[A CONFIRMAR]** dependem de decisões ainda em aberto.

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
| RF17 | O sistema pode exibir um ranking ou contagem ao final do evento com base nos apelidos dos visitantes.                        | C    | ⬜     |

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
| RF22 | Após o check-in, o sistema deve oferecer um botão para compartilhar nas redes sociais (foco em Instagram Stories), com a hashtag do evento. | S    | ⬜     |
| RF23 | O sistema deve gerar um card compartilhável (imagem no formato de Stories) com o nome da atividade, identidade visual do evento e hashtag.  | S    | ⬜     |
| RF24 | O visitante deve poder adicionar uma foto própria (tirada na hora ou da galeria) ao card.                                                   | C    | ⬜     |
| RF25 | O card deve poder ser baixado ou enviado pelo compartilhamento nativo do celular.                                                           | S    | ⬜     |

### 4.6 Avaliação do evento

| ID   | Requisito                                                                                                                                                                     | Prio | Status |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| RF26 | A aplicação deve oferecer um botão "Avaliar o evento" que leva a um sistema externo de avaliação (ex.: formulário online). Avaliação do evento como um todo, não por estande. | S    | ⬜     |
| RF27 | Alternativa: avaliação integrada simples (ex.: 1 a 5 estrelas), armazenada pela aplicação. **[A CONFIRMAR] com Luan qual formato é exigido pelos financiadores**              | C    | ⬜     |

## 5. Requisitos não funcionais

| ID    | Requisito                                                                                                                                                            | Status |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| RNF01 | Aplicação web responsiva, pensada primeiro para celular, funcionando em Android e iPhone sem instalar app de loja.                                                   | ⬜     |
| RNF02 | Instalável na tela inicial como PWA, funcionando "como aplicativo" e como site.                                                                                      | ⬜     |
| RNF03 | Check-in rápido: do escaneamento ao registro em poucos segundos, mesmo em rede móvel instável.                                                                       | ⬜     |
| RNF04 | Tolerância a conexão ruim: guardar check-ins localmente e sincronizar quando a conexão voltar. **[A CONFIRMAR] se o histórico fica no servidor, só local, ou ambos** | ⬜     |
| RNF05 | Coleta mínima de dados pessoais (princípio da LGPD): guardar só o essencial para o funcionamento.                                                                    | ⬜     |
| RNF06 | Suportar o volume de visitantes simultâneos do evento multicampi. **[A CONFIRMAR] estimativa de público**                                                            | ⬜     |
| RNF07 | QR codes legíveis quando impressos em tamanho de etiqueta ou cartaz.                                                                                                 | ⬜     |
| RNF08 | Interface em português, acessível (contraste, tamanho de toque, leitores de tela).                                                                                   | ⬜     |

## 6. Regras de negócio

| ID   | Regra                                                                                      |
| ---- | ------------------------------------------------------------------------------------------ |
| RN01 | Um visitante tem no máximo um check-in por checkpoint.                                     |
| RN02 | Um checkpoint pertence a exatamente um evento.                                             |
| RN03 | Apelidos são únicos no sistema todo (sem diferenciar maiúsculas).                          |
| RN04 | Checkpoints desativados não aceitam novos check-ins, mas os check-ins já feitos continuam. |

## 7. Questões em aberto

1. Quais tipos de atividade entram no passaporte: só estandes de pesquisa, ou também oficinas, cursos, banners, editais, culturais? Precisa de categorização? (Rubens)
2. Histórico de visitas: banco de dados, só no dispositivo, ou os dois?
3. Avaliação do evento: link externo ou avaliação integrada? Qual formato os financiadores exigem? (Rubens com Luan)
4. Datas exatas dos eventos e inclusão do festival de curtas.
5. Até quando a lista de projetos pré-cadastrados estará disponível? (Rubens)
6. Integração com o WebEvents: importar dados de lá ou só usar a separação por evento?
