---
name: myspec-inspect
description: Review an implemented specification under my-specs/specs for conformance to its explicit requirements, approved file tree, applicable approved product directives, and approved Myspec guidance, measure its test coverage and cyclomatic complexity with developer-approved tooling, then record a new inspection in the spec's inspections folder that follows up on the previous one and decides whether work can advance to the next spec. Use when a developer asks to inspect, audit, review, or validate a spec implementation, check its progress, or confirm it is complete, and wants evidence-based metrics and corrective suggestions without expanding the spec.
---

# Myspec Inspect

Review and measure an implementation without expanding its contract, and record every run as a new inspection so the latest one serves as the completion criterion for advancing to the next spec. A typical cycle repeats implement or patch followed by inspect until the results are satisfactory. Report only gaps that can be traced to an explicit spec requirement, approved file-tree responsibility, applicable approved product directive, or applicable approved Myspec rule.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and specification discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

Treat an approved product directive governing the implementation under review as an inspection criterion even when its `Applies to` field names implementation skills rather than `{{skill:myspec-inspect}}`. Product directives constrain the product behavior being inspected; they do not need to govern the inspection workflow itself.

## Workflow

1. Resolve the named folder under repository-root `my-specs/specs`. Read `spec.md` and, when present, `file-tree.md` in full.
2. Complete the Mandatory Guidance Gate. Read repository instructions and `my-specs/tooling.md` when present. Use the tooling contract to establish quality-tooling applicability, but do not treat it as a substitute for reading the directive and guidance files under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat missing, proposed, or `None` documents as no additional inspection criterion and state the limitation when material.
3. List `my-specs/specs/<spec-name>/inspections/`. When it holds earlier inspections, read the highest-numbered one in full; it is the previous inspection. Otherwise this is the first inspection.
4. Establish the review baseline from the spec, the approved file tree, applicable approved product directives and guidance, relevant implementation and test files, version-control evidence, and any verification output the developer supplied. State what was examined and any material limitation.
5. Collect the metrics described under [Metrics](#metrics).
6. Extract only explicit acceptance criteria, defined scope, out-of-scope statements, approved file-tree responsibilities, applicable approved product directives, and applicable guidance rules. Do not turn goals, examples, or absent details into new requirements.
7. Trace each extracted item to implementation or test evidence. Inspect only files reasonably connected to that item. Mark an item as `Met`, `Not met`, `Insufficient evidence`, `Not applicable`, or `Baseline conflict`.
8. Re-examine every finding the previous inspection left open, as described under [Follow-up](#follow-up), before recording new findings.
9. For every `Not met` item, identify the exact source requirement, directive, or rule, the evidence and location, and the smallest suggested change needed to address it.
10. Distinguish implementation nonconformance from missing evidence. A missing test proves only that the requirement lacks test evidence unless the spec or applicable guidance explicitly requires that test coverage.
11. Decide the verdict using [Verdict](#verdict).
12. Create the inspection file described under [Inspection Record](#inspection-record). Return its path, the verdict, the metrics summary, and every item required before advancing. Do not edit source, specs, file trees, tooling, guidance, quality reports, or earlier inspections unless the developer separately requests a change.

## Metrics

Every inspection measures the implementation itself so its report carries current metrics. Collect:

- counts of baseline items per status, and acceptance criteria met out of the total the spec defines;
- counts of findings resolved, still open, and new relative to the previous inspection;
- the results of the exact build, test, coverage, and complexity commands defined in an approved `my-specs/tooling.md`, applying their documented scope, exclusions, and every applicable approved guideline, with passed and total test counts when reported;
- test coverage and cyclomatic complexity for the production code implemented by the spec, plus any additional metric the approved tooling contract defines.

Measurement rules:

- Report the exact commands, tool names, tool versions when available, and relevant configuration.
- Scope metrics to the spec's implemented production code, identified from the approved file tree, version-control evidence, and repository evidence. Distinguish whole-project values when tooling cannot isolate that code.
- Report line and branch coverage with covered and total counts as well as percentages when supported, per file or type, and name critical uncovered behavior.
- Report cyclomatic complexity at least per method or function, summarize it by file or type, and identify the highest-complexity locations.
- Label generated code, migrations, DTO-only files, and other exclusions explicitly.
- Treat failed or skipped tests as findings; never present their coverage run as clean verification.
- Never invent, estimate manually, install, or substitute a metric tool, and ask before changing dependencies, commands, or project configuration. When the tooling contract is absent, incomplete, or unapproved, or an approved command is unavailable or fails, record the affected metrics as `Not measured` with the reason, keep every metric that could be measured, and suggest `{{skill:myspec-setup}}` when the contract itself is missing or unapproved.
- Do not create or update `quality-report.md`; that report belongs to `{{skill:myspec-quantify}}`, which remains available when the developer wants only the metrics of a spec.

Treat a metric as a pass/fail criterion only when an applicable approved spec requirement, product directive, or guidance rule defines that target; a value that misses such a target is a `Not met` item. Otherwise report the metric as context and, when it points to uncovered critical paths or concrete simplification seams, mention that as a non-blocking observation.

## Follow-up

When a previous inspection exists, give every finding it left open exactly one current status:

- `Resolved`: current evidence satisfies the baseline item. Name that evidence.
- `Open`: the gap remains. Carry the finding forward with its original ID and current evidence.
- `Superseded`: the spec, approved file tree, product directive, or rule it traced to changed or was withdrawn. Name the change.

Record a previously `Met` item that now fails as a new finding with origin `Regression`. Number new findings after the highest finding ID in any earlier inspection so IDs stay stable across inspections. Compare each metric with the previous inspection's value.

## Verdict

- `Blocked`: at least one baseline item is `Not met` or `Baseline conflict`, an acceptance criterion is `Insufficient evidence`, or the build or tests failed. Each such item is blocking and must be listed as required before advancing.
- `Ready with observations`: nothing is blocking, but a non-acceptance-criterion item is `Insufficient evidence`, verification could not be run, a metric is `Not measured`, or another limitation materially narrows the review.
- `Ready`: every assessed item is `Met` or `Not applicable`, verification passed, every metric was measured, and no material limitation remains.

`Ready` and `Ready with observations` mean the spec is complete against the inspected baseline and work can advance to the next spec. The verdict informs the developer; it never prevents another skill from running. The developer may repeat implement or patch followed by inspect as often as needed until the results are satisfactory. The verdict states conformance to the inspected baseline, not that the implementation is generally complete or defect-free.

## Inspection Record

Create `my-specs/specs/<spec-name>/inspections/inspection-<NNN>.md` from [assets/inspection-template.md](assets/inspection-template.md), where `<NNN>` is the next three-digit number after the previous inspection, starting at `001`. Create the `inspections` folder when absent. Record `Inspected by` from the current repository's `git config user.name` and `git config user.email`; ask the developer for an identity only when either value is unavailable. Never edit or delete an earlier inspection; every run adds one file, even when nothing changed.

Fill every template section:

- the verdict, stating whether work can advance to the next spec and why;
- a brief metrics summary with a short interpretation that grounds the verdict;
- the items required before advancing, each with its finding ID and smallest suggested correction;
- the follow-up of previous findings;
- the verification results, the measured coverage and complexity with their tools and exclusions, and the traceability table;
- each open finding with its exact baseline item, concrete evidence including a file path and location when available, why that evidence does or does not satisfy the item, and a bounded suggested correction; and
- items that could not be assessed with the evidence required, and the review limitations.

## Inspection Boundaries

- Never propose features, architecture, dependencies, security controls, user flows, test categories, performance targets, or compatibility behavior that are not required by the inspection baseline.
- Do not treat a proposed or unapproved file tree as an implementation constraint. Report its approval state as a review limitation instead.
- Do not infer requirements from common practices, framework conventions, naming, or likely intent.
- When evidence is ambiguous, report `Insufficient evidence` and name the precise evidence needed to decide; do not guess.
- Do not make a compliance finding against a rule whose applicability or approval status cannot be established.
- Do not make a product-directive compliance finding from a missing, proposed, unapproved, or inapplicable directive. Report its status as a limitation when it materially narrows the review.
- If the spec or approved file tree conflicts with an applicable approved product directive, mark the affected items as `Baseline conflict`; do not silently choose one contract or recommend implementing the conflict.
- Never carry a previous finding forward or mark it `Resolved` without re-examining current evidence.
- Preserve the distinction between facts observed in code and an inference drawn from those facts.
- Respect higher-priority repository and developer instructions. If they conflict with this skill, explain the conflict and inspect unaffected criteria.
