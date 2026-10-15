# Myspec Quality Tooling

Status: Proposed

Created by: `<git user.name> <git user.email>`

Created on: `<date>`

## Execution Context

- Working directory: `<repository-relative path>`
- Restore or bootstrap command: `<command or None>`
- Version source: `<tool manifest, lock file, project file, or explicit version>`

## Verification

- Build command: `<exact command or None>`
- Test command: `<exact command or None>`

## Metrics

<One subsection per metric the developer defined, and nothing else. Write `None` when the developer defined no metric.>

### <Metric name>

- Definition: `<what it measures, unit, and granularity>`
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
- Interpretation: `<approved guideline under my-specs/general-guidelines/ that defines targets, or None>`

## Related Contract Documents

- Repository coding practices: `my-specs/coding-practices/*.md`
- General Myspec guidelines: `my-specs/general-guidelines/*.md`

## Decisions and Tradeoffs

- `<decision>`: <reason and rejected alternative, when relevant>.

## Approval History

- Approved by: `<git user.name> <git user.email>`
- Approved on: `<date>`
- Approval context: `<concise description of the approved contract or revision>`
