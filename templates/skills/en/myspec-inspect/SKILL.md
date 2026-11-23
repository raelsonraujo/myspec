---
name: myspec-inspect
description: Review an implemented specification under my-specs/specs for conformance to its explicit requirements, file-tree blueprint, and approved Myspec guidance, run deterministic metric gates via myspec gate, record a concise inspection in the spec's inspections folder, and finalize only after explicit developer confirmation or myspec finish. Use when a developer asks to inspect, review, or validate a spec implementation, check its progress, or confirm it is complete.
---

# Myspec Inspect

Evaluate an active spec implementation against its explicit contract, approved rules, and deterministic metrics without expanding scope.

> **Fresh-context evaluation:** Whenever your platform supports subagents or clean sessions, run this inspection in a fresh context anchored on `spec.md`, `file-tree.md`, approved rules, `git diff`, and `myspec gate` output rather than implementation chat memory.

## Guidance & Lifecycle Gates

1. Read every Markdown file under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat applicable `Status: Approved` documents as mandatory; surface conflicts with higher-priority instructions.
2. Read `my-specs/specs/manifest.json`. If missing or inconsistent, reconcile via `{{skill:myspec-setup}}` first.
3. Only `active` specs can be inspected for completion:
   - `proposed`: implementation has not started; reconcile via setup if code already exists.
   - `finished`: immutable historical baseline—return its recorded completion inspection without creating a new inspection or modifying artifacts. Any new change requires `{{skill:myspec-prescribe}}`.
4. Every inspection leaves an `active` spec `active` (`completionInspection: null`) until finalized by the developer.

## Workflow

1. Read `my-specs/specs/<spec-id>/spec.md`, `file-tree.md` (when present), `my-specs/metrics/` (when present), and the highest-numbered file in `inspections/` (if any).
2. Run **`myspec gate <spec-id>`** (deterministic evaluation):
   - Executes any approved `general-guidelines/*.md` verification contract (`"kind": "verify"`) and each approved `metrics/*.md` contract (`"kind": "metric"`) once, deduplicating shared runs.
   - Parses structured reports (`cobertura`, `sarif`, `trx`, `stryker`, `json`), isolates changed code via `baseCommit` / `file-tree.md`, evaluates declared `gates`, and checks **file-tree drift** (unplanned/untouched edits).
   - For any approved metric whose output format `myspec gate` cannot parse automatically (for example, benchmarks with machine-compared budgets), run its exact documented command and read its result path directly. Never invent, estimate, install, or substitute tools; record unavailable/unapproved metrics as `Not measured: <reason>` and suggest `{{skill:myspec-setup}}`.
   - Do not update `my-specs/quality-report.md` (that belongs to `{{skill:myspec-quantify}}`).
3. Verify every BDD acceptance criterion (`AC-NN`) in `spec.md` against concrete test or verification evidence covering its `Given / When / Then / And` outcomes:
   - Mark `Met` only when all outcomes are verified, `Not met` when contradicted, or `Insufficient evidence` when missing/partial. Never omit an AC or mark it `Not applicable`.
   - Approved coding practices, general guidelines, and metric gates are enforced directly from their own documents; never demand duplicate compliance ACs. Report rule violations separately with exact `file:line` and source rule.
   - Report any unplanned file-tree drift from `myspec gate` as an `Attention` finding (or `Not met` if it breaks scope/rules).
   - Treat `## Revision History` as context only; report ambiguous/non-BDD specs or missing change-specific ACs as a contract gap and recommend `{{skill:myspec-prescribe}}`.
4. Re-examine every open finding from the previous inspection and mark it `Resolved` (with evidence), `Open` (keeping its original ID), or `Superseded` (naming the contract change). Number new findings after the highest earlier ID and mark regressions `(regression)`.
5. Assign the verdict:
   - `Blocked`: any `Not met` or `Baseline conflict`, any AC with `Insufficient evidence`, build/test failure, blocking metric gate failure, or contract gap.
   - `Ready with observations`: nothing blocking, but non-AC `Insufficient evidence`, unmeasured metric, `Attention` gate miss, or unplanned file-tree drift remains.
   - `Ready`: every assessed item is `Met` or `Not applicable`, all approved metrics measured, and no material limitation remains.
6. Save `my-specs/specs/<spec-id>/inspections/inspection-<NNN>.md` (next 3-digit sequence, starting at `001`) from [assets/inspection-template.md](assets/inspection-template.md), recording the current git commit SHA in the header (`Baseline \`<sha>\``). Never edit earlier inspections or source code.

## Finalization

- After saving a `Ready` or `Ready with observations` inspection, present its path, verdict, and key findings. Ask the developer to finalize it by running **`myspec finish <spec-id>`** (which deterministically verifies the passing inspection and unchanged git baseline) or by explicitly confirming finalization in chat.
- On explicit confirmation in chat (without code changes since the reviewed inspection), run `myspec finish <spec-id>` (or update only that entry in `manifest.json` to `finished` with `completionInspection: "<NNN>"`) without creating a new inspection. If code changed after the inspection, inspect the new baseline first.

## Record Brevity & Boundaries

- Keep the inspection record short: Acceptance Criteria table, Metrics table (with previous values and gates), concise open Findings (`Blocking` first), and Previous Findings follow-up. Omit tool versions, raw commands, full file lists, restated spec text, or unrequested improvement ideas.
- Never invent requirements, guess past ambiguous evidence, or let Myspec guidance override higher-priority instructions.
