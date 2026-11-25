---
name: myspec-auditar
description: Revisa a conformidade do projeto inteiro com práticas de código e orientações gerais aprovadas pelo desenvolvedor, registrando evidências, violações, lacunas de revisão e próximos passos priorizados em um relatório de conformidade. Use para auditoria geral de regras ou varredura de aderência às orientações do repositório; use myspec-quantificar para métricas e myspec-inspecionar para os critérios de uma spec.
---

# Myspec Auditar

Faça uma varredura no projeto inteiro quanto à aderência a práticas de código e orientações gerais aprovadas e salve `minhas-specs/relatorios/relatorio-de-conformidade.md`. Não exige specs nem métricas.

## Portão de orientações

Leia instruções do repositório e todo arquivo Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/` (incluindo subpastas). Trate documentos aplicáveis com `Status: Aprovado` como obrigatórios e exponha conflitos com instruções de maior prioridade.

## Fluxo

1. Leia qualquer `minhas-specs/relatorios/relatorio-de-conformidade.md` existente antes de substituí-lo. Registre o commit/base Git atual, alterações locais e data da revisão.
2. Inventarie cada documento de orientação e sua situação de aprovação. Extraia regras verificáveis distintas de cada documento aprovado (caminho, título, escopo, exclusões e método de verificação). Ignore rascunhos não aprovados e preferências pessoais.
3. Revise todo o escopo aplicável em código, testes, configuração, documentação e registros de fluxo — nunca restrinja silenciosamente a varredura a commits recentes ou uma única spec. Explicite áreas não revisadas se o escopo impedir cobertura completa.
4. Execute comandos locais de verificação aprovados somente quando necessário para comprovar uma regra, reutilizando execuções compartilhadas. Nunca instale ferramentas, altere configurações ou edite código, specs ou manifestos.
5. Classifique cada regra aprovada:
   - `Atendida`: comprovada em todo o escopo aplicável (amostra limpa não basta).
   - `Não atendida`: violação concreta com regra de origem, `caminho:linha` ou artefato, requisito esperado e desvio observado.
   - `Evidência insuficiente`: evidência ausente, parcial, desatualizada ou ambígua (não é violação confirmada).
   - `Não aplicável`: condições da regra não ocorrem ou há exceção explícita.
   - `Conflito de base`: regras aprovadas se contradizem sem precedência definida.
6. Reexamine achados abertos anteriores preservando seus IDs (`Resolvido`, `Aberto`, `Superado` ou `Não verificado` com motivo). Numere novos achados após o maior ID anterior começando em `A-001`.
7. Defina o resultado geral: `Desvios encontrados` (há `Não atendida`), `Incompleta` (conflito, evidência insuficiente, lacuna relevante de cobertura ou nenhuma regra aprovada) ou `Sem desvios encontrados` (todas as regras `Atendida` ou `Não aplicável` sem lacuna relevante).
8. Salve `minhas-specs/relatorios/relatorio-de-conformidade.md` com [assets/modelo-de-relatorio-de-conformidade.md](assets/modelo-de-relatorio-de-conformidade.md) e retorne o caminho, resultado geral, principais achados, lacunas de revisão e recomendações delimitadas de próximo skill (`{{skill:myspec-configurar}}`, `{{skill:myspec-prescrever}}`, `{{skill:myspec-corrigir}}` somente quando elegível, `{{skill:myspec-inspecionar}}` ou `{{skill:myspec-quantificar}}`).
