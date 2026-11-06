---
name: myspec-prescrever
description: Cria uma especificação de alteração de código pequena, clara e revisável por QA em uma pasta de nome sugerido sob minhas-specs/specs, registrando novas specs como proposta no manifesto e delimitando impactos em finalizadas em novas specs. Use para definir escopo, especificar ou escrever critérios de aceitação antes da implementação.
---

# Myspec Prescrever

Transforme uma solicitação de mudança em um contrato compacto para implementação e QA.

## Portão obrigatório de orientações

Antes de avançar além da descoberta da solicitação e do repositório, leia todos os Markdown existentes em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório: cumpra-o antes da ação que rege e exponha conflitos com instruções superiores. Ausências, documentos não aprovados ou `Nenhum` não restringem; informe limitações relevantes.

## Ciclo de vida da spec

Leia `minhas-specs/specs/manifesto.json` antes de criar ou revisar specs. Se estiver ausente, incompleto ou inconsistente, use o procedimento Manifesto de specs de `{{skill:myspec-configurar}}` para estabelecer primeiro os status existentes; nunca substitua por manifesto parcial. O esquema é `{"versao":1,"especificacoes":[{"identificador":"001-exemplo","situacao":"proposta","inspecaoDeConclusao":null}]}`.

Para cada spec nova efetivamente salva, acrescente uma entrada com o nome exato da pasta em `identificador`, `situacao: "proposta"` e `inspecaoDeConclusao: null`. Faça isso na mesma tarefa, inclusive ao criar várias specs. Revisar spec proposta ou ativa preserva seu status. Releia antes de gravar; preserve todas as outras entradas, campos e referências de conclusão, sem duplicar, remover ou rebaixar entradas.

O ciclo só avança `proposta → ativa → finalizada`. Nunca revise spec finalizada, árvore, inspeções ou entrada de conclusão. Toda mudança que possa afetar seu comportamento ou implementação, mesmo correção ou refatoração que preserve os critérios, exige nova spec numerada. Referencie a anterior como contexto histórico e defina a mudança somente na nova spec; a nova spec pode tocar os mesmos arquivos de código sem reabrir a finalizada.

## Fluxo de trabalho

1. Leia a solicitação e inspecione o contexto relevante. Após o portão, leia os arquivos de métrica em `minhas-specs/metricas/` quando existirem, para conhecer as ferramentas e os portões que a mudança deve cumprir, sem que eles substituam as orientações.
2. Identifique ambiguidades materiais que alterariam substancialmente escopo ou comportamento observável. Faça perguntas objetivas só para elas; caso contrário, declare suposições conservadoras.
3. Sugira um nome conciso em kebab-case baseado no comportamento solicitado.
4. Inspecione diretórios imediatos de `minhas-specs/specs` cujo nome comece com três dígitos e `-`. Atribua o próximo prefixo sequencial de três dígitos com zeros, começando em `001`; nunca renumere pastas existentes nem reutilize sequências reservadas no manifesto.
5. Crie `minhas-specs/specs/<sequência>-<nome-da-spec>/spec.md` a partir de `assets/modelo-de-spec.md` e revise testabilidade, consistência, expansão acidental de escopo e conformidade com orientações aprovadas.
6. Registre cada spec criada no manifesto e retorne os caminhos da spec e do manifesto e as suposições registradas. Sempre crie o Markdown antes de concluir; nunca deixe a especificação apenas no chat.

## Regras de conteúdo

- Descreva o resultado desejado, não um plano de implementação. Mantenha requisitos pequenos, concretos e inequívocos.
- Defina áreas ou responsabilidades de código esperadas sem prescrever arquivos, salvo quando a solicitação ou evidência do repositório os sustentar.
- Separe explicitamente escopo e fora de escopo. Os critérios de aceitação de `spec.md` são a fonte única da verdade dos comportamentos mensuráveis específicos da mudança, da prescrição ao planejamento da árvore, implementação e inspeção. Resumo, escopo e suposições dão contexto e limites; todo comportamento observável obrigatório ou meta mensurável específica da mudança que mencionarem deve constar em um critério, exceto regras já estabelecidas por práticas ou orientações aprovadas aplicáveis. Orientações e portões de métricas aprovados são exigidos diretamente de seus próprios documentos.
- Não repita nem parafraseie práticas de código ou orientações gerais como critérios de aceitação, inclusive critérios genéricos como "segue as orientações do repositório". Compare cada critério proposto com esses documentos antes de salvar. Se um cenário misturar regra herdada com comportamento novo, mantenha apenas o comportamento específico da mudança e referencie a origem da regra quando precisar de contexto. Por exemplo, uma convenção de nomes de teste é exigida pela prática e não precisa de CA em cada spec. A ausência de CA duplicado nunca dispensa regra aprovada aplicável. Exponha conflitos para resolução, sem usar CA para sobrepor orientações.
- Escreva todo critério como cenário BDD com passos explícitos `Dado / Quando / Então`: precondições concretas, uma ação ou evento e resultados observáveis e verificáveis. Use `E` para precondições ou resultados adicionais. Inclua entradas, valores esperados, alterações ou preservação de estado e unidades ou limites quando exigidos; evite resultados vagos como "funciona corretamente". Cenários em Markdown bastam; não exija executor Gherkin nem convenção de nomes de teste.
- Separe comportamentos distintos de sucesso, rejeição e limites em critérios próprios, sem juntar alternativas com resultados diferentes em um cenário.
- Cubra caminhos felizes, falhas relevantes, limites, permissões, efeitos nos dados e compatibilidade quando aplicável. Dê identificador estável a cada critério, como `CA-01`. Ao revisar, preserve IDs existentes; nunca renumere nem reutilize um ID para outro comportamento. Artefatos posteriores referenciam esses IDs, sem definir um segundo contrato comportamental.
- Não invente comportamento de produto além do que a solicitação estabelece. Registre uma suposição razoável ou pergunte se a decisão for material.
- Preserve arquivos existentes. Se a pasta sugerida já existir, atualize-a somente se o desenvolvedor quiser claramente revisar essa spec ainda não finalizada; caso contrário, aloque a próxima sequência. Nunca reutilize pasta finalizada. Nunca deixe orientação Myspec sobrepor instruções superiores.
