# Relatório de qualidade do projeto

## Escopo e base

- Base: `<commit ou branch>`
- Medido em: `<data>`
- Exclusões:
  - `<caminho ou categoria>`: <motivo>

## Verificação

| Comando | Resultado |
| --- | --- |
| `<comando de build ou teste>` | <aprovado, falhou ou parcial> |

## Resumo do projeto

| Métrica | Atual | Anterior | Meta aprovada |
| --- | ---: | ---: | ---: |
| Cobertura de linhas | `<cobertas>/<total> (<percentual>)` | `<valor ou —>` | `<meta ou —>` |
| Cobertura de ramos | `<cobertos>/<total> (<percentual>)` | `<valor ou —>` | `<meta ou —>` |
| Maior complexidade ciclomática | `<valor>` (`<membro>`) | `<valor ou —>` | `<meta ou —>` |
| Métodos acima da meta de complexidade | `<quantidade>` | `<valor ou —>` | — |

## Cobertura de testes

- Ferramenta e versão: `<ferramenta>`

| Projeto, módulo ou arquivo | Cobertura de linhas | Cobertura de ramos | Spec relacionada | Lacunas relevantes |
| --- | ---: | ---: | --- | --- |
| `<nome>` | `<valor>` | `<valor>` | `<NNN-nome ou —>` | `<comportamento crítico não coberto>` |

## Complexidade ciclomática

- Ferramenta e versão: `<ferramenta>`

| Arquivo ou tipo | Método ou função | Complexidade | Spec relacionada | Observação |
| --- | --- | ---: | --- | --- |
| `<nome>` | `<membro>` | `<valor>` | `<NNN-nome ou —>` | `<meta não atingida ou motivo para atenção>` |

## Oportunidades de melhoria

| Prioridade | Oportunidade | Código afetado | Spec relacionada | Efeito esperado | Próximo skill |
| ---: | --- | --- | --- | --- | --- |
| 1 | <melhoria baseada em evidência> | `<caminho ou membro>` | `<NNN-nome ou —>` | <efeito esperado nas métricas> | `{{skill:myspec-prescrever}}` ou `{{skill:myspec-corrigir}}` |

## Limitações

- <Limitação de ferramenta ou escopo, ou `None`.>
