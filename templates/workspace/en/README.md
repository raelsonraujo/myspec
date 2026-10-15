# my-specs

Repository contract used by the Myspec skills. Every rule here starts as `Status: Proposed` and only constrains the skills after a developer explicitly approves it (`Status: Approved`).

Contract documents are shared with the team and record their creator and approvers from Git. Everything under `specs/` is the developer's local working record: it carries no Git identity, only a status and a dated revision history.

| Path | Content | Created by |
| --- | --- | --- |
| `metrics/` | One quality metric the developer chose per file, with how to measure it and its gates | `myspec-setup` |
| `product-directives/` | Product concepts, terminology, and invariants | `myspec-setup` |
| `coding-practices/` | One repository coding practice per file | `myspec-setup` |
| `general-guidelines/` | One guideline shared by all Myspec skills per file, including the build and test commands | `myspec-setup` |
| `quality-report.md` | Project-wide values of the approved metrics with improvement opportunities | `myspec-quantify` |
| `specs/NNN-<name>/` | `spec.md`, `file-tree.md`, and `inspections/inspection-NNN.md` for each change | `myspec-prescribe`, `myspec-implement`, `myspec-inspect` |

## Workflow

| Skill | Role |
| --- | --- |
| `myspec-setup` | Define metrics and their gates, product directives, coding practices, and guidelines. |
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
