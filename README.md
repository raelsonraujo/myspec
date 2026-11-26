# myspec

**Português** · [English](README.en.md)

CLI de desenvolvimento orientado a especificações (SDD) para agentes de código (Codex, Claude Code e Gemini). Ela instala no repositório as skills Myspec, que conduzem o ciclo prescrever → implementar → inspecionar, e o workspace `my-specs/` (`minhas-specs/` em português), onde ficam as specs e as regras que o time aprova para os agentes seguirem. Comandos determinísticos cuidam do que não deve depender do LLM: aprovações, ciclo de vida das specs, build, testes e métricas.

## Instalação

Você precisa de Node.js 20 ou superior. Baixe o arquivo `myspec-<versão>.tgz` nos [assets da release](https://github.com/raelsonraujo/myspec/releases) e instale-o com o npm, na pasta em que salvou o arquivo:

```bash
npm install -g --ignore-scripts ./myspec-0.7.24.tgz
myspec --version
```

Para conferir a origem e a integridade do arquivo antes de instalar, use a [CLI do GitHub](https://cli.github.com/manual/gh_release_verify-asset):

```bash
gh release verify-asset v0.7.24 ./myspec-0.7.24.tgz --repo raelsonraujo/myspec
```

## Configurando um repositório: `myspec install`

Na raiz do repositório, escolha o agente e o idioma:

```bash
myspec install -p claude -l pt
```

| Opção | Valores | Descrição |
| --- | --- | --- |
| `-p, --provider` | `codex`, `claude`, `gemini` ou combinação (`codex,claude`) | Agente que recebe as skills. Pode ser repetida. |
| `-l, --language` | `en`, `pt` | Idioma das skills e do workspace. |
| `-t, --tooling` | `dotnet-quality` | Template inicial de medição de qualidade (opcional). |
| `-d, --dir` | caminho | Repositório de destino (padrão: diretório atual). |

O comando gera:

```text
<repo>/
├── .claude/skills/myspec-*/    # .codex/skills/ no Codex, .agents/skills/ no Gemini
└── minhas-specs/               # my-specs/ em inglês
    ├── metricas/               # uma métrica de qualidade por arquivo
    ├── praticas-de-codigo/     # práticas aprovadas pelo time
    ├── orientacoes-gerais/     # orientações aprovadas pelo time
    └── specs/                  # uma pasta NNN-<nome>/ por spec, com spec.md, árvore de arquivos e inspeções
```

E instala estas skills:

| Inglês | Português | O que faz |
| --- | --- | --- |
| `myspec-setup` | `myspec-configurar` | Define métricas, práticas de código e orientações gerais com o desenvolvedor. |
| `myspec-prescribe` | `myspec-prescrever` | Escreve uma spec com critérios de aceitação BDD (`CA-01`, `CA-02`...). |
| `myspec-implement` | `myspec-implementar` | Planeja a árvore de arquivos, ativa a spec e implementa. |
| `myspec-inspect` | `myspec-inspecionar` | Confere a implementação contra a spec e as regras e registra uma inspeção com veredito. |
| `myspec-patch` | `myspec-corrigir` | Faz um ajuste pequeno (até 5 arquivos por padrão) sem nova spec. |
| `myspec-quantify` | `myspec-quantificar` | Mede as métricas no projeto inteiro e sugere melhorias. |
| `myspec-audit` | `myspec-auditar` | Audita o projeto inteiro contra as práticas e orientações aprovadas. |

Chame uma skill com `$myspec-configurar` no Codex ou `/myspec-configurar` no Claude Code e no Gemini. Depois de instalar, comece pela skill de configuração e, em seguida, prescreva a primeira spec.

Rodar `myspec install` de novo atualiza as skills sem tocar no conteúdo do workspace. Sem `-p`/`-l`, ele reaproveita os valores já instalados; providers se acumulam, e trocar o idioma renomeia o workspace para o novo idioma. Com `-t dotnet-quality`, a CLI também gera scripts de medição para .NET (cobertura, complexidade, CRAP, acoplamento, mutação e performance) e uma proposta de métricas para revisão; ela não instala dependências, apenas traz um README com os comandos para isso.

## Comandos

Nos comandos que recebem uma spec, a spec vem primeiro e o comando depois (`myspec 1 portao`). `<spec>` aceita o nome da pasta (`001-cancelar-pedido`) ou só o número (`1` ou `001`). Todos aceitam `-d <dir>` para apontar outro repositório. Chamados pelo nome em português, os comandos respondem em português; a saída `--json` mantém as chaves em inglês, para scripts e CI.

### `myspec approve <caminho>` (`aprovar`)

Aprova um documento em `metricas/`, `praticas-de-codigo/` ou `orientacoes-gerais/`: muda o status para `Aprovado` e registra no histórico quem aprovou (pela identidade do `git config`), quando e por quê.

```bash
myspec aprovar metricas/crap-score.md -c "Aprovação inicial"
```

### `myspec <spec> activate` (`ativar`)

Muda a spec de `proposta` para `ativa` no manifesto e registra o commit atual como base. A skill de implementação faz isso antes da primeira edição; a base serve depois para o `gate` comparar o que mudou.

```bash
myspec 1 ativar
```

### `myspec [<spec>] gate` (`portao` ou `portão`)

Executa os comandos aprovados de build, testes e métricas, além das verificações automáticas declaradas nas práticas e orientações aprovadas, lê os relatórios gerados (Cobertura, SARIF, TRX, Stryker e JSON) e julga os limites de cada métrica. Para uma spec ativa, também aponta arquivos alterados fora da árvore planejada. Termina com código de erro se houver falha bloqueante, então serve também para CI.

- `--project`: avalia as métricas do projeto inteiro, em vez de uma spec.
- `--skip-run` / `--skip-build`: reaproveita relatórios existentes ou pula build e testes.
- `--json`: saída para máquinas.

```bash
myspec 1 portao
myspec portao --project
```

A saída de cada comando fica em `.myspec/logs/`.

### `myspec <spec> finish` (`finalizar`)

Finaliza uma spec ativa depois de confirmar que a inspeção mais recente está `Apta` (ou `Apta com ressalvas`) e que o último `gate` completo passou no commit atual, sem alterações pendentes. `--force` aceita outro commit ou alterações pendentes, mas o `gate` aprovado continua obrigatório. Uma spec finalizada fica congelada: mudanças posteriores pedem uma nova spec.

```bash
myspec 1 finalizar
```

### `myspec check-patch` (`conferir-correcao`)

Diz se as alterações atuais no Git podem seguir como correção: no máximo 5 arquivos (`--limit <N>` muda o limite) e sem tocar specs finalizadas ou propostas. É o que a skill de correção usa para decidir se o ajuste precisa de uma spec.

### `myspec <spec> open` (`abre` ou `abrir`)

Abre o `spec.md` da spec no VS Code. Com `-ft` ou `--file-tree`, abre a árvore de arquivos da spec. Para usar outro editor, defina `MYSPEC_EDITOR` (por exemplo, `cursor` ou `code -r`).

```bash
myspec 7 abre
myspec 7 abre -ft
```

### `myspec <spec> criteria [<N>]` (`criterio` ou `critério`)

Mostra no terminal os critérios de aceitação da spec, um por linha, com número e título. Com o número de um critério, mostra só ele, com a descrição completa (Dado/Quando/Então). Serve para achar um critério sem ler a spec inteira, tanto para o desenvolvedor quanto para os agentes.

```bash
myspec 1 criterio        # CA-01: ..., CA-02: ...
myspec 1 criterio 5      # CA-05 com a descrição
```

O número precisa ser exato: `5`, `05` e `CA-05` levam ao mesmo critério.

### `myspec <spec> read [--smoke | -s]` (`ler`)

Imprime o `spec.md` da spec direto no terminal, para agentes e desenvolvedores lerem a especificação sem navegar pelas pastas do workspace. Com `--smoke` (ou `-s`), imprime apenas a seção de smoke da spec.

```bash
myspec 1 ler
myspec 1 ler -s
```

### `myspec <spec> inspection [--status | -s | --findings | -f]` (`inspecao` ou `inspeção`)

Imprime no terminal a inspeção mais recente da spec sem precisar procurar o maior número em `inspecoes/`. Com `--status` (ou `-s`), retorna apenas o veredito (`Apta`, `Apta com ressalvas`, `Bloqueada`, etc.). Com `--findings` (ou `-f`), imprime apenas a seção `Achados` (`Findings`).

```bash
myspec 1 inspecao
myspec 1 inspecao -s
myspec 1 inspecao -f
```

### `myspec rule [<nome>] [--full | -f]` (`regra`)

Lista todos os arquivos de regra em `praticas-de-codigo/` e `orientacoes-gerais/`. Passe o nome (ou caminho relativo) de uma regra para imprimir seu conteúdo Markdown, ou `--full` (`-f`) para imprimir todas as práticas de código e orientações gerais.

```bash
myspec regra
myspec regra codigo-limpo
myspec regra -f
```

### `myspec metric [<nome>] [--full | -f]` (`metrica` ou `métrica`)

Lista todos os arquivos de métrica em `metricas/`. Passe o nome (ou caminho relativo) de uma métrica para imprimir seu conteúdo Markdown, ou `--full` (`-f`) para imprimir todas as métricas.

```bash
myspec metrica
myspec metrica crap-score
myspec metrica -f
```
