# Qualidade .NET: cobertura, complexidade, CRAP score e performance

Esta pasta foi gerada por `myspec install --tooling dotnet-quality`. Ela gera, em uma
única execução de testes, um relatório com:

- **cobertura de linhas e ramos**, coletada pelo `coverlet.collector`;
- **complexidade ciclomática** por método, classe e assembly, registrada pelo Coverlet no XML Cobertura;
- **CRAP score** por método, calculado pelo ReportGenerator na seção *Risk Hotspots*.

Uma execução separada de benchmarks mede **bytes alocados e tempo médio por operação** dos caminhos críticos aprovados em `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`, usando o BenchmarkDotNet.

A CLI `myspec` **não instala dependências**. Siga os passos abaixo antes da primeira execução.

## Pré-requisitos

- .NET SDK compatível com a solução do projeto;
- PowerShell 7+ para usar `run-coverage-report.ps1`, ou Bash para `run-coverage-report.sh` (no Windows, Git Bash ou WSL);
- acesso aos feeds NuGet na primeira execução, para restaurar pacotes e ferramentas locais;
- Docker em execução somente se os testes usarem Testcontainers ou outra infraestrutura em contêineres;
- uma única solução `.sln` ou `.slnx` na raiz do repositório, ou uma solução informada explicitamente ao script.

## Instalação das dependências

### 1. Pacotes de teste

Adicione os pacotes a **cada projeto de testes** executado pela solução, substituindo o caminho de exemplo pelo `.csproj` do seu projeto de testes:

```bash
dotnet add <ProjetoDeTestes>/<ProjetoDeTestes>.csproj package Microsoft.NET.Test.Sdk --version 17.14.1
```

```bash
dotnet add <ProjetoDeTestes>/<ProjetoDeTestes>.csproj package coverlet.collector --version 6.0.4
```

As versões acima são as registradas nos arquivos de métrica em `minhas-specs/ferramentas/`. Se o projeto já usa outras, confirme a compatibilidade com o SDK e o framework de testes e atualize esses arquivos antes de aprová-los.

### 2. ReportGenerator como ferramenta local

O ReportGenerator é uma ferramenta **local do repositório**, para que todas as pessoas e o CI usem a mesma versão. Se ainda não houver manifesto de ferramentas, crie-o na raiz:

```bash
dotnet new tool-manifest
```

Instale a ferramenta no manifesto (`dotnet-tools.json` na raiz com o SDK .NET 10+, `.config/dotnet-tools.json` com SDKs anteriores):

```bash
dotnet tool install dotnet-reportgenerator-globaltool --version 5.5.10
```

### 3. Projeto de benchmarks

Os benchmarks ficam em um único projeto console cujo nome termina em `.Benchmarks`; os scripts o encontram automaticamente. Crie-o, adicione-o à solução e referencie o projeto de produção dono dos caminhos críticos:

```bash
dotnet new console -n <Produto>.Benchmarks -o benchmarks/<Produto>.Benchmarks
```

```bash
dotnet sln {{solution}} add benchmarks/<Produto>.Benchmarks/<Produto>.Benchmarks.csproj
```

```bash
dotnet add benchmarks/<Produto>.Benchmarks/<Produto>.Benchmarks.csproj package BenchmarkDotNet --version 0.15.8
```

```bash
dotnet add benchmarks/<Produto>.Benchmarks/<Produto>.Benchmarks.csproj reference <ProjetoDeProducao>/<ProjetoDeProducao>.csproj
```

Substitua o `Program.cs` para que os scripts consigam repassar filtros e exportadores ao BenchmarkDotNet:

```csharp
using BenchmarkDotNet.Running;

BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
```

Cada classe de benchmark mira um caminho crítico e leva o ID dele na orientação:

```csharp
using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]
[BenchmarkCategory("CP-01")]
public class PlaceOrderBenchmarks
{
    private PlaceOrderHandler _handler = null!;
    private PlaceOrder _command = null!;

    [GlobalSetup]
    public void Setup()
    {
        // Monte o handler real com dependências em memória e volume de dados realista.
    }

    [Benchmark]
    public Task PlaceOrder() => _handler.Handle(_command, CancellationToken.None);
}
```

### 4. Restauração

Depois de clonar o repositório ou alterar dependências:

```bash
dotnet restore {{solution}}
```

```bash
dotnet tool restore
```

Os scripts já executam as duas restaurações antes de gerar o relatório e não exigem ferramentas .NET globais.

## Uso

Execute a partir da raiz do repositório:

