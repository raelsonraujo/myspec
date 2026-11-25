---
name: myspec-patch
description: Make a small, bounded code adjustment of at most five files by default, with the file limit overridable by an approved project general guideline, without requiring a new Myspec specification or file tree. Preserve the contract of any implemented spec it touches, follow repository Myspec guidance and established patterns, and use proportionate automated verification. Use for a minor fix, correction, cleanup, targeted behavior adjustment, or inspection findings on an active spec; impacts on finished specs require a new spec.
---

# Myspec Patch

Make a small, bounded change without creating a new spec or file tree, provided it cannot impact any `finished` spec.

## Guidance & Scope Gates

1. Read every Markdown file under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat applicable `Status: Approved` documents as mandatory; check whether an approved general guideline overrides the default 5-file limit.
2. Read `my-specs/specs/manifest.json` (reconcile via `{{skill:myspec-setup}}` if missing/inconsistent) and inspect affected specs (`spec.md`, `file-tree.md`, latest inspection). Scan a spec's criteria with `myspec <spec-id> criteria` and read only the relevant ones with `myspec <spec-id> criteria <N>` before opening the whole `spec.md`.
3. Check eligibility before editing (and verify again after editing with **`myspec check-patch`** — pass `--limit <N>` if an approved guideline overrides 5):
   - **Finished spec boundary:** If the change can impact any `finished` spec's behavior or implementation—even a small fix or refactor—stop and recommend `{{skill:myspec-prescribe}}` for a new spec.
   - **File limit:** If the change exceeds the applicable file limit (default 5, including tests), recommend `{{skill:myspec-implement}}` (if an active spec covers it) or `{{skill:myspec-prescribe}}`.
   - **Proposed spec / missing blueprint:** If the change targets a `proposed` spec or an active spec missing `file-tree.md`, recommend `{{skill:myspec-implement}}`.
   - **Contract or design change:** If the change alters an existing spec's acceptance criteria, or (outside any spec) alters public behavior, architecture, persistence, security, or compatibility without a settled decision, recommend `{{skill:myspec-prescribe}}`.

## Implementation

1. Read `my-specs/metrics/` (when present) to respect applicable quality gates.
2. State the intended small change and any material assumptions before editing.
3. Implement the smallest cohesive fix following approved coding practices and established patterns. Avoid unrelated refactors or unrequested dependencies.
4. Add or update focused automated tests for affected paths and run proportionate build/test verification plus `myspec check-patch`.
5. Report changed files (calling out any file outside an active spec's `file-tree.md`), verification evidence, approved guidance compliance, and remaining risks. When patching an active spec, name the addressed inspection findings and suggest `{{skill:myspec-inspect}}`.

Never let Myspec guidance override higher-priority instructions; surface conflicts before editing.
