# myspec

[Português](README.md) · **English**

A spec-driven development (SDD) CLI for coding agents (Codex, Claude Code, and Gemini). It installs the Myspec skills into your repository, which drive the prescribe → implement → inspect cycle, along with the `my-specs/` workspace (`minhas-specs/` in Portuguese), where the specs and the rules your team approves for the agents live. Deterministic commands handle what should not depend on the LLM: approvals, the spec lifecycle, builds, tests, and metrics.

## Installation

You need Node.js 20 or later. Download the 0.7.28 package and run the commands below from the folder where you saved it. [Download myspec-0.7.28.tgz](https://github.com/raelsonraujo/myspec/releases/download/v0.7.28/myspec-0.7.28.tgz)

```bash
npm install -g --ignore-scripts ./myspec-0.7.28.tgz
myspec --version
```

To check the file's origin and integrity before installing, use the [GitHub CLI](https://cli.github.com/manual/gh_release_verify-asset):

```bash
gh release verify-asset v0.7.28 ./myspec-0.7.28.tgz --repo raelsonraujo/myspec
```

## Setting up a repository: `myspec install`

At the root of the repository, pick the agent and the language:

```bash
myspec install -p claude -l en
```

| Option | Values | Description |
| --- | --- | --- |
| `-p, --provider` | `codex`, `claude`, `gemini`, or a combination (`codex,claude`) | Agent that receives the skills. Repeatable. |
| `-l, --language` | `en`, `pt` | Language of the skills and the workspace. |
| `-t, --tooling` | `dotnet-quality` | Initial quality measurement template (optional). |
| `-d, --dir` | path | Target repository (default: current directory). |

The command creates:

```text
<repo>/
├── .claude/skills/myspec-*/    # .codex/skills/ for Codex, .agents/skills/ for Gemini
└── my-specs/                   # minhas-specs/ in Portuguese
    ├── metrics/                # one quality metric per file
    ├── coding-practices/       # practices approved by the team
    ├── general-guidelines/     # guidelines approved by the team
    └── specs/                  # one NNN-<name>/ folder per spec, with spec.md, file tree, and inspections
```

And installs these skills:

| English | Portuguese | What it does |
| --- | --- | --- |
| `myspec-setup` | `myspec-configurar` | Defines metrics, coding practices, and general guidelines with the developer. |
| `myspec-prescribe` | `myspec-prescrever` | Writes a spec with BDD acceptance criteria (`AC-01`, `AC-02`...). |
| `myspec-implement` | `myspec-implementar` | Plans the file tree, activates the spec, and implements it. |
| `myspec-inspect` | `myspec-inspecionar` | Checks the implementation against the spec and the rules and records an inspection with a verdict. |
| `myspec-patch` | `myspec-corrigir` | Makes a small fix (up to 5 files by default) without a new spec. |
| `myspec-quantify` | `myspec-quantificar` | Measures the metrics across the whole project and suggests improvements. |
| `myspec-audit` | `myspec-auditar` | Audits the whole project against the approved practices and guidelines. |

Invoke a skill with `$myspec-setup` in Codex or `/myspec-setup` in Claude Code and Gemini. After installing, start with the setup skill, then prescribe your first spec.

After upgrading the CLI, run `myspec install` in each repository to refresh the skills and the default workspace README. The update preserves specs, contract documents, and customized READMEs. Without `-p` or `-l`, the command reuses the installed values. Providers accumulate, and switching the language renames the workspace to the new language. With `-t dotnet-quality`, the CLI also generates .NET measurement scripts (coverage, complexity, CRAP, coupling, mutation, and performance), a proposed set of metrics for review, and a README with commands to install the dependencies.

## Commands

In commands that take a spec, the spec comes first and the command after it (`myspec 1 gate`). `<spec>` accepts the folder name (`001-cancel-order`) or just the number (`1` or `001`). All commands accept `-d <dir>` to target another repository. Every command also has a Portuguese name; called by it, the command answers in Portuguese. `--json` output keeps its keys in English, for scripts and CI.

`read`, `inspection`, `rule`, and `metric` omit history sections by default. Use `-h` or `--historico` with these commands to print only the history. Use `--help` to see usage.

### `myspec list` (`listar`)

Lists all specs in numeric order, one per line as `NNN - title [status]`. It uses the title from `spec.md` or falls back to the folder name without its numeric prefix. The status comes from the lifecycle manifest. Specs without a manifest entry appear as `unregistered`.

Use `--filter` or `-f` with the desired statuses separated by commas. Both `list` and `listar` accept English and Portuguese status names.

```bash
myspec list --filter active,finished
myspec list -f proposed,unregistered
```

### `myspec approve <path>` (`aprovar`)

Approves a document in `metrics/`, `coding-practices/`, or `general-guidelines/`: it changes the status to `Approved` and records in the history who approved it (using the `git config` identity), when, and why.

```bash
myspec approve metrics/crap-score.md -c "Initial approval"
```

### `myspec <spec> activate` (`ativar`)

Moves the spec from `proposed` to `active` in the manifest and records the current commit as its base. The implement skill does this before the first edit; the `gate` later uses the base to compare what changed.

```bash
myspec 1 activate
```

### `myspec [<spec>] gate` (`portao` or `portão`)

Runs the approved build, test, and metric commands, plus the automated checks declared in the approved practices and guidelines, reads the generated reports (Cobertura, SARIF, TRX, Stryker, and JSON), and judges each metric's thresholds. For an active spec, it also flags files changed outside the planned file tree. It exits with an error code on blocking failures, so it works in CI too.

- `--project`: evaluates the metrics for the whole project instead of a spec.
- `--skip-run` / `--skip-build`: reuses existing reports or skips build and tests.
- `--json`: machine-readable output.

```bash
myspec 1 gate
myspec gate --project
```

Each command's output goes to `.myspec/logs/`.

### `myspec <spec> finish` (`finalizar`)

Finalizes an active spec after confirming that the latest inspection is `Ready` (or `Ready with observations`) and that the latest full `gate` passed on the current commit, with no pending changes. `--force` accepts another commit or pending changes, but a passing `gate` is still required. A finished spec is frozen: later changes need a new spec.

```bash
myspec 1 finish
```

### `myspec check-patch` (`conferir-correcao`)

Tells whether the current Git changes can go ahead as a patch: at most 5 files (`--limit <N>` changes the limit) and no finished or proposed specs touched. The patch skill uses it to decide whether a fix needs a spec.

### `myspec <spec> open` (`abre` or `abrir`)

Opens the spec's `spec.md` in VS Code. With `-ft` or `--file-tree`, it opens the spec's file tree instead. To use another editor, set `MYSPEC_EDITOR` (for example, `cursor` or `code -r`).

```bash
myspec 7 open
myspec 7 open -ft
```

### `myspec <spec> criteria [<N>]` (`criterio` or `critério`)

Prints the spec's acceptance criteria in the terminal, one per line, with their number and title. Given a criterion number, it prints only that criterion with its full description (Given/When/Then). It helps find a criterion without reading the whole spec, for developers and agents alike.

```bash
myspec 1 criteria        # AC-01: ..., AC-02: ...
myspec 1 criteria 5      # AC-05 with its description
```

The number must be exact: `5`, `05`, and `AC-05` all point to the same criterion.

### `myspec <spec> read` (`ler`)

Prints `spec.md` in the terminal. Use `--file-tree` (`-ft`) to print the file tree or `--smoke` (`-s`) to read only the spec's smoke section. Combine `-h` with `-ft` to read the file tree's revision history when it has one.

```bash
myspec 1 read
myspec 1 read -s
myspec 1 read --historico
myspec 1 read -ft
myspec 1 read -ft -h
```

### `myspec <spec> inspection` (`inspecao` or `inspeção`)

Prints the spec's latest inspection. Use `--status` (`-s`) for the verdict, `--findings` (`-f`) for current findings, or `--historico` (`-h`) for `Previous Findings` and any other history sections in the inspection.

```bash
myspec 1 inspection
myspec 1 inspection -s
myspec 1 inspection -f
myspec 1 inspection -h
```

### `myspec rule [<name>] [--full | -f]` (`regra`)

Lists the files under `coding-practices/` and `general-guidelines/`. Pass a name or relative path to read one rule or use `--full` (`-f`) to print every rule. Use `-h` to read only the `Approval History` for a named rule, or omit the name to read the approval histories of all rules.

```bash
myspec rule
myspec rule clean-code
myspec rule -f
myspec rule clean-code -h
```

### `myspec metric [<name>] [--full | -f]` (`metrica` or `métrica`)

Lists the files under `metrics/`. Pass a name or relative path to read one metric or use `--full` (`-f`) to print every metric. Use `-h` to read only the `Approval History` for a named metric, or omit the name to read the approval histories of all metrics.

```bash
myspec metric
myspec metric crap-score
myspec metric -f
myspec metric -h
```

## License

[MIT](LICENSE)
