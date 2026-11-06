# Inspeção <NNN>: <título da spec>

`<data>` · Base `<commit ou branch>` · Anterior `<inspecao-NNN.md ou Nenhum>`

## Veredito

**<Apta / Apta com ressalvas / Bloqueada>** — <uma frase dizendo se a finalização pode ser proposta; veredito apto ainda exige confirmação explícita do desenvolvedor.>

## Critérios de aceitação

| Critério | Status | Evidência |
| --- | --- | --- |
| `CA-01` <título curto> | <Atendido / Não atendido / Evidência insuficiente> | <referência de teste ou verificação e resultado de cada Então/E nas condições Dado/Quando; evidência exata que falta se parcial> |

## Métricas

| Métrica | Atual | Anterior | Portão |
| --- | ---: | ---: | --- |
| Critérios de aceitação atendidos | `<atendidos>/<total>` | `<valor ou —>` | — |
| Testes aprovados | `<aprovados>/<total>` | `<valor ou —>` | — |
| <métrica e valor registrado do seu arquivo de métrica> | `<valor>` | `<valor ou —>` | `<limite e efeito, ou —>` |

## Achados

- **A-NNN** · <Bloqueante / Atenção> · <critério ou regra violada, ex.: `praticas-de-codigo/<arquivo>.md`> — <evidência em `arquivo:linha`> — <menor correção>.

## Achados anteriores

| Achado | Status | Evidência |
| --- | --- | --- |
| `A-NNN` | <Resolvido / Aberto / Superado> | `<arquivo:linha, teste ou regra alterada>` |
