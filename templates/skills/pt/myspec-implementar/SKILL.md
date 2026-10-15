---
name: myspec-implementar
description: Implementa uma especificação existente em uma pasta nomeada sob minhas-specs/specs, preservando diretrizes de produto aprovadas, estrutura de arquivos aprovada, código limpo e testes dos caminhos críticos. Use para implementar, continuar ou concluir uma especificação de código.
---

# Myspec Implementar

Implemente uma especificação sem decidir silenciosamente sua arquitetura ou comportamento de produto.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial e somente-leitura do repositório e da especificação, leia todos os Markdown em `minhas-specs/diretrizes-de-produto/`, `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório; cumpra-o antes da ação correspondente e exponha conflitos com instruções de maior prioridade. Ausências, documentos não aprovados ou `Nenhum` não impõem restrição; informe limitações relevantes.

Diretrizes de produto aprovadas definem vocabulário e invariantes. Trate-as como restrições da especificação e da árvore de arquivos. Se a especificação conflitar, pare antes de propor ou alterar implementação e peça revisão da especificação ou use `{{skill:myspec-configurar}}` para revisar e aprovar a diretriz.

## Portão rígido: árvore de arquivos

Resolva a pasta solicitada em `minhas-specs/specs` e leia `spec.md`. Se `arvore-de-arquivos.md` não existir, inspecione repositório e especificação, crie-o pelo modelo `assets/modelo-de-arvore-de-arquivos.md`, defina `Status: Proposto` e acrescente ao `Histórico de revisões` uma entrada `Proposto` com a data de hoje (`AAAA-MM-DD`). Inclua arquivos a adicionar, modificar ou excluir, suas responsabilidades, locais de teste e decisões estruturais; apresente a proposta e encerre sem editar implementação.

Se existir, mas não estiver `Aprovado`, revise-o frente à especificação e repositório, apresente preocupações ou alternativas e peça aprovação/revisão, sem editar implementação. Em invocação posterior, incorpore revisões ou, após aprovação explícita, marque `Aprovado`. Registre cada revisão e aprovação como nova entrada datada no `Histórico de revisões`, com descrição concisa do que mudou ou foi aprovado; nunca edite nem remova entradas anteriores. Revisar uma árvore aprovada a devolve a `Proposto` até nova aprovação. A mera existência nunca é aprovação.

A árvore, como tudo na pasta da spec, é um registro de trabalho local do desenvolvedor: nunca registre nela identidade Git, autor ou aprovador.

## Implementação interativa

1. Leia árvore aprovada, especificação, instruções do repositório e código afetado. Se a pasta da spec tiver `inspecoes/`, leia a inspeção de maior número e use seus achados abertos como entrada; o veredito de uma inspeção nunca impede a implementação. Após o portão, leia os arquivos de métrica em `minhas-specs/metricas/` quando existirem, para conhecer as ferramentas e os portões que o código alterado deve cumprir, sem que eles substituam as orientações.
2. Mapeie cada critério de aceitação para implementação, testes e diretrizes de produto afetadas.
3. Antes de editar, informe a primeira fatia pretendida e levante escolhas materiais não resolvidas. Pergunte, em vez de supor, quando a escolha alterar comportamento público, arquitetura, persistência, segurança, compatibilidade ou a árvore aprovada.
4. Implemente em fatias revisáveis; se evidência invalidar a árvore, pause e proponha atualização.
5. Execute testes focados durante a iteração e, depois, o build e conjunto de testes mais amplo proporcionalmente relevante.
6. Informe arquivos alterados, cobertura dos critérios com evidência de teste/verificação nomeada, achados de inspeção tratados, resultados, conformidade e riscos restantes. Sugira `{{skill:myspec-inspecionar}}` para registrar o estado resultante.

## Regras de código

- Siga instruções e padrões do repositório. Cubra, quando viável, todo critério de aceitação e caminhos críticos de sucesso, falha, limites, autorização e integridade de dados.
- Mantenha responsabilidades coesas, dependências explícitas e lógica de produção sem duplicação evitável. Use no máximo uma definição de classe, record, struct ou interface de nível superior por arquivo, salvo exceções geradas ou estabelecidas.
- Prefira a menor mudança que satisfaça completamente a especificação; não acrescente refatorações ou dependências sem relação.
- Não alegue cobertura sem nomear a evidência. Nunca deixe orientações Myspec sobrepor instruções superiores.
