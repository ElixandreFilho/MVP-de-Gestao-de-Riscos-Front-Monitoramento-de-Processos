# Guia de Acompanhamento de Processos

## 1. Objetivo

Este guia explica, de forma prática, como a Unidade e a SecGov acompanham um processo desde a criação até a análise, os ajustes, a conclusão e os ciclos de revisão.

O guia mostra em qual tela o usuário deve entrar, o significado de cada status, os botões disponíveis, quem pode executar cada ação e o que acontece depois.

## 2. Usuários do fluxo

### Unidade

A Unidade cria e mantém o processo. Ela preenche as informações, corrige os ajustes solicitados e envia o processo para a SecGov.

Telas principais: Processos e detalhe do processo.

### SecGov

A SecGov recebe, analisa e revisa os processos enviados pelas Unidades.

Telas principais: Acompanhamento, Distribuição de Processos, detalhe em modo de acompanhamento e Histórico.

### Gestor da SecGov

Além das ações de análise, o gestor pode distribuir processos entre analistas.

## 3. Visão geral do ciclo

```text
Rascunho
   ↓ Enviar para análise
Aguardando análise
   ↓ Iniciar análise
Em análise
   ├─ Solicitar ajustes → Em ajuste
   │                         ↓ Reenviar
   │                   Aguardando análise
   ├─ Cancelar análise → Aguardando análise
   └─ Concluir análise → Concluído
                              ↓ Abrir revisão
                       Pendente de revisão
```

## 4. Tela de Processos — visão da Unidade

### Objetivo

Localizar um processo e abrir seu detalhe para preencher, consultar ou acompanhar.

### Informações apresentadas

- nome do processo;
- unidade responsável;
- responsável pelo processo;
- status atual;
- data de criação ou atualização;
- pendências, quando houver.

### Ações

- **Abrir/Visualizar processo:** entra no detalhe;
- **Pesquisar:** localiza um processo pelo nome;
- **Filtrar:** reduz a lista de processos.

## 5. Tela de detalhe do processo — visão da Unidade

Essa é a principal tela de trabalho da Unidade.

O usuário encontra a identificação do processo, a unidade, o responsável, as abas de riscos, o status, a mensagem contextual, as pendências, os prazos e os botões permitidos.

### Etapas do processo

1. Identificação de Riscos;
2. Avaliação de Riscos e Controles;
3. Resposta aos Riscos;
4. Atividades de Controle;
5. Ocorrências de Risco.

Antes de enviar, a Unidade deve preencher as informações obrigatórias indicadas nas abas.

## 6. Card de acompanhamento no detalhe

Leia o card nesta ordem:

1. verifique o status;
2. leia a mensagem apresentada;
3. confira pendências e prazo;
4. identifique o botão disponível;
5. execute a ação correspondente.

### Rascunho

O processo ainda está sendo preparado e não foi enviado à SecGov.

**Responsável:** Unidade.

**Ação:** preencher ou revisar as informações.

**Botão:** **Enviar para análise**, quando não houver pendências obrigatórias.

Se houver pendências, o envio fica bloqueado e o card informa o que precisa ser corrigido. Depois do envio, o status passa para `AGUARDANDO_ANALISE`.

### Aguardando análise

O processo foi enviado e aguarda a atuação da SecGov.

**Ação da Unidade:** **Cancelar envio**, se precisar retirar o processo da fila antes do início da análise.

Depois do cancelamento, o processo volta para `RASCUNHO` e as informações permanecem disponíveis.

**Ações da SecGov:** iniciar a análise e, quando aplicável, atribuir analista.

### Em análise

A SecGov está avaliando o processo.

**Ações da SecGov:**

- **Concluir análise:** leva o processo para `CONCLUIDO`;
- **Solicitar ajustes:** leva o processo para `EM_AJUSTE`;
- **Cancelar análise:** devolve o processo para `AGUARDANDO_ANALISE`.

A Unidade apenas acompanha e aguarda a decisão.

### Em ajuste

A SecGov encontrou pontos que precisam ser corrigidos.

**Responsável:** Unidade.

Procedimento:

1. ler a orientação da SecGov;
2. conferir o prazo de ajuste;
3. revisar as abas do processo;
4. corrigir as informações;
5. clicar em **Reenviar para análise**;
6. registrar uma observação, se necessário;
7. confirmar.

Depois do reenvio, o processo volta para `AGUARDANDO_ANALISE`.

### Concluído

A análise foi concluída pela SecGov.

A Unidade pode consultar o processo. A SecGov pode usar **Abrir revisão** quando for necessário iniciar um novo ciclo.

