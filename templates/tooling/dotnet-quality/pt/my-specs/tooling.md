# Ferramentas de qualidade Myspec

Status: Proposed

Created by: `{{author}}`

Created on: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `quality/README.md`, revise cada valor abaixo frente a este repositório e aprove o contrato com `myspec-configurar`.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
- Fonte de versão: referências de pacote `coverlet.collector` e `Microsoft.NET.Test.Sdk` em cada projeto de testes; manifesto de ferramentas locais (`dotnet-tools.json` ou `.config/dotnet-tools.json`) para o ReportGenerator
- Raiz dos resultados gerados: `quality/coverage/` (ignorada por `quality/.gitignore` e recriada a cada execução)

## Complexidade ciclomática

- Ferramenta: Coverlet (`coverlet.collector`), cujo XML Cobertura registra `complexity` por método, classe e pacote; visualizada pelo ReportGenerator
- Versão: `coverlet.collector` `6.0.4`; ReportGenerator `5.5.10`
- Instalação ou restauração: siga `quality/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de medição: `pwsh -NoProfile -File quality/run-coverage-report.ps1 -NoOpen` ou `bash quality/run-coverage-report.sh --no-open` (a complexidade é coletada na mesma execução da cobertura)
- Formato e caminho do resultado: atributos `complexity` do XML Cobertura e relatório HTML; `quality/coverage/report/Cobertura.xml` e `quality/coverage/report/index.html`
- Escopo de produção: todo assembly que não seja de teste e seja instrumentado por ao menos um projeto de testes de `{{solution}}`
- Exclusões: assemblies de teste `[*.Tests]*` e `[*.xUnit.*]*`; `**/bin/**`, `**/obj/**`, `**/Migrations/**`, `**/*.g.cs`, `**/*.Designer.cs`, `**/*.generated.cs`, `**/AssemblyInfo.cs` (ver `quality/coverlet.runsettings`)
- Isolamento de código alterado: filtre o Cobertura consolidado pelos caminhos de produção listados em `my-specs/specs/<nome-da-spec>/file-tree.md` e informe os totais dos projetos afetados ao lado dos valores dos arquivos alterados

## Cobertura de testes

- Executor: VSTest via `dotnet test`
- Coletor: `coverlet.collector` (data collector `XPlat Code Coverage`)
- Versões: `coverlet.collector` `6.0.4` e `Microsoft.NET.Test.Sdk` `17.14.1`, fixadas em cada projeto de testes; ReportGenerator `5.5.10`, fixado no manifesto de ferramentas locais
- Instalação ou restauração: siga `quality/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de build: `dotnet build {{solution}} --configuration Release --no-restore`
- Comando de cobertura: `dotnet test {{solution}} --configuration Release --no-build --settings quality/coverlet.runsettings --collect:"XPlat Code Coverage" --results-directory quality/coverage/raw`
- Comando de relatório: `dotnet reportgenerator -reports:"quality/coverage/raw/**/coverage.cobertura.xml" -targetdir:"quality/coverage/report" -reporttypes:"Html;JsonSummary;Cobertura"`
- Fluxo completo: `pwsh -NoProfile -File quality/run-coverage-report.ps1` ou `bash quality/run-coverage-report.sh` (restauração, build, testes e relatório, nessa ordem)
- Formato e caminho:
  - bruto: `quality/coverage/raw/**/coverage.cobertura.xml`
  - consolidado (Cobertura com linhas e ramos): `quality/coverage/report/Cobertura.xml`
  - resumo JSON: `quality/coverage/report/Summary.json`
  - HTML: `quality/coverage/report/index.html`
- Escopo de produção e testes: todo assembly que não seja de teste e seja instrumentado pelos testes; todos os projetos de testes de `{{solution}}`
- Exclusões: as mesmas da complexidade ciclomática
- Isolamento de código alterado: o mesmo da complexidade ciclomática

## CRAP score

- Fonte: seção Risk Hotspots de `quality/coverage/report/index.html`, calculada pelo ReportGenerator por método a partir da complexidade e da cobertura do Cobertura
- Definição: `CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)`, em que `CC` é a complexidade ciclomática do método e `cov` sua cobertura de linhas medida como fração
- O ReportGenerator destaca como elevadas, de forma independente, complexidade ciclomática acima de 15 e CRAP score acima de 30
- Interpretação: `my-specs/general-guidelines/metas-de-complexidade-e-crap.md`, após aprovação

## Documentos relacionados

- Práticas de código do repositório: `my-specs/coding-practices/*.md`
- Orientações gerais Myspec: `my-specs/general-guidelines/*.md`

## Decisões e contrapartidas

- Usar a complexidade do Cobertura gerado pelo Coverlet em vez de uma ferramenta separada: uma única execução de testes produz cobertura, complexidade ciclomática e CRAP score do mesmo código.
- Fixar o ReportGenerator como ferramenta local do repositório: desenvolvedores e CI usam o mesmo comportamento de agregação sem instalação global.
- Excluir migrations e arquivos gerados: sua ramificação e volume gerados distorceriam as métricas do código controlado pelo desenvolvedor.
- Não aplicar limites de aprovação/reprovação: o Myspec registra medições e sugestões de melhoria até que o desenvolvedor adote explicitamente portões de qualidade.

## Histórico de aprovação

- Nenhuma aprovação registrada.
