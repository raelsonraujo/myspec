# Project Quality Report

## Scope and Baseline

- Baseline: `<commit or branch>`
- Measured on: `<date>`
- Exclusions:
  - `<path or category>`: <reason>

## Verification

| Command | Result |
| --- | --- |
| `<build or test command>` | <passed, failed, or partial> |

## Project Summary

| Metric | Current | Previous | Approved target |
| --- | ---: | ---: | ---: |
| Line coverage | `<covered>/<total> (<percentage>)` | `<value or —>` | `<target or —>` |
| Branch coverage | `<covered>/<total> (<percentage>)` | `<value or —>` | `<target or —>` |
| Highest cyclomatic complexity | `<value>` (`<member>`) | `<value or —>` | `<target or —>` |
| Methods above the complexity target | `<count>` | `<value or —>` | — |

## Test Coverage

- Tool and version: `<tool>`

| Project, module, or file | Line coverage | Branch coverage | Related spec | Notable gaps |
| --- | ---: | ---: | --- | --- |
| `<name>` | `<value>` | `<value>` | `<NNN-name or —>` | `<critical uncovered behavior>` |

## Cyclomatic Complexity

- Tool and version: `<tool>`

| File or type | Method or function | Complexity | Related spec | Observation |
| --- | --- | ---: | --- | --- |
| `<name>` | `<member>` | `<value>` | `<NNN-name or —>` | `<target missed or reason this deserves attention>` |

## Improvement Opportunities

| Priority | Opportunity | Affected code | Related spec | Expected effect | Next skill |
| ---: | --- | --- | --- | --- | --- |
| 1 | <evidence-based improvement> | `<path or member>` | `<NNN-name or —>` | <expected metric effect> | `{{skill:myspec-prescribe}}` or `{{skill:myspec-patch}}` |

## Limitations

- <Tooling or scoping limitation, or `None`.>
