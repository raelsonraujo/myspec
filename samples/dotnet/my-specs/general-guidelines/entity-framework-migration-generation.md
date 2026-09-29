# Entity Framework Migration Generation

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-07-29

Applies to: All Myspec skills

## Rule

Do not create, edit, or hand-author Entity Framework Core migration files, migration designer files, or `DbContext` model snapshots through LLM-generated code.

When an approved change requires a migration, the AI may identify the need and suggest the exact `dotnet ef` command. Unless the developer has explicitly authorized AI execution of that command, the AI must ask the developer to run it and provide the output. The generated migration artifacts are then reviewed as command output rather than authored by the AI.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-07-29
- Approval context: Initial rule requiring developer-generated Entity Framework migrations through explicit `dotnet ef` commands.
