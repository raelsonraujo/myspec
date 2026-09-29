# Relatório de qualidade da implementação

## Escopo e base

- Spec: `<caminho>`
- Base: `<commit, branch, diff ou árvore de arquivos aprovada>`
- Arquivos de produção medidos:
  - `<caminho>`
- Exclusões:
  - `<caminho ou categoria>`: <motivo>

## Verificação

| Comando | Resultado |
| --- | --- |
| `<comando de build ou teste>` | <aprovado, falhou ou parcial> |

## Cobertura de testes

- Ferramenta e versão: `<ferramenta>`
- Cobertura de linhas: `<cobertas>/<total> (<percentual>)`
- Cobertura de ramos: `<cobertos>/<total> (<percentual>)`

| Arquivo ou tipo | Cobertura de linhas | Cobertura de ramos | Lacunas relevantes |
| --- | ---: | ---: | --- |
| `<nome>` | `<valor>` | `<valor>` | `<comportamento crítico não coberto>` |

## Complexidade ciclomática

- Ferramenta e versão: `<ferramenta>`

| Arquivo ou tipo | Método ou função | Complexidade | Observação |
| --- | --- | ---: | --- |
| `<nome>` | `<membro>` | `<valor>` | `<motivo para atenção, se houver>` |

## Evidência dos critérios de aceitação

| Critério | Evidência de teste ou verificação | Lacuna de cobertura |
| --- | --- | --- |
| `AC-01` | `<nome do teste ou comando>` | `<nenhuma ou lacuna>` |

## Sugestões de melhoria

1. <Melhoria priorizada e baseada em evidência, com o efeito métrico esperado.>

## Limitações

- <Limitação de ferramenta ou escopo, ou `None`.>
