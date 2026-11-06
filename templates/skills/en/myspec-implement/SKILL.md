---
name: myspec-implement
description: Implement an unfinished specification, activating its manifest entry when implementation starts, from a named folder under my-specs/specs using a developer-approved file structure, focused interaction, clean code, and tests for critical paths and acceptance criteria. Use when a developer asks to implement, continue, or complete one of the repository's code specs.
---

# Myspec Implement

Implement a spec without silently deciding its architecture or product behavior.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and spec discovery, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Spec Lifecycle Gate

Before proposing or editing a file tree or implementation, read `my-specs/specs/manifest.json` and the requested spec's entry. If absent, incomplete, or inconsistent, use the Spec Manifest procedure in `{{skill:myspec-setup}}` first; do not guess statuses or create a partial manifest. A `finished` spec is immutable: do not implement it, revise its contract/tree, change its completion evidence, or reopen it. Recommend `{{skill:myspec-prescribe}}` to scope any later impact in a new spec, including fixes and refactors. A new spec may deliberately change the same source files while retaining the finished spec as history.

Keep `proposed` while discovering, proposing, revising, or approving the file tree. After the contract and tree gates pass, immediately before the first production or test implementation edit, change only this entry from `proposed` to `active`, with `completionInspection: null`. Re-read before writing and preserve unrelated entries and fields. Continuing an active implementation leaves it `active`, even when tests pass, the invocation is interrupted, or work is blocked. Never downgrade a status. Only `{{skill:myspec-inspect}}` can finish this implementation with a recorded final inspection.

## Hard Gate: File Tree

Resolve the requested spec folder under the repository-root `my-specs/specs` directory and read `spec.md`.

Use its identified BDD acceptance criteria as the single source of truth for change-specific measurable behavior. Before proposing or implementing the tree, check that each criterion has explicit `Given / When / Then` steps and verifiable outcomes, and that required change-specific behaviors elsewhere in the spec are represented there.

Rules already established by applicable approved coding practices or general guidelines are enforced from those documents without repeating them as ACs; their absence from the criteria is not a contract gap. Do not add compliance criteria or require a spec revision merely to restate guidance. When context is needed, reference the rule's source rather than copying it. If criteria are missing, ambiguous, non-BDD, or contradictory, surface the precise gap and recommend `{{skill:myspec-prescribe}}` to revise the spec before affected implementation work; never invent scenarios from code or silently rewrite the contract. Approved engineering rules and metric gates still apply separately.

If `file-tree.md` is absent:

1. Inspect the repository structure and the spec.
2. Create `file-tree.md` in the same spec folder using [assets/file-tree-template.md](assets/file-tree-template.md).
3. Set its status to `Proposed` and add a `Proposed` entry dated today (`YYYY-MM-DD`) to `Revision History`.
4. Include files to add, modify, or delete; the responsibility of each file; test locations; and important structural decisions. Map every acceptance-criterion ID to its production and planned test or verification locations; the tree must not introduce or redefine behavior.
5. End the task after presenting the proposal. Do not edit implementation files.

If `file-tree.md` exists but its status is not `Approved`:

1. Review it against the spec and repository.
2. Present any concerns or alternatives.
3. Ask the developer to approve or revise it.
4. Do not edit implementation files.

On a later invocation, incorporate requested revisions or, when the developer explicitly approves the proposal, change its status to `Approved`. Record every revision and approval as a new dated `Revision History` entry with a concise description of what changed or was approved; never edit or remove earlier entries. Revising an approved tree sets its status back to `Proposed` until the developer approves it again. A file's mere existence is never approval.

The file tree, like everything under the spec folder, is the developer's local working record: never record a Git identity, author, or approver in it.

## Interactive Implementation

1. Read the approved file tree, spec, repository instructions, and affected code. When the unfinished spec folder has an `inspections/` folder, read its highest-numbered inspection and treat its open findings as input for this implementation. A blocked inspection permits continued implementation of an active spec; a finished spec requires a new spec.
2. Complete the Mandatory Guidance Gate, then read the metric files under `my-specs/metrics/` when present. Use them to identify quality tooling and the gates the changed code must meet; do not treat them as a substitute for reading the guidance files under `my-specs/coding-practices/` and `my-specs/general-guidelines/`.
3. Map each acceptance-criterion ID to implementation work and tests that establish its Given state, exercise its When event, and verify every Then/And outcome. Preserve these IDs in coverage records and the implementation report; test names may follow repository conventions.
4. Before source edits, tell the developer the intended first slice and raise material choices not settled by the spec or approved tree.
5. Ask rather than assume when a choice changes public behavior, architecture, persistence, security, compatibility, or the approved tree.
6. Implement in reviewable slices and report meaningful checkpoints. If evidence invalidates the approved tree, pause and propose an update.
7. Run focused tests while iterating, then the relevant broader build and test suite.
8. Report changed files, acceptance-criteria coverage, inspection findings addressed, verification results, approved guidance compliance, and any remaining risks. Suggest `{{skill:myspec-inspect}}` to record the resulting state.

Developer interaction is a design constraint. Do not silently fill important gaps merely to finish in one turn.

## Coding Rules

- Follow repository instructions and established patterns.
- Cover every BDD acceptance scenario with automated tests where feasible, including all its outcomes and specified critical success, failure, boundary, authorization, and data-integrity paths. When automation is infeasible, name the criterion, the limitation, and a concrete manual or other verification procedure and its result; an unverified scenario remains a gap.
- If implementation or inspection reveals a required behavioral change, resolve it in `spec.md` through `{{skill:myspec-prescribe}}` before implementing that change, then update affected mappings and tests. Never weaken criteria to fit the implementation or treat inspection suggestions as new behavioral requirements.
- Keep production logic free of avoidable duplication.
- Put at most one top-level class, record, struct, or interface definition in each source file, except language-generated or established repository exceptions.
- Keep responsibilities cohesive and dependencies explicit.
- Prefer the smallest change that fully satisfies the spec.
- Do not add unrelated refactors or dependencies.
- Do not claim an acceptance criterion is covered without naming its test or verification evidence.
- Never let Myspec guidance override higher-priority instructions. Pause and surface a conflict before making affected source edits.
