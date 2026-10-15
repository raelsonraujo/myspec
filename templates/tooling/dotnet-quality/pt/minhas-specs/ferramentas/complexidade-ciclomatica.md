# Complexidade ciclomática

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `quality/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Complexidade ciclomática de cada método controlado pelo desenvolvedor, consolidada por classe e assembly.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
- Comandos pré-requisito: Nenhum; o comando de medição restaura, compila em Release e executa os testes antes de gerar o relatório
- Fonte de versão: referência de pacote `coverlet.collector` em cada projeto de testes; manifesto de ferramentas locais (`dotnet-tools.json` ou `.config/dotnet-tools.json`) para o ReportGenerator
- Execução compartilhada: uma execução de `quality/run-coverage-report` mede esta métrica, a cobertura de testes e o CRAP score; execute-a uma única vez ao medir mais de uma delas
- Raiz dos resultados gerados: `quality/coverage/` (ignorada por `quality/.gitignore` e recriada a cada execução)

## Medição

- Ferramenta: Coverlet (`coverlet.collector`), cujo XML Cobertura registra `complexity` por método, classe e pacote; visualizada pelo ReportGenerator
- Versão: `coverlet.collector` `6.0.4`; ReportGenerator `5.5.10`
- Instalação ou restauração: siga `quality/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de medição: `pwsh -NoProfile -File quality/run-coverage-report.ps1 -NoOpen` ou `bash quality/run-coverage-report.sh --no-open`
- Formato e caminho do resultado: atributos `complexity` do XML Cobertura e relatório HTML; `quality/coverage/report/Cobertura.xml` e `quality/coverage/report/index.html`
- Escopo: todo assembly que não seja de teste e seja instrumentado por ao menos um projeto de testes de `{{solution}}`
- Exclusões: assemblies de teste `[*.Tests]*` e `[*.xUnit.*]*`; `**/bin/**`, `**/obj/**`, `**/Migrations/**`, `**/*.g.cs`, `**/*.Designer.cs`, `**/*.generated.cs`, `**/AssemblyInfo.cs` (ver `quality/coverlet.runsettings`)
- Isolamento de código alterado: filtre o Cobertura consolidado pelos caminhos de produção listados em `minhas-specs/specs/<nome-da-spec>/arvore-de-arquivos.md` e informe os totais dos projetos afetados ao lado dos valores dos arquivos alterados
- Valores registrados: maior complexidade ciclomática entre os métodos (com o membro) e quantidade de métodos acima de 15

## Portões

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| Maior complexidade ciclomática entre os métodos | `≤ 15` | Ambos | Atenção |
| Métodos acima de 15 | `= 0`, exceto métodos tolerados abaixo | Ambos | Atenção |

Esses limites coincidem com o limite padrão do ReportGenerator fixado no repositório, que exibe complexidade acima de 15 como elevada. Trate 15 como o limite superior da faixa normal, não como um valor a ser buscado, e leia este portão em conjunto com o do CRAP score:

- método com complexidade de 16 a 25 é tolerado quando seu CRAP for até 30, seus caminhos de decisão relevantes tiverem cobertura automatizada significativa e sua ramificação representar uma única responsabilidade coesa;
- método com complexidade acima de 25 continua candidato a melhoria, independentemente do CRAP;
- a complexidade não melhora apenas porque ramos foram movidos para métodos auxiliares arbitrários; métodos extraídos devem ter responsabilidades coesas e orientadas a comportamento.

Prefira complexidade naturalmente menor quando ela decorrer de um design claro e coeso, mas nunca à custa de legibilidade, coesão ou estrutura de domínio útil.

## Documentos relacionados do contrato

- `minhas-specs/ferramentas/crap-score.md`, que combina esta métrica com a cobertura de linhas

## Decisões e contrapartidas

- Usar a complexidade do Cobertura gerado pelo Coverlet em vez de uma ferramenta separada: uma única execução de testes produz cobertura, complexidade ciclomática e CRAP score do mesmo código.
- Fixar o ReportGenerator como ferramenta local do repositório: desenvolvedores e CI usam o mesmo comportamento de agregação sem instalação global.
- Excluir migrations e arquivos gerados: sua ramificação e volume gerados distorceriam as métricas do código controlado pelo desenvolvedor.
- Usar portões `Atenção`: método fora da faixa normal é sinal de melhoria, não inspeção bloqueada, até que o time adote explicitamente portões `Bloqueante`.

## Histórico de aprovação

- Nenhuma aprovação registrada.
