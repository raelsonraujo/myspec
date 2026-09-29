# my-specs

Repository contract used by the Myspec skills. Every rule here starts as `Status: Proposed` and only constrains the skills after a developer explicitly approves it (`Status: Approved`).

| Path | Content | Created by |
| --- | --- | --- |
| `tooling.md` | Approved commands for cyclomatic complexity and test coverage | `myspec-setup` |
| `product-directives/` | Product concepts, terminology, and invariants | `myspec-setup` |
| `coding-practices/` | One repository coding practice per file | `myspec-setup` |
| `general-guidelines/` | One guideline shared by all Myspec skills per file | `myspec-setup` |
| `specs/NNN-<name>/` | `spec.md`, `file-tree.md`, and `quality-report.md` for each change | `myspec-prescribe`, `myspec-implement`, `myspec-quantify` |

## Workflow

1. `myspec-setup` — define tooling, product directives, coding practices, and guidelines.
2. `myspec-prescribe` — turn a change request into a testable spec.
3. `myspec-implement` — propose and approve a file tree, then implement the spec.
4. `myspec-inspect` — review the implementation against the spec and approved rules.
5. `myspec-quantify` — measure complexity and coverage with the approved tooling.
6. `myspec-patch` — make a small, bounded fix that does not justify a spec.

Invoke a skill with `$name` in Codex or `/name` in Claude Code, e.g. `$myspec-setup` or `/myspec-setup`.

`myspec.json` is maintained by the `myspec` CLI; do not edit it by hand.
