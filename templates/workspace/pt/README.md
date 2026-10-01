# my-specs

Contrato do repositório usado pelos skills Myspec. Toda regra nasce como `Status: Proposed` e só passa a restringir os skills depois que um desenvolvedor a aprova explicitamente (`Status: Approved`).

| Caminho | Conteúdo | Criado por |
| --- | --- | --- |
| `tooling.md` | Comandos aprovados de complexidade ciclomática e cobertura de testes | `myspec-configurar` |
| `product-directives/` | Conceitos, terminologia e invariantes de produto | `myspec-configurar` |
| `coding-practices/` | Uma prática de código do repositório por arquivo | `myspec-configurar` |
| `general-guidelines/` | Uma orientação compartilhada por todos os skills Myspec por arquivo | `myspec-configurar` |
| `specs/NNN-<nome>/` | `spec.md`, `file-tree.md`, `quality-report.md` e `inspections/inspection-NNN.md` de cada mudança | `myspec-prescrever`, `myspec-implementar`, `myspec-quantificar`, `myspec-inspecionar` |

## Fluxo de trabalho

| Skill | Papel |
| --- | --- |
| `myspec-configurar` | Define ferramentas, diretrizes de produto, práticas de código e orientações. |
| `myspec-prescrever` | Transforma uma solicitação de mudança em uma spec testável. |
| `myspec-implementar` | Propõe e aprova a árvore de arquivos e então implementa a spec. |
| `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede cobertura e complexidade e registra uma inspeção com veredito. |
| `myspec-corrigir` | Faz um ajuste pequeno de no máximo três arquivos, inclusive dentro de uma spec implementada. |
| `myspec-quantificar` | Mede apenas complexidade e cobertura do código de uma spec. |

Um ciclo típico após a configuração:

```text
prescrever > implementar (árvore) > implementar > inspecionar > implementar > inspecionar > corrigir > inspecionar
```

Repita implementar ou corrigir seguido de inspecionar quantas vezes precisar. Uma spec está concluída, e o trabalho pode avançar para a próxima, quando sua inspeção mais recente estiver `Apta` ou `Apta com ressalvas`; o veredito nunca impede a execução de nenhum skill. Prefira implementar a corrigir quando a mudança exigir mais de três arquivos ou afetar uma spec cuja árvore nunca foi aprovada.

Invoque um skill com `$nome` no Codex ou `/nome` no Claude Code, por exemplo `$myspec-configurar` ou `/myspec-configurar`.

`myspec.json` é mantido pela CLI `myspec`; não o edite manualmente.
