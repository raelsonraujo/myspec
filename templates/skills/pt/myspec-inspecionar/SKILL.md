---
name: myspec-inspecionar
description: Revisa a implementação de uma especificação em my-specs/specs quanto aos requisitos explícitos, árvore aprovada, diretrizes de produto e orientações Myspec aprovadas, mede cobertura e complexidade com ferramentas aprovadas e registra uma nova inspeção na pasta inspections da spec que acompanha a anterior e decide se o trabalho pode avançar para a próxima spec. Use para auditar, validar ou verificar o progresso e a conclusão de uma spec sem ampliar seu escopo.
---

# Myspec Inspecionar

Revise e meça uma implementação sem ampliar seu contrato e registre cada execução como uma nova inspeção, de modo que a mais recente sirva de critério de conclusão para avançar à próxima spec. Um ciclo típico repete implementar ou corrigir seguido de inspecionar até obter os resultados desejados. Relate apenas lacunas rastreáveis a requisito explícito, responsabilidade da árvore aprovada, diretriz de produto aplicável ou regra Myspec aprovada.

## Portão obrigatório de orientações

Antes de avançar da descoberta somente-leitura, leia todos os Markdown em `my-specs/product-directives/`, `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Documentos aplicáveis com `Status: Approved` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `None` não criam critério e devem ser relatados quando relevantes. Uma diretriz de produto que governe a implementação é critério mesmo que seu campo `Applies to` cite skills de implementação.

## Fluxo de trabalho

1. Resolva a pasta nomeada sob `my-specs/specs`; leia integralmente `spec.md` e `file-tree.md`, se existir.
2. Conclua o portão, leia instruções do repositório e `my-specs/tooling.md` quando existir. Ele não substitui a leitura das diretrizes e orientações.
3. Liste `my-specs/specs/<nome-da-spec>/inspections/`. Se houver inspeções, leia integralmente a de maior número: ela é a inspeção anterior. Caso contrário, esta é a primeira.
4. Estabeleça a base de revisão: especificação, árvore aprovada, diretrizes/orientações aplicáveis, arquivos de implementação e teste, evidência de controle de versão e verificações fornecidas. Informe o que foi examinado e limitações.
5. Colete as métricas descritas em [Métricas](#métricas).
6. Extraia somente critérios explícitos, escopo, fora de escopo, responsabilidades aprovadas e regras aplicáveis. Não converta objetivos, exemplos ou omissões em requisitos.
7. Rastreie cada item à evidência e marque `Atendido`, `Não atendido`, `Evidência insuficiente`, `Não aplicável` ou `Conflito de base`.
8. Reavalie cada achado deixado aberto pela inspeção anterior, conforme [Acompanhamento](#acompanhamento), antes de registrar achados novos.
9. Para cada item não atendido, informe a exigência exata, evidência/local e a menor correção sugerida. Diferencie não conformidade de ausência de evidência.
10. Decida o veredito conforme [Veredito](#veredito).
11. Crie o arquivo descrito em [Registro da inspeção](#registro-da-inspeção) e retorne seu caminho, o veredito, o resumo das métricas e todo item obrigatório antes de avançar. Não edite código, specs, árvores, ferramentas, orientações, relatórios de qualidade ou inspeções anteriores sem solicitação separada.

## Métricas

Toda inspeção mede a implementação para que o relatório traga métricas atuais. Colete:

- quantidade de itens da base por status e critérios de aceitação atendidos sobre o total definido na spec;
- achados resolvidos, ainda abertos e novos em relação à inspeção anterior;
- resultados dos comandos exatos de build, teste, cobertura e complexidade definidos em `my-specs/tooling.md` aprovado, respeitando escopo, exclusões e orientações aplicáveis, com testes aprovados e totais quando informados;
- cobertura de testes e complexidade ciclomática do código de produção implementado pela spec, além de qualquer métrica adicional definida pelo contrato de ferramentas.

Regras de medição:

- Informe comandos exatos, ferramentas, versões e configuração relevante. Delimite as métricas ao código de produção da spec, identificado pela árvore aprovada, controle de versão e evidência do repositório, e diferencie valores globais quando não for possível isolá-lo.
- Informe cobertura de linhas e ramos, com contagens e percentuais quando suportado, por arquivo/tipo, e cite comportamento crítico não coberto. Informe complexidade ao menos por método/função, consolide por arquivo/tipo e destaque os maiores valores.
- Identifique código gerado, migrations, arquivos somente DTO e outras exclusões. Testes falhos ou ignorados são achados, não verificação limpa.
- Nunca invente, estime manualmente, instale ou substitua ferramenta; pergunte antes de alterar dependências, comandos ou configuração. Se o contrato estiver ausente, incompleto ou não aprovado, ou um comando aprovado estiver indisponível ou falhar, registre as métricas afetadas como `Não medida` com o motivo, preserve as que puderam ser medidas e sugira `{{skill:myspec-configurar}}` quando o próprio contrato faltar ou não estiver aprovado.
- Não crie nem atualize `quality-report.md`; ele pertence a `{{skill:myspec-quantificar}}`, que continua disponível quando o desenvolvedor quiser apenas as métricas de uma spec.

Uma métrica só é critério de aprovação quando requisito da spec, diretriz de produto ou orientação aprovada e aplicável define essa meta; valor fora dela é item `Não atendido`. Caso contrário, é contexto e, se apontar caminho crítico sem cobertura ou ponto concreto de simplificação, registre como observação não bloqueante.

## Acompanhamento

Havendo inspeção anterior, dê a cada achado que ela deixou aberto exatamente um status atual:

- `Resolvido`: a evidência atual satisfaz o item. Cite essa evidência.
- `Aberto`: a lacuna permanece. Mantenha o ID original e atualize a evidência.
- `Superado`: a spec, árvore aprovada, diretriz ou regra de origem mudou ou foi retirada. Cite a mudança.

Um item antes `Atendido` que agora falha vira achado novo com origem `Regressão`. Numere achados novos após o maior ID de qualquer inspeção anterior, mantendo IDs estáveis. Compare cada métrica com o valor da inspeção anterior.

## Veredito

- `Bloqueada`: há item `Não atendido` ou `Conflito de base`, critério de aceitação com `Evidência insuficiente`, ou build/testes falharam. Cada um é bloqueante e deve constar como obrigatório antes de avançar.
- `Apta com ressalvas`: nada bloqueia, mas há item que não é critério de aceitação com `Evidência insuficiente`, verificação não executada, métrica `Não medida` ou outra limitação relevante.
- `Apta`: todo item avaliado está `Atendido` ou `Não aplicável`, a verificação passou, todas as métricas foram medidas e não resta limitação relevante.

`Apta` e `Apta com ressalvas` indicam que a spec está concluída frente à base inspecionada e o trabalho pode avançar para a próxima spec. O veredito informa o desenvolvedor; nunca impede outro skill de rodar. O desenvolvedor pode repetir implementar ou corrigir seguido de inspecionar quantas vezes quiser até obter os resultados desejados. O veredito declara conformidade com a base inspecionada, não que a implementação esteja completa ou sem defeitos em geral.

## Registro da inspeção

Crie `my-specs/specs/<nome-da-spec>/inspections/inspection-<NNN>.md` a partir de `assets/inspection-template.md`, onde `<NNN>` é o próximo número de três dígitos após a inspeção anterior, começando em `001`. Crie a pasta `inspections` se não existir. Preencha `Inspecionado por` com `git config user.name` e `git config user.email` do repositório; pergunte a identidade apenas se algum valor faltar. Nunca edite nem apague inspeções anteriores; cada execução acrescenta um arquivo, mesmo sem mudanças.

Preencha todas as seções: veredito com a justificativa para avançar ou não; resumo breve das métricas com interpretação que fundamente o veredito; itens obrigatórios antes de avançar com ID do achado e menor correção; acompanhamento dos achados anteriores; verificação, cobertura e complexidade medidas com ferramentas e exclusões, e rastreabilidade; cada achado aberto com item exato, evidência concreta com caminho e local, avaliação e correção delimitada; itens não avaliáveis com a evidência necessária; e limitações.

## Limites

Não proponha funcionalidades, arquitetura, dependências, controles, fluxos, categorias de teste, desempenho ou compatibilidade fora da base. Não infira requisitos por práticas comuns. Para ambiguidade, use `Evidência insuficiente` e diga qual evidência falta. Conflito entre spec/árvore e diretriz aprovada é `Conflito de base`. Nunca mantenha ou marque como `Resolvido` um achado anterior sem reavaliar a evidência atual. Separe fatos observados de inferências.
