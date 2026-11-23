---
name: myspec-implement
description: Implement an unfinished specification, creating its file-tree blueprint and activating its manifest entry when implementation starts, from a named folder under my-specs/specs using focused interaction, clean code, and tests for critical paths and acceptance criteria. Use when a developer asks to implement, continue, or complete one of the repository's code specs.
---

# Myspec Implement

Implement an unfinished spec from `my-specs/specs/<spec-id>/spec.md` using an explicit file-tree blueprint and evidence-backed verification.

## Guidance & Lifecycle Gates

1. Read every Markdown file under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat applicable `Status: Approved` documents as mandatory and surface conflicts with higher-priority instructions.
2. Read `my-specs/specs/manifest.json` and the spec's entry. If missing or inconsistent, reconcile via `{{skill:myspec-setup}}` first.
3. A `finished` spec is immutable: never implement, modify, or reopen it; recommend `{{skill:myspec-prescribe}}` for any follow-up change.
4. Read `spec.md` and verify its BDD acceptance criteria (`AC-NN`) are complete, unambiguous, and verifiable. Approved practices, guidelines, and metric gates apply directly from their own documents without duplicate ACs. If required change-specific criteria are missing, non-BDD, or contradictory, pause and recommend `{{skill:myspec-prescribe}}` instead of guessing. Treat any `## Revision History` section as context only.

## File-Tree Blueprint

Always establish `my-specs/specs/<spec-id>/file-tree.md` as an as-is implementation blueprint from [assets/file-tree-template.md](assets/file-tree-template.md) before editing production or test code:
- End every file line in the tree with `# add`, `# modify`, or `# delete` (plus optional brief context).
- Map every `AC-NN` from `spec.md` to its production path and planned test or verification method, without redefining behavior.
- Never record Git identity, author, approver, status, or revision history in `file-tree.md`.

**Check-first default vs. opt-in automatic implementation:**
- **By default**, after creating or materially revising `file-tree.md` for a `proposed` spec, present it to the developer and **stop without editing source or test files** so the developer can check the structure first. Once the developer confirms to proceed, continue to activation and implementation.
- **Opt-in automatic implementation:** Proceed directly from writing `file-tree.md` into activation and implementation **only** if:
  1. the developer explicitly asks in the prompt to implement automatically without stopping for file-tree review, **or**
  2. an applicable `Status: Approved` guideline under `my-specs/general-guidelines/` explicitly authorizes automatic implementation after generating `file-tree.md`.
- Even when automatic implementation is enabled, still pause and ask if you hit a material unsettled choice affecting public behavior, architecture, persistence, security, or compatibility.

## Activation & Implementation

1. Immediately before the first production or test edit on a `proposed` spec, activate it by running `myspec activate <spec-id>` (or updating only this entry in `manifest.json` from `proposed` to `active` with `completionInspection: null` and current git HEAD as `baseCommit`). Never activate while only writing `file-tree.md`.
2. Read `my-specs/metrics/` (when present) to know applicable quality gates, and read the highest-numbered file in `inspections/` (when present) to address open findings.
3. Implement in clean, cohesive, reviewable slices covering every `AC-NN` (`Given / When / Then / And`) and critical failure, boundary, authorization, and data-integrity paths.
4. Keep `file-tree.md` accurate if implementation legitimately requires adding or changing another file (and note the adjustment in your report so `myspec gate` drift checks stay clean).
5. If implementation uncovers a required behavioral change, pause and resolve it in `spec.md` via `{{skill:myspec-prescribe}}` before coding it. Never weaken ACs to fit code.
6. Run focused tests while iterating, then the repository's build and test commands (and optionally `myspec gate <spec-id> --skip-build` or full `myspec gate <spec-id>`).
7. Report changed files, `AC-NN` coverage with named test/verification evidence, inspection findings addressed, verification results, approved guidance compliance, and remaining risks. Suggest `{{skill:myspec-inspect}}` to record the resulting state.

## Coding Rules

- Follow approved coding practices, repository conventions, and established patterns.
- Prefer the smallest cohesive change that satisfies the spec; avoid unrelated refactors, avoidable duplication, or unrequested dependencies.
- Cover every BDD criterion with automated tests where feasible; when automation is infeasible, state the limitation and concrete verification procedure/result. Never claim coverage without named evidence.
- Never let Myspec guidance override higher-priority instructions; pause and surface conflicts before editing affected code.
