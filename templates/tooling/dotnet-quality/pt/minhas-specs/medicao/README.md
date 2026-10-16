# Medição de qualidade .NET

Esta pasta foi gerada por `myspec install --tooling dotnet-quality`. Cada script mede um grupo de métricas de `minhas-specs/metricas/`:

| Script | Métricas | Ferramenta |
| --- | --- | --- |
| `gerar-relatorio-de-cobertura` | cobertura de linhas e ramos, complexidade ciclomática, CRAP score e tamanho de módulo | Coverlet e ReportGenerator, em uma única execução de testes |
| `medir-acoplamento` | acoplamento de tipos e membros | regra CA1506 dos analisadores do .NET SDK |
| `executar-testes-de-arquitetura` | conformidade com as regras de dependência aprovadas em `minhas-specs/orientacoes-gerais/regras-de-dependencia.md` | ArchUnitNET |
| `executar-testes-de-mutacao` | pontuação de mutação | Stryker.NET |
| `executar-benchmarks` | bytes alocados e tempo médio por operação dos caminhos críticos aprovados em `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md` | BenchmarkDotNet |

A pasta fica no workspace, ao lado de `minhas-specs/metricas/`: as métricas definem o que medir e os portões, e esta pasta guarda como medir. Os scripts encontram a raiz do repositório a partir da própria pasta, então podem ser executados de qualquer diretório.

A CLI `myspec` **não instala dependências**. Siga os passos abaixo antes da primeira execução.

## Pré-requisitos

- .NET SDK compatível com a solução do projeto;
- PowerShell 7+ para usar os scripts `.ps1`, ou Bash para os `.sh` (no Windows, Git Bash ou WSL);
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

As versões acima são as registradas nos arquivos de métrica em `minhas-specs/metricas/`. Se o projeto já usa outras, confirme a compatibilidade com o SDK e o framework de testes e atualize esses arquivos antes de aprová-los.

### 2. Ferramentas locais

O ReportGenerator e o Stryker.NET são ferramentas **locais do repositório**, para que todas as pessoas e o CI usem a mesma versão. Se ainda não houver manifesto de ferramentas, crie-o na raiz:

```bash
dotnet new tool-manifest
```

Instale as ferramentas no manifesto (`dotnet-tools.json` na raiz com o SDK .NET 10+, `.config/dotnet-tools.json` com SDKs anteriores):

```bash
dotnet tool install dotnet-reportgenerator-globaltool --version 5.5.10
```

```bash
dotnet tool install dotnet-stryker --version 5.0.0
```

O acoplamento não precisa de instalação: a regra CA1506 faz parte dos analisadores do .NET SDK e é ativada apenas na compilação do `medir-acoplamento`, por `acoplamento.targets`, `acoplamento.globalconfig` e `CodeMetricsConfig.txt` desta pasta.

### 3. Projeto de testes de arquitetura

As regras de dependência são verificadas por testes do ArchUnitNET em um projeto de testes próprio. Nome e pasta seguem as convenções do repositório: os scripts não dependem deles, porque encontram esses testes pela categoria `Architecture`. Sugestão: `<Produto>.TestesArquitetura`. Crie-o com o framework de testes do repositório (o exemplo usa xUnit), adicione-o à solução e referencie os projetos de produção cujas dependências as regras restringem:

```bash
dotnet new xunit -n <Produto>.TestesArquitetura -o tests/<Produto>.TestesArquitetura
```

```bash
dotnet sln {{solution}} add tests/<Produto>.TestesArquitetura/<Produto>.TestesArquitetura.csproj
```

```bash
dotnet add tests/<Produto>.TestesArquitetura/<Produto>.TestesArquitetura.csproj package TngTech.ArchUnitNET.xUnit --version 0.13.4
```

```bash
dotnet add tests/<Produto>.TestesArquitetura/<Produto>.TestesArquitetura.csproj reference <ProjetoDeProducao>/<ProjetoDeProducao>.csproj
```

Com xUnit v3, NUnit ou MSTest, use `TngTech.ArchUnitNET.xUnitV3`, `TngTech.ArchUnitNET.NUnit` ou `TngTech.ArchUnitNET.MSTestV2` na mesma versão. Os scripts filtram os testes por `Category=Architecture` e `Rule=<ID>`; com NUnit ou MSTest, confirme que o adaptador aceita esses nomes no `--filter` e ajuste o script se preciso.

Cada regra da orientação é um teste com a categoria `Architecture`, o trait `Rule` e um nome que começa com o ID da regra, porque o relatório TRX registra o nome do teste, mas não seus traits:

```csharp
using ArchUnitNET.Domain;
using ArchUnitNET.Loader;
using ArchUnitNET.xUnit;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static ArchUnitNET.Fluent.Slices.SliceRuleDefinition;

public class RegrasDeDependencia
{
    private static readonly Architecture Arquitetura = new ArchLoader()
        .LoadAssemblies(typeof(<TipoDoDominio>).Assembly, typeof(<TipoDaInfraestrutura>).Assembly)
        .Build();

    [Fact]
    [Trait("Category", "Architecture")]
    [Trait("Rule", "DEP-01")]
    public void DEP_01_Dominio_nao_depende_da_infraestrutura() =>
        Types().That().ResideInNamespaceMatching(@"^<Produto>\.Domain(\..+)?$")
            .Should().NotDependOnAny(Types().That().ResideInNamespaceMatching(@"^<Produto>\.Infrastructure(\..+)?$"))
            .Check(Arquitetura);

    [Fact]
    [Trait("Category", "Architecture")]
    [Trait("Rule", "DEP-02")]
    public void DEP_02_Namespaces_livres_de_ciclos() =>
        Slices().Matching("<Produto>.(*)").Should().BeFreeOfCycles().Check(Arquitetura);
}
```

### 4. Projeto de benchmarks

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

### 5. Restauração

Depois de clonar o repositório ou alterar dependências:

```bash
dotnet restore {{solution}}
```

```bash
dotnet tool restore
```

Os scripts já executam as restaurações de que precisam e não exigem ferramentas .NET globais.

## Uso

Execute a partir da raiz do repositório. Se houver mais de uma solução na raiz, todo script aceita `-SolutionPath <caminho>` (PowerShell) ou `--solution <caminho>` (Bash).

Cobertura, complexidade, CRAP score e tamanho de módulo:

```bash
pwsh -NoProfile -File minhas-specs/medicao/gerar-relatorio-de-cobertura.ps1
```

```bash
bash minhas-specs/medicao/gerar-relatorio-de-cobertura.sh
```

Por padrão, o relatório é aberto no navegador. Para apenas gerá-lo, use `-NoOpen` (PowerShell) ou `--no-open` (Bash).

Acoplamento, que recompila a solução em `Release` com a regra CA1506:

```bash
pwsh -NoProfile -File minhas-specs/medicao/medir-acoplamento.ps1
```

```bash
bash minhas-specs/medicao/medir-acoplamento.sh
```

Conformidade de dependências:

```bash
pwsh -NoProfile -File minhas-specs/medicao/executar-testes-de-arquitetura.ps1
```

```bash
bash minhas-specs/medicao/executar-testes-de-arquitetura.sh
```

Para executar apenas algumas regras, use `-Rules DEP-01,DEP-02` (PowerShell) ou `--rule DEP-01 --rule DEP-02` (Bash). O script termina com erro quando alguma regra é violada, depois de gravar os resultados.

Pontuação de mutação, que leva de minutos a horas na solução inteira:

```bash
pwsh -NoProfile -File minhas-specs/medicao/executar-testes-de-mutacao.ps1
```

```bash
bash minhas-specs/medicao/executar-testes-de-mutacao.sh
```

Para mutar apenas os arquivos de uma mudança, informe seus caminhos relativos à raiz com `-Files src/A.cs,src/B.cs` (PowerShell) ou `--file src/A.cs --file src/B.cs` (Bash), ou mute o que mudou desde um commit com `-Since <ref>` ou `--since <ref>`.

Benchmarks, que levam minutos; feche outros aplicativos pesados e mantenha a máquina na tomada:

```bash
pwsh -NoProfile -File minhas-specs/medicao/executar-benchmarks.ps1
```

```bash
bash minhas-specs/medicao/executar-benchmarks.sh
```

Para executar apenas alguns caminhos críticos, use `-Categories CP-01,CP-02` (PowerShell) ou `--category CP-01 --category CP-02` (Bash). Use `-Filter <glob>` ou `--filter <glob>` para filtrar nomes de benchmark e `-ProjectPath <caminho>` ou `--project <caminho>` quando houver mais de um `*.Benchmarks.csproj`.

## Resultados

Cada script apaga e recria a própria pasta de resultados a cada execução. `cobertura/` e `benchmarks/` estão ignoradas por `minhas-specs/medicao/.gitignore`; `acoplamento/`, `arquitetura/` e `mutacao/` trazem o próprio `.gitignore`.