Depois de abrir a revisão, o status passa para `PENDENTE_REVISAO`.

### Pendente de revisão

O processo aguarda o envio ou o início de uma nova revisão.

**Ação esperada da Unidade:** **Enviar revisão**, quando liberado.

**Ação esperada da SecGov:** iniciar a revisão quando o processo estiver disponível.

Os estados seguintes da revisão devem ser confirmados com o responsável pelo processo.

## 7. Tela de Acompanhamento — visão da SecGov

### Objetivo

Ser a central de trabalho da SecGov para acompanhar a fila, identificar prioridades e abrir cada processo.

### Indicadores

Os indicadores mostram a quantidade de processos:

- aguardando análise;
- em análise;
- em ajuste;
- em revisão;
- concluídos.

### Filtros

É possível filtrar por nome, data inicial, data final, unidade, status e analista. Use **Limpar filtros** para retornar à lista completa.

### Colunas da lista

- Processo;
- Unidade;
- Analistas;
- Status;
- Envio;
- Prazo;
- Ações.

### Ações de cada processo

- **Visualizar processo:** abre o processo no fluxo de acompanhamento;
- **Histórico:** mostra as movimentações, os usuários, as datas, as observações e as mudanças de status.

## 8. Ações da SecGov por status

### Aguardando análise

1. conferir a unidade e o responsável;
2. verificar os analistas vinculados;
3. atribuir um analista, se necessário;
4. clicar em **Iniciar análise**.

O processo passa para `EM_ANALISE`.

### Em análise

#### Concluir análise

Use quando o processo estiver adequado. Revise as informações, clique em **Concluir análise**, registre uma observação se necessário e confirme.

O processo passa para `CONCLUIDO`.

#### Solicitar ajustes

Use quando a Unidade precisar corrigir informações. Clique em **Solicitar ajustes**, escreva a orientação, informe o prazo quando aplicável e confirme.

O processo passa para `EM_AJUSTE`.

#### Cancelar análise

Use quando a análise precisar ser interrompida. Clique em **Cancelar análise**, informe a justificativa obrigatória e confirme.

O processo volta para `AGUARDANDO_ANALISE`.

### Concluído

Quando houver necessidade de um novo ciclo, clique em **Abrir revisão** e confirme. O processo passa para `PENDENTE_REVISAO`.

## 9. Tela de Distribuição de Processos

### Quem utiliza

Gestor da SecGov autorizado.

### Procedimento

1. abrir **Acompanhamento**;
2. clicar em **Distribuir processos**;
3. localizar o processo;
4. escolher o analista;
5. revisar a distribuição;
6. confirmar.

Depois da distribuição, o analista deve identificar o processo na sua fila.

## 10. Histórico do processo

O histórico apresenta:

- tipo da ação;
- data e hora;
- usuário que realizou a ação;
- status anterior;
- novo status;
- observação ou justificativa;
- ciclo do acompanhamento.

Consulte o histórico antes de iniciar uma análise, para entender retornos para ajuste, confirmar reenvios e verificar justificativas de cancelamento.

## 11. Notificações

As notificações avisam sobre movimentações ou pendências.

Ao abrir uma notificação, o usuário pode ser direcionado para o processo, a análise, o histórico ou os documentos. Depois de aberta, ela deve ser marcada como lida.

## 12. Prazos

Usuários autorizados podem consultar e administrar prazos de revisão:

- cadastrar prazo;
- editar prazo;
- remover prazo;
- consultar a situação do prazo.

O processo pode indicar prazo regular, próximo do vencimento, vencido ou com atraso vigente. O prazo de ajuste deve ser acompanhado no card quando a SecGov solicitar correções.

## 13. Regras para os usuários

- A Unidade executa ações de envio, cancelamento do próprio envio e reenvio após ajustes.
- A SecGov executa ações de análise e revisão.
- Ações que alteram o status devem exigir confirmação quando solicitado pela tela.
- O cancelamento de análise exige justificativa.
- O envio fica bloqueado enquanto existirem pendências obrigatórias.
- Usuário somente leitura pode consultar, mas não alterar.
- Ações administrativas não devem aparecer no fluxo comum da Unidade.

## 14. Situações a confirmar

- Qual é o próximo status depois do envio da revisão.
- Quais telas aparecem durante `EM_REVISAO`.
- Quais ações a Unidade possui durante uma revisão.
- Se é possível cancelar uma conclusão e para qual status o processo retorna.
- Se a SecGov pode editar dados durante a análise.
- Se um processo criado pela própria SecGov deve possuir uma visão “como Unidade”.

## 15. Roteiro rápido da Unidade

