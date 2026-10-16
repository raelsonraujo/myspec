# <Metric Name>

Status: Proposed

Created by: `<git user.name> <git user.email>`

Created on: `<date>`

## Definition

<What the metric measures, its unit, and its granularity, such as per method, per file, or project total.>

## Execution Context

- Working directory: `<repository-relative path>`
- Restore or bootstrap command: `<command or None>`
- Prerequisite commands: `<build or other commands that must succeed before measuring, in order, or None>`
- Version source: `<tool manifest, lock file, project file, or explicit version>`

## Measurement

- Tool: `<name>`
- Version: `<pinned version or controlled version source>`
- Installation or restore: `<command or repository mechanism>`
- Measurement command: `<exact command>`
- Output format: `<format>`
- Result path: `<repository-relative path>`
- Scope: `<projects, paths, or selection>`
- Exclusions: `<generated code, patterns, or None>`
- Changed-code isolation: `<method for reporting the implementation under review>`
- Reported values: `<values every inspection and quality report records, e.g. a project total and the worst location>`

## Gates

<One row per target the developer approved for a reported value, or `None`. Never infer a threshold.>

| Reported value | Threshold | Applies to | Enforcement |
| --- | --- | --- | --- |
| <reported value> | `<comparison and limit>` | <Changed code / Project / Both> | <Blocking / Attention> |

<Optional: how to read the gates together or exceptions the developer approved.>

## Related Contract Documents

- `<approved general guideline this metric depends on, or None>`

## Decisions and Tradeoffs

- `<decision>`: <reason and rejected alternative, when relevant>.

## Approval History

- Approved by: `<git user.name> <git user.email>`
- Approved on: `<date>`
- Approval context: `<concise description of the approved metric or revision>`
