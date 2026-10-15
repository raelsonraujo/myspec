# Performance Critical Paths

Status: Proposed

Created by: `{{author}}`

Created on: `{{date}}`

Applies to: All Myspec skills that prescribe, implement, patch, inspect, or quantify code reachable from a critical path

## Rule

The paths below are the only performance-critical paths of this repository. Each one is measured by a BenchmarkDotNet benchmark tagged with the path ID, as defined in `my-specs/tooling/performance.md`, and judged against its budget by that metric's gates.

| ID | Critical path | Entry point | Benchmark | Allocation budget | Time budget |
| --- | --- | --- | --- | --- | --- |
| `CP-01` | <business flow, e.g. order placement> | `<Type.Method>` | `<Namespace.TypeBenchmarks.Method>` | `≤ <bytes>/op` | `≤ +10% vs previous` |

Replace the example row with the paths the team chooses before approving this guideline. Choose a path only when at least one of these holds: it is among the most frequent or most latency-sensitive operations, ideally per production telemetry; its cost grows with data volume; or a regression would breach an SLA or cost money. Adding, removing, or re-budgeting a path requires a new approval of this guideline.

Budgets:

- **Allocation** (`Allocated` bytes per operation) is the primary budget because it is stable across machines and runs.
- **Time** (`Mean` per operation) is a maximum regression relative to the previous measurement on the same machine and runtime.
- How a value that exceeds a budget is judged belongs to the gates of `my-specs/tooling/performance.md`.

Specs:

- When a spec's scope changes code reachable from a critical path's entry point, the spec includes an acceptance criterion titled `PERF-NN: <critical path ID> stays within budget`, naming the benchmark and the budget, or a stricter one the spec justifies.
- The spec's file tree lists the benchmark file to add or modify.

Benchmarks:

- Live in the repository's single `*.Benchmarks` project and carry `[BenchmarkCategory("<CP-ID>")]`, plus the spec's `PERF-NN` when one exists.
- Call the real production code from the entry point with a realistic data volume prepared in `[GlobalSetup]`. Replace databases, networks, and other I/O with in-memory implementations; end-to-end load testing is out of scope.
- Reuse test builders or fixtures when useful, but never test bodies, mocks that skip production logic, or assertions.

Reports:

- Inspections report each `PERF-NN` criterion like any other acceptance criterion and add one metric row per benchmark run for the spec, with allocation and time. A missing benchmark is `Insufficient evidence`.
- Project quality reports list every critical path with its allocation, time, previous values, and budget.
- Run only the categories a spec touches with `-Categories <CP-ID>` or `--category <CP-ID>`; project-wide reports run all benchmarks.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- None yet.
