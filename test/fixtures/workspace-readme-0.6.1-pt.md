# minhas-specs

Contrato do repositório usado pelos skills Myspec. Documentos de métricas, práticas e orientações nascem como `Status: Proposto` e só passam a restringir os skills depois que um desenvolvedor os aprova explicitamente (`Status: Aprovado`).

Os documentos do contrato são compartilhados com o time e registram criador e aprovadores a partir do Git. Tudo em `specs/` é registro de trabalho local do desenvolvedor: não traz identidade Git, apenas status e um histórico de revisões datado.

| Caminho | Conteúdo | Criado por |
| --- | --- | --- |
| `metricas/` | Uma métrica de qualidade escolhida pelo desenvolvedor por arquivo, com como medi-la e seus portões | `myspec-configurar` |
| `medicao/` | Scripts e configurações que medem as métricas, com a instalação descrita em seu README; ausente sem template de tooling | `myspec install --tooling` |
| `praticas-de-codigo/` | Uma prática de código do repositório por arquivo | `myspec-configurar` |
| `orientacoes-gerais/` | Uma orientação compartilhada por todos os skills Myspec por arquivo, inclusive os comandos de build e teste | `myspec-configurar` |
| `relatorio-de-qualidade.md` | Valores das métricas aprovadas no projeto inteiro com oportunidades de melhoria | `myspec-quantificar` |
| `relatorio-de-conformidade.md` | Avaliação geral de práticas e orientações aprovadas, com evidências, violações e lacunas de revisão | `myspec-auditar` |
| `specs/manifesto.json` | Ciclo de vida das specs e referências às inspeções finais | `myspec-configurar`, `myspec-prescrever`, `myspec-implementar`, `myspec-inspecionar` |
| `specs/NNN-<nome>/` | `spec.md`, `arvore-de-arquivos.md` e `inspecoes/inspecao-NNN.md` de cada mudança | `myspec-prescrever`, `myspec-implementar`, `myspec-inspecionar` |

## Fluxo de trabalho

`specs/manifesto.json` rastreia cada spec pelo nome exato da pasta. A configuração o constrói a partir de evidências de implementação e inspeção existentes quando ausente. O ciclo só avança `proposta → ativa → finalizada`: prescrever acrescenta novas specs como `proposta`; implementar muda para `ativa` imediatamente antes de editar a implementação, após aprovação da árvore; inspecionar registra inspeção `Apta` ou `Apta com ressalvas`, apresenta os achados e pergunta se o desenvolvedor deseja finalizar. A spec permanece `ativa` até confirmação explícita; só então inspecionar altera a entrada no manifesto para `finalizada` e registra a inspeção de conclusão. A mudança de situação registra a confirmação, sem criar artefato separado. Planejar ou aprovar árvore não inicia implementação. Inspeção bloqueada mantém a spec ativa. Chaves JSON e valores de situação são escritos em português brasileiro.

```json
{
  "versao": 1,
  "especificacoes": [
    { "identificador": "001-exemplo", "situacao": "finalizada", "inspecaoDeConclusao": "002" },
    { "identificador": "002-continuacao", "situacao": "proposta", "inspecaoDeConclusao": null }
  ]
}
```

`inspecaoDeConclusao` identifica a sequência de três dígitos da inspeção final na pasta `inspecoes/` dessa spec; entradas ainda não finalizadas usam `null`. Specs finalizadas, árvores, inspeções e entradas de conclusão permanecem imutáveis. Toda mudança posterior que possa afetar seu comportamento ou implementação, inclusive correções e refatorações que preservem critérios, exige nova spec. A nova spec pode alterar os mesmos arquivos de código e descrever o comportamento posterior, mantendo a finalizada como histórico. Status nunca retrocede.

Os critérios BDD de cada `spec.md` são a fonte única da verdade dos comportamentos mensuráveis específicos da mudança. A prescrição define cada resultado obrigatório específico da mudança em cenário identificado com `Dado / Quando / Então` (`CA-01` etc.); a árvore mapeia esses IDs para locais de produção e verificação, a implementação verifica seus resultados e a inspeção julga os mesmos cenários com evidências. Resumo, escopo e suposições dão contexto e limites, sem criar requisitos comportamentais adicionais.

