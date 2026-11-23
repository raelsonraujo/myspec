---
name: myspec-quantificar
description: Mede as métricas de qualidade definidas pelos arquivos de métrica aprovados pelo desenvolvedor em minhas-specs/metricas no projeto como um todo, julga os resultados frente a seus portões e transforma as áreas mais fracas em oportunidades de melhoria priorizadas que podem originar novas specs. Use para medição geral de qualidade, análise de métricas ou prioridades baseadas nelas; use myspec-auditar para conformidade com práticas e orientações.
---

# Myspec Quantificar

Meça as métricas de qualidade aprovadas no projeto inteiro e transforme as áreas mais fracas em oportunidades priorizadas de melhoria. (`{{skill:myspec-inspecionar}}` avalia uma spec; `{{skill:myspec-auditar}}` revisa conformidade com práticas e orientações.)

## Portão de orientações

Leia todo arquivo Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Trate documentos aplicáveis com `Status: Aprovado` como obrigatórios; exponha conflitos com instruções de maior prioridade.

## Fluxo

1. Leia todo arquivo em `minhas-specs/metricas/`. Apenas arquivos com `Status: Aprovado` e definição completa são medidos; nunca invente ou adote métricas não definidas. Se não houver nenhuma aprovada (ou existir apenas o legado `minhas-specs/ferramentas.md`), pare e recomende `{{skill:myspec-configurar}}`.
2. Execute **`myspec gate --project`** para rodar de forma determinística os comandos aprovados de build/teste e as métricas no projeto inteiro, julgar `## Portões` aplicáveis ao projeto e ler relatórios estruturados (Cobertura XML, SARIF, TRX, Stryker JSON, JSON genérico). Para métricas aprovadas com relatório personalizado (como benchmarks), execute o comando documentado uma vez e leia o caminho do resultado diretamente.
3. Trate testes falhos ou ignorados como achados; nunca apresente execuções falhas como verificação limpa. Nunca instale, chute ou substitua ferramentas indisponíveis — marque seções incompletas com clareza.
4. Mapeie pontos críticos às specs em `minhas-specs/specs/` cuja `arvore-de-arquivos.md` cubra o código (quando houver) e compare totais com `minhas-specs/relatorio-de-qualidade.md` anterior (se existir).
5. Salve `minhas-specs/relatorio-de-qualidade.md` com [assets/modelo-de-relatorio-de-qualidade.md](assets/modelo-de-relatorio-de-qualidade.md), registrando comandos exatos, versões, exclusões, quebras por projeto/módulo, resultados dos portões e oportunidades priorizadas:
   - Prioridade: violações de portão `Bloqueante` → violações de `Atenção` → piores pontos críticos (especialmente código que implementa CAs de specs).
   - Para cada oportunidade, informe código afetado, spec relacionada (se houver), ponto concreto de melhoria, efeito esperado na métrica (sem prometer valores exatos futuros) e próximo skill sugerido (`{{skill:myspec-prescrever}}` por padrão, ou `{{skill:myspec-corrigir}}` somente se elegível nos portões de correção e de specs finalizadas).
6. Retorne caminho do relatório, destaques das métricas e oportunidades priorizadas. Não edite código nem crie specs.
