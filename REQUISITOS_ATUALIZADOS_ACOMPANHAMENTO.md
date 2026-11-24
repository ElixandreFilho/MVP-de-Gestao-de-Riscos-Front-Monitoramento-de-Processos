# Requisitos atualizados — Acompanhamento de processos

## 1. Objetivo

Organizar a experiência de acompanhamento dos processos, separando claramente as responsabilidades da Unidade e da SecGov, preservando as regras de negócio, os serviços mockados, as permissões e o padrão visual do sistema.

Esta versão também define a padronização dos botões de ação, que deverão utilizar ícones com tooltips explicativos.

## 2. Escopo

### Incluído

- Card de acompanhamento dentro do detalhe de um processo.
- Tela administrativa de Acompanhamento.
- Transições de status já existentes no mock.
- Ações de envio, reenvio e cancelamento de envio.
- Ações operacionais da SecGov.
- Histórico do processo na tela de Acompanhamento.
- Padronização visual dos botões com ícones e tooltips.

### Fora do escopo

- Criação de backend real.
- Criação de novos endpoints sem necessidade comprovada.
- Alteração da autenticação real.
- Redesenho de telas não relacionadas ao acompanhamento.
- Persistência dos dados além do comportamento já existente no mock.

## 3. Responsabilidades por tela

### 3.1. Tela de Processos — detalhe do processo

O card de acompanhamento do detalhe deve apresentar somente informações e ações relacionadas à Unidade ou ao responsável pelo envio:

- Status atual do processo.
- Mensagem contextual do status.
- Pendências obrigatórias para envio, quando existirem.
- Analista ou analistas vinculados, quando disponíveis.
- Atualização dos dados do acompanhamento.
- Envio para análise.
- Envio da revisão.
- Cancelamento de envio pendente.
- Reenvio após ajustes solicitados.

O card não deve disponibilizar ações administrativas da SecGov.

### 3.2. Tela de Acompanhamento

A tela de Acompanhamento deve concentrar a operação administrativa da SecGov:

- Listagem dos processos.
- Filtros por nome, datas, unidade, status e analista.
- Indicadores quantitativos por status.
- Distribuição de processos para analistas.
- Visualização do processo em fluxo administrativo.
- Histórico do processo.
- Gestão de prazos.
- Consulta de analistas e notificações.

Não deve existir card de “processo em destaque” ocupando a área entre os indicadores e as abas. A listagem deve permanecer como conteúdo principal da tela.

O histórico deve permanecer acessível pela ação de histórico da listagem e pelo fluxo de notificações, sem ser transferido para o detalhe comum do processo.

## 4. Regras de visibilidade no detalhe do processo

| Status | Ação esperada no card |
|---|---|
| `RASCUNHO` | Enviar para análise, se não houver pendências impeditivas |
| `AGUARDANDO_ANALISE` | Cancelar envio para análise |
| `EM_ANALISE` | Nenhuma ação operacional da SecGov |
| `EM_AJUSTE` | Reenviar para análise após ajustes |
| `PENDENTE_REVISAO` | Enviar revisão, conforme o ciclo do processo |
| `CONCLUIDO` | Nenhuma ação de envio |

O status real retornado pelo serviço de acompanhamento deve ser a fonte de verdade. O status visual não deve ser usado para liberar ações indevidas.

## 5. Regras de visibilidade na operação da SecGov

As ações administrativas devem aparecer somente no fluxo administrativo de Acompanhamento e respeitar o papel de administrador:

- `AGUARDANDO_ANALISE`: iniciar análise.
- `EM_ANALISE`: concluir análise, solicitar ajustes ou cancelar análise.
- `PENDENTE_REVISAO`: iniciar revisão.
- `EM_REVISAO`, quando aplicável ao modelo futuro: concluir revisão, solicitar ajustes ou cancelar revisão.
- `CONCLUIDO`: cancelar conclusão, quando essa operação existir no serviço.

Essas ações não devem aparecer no card comum da tela de Processos, mesmo quando o usuário for da SecGov.

## 6. Botões, ícones e tooltips

Os botões de ação devem ser revisados para reduzir poluição visual e manter consistência entre as telas.

### Requisitos

- Ações iconográficas devem utilizar os ícones já adotados pelo projeto.
- Botões cuja função seja compreensível pelo ícone devem ser exibidos apenas como ícone.
- Todo botão icon-only deve possuir tooltip ao passar o mouse.
- O tooltip deve descrever claramente a ação, por exemplo: “Visualizar processo”, “Ver histórico”, “Atualizar status” ou “Cancelar envio”.
- O botão deve manter `aria-label` descritivo para acessibilidade.
- Ações destrutivas ou de impacto no status devem manter diferenciação visual por cor.
- A ação principal pode permanecer com texto e ícone quando a clareza exigir.
- Tooltips não devem substituir mensagens de confirmação para ações críticas.
- O comportamento de loading e disabled deve ser preservado.
- A área clicável dos botões deve permanecer adequada para desktop e telas menores.

### Ações candidatas a botão somente com ícone

- Visualizar processo.
- Ver histórico.
- Atualizar.
- Baixar planilha.
- Ver detalhes.
- Editar prazo.
- Remover prazo.
- Fechar modal.

Antes da implementação, deve ser feita uma revisão dos botões existentes para evitar transformar em icon-only uma ação que perderia clareza para o usuário.

## 7. Integração entre as telas

- As duas telas devem reutilizar `acompanhamentoService`.
- As transições devem utilizar as rotas já existentes no `mockApi.ts`.
- Após uma ação, os dados devem ser recarregados pela implementação existente.
- Uma alteração de status feita em uma tela deve ser refletida na outra após atualização ou novo carregamento.
- Não duplicar a lógica de transição entre componentes.
- Preservar notificações de sucesso e erro.
- Preservar indicadores de carregamento.

## 8. Permissões

- Usuários da Unidade podem executar somente ações de envio, reenvio e cancelamento do envio permitido.
- Usuários SecGov não devem receber ações administrativas no card comum do processo.
- Usuários administradores podem executar ações operacionais na tela de Acompanhamento, conforme status e permissões.
- A condição de o processo pertencer à SecGov não deve, isoladamente, liberar ações administrativas no card comum.

## 9. Critérios de aceite

- A listagem de Acompanhamento não apresenta card de processo em destaque entre indicadores e abas.
- O histórico continua acessível pela listagem e pelas notificações da tela de Acompanhamento.
- O detalhe do processo apresenta somente ações de envio relacionadas à Unidade.
- Ações administrativas da SecGov permanecem disponíveis no fluxo administrativo autorizado.
- Botões icon-only possuem tooltip e `aria-label`.
- Ações críticas preservam confirmação, loading, mensagens e cores de alerta.
- Nenhuma transição existente do mock é quebrada.
- Os filtros, indicadores, distribuição, prazos e notificações continuam funcionando.
- A interface permanece responsiva e consistente com o design atual.

## 10. Validação técnica

Após a implementação dos botões e tooltips, executar:

```bash
npm run build
npm run lint
```

Também validar manualmente:

- Visualização de cada tooltip.
- Navegação por teclado nos botões.
- Leitura dos `aria-labels`.
- Estados disabled e loading.
- Ações de envio e cancelamento.
- Ações administrativas dentro do fluxo de Acompanhamento.
- Atualização dos status entre as telas.

## 11. Resultado esperado

O usuário deve identificar rapidamente:

1. Qual é o status do processo.
2. Qual é a próxima ação da Unidade.
3. Quais operações pertencem exclusivamente à SecGov.
4. O significado de cada botão iconográfico.
5. Onde consultar o histórico e os demais dados administrativos.
