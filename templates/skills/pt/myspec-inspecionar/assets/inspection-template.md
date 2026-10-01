# Inspeção da implementação <NNN>

- Spec: `<my-specs/specs/NNN-nome/spec.md>`
- Inspecionado por: `<git user.name> <git user.email>`
- Inspecionado em: `<data>`
- Base: `<commit, branch ou diff inspecionado>`
- Inspeção anterior: `<inspections/inspection-NNN.md>` ou `None`

## Veredito

**<Apta / Apta com ressalvas / Bloqueada>** — <uma frase dizendo se a spec pode ser concluída e o trabalho pode avançar para a próxima spec, e por quê.>

## Resumo das métricas

| Métrica | Valor | Anterior |
| --- | ---: | ---: |
| Critérios de aceitação atendidos | `<atendidos>/<total>` | `<valor ou —>` |
| Itens da base atendidos | `<atendidos>/<avaliados>` | `<valor ou —>` |
| Não atendidos | `<quantidade>` | `<valor ou —>` |
| Evidência insuficiente | `<quantidade>` | `<valor ou —>` |
| Conflitos de base | `<quantidade>` | `<valor ou —>` |
| Achados resolvidos desde a anterior | `<quantidade>` | — |
| Achados ainda abertos | `<quantidade>` | — |
| Achados novos | `<quantidade>` | — |
| Verificação | `<aprovada / falhou / não executada>` (`<aprovados>/<total>` testes) | `<valor ou —>` |
| Cobertura de linhas | `<cobertas>/<total> (<percentual>)` ou `Não medida` | `<valor ou —>` |
| Cobertura de ramos | `<cobertos>/<total> (<percentual>)` ou `Não medida` | `<valor ou —>` |
| Maior complexidade ciclomática | `<valor>` em `<membro>` ou `Não medida` | `<valor ou —>` |
| `<métrica adicional do contrato de ferramentas>` | `<valor>` | `<valor ou —>` |

<Duas a quatro frases interpretando as métricas: o que mostram sobre o progresso da implementação, o que mudou desde a inspeção anterior e como fundamentam o veredito.>

## Obrigatório antes de avançar

1. `<F-NNN>`: <item bloqueante e a menor mudança que o resolve.>

Escreva `None` quando o veredito não for `Bloqueada`.

## Acompanhamento dos achados anteriores

| Achado | Status anterior | Status atual | Evidência |
| --- | --- | --- | --- |
| `F-001` | `<Não atendido / Evidência insuficiente / Conflito de base>` | `<Resolvido / Aberto / Superado>` | `<arquivo, teste, diff ou saída>` |

Escreva `None — primeira inspeção.` quando não houver inspeção anterior.

## Verificação

| Comando | Resultado |
| --- | --- |
| `<comando aprovado de build, teste, cobertura ou complexidade>` | `<aprovado, falhou, parcial ou não executado: motivo>` |

- Arquivos de produção medidos:
  - `<caminho>`
- Exclusões:
  - `<caminho ou categoria>`: <motivo>

## Cobertura de testes

- Ferramenta e versão: `<ferramenta>`

| Arquivo ou tipo | Cobertura de linhas | Cobertura de ramos | Lacunas relevantes |
| --- | ---: | ---: | --- |
| `<nome>` | `<valor>` | `<valor>` | `<comportamento crítico não coberto>` |

## Complexidade ciclomática

- Ferramenta e versão: `<ferramenta>`

| Arquivo ou tipo | Método ou função | Complexidade | Observação |
| --- | --- | ---: | --- |
| `<nome>` | `<membro>` | `<valor>` | `<meta aprovada não atingida, ponto de simplificação ou —>` |

Escreva `Não medida: <motivo>` na seção de uma métrica que não pôde ser medida.

## Rastreabilidade

| Item da base | Evidência | Status | Achado |
| --- | --- | --- | --- |
| `<AC-01, responsabilidade da árvore, diretriz ou regra>` | `<arquivo, teste, diff ou saída>` | `<Atendido / Não atendido / Evidência insuficiente / Não aplicável / Conflito de base>` | `<F-NNN ou —>` |

## Achados

### F-NNN: <título curto>

- Origem: `<Novo / Mantido da inspection-NNN / Regressão>`
- Bloqueante: `<Sim / Não>`
- Item da base: <requisito exato, responsabilidade da árvore, diretriz de produto ou regra de orientação>
- Evidência: <caminho e local do arquivo, teste, diff ou saída>
- Avaliação: <por que a evidência atende ou não o item; separe fatos observados de inferências>
- Correção sugerida: <menor mudança delimitada>

Escreva `None` quando não houver achado aberto.

## Não avaliado

- <Item que não pôde ser avaliado e a evidência necessária, ou `None`.>

## Limitações

- <Documentos ausentes ou não aprovados, ferramenta indisponível, métricas desatualizadas ou outros limites de escopo, ou `None`.>
