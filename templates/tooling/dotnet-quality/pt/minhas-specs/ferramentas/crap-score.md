# CRAP score

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `quality/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Risco de mudança de cada método controlado pelo desenvolvedor, combinando complexidade ciclomática e cobertura de linhas: `CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)`, em que `CC` é a complexidade ciclomática do método e `cov` sua cobertura de linhas medida como fração.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
- Comandos pré-requisito: Nenhum; o comando de medição restaura, compila em Release e executa os testes antes de gerar o relatório
- Fonte de versão: referência de pacote `coverlet.collector` em cada projeto de testes; manifesto de ferramentas locais (`dotnet-tools.json` ou `.config/dotnet-tools.json`) para o ReportGenerator
- Execução compartilhada: uma execução de `quality/run-coverage-report` mede esta métrica, a complexidade ciclomática e a cobertura de testes; execute-a uma única vez ao medir mais de uma delas
- Raiz dos resultados gerados: `quality/coverage/` (ignorada por `quality/.gitignore` e recriada a cada execução)

## Medição

- Ferramenta: ReportGenerator, que calcula o score por método a partir da complexidade e da cobertura do Cobertura coletado pelo Coverlet
- Versão: ReportGenerator `5.5.10`; `coverlet.collector` `6.0.4`
- Instalação ou restauração: siga `quality/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de medição: `pwsh -NoProfile -File quality/run-coverage-report.ps1 -NoOpen` ou `bash quality/run-coverage-report.sh --no-open`
- Formato e caminho do resultado: seção Risk Hotspots do relatório HTML; `quality/coverage/report/index.html`
- Escopo: todo assembly que não seja de teste e seja instrumentado por ao menos um projeto de testes de `{{solution}}`
- Exclusões: as mesmas de `minhas-specs/ferramentas/complexidade-ciclomatica.md`
- Isolamento de código alterado: o mesmo de `minhas-specs/ferramentas/complexidade-ciclomatica.md`
- Valores registrados: maior CRAP score entre os métodos (com o membro) e quantidade de métodos acima de 30

## Portões

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| Maior CRAP score entre os métodos | `≤ 30` | Ambos | Atenção |
| Métodos acima de 30 | `= 0` | Ambos | Atenção |

Esse limite coincide com o limite padrão do ReportGenerator fixado no repositório, que exibe CRAP score acima de 30 como elevado. Método acima de 30 continua candidato a melhoria, pois a combinação de complexidade e cobertura medida representa risco elevado de mudança.

Para todo método acima deste portão ou do portão de complexidade ciclomática, informe os dois valores medidos e a evidência de cobertura relevante e classifique-o segundo a política de `minhas-specs/ferramentas/complexidade-ciclomatica.md`. Diferencie essa classificação das cores do ReportGenerator, que avaliam cada métrica isoladamente.

## Documentos relacionados do contrato

- `minhas-specs/ferramentas/complexidade-ciclomatica.md`
- `minhas-specs/ferramentas/cobertura-de-testes.md`

## Decisões e contrapartidas

- Ler o score do ReportGenerator em vez de calculá-lo: o relatório usa os mesmos dados de complexidade e cobertura que as outras métricas registram.
- Usar portões `Atenção`: score elevado é sinal de melhoria, não inspeção bloqueada, até que o time adote explicitamente portões `Bloqueante`.

## Histórico de aprovação

- Nenhuma aprovação registrada.
