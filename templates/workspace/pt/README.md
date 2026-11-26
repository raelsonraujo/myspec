# minhas-specs

Contrato do repositório usado pelos skills Myspec. Documentos de métricas, práticas e orientações nascem como `Status: Proposto` e só passam a restringir os skills depois que um desenvolvedor os aprova explicitamente (`Status: Aprovado`).

Os documentos do contrato são compartilhados com o time e registram criador e aprovadores a partir do Git. Tudo em `specs/` é registro de trabalho local do desenvolvedor: não traz identidade Git, apenas status e um histórico de revisões datado.

| Caminho | Conteúdo | Criado por |
| --- | --- | --- |
| `metricas/` | Uma métrica de qualidade escolhida pelo desenvolvedor por arquivo, com como medi-la e seus portões | `myspec-configurar` |
| `medicao/` | Scripts e configurações que medem as métricas, com a instalação descrita em seu README; ausente sem template de tooling | `myspec install --tooling` |
| `praticas-de-codigo/` | Uma prática de código do repositório por arquivo | `myspec-configurar` |
| `orientacoes-gerais/` | Uma orientação compartilhada por todos os skills Myspec por arquivo, inclusive os comandos de build e teste | `myspec-configurar` |
| `relatorios/relatorio-de-qualidade.md` | Valores das métricas aprovadas no projeto inteiro com oportunidades de melhoria. A pasta `relatorios/` tem o próprio `.gitignore` e fica fora do controle de versão | `myspec-quantificar` |
| `relatorios/relatorio-de-conformidade.md` | Avaliação geral de práticas e orientações aprovadas, com evidências, violações e lacunas de revisão | `myspec-auditar` |
| `specs/manifesto.json` | Ciclo de vida das specs e referências às inspeções finais | `myspec-configurar`, `myspec-prescrever`, `myspec-implementar`, `myspec-inspecionar` |
| `specs/NNN-<nome>/` | `spec.md`, `arvore-de-arquivos.md` e `inspecoes/inspecao-NNN.md` de cada mudança | `myspec-prescrever`, `myspec-implementar`, `myspec-inspecionar` |

## Fluxo de trabalho

`specs/manifesto.json` rastreia cada spec pelo nome exato da pasta. A configuração o constrói a partir de evidências de implementação e inspeção existentes quando ausente. O ciclo só avança `proposta → ativa → finalizada`: prescrever acrescenta novas specs como `proposta`; implementar cria o plano `arvore-de-arquivos.md` no estado atual (parando por padrão para conferência do desenvolvedor, ou prosseguindo automaticamente quando pedido explicitamente pelo desenvolvedor ou autorizado por orientação geral aprovada) e ativa a spec (`myspec <id> activate`, registrando `commitBase`) imediatamente antes de editar código/testes; inspecionar executa portões determinísticos via `myspec <id> gate` (preferencialmente em contexto limpo), registra uma inspeção `Apta` ou `Apta com ressalvas` com o commit inspecionado e apresenta os achados para o desenvolvedor finalizar via `myspec <id> finish` ou confirmação explícita. Só então a entrada passa a `finalizada` com sua `inspecaoDeConclusao`. Inspeção bloqueada mantém a spec ativa. Uma spec `proposta` que o desenvolvedor decide não implementar passa a `descartada`, situação final com `inspecaoDeConclusao: null`; a pasta continua como registro. Chaves JSON e valores de situação são escritos em português brasileiro.

```json
{
  "versao": 1,
  "especificacoes": [
    { "identificador": "001-exemplo", "situacao": "finalizada", "inspecaoDeConclusao": "002", "commitBase": "a1b2c3d" },
    { "identificador": "002-continuacao", "situacao": "proposta", "inspecaoDeConclusao": null }
  ]
}
```

`inspecaoDeConclusao` identifica a sequência de três dígitos da inspeção final na pasta `inspecoes/` dessa spec; entradas ainda não finalizadas usam `null`. Specs finalizadas, árvores, inspeções e entradas de conclusão permanecem imutáveis. Toda mudança posterior que possa afetar seu comportamento ou implementação, inclusive correções e refatorações que preservem critérios, exige nova spec. A nova spec pode alterar os mesmos arquivos de código e descrever o comportamento posterior, mantendo a finalizada como histórico. Specs descartadas também permanecem imutáveis; retomar o assunto exige nova spec. Status nunca retrocede.

Os critérios BDD de cada `spec.md` são a fonte única da verdade dos comportamentos mensuráveis específicos da mudança. A prescrição define cada resultado obrigatório específico da mudança em cenário identificado com `Dado / Quando / Então` (`CA-01` etc.); a árvore mapeia esses IDs para locais de produção e verificação, a implementação verifica seus resultados e a inspeção julga os mesmos cenários com evidências. Resumo, escopo e suposições dão contexto e limites, sem criar requisitos comportamentais adicionais.

Specs propostas e ativas descrevem somente a unidade de trabalho que exigem, no estado atual. Criar ou revisar uma spec remove contexto, escopo e critérios obsoletos e reescreve o que continua válido como requisito direto, sem comparações com revisões anteriores no corpo. Quando o contexto anterior importar, por exemplo quando uma spec altera comportamento entregue por outra, ele fica somente em uma seção opcional `## Histórico de revisões` no fim da spec, ou na seção equivalente que o projeto já usa, com o que mudou e por quê. Implementação e inspeção tratam essa seção como contexto, nunca como requisito. Specs finalizadas permanecem congeladas.

