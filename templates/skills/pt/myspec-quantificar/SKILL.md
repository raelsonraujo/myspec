---
name: myspec-quantificar
description: Mede as métricas de qualidade definidas pelo contrato de ferramentas aprovado pelo desenvolvedor no projeto como um todo, julga os resultados frente às metas aprovadas e transforma as áreas mais fracas em oportunidades de melhoria priorizadas que podem originar novas specs. Use para controle de qualidade do projeto, análise de métricas ou para decidir onde investir esforço de melhoria.
---

# Myspec Quantificar

Produza métricas de qualidade baseadas em evidências para o projeto como um todo e indique onde o esforço de melhoria compensa. `{{skill:myspec-inspecionar}}` julga as métricas do código de uma spec; este skill julga o projeto inteiro, e seus achados podem ser o ponto de entrada para novas specs.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial ou executar medição, leia todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Documentos aplicáveis com `Status: Aprovado` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `Nenhum` não restringem; informe limitações relevantes.

## Fluxo de trabalho

1. Após o portão, leia `minhas-specs/ferramentas.md` na raiz. Exija `Status: Aprovado` e ao menos uma métrica completa sob `## Métricas`; somente o contrato decide quais métricas existem, então nunca meça nem peça métrica que ele não defina. Ele não substitui as orientações.
2. Se o contrato estiver ausente, incompleto ou não aprovado, pare e peça `{{skill:myspec-configurar}}`. Não escolha ferramenta substituta.
3. Obtenha os resultados dos comandos aprovados exatos de build, teste e métricas para o projeto inteiro, respeitando escopo, exclusões e orientações aplicáveis.
4. Julgue os resultados frente às metas das orientações aprovadas citadas em `Interpretação` de cada métrica e identifique os locais que não as atingem ou estão mais mal classificados.
5. Liste as specs em `minhas-specs/specs` e, para cada ponto crítico, cite a spec cuja árvore aprovada cobre aquele código, quando houver.
6. Crie ou atualize `minhas-specs/relatorio-de-qualidade.md` a partir de `assets/modelo-de-relatorio-de-qualidade.md`. Se já existir relatório, compare os totais do projeto com seus valores antes de substituí-lo.
7. Avalie as sugestões contra práticas de código e orientações aprovadas e retorne caminho, destaques e as oportunidades priorizadas com o próximo skill sugerido.

Se a ferramenta aprovada estiver indisponível ou falhar, não invente, estime manualmente, instale ou substitua ferramenta. Relate a falha, preserve métricas mensuráveis e marque seções incompletas.

## Regras de medição

- Informe comandos exatos, ferramentas, versões e configuração. Meça todo o código de produção do projeto, com totais e detalhamento por projeto, módulo ou arquivo, conforme a ferramenta suportar.
- Informe cada métrica definida pelo contrato de ferramentas, com os valores e a granularidade que ele lista, e nenhuma outra. Inclua contagens além de proporções quando a ferramenta as fornecer e destaque os locais mais mal classificados.
- Identifique código gerado, migrations, arquivos somente DTO e outras exclusões. Testes falhos ou ignorados são achados; nunca apresente as medições dessa execução como verificação limpa.
- Só julgue uma métrica como fora da meta quando orientação aprovada ou o contrato de ferramentas definir essa meta. Nunca invente limites; sem meta definida, ordene por risco relativo.

## Oportunidades de melhoria

Baseie-se em evidência medida e priorize: código fora de meta aprovada; os locais mais mal classificados de cada métrica definida, sobretudo em código que implementa critérios de aceitação de specs existentes; e pontos concretos desse código cuja mudança melhoraria o valor medido.

Para cada oportunidade, cite o código afetado, a spec relacionada quando houver, o efeito esperado nas métricas sem prometer valores antes de medir novamente e o próximo skill sugerido:

- `{{skill:myspec-prescrever}}` para abrir uma nova spec de melhoria, o padrão para oportunidades que exijam mais de três arquivos ou não tenham spec implementada que as cubra;
- `{{skill:myspec-corrigir}}` para mudança de no máximo três arquivos no escopo de uma spec implementada ou fora de qualquer spec.

Não crie specs nem edite código; o desenvolvedor decide quais oportunidades seguir. Nunca deixe orientações Myspec sobrepor instruções superiores.
