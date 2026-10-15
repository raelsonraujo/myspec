---
name: myspec-implement
description: Implement an existing specification from a named folder under my-specs/specs while preserving approved product directives, using a developer-approved file structure, focused interaction, clean code, and tests for critical paths and acceptance criteria. Use when a developer asks to implement, continue, or complete one of the repository's code specs.
---

# Myspec Implement

Implement a spec without silently deciding its architecture or product behavior.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and spec discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

Approved product directives define project vocabulary and product invariants. Treat them as constraints on the spec and file tree, not as optional implementation advice. If the requested spec conflicts with an approved directive, stop before proposing or changing implementation files and ask the developer to revise the spec or use `{{skill:myspec-setup}}` to revise and approve the directive.

## Hard Gate: File Tree

Resolve the requested spec folder under the repository-root `my-specs/specs` directory and read `spec.md`.

If `file-tree.md` is absent:

1. Inspect the repository structure and the spec.
2. Create `file-tree.md` in the same spec folder using [assets/file-tree-template.md](assets/file-tree-template.md).
3. Set its status to `Proposed` and add a `Proposed` entry dated today (`YYYY-MM-DD`) to `Revision History`.
4. Include files to add, modify, or delete; the responsibility of each file; test locations; and important structural decisions.
5. End the task after presenting the proposal. Do not edit implementation files.

If `file-tree.md` exists but its status is not `Approved`:

1. Review it against the spec and repository.
2. Present any concerns or alternatives.
3. Ask the developer to approve or revise it.
4. Do not edit implementation files.

On a later invocation, incorporate requested revisions or, when the developer explicitly approves the proposal, change its status to `Approved`. Record every revision and approval as a new dated `Revision History` entry with a concise description of what changed or was approved; never edit or remove earlier entries. Revising an approved tree sets its status back to `Proposed` until the developer approves it again. A file's mere existence is never approval.

The file tree, like everything under the spec folder, is the developer's local working record: never record a Git identity, author, or approver in it.

## Interactive Implementation

1. Read the approved file tree, spec, repository instructions, and affected code. When the spec folder has an `inspections/` folder, read its highest-numbered inspection and treat its open findings as input for this implementation; an inspection verdict never prevents implementing.
2. Complete the Mandatory Guidance Gate, then read the metric files under `my-specs/metrics/` when present. Use them to identify quality tooling and the gates the changed code must meet; do not treat them as a substitute for reading the directive and guidance files under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`.
3. Map each acceptance criterion to implementation work, tests, and the approved product directives it affects. Preserve the directives even when an acceptance criterion omits the relevant invariant.
4. Before source edits, tell the developer the intended first slice and raise material choices not settled by the spec or approved tree.
5. Ask rather than assume when a choice changes public behavior, architecture, persistence, security, compatibility, or the approved tree.
6. Implement in reviewable slices and report meaningful checkpoints. If evidence invalidates the approved tree, pause and propose an update.
7. Run focused tests while iterating, then the relevant broader build and test suite.
8. Report changed files, acceptance-criteria coverage, inspection findings addressed, verification results, approved product-directive and guidance compliance, and any remaining risks. Suggest `{{skill:myspec-inspect}}` to record the resulting state.

Developer interaction is a design constraint. Do not silently fill important gaps merely to finish in one turn.

## Coding Rules

- Follow repository instructions and established patterns.
- Cover every acceptance criterion and all critical success, failure, boundary, authorization, and data-integrity paths with automated tests where feasible.
- Keep production logic free of avoidable duplication.
- Put at most one top-level class, record, struct, or interface definition in each source file, except language-generated or established repository exceptions.
- Keep responsibilities cohesive and dependencies explicit.
- Prefer the smallest change that fully satisfies the spec.
- Do not add unrelated refactors or dependencies.
- Do not claim an acceptance criterion is covered without naming its test or verification evidence.
- Never let Myspec guidance override higher-priority instructions. Pause and surface a conflict before making affected source edits.