| Arquivo | Conteúdo |
| --- | --- |
| `minhas-specs/medicao/cobertura/relatorio/index.html` | Relatório HTML com cobertura, complexidade e *Risk Hotspots* (CRAP score) |
| `minhas-specs/medicao/cobertura/relatorio/Cobertura.xml` | Cobertura consolidada de linhas e ramos, `complexity` e linhas executáveis por método |
| `minhas-specs/medicao/cobertura/relatorio/Summary.json` | Resumo legível por máquina, com `coverablelines` por classe |
| `minhas-specs/medicao/cobertura/bruto/**/coverage.cobertura.xml` | Resultado bruto de cada projeto de testes |
| `minhas-specs/medicao/acoplamento/*.sarif` | Log SARIF de cada projeto de produção, com os resultados `CA1506` acima do limite |
| `minhas-specs/medicao/arquitetura/arquitetura_*.trx` | Resultado dos testes de arquitetura, um TRX por projeto de testes |
| `minhas-specs/medicao/mutacao/reports/mutation-report.json` | Mutantes por arquivo, com status, mutador e posição |
| `minhas-specs/medicao/mutacao/reports/mutation-report.html` | Relatório navegável da mutação |
| `minhas-specs/medicao/benchmarks/results/*-report-github.md` | Tabela dos benchmarks com `Mean` e `Allocated` por operação |
| `minhas-specs/medicao/benchmarks/results/*.json` | Estatísticas e memória dos benchmarks legíveis por máquina |

O CRAP score combina complexidade e cobertura de linhas: `CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)`. Por padrão, o ReportGenerator destaca complexidade acima de 15 e CRAP acima de 30.

## O que os scripts executam

O `gerar-relatorio-de-cobertura`:

1. Restaura os pacotes da solução e as ferramentas locais do .NET.
2. Compila a solução em `Release`.
3. Executa os testes com o coletor `XPlat Code Coverage`, usando `minhas-specs/medicao/cobertura.runsettings`, e produz arquivos Cobertura em `minhas-specs/medicao/cobertura/bruto/`. Os testes da categoria `Architecture` ficam de fora: eles só leem os assemblies, não acrescentam cobertura e são medidos pelo `executar-testes-de-arquitetura`, então uma regra violada não interrompe esta execução.
4. Usa o ReportGenerator para criar o HTML, o resumo JSON e o Cobertura consolidado em `minhas-specs/medicao/cobertura/relatorio/`.

O `medir-acoplamento` recompila a solução em `Release`, sem build incremental, importando `acoplamento.targets` em cada projeto que não seja de testes nem de benchmarks. Esse arquivo ativa a regra CA1506 com os limites de `CodeMetricsConfig.txt` e grava um log SARIF por projeto em `minhas-specs/medicao/acoplamento/`; os builds normais não mudam.

O `executar-testes-de-arquitetura` executa `dotnet test` em `Release` filtrando a categoria `Architecture` e grava os resultados TRX em `minhas-specs/medicao/arquitetura/`.

O `executar-testes-de-mutacao` executa o Stryker.NET em modo solução com `minhas-specs/medicao/configuracao-do-stryker.json` e grava os relatórios JSON e HTML em `minhas-specs/medicao/mutacao/reports/`.

O `executar-benchmarks` encontra o projeto `*.Benchmarks`, executa-o em `Release` com o diagnóstico de memória e exporta resultados JSON, além dos relatórios padrão Markdown GitHub, CSV e HTML, para `minhas-specs/medicao/benchmarks/results/`.

## Ajustes para este repositório

- Em `cobertura.runsettings`, ajuste `Exclude` aos nomes dos seus assemblies de teste (o padrão exclui `*.Tests` e `*.xUnit.*`) e, se quiser restringir o escopo, adicione `<Include>[MeuProduto.*]*</Include>`. Mantenha as mesmas exclusões de arquivo em `mutate` de `configuracao-do-stryker.json`.
- Mantenha as pastas de resultados fora do controle de versão e os scripts e arquivos de configuração versionados.
- Se o projeto de benchmarks não terminar em `.Benchmarks`, ajuste a exclusão de cobertura `[*.Benchmarks]*` e a condição de `acoplamento.targets` e informe o caminho do projeto ao `executar-benchmarks`.
- Para mudar os limites de acoplamento, altere `CodeMetricsConfig.txt` e os portões de `minhas-specs/metricas/acoplamento.md` juntos.
- Qualquer mudança de versão, comando, escopo ou exclusão deve ser refletida nos arquivos de métrica afetados em `minhas-specs/metricas/`.

## Integração com o Myspec

1. Instale as dependências acima e rode cada script uma vez para confirmar que os resultados são gerados.
2. Rode o skill `myspec-configurar` para revisar e aprovar, todos criados como `Status: Proposto`:
   - um arquivo por métrica em `minhas-specs/metricas/` (`complexidade-ciclomatica.md`, `cobertura-de-testes.md`, `crap-score.md`, `tamanho-de-modulo.md`, `acoplamento.md`, `conformidade-de-dependencias.md`, `pontuacao-de-mutacao.md` e `performance.md`), cada um com seus portões;
   - as orientações `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`, `minhas-specs/orientacoes-gerais/regras-de-dependencia.md` e `minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md`. Preencha as regras de dependência, os caminhos críticos e seus orçamentos antes de aprovar essas orientações.
3. Após a aprovação, o skill `myspec-inspecionar` usa esses comandos para medir o código de cada spec, e o skill `myspec-quantificar` os usa para gerar o `minhas-specs/relatorio-de-qualidade.md` do projeto inteiro.
