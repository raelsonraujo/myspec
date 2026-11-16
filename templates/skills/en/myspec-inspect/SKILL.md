---
name: myspec-inspect
description: Review an implemented specification under my-specs/specs for conformance to its explicit requirements, approved file tree, and approved Myspec guidance, measure the metrics defined by the developer-approved metric files under my-specs/metrics and judge them against their gates, then record a concise inspection in the spec's inspections folder that follows up on the previous one and recommends whether to finalize the spec and marks the manifest entry finished only after the developer explicitly confirms the presented inspection, preserving already finished specs. Use when a developer asks to inspect, audit, review, or validate a spec implementation, check its progress, or confirm it is complete, and wants evidence-based metrics and corrective suggestions without expanding the spec.
---

# Myspec Inspect

Review and measure an implementation without expanding its contract, and record every run on an active spec as a new inspection so the latest one informs the developer's finalization decision. A typical cycle repeats implement or patch followed by inspect until the results are satisfactory. Report only gaps that can be traced to an explicit spec requirement, approved file-tree responsibility, or applicable approved Myspec rule.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and specification discovery, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Spec Lifecycle Gate

Read `my-specs/specs/manifest.json` before inspection. If it or the spec's entry is absent or inconsistent, use the Spec Manifest procedure in `{{skill:myspec-setup}}` first. Inspect an `active` spec for completion; a `proposed` spec has not begun implementation and cannot be finished. If evidence shows its implementation already started, reconcile that status through setup first.

For an already `finished` spec, return its recorded completion inspection and status without creating another inspection or changing any historical artifact. A later defect, regression, or requested change must be scoped to a new spec through `{{skill:myspec-prescribe}}`; never reopen or downgrade the finished one. Its completion verdict describes its historical baseline, not all future code.

