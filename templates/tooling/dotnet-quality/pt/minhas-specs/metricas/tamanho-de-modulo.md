# Tamanho de módulo

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `minhas-specs/medicao/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Linhas executáveis (linhas com instruções no build Release, sem assinaturas, chaves, comentários e linhas em branco) de cada método e de cada classe controlados pelo desenvolvedor. A classe soma seus arquivos parciais e as classes que o compilador gera para ela, como lambdas e máquinas de estado assíncronas.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
- Comandos pré-requisito: Nenhum; o comando de medição restaura, compila em Release e executa os testes antes de gerar o relatório
- Fonte de versão: referência de pacote `coverlet.collector` em cada projeto de testes; manifesto de ferramentas locais (`dotnet-tools.json` ou `.config/dotnet-tools.json`) para o ReportGenerator
- Execução compartilhada: uma execução de `minhas-specs/medicao/gerar-relatorio-de-cobertura` mede esta métrica, a complexidade ciclomática, a cobertura de testes e o CRAP score; execute-a uma única vez ao medir mais de uma delas
- Raiz dos resultados gerados: `minhas-specs/medicao/cobertura/` (ignorada por `minhas-specs/medicao/.gitignore` e recriada a cada execução)

## Medição

- Ferramenta: Coverlet (`coverlet.collector`), cujo XML Cobertura lista as linhas executáveis de cada método, consolidado pelo ReportGenerator, que agrupa as classes geradas pelo compilador na classe de origem
- Versão: `coverlet.collector` `6.0.4`; ReportGenerator `5.5.10`
- Instalação ou restauração: siga `minhas-specs/medicao/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de medição: `pwsh -NoProfile -File minhas-specs/medicao/gerar-relatorio-de-cobertura.ps1 -NoOpen` ou `bash minhas-specs/medicao/gerar-relatorio-de-cobertura.sh --no-open`
- Formato e caminho do resultado: por método, a quantidade de elementos `<line>` de cada `<method>` no XML Cobertura consolidado; por classe, o campo `coverablelines` de `coverage.assemblies[].classesinassembly[]` no resumo JSON; `minhas-specs/medicao/cobertura/relatorio/Cobertura.xml` e `minhas-specs/medicao/cobertura/relatorio/Summary.json`
- Escopo: todo assembly que não seja de teste e seja instrumentado por ao menos um projeto de testes de `{{solution}}`
- Exclusões: as mesmas de `minhas-specs/metricas/complexidade-ciclomatica.md`
- Isolamento de código alterado: o mesmo de `minhas-specs/metricas/complexidade-ciclomatica.md`
- Valores registrados: maior quantidade de linhas executáveis entre os métodos (com o membro) e entre as classes (com a classe), e quantidade de métodos acima de 30 e de classes acima de 300

## Portões

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| Maior quantidade de linhas executáveis de um método | `≤ 30` | Ambos | Atenção |
| Métodos acima de 30 linhas executáveis | `= 0` | Ambos | Atenção |
| Maior quantidade de linhas executáveis de uma classe | `≤ 300` | Ambos | Atenção |
| Classes acima de 300 linhas executáveis | `= 0` | Ambos | Atenção |

Diferente da complexidade e do CRAP score, nenhuma ferramenta fixada define um limite padrão para tamanho: 30 e 300 são uma proposta inicial, a calibrar com o primeiro relatório de qualidade do projeto antes da aprovação. Leia este portão em conjunto com os de complexidade e CRAP:

- método longo e linear, com complexidade baixa e bem coberto, é tolerado quando sua sequência representa um único passo coeso, como um mapeamento extenso;
- classe acima do limite costuma acumular responsabilidades, e a melhoria esperada é separá-las por comportamento;
- o tamanho não melhora apenas porque o código foi dividido em métodos ou classes arbitrários; partes extraídas devem ter responsabilidades coesas.

## Documentos relacionados do contrato

- `minhas-specs/metricas/complexidade-ciclomatica.md`, que define escopo, exclusões e isolamento compartilhados
- `minhas-specs/metricas/acoplamento.md`, que mede quantos tipos cada classe e membro usam

## Decisões e contrapartidas

- Medir pelo Cobertura da execução de cobertura em vez de uma ferramenta de métricas de código: o pacote `Microsoft.CodeAnalysis.Metrics` executa um `Metrics.exe` do .NET Framework, que só roda no Windows, enquanto o Cobertura já é gerado em qualquer sistema operacional, sem dependência nova.
- Contar linhas executáveis em vez de linhas de arquivo: comentários, linhas em branco e formatação não mudam o valor.
- Aceitar o escopo instrumentado pelos testes: assemblies sem nenhum teste ficam fora desta métrica, como já ficam da complexidade e da cobertura.
- Usar portões `Atenção`: tamanho elevado é sinal de melhoria, não inspeção bloqueada, até que o time adote explicitamente portões `Bloqueante`.

## Histórico de aprovação

- Nenhuma aprovação registrada.
