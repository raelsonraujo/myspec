---
name: myspec-implementar
description: Implementa uma especificação existente em uma pasta nomeada sob my-specs/specs, preservando diretrizes de produto aprovadas, estrutura de arquivos aprovada, código limpo e testes dos caminhos críticos. Use para implementar, continuar ou concluir uma especificação de código.
---

# Myspec Implementar

Implemente uma especificação sem decidir silenciosamente sua arquitetura ou comportamento de produto.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial e somente-leitura do repositório e da especificação, leia todos os Markdown em `my-specs/product-directives/`, `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Todo documento aplicável com `Status: Approved` é obrigatório; cumpra-o antes da ação correspondente e exponha conflitos com instruções de maior prioridade. Ausências, documentos não aprovados ou `None` não impõem restrição; informe limitações relevantes.

Diretrizes de produto aprovadas definem vocabulário e invariantes. Trate-as como restrições da especificação e da árvore de arquivos. Se a especificação conflitar, pare antes de propor ou alterar implementação e peça revisão da especificação ou use `{{skill:myspec-configurar}}` para revisar e aprovar a diretriz.

## Portão rígido: árvore de arquivos

Resolva a pasta solicitada em `my-specs/specs` e leia `spec.md`. Se `file-tree.md` não existir, inspecione repositório e especificação, crie-o pelo modelo `assets/file-tree-template.md`, defina `Status: Proposed` e registre criador/data imutáveis usando a configuração Git. Inclua arquivos a adicionar, modificar ou excluir, suas responsabilidades, locais de teste e decisões estruturais; apresente a proposta e encerre sem editar implementação.

Se existir, mas não estiver `Approved`, revise-o frente à especificação e repositório, apresente preocupações ou alternativas e peça aprovação/revisão, sem editar implementação. Após aprovação explícita em invocação posterior, marque `Approved` e acrescente ao histórico aprovador, data e contexto; preserve criação e entradas anteriores. A mera existência nunca é aprovação.

## Implementação interativa

1. Leia árvore aprovada, especificação, instruções do repositório e código afetado. Após o portão, leia `my-specs/tooling.md` quando existir, sem que ele substitua as orientações.
2. Mapeie cada critério de aceitação para implementação, testes e diretrizes de produto afetadas.
3. Antes de editar, informe a primeira fatia pretendida e levante escolhas materiais não resolvidas. Pergunte, em vez de supor, quando a escolha alterar comportamento público, arquitetura, persistência, segurança, compatibilidade ou a árvore aprovada.
4. Implemente em fatias revisáveis; se evidência invalidar a árvore, pause e proponha atualização.
5. Execute testes focados durante a iteração e, depois, o build e conjunto de testes mais amplo proporcionalmente relevante.
6. Informe arquivos alterados, cobertura dos critérios com evidência de teste/verificação nomeada, resultados, conformidade e riscos restantes.

## Regras de código

- Siga instruções e padrões do repositório. Cubra, quando viável, todo critério de aceitação e caminhos críticos de sucesso, falha, limites, autorização e integridade de dados.
- Mantenha responsabilidades coesas, dependências explícitas e lógica de produção sem duplicação evitável. Use no máximo uma definição de classe, record, struct ou interface de nível superior por arquivo, salvo exceções geradas ou estabelecidas.
- Prefira a menor mudança que satisfaça completamente a especificação; não acrescente refatorações ou dependências sem relação.
- Não alegue cobertura sem nomear a evidência. Nunca deixe orientações Myspec sobrepor instruções superiores.