Práticas de código, orientações gerais e portões de métricas aprovados são exigidos diretamente de seus documentos, sem CA em cada spec. Não repita nem parafraseie práticas ou orientações como critérios, inclusive critérios genéricos de conformidade; referencie a origem somente quando precisar de contexto. Sua ausência nos critérios não é lacuna de contrato, e a inspeção registra violações contra a regra de origem separadamente dos resultados de CAs.

Resolva comportamentos ausentes, ambíguos ou alterados nos critérios antes da implementação afetada. A inspeção relata lacunas de contrato e não pode declarar conclusão enquanto um critério não for atendido ou faltar evidência. A instalação não reescreve specs existentes automaticamente. Cenários BDD podem permanecer em Markdown, com ferramentas e nomes de teste já usados pelo repositório.

Corrigir é a exceção para trabalho ainda não finalizado ou mudanças que não possam afetar spec finalizada: uma mudança elegível não exige nova spec nem critérios BDD. O limite padrão é de cinco arquivos, incluindo testes; uma orientação geral aplicável do projeto com `Status: Aprovado` em `orientacoes-gerais/` pode substituir esse limite de arquivos. Os demais portões de escopo continuam aplicáveis, e o ajuste deve preservar os critérios de qualquer spec implementada que tocar.

| Skill | Papel |
| --- | --- |
| `myspec-configurar` | Constrói o manifesto de specs e define métricas e seus portões, práticas de código e orientações. |
| `myspec-prescrever` | Transforma uma solicitação de mudança em uma spec testável e registra como proposta. |
| `myspec-implementar` | Cria o plano `arvore-de-arquivos.md` no estado atual (conferência por padrão; automático sob pedido ou orientação aprovada), ativa e implementa a spec. |
| `myspec-inspecionar` | Revisa a implementação (preferencialmente em contexto limpo) contra a spec, regras aprovadas e `myspec gate`, registrando a inspeção para finalização via `myspec finish`. |
| `myspec-corrigir` | Faz um ajuste pequeno de no máximo cinco arquivos por padrão (verificado com `myspec check-patch`), substituível por orientação geral aprovada; impactos em finalizadas exigem nova spec. |
| `myspec-quantificar` | Executa `myspec gate --project` para julgar métricas aprovadas do projeto inteiro e sugerir melhorias que podem originar novas specs. |
| `myspec-auditar` | Varre a conformidade do projeto inteiro com práticas e orientações aprovadas, registra evidências e lacunas e prioriza próximos passos. |

Use auditar para aderência geral às regras, quantificar para medição de métricas e inspecionar para aceitação de uma spec. Auditar não exige métricas nem specs e escreve somente `relatorios/relatorio-de-conformidade.md`. Respeita escopo e exceções de cada regra, distingue violações de evidência ausente, explicita revisão parcial e reexamina achados anteriores. Não corrige código nem altera situações do ciclo de vida das specs.

Um ciclo típico após a configuração:

```text
prescrever > implementar (conferência da árvore ou automático opcional) > implementar > inspecionar (`myspec gate`) > `myspec finish` > prescrever (próxima spec)
```

Repita implementar ou corrigir seguido de inspecionar quantas vezes precisar. Prefira implementar a corrigir quando a mudança exceder o limite de arquivos aplicável ou afetar spec `proposta` ou sem `arvore-de-arquivos.md`.

- `myspec aprovar <caminho>` aprova documentos do contrato com identidade Git. `myspec <id> ativar` ativa a spec e registra `commitBase`.
- `myspec [<id>] portao [--project]` executa builds, testes, verificações estruturadas de métricas e verificação de desvio da árvore. `myspec <id> finalizar` valida a última inspeção apta e a base Git antes de finalizar. `myspec conferir-correcao` valida a elegibilidade de correções.
- `myspec listar` imprime todas as specs em ordem numérica, no formato `NNN - título [status]`. Specs que ainda não constam no manifesto aparecem como `sem registro`. Use `--filter` ou `-f` com os status separados por vírgula, como em `myspec listar -f ativa,finalizada`.
- `myspec <id> criterio [<N>]` lista os critérios ou mostra um deles por completo. `myspec <id> ler` imprime o `spec.md`, a seção de smoke com `-s` ou a árvore de arquivos com `-ft`.
- `myspec <id> inspecao` imprime a inspeção mais recente, o veredito com `-s` ou os achados atuais com `-f`.
- `myspec regra` e `myspec metrica` listam documentos do contrato, imprimem o documento indicado pelo nome ou imprimem todos da categoria com `-f`.

`ler`, `inspecao`, `regra` e `metrica` omitem as seções de histórico por padrão. Use `-h` ou `--historico` para imprimir apenas o histórico, como `Histórico de revisões` em specs, `Histórico de aprovação` em documentos do contrato e `Achados anteriores` em inspeções. Use `myspec <id> ler -ft -h` para consultar o histórico da árvore de arquivos, quando existir, e `--help` para ver a ajuda.

Invoque um skill com `$nome` no Codex ou `/nome` no Claude Code e no Gemini (Antigravity / Gemini CLI), por exemplo `$myspec-configurar` ou `/myspec-configurar`.

`specs/manifesto.json` é mantido pelos skills; configurar o inicializa sem reiniciar status existentes. `myspec.json` é mantido pela CLI `myspec`; não o edite manualmente.
