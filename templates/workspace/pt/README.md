# minhas-specs

Contrato do repositório usado pelos skills Myspec. Toda regra nasce como `Status: Proposto` e só passa a restringir os skills depois que um desenvolvedor a aprova explicitamente (`Status: Aprovado`).

Os documentos do contrato são compartilhados com o time e registram criador e aprovadores a partir do Git. Tudo em `specs/` é registro de trabalho local do desenvolvedor: não traz identidade Git, apenas status e um histórico de revisões datado.

| Caminho | Conteúdo | Criado por |
| --- | --- | --- |
| `ferramentas.md` | Comandos de build e teste e as métricas de qualidade escolhidas pelo desenvolvedor, com como medi-las | `myspec-configurar` |
| `diretrizes-de-produto/` | Conceitos, terminologia e invariantes de produto | `myspec-configurar` |
| `praticas-de-codigo/` | Uma prática de código do repositório por arquivo | `myspec-configurar` |
| `orientacoes-gerais/` | Uma orientação compartilhada por todos os skills Myspec por arquivo | `myspec-configurar` |
| `relatorio-de-qualidade.md` | Valores das métricas aprovadas no projeto inteiro com oportunidades de melhoria | `myspec-quantificar` |
| `specs/NNN-<nome>/` | `spec.md`, `arvore-de-arquivos.md` e `inspecoes/inspecao-NNN.md` de cada mudança | `myspec-prescrever`, `myspec-implementar`, `myspec-inspecionar` |

## Fluxo de trabalho

| Skill | Papel |
| --- | --- |
| `myspec-configurar` | Define ferramentas, diretrizes de produto, práticas de código e orientações. |
| `myspec-prescrever` | Transforma uma solicitação de mudança em uma spec testável. |
| `myspec-implementar` | Propõe e aprova a árvore de arquivos e então implementa a spec. |
| `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede as métricas aprovadas e registra uma inspeção com veredito. |
| `myspec-corrigir` | Faz um ajuste pequeno de no máximo três arquivos, inclusive dentro de uma spec implementada. |
| `myspec-quantificar` | Julga as métricas aprovadas do projeto inteiro e sugere melhorias que podem originar novas specs. |

Um ciclo típico após a configuração:

```text
prescrever > implementar (árvore) > implementar > inspecionar > implementar > inspecionar > corrigir > inspecionar
```

Repita implementar ou corrigir seguido de inspecionar quantas vezes precisar. Uma spec está concluída, e o trabalho pode avançar para a próxima, quando sua inspeção mais recente estiver `Apta` ou `Apta com ressalvas`; o veredito nunca impede a execução de nenhum skill. Prefira implementar a corrigir quando a mudança exigir mais de três arquivos ou afetar uma spec cuja árvore nunca foi aprovada.

Invoque um skill com `$nome` no Codex ou `/nome` no Claude Code, por exemplo `$myspec-configurar` ou `/myspec-configurar`.

`myspec.json` é mantido pela CLI `myspec`; não o edite manualmente.
