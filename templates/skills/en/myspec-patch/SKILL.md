---
name: myspec-patch
description: Make a small, bounded code adjustment without requiring a Myspec specification, while preserving approved product directives, following repository Myspec guidance and established patterns, and using proportionate automated verification. Use when a developer requests a minor fix, correction, cleanup, or targeted behavior adjustment that is too small to justify a spec.
---

# Myspec Patch

Make a small change with the same engineering discipline as Myspec implementation, without creating or requiring a specification or file tree.

## Mandatory Guidance Gate

Before moving beyond initial read-only repository and request discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

Approved product directives define project vocabulary and product invariants. Treat them as constraints on the patch, not as optional implementation advice. If the request conflicts with an approved directive, stop before source edits and ask the developer to change the request or use `{{skill:myspec-setup}}` to revise and approve the directive.

## Scope Gate

1. Read the request, repository instructions, and affected code before editing.
2. Treat a patch as bounded: it should have a clear requested outcome, touch a small cohesive area, and avoid architectural or product-design decisions.
3. If the work changes public behavior, architecture, persistence, security, compatibility, or needs a product or cross-cutting design decision not already settled by an approved product directive, pause and recommend `{{skill:myspec-prescribe}}` instead. Do not silently expand the patch.
4. If an existing spec is explicitly named, use `{{skill:myspec-implement}}` and its approved-file-tree gate rather than bypassing it with this skill.

## Implementation

1. Complete the Mandatory Guidance Gate, then read `my-specs/tooling.md` when present. Use it to identify quality tooling and any defined contract sections; do not treat it as a substitute for reading the directive and guidance files under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`.
2. Identify the requested behavior, the approved product directives it affects, and its relevant success, failure, boundary, authorization, and data-integrity paths. Preserve the directives even when the request omits the relevant invariant. State conservative assumptions; ask before proceeding when an unresolved choice materially changes observable behavior.
3. Before source edits, tell the developer the intended small change and any material choice not settled by the request or repository evidence.
4. Implement the smallest cohesive change. Work in reviewable slices and report meaningful checkpoints.
5. Follow repository instructions and established patterns. Keep responsibilities cohesive, dependencies explicit, and production logic free of avoidable duplication.
6. Add or update focused automated tests for the affected critical paths where feasible. Do not add unrelated refactors or dependencies.
7. Run focused tests while iterating, then the relevant broader build and test suite when proportionate to the change.
8. Report changed files, requested-behavior coverage with named test or verification evidence, verification results, approved product-directive and guidance compliance, assumptions, and remaining risks.

## Coding Rules

- Keep at most one top-level class, record, struct, or interface definition in each source file, except language-generated or established repository exceptions.
- Prefer the smallest change that fully satisfies the request.
- Never claim behavior is covered without naming its test or verification evidence.
- Never let Myspec guidance override higher-priority instructions. Pause and surface a conflict before making affected source edits.
