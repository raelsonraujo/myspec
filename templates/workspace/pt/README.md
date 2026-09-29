# my-specs

Contrato do repositório usado pelos skills Myspec. Toda regra nasce como `Status: Proposed` e só passa a restringir os skills depois que um desenvolvedor a aprova explicitamente (`Status: Approved`).

| Caminho | Conteúdo | Criado por |
| --- | --- | --- |
| `tooling.md` | Comandos aprovados de complexidade ciclomática e cobertura de testes | `myspec-configurar` |
| `product-directives/` | Conceitos, terminologia e invariantes de produto | `myspec-configurar` |
| `coding-practices/` | Uma prática de código do repositório por arquivo | `myspec-configurar` |
| `general-guidelines/` | Uma orientação compartilhada por todos os skills Myspec por arquivo | `myspec-configurar` |
| `specs/NNN-<nome>/` | `spec.md`, `file-tree.md` e `quality-report.md` de cada mudança | `myspec-prescrever`, `myspec-implementar`, `myspec-quantificar` |

## Fluxo de trabalho

1. `myspec-configurar` — define ferramentas, diretrizes de produto, práticas de código e orientações.
2. `myspec-prescrever` — transforma uma solicitação de mudança em uma spec testável.
3. `myspec-implementar` — propõe e aprova a árvore de arquivos e então implementa a spec.
4. `myspec-inspecionar` — revisa a implementação contra a spec e as regras aprovadas.
5. `myspec-quantificar` — mede complexidade e cobertura com as ferramentas aprovadas.
6. `myspec-corrigir` — faz um ajuste pequeno e delimitado que não justifica uma spec.

Invoque um skill com `$nome` no Codex ou `/nome` no Claude Code, por exemplo `$myspec-configurar` ou `/myspec-configurar`.

`myspec.json` é mantido pela CLI `myspec`; não o edite manualmente.
