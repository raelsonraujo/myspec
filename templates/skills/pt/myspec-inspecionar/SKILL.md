---
name: myspec-inspecionar
description: Revisa a implementação de uma especificação em minhas-specs/specs quanto aos requisitos explícitos, árvore aprovada e orientações Myspec aprovadas, mede as métricas definidas pelos arquivos de métrica aprovados em minhas-specs/metricas, julga-as frente a seus portões e registra uma inspeção enxuta na pasta inspecoes da spec que acompanha a anterior e recomenda se a spec pode ser finalizada e só marca finalizada no manifesto após confirmação explícita do desenvolvedor sobre a inspeção apresentada, preservando specs já finalizadas. Use para auditar, validar ou verificar o progresso e a conclusão de uma spec sem ampliar seu escopo.
---

# Myspec Inspecionar

Revise e meça uma implementação sem ampliar seu contrato e registre cada execução sobre spec ativa como uma nova inspeção, de modo que a mais recente fundamente a decisão de finalização pelo desenvolvedor. Um ciclo típico repete implementar ou corrigir seguido de inspecionar até obter os resultados desejados. Relate apenas lacunas rastreáveis a requisito explícito, responsabilidade da árvore aprovada ou regra Myspec aprovada.

## Portão obrigatório de orientações

Antes de avançar da descoberta somente-leitura, leia todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Documentos aplicáveis com `Status: Aprovado` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `Nenhum` não criam critério e devem ser relatados quando relevantes.

## Portão do ciclo de vida

Leia `minhas-specs/specs/manifesto.json` antes da inspeção. Se ele ou a entrada da spec estiver ausente ou inconsistente, use primeiro o procedimento Manifesto de specs de `{{skill:myspec-configurar}}`. Inspecione spec `ativa` para conclusão; spec `proposta` ainda não começou a implementação e não pode ser finalizada. Se houver evidência de implementação iniciada, reconcilie primeiro o status pela configuração.

Para spec já `finalizada`, retorne inspeção de conclusão e status registrados, sem criar outra inspeção nem alterar artefato histórico. Defeito, regressão ou mudança posteriores devem ser delimitados em nova spec por `{{skill:myspec-prescrever}}`; nunca reabra nem rebaixe a finalizada. O veredito de conclusão descreve sua base histórica, não todo código futuro.

