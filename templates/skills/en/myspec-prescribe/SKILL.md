---
name: myspec-prescribe
description: Create a small, clear, QA-reviewable code change specification and save it in a suggested-name folder under my-specs/specs, registering new specs as proposed in the lifecycle manifest and scoping impacts on finished specs to new specs. Use when a developer asks to define, scope, specify, or write acceptance criteria for a feature, fix, refactor, or other code change before implementation.
---

# Myspec Prescribe

Turn a change request into a compact, testable contract for implementation and QA.

## Guidance & Lifecycle Gates

1. Read every rule under `my-specs/coding-practices/` and `my-specs/general-guidelines/` (run `myspec rule -f`). Treat applicable `Status: Approved` documents as mandatory; surface conflicts with higher-priority instructions.
2. Read `my-specs/specs/manifest.json` before creating or revising specs. If missing or inconsistent, reconcile it via `{{skill:myspec-setup}}` first.
3. Never revise a `finished` or `discarded` spec, its tree, inspections, or completion entry. Any change that can impact a finished spec—even a bugfix or behavior-preserving refactor—requires a new numbered spec; resuming the subject of a discarded spec also requires a new spec.
4. For every newly saved spec, append `{"id":"<folder>","status":"proposed","completionInspection":null}` to `manifest.json` in the same task (re-reading before writing and preserving all other entries/fields). Revising a `proposed` or `active` spec preserves its status.
5. Discard a `proposed` spec only when the developer explicitly decides it will not be implemented: change only that entry to `"status":"discarded"` with `completionInspection: null`, and keep the folder and `spec.md`. An `active` spec is not discarded; the developer first decides what to do with the started implementation.

## As-Is Specs

Write every `proposed` or `active` spec as a standalone, as-is description of the work it currently requires:
- Describe only current required behavior. Remove obsolete context, scope, assumptions, and criteria when revising, and never leave comparisons ("previously", "now", "instead of", "changed from") in the body.
- Keep stable AC IDs when revising: rewrite surviving ACs as-is, drop obsolete ones without renumbering or reusing their IDs.
- Put context on earlier revisions or another spec changed by this one only in an optional closing `## Revision History` (date, what changed, concrete reason, folder ID). Omit it unless needed; the body must stand alone without it.
- Finished and discarded specs are frozen and never rewritten.

## Workflow

1. Read the request, relevant repository context, approved guidance, and `my-specs/metrics/` (when present, via `myspec metric -f`) to know applicable gates. To check overlap with existing specs, scan their criteria with `myspec <spec-id> criteria` (one criterion in full with `myspec <spec-id> criteria <N>`, or the full spec with `myspec <spec-id> read`) instead of navigating spec folders manually.
2. Ask focused questions only for material ambiguities that substantially alter scope or observable behavior; otherwise record conservative assumptions.
3. Choose a concise kebab-case name and assign the next zero-padded three-digit prefix (`001`, `002`, ...) not used by any folder in `my-specs/specs/` or entry in `manifest.json`.
4. Save `my-specs/specs/<NNN>-<name>/spec.md` using [assets/spec-template.md](assets/spec-template.md). Never leave a spec only in chat.
5. Verify the body is testable, internally consistent, as-is, and free of duplicated coding practices or guidelines.
6. Register the spec in `manifest.json` and return both paths plus any recorded assumptions.

## Acceptance Criteria Rules

- Acceptance criteria in `spec.md` are the single source of truth for change-specific observable behavior. Every required change-specific outcome or target mentioned in Summary or Scope must have an AC.
- Write every criterion as a BDD scenario with a stable ID (`AC-01`, `AC-02`, ...), concrete `Given` preconditions, one `When` action/event, and verifiable `Then` (and `And`) outcomes with concrete inputs, values, state effects, or units/thresholds. Avoid vague phrasing ("works correctly"). No Gherkin runner or specific test naming is required.
- Separate distinct success, rejection, permission, boundary, and data-integrity outcomes into distinct criteria.
- Do not repeat or paraphrase approved coding practices, general guidelines, or metric gates as ACs (including generic "follows guidelines" criteria); they are enforced directly from their source documents. Reference a rule only when needed for context.
- Describe outcomes, not implementation plans; do not invent product behavior beyond the request.
