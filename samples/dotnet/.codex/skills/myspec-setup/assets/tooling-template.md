# Myspec Quality Tooling

Status: Proposed

Created by: `<git user.name> <git user.email>`

Created on: `<date>`

## Execution Context

- Working directory: `<repository-relative path>`
- Restore or bootstrap command: `<command or None>`
- Version source: `<tool manifest, lock file, project file, or explicit version>`

## Cyclomatic Complexity

- Tool: `<name>`
- Version: `<pinned version or controlled version source>`
- Installation or restore: `<command or repository mechanism>`
- Measurement command: `<exact command>`
- Output format: `<format>`
- Result path: `<repository-relative path>`
- Production scope: `<projects, paths, or changed-file selection>`
- Exclusions: `<generated code, patterns, or None>`
- Changed-code isolation: `<method for reporting the implementation under review>`

## Test Coverage

- Test runner: `<name>`
- Coverage collector: `<name>`
- Versions: `<pinned versions or controlled version sources>`
- Installation or restore: `<command or repository mechanism>`
- Build command: `<exact command>`
- Coverage command: `<exact command>`
- Report format: `<format including line and branch coverage support>`
- Result path: `<repository-relative path>`
- Production scope: `<projects, assemblies, or paths>`
- Test scope: `<test projects or selection>`
- Exclusions: `<generated code, patterns, or None>`
- Changed-code isolation: `<method for reporting the implementation under review>`

## Related Contract Documents

- Repository coding practices: `my-specs/coding-practices/*.md`
- General Myspec guidelines: `my-specs/general-guidelines/*.md`

## Decisions and Tradeoffs

- `<decision>`: <reason and rejected alternative, when relevant>.

## Approval History

- Approved by: `<git user.name> <git user.email>`
- Approved on: `<date>`
- Approval context: `<concise description of the approved contract or revision>`
