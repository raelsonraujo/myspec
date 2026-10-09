# myspec

CLI de desenvolvimento orientado a especificações (SDD) para agentes de código, no estilo do [spec-kit](https://github.com/github/spec-kit) e do [OpenSpec](https://github.com/Fission-AI/OpenSpec). Ela instala no repositório um conjunto de skills Myspec e o workspace `my-specs/`, onde o time estabelece e aprova as regras que os agentes devem seguir.

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

Sem `-p`/`-l` em um terminal interativo, a CLI pergunta os valores. Se o repositório já tiver `my-specs/myspec.json`, eles assumem os valores instalados; assim, `myspec install -t dotnet-quality` adiciona o tooling a uma instalação existente.

## Templates de tooling

Um template de tooling gera, junto com os skills, os artefatos para medir qualidade e uma proposta de `my-specs/tooling.md` (`Status: Proposed`) já preenchida. **A CLI não instala dependências**: cada template traz um README com os comandos para o desenvolvedor executar.

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
my-specs/
├── tooling.md                                     # contrato proposto, com a solução detectada na raiz
├── general-guidelines/<metas de CC e CRAP>.md     # orientação proposta: CC ≤ 15 e CRAP ≤ 30
└── general-guidelines/<caminhos críticos>.md      # orientação proposta: caminhos críticos e orçamentos de alocação/tempo
```

A solução `.sln`/`.slnx` da raiz e a identidade `git config user.name`/`user.email` são preenchidas automaticamente; se não forem encontradas, a CLI avisa e deixa um marcador. Arquivos que já existem nunca são sobrescritos. Depois de instalar as dependências, rode o skill de setup (`myspec-setup`/`myspec-configurar`) para revisar e aprovar o contrato.

## O que é gerado

```text
<repo>/
├── .codex/skills/myspec-*/     # -p codex: SKILL.md, assets/ e agents/openai.yaml
├── .claude/skills/myspec-*/    # -p claude: SKILL.md e assets/
└── my-specs/
    ├── README.md
    ├── myspec.json             # manifesto mantido pela CLI
    ├── product-directives/
    ├── coding-practices/
    ├── general-guidelines/
    └── specs/
```

| Inglês (`en`) | Português (`pt`) | Função |
| --- | --- | --- |
| `myspec-setup` | `myspec-configurar` | Define ferramentas de qualidade, diretrizes de produto, práticas e orientações |
| `myspec-prescribe` | `myspec-prescrever` | Cria uma spec testável em `my-specs/specs/NNN-<nome>/` |
| `myspec-implement` | `myspec-implementar` | Propõe/aprova a árvore de arquivos e implementa a spec |
| `myspec-inspect` | `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede cobertura e complexidade e registra em `specs/NNN-<nome>/inspections/` uma inspeção com veredito |
| `myspec-quantify` | `myspec-quantificar` | Julga complexidade ciclomática e cobertura de testes do projeto inteiro em `my-specs/quality-report.md` e sugere melhorias que podem virar novas specs |
| `myspec-patch` | `myspec-corrigir` | Ajuste pequeno (até 3 arquivos) sem nova spec, inclusive dentro de uma spec já implementada |

Um ciclo típico é `prescribe > implement (árvore) > implement > inspect > implement > inspect > patch > inspect`: repita implement ou patch seguido de inspect até obter os resultados desejados. A spec está concluída quando a inspeção mais recente estiver `Ready`/`Apta` ou `Ready with observations`/`Apta com ressalvas`; o veredito não bloqueia nenhum skill. Use implement em vez de patch quando a mudança exigir mais de 3 arquivos ou afetar uma spec cuja árvore nunca foi aprovada.

As referências entre skills são geradas na sintaxe de cada agente: `$myspec-setup` no Codex e `/myspec-setup` no Claude Code.

## Reinstalação

- Rodar `install` de novo atualiza os skills gerenciados e é idempotente.
- Providers se acumulam: `install -p claude` depois de `install -p codex` mantém os dois.
- O idioma vale para todos os providers: trocar de `-l en` para `-l pt` remove os skills em inglês (somente os arquivos listados em `my-specs/myspec.json`).
- Documentos em `my-specs/` nunca são sobrescritos. O `my-specs/README.md` só é regenerado enquanto não tiver sido editado.

## Desenvolvimento

```text
src/          código da CLI (TypeScript, sem dependências de runtime)
templates/
  skills/en/  skills em inglês
  skills/pt/  skills em português
  workspace/  README do my-specs por idioma
  tooling/<id>/
    template.json  descrição por idioma
    files/         artefatos comuns a todos os idiomas
    en/ | pt/      artefatos por idioma (caminhos relativos à raiz do repositório)
samples/      exemplo de uso real em um projeto .NET
test/         testes end-to-end (node:test)
```

Nos templates, referências a outro skill usam o token `{{skill:<nome>}}`, trocado pelo prefixo de invocação do provider na instalação. Para adicionar um provider, inclua uma entrada em `src/providers.ts`. Para adicionar um template de tooling, crie uma pasta em `templates/tooling/`; os artefatos aceitam os marcadores `{{solution}}`, `{{author}}` e `{{date}}`.

```bash
npm test
```