```bash
pwsh -NoProfile -File quality/run-coverage-report.ps1
```

```bash
bash quality/run-coverage-report.sh
```

Por padrão, o relatório é aberto no navegador. Para apenas gerá-lo, use `-NoOpen` (PowerShell) ou `--no-open` (Bash). Se houver mais de uma solução na raiz, use `-SolutionPath <caminho>` ou `--solution <caminho>`.

Execute os benchmarks separadamente; eles levam minutos, então feche outros aplicativos pesados e mantenha a máquina na tomada:

```bash
pwsh -NoProfile -File quality/run-benchmarks.ps1
```

```bash
bash quality/run-benchmarks.sh
```

Para executar apenas alguns caminhos críticos, use `-Categories CP-01,CP-02` (PowerShell) ou `--category CP-01 --category CP-02` (Bash). Use `-Filter <glob>` ou `--filter <glob>` para filtrar nomes de benchmark e `-ProjectPath <caminho>` ou `--project <caminho>` quando houver mais de um `*.Benchmarks.csproj`.

## Resultados

As pastas `quality/coverage/` e `quality/benchmarks/` são apagadas e recriadas pelos respectivos scripts a cada execução e estão ignoradas pelo Git em `quality/.gitignore`.

| Arquivo | Conteúdo |
| --- | --- |
| `quality/coverage/report/index.html` | Relatório HTML com cobertura, complexidade e *Risk Hotspots* (CRAP score) |
| `quality/coverage/report/Cobertura.xml` | Cobertura consolidada de linhas e ramos e `complexity` por método |
| `quality/coverage/report/Summary.json` | Resumo de cobertura legível por máquina |
| `quality/coverage/raw/**/coverage.cobertura.xml` | Resultado bruto de cada projeto de testes |
| `quality/benchmarks/results/*-report-github.md` | Tabela dos benchmarks com `Mean` e `Allocated` por operação |
| `quality/benchmarks/results/*.json` | Estatísticas e memória dos benchmarks legíveis por máquina |

O CRAP score combina complexidade e cobertura de linhas: `CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)`. Por padrão, o ReportGenerator destaca complexidade acima de 15 e CRAP acima de 30.

## O que os scripts executam

1. Restauram os pacotes da solução e as ferramentas locais do .NET.
2. Compilam a solução em `Release`.
3. Executam os testes com o coletor `XPlat Code Coverage`, usando `quality/coverlet.runsettings`, e produzem arquivos Cobertura em `quality/coverage/raw/`.
4. Usam o ReportGenerator para criar o HTML, o resumo JSON e o Cobertura consolidado em `quality/coverage/report/`.

O `run-benchmarks` encontra o projeto `*.Benchmarks`, executa-o em `Release` com o diagnóstico de memória e exporta resultados JSON, além dos relatórios padrão Markdown GitHub, CSV e HTML, para `quality/benchmarks/results/`.

## Ajustes para este repositório

- Em `coverlet.runsettings`, ajuste `Exclude` aos nomes dos seus assemblies de teste (o padrão exclui `*.Tests` e `*.xUnit.*`) e, se quiser restringir o escopo, adicione `<Include>[MeuProduto.*]*</Include>`.
- Mantenha `quality/coverage/` e `quality/benchmarks/` fora do controle de versão e os scripts e o `.runsettings` versionados.
- Se o projeto de benchmarks não terminar em `.Benchmarks`, ajuste a exclusão de cobertura `[*.Benchmarks]*` e informe o caminho do projeto ao `run-benchmarks`.
- Qualquer mudança de versão, comando, escopo ou exclusão deve ser refletida nos arquivos de métrica afetados em `minhas-specs/ferramentas/`.

## Integração com o Myspec

1. Instale as dependências acima e rode o fluxo uma vez para confirmar que o relatório é gerado.
2. Rode o skill `myspec-configurar` para revisar e aprovar, todos criados como `Status: Proposto`:
   - um arquivo por métrica em `minhas-specs/ferramentas/` (`complexidade-ciclomatica.md`, `cobertura-de-testes.md`, `crap-score.md` e `performance.md`), cada um com seus portões;
   - as orientações `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md` e `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`. Preencha os caminhos críticos e seus orçamentos antes de aprovar a orientação de performance.
3. Após a aprovação, o skill `myspec-inspecionar` usa esses comandos para medir o código de cada spec, e o skill `myspec-quantificar` os usa para gerar o `minhas-specs/relatorio-de-qualidade.md` do projeto inteiro.
