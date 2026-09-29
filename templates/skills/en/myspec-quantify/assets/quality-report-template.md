# Implementation Quality Report

## Scope and Baseline

- Spec: `<path>`
- Baseline: `<commit, branch, diff, or approved file tree>`
- Production files measured:
  - `<path>`
- Exclusions:
  - `<path or category>`: <reason>

## Verification

| Command | Result |
| --- | --- |
| `<build or test command>` | <passed, failed, or partial> |

## Test Coverage

- Tool and version: `<tool>`
- Line coverage: `<covered>/<total> (<percentage>)`
- Branch coverage: `<covered>/<total> (<percentage>)`

| File or type | Line coverage | Branch coverage | Notable gaps |
| --- | ---: | ---: | --- |
| `<name>` | `<value>` | `<value>` | `<critical uncovered behavior>` |

## Cyclomatic Complexity

- Tool and version: `<tool>`

| File or type | Method or function | Complexity | Observation |
| --- | --- | ---: | --- |
| `<name>` | `<member>` | `<value>` | `<reason this deserves attention, if any>` |

## Acceptance Criteria Evidence

| Criterion | Test or verification evidence | Coverage gap |
| --- | --- | --- |
| `AC-01` | `<test name or command>` | `<none or gap>` |

## Improvement Suggestions

1. <Prioritized, evidence-based improvement and its expected metric effect.>

## Limitations

- <Tooling or scoping limitation, or `None`.>
