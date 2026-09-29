# Qualidade .NET: cobertura, complexidade e CRAP score

Esta pasta foi gerada por `myspec install --tooling dotnet-quality`. Ela gera, em uma
única execução de testes, um relatório com:

- **cobertura de linhas e ramos**, coletada pelo `coverlet.collector`;
- **complexidade ciclomática** por método, classe e assembly, registrada pelo Coverlet no XML Cobertura;
- **CRAP score** por método, calculado pelo ReportGenerator na seção *Risk Hotspots*.

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

As versões acima são as registradas em `my-specs/tooling.md`. Se o projeto já usa outras, confirme a compatibilidade com o SDK e o framework de testes e atualize `my-specs/tooling.md` antes de aprová-lo.

### 2. ReportGenerator como ferramenta local

O ReportGenerator é uma ferramenta **local do repositório**, para que todas as pessoas e o CI usem a mesma versão. Se ainda não houver manifesto de ferramentas, crie-o na raiz:

```bash
dotnet new tool-manifest
```

Instale a ferramenta no manifesto (`dotnet-tools.json` na raiz com o SDK .NET 10+, `.config/dotnet-tools.json` com SDKs anteriores):

```bash
dotnet tool install dotnet-reportgenerator-globaltool --version 5.5.10
```

### 3. Restauração

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

## Resultados

A pasta `quality/coverage/` é apagada e recriada a cada execução e está ignorada pelo Git em `quality/.gitignore`.

| Arquivo | Conteúdo |
| --- | --- |
| `quality/coverage/report/index.html` | Relatório HTML com cobertura, complexidade e *Risk Hotspots* (CRAP score) |
| `quality/coverage/report/Cobertura.xml` | Cobertura consolidada de linhas e ramos e `complexity` por método |
| `quality/coverage/report/Summary.json` | Resumo de cobertura legível por máquina |
| `quality/coverage/raw/**/coverage.cobertura.xml` | Resultado bruto de cada projeto de testes |

O CRAP score combina complexidade e cobertura de linhas: `CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)`. Por padrão, o ReportGenerator destaca complexidade acima de 15 e CRAP acima de 30.

## O que os scripts executam

1. Restauram os pacotes da solução e as ferramentas locais do .NET.
2. Compilam a solução em `Release`.
3. Executam os testes com o coletor `XPlat Code Coverage`, usando `quality/coverlet.runsettings`, e produzem arquivos Cobertura em `quality/coverage/raw/`.
4. Usam o ReportGenerator para criar o HTML, o resumo JSON e o Cobertura consolidado em `quality/coverage/report/`.

## Ajustes para este repositório

- Em `coverlet.runsettings`, ajuste `Exclude` aos nomes dos seus assemblies de teste (o padrão exclui `*.Tests` e `*.xUnit.*`) e, se quiser restringir o escopo, adicione `<Include>[MeuProduto.*]*</Include>`.
- Mantenha `quality/coverage/` fora do controle de versão e os scripts e o `.runsettings` versionados.
- Qualquer mudança de versão, comando, escopo ou exclusão deve ser refletida em `my-specs/tooling.md`.

## Integração com o Myspec

1. Instale as dependências acima e rode o fluxo uma vez para confirmar que o relatório é gerado.
2. Rode o skill `myspec-configurar` para revisar e aprovar `my-specs/tooling.md` e a orientação `my-specs/general-guidelines/metas-de-complexidade-e-crap.md`, que nascem como `Status: Proposed`.
3. Após a aprovação, o skill `myspec-quantificar` usa esses comandos e resultados para gerar o `quality-report.md` de cada spec.
