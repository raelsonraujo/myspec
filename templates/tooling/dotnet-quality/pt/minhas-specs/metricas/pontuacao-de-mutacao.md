# Pontuação de mutação

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `minhas-specs/medicao/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Proporção dos mutantes do código de produção que os testes detectam. O Stryker.NET altera o código (operadores, condições, retornos, blocos) e executa os testes contra cada alteração: um mutante sobrevivente mostra um comportamento que nenhum teste verifica, mesmo que a linha seja coberta. Pontuação = (mutantes mortos + timeouts) ÷ (mutantes válidos, inclusive os sem cobertura), por arquivo e no total.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
- Comandos pré-requisito: Nenhum; o comando de medição restaura as dependências, e o Stryker compila a solução e executa os testes a cada rodada
- Fonte de versão: manifesto de ferramentas locais (`dotnet-tools.json` ou `.config/dotnet-tools.json`) para o `dotnet-stryker`
- Ambiente: execução demorada, de minutos a horas conforme o tamanho da solução e dos testes; por isso fica fora da execução de cobertura
- Raiz dos resultados gerados: `minhas-specs/medicao/mutacao/` (ignorada por um `.gitignore` que o próprio Stryker grava nela e recriada a cada execução)

## Medição

- Ferramenta: Stryker.NET (`dotnet-stryker`), configurado por `minhas-specs/medicao/configuracao-do-stryker.json`
- Versão: `dotnet-stryker` `5.0.0`, fixada no manifesto de ferramentas locais
- Instalação ou restauração: siga `minhas-specs/medicao/README.md` e depois execute `dotnet restore {{solution}}` e `dotnet tool restore`
- Comando de medição: `pwsh -NoProfile -File minhas-specs/medicao/executar-testes-de-mutacao.ps1` ou `bash minhas-specs/medicao/executar-testes-de-mutacao.sh`, que executam `dotnet stryker --solution {{solution}} --config-file minhas-specs/medicao/configuracao-do-stryker.json --output minhas-specs/medicao/mutacao`
- Formato e caminho do resultado: relatório JSON do Stryker (esquema do mutation-testing-elements: `files.<arquivo>.mutants[]` com `status`, `mutatorName` e `location`) e relatório HTML; `minhas-specs/medicao/mutacao/reports/mutation-report.json` e `minhas-specs/medicao/mutacao/reports/mutation-report.html`
- Escopo: todo projeto de produção de `{{solution}}` exercitado pelos projetos de testes da solução
- Exclusões: `**/bin/**`, `**/obj/**`, `**/Migrations/**`, `**/*.g.cs`, `**/*.Designer.cs`, `**/*.generated.cs`, `**/AssemblyInfo.cs` (ver `mutate` em `minhas-specs/medicao/configuracao-do-stryker.json`); mutantes com status `CompileError` e `Ignored` não entram na pontuação
- Isolamento de código alterado: mute apenas os arquivos de produção listados em `minhas-specs/specs/<nome-da-spec>/arvore-de-arquivos.md`, repetindo `-Files <caminho>` (PowerShell, também aceita `-Files a.cs,b.cs`) ou `--file <caminho>` (Bash) com caminhos relativos à raiz; sem árvore aprovada, use `-Since <ref>` ou `--since <ref>` com o commit de base da mudança
- Valores registrados: pontuação de mutação com mortos, sobreviventes, timeouts e sem cobertura sobre o total válido; pontuação por arquivo alterado; e cada mutante sobrevivente dos arquivos alterados (arquivo, linha e mutador)

## Portões

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| Pontuação de mutação dos arquivos alterados | `≥ 60%` | Código alterado | Atenção |

Esse limite coincide com o limite `low` padrão do Stryker fixado em `configuracao-do-stryker.json`, abaixo do qual o relatório classifica a pontuação como ruim. A pontuação do projeto inteiro é informada sem portão, pois mutar toda a solução a cada inspeção seria lento demais.

Todo mutante sobrevivente em arquivo alterado é candidato a teste novo ou a uma asserção mais forte. Um sobrevivente equivalente, isto é, cuja alteração não muda nenhum comportamento observável, é registrado com essa justificativa em vez de motivar um teste artificial.

## Documentos relacionados do contrato

- `minhas-specs/metricas/cobertura-de-testes.md`, já que linha coberta não é linha verificada
- `minhas-specs/metricas/crap-score.md`, cujo risco é subestimado quando os métodos com CRAP baixo têm mutantes sobreviventes

## Decisões e contrapartidas

- Usar mutação em vez de um portão de cobertura: um teste que executa o código sem verificar o resultado aumenta a cobertura, mas deixa os mutantes sobreviverem.
- Isolar pelos arquivos da árvore da spec: a pontuação do código alterado cabe no tempo de uma inspeção, enquanto a pontuação do projeto inteiro fica para os relatórios de qualidade.
- Fixar o Stryker como ferramenta local do repositório: desenvolvedores e CI usam a mesma versão sem instalação global.
- Usar portão `Atenção`: mutante sobrevivente é sinal de teste fraco, não inspeção bloqueada, até que o time adote explicitamente um portão `Bloqueante`.

## Contrato estruturado

```json myspec
{
  "kind": "metric",
  "workingDir": ".",
  "command": {
    "win32": "pwsh -NoProfile -File minhas-specs/medicao/executar-testes-de-mutacao.ps1",
    "posix": "bash minhas-specs/medicao/executar-testes-de-mutacao.sh"
  },
  "format": "stryker",
  "resultPaths": [
    "minhas-specs/medicao/mutacao/reports/mutation-report.json"
  ],
  "gates": [
    { "metric": "mutation.score", "label": "Pontuação de mutação dos arquivos alterados", "op": ">=", "threshold": 60, "unit": "%", "scope": "changed", "enforcement": "attention" }
  ]
}
```

## Histórico de aprovação

- Nenhuma aprovação registrada.
