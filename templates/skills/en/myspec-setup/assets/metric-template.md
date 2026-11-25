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

## Machine Contract

List each measurement step (cleanup, restore, build, tool run) in order under `commands`, so the block shows how the metric is measured. `myspec gate` runs the steps in order and stops at the first failure. For several metrics measured by the same run, give them all the same `"label"`: the gate runs the steps of the first one and the others reuse its outcome, including a `verify` block with the same label. Without a label, each block runs its own steps. When the steps run the tests, declare `testResults` with the result format and paths, so the gate enforces passing tests. A single step may use `command` instead. For a slow measurement run only when a change affects it (such as benchmarks), set `"runOnGate": false`: the block still shows the steps, and `myspec gate` does not run them.

```json myspec
{
  "kind": "metric",
  "workingDir": ".",
  "commands": ["<each measurement step, in order: exact command or { \"win32\": \"...\", \"posix\": \"...\" }>"],
  "format": "<supported parser format or manual>",
  "resultPaths": ["<repository-relative path or glob>"],
  "gates": [
    { "metric": "<metric key or json value name>", "label": "<reported value>", "op": "<= | >= | = | < | >", "threshold": 0, "scope": "changed | project | both", "enforcement": "blocking | attention" }
  ]
}
```

## Approval History

- Approved by: `<git user.name> <git user.email>`
- Approved on: `<date>`
- Approval context: `<concise description of the approved metric or revision>`
