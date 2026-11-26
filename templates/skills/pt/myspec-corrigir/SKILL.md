---
name: myspec-corrigir
description: Faz um ajuste de código pequeno e delimitado, de no máximo cinco arquivos por padrão, com limite substituível por orientação geral aprovada do projeto, sem exigir nova especificação ou árvore Myspec, preservando o contrato de spec já implementada que tocar, orientações do repositório e verificação automatizada proporcional. Use para correção, limpeza, ajuste pontual ou tratamento de achados de inspeção de uma spec ativa; impactos em finalizadas exigem nova spec.
---

# Myspec Corrigir

Faça um ajuste pequeno e delimitado sem criar nova spec ou árvore de arquivos, desde que não possa impactar nenhuma spec `finalizada`.

> **Comandos da CLI:** cada comando tem dois nomes válidos: o em inglês responde em inglês, e o em português responde em português. `gate` ou `portao`, `finish` ou `finalizar`, `activate` ou `ativar`, `approve` ou `aprovar`, `check-patch` ou `conferir-correcao`, `read` ou `ler`, `inspection` ou `inspecao`, `rule` ou `regra`, `metric` ou `metrica`.

## Portões de orientações e escopo

1. Leia toda regra em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/` (rode `myspec regra -f`). Trate documentos aplicáveis com `Status: Aprovado` como obrigatórios e verifique se alguma orientação geral aprovada substitui o limite padrão de 5 arquivos.
2. Leia `minhas-specs/specs/manifesto.json` (reconcilie via `{{skill:myspec-configurar}}` se ausente/inconsistente) e inspecione specs afetadas (`myspec <id-spec> ler`, `arvore-de-arquivos.md`, `myspec <id-spec> inspecao -f` para os achados, `-s` para o veredito ou `myspec <id-spec> inspecao` completo). Percorra os critérios de uma spec com `myspec <id-spec> criterio` e leia só os relevantes com `myspec <id-spec> criterio <N>` antes de ler a spec inteira.
3. Valide a elegibilidade antes de editar (e confirme ao final com **`myspec check-patch`** — passe `--limit <N>` se uma orientação aprovada substituir 5):
   - **Fronteira de spec finalizada:** Se a mudança puder impactar o comportamento ou implementação de qualquer spec `finalizada` — mesmo correção ou refatoração pequena — pare e recomende `{{skill:myspec-prescrever}}` para abrir nova spec.
   - **Limite de arquivos:** Se exceder o limite aplicável (5 por padrão, incluindo testes), recomende `{{skill:myspec-implementar}}` (se coberto por spec ativa) ou recomende `{{skill:myspec-prescrever}}`.
   - **Spec proposta ou sem árvore:** Se afetar spec `proposta` ou spec ativa sem `arvore-de-arquivos.md`, recomende `{{skill:myspec-implementar}}`.
   - **Mudança de contrato ou design:** Se alterar critérios de aceitação de spec existente ou (fora de spec) alterar comportamento público, arquitetura, persistência, segurança ou compatibilidade sem decisão definida, recomende `{{skill:myspec-prescrever}}`.

## Implementação

1. Leia `minhas-specs/metricas/` (quando existir, via `myspec metrica -f`) para respeitar portões de qualidade aplicáveis.
2. Informe o ajuste pretendido e suposições relevantes antes de editar.
3. Implemente a menor mudança coesa seguindo práticas aprovadas e padrões estabelecidos. Evite refatorações não relacionadas ou dependências não solicitadas.
4. Adicione ou atualize testes automatizados focados nos caminhos afetados e execute verificação proporcional de build/testes mais `myspec check-patch`.
5. Informe arquivos alterados (destacando qualquer arquivo fora de `arvore-de-arquivos.md` de spec ativa), evidências de verificação, aderência às orientações aprovadas e riscos remanescentes. Ao corrigir spec ativa, cite os achados de inspeção tratados e sugira `{{skill:myspec-inspecionar}}`.

Nunca permita que orientações Myspec sobrescrevam instruções de maior prioridade; exponha conflitos antes de editar.
