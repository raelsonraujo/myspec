---
name: myspec-inspecionar
description: Revisa a implementação de uma especificação em my-specs/specs quanto aos requisitos explícitos, árvore aprovada, diretrizes de produto e orientações Myspec aprovadas. Use para auditar ou validar uma spec sem ampliar seu escopo.
---

# Myspec Inspecionar

Revise uma implementação sem ampliar seu contrato. Relate apenas lacunas rastreáveis a requisito explícito, responsabilidade da árvore aprovada, diretriz de produto aplicável ou regra Myspec aprovada.

## Portão obrigatório de orientações

Antes de avançar da descoberta somente-leitura, leia todos os Markdown em `my-specs/product-directives/`, `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Documentos aplicáveis com `Status: Approved` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `None` não criam critério e devem ser relatados quando relevantes. Uma diretriz de produto que governe a implementação é critério mesmo que seu campo `Applies to` cite skills de implementação.

## Fluxo de trabalho

1. Resolva a pasta nomeada sob `my-specs/specs`; leia integralmente `spec.md` e `file-tree.md`, se existir.
2. Conclua o portão, leia instruções do repositório e `my-specs/tooling.md` quando existir. Ele não substitui a leitura das diretrizes e orientações.
3. Estabeleça a base de revisão: especificação, árvore aprovada, diretrizes/orientações aplicáveis, arquivos de implementação e teste, evidência de controle de versão e verificações fornecidas. Informe o que foi examinado e limitações.
4. Extraia somente critérios explícitos, escopo, fora de escopo, responsabilidades aprovadas e regras aplicáveis. Não converta objetivos, exemplos ou omissões em requisitos.
5. Rastreie cada item à evidência e marque `Atendido`, `Não atendido`, `Evidência insuficiente`, `Não aplicável` ou `Conflito de base`.
6. Para cada item não atendido, informe a exigência exata, evidência/local e a menor correção sugerida. Diferencie não conformidade de ausência de evidência.
7. Retorne o relatório na resposta; não edite código, specs, árvores, ferramentas ou orientações sem solicitação separada.

## Limites e formato

Não proponha funcionalidades, arquitetura, dependências, controles, fluxos, categorias de teste, desempenho ou compatibilidade fora da base. Não infira requisitos por práticas comuns. Para ambiguidade, use `Evidência insuficiente` e diga qual evidência falta. Conflito entre spec/árvore e diretriz aprovada é `Conflito de base`.

Comece com escopo, revisão da spec, evidências, diretrizes e limitações. Depois apresente:

| Item da base | Evidência | Status | Correção sugerida |
| --- | --- | --- | --- |
| Critério ou regra exata | Arquivo, teste, diff ou saída | Atendido / Não atendido / Evidência insuficiente / Não aplicável / Conflito de base | Menor mudança, somente se não atendido |

Finalize com achados priorizados e itens não avaliáveis. Se não houver não conformidade, diga que ela está conforme a base inspecionada, não que esteja completa ou sem defeitos em geral.
