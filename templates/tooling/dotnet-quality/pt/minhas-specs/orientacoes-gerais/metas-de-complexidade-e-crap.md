# Metas de complexidade e CRAP por método

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

Aplica-se a: Todos os skills Myspec que criam, atualizam, inspecionam ou usam relatórios de qualidade

## Regra

Use complexidade ciclomática **até 15** e CRAP score **até 30** por método controlado pelo desenvolvedor como metas normais de qualidade ao delimitar ou interpretar relatórios de qualidade. Essas metas coincidem com os limites padrão e independentes do ReportGenerator fixado no repositório: valores acima de 15 de complexidade ciclomática ou acima de 30 de CRAP score são exibidos como elevados.

Trate a complexidade 15 como o limite superior da faixa normal, não como um valor a ser buscado. Prefira complexidade naturalmente menor quando ela decorrer de um design claro e coeso, mas não reduza a complexidade à custa de legibilidade, coesão ou estrutura de domínio útil.

Interprete as duas métricas em conjunto:

- método com complexidade até 15 e CRAP até 30 atende às metas normais;
- método com complexidade de 16 a 25 pode ser tolerado quando seu CRAP for até 30, seus caminhos de decisão relevantes tiverem cobertura automatizada significativa e sua ramificação representar uma única responsabilidade coesa;
- método com complexidade acima de 25 continua candidato a melhoria, independentemente do CRAP;
- método com CRAP acima de 30 continua candidato a melhoria, pois a combinação de complexidade e cobertura medida representa risco elevado de mudança.

Em todo relatório de qualidade que inclua complexidade ciclomática:

- informe complexidade ciclomática e CRAP score de cada método controlado pelo desenvolvedor dentro do escopo, quando as duas métricas estiverem disponíveis;
- identifique todo método acima de qualquer meta, informe os dois valores medidos e a evidência de cobertura relevante e classifique-o segundo a política acima;
- diferencie essa classificação das cores do ReportGenerator, que avaliam cada métrica isoladamente;
- trate valores fora das metas como sinal de melhoria, não como falha automática de build ou não conformidade, salvo quando uma especificação aprovada ou outro contrato de maior prioridade tornar a meta obrigatória;
- não descreva a complexidade como melhorada apenas porque ramos foram movidos para métodos auxiliares arbitrários; métodos extraídos devem ter responsabilidades coesas e orientadas a comportamento;
- aplique as exclusões de código gerado e o isolamento de código alterado definidos em `minhas-specs/ferramentas.md`.

## Precedência das orientações

- Siga instruções de sistema, desenvolvedor, usuário e repositório antes desta orientação.
- Se ela conflitar com instrução superior ou a spec aprovada, pare e exponha o conflito.

## Histórico de aprovação

- Nenhuma aprovação registrada.
