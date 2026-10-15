# Performance

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `quality/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Bytes `Allocated` por operação (principal) e tempo `Mean` por operação de cada benchmark de caminho crítico aprovado em `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}`
- Comandos pré-requisito: Nenhum; o comando de medição compila o projeto de benchmarks em Release
- Fonte de versão: referência de pacote `BenchmarkDotNet` no projeto de benchmarks
- Ambiente: build Release, sem depurador anexado, e mesma máquina e runtime sempre que o tempo for comparado com execução anterior
- Raiz dos resultados gerados: `quality/benchmarks/` (ignorada por `quality/.gitignore` e recriada a cada execução)

## Medição

- Ferramenta: BenchmarkDotNet, executado a partir do único projeto console `*.Benchmarks` do repositório
- Versão: `BenchmarkDotNet` `0.15.8`, fixada no projeto de benchmarks
- Instalação ou restauração: siga `quality/README.md` e depois execute `dotnet restore {{solution}}`
- Comando de medição: `pwsh -NoProfile -File quality/run-benchmarks.ps1` ou `bash quality/run-benchmarks.sh`, que executam `dotnet run --project <benchmarks.csproj> --configuration Release -- --filter "*" --memory --exporters json --artifacts quality/benchmarks`
- Formato e caminho do resultado: JSON do BenchmarkDotNet (`Statistics.Mean` em nanossegundos e `Memory.BytesAllocatedPerOperation` por benchmark), além dos relatórios padrão Markdown GitHub, CSV e HTML; `quality/benchmarks/results/*.json` e `quality/benchmarks/results/*-report-github.md`
- Escopo: benchmarks marcados com os IDs dos caminhos críticos de `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`
- Exclusões: Nenhum
- Isolamento de código alterado: execute apenas os caminhos críticos tocados pela spec com `-Categories <ID-do-CP>` ou `--category <ID-do-CP>`
- Valores registrados: bytes `Allocated` e tempo `Mean` por operação de cada caminho crítico medido

## Portões

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| Bytes `Allocated` por operação de cada caminho crítico | `≤` orçamento de alocação do caminho | Ambos | Bloqueante |
| Tempo `Mean` por operação de cada caminho crítico | `≤` orçamento de tempo do caminho frente à execução anterior | Ambos | Bloqueante |

Os orçamentos são os valores aprovados para cada caminho crítico em `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`. Julgue o tempo apenas frente a uma medição anterior feita na mesma máquina e runtime; se o ambiente mudou ou não houver medição anterior, informe o tempo apenas como contexto e não aplique seu portão.

## Documentos relacionados do contrato

- `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`, que lista os caminhos críticos, seus benchmarks e orçamentos

## Decisões e contrapartidas

- Executar benchmarks em script separado: eles levam minutos e exigem processo Release sem instrumentação de cobertura, por isso ficam fora da execução de cobertura.
- Usar alocação como métrica principal de performance: bytes alocados por operação são estáveis entre máquinas, enquanto o tempo só é comparado com a execução anterior no mesmo ambiente.
- Medir apenas caminhos críticos aprovados: microbenchmarks têm custo de manutenção, então cobrem os caminhos escolhidos pelo time, não todo método.

## Histórico de aprovação

- Nenhuma aprovação registrada.
