---
name: myspec-prescribe
description: Create a small, clear, QA-reviewable code change specification and save it in a suggested-name folder under my-specs/specs. Use when a developer asks to define, scope, specify, or write acceptance criteria for a feature, fix, refactor, or other code change before implementation.
---

# Myspec Prescribe

Turn a change request into a compact contract for implementation and QA.

## Mandatory Guidance Gate

Before moving beyond initial request and repository discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

Approved product directives define the product vocabulary and invariants a spec must respect. Treat them as constraints even when their `Applies to` field names only implementation skills. Write the spec in their terminology and keep its scope, acceptance criteria, and assumptions consistent with them. If the request conflicts with an approved directive, stop before creating the spec, name the conflicting rule, and ask the developer to change the request or to revise and approve the directive with `{{skill:myspec-setup}}`.

## Workflow

1. Read the request and inspect relevant repository context when available.
2. Complete the Mandatory Guidance Gate, then read the metric files under `my-specs/metrics/` when present. Use them to identify quality tooling and the gates the specified change must meet; do not treat them as a substitute for reading the directive and guidance files at `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`.
3. Identify material ambiguities that would substantially change scope or observable behavior. Ask focused questions only for those ambiguities; otherwise state conservative assumptions.
4. Suggest a concise kebab-case name based on the requested behavior.
5. Inspect immediate directories under `my-specs/specs` whose names begin with a three-digit prefix followed by `-`. Assign the next sequential, zero-padded three-digit prefix, beginning with `001` when none exist. Do not renumber existing folders.
6. Create `my-specs/specs/<sequence>-<spec-name>/spec.md` from [assets/spec-template.md](assets/spec-template.md). Treat `my-specs/specs` as relative to the repository root.
7. Review the result for testability, internal consistency, accidental scope expansion, and compliance with approved product directives and guidelines.
8. Return the created path and briefly identify any recorded assumptions.

Always produce the Markdown file before completing the task. Never leave the specification only in chat.

## Content Rules

- Describe the desired outcome, not an implementation plan.
- Keep requirements small, concrete, and unambiguous.
- Define the code areas or responsibilities expected to change without prescribing exact files unless the request or repository evidence supports them.
- Separate in-scope and out-of-scope behavior explicitly.
- Write acceptance criteria as observable QA checks. Prefer `Given / When / Then` wording when it improves precision.
- Cover happy paths, relevant failure paths, boundaries, permissions, data effects, and compatibility where applicable.
- Give every acceptance criterion a stable identifier such as `AC-01`.
- Do not invent product behavior beyond what the request and approved product directives establish. Record a reasonable assumption or ask the developer when the choice is material.
- Preserve existing files. If the numbered suggested folder already exists, update it only when the developer clearly intends to revise that spec; otherwise allocate the next available sequence number and use it with the suggested name.
- Never let Myspec guidance override higher-priority instructions. Surface a conflict that prevents compliant output.
