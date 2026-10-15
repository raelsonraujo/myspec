# Caminhos críticos de performance

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

Aplica-se a: Todos os skills Myspec que prescrevem, implementam, corrigem, inspecionam ou quantificam código alcançável por um caminho crítico

## Regra

Os caminhos abaixo são os únicos caminhos críticos de performance deste repositório. Cada um é medido por um benchmark do BenchmarkDotNet marcado com o ID do caminho e julgado frente ao seu orçamento.

| ID | Caminho crítico | Ponto de entrada | Benchmark | Orçamento de alocação | Orçamento de tempo |
| --- | --- | --- | --- | --- | --- |
| `CP-01` | <fluxo de negócio, ex.: fechamento de pedido> | `<Tipo.Metodo>` | `<Namespace.TipoBenchmarks.Metodo>` | `≤ <bytes>/op` | `≤ +10% vs anterior` |

Substitua a linha de exemplo pelos caminhos escolhidos pelo time antes de aprovar esta orientação. Escolha um caminho somente quando ao menos um destes critérios valer: está entre as operações mais frequentes ou mais sensíveis à latência, de preferência segundo telemetria de produção; seu custo cresce com o volume de dados; ou uma regressão violaria um SLA ou custaria dinheiro. Incluir, remover ou mudar o orçamento de um caminho exige nova aprovação desta orientação.

Orçamentos:

- **Alocação** (bytes `Allocated` por operação) é a métrica principal, pois é estável entre máquinas e execuções. Valor acima do orçamento não atinge a meta.
- **Tempo** (`Mean` por operação) só é comparado com a medição anterior feita na mesma máquina e runtime. Regressão acima do orçamento de tempo não atinge a meta. Se o ambiente mudou ou não houver medição anterior, informe o tempo apenas como contexto.

Specs:

- Quando o escopo de uma spec alterar código alcançável pelo ponto de entrada de um caminho crítico, a spec inclui um critério de aceitação intitulado `PERF-NN: <ID do caminho> dentro do orçamento`, citando o benchmark e o orçamento, ou um orçamento mais rígido justificado pela spec.
- A árvore de arquivos da spec lista o arquivo de benchmark a adicionar ou modificar.

Benchmarks:

- Ficam no único projeto `*.Benchmarks` do repositório e levam `[BenchmarkCategory("<ID-do-CP>")]`, além do `PERF-NN` da spec quando houver.
- Chamam o código de produção real a partir do ponto de entrada, com volume de dados realista preparado em `[GlobalSetup]`. Substituem banco, rede e outro I/O por implementações em memória; teste de carga ponta a ponta está fora do escopo.
- Podem reaproveitar builders e fixtures de teste, mas nunca corpos de teste, mocks que pulem lógica de produção ou asserções.

Relatórios:

- Inspeções informam cada critério `PERF-NN` como qualquer critério de aceitação e acrescentam uma linha de métrica por benchmark executado para a spec, com alocação e tempo. Benchmark ausente é `Evidência insuficiente`.
- Relatórios de qualidade do projeto listam todo caminho crítico com alocação, tempo, valores anteriores e orçamento.
- Execute apenas as categorias tocadas por uma spec com `-Categories <ID-do-CP>` ou `--category <ID-do-CP>`; relatórios do projeto executam todos os benchmarks.

## Precedência das orientações

- Siga instruções de sistema, desenvolvedor, usuário e repositório antes desta orientação.
- Se ela conflitar com instrução superior ou a spec aprovada, pare e exponha o conflito.

## Histórico de aprovação

- Nenhuma aprovação registrada.
