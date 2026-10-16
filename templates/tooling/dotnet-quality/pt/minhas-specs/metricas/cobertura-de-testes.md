# Cobertura de testes

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `minhas-specs/medicao/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Proporção de linhas e de ramos de produção executados pelos testes, por arquivo, classe e assembly.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
- Comandos pré-requisito: Nenhum; o comando de medição restaura, compila em Release e executa os testes antes de gerar o relatório
- Fonte de versão: referências de pacote `coverlet.collector` e `Microsoft.NET.Test.Sdk` em cada projeto de testes; manifesto de ferramentas locais (`dotnet-tools.json` ou `.config/dotnet-tools.json`) para o ReportGenerator
- Execução compartilhada: uma execução de `minhas-specs/medicao/gerar-relatorio-de-cobertura` mede esta métrica, a complexidade ciclomática, o CRAP score e o tamanho de módulo; execute-a uma única vez ao medir mais de uma delas
- Raiz dos resultados gerados: `minhas-specs/medicao/cobertura/` (ignorada por `minhas-specs/medicao/.gitignore` e recriada a cada execução)

## Medição

- Executor de testes: VSTest via `dotnet test`
- Ferramenta: `coverlet.collector` (data collector `XPlat Code Coverage`), consolidada pelo ReportGenerator
- Versão: `coverlet.collector` `6.0.4` e `Microsoft.NET.Test.Sdk` `17.14.1`, fixadas em cada projeto de testes; ReportGenerator `5.5.10`, fixado no manifesto de ferramentas locais
- Instalação ou restauração: siga `minhas-specs/medicao/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de medição: `pwsh -NoProfile -File minhas-specs/medicao/gerar-relatorio-de-cobertura.ps1 -NoOpen` ou `bash minhas-specs/medicao/gerar-relatorio-de-cobertura.sh --no-open` (restauração, build, testes e relatório, nessa ordem), que executam:
  - cobertura: `dotnet test {{solution}} --configuration Release --no-build --filter "FullyQualifiedName!~.ArchitectureTests." --settings minhas-specs/medicao/cobertura.runsettings --collect:"XPlat Code Coverage" --results-directory minhas-specs/medicao/cobertura/bruto`
  - relatório: `dotnet reportgenerator -reports:"minhas-specs/medicao/cobertura/bruto/**/coverage.cobertura.xml" -targetdir:"minhas-specs/medicao/cobertura/relatorio" -reporttypes:"Html;JsonSummary;Cobertura"`
- Formato e caminho do resultado:
  - bruto: `minhas-specs/medicao/cobertura/bruto/**/coverage.cobertura.xml`
  - consolidado (Cobertura com linhas e ramos): `minhas-specs/medicao/cobertura/relatorio/Cobertura.xml`
  - resumo JSON: `minhas-specs/medicao/cobertura/relatorio/Summary.json`
  - HTML: `minhas-specs/medicao/cobertura/relatorio/index.html`
- Escopo: todo assembly que não seja de teste e seja instrumentado pelos testes, medido por todos os projetos de testes de `{{solution}}`
- Exclusões: assemblies de teste `[*.Tests]*` e `[*.xUnit.*]*`; `**/bin/**`, `**/obj/**`, `**/Migrations/**`, `**/*.g.cs`, `**/*.Designer.cs`, `**/*.generated.cs`, `**/AssemblyInfo.cs` (ver `minhas-specs/medicao/cobertura.runsettings`)
- Isolamento de código alterado: filtre o Cobertura consolidado pelos caminhos de produção listados em `minhas-specs/specs/<nome-da-spec>/arvore-de-arquivos.md` e informe os totais dos projetos afetados ao lado dos valores dos arquivos alterados
- Valores registrados: cobertura de linhas e cobertura de ramos, com percentual e itens cobertos sobre o total

## Portões

Nenhum.

## Documentos relacionados do contrato

- `minhas-specs/metricas/crap-score.md`, que combina esta métrica com a complexidade ciclomática

## Decisões e contrapartidas

- Coletar a cobertura com o data collector do Coverlet na execução normal dos testes: não é preciso etapa de instrumentação separada nem ferramenta global.
- Fixar o ReportGenerator como ferramenta local do repositório: desenvolvedores e CI usam o mesmo comportamento de agregação sem instalação global.
- Excluir migrations e arquivos gerados: seu volume gerado distorceria a cobertura do código controlado pelo desenvolvedor.
- Não definir portão de cobertura: o risco de cobertura é julgado por método pelo portão do CRAP score, em vez de um percentual do projeto.

## Histórico de aprovação

- Nenhuma aprovação registrada.
