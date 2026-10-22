---
name: myspec-quantificar
description: Mede as métricas de qualidade definidas pelos arquivos de métrica aprovados pelo desenvolvedor em minhas-specs/metricas no projeto como um todo, julga os resultados frente a seus portões e transforma as áreas mais fracas em oportunidades de melhoria priorizadas que podem originar novas specs. Use para controle de qualidade do projeto, análise de métricas ou para decidir onde investir esforço de melhoria.
---

# Myspec Quantificar

Produza métricas de qualidade baseadas em evidências para o projeto como um todo e indique onde o esforço de melhoria compensa. `{{skill:myspec-inspecionar}}` julga as métricas do código de uma spec; este skill julga o projeto inteiro, e seus achados podem ser o ponto de entrada para novas specs.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial ou executar medição, leia todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Documentos aplicáveis com `Status: Aprovado` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `Nenhum` não restringem; informe limitações relevantes.

## Fluxo de trabalho

1. Após o portão, leia todos os arquivos de métrica em `minhas-specs/metricas/` na raiz. Um arquivo é uma métrica, e somente arquivos com `Status: Aprovado` e definição completa são medidos; somente os arquivos de métrica decidem quais métricas existem, então nunca meça nem peça métrica que nenhum arquivo defina. Eles não substituem as orientações.
2. Se nenhum arquivo de métrica estiver aprovado e completo, pare e peça `{{skill:myspec-configurar}}`; se existir apenas o arquivo único legado `minhas-specs/ferramentas.md`, peça que ele seja dividido em arquivos de métrica. Não escolha ferramenta substituta. Liste nas limitações do relatório cada arquivo de métrica não aprovado ou incompleto.
3. Execute os comandos exatos de build e teste definidos pela orientação geral aprovada `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md` e, depois, os comandos pré-requisito e de medição de cada métrica aprovada para o projeto inteiro, respeitando escopo, exclusões e orientações aplicáveis.
4. Julgue os resultados frente aos portões de cada arquivo de métrica que se aplicam ao projeto e identifique os locais que os descumprem ou estão mais mal classificados.
5. Liste as specs em `minhas-specs/specs` e, para cada ponto crítico, cite a spec cuja árvore aprovada cobre aquele código, quando houver.
6. Crie ou atualize `minhas-specs/relatorio-de-qualidade.md` a partir de `assets/modelo-de-relatorio-de-qualidade.md`. Se já existir relatório, compare os totais do projeto com seus valores antes de substituí-lo.
7. Avalie as sugestões contra práticas de código e orientações aprovadas e retorne caminho, destaques e as oportunidades priorizadas com o próximo skill sugerido.

Se a ferramenta aprovada estiver indisponível ou falhar, não invente, estime manualmente, instale ou substitua ferramenta. Relate a falha, preserve métricas mensuráveis e marque seções incompletas.

## Regras de medição

- Informe comandos exatos, ferramentas, versões e configuração. Meça todo o código de produção do projeto, com totais e detalhamento por projeto, módulo ou arquivo, conforme a ferramenta suportar.
- Informe cada arquivo de métrica aprovado, com os valores e a granularidade que ele lista, e nenhuma outra métrica. Inclua contagens além de proporções quando a ferramenta as fornecer e destaque os locais mais mal classificados.
- Identifique código gerado, migrations, arquivos somente DTO e outras exclusões. Testes falhos ou ignorados são achados; nunca apresente as medições dessa execução como verificação limpa. Execute uma única vez o comando compartilhado por vários arquivos de métrica e leia todas as métricas dessa execução.
- Só julgue uma métrica como fora da meta quando um portão do seu arquivo de métrica aprovado definir essa meta, e informe o efeito do portão. Nunca invente limites; sem portão, ordene por risco relativo.

## Oportunidades de melhoria

Baseie-se em evidência medida e priorize: código que descumpre portão `Bloqueante` e, depois, portão `Atenção`; os locais mais mal classificados de cada métrica definida, sobretudo em código que implementa critérios de aceitação de specs existentes; e pontos concretos desse código cuja mudança melhoraria o valor medido.

Para cada oportunidade, cite o código afetado, a spec relacionada quando houver, o efeito esperado nas métricas sem prometer valores antes de medir novamente e o próximo skill sugerido:

- `{{skill:myspec-prescrever}}` para abrir uma nova spec de melhoria, o padrão para oportunidades que exijam mais de três arquivos ou não tenham spec implementada que as cubra;
- `{{skill:myspec-corrigir}}` para mudança de no máximo três arquivos no escopo de uma spec implementada ou fora de qualquer spec.

Oportunidades não acrescentam nem redefinem comportamentos mensuráveis de uma spec existente. Se forem seguidas por meio de spec, expresse o comportamento ou meta exigida nos critérios BDD por `{{skill:myspec-prescrever}}`; eles continuam como fonte da verdade comportamental. Ajustes elegíveis mantêm a exceção sem spec e seus portões de escopo.

Não crie specs nem edite código; o desenvolvedor decide quais oportunidades seguir. Nunca deixe orientações Myspec sobrepor instruções superiores.
