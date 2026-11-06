# minhas-specs

Contrato do repositório usado pelos skills Myspec. Toda regra nasce como `Status: Proposto` e só passa a restringir os skills depois que um desenvolvedor a aprova explicitamente (`Status: Aprovado`).

Os documentos do contrato são compartilhados com o time e registram criador e aprovadores a partir do Git. Tudo em `specs/` é registro de trabalho local do desenvolvedor: não traz identidade Git, apenas status e um histórico de revisões datado.

| Caminho | Conteúdo | Criado por |
| --- | --- | --- |
| `metricas/` | Uma métrica de qualidade escolhida pelo desenvolvedor por arquivo, com como medi-la e seus portões | `myspec-configurar` |
| `medicao/` | Scripts e configurações que medem as métricas, com a instalação descrita em seu README; ausente sem template de tooling | `myspec install --tooling` |
| `praticas-de-codigo/` | Uma prática de código do repositório por arquivo | `myspec-configurar` |
| `orientacoes-gerais/` | Uma orientação compartilhada por todos os skills Myspec por arquivo, inclusive os comandos de build e teste | `myspec-configurar` |
| `relatorio-de-qualidade.md` | Valores das métricas aprovadas no projeto inteiro com oportunidades de melhoria | `myspec-quantificar` |
| `specs/NNN-<nome>/` | `spec.md`, `arvore-de-arquivos.md` e `inspecoes/inspecao-NNN.md` de cada mudança | `myspec-prescrever`, `myspec-implementar`, `myspec-inspecionar` |

## Fluxo de trabalho

Os critérios BDD de cada `spec.md` são a fonte única da verdade dos comportamentos mensuráveis específicos da mudança. A prescrição define cada resultado obrigatório específico da mudança em cenário identificado com `Dado / Quando / Então` (`CA-01` etc.); a árvore mapeia esses IDs para locais de produção e verificação, a implementação verifica seus resultados e a inspeção julga os mesmos cenários com evidências. Resumo, escopo e suposições dão contexto e limites, sem criar requisitos comportamentais adicionais.

Práticas de código, orientações gerais e portões de métricas aprovados são exigidos diretamente de seus documentos, sem CA em cada spec. Não repita nem parafraseie práticas ou orientações como critérios, inclusive critérios genéricos de conformidade; referencie a origem somente quando precisar de contexto. Sua ausência nos critérios não é lacuna de contrato, e a inspeção registra violações contra a regra de origem separadamente dos resultados de CAs.

Resolva comportamentos ausentes, ambíguos ou alterados nos critérios antes da implementação afetada. A inspeção relata lacunas de contrato e não pode declarar conclusão enquanto um critério não for atendido ou faltar evidência. A instalação não reescreve specs existentes automaticamente. Cenários BDD podem permanecer em Markdown, com ferramentas e nomes de teste já usados pelo repositório.

Corrigir é a exceção: uma mudança elegível não exige nova spec nem critérios BDD. O limite padrão é de cinco arquivos, incluindo testes; uma orientação geral aplicável do projeto com `Status: Aprovado` em `orientacoes-gerais/` pode substituir esse limite de arquivos. Os demais portões de escopo continuam aplicáveis, e o ajuste deve preservar os critérios de qualquer spec implementada que tocar.

| Skill | Papel |
| --- | --- |
| `myspec-configurar` | Define métricas e seus portões, práticas de código e orientações. |
| `myspec-prescrever` | Transforma uma solicitação de mudança em uma spec testável. |
| `myspec-implementar` | Propõe e aprova a árvore de arquivos e então implementa a spec. |
| `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede as métricas aprovadas e registra uma inspeção com veredito. |
| `myspec-corrigir` | Faz um ajuste pequeno de no máximo cinco arquivos por padrão, com limite substituível por orientação geral aprovada do projeto, inclusive dentro de uma spec implementada. |
| `myspec-quantificar` | Julga as métricas aprovadas do projeto inteiro e sugere melhorias que podem originar novas specs. |

Um ciclo típico após a configuração:

```text
prescrever > implementar (árvore) > implementar > inspecionar > implementar > inspecionar > corrigir > inspecionar
```

Repita implementar ou corrigir seguido de inspecionar quantas vezes precisar. Uma spec está concluída, e o trabalho pode avançar para a próxima, quando sua inspeção mais recente estiver `Apta` ou `Apta com ressalvas`; o veredito nunca impede a execução de nenhum skill. Prefira implementar a corrigir quando a mudança exceder o limite de arquivos aplicável à correção ou afetar uma spec cuja árvore nunca foi aprovada.

Invoque um skill com `$nome` no Codex ou `/nome` no Claude Code, por exemplo `$myspec-configurar` ou `/myspec-configurar`.

`myspec.json` é mantido pela CLI `myspec`; não o edite manualmente.