Para spec ativa, salve e apresente primeiro a inspeção. Todo veredito mantém `ativa` com `inspecaoDeConclusao: null` até o desenvolvedor confirmar explicitamente a finalização conforme [Finalização pelo desenvolvedor](#finalização-pelo-desenvolvedor). `Apta` e `Apta com ressalvas` permitem propor finalização; nunca a autorizam. `Bloqueada` não pode ser finalizada. Falhas ou ausência de evidência nunca revertem status. Retorne caminho do manifesto e situação real junto do resultado da inspeção.

## Finalização pelo desenvolvedor

1. Após salvar inspeção `Apta` ou `Apta com ressalvas`, apresente caminho, veredito e ressalvas. Pergunte explicitamente se o desenvolvedor deseja finalizar essa spec nomeada com base nessa inspeção, explicando que ela se tornará uma base histórica imutável. Aguarde a resposta. Silêncio, verificações passando, aprovação da árvore, aprovação da implementação, pedido de inspeção e permissão condicional dada antes de conhecer a inspeção não são confirmação. Proposta recusada ou sem resposta mantém a spec ativa e a referência de conclusão nula.
2. Em continuação somente para confirmar, leia a inspeção de maior número e verifique que é a revisada pelo desenvolvedor, ainda permite finalização e ainda representa a base relevante de spec, árvore, implementação, testes, orientações e métricas. Se houve mudança relevante ou inspeção posterior a superou, inspecione a nova base e peça confirmação após apresentar esse resultado. Não crie outra inspeção apenas para registrar confirmação quando a base revisada estiver inalterada.
3. Somente após confirmação explícita, releia o manifesto e altere somente essa entrada ativa para `finalizada`, com a sequência de três dígitos da inspeção revisada em `inspecaoDeConclusao` (por exemplo, `"003"`). Preserve entradas e campos não relacionados. A mudança de situação registra a confirmação do desenvolvedor; não crie artefato separado de confirmação nem altere a inspeção. Nunca finalize contra inspeção obsoleta ou bloqueada. Se falhar a gravação do manifesto, informe a operação incompleta sem alegar conclusão; ao tentar novamente, reutilize a confirmação explícita já recebida nesta conversa somente enquanto a mesma base inspecionada ainda valer. Retorne caminhos da inspeção e do manifesto com a situação resultante. Artefatos finalizados passam então a ser imutáveis.

## Fluxo de trabalho

1. Resolva a pasta nomeada sob `minhas-specs/specs`; leia integralmente `spec.md` e `arvore-de-arquivos.md`, se existir.
2. Conclua o portão, leia instruções do repositório e todos os arquivos de métrica em `minhas-specs/metricas/` quando existirem. Eles definem ferramentas e portões, mas não substituem a leitura das orientações.
3. Liste `minhas-specs/specs/<nome-da-spec>/inspecoes/`. Se houver inspeções, leia integralmente a de maior número: ela é a inspeção anterior. Caso contrário, esta é a primeira.
4. Estabeleça a base de revisão: especificação, árvore aprovada, orientações aplicáveis, arquivos de implementação e teste, evidência de controle de versão e verificações fornecidas.
5. Colete as métricas descritas em [Métricas](#métricas).
6. Use os critérios BDD identificados de `spec.md` como fonte única da verdade dos comportamentos mensuráveis específicos da mudança. Confira passos explícitos `Dado / Quando / Então` e resultados verificáveis. Escopo e fora de escopo delimitam fronteiras; responsabilidades da árvore aprovada, orientações e portões de métricas continuam como verificações de engenharia. Não derive novos requisitos comportamentais de objetivos, exemplos, suposições, código, testes, árvore ou achados anteriores. Se comportamento obrigatório específico da mudança, ainda não estabelecido por orientação ou prática aprovada aplicável, constar apenas em outra seção da spec, registre lacuna de contrato e recomende `{{skill:myspec-prescrever}}` para expressá-lo em um critério.
7. Rastreie cada ID à evidência que estabeleça o estado Dado, exercite o evento Quando e verifique todos os resultados Então/E. Nome de teste, suíte aprovada, percentual de cobertura ou local da implementação isolado não comprova cenário. Use `Atendido` somente se todos os resultados forem verificados, `Não atendido` quando a evidência contrariar um resultado, ou `Evidência insuficiente` quando faltar evidência ou ela for parcial. Preserve todos os IDs no registro; nunca omita um critério nem use `Não aplicável` para dispensá-lo. Ausência de teste automatizado isolada não prova falha comportamental quando evidência manual ou alternativa concreta verifica o cenário, salvo exigência de automação pela spec ou orientação. Avalie itens de engenharia separadamente como `Atendido`, `Não atendido`, `Evidência insuficiente`, `Não aplicável` ou `Conflito de base`. Inspecione somente arquivos razoavelmente ligados aos itens avaliados.
8. Reavalie cada achado deixado aberto pela inspeção anterior, conforme [Acompanhamento](#acompanhamento).
9. Decida o veredito conforme [Veredito](#veredito).
10. Crie o arquivo descrito em [Registro da inspeção](#registro-da-inspeção) e atualize o manifesto conforme o portão do ciclo de vida. Retorne ambos os caminhos, status resultante, veredito e achados bloqueantes. Não edite código, specs, árvores, ferramentas, orientações, relatórios de qualidade ou inspeções anteriores. Artefatos históricos finalizados permanecem imutáveis mesmo com solicitação de mudança; delimite-a em nova spec.

## Métricas

Toda inspeção mede a implementação. Execute os comandos exatos de build e teste definidos pela orientação geral aprovada `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md` e, depois, para cada arquivo de métrica em `minhas-specs/metricas/`, seus comandos pré-requisito e de medição, respeitando escopo, exclusões e orientações aplicáveis, e colete:

- critérios de aceitação atendidos sobre o total definido na spec;
- testes aprovados sobre o total executado; e
- para cada arquivo de métrica, os valores listados em `Valores registrados`.

Somente os arquivos de métrica decidem quais métricas existem: um arquivo é uma métrica. Nunca meça, relate ou peça métrica que nenhum arquivo defina, como cobertura ou complexidade, nem trate a ausência de uma métrica como lacuna.

Regras de medição:

- Delimite as métricas ao código de produção da spec, identificado pela árvore aprovada, controle de versão e evidência do repositório. Se a ferramenta não conseguir isolá-lo, informe o valor do projeto e marque `(projeto)`.
- Testes falhos ou ignorados são achados; nunca apresente as medições dessa execução como verificação limpa.
- Execute uma única vez por base o comando compartilhado por vários arquivos de métrica e leia todas as métricas dessa execução.
- Nunca invente, estime manualmente, instale ou substitua ferramenta; pergunte antes de alterar dependências, comandos ou configuração. Se um arquivo de métrica estiver incompleto ou não aprovado, os comandos de build e teste não estiverem definidos ou aprovados, ou um comando aprovado estiver indisponível ou falhar, registre os valores afetados como `Não medida: <motivo>`, preserve as métricas que puderam ser medidas e sugira `{{skill:myspec-configurar}}` quando uma definição faltar ou não estiver aprovada. Se existir apenas o arquivo único legado `minhas-specs/ferramentas.md`, não meça nada a partir dele e sugira `{{skill:myspec-configurar}}` para dividi-lo em arquivos de métrica.
- Não crie nem atualize `minhas-specs/relatorio-de-qualidade.md`; esse relatório do projeto inteiro pertence a `{{skill:myspec-quantificar}}`.

Julgue cada valor registrado frente aos `## Portões` do seu arquivo de métrica aprovado que se aplicam ao código alterado:

- valor que descumpre portão `Bloqueante` é item `Não atendido`;
- valor que descumpre portão `Atenção` é achado `Atenção`;
- valor medido apenas como `(projeto)` não comprova portão de código alterado; registre o portão como `Evidência insuficiente`, salvo se ele também se aplicar ao projeto.

Novo comportamento mensurável ou meta específica da spec, ainda não estabelecido por orientação ou prática aprovada aplicável, deve constar em critério BDD e ser julgado nas condições e resultados desse critério, com o mesmo efeito de portão `Bloqueante`. Se a meta aparecer apenas em outra seção, registre lacuna de contrato em vez de criar regra de aceitação paralela. Valor sem portão ou meta de critério é informado sem achado.

## Acompanhamento

Havendo inspeção anterior, dê a cada achado que ela deixou aberto exatamente um status atual:

- `Resolvido`: a evidência atual satisfaz o item. Cite essa evidência.
- `Aberto`: a lacuna permanece. Mantenha o achado na nova inspeção com o ID original.
- `Superado`: a spec, árvore aprovada ou regra de origem mudou ou foi retirada. Cite a mudança.

Um item antes `Atendido` que agora falha é achado novo marcado `(regressão)`. Numere achados novos após o maior ID de qualquer inspeção anterior, mantendo IDs estáveis.

## Veredito

- `Bloqueada`: há item `Não atendido` ou `Conflito de base`, critério com `Evidência insuficiente`, falha de build/testes ou lacuna de contrato na spec (critérios ausentes, passos BDD ausentes, resultados não verificáveis ou contraditórios, ou comportamento obrigatório específico da mudança fora dos critérios e ainda não estabelecido por orientação ou prática aprovada aplicável). Recomende `{{skill:myspec-prescrever}}` para lacunas sem reescrever a spec na inspeção; continue inspecionando critérios não afetados.
- `Apta com ressalvas`: nada bloqueia, mas há item que não é critério de aceitação com `Evidência insuficiente`, métrica `Não medida` ou outra limitação relevante.
- `Apta`: todo item avaliado está `Atendido` ou `Não aplicável`, todas as métricas foram medidas e não resta limitação relevante.

`Apta` e `Apta com ressalvas` estabelecem conformidade com a base inspecionada e recomendam finalização. Não finalizam a spec nem substituem a decisão do desenvolvedor. A spec só se torna `finalizada` após confirmação explícita do desenvolvedor sobre a inspeção apresentada e atualização da situação no manifesto. Trabalho posterior usa nova spec. O veredito não declara que a implementação esteja completa ou sem defeitos em geral.

## Registro da inspeção

Crie `minhas-specs/specs/<nome-da-spec>/inspecoes/inspecao-<NNN>.md` a partir de `assets/modelo-de-inspecao.md`, onde `<NNN>` é o próximo número de três dígitos após a inspeção anterior, começando em `001`. Crie a pasta `inspecoes` se não existir. Nunca edite nem apague inspeções anteriores; cada execução de inspeção sobre spec ativa acrescenta um arquivo, mesmo sem mudanças. Continuação somente para confirmar altera apenas o manifesto, sem criar nem editar inspeção ou acrescentar outro artefato. Para spec finalizada, retorne a inspeção de conclusão existente.

Mantenha o registro curto. Ele relata resultados, não o processo que os produziu:

- **Critérios de aceitação**: uma linha por ID de critério BDD da spec, com evidência nomeada de teste ou outra verificação e resultados para todos os Então/E nas condições Dado/Quando especificadas. Cite o resultado ou evidência exatos que faltam se a verificação for parcial. Conte como atendido apenas o cenário inteiro verificado.
- **Métricas**: as linhas de critérios de aceitação e de testes e, depois, uma linha por valor registrado de cada arquivo de métrica, com o valor da inspeção anterior, ou `—`, e o portão que o julga, ou `—`.
- **Achados**: uma linha por achado aberto, `Bloqueante` primeiro. `Bloqueante` é todo item que torna o veredito `Bloqueada`, inclusive violação de prática de código ou orientação geral aprovada. `Atenção` é um ponto não bloqueante que o desenvolvedor precisa tratar ou conhecer, como portão `Atenção` descumprido, regra não avaliável ou árvore ou arquivo de métrica não aprovado. Escreva `Nenhum` quando não houver.
- **Achados anteriores**: apenas os achados que a inspeção anterior deixou abertos. Escreva `Nenhum — primeira inspeção.` quando não houver inspeção anterior.

Omita o que o desenvolvedor já conhece ou que não muda uma decisão: nomes e versões de ferramentas, comandos, configuração, autor, listas de arquivos medidos ou excluídos, tabelas por arquivo ou método, itens `Atendido` que não sejam critérios de aceitação, texto repetido da spec, interpretações das métricas e sugestões gerais de melhoria.

## Limites

Exija cada prática de código e orientação geral aprovada aplicável diretamente, mesmo que nenhum CA a mencione. Não peça nem crie critérios de conformidade duplicados e não relate sua ausência como lacuna de contrato. Rastreie a violação ao documento e à regra de origem, com evidência e o efeito bloqueante normal de violação de regra aprovada; mantenha-a separada das linhas e contagens de CAs. Referência contextual à orientação não cria outro critério. Se critérios existentes duplicarem orientações, avalie-os sem editar silenciosamente a spec; recomende remover a duplicação na revisão, preservando o comportamento específico da mudança.

Julgue a implementação contra o corpo da spec como seu contrato atual. Uma seção `## Histórico de revisões` (ou a equivalente do projeto) é apenas contexto e nunca acrescenta, restaura nem remove requisitos. Se o corpo de uma spec não finalizada ainda misturar comportamento substituído ou comparações com revisões anteriores a ponto de tornar ambíguo o comportamento exigido, registre lacuna de contrato e recomende revisar a spec no estado atual por `{{skill:myspec-prescrever}}`.

Não proponha funcionalidades, arquitetura, dependências, controles, fluxos, categorias de teste, desempenho ou compatibilidade fora da base. Não trate árvore proposta ou não aprovada como restrição; registre-a como achado `Atenção`. Não infira requisitos por práticas comuns. Para ambiguidade, use `Evidência insuficiente` e diga qual evidência falta. Conflito entre spec/árvore e prática ou orientação aprovada é `Conflito de base`. Nunca mantenha ou marque como `Resolvido` um achado anterior sem reavaliar a evidência atual. Separe fatos observados de inferências.