1. Abra o processo.
2. Preencha todas as abas obrigatórias.
3. Verifique as pendências.
4. Envie para análise.
5. Acompanhe o status.
6. Corrija os ajustes, quando solicitado.
7. Reenvie o processo.
8. Consulte o resultado e o histórico.

## 16. Roteiro rápido da SecGov

1. Abra a tela de Acompanhamento.
2. Confira os indicadores e filtros.
3. Priorize os processos aguardando análise.
4. Distribua os processos, quando necessário.
5. Abra o processo.
6. Inicie a análise.
7. Conclua, solicite ajustes ou cancele a análise.
8. Acompanhe os reenvios.
9. Abra revisões quando necessário.
10. Consulte o histórico.

## 17. Casos principais

### Unidade envia um processo

Quando o processo estiver em rascunho e sem pendências, a Unidade clica em **Enviar para análise**. O status esperado é `AGUARDANDO_ANALISE`.

### Unidade cancela um envio

Quando o processo estiver aguardando análise, a Unidade clica em **Cancelar envio**. O status esperado é `RASCUNHO`.

### SecGov inicia uma análise

Quando o processo estiver aguardando análise, a SecGov clica em **Iniciar análise**. O status esperado é `EM_ANALISE`.

### SecGov solicita ajustes

Quando o processo estiver em análise, a SecGov informa a orientação e confirma **Solicitar ajustes**. O status esperado é `EM_AJUSTE`.

### Unidade reenvia um processo ajustado

Quando o processo estiver em ajuste, a Unidade corrige os dados e clica em **Reenviar para análise**. O status esperado é `AGUARDANDO_ANALISE`.

### SecGov conclui a análise

Quando o processo estiver em análise e estiver adequado, a SecGov clica em **Concluir análise**. O status esperado é `CONCLUIDO`.

### SecGov cancela uma análise

Quando o processo estiver em análise, a SecGov informa a justificativa e confirma **Cancelar análise**. O status esperado é `AGUARDANDO_ANALISE`.

## 18. Glossário

| Termo | Significado |
|---|---|
| Processo | Informações e riscos acompanhados pela organização. |
| Status | Situação atual do processo no fluxo. |
| Pendência | Informação obrigatória que precisa ser preenchida ou corrigida. |
| Ajuste | Correção solicitada pela SecGov. |
| Reenvio | Novo envio feito depois das correções. |
| Ciclo de revisão | Nova rodada de avaliação depois da conclusão. |
| Histórico | Registro das ações e mudanças ocorridas. |

## 19. Ciclo de vida completo do processo

Esta seção apresenta todos os caminhos previstos no ciclo, incluindo os retornos, cancelamentos e ciclos de revisão.

### 19.1. Criação do processo

1. A Unidade acessa a tela de Processos.
2. Seleciona a opção para criar um processo.
3. Preenche os dados de identificação, unidade, responsável e objetivos.
4. Salva o processo.

Resultado: o processo é criado em `RASCUNHO`.

Enquanto estiver em rascunho:

- a Unidade pode editar as informações;
- a Unidade pode preencher as etapas de riscos;
- a Unidade pode consultar o processo;
- a Unidade pode enviar para análise quando não houver pendências obrigatórias;
- a SecGov pode visualizar o processo, mas não deve iniciar uma análise de um processo que ainda não foi enviado.

### 19.2. Rascunho para aguardando análise

**Status atual:** `RASCUNHO`  
**Ação:** Enviar para análise  
**Responsável:** Unidade  
**Próximo status:** `AGUARDANDO_ANALISE`

Antes de confirmar, a Unidade deve conferir se todas as informações obrigatórias estão preenchidas.

Possíveis resultados:

- envio aceito: o processo entra na fila da SecGov;
- existem pendências: o envio não é realizado e a Unidade permanece no rascunho;
- usuário cancela a confirmação: nenhuma alteração de status ocorre;
- erro no envio: o processo permanece no status anterior e o usuário deve tentar novamente após verificar os dados.

### 19.3. Aguardando análise

**Status:** `AGUARDANDO_ANALISE`  
**Responsável pela próxima ação:** SecGov

#### Caminho normal

1. A SecGov acessa a tela de Acompanhamento.
2. Filtra os processos aguardando análise.
3. Abre o processo.
4. Confere a unidade, o responsável e os documentos.
5. Atribui um analista, quando necessário.
6. Clica em **Iniciar análise**.

Resultado: `AGUARDANDO_ANALISE` → `EM_ANALISE`.

#### Cancelamento do envio pela Unidade

Enquanto a análise não tiver sido iniciada, a Unidade pode clicar em **Cancelar envio**.

