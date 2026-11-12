---
name: myspec-auditar
description: Revisa a conformidade do projeto inteiro com práticas de código e orientações gerais aprovadas pelo desenvolvedor, registrando evidências, violações, lacunas de revisão e próximos passos priorizados em um relatório de conformidade. Use para auditoria geral de regras ou varredura de aderência às orientações do repositório; use myspec-quantificar para métricas e myspec-inspecionar para os critérios de uma spec.
---

# Myspec Auditar

Revise o projeto contra suas orientações aprovadas e identifique lacunas concretas de conformidade. Salve o resultado em `minhas-specs/relatorio-de-conformidade.md`, na raiz do repositório. Nenhuma spec ou definição de métrica é necessária para executar esta revisão.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial ou executar verificação, leia as instruções do repositório e todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`, incluindo subpastas. Documentos aplicáveis com `Status: Aprovado` são obrigatórios; cumpra-os antes da ação regida. Pastas ausentes, documentos não aprovados e seções explicitamente marcadas `Nenhum` não criam restrições; exponha limitações relevantes. Exponha conflitos com instruções superiores e continue as verificações não afetadas.

## Revisão

1. Complete o portão. Leia o relatório de conformidade existente antes de substituí-lo. Registre o commit ou base disponível, alterações locais e data para que as evidências possam ser interpretadas contra o estado revisado.
2. Inventarie todos os documentos de orientação encontrados com seu estado de aprovação. Para cada documento aprovado, identifique regras verificáveis distintas pelo caminho e seção de origem e por um rótulo curto quando a seção contiver vários requisitos. Determine aplicabilidade por escopo, condições, exclusões e instruções de verificação. Não transforme proposta, prática comum ou preferência pessoal em requisito.
3. Revise o projeto inteiro, incluindo código, testes, configuração, documentação e artefatos de fluxo onde as regras se aplicarem. Mapeie cada regra às evidências; inspecione arquivos relevantes e use verificações disponíveis no repositório para cobrir o escopo aplicável. Exclusões de métricas não excluem automaticamente código desta auditoria. Se o escopo for grande demais para revisão completa, identifique as áreas inspecionadas e o escopo restante para cada regra afetada; nunca restrinja silenciosamente a varredura a mudanças recentes ou uma spec.
4. Siga o método de verificação documentado de cada regra quando houver. Execute comandos locais existentes e aprovados somente quando ajudarem a verificar a regra, respeitando orientações de execução. Registre comandos exatos, resultados e caminhos de evidência; reutilize a execução compartilhada por várias regras. Build, analisador, testes ou métricas aprovados comprovam somente regras e escopo efetivamente verificados. Verificação indisponível ou falha deixa conclusões dependentes sem comprovação, salvo evidência alternativa; preserve resultados não afetados. Não instale ferramentas, altere configuração, gere artefatos de implementação nem realize alterações externas durante a auditoria.
5. Avalie cada regra aprovada com os resultados abaixo. Julgue regras de implementação contra o código atual dentro de seu escopo declarado. Julgue regras de processo pelos registros das atividades que regem: o formato do código não comprova quem gerou um artefato, como um comando foi executado ou se aprovação precedeu uma ação. Uma regra específica de skill vale para essas atividades, não automaticamente para todo trabalho histórico. Respeite exceções e dispensas retroativas explícitas; não invente nenhuma delas. Se aplicabilidade ou significado forem ambíguos, relate o esclarecimento necessário em vez de declarar violação.
6. Reexamine cada achado anteriormente aberto contra evidências atuais. Preserve seu ID e marque `Resolvido`, `Aberto`, `Substituído` ou `Não verificado`, com motivo. Mudança ou retirada de regra pode substituir um achado; área não revisada não pode resolvê-lo. Numere achados novos após o maior ID anterior, começando em `A-001`. Marque como regressão uma regra antes atendida que agora falha somente quando evidências comparáveis comprovarem isso.
7. Crie ou atualize o relatório a partir de [assets/modelo-de-relatorio-de-conformidade.md](assets/modelo-de-relatorio-de-conformidade.md). Inclua cada regra aprovada, mesmo não aplicável ou não verificável; liste documentos não aprovados separadamente. Se não houver regras aprovadas, salve ainda assim relatório `Incompleta` e recomende `{{skill:myspec-configurar}}` sem inventar uma base. Ausência de métricas ou specs não impede auditoria.
8. Retorne caminho, resultado geral, achados mais relevantes e lacunas materiais da revisão. Não corrija achados nem crie specs durante a auditoria.

## Resultados por regra e resultado geral

- `Atendido`: evidências verificam todos os aspectos exigidos em todo o escopo aplicável da regra. Uma amostra sem violações não comprova conformidade do projeto inteiro.
- `Não atendido`: evidência concreta contradiz regra aprovada aplicável. Cite regra de origem exata, caminho e linha ou artefato afetado, requisito esperado e desvio observado. Registre também áreas ainda não revisadas.
- `Evidência insuficiente`: a regra pode se aplicar, mas a evidência está ausente, parcial, desatualizada ou ambígua. Informe a evidência ou esclarecimento exato que falta, incluindo áreas não verificadas e verificações falhas. Isso não é violação confirmada.
- `Não aplicável`: as condições da regra não ocorrem no escopo revisado ou uma exceção explícita o cobre. Cite evidências de escopo ou exceção; falta de evidência não é exceção.
- `Conflito na base`: requisitos aplicáveis se contradizem sem resolução por precedência. Cite ambas as origens; não escolha silenciosamente nem recomende implementar o conflito.

O resultado geral é `Desvios encontrados` se alguma regra estiver `Não atendido`; caso contrário, `Incompleta` quando houver conflito na base, evidência insuficiente, limitação material de cobertura ou nenhuma regra aprovada. Use `Nenhum desvio encontrado` somente quando cada regra aprovada estiver `Atendido` ou comprovadamente `Não aplicável`, sem lacuna material de revisão. Exponha lacunas mesmo quando violações confirmadas determinarem o resultado. Não invente porcentagens de conformidade, limites de métricas ou veredito de aptidão ou conclusão de spec.

## Próximos passos e limites

Priorize violações confirmadas pelo efeito documentado quando houver e pelo impacto e escopo concretos; depois identifique conflitos e evidências ausentes que precisam de decisão. Para cada achado, sugira ação delimitada e cite sua origem. Não acrescente requisitos de engenharia além da base aprovada.

- Recomende `{{skill:myspec-configurar}}` para esclarecer ou revisar orientações ou estabelecer aprovações ausentes; nunca aprove nem reescreva orientações durante auditoria.
- Recomende `{{skill:myspec-prescrever}}` para mudanças de implementação que exijam nova spec, inclusive qualquer impacto em spec finalizada.
- Sugira `{{skill:myspec-corrigir}}` somente quando seus portões de escopo e ciclo de vida puderem ser estabelecidos, incluindo limite de arquivos aplicável e ausência de impacto em specs finalizadas. Caso contrário, sugira prescrição, sem presumir elegibilidade pelo tamanho aparente do achado.
- Recomende `{{skill:myspec-inspecionar}}` para revisar critérios de uma spec ativa ou `{{skill:myspec-quantificar}}` para medição geral solicitada. Não execute varredura de métricas nem altere `minhas-specs/relatorio-de-qualidade.md` nesta auditoria. Leia definições de métrica somente se uma regra aprovada exigir sua evidência; não acrescente portões exclusivos de métricas à base da auditoria.

Leia specs e seu manifesto somente quando necessário para entender evidências ou encaminhar próximo passo. Manifesto ausente limita conclusões de ciclo de vida, não regras independentes. Inspeções históricas e specs finalizadas permanecem intactas; achados atuais não as reabrem. Preserve IDs e resultados de acompanhamento do relatório anterior no relatório substituto. O relatório de conformidade é o único artefato autoral da auditoria; não edite código, documentos de contrato, artefatos de spec nem qualquer manifesto.