Specs propostas e ativas descrevem somente a unidade de trabalho que exigem, no estado atual. Criar ou revisar uma spec remove contexto, escopo e critérios obsoletos e reescreve o que continua válido como requisito direto, sem comparações com revisões anteriores no corpo. Quando o contexto anterior importar, por exemplo quando uma spec altera comportamento entregue por outra, ele fica somente em uma seção opcional `## Histórico de revisões` no fim da spec, ou na seção equivalente que o projeto já usa, com o que mudou e por quê. Implementação e inspeção tratam essa seção como contexto, nunca como requisito. Specs finalizadas permanecem congeladas.

Práticas de código, orientações gerais e portões de métricas aprovados são exigidos diretamente de seus documentos, sem CA em cada spec. Não repita nem parafraseie práticas ou orientações como critérios, inclusive critérios genéricos de conformidade; referencie a origem somente quando precisar de contexto. Sua ausência nos critérios não é lacuna de contrato, e a inspeção registra violações contra a regra de origem separadamente dos resultados de CAs.

Resolva comportamentos ausentes, ambíguos ou alterados nos critérios antes da implementação afetada. A inspeção relata lacunas de contrato e não pode declarar conclusão enquanto um critério não for atendido ou faltar evidência. A instalação não reescreve specs existentes automaticamente. Cenários BDD podem permanecer em Markdown, com ferramentas e nomes de teste já usados pelo repositório.

Corrigir é a exceção para trabalho ainda não finalizado ou mudanças que não possam afetar spec finalizada: uma mudança elegível não exige nova spec nem critérios BDD. O limite padrão é de cinco arquivos, incluindo testes; uma orientação geral aplicável do projeto com `Status: Aprovado` em `orientacoes-gerais/` pode substituir esse limite de arquivos. Os demais portões de escopo continuam aplicáveis, e o ajuste deve preservar os critérios de qualquer spec implementada que tocar.

| Skill | Papel |
| --- | --- |
| `myspec-configurar` | Constrói o manifesto de specs e define métricas e seus portões, práticas de código e orientações. |
| `myspec-prescrever` | Transforma uma solicitação de mudança em uma spec testável e registra como proposta. |
| `myspec-implementar` | Propõe e aprova a árvore de arquivos e então ativa e implementa a spec. |
| `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede as métricas aprovadas e registra uma inspeção com veredito e finaliza somente após confirmação explícita do desenvolvedor. |
| `myspec-corrigir` | Faz um ajuste pequeno de no máximo cinco arquivos por padrão, com limite substituível por orientação geral aprovada do projeto, inclusive dentro de uma spec ativa; impactos em specs finalizadas exigem nova spec. |
| `myspec-quantificar` | Julga as métricas aprovadas do projeto inteiro e sugere melhorias que podem originar novas specs. |
| `myspec-auditar` | Varre a conformidade do projeto inteiro com práticas e orientações aprovadas, registra evidências e lacunas e prioriza próximos passos. |

Use auditar para aderência geral às regras, quantificar para medição de métricas e inspecionar para aceitação de uma spec. Auditar não exige métricas nem specs e escreve somente `relatorio-de-conformidade.md`. Respeita escopo e exceções de cada regra, distingue violações de evidência ausente, explicita revisão parcial e reexamina achados anteriores. Não corrige código nem altera situações do ciclo de vida das specs.

Um ciclo típico após a configuração:

```text
prescrever > implementar (árvore) > implementar > inspecionar (bloqueada) > implementar/corrigir > inspecionar (apta) > desenvolvedor confirma > finalizada > prescrever (próxima spec)
```

Repita implementar ou corrigir seguido de inspecionar quantas vezes precisar. Uma spec está concluída, e o trabalho pode avançar para a próxima, quando sua inspeção mais recente estiver `Apta` ou `Apta com ressalvas` e o desenvolvedor confirmar explicitamente a finalização após revisá-la; somente então inspecionar registra `finalizada` no manifesto, e trabalho posterior segue por nova spec. Prefira implementar a corrigir quando a mudança exceder o limite de arquivos aplicável à correção ou afetar uma spec cuja árvore nunca foi aprovada.

Invoque um skill com `$nome` no Codex ou `/nome` no Claude Code, por exemplo `$myspec-configurar` ou `/myspec-configurar`.

`specs/manifesto.json` é mantido pelos skills; configurar o inicializa sem reiniciar status existentes. `myspec.json` é mantido pela CLI `myspec`; não o edite manualmente.
