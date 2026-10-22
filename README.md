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

Um template de tooling gera, junto com os skills, os artefatos para medir qualidade em `my-specs/measurement/` (`minhas-specs/medicao/`) e uma proposta já preenchida de um arquivo por métrica em `my-specs/metrics/` (`Status: Proposed`; em português, `minhas-specs/metricas/` com `Status: Proposto`). **A CLI não instala dependências**: cada template traz um README com os comandos para o desenvolvedor executar.

Os skills não supõem métricas: cada arquivo em `metrics/` (`metricas/`) é uma métrica, com status e aprovação próprios, e define tudo o que é preciso para medi-la — contexto de execução, comandos pré-requisito, ferramenta, comando, escopo, isolamento do código alterado, valores registrados — e seus portões (`## Gates`/`## Portões`): limite, se vale para o código alterado ou para o projeto, e efeito `Blocking`/`Bloqueante` ou `Attention`/`Atenção`. Os comandos de build e teste ficam na orientação geral `build-and-test-commands.md` (`comandos-de-build-e-teste.md`). Sem template de tooling, o skill de setup pergunta ao desenvolvedor quais métricas medir; um template apenas propõe um conjunto concreto para revisão.

```bash
myspec install -p claude -l pt -t dotnet-quality
```

`dotnet-quality` mede em .NET, com um script por grupo de métricas:

- complexidade ciclomática, cobertura de linhas/ramos, CRAP score e tamanho de módulo com Coverlet e ReportGenerator, em uma única execução de testes;
- acoplamento de tipos e membros com a regra CA1506 dos analisadores do SDK, ativada só nessa compilação;
- conformidade com as regras de dependência aprovadas, por testes de arquitetura do ArchUnitNET;
- pontuação de mutação com Stryker.NET, isolável pelos arquivos de uma spec;
- performance dos caminhos críticos aprovados (bytes alocados e tempo médio por operação) com BenchmarkDotNet.

```text
minhas-specs/                                      # -l pt (my-specs/ em -l en)
├── medicao/                                       # measurement/ em -l en, com os nomes em inglês
│   ├── README.md                                  # instalação das dependências e uso
│   ├── cobertura.runsettings                      # filtros de cobertura
│   ├── gerar-relatorio-de-cobertura.ps1/.sh       # restore → build → test → relatório
│   ├── medir-acoplamento.ps1/.sh                  # build Release com CA1506 → SARIF
│   ├── acoplamento.targets, .globalconfig         # ativam a CA1506 só nessa compilação
│   ├── CodeMetricsConfig.txt                      # limites de acoplamento
│   ├── executar-testes-de-arquitetura.ps1/.sh     # testes de arquitetura → TRX
│   ├── executar-testes-de-mutacao.ps1/.sh         # Stryker.NET → relatório JSON/HTML
│   ├── configuracao-do-stryker.json               # exclusões e limites da mutação
│   ├── executar-benchmarks.ps1/.sh                # benchmarks dos caminhos críticos em Release
│   ├── .gitignore                                 # ignora cobertura/ e benchmarks/ gerados
│   └── .gitattributes                             # mantém o .sh com LF
├── metricas/
│   ├── complexidade-ciclomatica.md                # portão: CC ≤ 15
│   ├── cobertura-de-testes.md
│   ├── crap-score.md                              # portão: CRAP ≤ 30
│   ├── tamanho-de-modulo.md                       # portões: método ≤ 30 e classe ≤ 300 linhas executáveis
│   ├── acoplamento.md                             # portões: tipo ≤ 95 e membro ≤ 40 tipos acoplados
│   ├── conformidade-de-dependencias.md            # portão bloqueante: nenhuma regra violada
│   ├── pontuacao-de-mutacao.md                    # portão: ≥ 60% no código alterado
│   └── performance.md                             # portões: orçamentos de alocação/tempo de cada caminho crítico
├── orientacoes-gerais/comandos-de-build-e-teste.md  # restore, build e testes com a solução detectada na raiz
├── orientacoes-gerais/regras-de-dependencia.md      # orientação proposta: regras de dependência entre camadas e módulos
└── orientacoes-gerais/<caminhos críticos>.md      # orientação proposta: caminhos críticos e seus orçamentos
```

