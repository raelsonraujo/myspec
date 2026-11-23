# my-specs

Repository contract used by the Myspec skills. Metric, practice, and guideline documents start as `Status: Proposed` and only constrain the skills after a developer explicitly approves them (`Status: Approved`).

Contract documents are shared with the team and record their creator and approvers from Git. Everything under `specs/` is the developer's local working record: it carries no Git identity, only a status and a dated revision history.

| Path | Content | Created by |
| --- | --- | --- |
| `metrics/` | One quality metric the developer chose per file, with how to measure it and its gates | `myspec-setup` |
| `measurement/` | Scripts and settings that measure the metrics, with installation steps in its README; absent without a tooling template | `myspec install --tooling` |
| `coding-practices/` | One repository coding practice per file | `myspec-setup` |
| `general-guidelines/` | One guideline shared by all Myspec skills per file, including the build and test commands | `myspec-setup` |
| `quality-report.md` | Project-wide values of the approved metrics with improvement opportunities | `myspec-quantify` |
| `compliance-report.md` | Project-wide assessment of approved coding practices and guidelines, with evidence, violations, and review gaps | `myspec-audit` |
| `specs/manifest.json` | Spec lifecycle and final inspection references | `myspec-setup`, `myspec-prescribe`, `myspec-implement`, `myspec-inspect` |
| `specs/NNN-<name>/` | `spec.md`, `file-tree.md`, and `inspections/inspection-NNN.md` for each change | `myspec-prescribe`, `myspec-implement`, `myspec-inspect` |

## Workflow

`specs/manifest.json` tracks every spec by its exact folder name. Setup builds it from existing implementation and inspection evidence when missing. The only lifecycle is `proposed → active → finished`: prescribe adds new specs as `proposed`; implement creates an as-is `file-tree.md` blueprint (pausing by default for the developer to check it, or proceeding automatically when explicitly requested by the developer or authorized by an approved general guideline) and activates the spec (`myspec activate <id>`, recording `baseCommit`) immediately before editing source/test code; inspect runs deterministic gates via `myspec gate <id>` (preferably in a fresh context), records a `Ready` or `Ready with observations` inspection with the inspected commit, and presents findings so the developer can finalize via `myspec finish <id>` or explicit confirmation. Only then does the manifest entry become `finished` with its `completionInspection`. A blocked inspection leaves the spec active. A `proposed` spec the developer decides not to implement becomes `discarded`, a final status with `completionInspection: null`; its folder stays as a record. The Portuguese workspace uses `specs/manifesto.json` with Brazilian Portuguese keys (`commitBase`) and the lifecycle `proposta → ativa → finalizada`, plus `descartada`. Language migration translates the manifest representation while retaining IDs, status meaning, completion sequences, and custom fields.

```json
{
  "version": 1,
  "specs": [
    { "id": "001-example", "status": "finished", "completionInspection": "002", "baseCommit": "a1b2c3d" },
    { "id": "002-follow-up", "status": "proposed", "completionInspection": null }
  ]
}
```

`completionInspection` identifies the three-digit sequence of the final inspection in that spec's `inspections/` folder; unfinished entries use `null`. Finished specs, their trees, inspections, and completion entries remain immutable. Every later change that can impact their behavior or implementation, including fixes, patches, and refactors that preserve their criteria, requires a new spec. The new spec may change the same source files and explicitly describe the later behavior while preserving the finished spec as history. Discarded specs are immutable too; resuming their subject requires a new spec. Status never goes backward.

The BDD acceptance criteria in each `spec.md` are the single source of truth for that change's specific measurable behaviors. Prescription defines every required change-specific outcome as an identified `Given / When / Then` scenario (`AC-01`, etc.); the file tree maps those IDs to production and verification locations, implementation verifies their outcomes, and inspection judges the same scenarios with evidence. Summary, scope, and assumptions provide context and boundaries, without creating additional behavioral requirements.

Proposed and active specs describe only the unit of work they currently require, as-is. Creating or revising a spec removes obsolete context, scope, and criteria and rewrites what still applies as a direct requirement, without comparisons with earlier revisions in the body. When earlier context matters, such as when a spec changes behavior delivered by another spec, it goes only in an optional `## Revision History` section at the end of the spec, or the equivalent section the project already uses, stating what changed and why. Implementation and inspection treat that section as context, never as requirements. Finished specs stay frozen.

Approved coding practices, general guidelines, and quality metric gates are enforced directly from their source documents without an AC in each spec. Do not repeat or paraphrase practices or guidelines as criteria, including generic compliance criteria; reference the source only when context is needed. Their absence from the criteria is not a contract gap, and inspection reports violations against the source rule separately from AC results.

Resolve missing, ambiguous, or changed behaviors in the spec's criteria before affected implementation work. Inspection reports contract gaps and cannot declare completion while a criterion is unmet or lacks evidence. Existing specs are not rewritten automatically on install. BDD scenarios may stay in Markdown and use the repository's existing test tooling and naming conventions.

Patching is the exception for unfinished work or changes that cannot impact a finished spec: an eligible change needs no new spec or BDD criteria. Its default limit is five files, including tests; an applicable project general guideline with `Status: Approved` under `general-guidelines/` may override that file-count limit. Its other scope gates still apply, and it must preserve the criteria of any implemented spec it touches.

| Skill | Role |
| --- | --- |
| `myspec-setup` | Build the spec manifest and define metrics and their gates, coding practices, and guidelines. |
| `myspec-prescribe` | Turn a change request into a testable spec and register it as proposed. |
| `myspec-implement` | Create the as-is file-tree blueprint (check-first by default, opt-in auto-implement), activate the spec, and implement it. |
| `myspec-inspect` | Review the implementation (preferably in a fresh context) against the spec, approved rules, and `myspec gate`, then record an inspection for finalization via `myspec finish`. |
| `myspec-patch` | Make a small fix of at most five files by default (verified with `myspec check-patch`), overridable by an approved project general guideline; impacts on finished specs require a new spec. |
| `myspec-quantify` | Run `myspec gate --project` to judge project-wide approved metrics and suggest improvements that can start new specs. |
| `myspec-audit` | Sweep the whole project for compliance with approved practices and guidelines, record evidence and review gaps, and prioritize follow-up. |

Use audit for project-wide adherence to rules, quantify for metric measurement, and inspect for one spec's acceptance review. Audit needs no metrics or specs and writes only `compliance-report.md`. It follows each rule's scope and exceptions, distinguishes violations from missing evidence, makes partial review explicit, and revisits previous findings. It does not fix code or change spec lifecycle states.

A typical cycle after setup:

```text
prescribe > implement (file tree check, or opt-in auto) > implement > inspect (`myspec gate`) > `myspec finish` > prescribe (next spec)
```

Repeat implement or patch followed by inspect as often as needed. Deterministic CLI commands support the workflow: `myspec approve <path>` approves contract documents with Git identity, `myspec activate <id>` activates a spec with its `baseCommit`, `myspec gate [<id>|--project]` runs build/tests, structured metric parsers, and file-tree drift checks, `myspec finish <id>` verifies the latest passing inspection and git baseline before finalizing, and `myspec check-patch` validates patch eligibility. Prefer implement over patch when a change exceeds the applicable patch file limit or affects a `proposed` spec or one without a `file-tree.md`.

Invoke a skill with `$name` in Codex or `/name` in Claude Code and Gemini (Antigravity / Gemini CLI), e.g. `$myspec-setup` or `/myspec-setup`.

`specs/manifest.json` is maintained by the skills; setup initializes it without resetting existing statuses. `myspec.json` is maintained by the `myspec` CLI; do not edit it by hand.
