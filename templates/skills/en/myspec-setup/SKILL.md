---
name: myspec-setup
description: Initialize or reconcile the spec lifecycle manifest, or set up or revise the repository-wide Myspec contract by asking the developer to define the quality metrics with their tooling and gates, repository coding practices, and cross-skill guidelines. Use when the spec manifest is missing or needs reconciliation, before Myspec quality measurement, when my-specs/metrics is missing or still a single tooling.md, or when metrics, metric tools, gates, coding practices, or shared Myspec guidance need to change.
---

# Myspec Setup

Establish a reproducible, developer-approved contract for the Myspec workspace (`my-specs/`, relative to repository root).

## Guidance Gate

Read every rule under `my-specs/coding-practices/` and `my-specs/general-guidelines/` (run `myspec rule -f`, or `myspec rule` / `myspec rule <name>`). Treat each applicable document with `Status: Approved` as mandatory and surface conflicts with higher-priority instructions. Unapproved files, missing folders, or `None` sections create no constraint.

## Workflow

Initialize or reconcile `my-specs/specs/manifest.json` first when missing or out of sync; a manifest-only request does not require redefining metrics or guidance.

1. Inspect repository manifests, test projects, tool files, build scripts, and CI without installing or modifying dependencies.
2. Read every metric under `my-specs/metrics/` (run `myspec metric -f`, when present). If legacy `my-specs/tooling.md` exists, propose splitting it (see [Legacy Tooling Contract](#legacy-tooling-contract)).
3. Ask the developer for exact build and test commands and record them in a general guideline (such as `my-specs/general-guidelines/build-and-test-commands.md`) with a fenced ```` ```json myspec ```` block (`{"kind":"verify","workingDir":".","commands":[...]}`) so `myspec gate` can execute them deterministically. In the block that runs the tests, whether `verify` or metric, declare where the results land under `testResults` (`{"format":"trx","paths":[...],"skipped":"attention"}` or `"blocking"`): `myspec gate` reads them on every run, reports the counts and blocks on a failed test, a failed step or missing results. Any approved general guideline or coding practice may carry its own `verify` block when its rule can be checked by a command that exits non-zero on violation; `myspec gate` runs guidelines first, then practices, each folder in file-name order, and any failure blocks. Then ask which quality metrics to measure. Never assume, infer, or default to any metric; offer candidates only when asked. Zero metrics is valid.
4. For each chosen metric, capture: definition (unit, granularity), working directory, restore/prerequisite commands, pinned tool and version, exact measurement command, structured output format and result path, scope/exclusions, changed-code isolation, reported values, explicit `## Gates`, and a matching ```` ```json myspec ```` `"kind":"metric"` contract block (measurement steps in `commands`; formats: `cobertura`, `sarif`, `trx`, `stryker`, `json`, or `manual`) so `myspec gate` evaluates it deterministically.
5. Ask whether to add repository coding practices under `my-specs/coding-practices/` and cross-skill guidelines under `my-specs/general-guidelines/` (for example, overriding the patch file limit or opting into automatic implementation after writing `file-tree.md`).
6. Create or update contract documents as `Status: Proposed` using `git config user.name` and `git config user.email` for immutable `Created by` / `Created on`:
   - metrics: one file per metric from [assets/metric-template.md](assets/metric-template.md)
   - guidelines: one file per guideline from [assets/general-guideline-template.md](assets/general-guideline-template.md)
   - practices: one file per practice from [assets/coding-practice-template.md](assets/coding-practice-template.md)
7. Present the proposal and ask for explicit approval or revisions. Do not mark documents approved without explicit approval.
8. Developers can approve deterministically with `myspec approve <file-or-path> -c "<context>"` (accepts a bare file name, relative path, or absolute path), or explicitly approve in a later turn so you set `Status: Approved` and append an entry (`Approved by`, `Approved on`, `Approval context`) without editing earlier entries or creation metadata.

## Spec Manifest

Maintain `my-specs/specs/manifest.json` (separate from CLI `my-specs/myspec.json`) from [assets/spec-manifest-template.json](assets/spec-manifest-template.json). Schema:
`{"version":1,"specs":[{"id":"001-example","status":"proposed","completionInspection":null,"baseCommit":null}]}` (`baseCommit` is optional; Portuguese uses `specs/manifesto.json` with `proposta → ativa → finalizada`).

Lifecycle only advances `proposed → active → finished`, and a `proposed` spec may end as `discarded`:
- `proposed`: implementation has not started (writing `file-tree.md` alone does not activate a spec).
- `active`: implementation started (`myspec <id> activate` records `baseCommit` before the first source/test edit).
- `finished`: finalized via `myspec <id> finish` or explicit developer confirmation after a `Ready` / `Ready with observations` (`Apta` / `Apta com ressalvas`) inspection; `completionInspection` stores the three-digit sequence (`"002"`), `null` otherwise.
- `discarded`: the developer explicitly decided not to implement a `proposed` spec. It is final, with `completionInspection: null`; the folder and `spec.md` stay as a record, and the ID is never reused.

When reconciling a missing manifest or untracked specs:
- Inspect each spec (`myspec <id> read`), `file-tree.md`, latest inspection (`myspec <id> inspection` or `-s` for its verdict), code/tests, and git history.
- Assign `finished` only with explicit developer confirmation of the latest passing inspection; assign `active` when implementation began without confirmation; assign `proposed` only when implementation has not begun; assign `discarded` only with an explicit developer decision not to implement. Ask if evidence is ambiguous.
- Preserve existing entries, completion references, and custom fields; never downgrade statuses, reset the manifest, or reopen `finished` or `discarded` specs. Report malformed data or conflicts rather than overwriting them.
- Finished and discarded specs, trees, inspections, and completion entries are immutable baselines; any later impact requires a new spec via `{{skill:myspec-prescribe}}`.

## Contract Rules

- Keep commands directly executable, versions pinned, exclusions explicit, and thresholds solely inside each metric's `## Gates`.
- Make every practice and guideline independently enforceable (applicability, required behavior, verification) so specs never duplicate them as acceptance criteria.
- Use concise kebab-case filenames and resolve every placeholder before approval.
- Never install dependencies, alter project configuration, or let Myspec guidance override higher-priority instructions.

## Legacy Tooling Contract

When `my-specs/tooling.md` exists, propose splitting it into one file per metric under `my-specs/metrics/` and `my-specs/general-guidelines/build-and-test-commands.md` as `Proposed`, converting targets into `## Gates` only after developer confirmation. Delete `my-specs/tooling.md` only after every replacement metric file is approved.