Resultado: `AGUARDANDO_ANALISE` → `RASCUNHO`.

Os dados preenchidos devem permanecer no processo para que a Unidade possa corrigir ou complementar as informações antes de enviar novamente.

#### Processo parado aguardando ação

Se nenhuma ação for executada, o processo permanece em `AGUARDANDO_ANALISE`. A SecGov deve acompanhar a fila e a Unidade deve aguardar ou cancelar o envio.

### 19.4. Em análise

**Status:** `EM_ANALISE`  
**Responsável:** SecGov

#### Conclusão sem ajustes

1. A SecGov revisa o conteúdo do processo.
2. Confirma que as informações estão adequadas.
3. Clica em **Concluir análise**.
4. Registra uma observação, se necessário.

Resultado: `EM_ANALISE` → `CONCLUIDO`.

#### Solicitação de ajustes

1. A SecGov identifica o que precisa ser corrigido.
2. Clica em **Solicitar ajustes**.
3. Descreve a orientação para a Unidade.
4. Informa o prazo, quando aplicável.
5. Confirma a solicitação.

Resultado: `EM_ANALISE` → `EM_AJUSTE`.

#### Cancelamento da análise

1. A SecGov clica em **Cancelar análise**.
2. Informa a justificativa obrigatória.
3. Confirma o cancelamento.

Resultado: `EM_ANALISE` → `AGUARDANDO_ANALISE`.

O cancelamento não conclui o processo e não deve apagar as informações já preenchidas.

#### Processo parado em análise

Se a SecGov não concluir, cancelar ou solicitar ajustes, o processo permanece em `EM_ANALISE`. A Unidade deve visualizar o status e aguardar a manifestação da SecGov.

### 19.5. Em ajuste

**Status:** `EM_AJUSTE`  
**Responsável:** Unidade

#### Correção e reenvio

1. A Unidade abre o processo.
2. Lê a orientação e o prazo da SecGov.
3. Corrige as informações solicitadas.
4. Salva as alterações.
5. Clica em **Reenviar para análise**.
6. Informa uma observação sobre o que foi corrigido, quando necessário.
7. Confirma o reenvio.

Resultado: `EM_AJUSTE` → `AGUARDANDO_ANALISE`.

#### Ajuste ainda não concluído

Se a Unidade ainda não terminou as correções, o processo permanece em `EM_AJUSTE`. A Unidade pode sair da tela e continuar depois, respeitando o prazo informado.

#### Prazo vencido

Se o prazo de ajuste vencer antes do reenvio, o processo continua exigindo correção e reenvio. A situação deve ser sinalizada para a SecGov e para a Unidade conforme as regras de notificação adotadas.

### 19.6. Concluído

**Status:** `CONCLUIDO`  
**Responsável pela decisão seguinte:** SecGov

Depois da conclusão:

- a Unidade pode consultar o processo;
- o histórico deve registrar a conclusão;
- os dados do processo devem continuar disponíveis;
- a SecGov pode iniciar um novo ciclo de revisão quando houver necessidade;
- nenhuma ação de análise deve ser executada sem abrir um novo ciclo.

#### Abertura de revisão

Resultado esperado: `CONCLUIDO` → `PENDENTE_REVISAO`.

#### Cancelamento da conclusão

O diagrama e o fluxo solicitado indicam a possibilidade de cancelar a conclusão e retornar à análise.

Resultado esperado: `CONCLUIDO` → `AGUARDANDO_ANALISE`.

**VALIDAR:** a ação de cancelar conclusão precisa ser confirmada antes de ser tratada como disponível para o usuário.

### 19.7. Pendente de revisão

**Status:** `PENDENTE_REVISAO`.

Esta etapa indica que o processo está aguardando o início ou o envio de uma nova revisão.

#### Início da revisão pela SecGov

1. A SecGov localiza o processo na tela de Acompanhamento.
2. Confere o histórico e o ciclo atual.
3. Clica em **Iniciar revisão**.

Resultado: `PENDENTE_REVISAO` → `EM_REVISAO`.

#### Envio da revisão pela Unidade

Quando a revisão depender de informações da Unidade:

1. a Unidade abre o processo;
2. revisa ou atualiza as informações solicitadas;
3. clica em **Enviar revisão**;
4. confirma o envio.

Resultado esperado: o processo entra na fila de revisão da SecGov.

**VALIDAR:** o próximo status após o envio da revisão deve ser definido pelo responsável do produto.

#### Processo aguardando revisão

Se nenhuma ação for executada, o processo permanece em `PENDENTE_REVISAO`.