A solução `.sln`/`.slnx` da raiz e a identidade `git config user.name`/`user.email` são preenchidas automaticamente; se não forem encontradas, a CLI avisa e deixa um marcador. Arquivos que já existem nunca são sobrescritos. Depois de instalar as dependências, rode o skill de setup (`myspec-setup`/`myspec-configurar`) para revisar e aprovar cada métrica.

## O que é gerado

```text
<repo>/
├── .codex/skills/myspec-*/     # -p codex: SKILL.md, assets/ e agents/openai.yaml
├── .claude/skills/myspec-*/    # -p claude: SKILL.md e assets/
└── my-specs/                   # minhas-specs/ em -l pt
    ├── README.md
    ├── myspec.json             # manifesto mantido pela CLI
    ├── metrics/                # metricas/: uma métrica por arquivo
    ├── measurement/            # medicao/: scripts de medição, gerados com -t
    ├── coding-practices/       # praticas-de-codigo/
    ├── general-guidelines/     # orientacoes-gerais/
    └── specs/
```

Métricas, práticas de código e orientações gerais são compartilhadas com o time e registram criador e aprovadores com `git config user.name`/`user.email`. As specs (`spec.md`, árvore de arquivos e inspeções) são um auxílio local do desenvolvedor: não registram identidade Git, apenas status e um histórico de revisões datado.

Na versão `pt`, todo o workspace fica em português: pastas (`metricas/`, `orientacoes-gerais/` etc.), arquivos gerados pelos skills (`relatorio-de-qualidade.md`, `arvore-de-arquivos.md`, `inspecoes/inspecao-NNN.md`), status (`Proposto`/`Aprovado`), metadados (`Criado por`, `Aprovado por`, `Histórico de aprovação`, `Histórico de revisões`), marcadores da árvore (`# adicionar`, `# modificar`, `# excluir`) e IDs (`CA-01`, `A-001`).

| Inglês (`en`) | Português (`pt`) | Função |
| --- | --- | --- |
| `myspec-setup` | `myspec-configurar` | Define as métricas de qualidade escolhidas pelo desenvolvedor e suas ferramentas, práticas e orientações |
| `myspec-prescribe` | `myspec-prescrever` | Cria uma spec testável em `specs/NNN-<nome>/` |
| `myspec-implement` | `myspec-implementar` | Propõe/aprova a árvore de arquivos e implementa a spec |
| `myspec-inspect` | `myspec-inspecionar` | Revisa a implementação contra a spec e as regras aprovadas, mede as métricas definidas em `metrics/` (`metricas/`), julga seus portões e registra em `specs/NNN-<nome>/inspections/` (`inspecoes/`) uma inspeção com veredito |
| `myspec-quantify` | `myspec-quantificar` | Julga as métricas de `metrics/` (`metricas/`) no projeto inteiro em `quality-report.md` (`relatorio-de-qualidade.md`) e sugere melhorias que podem virar novas specs |
| `myspec-patch` | `myspec-corrigir` | Ajuste pequeno (até 3 arquivos) sem nova spec, inclusive dentro de uma spec já implementada |

Um ciclo típico é `prescribe > implement (árvore) > implement > inspect > implement > inspect > patch > inspect`: repita implement ou patch seguido de inspect até obter os resultados desejados. A spec está concluída quando a inspeção mais recente estiver `Ready`/`Apta` ou `Ready with observations`/`Apta com ressalvas`; o veredito não bloqueia nenhum skill. Use implement em vez de patch quando a mudança exigir mais de 3 arquivos ou afetar uma spec cuja árvore nunca foi aprovada.

