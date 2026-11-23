---
name: myspec-prescrever
description: Cria uma especificação de alteração de código pequena, clara e revisável por QA em uma pasta de nome sugerido sob minhas-specs/specs, registrando novas specs como proposta no manifesto e delimitando impactos em finalizadas em novas specs. Use para definir escopo, especificar ou escrever critérios de aceitação antes da implementação.
---

# Myspec Prescrever

Transforme uma solicitação de mudança em um contrato enxuto e testável para implementação e QA.

## Portões de orientações e ciclo de vida

1. Leia todo arquivo Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Trate documentos aplicáveis com `Status: Aprovado` como obrigatórios; exponha conflitos com instruções de maior prioridade.
2. Leia `minhas-specs/specs/manifesto.json` antes de criar ou revisar specs. Se estiver ausente ou inconsistente, reconcilie via `{{skill:myspec-configurar}}` primeiro.
3. Nunca revise uma spec `finalizada`, sua árvore, inspeções ou entrada de conclusão. Qualquer mudança que possa impactar uma spec finalizada — inclusive correção ou refatoração que preserve critérios — exige nova spec numerada.
4. Para cada spec criada, acrescente `{"identificador":"<pasta>","situacao":"proposta","inspecaoDeConclusao":null}` ao `manifesto.json` na mesma tarefa (relendo antes de gravar e preservando demais entradas e campos). Revisar spec `proposta` ou `ativa` preserva sua situação.

## Specs no estado atual

Escreva toda spec `proposta` ou `ativa` como descrição autônoma e no estado atual do trabalho exigido:
- Descreva apenas o comportamento exigido agora. Ao revisar, remova contexto, escopo, suposições e critérios obsoletos e não deixe comparações ("antes", "agora", "em vez de", "passou a") no corpo.
- Preserve os IDs de CA ao revisar: reescreva CAs mantidos no estado atual e remova os descartados sem renumerar ou reutilizar seus IDs.
- Registre contexto de revisões anteriores ou de outra spec alterada por esta apenas em uma seção opcional final `## Histórico de revisões` (data, o que mudou, motivo concreto e nome da pasta). Omita quando desnecessária; o corpo deve se sustentar sem ela.
- Specs finalizadas ficam congeladas e nunca são reescritas.

## Fluxo

1. Leia a solicitação, o contexto relevante do repositório, as orientações aprovadas e `minhas-specs/metricas/` (quando existir) para conhecer os portões aplicáveis.
2. Faça perguntas objetivas somente para ambiguidades relevantes que alterem escopo ou comportamento observável; nos demais casos, registre suposições conservadoras.
3. Sugira um nome curto em kebab-case e atribua o próximo prefixo de três dígitos (`001`, `002`, ...) não usado por nenhuma pasta em `minhas-specs/specs/` nem entrada em `manifesto.json`.
4. Salve `minhas-specs/specs/<NNN>-<nome>/spec.md` com [assets/modelo-de-spec.md](assets/modelo-de-spec.md). Nunca deixe a spec apenas no chat.
5. Revise testabilidade, consistência interna, redação no estado atual e ausência de duplicação de práticas ou orientações.
6. Registre a spec no `manifesto.json` e retorne ambos os caminhos e as suposições registradas.

## Regras dos critérios de aceitação

- Os critérios de aceitação em `spec.md` são a fonte única da verdade dos comportamentos observáveis específicos da mudança. Todo resultado obrigatório mencionado em Resumo ou Escopo deve constar em um CA.
- Escreva cada critério como cenário BDD com ID estável (`CA-01`, `CA-02`, ...), precondições concretas `Dado`, uma ação/evento `Quando` e resultados verificáveis `Então` (e `E`) com entradas, valores esperados, efeitos de estado ou limites/unidades. Evite frases vagas ("funciona corretamente"). Não exige executor Gherkin nem convenção de nome de teste.
- Separe caminhos distintos de sucesso, rejeição, permissão, fronteira e integridade de dados em critérios distintos.
- Não repita nem parafraseie práticas de código, orientações gerais ou portões de métricas como CAs (inclusive critérios genéricos de conformidade); eles são exigidos diretamente de seus documentos. Referencie uma regra apenas quando precisar de contexto.
- Descreva resultados, não planos de implementação; não invente comportamento além da solicitação.
