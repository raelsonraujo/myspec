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

| Metric | Current | Previous | Gate |
| --- | ---: | ---: | --- |
| <metric and reported value from its metric file> | `<value>` | `<value or —>` | `<threshold and enforcement, or —>` |

<Repeat the next section for every approved metric file under my-specs/tooling, in filename order.>

## <Metric name>

- Tool and version: `<tool>`

| Location | Value | Related spec | Observation |
| --- | ---: | --- | --- |
| `<project, file, or member, at the granularity the metric file defines>` | `<value>` | `<NNN-name or —>` | `<gate missed or reason this deserves attention>` |

## Improvement Opportunities

| Priority | Opportunity | Affected code | Related spec | Expected effect | Next skill |
| ---: | --- | --- | --- | --- | --- |
| 1 | <evidence-based improvement> | `<path or member>` | `<NNN-name or —>` | <expected metric effect> | `$myspec-prescribe` or `$myspec-patch` |

## Limitations

- <Tooling or scoping limitation, or `None`.>
