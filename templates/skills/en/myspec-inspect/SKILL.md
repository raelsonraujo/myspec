---
name: myspec-inspect
description: Review an implemented specification under my-specs/specs for conformance to its explicit requirements, approved file tree, applicable approved product directives, and approved Myspec guidance, measure its test coverage and cyclomatic complexity with developer-approved tooling, then record a concise inspection in the spec's inspections folder that follows up on the previous one and decides whether work can advance to the next spec. Use when a developer asks to inspect, audit, review, or validate a spec implementation, check its progress, or confirm it is complete, and wants evidence-based metrics and corrective suggestions without expanding the spec.
---

# Myspec Inspect

Review and measure an implementation without expanding its contract, and record every run as a new inspection so the latest one serves as the completion criterion for advancing to the next spec. A typical cycle repeats implement or patch followed by inspect until the results are satisfactory. Report only gaps that can be traced to an explicit spec requirement, approved file-tree responsibility, applicable approved product directive, or applicable approved Myspec rule.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and specification discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

Treat an approved product directive governing the implementation under review as an inspection criterion even when its `Applies to` field names implementation skills rather than `{{skill:myspec-inspect}}`. Product directives constrain the product behavior being inspected; they do not need to govern the inspection workflow itself.

## Workflow

1. Resolve the named folder under repository-root `my-specs/specs`. Read `spec.md` and, when present, `file-tree.md` in full.
2. Complete the Mandatory Guidance Gate. Read repository instructions and `my-specs/tooling.md` when present. Use the tooling contract to establish quality-tooling applicability, but do not treat it as a substitute for reading the directive and guidance files.
3. List `my-specs/specs/<spec-name>/inspections/`. When it holds earlier inspections, read the highest-numbered one in full; it is the previous inspection. Otherwise this is the first inspection.
4. Establish the review baseline from the spec, the approved file tree, applicable approved product directives and guidance, relevant implementation and test files, version-control evidence, and any verification output the developer supplied.
5. Collect the metrics described under [Metrics](#metrics).
6. Extract only explicit acceptance criteria, defined scope, out-of-scope statements, approved file-tree responsibilities, applicable approved product directives, and applicable guidance rules. Do not turn goals, examples, or absent details into new requirements.
7. Trace each extracted item to implementation or test evidence. Inspect only files reasonably connected to that item. Mark an item as `Met`, `Not met`, `Insufficient evidence`, `Not applicable`, or `Baseline conflict`. A missing test proves only that the item lacks test evidence unless the spec or applicable guidance explicitly requires that test.
8. Re-examine every finding the previous inspection left open, as described under [Follow-up](#follow-up).
9. Decide the verdict using [Verdict](#verdict).
10. Create the inspection file described under [Inspection Record](#inspection-record). Return its path, the verdict, and the blocking findings. Do not edit source, specs, file trees, tooling, guidance, quality reports, or earlier inspections unless the developer separately requests a change.

## Metrics

Every inspection measures the implementation itself. Run the exact build, test, coverage, and complexity commands defined in an approved `my-specs/tooling.md`, applying their documented scope, exclusions, and every applicable approved guideline, and collect:

- acceptance criteria met out of the total the spec defines;
- tests passed out of the total run;
- line and branch coverage of the production code implemented by the spec;
- the highest cyclomatic complexity among that code's methods or functions; and
- any additional metric the approved tooling contract defines, such as a CRAP score.

Measurement rules:

- Scope metrics to the spec's implemented production code, identified from the approved file tree, version-control evidence, and repository evidence. When tooling cannot isolate that code, report the whole-project value and mark it `(project)`.
- Treat failed or skipped tests as findings; never present their coverage run as clean verification.
- Never invent, estimate manually, install, or substitute a metric tool, and ask before changing dependencies, commands, or project configuration. When the tooling contract is absent, incomplete, or unapproved, or an approved command is unavailable or fails, record the affected metrics as `Not measured: <reason>`, keep every metric that could be measured, and suggest `{{skill:myspec-setup}}` when the contract itself is missing or unapproved.
- Do not create or update `quality-report.md`; that detailed per-file report belongs to `{{skill:myspec-quantify}}`.

A metric is a pass/fail criterion only when an applicable approved spec requirement, product directive, or guidance rule defines that target; a value that misses such a target is a `Not met` item. Otherwise it is reported without a finding.

## Follow-up

When a previous inspection exists, give every finding it left open exactly one current status:

- `Resolved`: current evidence satisfies the item. Name that evidence.
- `Open`: the gap remains. Keep the finding in the new inspection with its original ID.
- `Superseded`: the spec, approved file tree, product directive, or rule it traced to changed or was withdrawn. Name the change.

A previously `Met` item that now fails is a new finding marked `(regression)`. Number new findings after the highest finding ID in any earlier inspection so IDs stay stable across inspections.

## Verdict

- `Blocked`: at least one item is `Not met` or `Baseline conflict`, an acceptance criterion is `Insufficient evidence`, or the build or tests failed.
- `Ready with observations`: nothing is blocking, but a non-acceptance-criterion item is `Insufficient evidence`, a metric is `Not measured`, or another limitation materially narrows the review.
- `Ready`: every assessed item is `Met` or `Not applicable`, every metric was measured, and no material limitation remains.

`Ready` and `Ready with observations` mean the spec is complete against the inspected baseline and work can advance to the next spec. The verdict informs the developer; it never prevents another skill from running. It states conformance to the inspected baseline, not that the implementation is generally complete or defect-free.

## Inspection Record

Create `my-specs/specs/<spec-name>/inspections/inspection-<NNN>.md` from [assets/inspection-template.md](assets/inspection-template.md), where `<NNN>` is the next three-digit number after the previous inspection, starting at `001`. Create the `inspections` folder when absent. Never edit or delete an earlier inspection; every run adds one file, even when nothing changed.

Keep the record short. It reports results, not the process that produced them:

- **Acceptance Criteria**: one row per acceptance criterion in the spec, with the test or location that proves its status.
- **Metrics**: one row per collected metric, with the previous inspection's value or `—`. Add a row for each additional metric from the tooling contract.
- **Findings**: one line per open finding, `Blocking` first. A `Blocking` finding is any item that makes the verdict `Blocked`, including a violation of an approved product directive, coding practice, or general guideline. An `Attention` finding is a non-blocking point the developer must act on or know about, such as an unassessable rule or an unapproved file tree or tooling contract. Write `None` when there is none.
- **Previous Findings**: only findings the previous inspection left open. Write `None — first inspection.` when there is no previous inspection.

Leave out anything the developer already knows or that does not change a decision: tool names and versions, commands, configuration, author, lists of measured or excluded files, per-file or per-method tables, `Met` items other than acceptance criteria, restated spec text, metric interpretations, and general improvement suggestions.

## Inspection Boundaries

- Never propose features, architecture, dependencies, security controls, user flows, test categories, performance targets, or compatibility behavior that are not required by the inspection baseline.
- Do not treat a proposed or unapproved file tree as an implementation constraint. Report its approval state as an `Attention` finding instead.
- Do not infer requirements from common practices, framework conventions, naming, or likely intent.
- When evidence is ambiguous, report `Insufficient evidence` and name the precise evidence needed to decide; do not guess.
- Do not make a compliance finding against a rule or product directive whose applicability or approval status cannot be established.
- If the spec or approved file tree conflicts with an applicable approved product directive, mark the affected items as `Baseline conflict`; do not silently choose one contract or recommend implementing the conflict.
- Never carry a previous finding forward or mark it `Resolved` without re-examining current evidence.
- Preserve the distinction between facts observed in code and an inference drawn from those facts.
- Respect higher-priority repository and developer instructions. If they conflict with this skill, explain the conflict and inspect unaffected criteria.
