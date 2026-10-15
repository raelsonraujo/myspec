# Test Coverage

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-10-15

## Definition

Share of production lines and branches executed by the tests, per file, class, and assembly.

## Execution Context

- Working directory: repository root
- Restore or bootstrap command: `dotnet restore Sample.slnx` followed by `dotnet tool restore`
- Prerequisite commands: `dotnet build Sample.slnx --configuration Release --no-restore`
- Version source: test project package references for `coverlet.collector` and `Microsoft.NET.Test.Sdk`; `.config/dotnet-tools.json` for ReportGenerator
- Shared run: one coverage workflow measures this metric, Cyclomatic Complexity, and CRAP Score; the developer runs it once, as `my-specs/general-guidelines/dotnet-command-execution.md` requires
- Generated results root: `quality/`

## Measurement

- Test runner: VSTest through `dotnet test`
- Tool: `coverlet.collector`, aggregated by ReportGenerator
- Version: `coverlet.collector` `6.0.4` and `Microsoft.NET.Test.Sdk` `17.14.1`, pinned in each test project; ReportGenerator `5.5.10`, pinned in `.config/dotnet-tools.json`
- Installation or restore: `dotnet restore Sample.slnx` for the collector and test SDK packages; `dotnet tool restore` for ReportGenerator
- Measurement command: `pwsh -NoProfile -File quality/run-coverage-report.ps1` or `bash quality/run-coverage-report.sh`, which run:
  - coverage: `dotnet test Sample.slnx --configuration Release --no-build --settings quality/coverlet.runsettings --collect:"XPlat Code Coverage" --results-directory quality/coverage/raw`
  - report: `dotnet reportgenerator -reports:"quality/coverage/raw/**/coverage.cobertura.xml" -targetdir:"quality/coverage/report" -reporttypes:"Html;JsonSummary;Cobertura"`
- Output format: Cobertura XML for line and branch data; JSON summary for machine-readable aggregation; HTML for developer inspection
- Result path:
  - raw: `quality/coverage/raw/`
  - merged: `quality/coverage/report/Cobertura.xml`
  - summary: `quality/coverage/report/Summary.json`
  - HTML: `quality/coverage/report/index.html`
- Scope: all assemblies matching `[Sample.*]*` that are instrumented by at least one test project, measured by all solution projects matching `Sample.*.xUnit.*/*.csproj`; the explicit include filter ensures standalone UI assemblies such as `Sample.Web.UI` are collected, and future matching test projects are included automatically
- Exclusions:
  - all test assemblies;
  - `**/bin/**` and `**/obj/**`;
  - `**/Migrations/**`;
  - `**/*.g.cs`, `**/*.Designer.cs`, `**/*.generated.cs`, and generated assembly metadata.
- Changed-code isolation: use production paths from `my-specs/specs/<spec-name>/file-tree.md` to filter the merged Cobertura report; report changed-file covered and total line and branch counts alongside affected-project totals
- Reported values: line coverage and branch coverage, with covered over total and percentage

## Gates

None.

## Related Contract Documents

- `my-specs/tooling/crap-score.md`, which combines this metric with cyclomatic complexity
- `my-specs/general-guidelines/dotnet-command-execution.md`, which assigns every `dotnet` command and coverage workflow run to the developer

## Decisions and Tradeoffs

- Retain VSTest and `coverlet.collector` `6.0.4`: this matches all current test projects and avoids combining quality setup with a test-platform or collector upgrade.
- Include `[Sample.*]*` in the Coverlet collector configuration, then exclude `[Sample.*.xUnit.*]*`: this makes the production-assembly scope explicit and captures standalone UI assemblies without collecting test assemblies or third-party dependencies.
- Use repository-local ReportGenerator `5.5.10`: local tool pinning gives developers and CI the same aggregation behavior without relying on a globally installed executable.
- Generate both scoped and project-level results: spec-scoped metrics answer whether the implementation is healthy, while project totals reveal surrounding context.
- Exclude Entity Framework migrations and generated files: their generated volume would distort developer-controlled implementation metrics.
- Define no coverage gate: coverage risk is judged per method through the CRAP Score gate instead of a project-wide percentage.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-10-15
- Approval context: Split from the single-file `my-specs/tooling.md` approved on 2026-07-28, with its coverage commands, scope, and exclusions unchanged.
