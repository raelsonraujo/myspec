# myspec

CLI de desenvolvimento orientado a especificações (SDD) para agentes de código, no estilo do [spec-kit](https://github.com/github/spec-kit) e do [OpenSpec](https://github.com/Fission-AI/OpenSpec). Ela instala no repositório um conjunto de skills Myspec e o workspace `my-specs/` (`minhas-specs/` em português), onde o time estabelece e aprova as regras que os agentes devem seguir.

## Instalação

```bash
npm install -g myspec
```

Durante o desenvolvimento, a partir deste repositório:

```bash
npm install && npm link
```

## Uso

```bash
myspec install -p codex -l pt
```

| Opção | Valores | Descrição |
| --- | --- | --- |
| `-p, --provider` | `codex`, `claude`, ou ambos (`codex,claude`) | Agente que receberá os skills. Pode ser repetida. |
| `-l, --language` | `en` (`eng`), `pt` | Idioma dos skills. Apenas um idioma é instalado. |
| `-t, --tooling` | `dotnet-quality` | Template de tooling de qualidade inicial. Pode ser repetida. |
| `-d, --dir` | caminho | Repositório de destino (padrão: diretório atual). |

Sem `-p`/`-l` em um terminal interativo, a CLI pergunta os valores. Se o repositório já tiver um workspace Myspec, eles assumem os valores instalados; assim, `myspec install -t dotnet-quality` adiciona o tooling a uma instalação existente.

## Templates de tooling

Um template de tooling gera, junto com os skills, os artefatos para medir qualidade e uma proposta de `my-specs/tooling.md` (`Status: Proposed`; em português, `minhas-specs/ferramentas.md` com `Status: Proposto`) já preenchida. **A CLI não instala dependências**: cada template traz um README com os comandos para o desenvolvedor executar.

Os skills não supõem métricas: medem exatamente as definidas na seção `## Metrics` (`## Métricas`) do contrato aprovado. Sem template de tooling, o skill de setup pergunta ao desenvolvedor quais métricas medir; um template apenas propõe um conjunto concreto para revisão.

```bash
myspec install -p claude -l pt -t dotnet-quality
```

`dotnet-quality` mede complexidade ciclomática, cobertura de linhas/ramos e CRAP score em .NET com Coverlet e ReportGenerator, em uma única execução de testes. Em uma execução separada, mede a performance dos caminhos críticos aprovados (bytes alocados e tempo médio por operação) com BenchmarkDotNet:

```text
quality/
├── README.md                 # instalação das dependências e uso
├── coverlet.runsettings      # filtros de cobertura
├── run-coverage-report.ps1   # restore → build → test → relatório
├── run-coverage-report.sh
├── run-benchmarks.ps1        # benchmarks dos caminhos críticos em Release
├── run-benchmarks.sh
├── .gitignore                # ignora quality/coverage/ e quality/benchmarks/
└── .gitattributes            # mantém o .sh com LF
minhas-specs/                                      # -l pt (my-specs/ em -l en)
├── ferramentas.md                                 # contrato proposto, com a solução detectada na raiz
├── orientacoes-gerais/<metas de CC e CRAP>.md     # orientação proposta: CC ≤ 15 e CRAP ≤ 30
└── orientacoes-gerais/<caminhos críticos>.md      # orientação proposta: caminhos críticos e orçamentos de alocação/tempo
```

A solução `.sln`/`.slnx` da raiz e a identidade `git config user.name`/`user.email` são preenchidas automaticamente; se não forem encontradas, a CLI avisa e deixa um marcador. Arquivos que já existem nunca são sobrescritos. Depois de instalar as dependências, rode o skill de setup (`myspec-setup`/`myspec-configurar`) para revisar e aprovar o contrato.

## O que é gerado

```text
<repo>/
├── .codex/skills/myspec-*/     # -p codex: SKILL.md, assets/ e agents/openai.yaml
├── .claude/skills/myspec-*/    # -p claude: SKILL.md e assets/
└── my-specs/                   # minhas-specs/ em -l pt
    ├── README.md
    ├── myspec.json             # manifesto mantido pela CLI
    ├── product-directives/     # diretrizes-de-produto/
    ├── coding-practices/       # praticas-de-codigo/
    ├── general-guidelines/     # orientacoes-gerais/
    └── specs/
```

Diretrizes de produto, práticas de código, orientações gerais e o contrato de ferramentas são compartilhados com o time e registram criador e aprovadores com `git config user.name`/`user.email`. As specs (`spec.md`, árvore de arquivos e inspeções) são um auxílio local do desenvolvedor: não registram identidade Git, apenas status e um histórico de revisões datado.

Na versão `pt`, todo o workspace fica em português: pastas, arquivos gerados pelos skills (`ferramentas.md`, `relatorio-de-qualidade.md`, `arvore-de-arquivos.md`, `inspecoes/inspecao-NNN.md`), status (`Proposto`/`Aprovado`), metadados (`Criado por`, `Aprovado por`, `Histórico de aprovação`, `Histórico de revisões`), marcadores da árvore (`# adicionar`, `# modificar`, `# excluir`) e IDs (`CA-01`, `A-001`).

| Inglês (`en`) | Português (`pt`) | Função |
| --- | --- | --- |
| `myspec-setup` | `myspec-configurar` | Define as métricas de qualidade escolhidas pelo desenvolvedor e suas ferramentas, diretrizes de produto, práticas e orientações |
| `myspec-prescribe` | `myspec-prescrever` | Cria uma spec testável em `specs/NNN-<nome>/` |
| `myspec-implement` | `myspec-implementar` | Propõe/aprova a árvore de arquivos e implementa a spec |
| `myspec-inspect` | `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede as métricas definidas no contrato de ferramentas e registra em `specs/NNN-<nome>/inspections/` (`inspecoes/`) uma inspeção com veredito |
| `myspec-quantify` | `myspec-quantificar` | Julga as métricas do contrato de ferramentas no projeto inteiro em `quality-report.md` (`relatorio-de-qualidade.md`) e sugere melhorias que podem virar novas specs |
| `myspec-patch` | `myspec-corrigir` | Ajuste pequeno (até 3 arquivos) sem nova spec, inclusive dentro de uma spec já implementada |

Um ciclo típico é `prescribe > implement (árvore) > implement > inspect > implement > inspect > patch > inspect`: repita implement ou patch seguido de inspect até obter os resultados desejados. A spec está concluída quando a inspeção mais recente estiver `Ready`/`Apta` ou `Ready with observations`/`Apta com ressalvas`; o veredito não bloqueia nenhum skill. Use implement em vez de patch quando a mudança exigir mais de 3 arquivos ou afetar uma spec cuja árvore nunca foi aprovada.

As referências entre skills são geradas na sintaxe de cada agente: `$myspec-setup` no Codex e `/myspec-setup` no Claude Code.

## Reinstalação

- Rodar `install` de novo atualiza os skills gerenciados e é idempotente.
- Providers se acumulam: `install -p claude` depois de `install -p codex` mantém os dois.
- O idioma vale para todos os providers: trocar de `-l en` para `-l pt` remove os skills em inglês (somente os arquivos listados em `myspec.json`).
- Trocar de idioma renomeia o workspace para o novo idioma (`my-specs/coding-practices/` → `minhas-specs/praticas-de-codigo/`, `file-tree.md` → `arvore-de-arquivos.md` etc.) e traduz apenas as linhas de status e aprovação dos documentos, para que aprovações existentes continuem valendo; o corpo dos documentos não é traduzido. Um caminho cujo destino já existe não é movido. Workspaces `pt` criados em versões anteriores, ainda em `my-specs/`, são migrados da mesma forma na próxima instalação.
- O conteúdo dos documentos do workspace nunca é sobrescrito. O `README.md` do workspace só é regenerado enquanto não tiver sido editado.

## Desenvolvimento

```text
src/          código da CLI (TypeScript, sem dependências de runtime)
templates/
  skills/en/  skills em inglês
  skills/pt/  skills em português
  workspace/  README do workspace por idioma
  tooling/<id>/
    template.json  descrição por idioma
    files/         artefatos comuns a todos os idiomas
    en/ | pt/      artefatos por idioma (caminhos relativos à raiz do repositório)
samples/      exemplo de uso real em um projeto .NET
test/         testes end-to-end (node:test)
```

Nos templates, referências a outro skill usam o token `{{skill:<nome>}}`, trocado pelo prefixo de invocação do provider na instalação. Os nomes de pastas, arquivos e rótulos do workspace de cada idioma ficam em `src/languages.ts`. Para adicionar um provider, inclua uma entrada em `src/providers.ts`. Para adicionar um template de tooling, crie uma pasta em `templates/tooling/`; os artefatos aceitam os marcadores `{{solution}}`, `{{author}}` e `{{date}}`.

```bash
npm test
```
