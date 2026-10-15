# CRAP Score

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-10-15

## Definition

Change risk of each developer-controlled method, combining cyclomatic complexity and line coverage: `CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)`, where `CC` is the method's cyclomatic complexity and `cov` its measured line coverage as a fraction.

## Execution Context

- Working directory: repository root
- Restore or bootstrap command: `dotnet restore Sample.slnx` followed by `dotnet tool restore`
- Prerequisite commands: `dotnet build Sample.slnx --configuration Release --no-restore`
- Version source: `.config/dotnet-tools.json` for ReportGenerator; test project package references for `coverlet.collector`
- Shared run: one coverage workflow measures this metric, Test Coverage, and Cyclomatic Complexity; the developer runs it once, as `my-specs/general-guidelines/dotnet-command-execution.md` requires
- Generated results root: `my-specs/measurement/`

## Measurement

- Tool: ReportGenerator, which computes the score per method from the Cobertura complexity and coverage data collected by Coverlet
- Version: ReportGenerator `5.5.10`; `coverlet.collector` `6.0.4`
- Installation or restore: `dotnet tool restore`
- Measurement command: `pwsh -NoProfile -File my-specs/measurement/run-coverage-report.ps1` or `bash my-specs/measurement/run-coverage-report.sh`
- Output format: the Risk Hotspots section of the HTML report
- Result path: `my-specs/measurement/coverage/report/index.html`
- Scope: same as `my-specs/metrics/test-coverage.md`
- Exclusions: same as `my-specs/metrics/test-coverage.md`
- Changed-code isolation: same as `my-specs/metrics/cyclomatic-complexity.md`
- Reported values: highest CRAP score among methods (with the member) and the number of methods above 30

## Gates

| Reported value | Threshold | Applies to | Enforcement |
| --- | --- | --- | --- |
| Highest CRAP score among methods | `≤ 30` | Both | Attention |
| Methods above 30 | `= 0` | Both | Attention |

This target matches the green boundary of the repository-pinned ReportGenerator 5.5.10 configuration. A method above 30 remains an improvement candidate because its combination of complexity and measured coverage presents elevated change risk.

For every method above this gate or the Cyclomatic Complexity gate, report both measured values and the relevant coverage evidence, and classify it using the repository review policy in `my-specs/metrics/cyclomatic-complexity.md`. Distinguish that classification from ReportGenerator's colors, which evaluate each metric independently and keep showing complexity above 15 as elevated even when a method qualifies for the 16-through-25 tolerance band.

## Related Contract Documents

- `my-specs/metrics/cyclomatic-complexity.md`
- `my-specs/metrics/test-coverage.md`

## Decisions and Tradeoffs

- Read the score from ReportGenerator instead of computing it: the report uses the same complexity and coverage data the other metrics record.
- Use `Attention` gates: an elevated score is an improvement signal, not an automatic build failure or implementation nonconformance, unless an approved specification makes the target mandatory.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-10-15
- Approval context: Created from `method-complexity-risk-targets.md` approved on 2026-08-26, keeping the CRAP 30 target and the joint CC and CRAP review policy.
