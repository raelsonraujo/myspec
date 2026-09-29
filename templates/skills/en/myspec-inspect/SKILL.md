---
name: myspec-inspect
description: Review an implemented specification under my-specs/specs for conformance to its explicit requirements, approved file tree, applicable approved product directives, and approved Myspec guidance. Use when a developer asks to inspect, audit, review, or validate a spec implementation and wants evidence-based corrective suggestions without expanding the spec.
---

# Myspec Inspect

Review an implementation without expanding its contract. Report only gaps that can be traced to an explicit spec requirement, approved file-tree responsibility, applicable approved product directive, or applicable approved Myspec rule.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and specification discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

Treat an approved product directive governing the implementation under review as an inspection criterion even when its `Applies to` field names implementation skills rather than `{{skill:myspec-inspect}}`. Product directives constrain the product behavior being inspected; they do not need to govern the inspection workflow itself.

## Workflow

1. Resolve the named folder under repository-root `my-specs/specs`. Read `spec.md` and, when present, `file-tree.md` in full.
2. Complete the Mandatory Guidance Gate. Read repository instructions and `my-specs/tooling.md` when present. Use the tooling contract to establish quality-tooling applicability, but do not treat it as a substitute for reading the directive and guidance files under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat missing, proposed, or `None` documents as no additional inspection criterion and state the limitation when material.
3. Establish the review baseline from the spec, the approved file tree, applicable approved product directives and guidance, relevant implementation and test files, version-control evidence, and any verification output the developer supplied. State what was examined and any material limitation.
4. Extract only explicit acceptance criteria, defined scope, out-of-scope statements, approved file-tree responsibilities, applicable approved product directives, and applicable guidance rules. Do not turn goals, examples, or absent details into new requirements.
5. Trace each extracted item to implementation or test evidence. Inspect only files reasonably connected to that item. Mark an item as `Met`, `Not met`, `Insufficient evidence`, `Not applicable`, or `Baseline conflict`.
6. For every `Not met` item, identify the exact source requirement, directive, or rule, the evidence and location, and the smallest suggested change needed to address it.
7. Distinguish implementation nonconformance from missing evidence. A missing test proves only that the requirement lacks test evidence unless the spec or applicable guidance explicitly requires that test coverage.
8. Return the inspection report in the response. Do not edit source, specs, file trees, tooling, or guidance unless the developer separately requests a change.

## Inspection Boundaries

- Never propose features, architecture, dependencies, security controls, user flows, test categories, performance targets, or compatibility behavior that are not required by the inspection baseline.
- Do not treat a proposed or unapproved file tree as an implementation constraint. Report its approval state as a review limitation instead.
- Do not infer requirements from common practices, framework conventions, naming, or likely intent.
- When evidence is ambiguous, report `Insufficient evidence` and name the precise evidence needed to decide; do not guess.
- Do not make a compliance finding against a rule whose applicability or approval status cannot be established.
- Do not make a product-directive compliance finding from a missing, proposed, unapproved, or inapplicable directive. Report its status as a limitation when it materially narrows the review.
- If the spec or approved file tree conflicts with an applicable approved product directive, mark the affected items as `Baseline conflict`; do not silently choose one contract or recommend implementing the conflict.
- Preserve the distinction between facts observed in code and an inference drawn from those facts.
- Respect higher-priority repository and developer instructions. If they conflict with this skill, explain the conflict and inspect unaffected criteria.

## Report Format

Start with a concise scope statement including the spec revision, implementation evidence examined, applicable approved product directives and guidance, and limitations.

Then provide a traceability table:

| Baseline item | Evidence | Status | Suggested change |
| --- | --- | --- | --- |
| Exact spec criterion or rule | File, test, diff, or supplied output | Met / Not met / Insufficient evidence / Not applicable / Baseline conflict | Smallest change, only for `Not met` |

Follow with prioritized findings. Each finding must include:

- the exact requirement, file-tree responsibility, product directive, or guidance rule;
- concrete evidence, including a file path and location when available;
- why that evidence does or does not satisfy the baseline item; and
- a bounded suggested correction.

Finish with items that could not be assessed and the additional evidence required. If no nonconformance is found, say that the implementation conforms to the inspected baseline, not that it is generally complete or defect-free.
