---
name: myspec-inspecionar
description: Revisa a implementação de uma especificação em minhas-specs/specs quanto aos requisitos explícitos, árvore aprovada e orientações Myspec aprovadas, mede as métricas definidas pelos arquivos de métrica aprovados em minhas-specs/metricas, julga-as frente a seus portões e registra uma inspeção enxuta na pasta inspecoes da spec que acompanha a anterior e decide se o trabalho pode avançar para a próxima spec. Use para auditar, validar ou verificar o progresso e a conclusão de uma spec sem ampliar seu escopo.
---

# Myspec Inspecionar

Revise e meça uma implementação sem ampliar seu contrato e registre cada execução como uma nova inspeção, de modo que a mais recente sirva de critério de conclusão para avançar à próxima spec. Um ciclo típico repete implementar ou corrigir seguido de inspecionar até obter os resultados desejados. Relate apenas lacunas rastreáveis a requisito explícito, responsabilidade da árvore aprovada ou regra Myspec aprovada.

## Portão obrigatório de orientações

Antes de avançar da descoberta somente-leitura, leia todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Documentos aplicáveis com `Status: Aprovado` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `Nenhum` não criam critério e devem ser relatados quando relevantes.

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
10. Crie o arquivo descrito em [Registro da inspeção](#registro-da-inspeção) e retorne seu caminho, o veredito e os achados bloqueantes. Não edite código, specs, árvores, ferramentas, orientações, relatórios de qualidade ou inspeções anteriores sem solicitação separada.

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

`Apta` e `Apta com ressalvas` indicam que a spec está concluída frente à base inspecionada e o trabalho pode avançar para a próxima spec. O veredito informa o desenvolvedor; nunca impede outro skill de rodar. Ele declara conformidade com a base inspecionada, não que a implementação esteja completa ou sem defeitos em geral.

## Registro da inspeção

Crie `minhas-specs/specs/<nome-da-spec>/inspecoes/inspecao-<NNN>.md` a partir de `assets/modelo-de-inspecao.md`, onde `<NNN>` é o próximo número de três dígitos após a inspeção anterior, começando em `001`. Crie a pasta `inspecoes` se não existir. Nunca edite nem apague inspeções anteriores; cada execução acrescenta um arquivo, mesmo sem mudanças.

Mantenha o registro curto. Ele relata resultados, não o processo que os produziu:

- **Critérios de aceitação**: uma linha por ID de critério BDD da spec, com evidência nomeada de teste ou outra verificação e resultados para todos os Então/E nas condições Dado/Quando especificadas. Cite o resultado ou evidência exatos que faltam se a verificação for parcial. Conte como atendido apenas o cenário inteiro verificado.
- **Métricas**: as linhas de critérios de aceitação e de testes e, depois, uma linha por valor registrado de cada arquivo de métrica, com o valor da inspeção anterior, ou `—`, e o portão que o julga, ou `—`.
- **Achados**: uma linha por achado aberto, `Bloqueante` primeiro. `Bloqueante` é todo item que torna o veredito `Bloqueada`, inclusive violação de prática de código ou orientação geral aprovada. `Atenção` é um ponto não bloqueante que o desenvolvedor precisa tratar ou conhecer, como portão `Atenção` descumprido, regra não avaliável ou árvore ou arquivo de métrica não aprovado. Escreva `Nenhum` quando não houver.
- **Achados anteriores**: apenas os achados que a inspeção anterior deixou abertos. Escreva `Nenhum — primeira inspeção.` quando não houver inspeção anterior.

Omita o que o desenvolvedor já conhece ou que não muda uma decisão: nomes e versões de ferramentas, comandos, configuração, autor, listas de arquivos medidos ou excluídos, tabelas por arquivo ou método, itens `Atendido` que não sejam critérios de aceitação, texto repetido da spec, interpretações das métricas e sugestões gerais de melhoria.

## Limites

Exija cada prática de código e orientação geral aprovada aplicável diretamente, mesmo que nenhum CA a mencione. Não peça nem crie critérios de conformidade duplicados e não relate sua ausência como lacuna de contrato. Rastreie a violação ao documento e à regra de origem, com evidência e o efeito bloqueante normal de violação de regra aprovada; mantenha-a separada das linhas e contagens de CAs. Referência contextual à orientação não cria outro critério. Se critérios existentes duplicarem orientações, avalie-os sem editar silenciosamente a spec; recomende remover a duplicação na revisão, preservando o comportamento específico da mudança.

Não proponha funcionalidades, arquitetura, dependências, controles, fluxos, categorias de teste, desempenho ou compatibilidade fora da base. Não trate árvore proposta ou não aprovada como restrição; registre-a como achado `Atenção`. Não infira requisitos por práticas comuns. Para ambiguidade, use `Evidência insuficiente` e diga qual evidência falta. Conflito entre spec/árvore e prática ou orientação aprovada é `Conflito de base`. Nunca mantenha ou marque como `Resolvido` um achado anterior sem reavaliar a evidência atual. Separe fatos observados de inferências.
