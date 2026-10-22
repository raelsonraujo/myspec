# Inspection <NNN>: <spec title>

`<date>` · Baseline `<commit or branch>` · Previous `<inspection-NNN.md or None>`

## Verdict

**<Ready / Ready with observations / Blocked>** — <one sentence on whether work can advance to the next spec.>

## Acceptance Criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| `AC-01` <short title> | <Met / Not met / Insufficient evidence> | <test or verification reference and result for every Then/And outcome under this scenario's Given/When; precise missing evidence if partial> |

## Metrics

| Metric | Current | Previous | Gate |
| --- | ---: | ---: | --- |
| Acceptance criteria met | `<met>/<total>` | `<value or —>` | — |
| Tests passed | `<passed>/<total>` | `<value or —>` | — |
| <metric and reported value from its metric file> | `<value>` | `<value or —>` | `<threshold and enforcement, or —>` |

## Findings

- **F-NNN** · <Blocking / Attention> · <violated criterion or rule, e.g. `coding-practices/<file>.md`> — <evidence at `file:line`> — <smallest correction>.

## Previous Findings

| Finding | Status | Evidence |
| --- | --- | --- |
| `F-NNN` | <Resolved / Open / Superseded> | `<file:line, test, or changed rule>` |