For an active spec, save and present the inspection first. Every verdict leaves it `active` with `completionInspection: null` until the developer explicitly confirms finalization under [Developer Finalization](#developer-finalization). `Ready` and `Ready with observations` permit proposing finalization; they never authorize it. `Blocked` cannot be finalized. Neither failing checks nor missing evidence reverses a status. Return the manifest path and actual status alongside the inspection result.

## Developer Finalization

1. After saving a `Ready` or `Ready with observations` inspection, present its path, verdict, and observations. Ask the developer explicitly whether to finalize this named spec based on this inspection, explaining that it will become an immutable historical baseline. Wait for their answer. Silence, passing checks, file-tree approval, approval of implementation, a request to inspect, and conditional permission given before seeing the inspection are not confirmation. A declined or unanswered proposal leaves the spec active and its completion reference null.
2. On a confirmation-only continuation, read the highest-numbered inspection and verify that it is the one the developer reviewed, still permits finalization, and still represents the relevant spec, tree, implementation, tests, guidance, and metric baseline. If relevant work changed or a newer inspection superseded it, inspect the new baseline and ask again after presenting that result. Do not create another inspection merely to record confirmation when the reviewed baseline is unchanged.
3. Only after explicit confirmation, re-read the manifest and set only this active entry to `finished`, with the reviewed inspection's three-digit sequence as `completionInspection` (for example, `"003"`). Preserve unrelated entries and fields. The status change itself records the developer's confirmation; create no separate confirmation artifact and do not amend the inspection. Never finalize against an obsolete or blocked inspection. If saving the manifest fails, report the incomplete operation without claiming completion; on retry, reuse the explicit confirmation already received in this conversation only while the same inspected baseline still holds. Return the inspection and manifest paths with the resulting status. Finished artifacts then remain immutable.

## Workflow

1. Resolve the named folder under repository-root `my-specs/specs`. Read `spec.md` and, when present, `file-tree.md` in full.
2. Complete the Mandatory Guidance Gate. Read repository instructions and every metric file under `my-specs/metrics/` when present. Use the metric files to establish quality-tooling applicability and gates, but do not treat them as a substitute for reading the guidance files.
3. List `my-specs/specs/<spec-name>/inspections/`. When it holds earlier inspections, read the highest-numbered one in full; it is the previous inspection. Otherwise this is the first inspection.
4. Establish the review baseline from the spec, the approved file tree, applicable approved guidance, relevant implementation and test files, version-control evidence, and any verification output the developer supplied.
5. Collect the metrics described under [Metrics](#metrics).
6. Use the identified BDD acceptance criteria in `spec.md` as the single source of truth for change-specific measurable behavior. Check for explicit `Given / When / Then` steps and verifiable outcomes. Scope and out-of-scope statements constrain boundaries; approved file-tree responsibilities, guidance, and metric gates remain engineering checks. Do not derive additional behavioral requirements from goals, examples, assumptions, code, tests, the tree, or previous findings. If a required change-specific behavior not already established by applicable approved guidance appears only elsewhere in the spec, report a contract gap and recommend `{{skill:myspec-prescribe}}` to express it as a criterion.
7. Trace each criterion ID to evidence that establishes its Given state, exercises its When event, and verifies every Then/And outcome. A test name, passing suite, coverage percentage, or implementation location alone does not prove a scenario. Mark a criterion `Met` only when all outcomes are verified, `Not met` when evidence contradicts an outcome, or `Insufficient evidence` when evidence is missing or partial. Preserve all criterion IDs in the record; never omit one or use `Not applicable` to bypass it. A missing automated test alone is not a behavioral failure when concrete manual or other evidence verifies the scenario, unless the spec or applicable guidance requires automation. Assess separate engineering items as `Met`, `Not met`, `Insufficient evidence`, `Not applicable`, or `Baseline conflict`. Inspect only files reasonably connected to the assessed items.
8. Re-examine every finding the previous inspection left open, as described under [Follow-up](#follow-up).
9. Decide the verdict using [Verdict](#verdict).
10. Create the inspection file described under [Inspection Record](#inspection-record), then update the manifest as defined by the lifecycle gate. Return both paths, the resulting status, the verdict, and the blocking findings. Do not edit source, specs, file trees, tooling, guidance, quality reports, or earlier inspections. Finished historical artifacts remain immutable even when a change is requested; scope it to a new spec.

## Metrics

Every inspection measures the implementation itself. Run the exact build and test commands defined by the approved general guideline `my-specs/general-guidelines/build-and-test-commands.md`, then, for each metric file under `my-specs/metrics/`, its prerequisite and measurement commands, applying its documented scope, exclusions, and every applicable approved guideline, and collect:

- acceptance criteria met out of the total the spec defines;
- tests passed out of the total run; and
- for every metric file, the values its `Reported values` lists.

The metric files alone decide which metrics exist: one file is one metric. Never measure, report, or ask for a metric no file defines, such as coverage or complexity, and never treat a missing metric as a gap.

Measurement rules:

- Scope metrics to the spec's implemented production code, identified from the approved file tree, version-control evidence, and repository evidence. When tooling cannot isolate that code, report the whole-project value and mark it `(project)`.
- Treat failed or skipped tests as findings; never present measurements from that run as clean verification.
- Run a command shared by several metric files once per baseline and read every metric from that run.
- Never invent, estimate manually, install, or substitute a metric tool, and ask before changing dependencies, commands, or project configuration. When a metric file is incomplete or unapproved, the build and test commands are undefined or unapproved, or an approved command is unavailable or fails, record the affected values as `Not measured: <reason>`, keep every metric that could be measured, and suggest `{{skill:myspec-setup}}` when a definition is missing or unapproved. When only the legacy single-file `my-specs/tooling.md` exists, measure nothing from it and suggest `{{skill:myspec-setup}}` to split it into metric files.
- Do not create or update `my-specs/quality-report.md`; that project-wide report belongs to `{{skill:myspec-quantify}}`.

Judge each reported value against the `## Gates` of its approved metric file that apply to changed code:

- a value that misses a `Blocking` gate is a `Not met` item;
- a value that misses an `Attention` gate is an `Attention` finding;
- a value measured only as `(project)` cannot prove a changed-code gate; report the gate as `Insufficient evidence` unless the gate also applies to the project.

A new spec-specific measurable behavior or target not already established by applicable approved guidance must be defined in a BDD acceptance criterion and judged with that criterion's conditions and expected outcomes, with the same blocking effect as a `Blocking` gate. If the target appears only elsewhere in the spec, report a contract gap instead of creating a parallel acceptance rule. A value with no gate or criterion target is reported without a finding.

## Follow-up

When a previous inspection exists, give every finding it left open exactly one current status:

- `Resolved`: current evidence satisfies the item. Name that evidence.
- `Open`: the gap remains. Keep the finding in the new inspection with its original ID.
- `Superseded`: the spec, approved file tree, or rule it traced to changed or was withdrawn. Name the change.

A previously `Met` item that now fails is a new finding marked `(regression)`. Number new findings after the highest finding ID in any earlier inspection so IDs stay stable across inspections.

## Verdict

- `Blocked`: at least one item is `Not met` or `Baseline conflict`, an acceptance criterion is `Insufficient evidence`, the build or tests failed, or the spec has a contract gap (missing criteria, missing BDD steps, unverifiable or contradictory outcomes, or required change-specific behavior outside the criteria that is not already established by applicable approved guidance). Recommend `{{skill:myspec-prescribe}}` for contract gaps without rewriting the spec during inspection; continue inspecting unaffected criteria.
- `Ready with observations`: nothing is blocking, but a non-acceptance-criterion item is `Insufficient evidence`, a metric is `Not measured`, or another limitation materially narrows the review.
- `Ready`: every assessed item is `Met` or `Not applicable`, every metric was measured, and no material limitation remains.

`Ready` and `Ready with observations` establish conformance to the inspected baseline and recommend finalization. They do not finalize the spec or replace the developer's decision. The spec becomes `finished` only after the developer explicitly confirms the presented inspection and the manifest status is updated. Further work then uses a new spec. The verdict does not claim the implementation is generally complete or defect-free.

## Inspection Record

Create `my-specs/specs/<spec-name>/inspections/inspection-<NNN>.md` from [assets/inspection-template.md](assets/inspection-template.md), where `<NNN>` is the next three-digit number after the previous inspection, starting at `001`. Create the `inspections` folder when absent. Never edit or delete an earlier inspection; every inspection run on an active spec adds one file, even when nothing changed. A confirmation-only continuation changes only the manifest, without creating or editing an inspection or adding another artifact. For a finished spec, return its existing completion inspection instead.

Keep the record short. It reports results, not the process that produced them:

- **Acceptance Criteria**: one row per BDD criterion ID in the spec, with named test or other verification evidence and results for all Then/And outcomes under the specified Given/When conditions. Name the precise missing outcome or evidence for any partial verification. Count a criterion as met only when the whole scenario is verified.
- **Metrics**: the acceptance-criteria and test rows, then one row per reported value of each metric file, with the previous inspection's value, or `—`, and the gate that judges it, or `—`.
- **Findings**: one line per open finding, `Blocking` first. A `Blocking` finding is any item that makes the verdict `Blocked`, including a violation of an approved coding practice or general guideline. An `Attention` finding is a non-blocking point the developer must act on or know about, such as a missed `Attention` gate, an unassessable rule, or an unapproved file tree or metric file. Write `None` when there is none.
- **Previous Findings**: only findings the previous inspection left open. Write `None — first inspection.` when there is no previous inspection.

Leave out anything the developer already knows or that does not change a decision: tool names and versions, commands, configuration, author, lists of measured or excluded files, per-file or per-method tables, `Met` items other than acceptance criteria, restated spec text, metric interpretations, and general improvement suggestions.

## Inspection Boundaries

- Enforce each applicable approved coding practice and general guideline directly, even when no AC mentions it. Do not request or create duplicate compliance criteria, and do not report their absence as a contract gap. Trace a violation to the source document and rule, with evidence and the normal blocking effect of an approved rule violation; keep it separate from AC rows and counts. A contextual reference to guidance does not create another criterion. If existing criteria duplicate guidance, assess them without silently editing the spec; recommend removing the duplication on revision while preserving any change-specific behavior.
- Judge the implementation against the spec body as its current contract. A `## Revision History` section (or the project's equivalent) is context only and never adds, restores, or removes requirements. If the body of an unfinished spec still mixes superseded behavior or comparisons with earlier revisions so that the required behavior is ambiguous, report it as a contract gap and recommend revising the spec as-is through `{{skill:myspec-prescribe}}`.
- Never propose features, architecture, dependencies, security controls, user flows, test categories, performance targets, or compatibility behavior that are not required by the inspection baseline.
- Do not treat a proposed or unapproved file tree as an implementation constraint. Report its approval state as an `Attention` finding instead.
- Do not infer requirements from common practices, framework conventions, naming, or likely intent.
- When evidence is ambiguous, report `Insufficient evidence` and name the precise evidence needed to decide; do not guess.
- Do not make a compliance finding against a rule whose applicability or approval status cannot be established.
- If the spec or approved file tree conflicts with an applicable approved coding practice or general guideline, mark the affected items as `Baseline conflict`; do not silently choose one contract or recommend implementing the conflict.
- Never carry a previous finding forward or mark it `Resolved` without re-examining current evidence.
- Preserve the distinction between facts observed in code and an inference drawn from those facts.
- Respect higher-priority repository and developer instructions. If they conflict with this skill, explain the conflict and inspect unaffected criteria.
