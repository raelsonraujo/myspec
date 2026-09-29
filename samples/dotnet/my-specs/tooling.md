# Myspec Quality Tooling

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-07-09

## Execution Context

- Working directory: repository root
- Repository restore command: `dotnet restore Sample.slnx`
- Local tool restore command: `dotnet tool restore`
- Version sources:
  - test project package references for `coverlet.collector` and `Microsoft.NET.Test.Sdk`;
  - `.config/dotnet-tools.json` for ReportGenerator.
- Generated results root: `quality/`

## Test Coverage and Cyclomatic Complexity

- Test runner: VSTest through `dotnet test`
- Coverage collector: `coverlet.collector`
- Cyclomatic-complexity source: method, class, and assembly `complexity` values in Coverlet's Cobertura XML
- Report generator: ReportGenerator, which visualizes line coverage, branch coverage, and cyclomatic complexity from the Cobertura XML in one HTML report
- Versions:
  - `coverlet.collector` `6.0.4`, pinned in each test project;
  - `Microsoft.NET.Test.Sdk` `17.14.1`, pinned in each test project;
  - ReportGenerator `5.5.10`, pinned in `.config/dotnet-tools.json`.
- Installation or restore:
  - existing collector and test SDK packages: `dotnet restore Sample.slnx`;
  - ReportGenerator: `dotnet tool restore`.
- Build command: `dotnet build Sample.slnx --configuration Release --no-restore`
- Coverage collection command: `dotnet test Sample.slnx --configuration Release --no-build --settings quality/coverlet.runsettings --collect:"XPlat Code Coverage" --results-directory quality/coverage/raw`
- Report command: `dotnet reportgenerator -reports:"quality/coverage/raw/**/coverage.cobertura.xml" -targetdir:"quality/coverage/report" -reporttypes:"Html;JsonSummary;Cobertura"`
- PowerShell coverage workflow: `pwsh -NoProfile -File quality/run-coverage-report.ps1`
- Bash coverage workflow: `bash quality/run-coverage-report.sh`
- Report format: Cobertura XML for line, branch, and cyclomatic-complexity data; JSON summary for machine-readable coverage aggregation; and HTML for developer inspection of all three metrics
- Result paths:
  - raw: `quality/coverage/raw/`
  - merged: `quality/coverage/report/Cobertura.xml`
  - summary: `quality/coverage/report/Summary.json`
  - HTML: `quality/coverage/report/index.html`
- Production scope: all assemblies matching `[Sample.*]*` that are instrumented by at least one test project; the explicit include filter ensures standalone UI assemblies such as `Sample.Web.UI` are collected.
- Test scope: all solution projects matching `Sample.*.xUnit.*/*.csproj`; future matching test projects are included automatically.
- Exclusions:
  - all test assemblies;
  - `**/bin/**` and `**/obj/**`;
  - `**/Migrations/**`;
  - `**/*.g.cs`, `**/*.Designer.cs`, `**/*.generated.cs`, and generated assembly metadata.
- Changed-code isolation: use production paths from `my-specs/specs/<spec-name>/file-tree.md` to filter the merged Cobertura report; report changed-file covered and total line/branch counts plus method/class cyclomatic-complexity values alongside affected-project totals.

## Related Contract Documents

- Repository coding practices: `my-specs/coding-practices/*.md`
- General Myspec guidelines: `my-specs/general-guidelines/*.md`

## Decisions and Tradeoffs

- Retain VSTest and `coverlet.collector` `6.0.4`: this matches all current test projects and avoids combining quality setup with a test-platform or collector upgrade.
- Include `[Sample.*]*` in the Coverlet collector configuration, then exclude `[Sample.*.xUnit.*]*`: this makes the production-assembly scope explicit and captures standalone UI assemblies without collecting test assemblies or third-party dependencies.
- Use repository-local ReportGenerator `5.5.10`: local tool pinning gives developers and CI the same aggregation behavior without relying on a globally installed executable.
- Use Coverlet's Cobertura complexity values and ReportGenerator's HTML visualization: this removes a redundant metrics tool while retaining method, class, and assembly cyclomatic complexity alongside coverage.
- Generate both scoped and project-level results: spec-scoped metrics answer whether the implementation is healthy, while project totals reveal surrounding context.
- Apply no pass/fail thresholds: Myspec records measurements and improvement suggestions until the developer explicitly adopts quality gates.
- Exclude Entity Framework migrations and generated files: their generated branching and volume would distort developer-controlled implementation metrics.

## Required Repository Setup After Approval

- Add `.config/dotnet-tools.json` with ReportGenerator `5.5.10`.
- Add `quality/coverlet.runsettings` containing `<Include>[Sample.*]*</Include>`, the approved test-assembly exclusion, and the approved file exclusions.
- Add `quality/run-coverage-report.ps1` and `quality/run-coverage-report.sh` to run the complete coverage workflow and open its HTML report.
- Add generated `quality/coverage/` results to `.gitignore` without ignoring the versioned scripts and runsettings file.
- Verify output filenames and commands against restored tool versions before the first `$myspec-quantify` run.

## Approval

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-07-28
