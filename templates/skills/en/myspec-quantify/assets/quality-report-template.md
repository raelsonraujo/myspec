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
| <metric and reported value from the tooling contract> | `<value>` | `<value or —>` | `<target or —>` |

<Repeat the next section for every metric the tooling contract defines, in its order.>

## <Metric name>

- Tool and version: `<tool>`

| Location | Value | Related spec | Observation |
| --- | ---: | --- | --- |
| `<project, file, or member, at the granularity the contract defines>` | `<value>` | `<NNN-name or —>` | `<target missed or reason this deserves attention>` |

## Improvement Opportunities

| Priority | Opportunity | Affected code | Related spec | Expected effect | Next skill |
| ---: | --- | --- | --- | --- | --- |
| 1 | <evidence-based improvement> | `<path or member>` | `<NNN-name or —>` | <expected metric effect> | `{{skill:myspec-prescribe}}` or `{{skill:myspec-patch}}` |

## Limitations

- <Tooling or scoping limitation, or `None`.>
