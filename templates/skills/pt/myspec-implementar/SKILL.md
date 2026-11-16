---
name: myspec-implementar
description: Implementa uma especificação ainda não finalizada, ativando sua entrada no manifesto ao iniciar implementação, em uma pasta nomeada sob minhas-specs/specs, preservando estrutura de arquivos aprovada, código limpo e testes dos caminhos críticos. Use para implementar, continuar ou concluir uma especificação de código.
---

# Myspec Implementar

Implemente uma especificação sem decidir silenciosamente sua arquitetura ou comportamento de produto.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial e somente-leitura do repositório e da especificação, leia todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório; cumpra-o antes da ação correspondente e exponha conflitos com instruções de maior prioridade. Ausências, documentos não aprovados ou `Nenhum` não impõem restrição; informe limitações relevantes.

## Portão do ciclo de vida

Antes de propor ou editar árvore ou implementação, leia `minhas-specs/specs/manifesto.json` e a entrada da spec solicitada. Se estiver ausente, incompleto ou inconsistente, use primeiro o procedimento Manifesto de specs de `{{skill:myspec-configurar}}`; não adivinhe status nem crie manifesto parcial. Spec `finalizada` é imutável: não implemente, revise contrato/árvore, altere evidência de conclusão nem reabra. Recomende `{{skill:myspec-prescrever}}` para delimitar qualquer impacto posterior em nova spec, inclusive correções e refatorações. A nova spec pode alterar deliberadamente os mesmos arquivos de código, mantendo a finalizada como histórico.

Mantenha `proposta` durante descoberta, proposta, revisão e aprovação da árvore. Após passar pelos portões de contrato e árvore, imediatamente antes da primeira edição da implementação de produção ou testes, altere somente essa entrada de `proposta` para `ativa`, com `inspecaoDeConclusao: null`. Releia antes de gravar e preserve entradas e campos não relacionados. Continuação de implementação ativa mantém `ativa`, mesmo com testes passando, interrupção da invocação ou bloqueio. Nunca rebaixe status. Somente `{{skill:myspec-inspecionar}}` finaliza esta implementação com inspeção final registrada e confirmação explícita do desenvolvedor após revisá-la.

## Portão rígido: árvore de arquivos

Use os critérios BDD identificados de `spec.md` como fonte única da verdade dos comportamentos mensuráveis específicos da mudança. Antes de propor ou implementar a árvore, verifique passos explícitos `Dado / Quando / Então`, resultados verificáveis e se comportamentos obrigatórios específicos da mudança em outras seções estão representados nos critérios.

Regras já estabelecidas por práticas ou orientações aprovadas aplicáveis são exigidas de seus documentos, sem repeti-las como CAs; sua ausência nos critérios não é lacuna de contrato. Não acrescente critérios de conformidade nem exija revisão da spec apenas para repetir orientações. Referencie a origem da regra quando precisar de contexto, sem copiá-la. Se faltarem critérios, forem ambíguos, não BDD ou contraditórios, exponha a lacuna exata e recomende `{{skill:myspec-prescrever}}` para revisar a spec antes da implementação afetada; nunca invente cenários a partir do código nem reescreva silenciosamente o contrato. O corpo da spec é o contrato atual; uma seção `## Histórico de revisões` (ou a equivalente do projeto) é apenas contexto e nunca acrescenta, restaura nem remove requisitos. Regras de engenharia e portões de métricas aprovados continuam aplicáveis separadamente.

Resolva a pasta solicitada em `minhas-specs/specs` e leia `spec.md`. Se `arvore-de-arquivos.md` não existir, inspecione repositório e especificação, crie-o pelo modelo `assets/modelo-de-arvore-de-arquivos.md`, defina `Status: Proposto` e acrescente ao `Histórico de revisões` uma entrada `Proposto` com a data de hoje (`AAAA-MM-DD`). Inclua arquivos a adicionar, modificar ou excluir, suas responsabilidades, locais de teste e decisões estruturais; apresente a proposta e encerre sem editar implementação.

Se existir, mas não estiver `Aprovado`, revise-o frente à especificação e repositório, apresente preocupações ou alternativas e peça aprovação/revisão, sem editar implementação. Em invocação posterior, incorpore revisões ou, após aprovação explícita, marque `Aprovado`. Registre cada revisão e aprovação como nova entrada datada no `Histórico de revisões`, com descrição concisa do que mudou ou foi aprovado; nunca edite nem remova entradas anteriores. Revisar uma árvore aprovada a devolve a `Proposto` até nova aprovação. A mera existência nunca é aprovação.

A árvore, como tudo na pasta da spec, é um registro de trabalho local do desenvolvedor: nunca registre nela identidade Git, autor ou aprovador.

Mapeie todo ID de critério para locais de produção e de teste ou verificação planejada na árvore; ela não pode introduzir nem redefinir comportamento.

## Implementação interativa

1. Leia árvore aprovada, especificação, instruções do repositório e código afetado. Se a pasta da spec ainda não finalizada tiver `inspecoes/`, leia a inspeção de maior número e use seus achados abertos como entrada. Inspeção bloqueada permite continuar implementação ativa; spec finalizada exige nova spec. Após o portão, leia os arquivos de métrica em `minhas-specs/metricas/` quando existirem, para conhecer as ferramentas e os portões que o código alterado deve cumprir, sem que eles substituam as orientações.
2. Mapeie cada ID de critério para implementação e testes que estabeleçam o estado Dado, exercitem o evento Quando e verifiquem todos os resultados Então/E. Preserve os IDs nos registros de cobertura e no relatório de implementação; os nomes dos testes podem seguir as convenções do repositório.
3. Antes de editar, informe a primeira fatia pretendida e levante escolhas materiais não resolvidas. Pergunte, em vez de supor, quando a escolha alterar comportamento público, arquitetura, persistência, segurança, compatibilidade ou a árvore aprovada.
4. Implemente em fatias revisáveis; se evidência invalidar a árvore, pause e proponha atualização.
5. Execute testes focados durante a iteração e, depois, o build e conjunto de testes mais amplo proporcionalmente relevante.
6. Informe arquivos alterados, cobertura dos critérios com evidência de teste/verificação nomeada, achados de inspeção tratados, resultados, conformidade e riscos restantes. Sugira `{{skill:myspec-inspecionar}}` para registrar o estado resultante.

## Regras de código

- Siga instruções e padrões do repositório. Cubra cada cenário BDD com testes automatizados quando viável, incluindo todos os resultados e caminhos críticos especificados de sucesso, falha, limites, autorização e integridade de dados. Quando a automação for inviável, cite o critério, a limitação e um procedimento concreto de verificação manual ou alternativa com seu resultado; cenário não verificado continua sendo lacuna.
- Se a implementação ou inspeção revelar mudança comportamental necessária, resolva-a em `spec.md` por `{{skill:myspec-prescrever}}` antes de implementá-la e atualize os mapeamentos e testes afetados. Nunca enfraqueça critérios para ajustar ao código nem trate sugestões da inspeção como novos requisitos comportamentais.
- Mantenha responsabilidades coesas, dependências explícitas e lógica de produção sem duplicação evitável. Use no máximo uma definição de classe, record, struct ou interface de nível superior por arquivo, salvo exceções geradas ou estabelecidas.
- Prefira a menor mudança que satisfaça completamente a especificação; não acrescente refatorações ou dependências sem relação.
- Não alegue cobertura sem nomear a evidência. Nunca deixe orientações Myspec sobrepor instruções superiores.