### 19.8. Em revisão

**Status previsto:** `EM_REVISAO`  
**Responsável:** SecGov

Durante a revisão, a SecGov pode:

- **Concluir revisão:** encerra o ciclo e mantém o processo concluído;
- **Solicitar ajustes:** devolve o processo para a Unidade;
- **Cancelar revisão:** interrompe a revisão e retorna o processo para `PENDENTE_REVISAO`;
- **Atualizar/consultar:** acompanha as informações sem necessariamente alterar o status.

Fluxos previstos:

```text
EM_REVISAO → Concluir revisão → CONCLUIDO
EM_REVISAO → Solicitar ajustes → EM_AJUSTE_REVISAO
EM_REVISAO → Cancelar revisão → PENDENTE_REVISAO
```

**VALIDAR:** confirmar os botões, as mensagens e a ordem de cada ação na tela de revisão.

### 19.9. Em ajuste de revisão

**Status previsto:** `EM_AJUSTE_REVISAO`  
**Responsável:** Unidade

Quando a SecGov solicitar ajustes durante a revisão:

1. a Unidade abre o processo;
2. lê as orientações da revisão;
3. corrige ou complementa os dados;
4. salva as alterações;
5. clica em **Enviar revisão** ou **Reenviar revisão**;
6. confirma o envio.

Resultado esperado: `EM_AJUSTE_REVISAO` → `PENDENTE_REVISAO`.

Se a Unidade ainda não concluir os ajustes, o processo permanece em `EM_AJUSTE_REVISAO`.

**VALIDAR:** confirmar se o botão deve se chamar **Enviar revisão** ou **Reenviar revisão** e qual mensagem de confirmação deve ser apresentada.

## 20. Matriz completa de ações por status

| Status | Unidade pode fazer | SecGov pode fazer | Se nada for feito |
|---|---|---|---|
| `RASCUNHO` | Editar, preencher, enviar para análise | Consultar | Permanece em rascunho |
| `AGUARDANDO_ANALISE` | Cancelar envio, consultar | Atribuir, iniciar análise | Permanece aguardando |
| `EM_ANALISE` | Consultar e acompanhar | Concluir, solicitar ajustes, cancelar análise | Permanece em análise |
| `EM_AJUSTE` | Editar, corrigir, reenviar | Consultar e acompanhar | Permanece em ajuste |
| `CONCLUIDO` | Consultar | Abrir revisão ou cancelar conclusão, se permitido | Permanece concluído |
| `PENDENTE_REVISAO` | Enviar revisão, consultar | Iniciar revisão, consultar | Permanece pendente |
| `EM_REVISAO` | Consultar e acompanhar | Concluir, solicitar ajustes, cancelar revisão | Permanece em revisão |
| `EM_AJUSTE_REVISAO` | Editar, corrigir, reenviar revisão | Consultar e acompanhar | Permanece em ajuste de revisão |

Os dois últimos status são parte do fluxo esperado do diagrama e precisam ser confirmados para a versão final do produto.

## 21. Todos os retornos e cancelamentos

| Situação | Ação | Retorno |
|---|---|---|
| Envio aguardando análise | Unidade cancela o envio | `RASCUNHO` |
| Análise em andamento | SecGov cancela a análise | `AGUARDANDO_ANALISE` |
| Análise concluída | SecGov cancela a conclusão, se permitido | `AGUARDANDO_ANALISE` |
| Revisão em andamento | SecGov cancela a revisão | `PENDENTE_REVISAO` |
| Análise com problema | SecGov solicita ajustes | `EM_AJUSTE` |
| Revisão com problema | SecGov solicita ajustes | `EM_AJUSTE_REVISAO` |
| Ajuste da análise finalizado | Unidade reenvia | `AGUARDANDO_ANALISE` |
| Ajuste da revisão finalizado | Unidade reenvia a revisão | `PENDENTE_REVISAO` |

## 22. Resposta objetiva sobre a cobertura

O documento agora descreve:

- criação do processo;
- permanência em rascunho;
- envio para análise;
- cancelamento do envio;
- início da análise;
- conclusão da análise;
- solicitação de ajustes;
- correção e reenvio;
- cancelamento da análise;
- conclusão do processo;
- abertura de revisão;
- envio da revisão;
- revisão em andamento;
- ajustes da revisão;
- reenvio da revisão;
- cancelamento da revisão;
- cancelamento da conclusão;
- comportamento quando nenhuma ação é executada;
- responsabilidades e telas de cada usuário.

Os itens marcados como **VALIDAR** são os únicos pontos que dependem de confirmação do PO ou da regra definitiva de revisão.