Os critérios de aceitação de `spec.md` seguem obrigatoriamente BDD: cada cenário tem ID estável (`AC-01`/`CA-01`), precondições `Given`/`Dado`, ação `When`/`Quando` e resultados observáveis `Then`/`Então`, com `And`/`E` quando necessário. Eles são a fonte única da verdade dos comportamentos mensuráveis da mudança em todo o fluxo. Todo resultado obrigatório ou meta específica da spec deve constar nesses critérios; resumo, escopo e suposições dão contexto e limites. Práticas, orientações e portões de métricas aprovados continuam como restrições de engenharia separadas.

A árvore de arquivos referencia cada ID e seus locais de produção e verificação. A implementação verifica todos os resultados do cenário e relata evidências por ID; a inspeção avalia esses mesmos cenários e só conta um critério como atendido quando todos os seus resultados tiverem evidência nas condições especificadas. Lacunas ou mudanças de comportamento voltam à prescrição antes da implementação afetada; a inspeção registra lacunas de contrato como bloqueantes. Não é necessário adotar executor Gherkin nem mudar convenções de nomes de teste. A instalação preserva specs existentes; sua adequação ocorre ao revisar o contrato pelo fluxo de prescrição.

Patching (`myspec-patch`/`myspec-corrigir`) é a exceção: um ajuste elegível de até três arquivos não precisa de nova spec nem critérios BDD. Mantêm-se seus portões de escopo e a obrigação de preservar o contrato de qualquer spec já implementada que tocar; mudar esse contrato exige revisar a spec.

As referências entre skills são geradas na sintaxe de cada agente: `$myspec-setup` no Codex e `/myspec-setup` no Claude Code.

## Reinstalação

- Rodar `install` de novo atualiza os skills gerenciados e é idempotente.
- Providers se acumulam: `install -p claude` depois de `install -p codex` mantém os dois.
- O idioma vale para todos os providers: trocar de `-l en` para `-l pt` remove os skills em inglês (somente os arquivos listados em `myspec.json`).
- Trocar de idioma renomeia o workspace para o novo idioma (`my-specs/coding-practices/` → `minhas-specs/praticas-de-codigo/`, `file-tree.md` → `arvore-de-arquivos.md` etc.) e traduz apenas as linhas de status e aprovação dos documentos, para que aprovações existentes continuem valendo; o corpo dos documentos não é traduzido. Um caminho cujo destino já existe não é movido. Workspaces `pt` criados em versões anteriores, ainda em `my-specs/`, são migrados da mesma forma na próxima instalação.
- A pasta `tooling/` (`ferramentas/`) criada na 0.4.0 é renomeada para `metrics/` (`metricas/`), sem alterar seu conteúdo.
- A pasta `quality/` que um template de tooling gerou na raiz do repositório até a 0.4.1 é movida para `my-specs/measurement/` (`minhas-specs/medicao/`). Scripts e configurações idênticos a uma versão publicada são substituídos pela atual, com os nomes do idioma instalado (`run-coverage-report.sh` vira `gerar-relatorio-de-cobertura.sh` em `pt`), e as pastas de resultados são renomeadas; os customizados são mantidos com o nome antigo e geram um aviso para ajustar caminhos e nome. Os caminhos `quality/` dos arquivos de métrica e das orientações gerais passam a apontar para os novos caminhos. Se as duas pastas existirem, nada é movido e a CLI avisa.
- Um `tooling.md` (`ferramentas.md`) de versões anteriores é mantido e gera um aviso: rode o skill de setup para dividi-lo em um arquivo por métrica.
- Os skills não leem mais `product-directives/` (`diretrizes-de-produto/`): a spec é a fonte da verdade do produto. Se a pasta só tiver o `.gitkeep` criado pela CLI até a 0.4.2, ela é removida; se tiver documentos, é mantida e a CLI avisa para movê-los e excluí-la.
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
