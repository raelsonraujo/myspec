# Build and Test Commands

Status: Proposed

Created by: `{{author}}`

Created on: `{{date}}`

Applies to: All Myspec skills that build, test, inspect, or quantify the repository

## Rule

Verify the repository from its root with these commands, in order:

1. Restore: `dotnet restore {{solution}}` followed by `dotnet tool restore`
2. Build: `dotnet build {{solution}} --configuration Release --no-restore`
3. Test: `dotnet test {{solution}} --configuration Release --no-build`

Run them before measuring any metric under `my-specs/tooling/`. When a metric's measurement command already runs the same tests, such as `quality/run-coverage-report`, its test results may stand in for step 3 of the same baseline.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- None yet.
