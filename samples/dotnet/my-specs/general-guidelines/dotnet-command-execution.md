# Developer Execution of dotnet and Quality Workflow Commands

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-07-09

Applies to: All Myspec skills

## Rule

The AI must not run any `dotnet` command. The AI must ask the developer to run each required `dotnet` command and provide its output instead.

This restriction also applies to every script, task, alias, wrapper, or other command that invokes `dotnet` directly or indirectly. In particular, the AI must not run the repository quality-report workflows `bash quality/run-coverage-report.sh` or `pwsh -NoProfile -File quality/run-coverage-report.ps1`. The developer must run those workflows.

During `$myspec-quantify`, the AI must ask the developer to generate a new quality report with the approved repository workflow before continuing with metric analysis. The AI must wait for the developer to confirm that the workflow completed and provide its output. A pre-existing report does not satisfy this requirement for a new quantify request.

After the developer generates the report, the AI's role is limited to reading and scoping the generated metric artifacts, recording the measured results, and analyzing potential improvements. It must not build, test, collect coverage, generate the report, or otherwise execute any command that invokes `dotnet` as part of that analysis.

When asking the developer to run `dotnet` commands, present each command in its own code block so it can be copied individually. When two or more commands apply, also provide one final, separate code block containing all applicable commands in execution order for a single copy-and-paste run.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-07-09
- Approval context: Initial rule delegating `dotnet` command execution to the developer, with the former quantify exception.
- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-08-05
- Approval context: Approved mandatory developer execution of direct and wrapped `dotnet` workflows, including fresh quality-report generation before quantify analysis.
