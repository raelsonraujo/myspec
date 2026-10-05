---
name: myspec-inspecionar
description: Revisa a implementação de uma especificação em my-specs/specs quanto aos requisitos explícitos, árvore aprovada, diretrizes de produto e orientações Myspec aprovadas, mede cobertura e complexidade com ferramentas aprovadas e registra uma inspeção enxuta na pasta inspections da spec que acompanha a anterior e decide se o trabalho pode avançar para a próxima spec. Use para auditar, validar ou verificar o progresso e a conclusão de uma spec sem ampliar seu escopo.
---

# Myspec Inspecionar

Revise e meça uma implementação sem ampliar seu contrato e registre cada execução como uma nova inspeção, de modo que a mais recente sirva de critério de conclusão para avançar à próxima spec. Um ciclo típico repete implementar ou corrigir seguido de inspecionar até obter os resultados desejados. Relate apenas lacunas rastreáveis a requisito explícito, responsabilidade da árvore aprovada, diretriz de produto aplicável ou regra Myspec aprovada.

## Portão obrigatório de orientações

Antes de avançar da descoberta somente-leitura, leia todos os Markdown em `my-specs/product-directives/`, `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Documentos aplicáveis com `Status: Approved` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `None` não criam critério e devem ser relatados quando relevantes. Uma diretriz de produto que governe a implementação é critério mesmo que seu campo `Applies to` cite skills de implementação.

## Fluxo de trabalho

1. Resolva a pasta nomeada sob `my-specs/specs`; leia integralmente `spec.md` e `file-tree.md`, se existir.
2. Conclua o portão, leia instruções do repositório e `my-specs/tooling.md` quando existir. Ele não substitui a leitura das diretrizes e orientações.
3. Liste `my-specs/specs/<nome-da-spec>/inspections/`. Se houver inspeções, leia integralmente a de maior número: ela é a inspeção anterior. Caso contrário, esta é a primeira.
4. Estabeleça a base de revisão: especificação, árvore aprovada, diretrizes/orientações aplicáveis, arquivos de implementação e teste, evidência de controle de versão e verificações fornecidas.
5. Colete as métricas descritas em [Métricas](#métricas).
6. Extraia somente critérios explícitos, escopo, fora de escopo, responsabilidades aprovadas e regras aplicáveis. Não converta objetivos, exemplos ou omissões em requisitos.
7. Rastreie cada item à evidência e marque `Atendido`, `Não atendido`, `Evidência insuficiente`, `Não aplicável` ou `Conflito de base`. Ausência de teste prova apenas falta de evidência, salvo se a spec ou orientação aplicável exigir esse teste.
8. Reavalie cada achado deixado aberto pela inspeção anterior, conforme [Acompanhamento](#acompanhamento).
9. Decida o veredito conforme [Veredito](#veredito).
10. Crie o arquivo descrito em [Registro da inspeção](#registro-da-inspeção) e retorne seu caminho, o veredito e os achados bloqueantes. Não edite código, specs, árvores, ferramentas, orientações, relatórios de qualidade ou inspeções anteriores sem solicitação separada.

## Métricas

Toda inspeção mede a implementação. Execute os comandos exatos de build, teste, cobertura e complexidade definidos em `my-specs/tooling.md` aprovado, respeitando escopo, exclusões e orientações aplicáveis, e colete:

- critérios de aceitação atendidos sobre o total definido na spec;
- testes aprovados sobre o total executado;
- cobertura de linhas e ramos do código de produção implementado pela spec;
- a maior complexidade ciclomática entre os métodos/funções desse código; e
- qualquer métrica adicional definida pelo contrato de ferramentas aprovado, como CRAP score.

Regras de medição:

- Delimite as métricas ao código de produção da spec, identificado pela árvore aprovada, controle de versão e evidência do repositório. Se a ferramenta não conseguir isolá-lo, informe o valor do projeto e marque `(projeto)`.
- Testes falhos ou ignorados são achados, não verificação limpa.
- Nunca invente, estime manualmente, instale ou substitua ferramenta; pergunte antes de alterar dependências, comandos ou configuração. Se o contrato estiver ausente, incompleto ou não aprovado, ou um comando aprovado estiver indisponível ou falhar, registre as métricas afetadas como `Não medida: <motivo>`, preserve as que puderam ser medidas e sugira `{{skill:myspec-configurar}}` quando o próprio contrato faltar ou não estiver aprovado.
- Não crie nem atualize `my-specs/quality-report.md`; esse relatório do projeto inteiro pertence a `{{skill:myspec-quantificar}}`.

Uma métrica só é critério de aprovação quando requisito da spec, diretriz de produto ou orientação aprovada e aplicável define essa meta; valor fora dela é item `Não atendido`. Caso contrário, é informada sem achado.

## Acompanhamento

Havendo inspeção anterior, dê a cada achado que ela deixou aberto exatamente um status atual:

- `Resolvido`: a evidência atual satisfaz o item. Cite essa evidência.
- `Aberto`: a lacuna permanece. Mantenha o achado na nova inspeção com o ID original.
- `Superado`: a spec, árvore aprovada, diretriz ou regra de origem mudou ou foi retirada. Cite a mudança.

Um item antes `Atendido` que agora falha é achado novo marcado `(regressão)`. Numere achados novos após o maior ID de qualquer inspeção anterior, mantendo IDs estáveis.

## Veredito

- `Bloqueada`: há item `Não atendido` ou `Conflito de base`, critério de aceitação com `Evidência insuficiente`, ou build/testes falharam.
- `Apta com ressalvas`: nada bloqueia, mas há item que não é critério de aceitação com `Evidência insuficiente`, métrica `Não medida` ou outra limitação relevante.
- `Apta`: todo item avaliado está `Atendido` ou `Não aplicável`, todas as métricas foram medidas e não resta limitação relevante.

`Apta` e `Apta com ressalvas` indicam que a spec está concluída frente à base inspecionada e o trabalho pode avançar para a próxima spec. O veredito informa o desenvolvedor; nunca impede outro skill de rodar. Ele declara conformidade com a base inspecionada, não que a implementação esteja completa ou sem defeitos em geral.

## Registro da inspeção

Crie `my-specs/specs/<nome-da-spec>/inspections/inspection-<NNN>.md` a partir de `assets/inspection-template.md`, onde `<NNN>` é o próximo número de três dígitos após a inspeção anterior, começando em `001`. Crie a pasta `inspections` se não existir. Nunca edite nem apague inspeções anteriores; cada execução acrescenta um arquivo, mesmo sem mudanças.

Mantenha o registro curto. Ele relata resultados, não o processo que os produziu:

- **Critérios de aceitação**: uma linha por critério da spec, com o teste ou local que comprova o status.
- **Métricas**: uma linha por métrica coletada, com o valor da inspeção anterior ou `—`. Acrescente uma linha para cada métrica adicional do contrato de ferramentas.
- **Achados**: uma linha por achado aberto, `Bloqueante` primeiro. `Bloqueante` é todo item que torna o veredito `Bloqueada`, inclusive violação de diretriz de produto, prática de código ou orientação geral aprovada. `Atenção` é um ponto não bloqueante que o desenvolvedor precisa tratar ou conhecer, como regra não avaliável ou árvore ou contrato de ferramentas não aprovado. Escreva `None` quando não houver.
- **Achados anteriores**: apenas os achados que a inspeção anterior deixou abertos. Escreva `None — primeira inspeção.` quando não houver inspeção anterior.

Omita o que o desenvolvedor já conhece ou que não muda uma decisão: nomes e versões de ferramentas, comandos, configuração, autor, listas de arquivos medidos ou excluídos, tabelas por arquivo ou método, itens `Atendido` que não sejam critérios de aceitação, texto repetido da spec, interpretações das métricas e sugestões gerais de melhoria.

## Limites

Não proponha funcionalidades, arquitetura, dependências, controles, fluxos, categorias de teste, desempenho ou compatibilidade fora da base. Não trate árvore proposta ou não aprovada como restrição; registre-a como achado `Atenção`. Não infira requisitos por práticas comuns. Para ambiguidade, use `Evidência insuficiente` e diga qual evidência falta. Conflito entre spec/árvore e diretriz aprovada é `Conflito de base`. Nunca mantenha ou marque como `Resolvido` um achado anterior sem reavaliar a evidência atual. Separe fatos observados de inferências.
