# Build and Test Commands

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-10-15

Applies to: All Myspec skills that build, test, inspect, or quantify the repository

## Rule

Verify the repository from its root with these commands, in order:

1. Restore: `dotnet restore Sample.slnx` followed by `dotnet tool restore`
2. Build: `dotnet build Sample.slnx --configuration Release --no-restore`
3. Test: `dotnet test Sample.slnx --configuration Release --no-build`

Run them before measuring any metric under `my-specs/tooling/`. The coverage workflow `quality/run-coverage-report` runs the same tests, so its test results may stand in for step 3 of the same baseline. Every command is run by the developer, as `my-specs/general-guidelines/dotnet-command-execution.md` requires.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-10-15
- Approval context: Moved the restore and build commands from the single-file `my-specs/tooling.md` approved on 2026-07-28 and added the plain test command.
