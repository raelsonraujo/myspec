# Inspeção <NNN>: <título da spec>

`<data>` · Base `<commit ou branch>` · Anterior `<inspecao-NNN.md ou Nenhum>`

## Veredito

**<Apta / Apta com ressalvas / Bloqueada>** — <uma frase dizendo se o trabalho pode avançar para a próxima spec.>

## Critérios de aceitação

| Critério | Status | Evidência |
| --- | --- | --- |
| `CA-01` <título curto> | <Atendido / Não atendido / Evidência insuficiente> | `<nome do teste ou arquivo:linha>` |

## Métricas

| Métrica | Atual | Anterior |
| --- | ---: | ---: |
| Critérios de aceitação atendidos | `<atendidos>/<total>` | `<valor ou —>` |
| Testes aprovados | `<aprovados>/<total>` | `<valor ou —>` |
| Cobertura de linhas | `<percentual> (<cobertas>/<total>)` | `<valor ou —>` |
| Cobertura de ramos | `<percentual> (<cobertos>/<total>)` | `<valor ou —>` |
| Maior complexidade ciclomática | `<valor>` (`<membro>`) | `<valor ou —>` |

## Achados

- **A-NNN** · <Bloqueante / Atenção> · <critério ou regra violada, ex.: `praticas-de-codigo/<arquivo>.md`> — <evidência em `arquivo:linha`> — <menor correção>.

## Achados anteriores

| Achado | Status | Evidência |
| --- | --- | --- |
| `A-NNN` | <Resolvido / Aberto / Superado> | `<arquivo:linha, teste ou regra alterada>` |
