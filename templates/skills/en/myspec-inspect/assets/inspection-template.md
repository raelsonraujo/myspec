# Implementation Inspection <NNN>

- Spec: `<my-specs/specs/NNN-name/spec.md>`
- Inspected by: `<git user.name> <git user.email>`
- Inspected on: `<date>`
- Baseline: `<commit, branch, or diff inspected>`
- Previous inspection: `<inspections/inspection-NNN.md>` or `None`

## Verdict

**<Ready / Ready with observations / Blocked>** — <one sentence stating whether the spec can be closed and work can advance to the next spec, and why.>

## Metrics Summary

| Metric | Value | Previous |
| --- | ---: | ---: |
| Acceptance criteria met | `<met>/<total>` | `<value or —>` |
| Baseline items met | `<met>/<assessed>` | `<value or —>` |
| Not met | `<count>` | `<value or —>` |
| Insufficient evidence | `<count>` | `<value or —>` |
| Baseline conflicts | `<count>` | `<value or —>` |
| Findings resolved since previous | `<count>` | — |
| Findings still open | `<count>` | — |
| New findings | `<count>` | — |
| Verification | `<passed / failed / not run>` (`<passed>/<total>` tests) | `<value or —>` |
| Line coverage | `<covered>/<total> (<percentage>)` or `Not measured` | `<value or —>` |
| Branch coverage | `<covered>/<total> (<percentage>)` or `Not measured` | `<value or —>` |
| Highest cyclomatic complexity | `<value>` at `<member>` or `Not measured` | `<value or —>` |
| `<additional metric from the tooling contract>` | `<value>` | `<value or —>` |

<Two to four sentences interpreting the metrics: what they show about implementation progress, what changed since the previous inspection, and how they support the verdict.>

## Required Before Advancing

1. `<F-NNN>`: <blocking item and the smallest change that resolves it.>

Write `None` when the verdict is not `Blocked`.

## Previous Findings Follow-up

| Finding | Previous status | Current status | Evidence |
| --- | --- | --- | --- |
| `F-001` | `<Not met / Insufficient evidence / Baseline conflict>` | `<Resolved / Open / Superseded>` | `<file, test, diff, or output>` |

Write `None — first inspection.` when there is no previous inspection.

## Verification

| Command | Result |
| --- | --- |
| `<approved build, test, coverage, or complexity command>` | `<passed, failed, partial, or not run: reason>` |

- Production files measured:
  - `<path>`
- Exclusions:
  - `<path or category>`: <reason>

## Test Coverage

- Tool and version: `<tool>`

| File or type | Line coverage | Branch coverage | Notable gaps |
| --- | ---: | ---: | --- |
| `<name>` | `<value>` | `<value>` | `<critical uncovered behavior>` |

## Cyclomatic Complexity

- Tool and version: `<tool>`

| File or type | Method or function | Complexity | Observation |
| --- | --- | ---: | --- |
| `<name>` | `<member>` | `<value>` | `<approved target missed, simplification seam, or —>` |

Write `Not measured: <reason>` under a metric section that could not be measured.

## Traceability

| Baseline item | Evidence | Status | Finding |
| --- | --- | --- | --- |
| `<AC-01, file-tree responsibility, directive, or rule>` | `<file, test, diff, or output>` | `<Met / Not met / Insufficient evidence / Not applicable / Baseline conflict>` | `<F-NNN or —>` |

## Findings

### F-NNN: <short title>

- Origin: `<New / Carried over from inspection-NNN / Regression>`
- Blocking: `<Yes / No>`
- Baseline item: <exact requirement, file-tree responsibility, product directive, or guidance rule>
- Evidence: <file path and location, test, diff, or output>
- Assessment: <why the evidence does or does not satisfy the baseline item; separate observed facts from inferences>
- Suggested correction: <smallest bounded change>

Write `None` when no finding is open.

## Not Assessed

- <Item that could not be assessed and the evidence required, or `None`.>

## Limitations

- <Unapproved or missing documents, unavailable tooling, stale metrics, or other scope limits, or `None`.>
