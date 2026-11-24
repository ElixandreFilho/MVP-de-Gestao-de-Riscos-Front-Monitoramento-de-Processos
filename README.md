# front-gestao-riscos-mvp

MVP standalone do front de Gestão de Riscos.

Este projeto mantém a configuração, estilo e telas do `front-gestao-riscos`, mas não depende de backend nem de Keycloak reais. As chamadas `axios` são respondidas por `src/mocks/mockApi.ts`, com dados iniciais e operações de criar, editar, excluir, filtrar, distribuir processos, alterar acompanhamento, enviar documentos e baixar arquivos funcionando apenas em memória durante a sessão do navegador.

```sh
npm install
npm run dev
```

Os dados voltam ao estado inicial quando a página é recarregada.

## Configuração local

Copie `.env.example` para `.env` e preencha as variáveis quando necessário. O Monitoramento funciona com dados mockados em memória para a demonstração.

## Colaboração

```sh
git clone https://github.com/ElixandreFilho/MVP-de-Gestao-de-Riscos-Front-Monitoramento-de-Processos.git
cd MVP-de-Gestao-de-Riscos-Front-Monitoramento-de-Processos
npm install
npm run dev
```

Para contribuir, crie uma branch, faça as alterações, execute `npm run lint` e `npm run build`, e abra um Pull Request.
