# Cyclomatic Complexity

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-10-15

## Definition

Cyclomatic complexity of each developer-controlled method, summarized by class and assembly.

## Execution Context

- Working directory: repository root
- Restore or bootstrap command: `dotnet restore Sample.slnx` followed by `dotnet tool restore`
- Prerequisite commands: `dotnet build Sample.slnx --configuration Release --no-restore`
- Version source: test project package references for `coverlet.collector`; `.config/dotnet-tools.json` for ReportGenerator
- Shared run: one coverage workflow measures this metric, Test Coverage, and CRAP Score; the developer runs it once, as `my-specs/general-guidelines/dotnet-command-execution.md` requires
- Generated results root: `my-specs/measurement/`

## Measurement

- Tool: method, class, and assembly `complexity` values in Coverlet's Cobertura XML, visualized by ReportGenerator
- Version: `coverlet.collector` `6.0.4`; ReportGenerator `5.5.10`
- Installation or restore: `dotnet restore Sample.slnx`; `dotnet tool restore`
- Measurement command: `pwsh -NoProfile -File my-specs/measurement/run-coverage-report.ps1` or `bash my-specs/measurement/run-coverage-report.sh`
- Output format: Cobertura XML `complexity` attributes; HTML report
- Result path: `my-specs/measurement/coverage/report/Cobertura.xml`; `my-specs/measurement/coverage/report/index.html`
- Scope: same as `my-specs/metrics/test-coverage.md`
- Exclusions: same as `my-specs/metrics/test-coverage.md`
- Changed-code isolation: use production paths from `my-specs/specs/<spec-name>/file-tree.md` to filter the merged Cobertura report; report method and class cyclomatic-complexity values alongside affected-project totals, keeping the containing-type complexity visible when method extraction materially affects interpretation
- Reported values: highest cyclomatic complexity among methods (with the member) and the number of methods above 15

## Gates

| Reported value | Threshold | Applies to | Enforcement |
| --- | --- | --- | --- |
| Highest cyclomatic complexity among methods | `≤ 15` | Both | Attention |
| Methods above 15 | `= 0`, except methods tolerated below | Both | Attention |

These targets match the green boundary of the repository-pinned ReportGenerator 5.5.10 configuration. Treat 15 as the upper boundary of the normal range, not as a value methods should approach; a method with lower complexity is not inherently deficient or in need of additional branching. Read this gate together with the CRAP Score gate using this repository review policy:

- a method with complexity from 16 through 25 is tolerated when its CRAP score is 30 or lower, its relevant decision paths have meaningful automated coverage, and its branching represents one cohesive responsibility;
- a method with complexity above 25 remains an improvement candidate regardless of CRAP score because coverage does not remove the comprehension and maintenance cost of excessive branching;
- complexity does not improve merely because branches moved into arbitrary helper methods; extracted methods must have cohesive, behavior-oriented responsibilities.

Prefer naturally lower complexity when it follows from a clear, cohesive design, but never at the expense of readability, cohesion, or useful domain structure.

## Related Contract Documents

- `my-specs/metrics/crap-score.md`, which combines this metric with line coverage
- `my-specs/general-guidelines/dotnet-command-execution.md`

## Decisions and Tradeoffs

- Use Coverlet's Cobertura complexity values and ReportGenerator's HTML visualization: this removes a redundant metrics tool while retaining method, class, and assembly cyclomatic complexity alongside coverage.
- Exclude Entity Framework migrations and generated files: their generated branching would distort developer-controlled implementation metrics.
- Use `Attention` gates: a value outside the normal range is an improvement signal, not an automatic build failure or implementation nonconformance, unless an approved specification makes the target mandatory.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-10-15
- Approval context: Split from the single-file `my-specs/tooling.md` approved on 2026-07-28; gates carried over from `method-complexity-risk-targets.md` approved on 2026-08-26, including the CC 16-through-25 tolerance band.
