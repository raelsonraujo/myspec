---
name: myspec-patch
description: Make a small, bounded code adjustment of at most three files without requiring a new Myspec specification or file tree, while preserving the contract of any implemented spec it touches, following repository Myspec guidance and established patterns, and using proportionate automated verification. Use when a developer requests a minor fix, correction, cleanup, targeted behavior adjustment, or a fix for inspection findings on an already implemented spec.
---

# Myspec Patch

Make a small change with the same engineering discipline as Myspec implementation, without creating or requiring a specification or file tree.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and request discovery, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Scope Gate

1. Read the request, repository instructions, and affected code before editing.
2. Identify the specs under `my-specs/specs` whose scope the change affects: a spec named by the developer, or one whose `spec.md` or `file-tree.md` covers the affected behavior or files. For each, read `spec.md`, `file-tree.md` when present, and the highest-numbered inspection under its `inspections/` folder when present.
3. Count the files the change must add, modify, or delete, including test files.
4. Recommend `$myspec-implement` instead of patching when the change needs more than three files, or when it affects a spec whose `file-tree.md` is absent or has no `Approved` entry in its `Revision History`, meaning that spec has not been implemented yet. When the change needs more than three files and no spec covers it, recommend `$myspec-prescribe` to create one first.
5. If the change is not covered by an existing spec and changes public behavior, architecture, persistence, security, compatibility, or needs a product or cross-cutting design decision the request does not settle, pause and recommend `$myspec-prescribe` instead.
6. Otherwise patch. A patch may change code within the scope of an implemented spec, for example to address findings from its latest inspection. Preserve that spec's acceptance criteria and approved file-tree responsibilities, and report every file the patch touches outside its approved file tree. Do not silently expand the patch; if the file count or affected specs change while working, re-apply this gate.

## Implementation

1. Complete the Mandatory Guidance Gate, then read the metric files under `my-specs/metrics/` when present. Use them to identify quality tooling and the gates the changed code must meet; do not treat them as a substitute for reading the guidance files under `my-specs/coding-practices/` and `my-specs/general-guidelines/`.
2. Identify the requested behavior and its relevant success, failure, boundary, authorization, and data-integrity paths. State conservative assumptions; ask before proceeding when an unresolved choice materially changes observable behavior.
3. Before source edits, tell the developer the intended small change and any material choice not settled by the request or repository evidence.
4. Implement the smallest cohesive change. Work in reviewable slices and report meaningful checkpoints.
5. Follow repository instructions and established patterns. Keep responsibilities cohesive, dependencies explicit, and production logic free of avoidable duplication.
6. Add or update focused automated tests for the affected critical paths where feasible. Do not add unrelated refactors or dependencies.
7. Run focused tests while iterating, then the relevant broader build and test suite when proportionate to the change.
8. Report changed files, requested-behavior coverage with named test or verification evidence, verification results, approved guidance compliance, assumptions, and remaining risks. When the patch touched an implemented spec, name the inspection findings it addresses and suggest `$myspec-inspect` to record the new state.

## Coding Rules

- Keep at most one top-level class, record, struct, or interface definition in each source file, except language-generated or established repository exceptions.
- Prefer the smallest change that fully satisfies the request.
- Never claim behavior is covered without naming its test or verification evidence.
- Never let Myspec guidance override higher-priority instructions. Pause and surface a conflict before making affected source edits.
