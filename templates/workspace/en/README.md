# my-specs

Repository contract used by the Myspec skills. Every rule here starts as `Status: Proposed` and only constrains the skills after a developer explicitly approves it (`Status: Approved`).

Contract documents are shared with the team and record their creator and approvers from Git. Everything under `specs/` is the developer's local working record: it carries no Git identity, only a status and a dated revision history.

| Path | Content | Created by |
| --- | --- | --- |
| `metrics/` | One quality metric the developer chose per file, with how to measure it and its gates | `myspec-setup` |
| `measurement/` | Scripts and settings that measure the metrics, with installation steps in its README; absent without a tooling template | `myspec install --tooling` |
| `coding-practices/` | One repository coding practice per file | `myspec-setup` |
| `general-guidelines/` | One guideline shared by all Myspec skills per file, including the build and test commands | `myspec-setup` |
| `quality-report.md` | Project-wide values of the approved metrics with improvement opportunities | `myspec-quantify` |
| `specs/NNN-<name>/` | `spec.md`, `file-tree.md`, and `inspections/inspection-NNN.md` for each change | `myspec-prescribe`, `myspec-implement`, `myspec-inspect` |

## Workflow

The BDD acceptance criteria in each `spec.md` are the single source of truth for that change's specific measurable behaviors. Prescription defines every required change-specific outcome as an identified `Given / When / Then` scenario (`AC-01`, etc.); the file tree maps those IDs to production and verification locations, implementation verifies their outcomes, and inspection judges the same scenarios with evidence. Summary, scope, and assumptions provide context and boundaries, without creating additional behavioral requirements.

Approved coding practices, general guidelines, and quality metric gates are enforced directly from their source documents without an AC in each spec. Do not repeat or paraphrase practices or guidelines as criteria, including generic compliance criteria; reference the source only when context is needed. Their absence from the criteria is not a contract gap, and inspection reports violations against the source rule separately from AC results.

Resolve missing, ambiguous, or changed behaviors in the spec's criteria before affected implementation work. Inspection reports contract gaps and cannot declare completion while a criterion is unmet or lacks evidence. Existing specs are not rewritten automatically on install. BDD scenarios may stay in Markdown and use the repository's existing test tooling and naming conventions.

Patching is the exception: an eligible change of at most three files needs no new spec or BDD criteria. Its existing scope gates still apply, and it must preserve the criteria of any implemented spec it touches.

| Skill | Role |
| --- | --- |
| `myspec-setup` | Define metrics and their gates, coding practices, and guidelines. |
| `myspec-prescribe` | Turn a change request into a testable spec. |
| `myspec-implement` | Propose and approve a file tree, then implement the spec. |
| `myspec-inspect` | Review the implementation against the spec and approved rules, measure the approved metrics, and record an inspection with a verdict. |
| `myspec-patch` | Make a small fix of at most three files, including within an implemented spec. |
| `myspec-quantify` | Judge the whole project's approved metrics and suggest improvements that can start new specs. |

A typical cycle after setup:

```text
prescribe > implement (file tree) > implement > inspect > implement > inspect > patch > inspect
```

Repeat implement or patch followed by inspect as often as needed. A spec is complete, and work can advance to the next one, when its latest inspection is `Ready` or `Ready with observations`; the verdict never prevents running any skill. Prefer implement over patch when a change needs more than three files or affects a spec whose file tree has never been approved.

Invoke a skill with `$name` in Codex or `/name` in Claude Code, e.g. `$myspec-setup` or `/myspec-setup`.

`myspec.json` is maintained by the `myspec` CLI; do not edit it by hand.
