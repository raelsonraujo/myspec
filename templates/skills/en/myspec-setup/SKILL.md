---
name: myspec-setup
description: Set up or revise the repository-wide Myspec contract by asking the developer to define quality tooling, product directives, repository coding practices, and cross-skill guidelines. Use before Myspec quality measurement, when my-specs tooling is missing, or when metric tools, product rules, coding practices, or shared Myspec guidance need to change.
---

# Myspec Setup

Establish a reproducible, developer-approved contract for the Myspec skills.

## Mandatory Guidance Gate

Before moving beyond initial repository discovery, read every Markdown file that exists under `my-specs/product-directives/`, `my-specs/coding-practices/`, and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Workflow

1. Inspect repository manifests, test projects, local tool files, build scripts, and CI configuration. Do not install or modify tooling.
2. Read `my-specs/tooling.md` when it exists, after completing the Mandatory Guidance Gate.
3. For cyclomatic complexity, ask the developer to define:
   - tool and pinned version;
   - installation or restore mechanism;
   - exact measurement command;
   - output format and result path;
   - measured production scope and exclusions.
4. For test coverage, ask the developer to define:
   - test runner, coverage collector, and pinned versions;
   - installation or restore mechanism;
   - exact build and coverage commands;
   - report format and result path;
   - measured production scope and exclusions.
5. Ask whether to define or revise repository product directives. If yes, ask how the repository should group and name them, then record the product concepts, terminology, policies, and cohesive invariants that `{{skill:myspec-implement}}` and `{{skill:myspec-patch}}` must preserve as one or more concise Markdown files under `my-specs/product-directives/`. If no product rules are currently known, leave that folder absent or empty and state that no product constraint was established.
6. Ask whether to define optional repository coding practices. If yes, record each concrete, verifiable practice for `{{skill:myspec-implement}}` and implementation-focused review as its own file under `my-specs/coding-practices/`; if no, leave that folder absent or empty.
7. Ask whether to define optional general Myspec guidelines. If yes, record each behavioral or output rule that every other Myspec skill must follow as its own file under `my-specs/general-guidelines/`; if no, leave that folder absent or empty.
8. When useful, offer repository-compatible candidates with concrete tradeoffs. Derive product-directive candidates from developer input, approved product artifacts, and established domain behavior, and label any inference that still needs developer confirmation. Never select a candidate merely because it is already familiar or implemented.
9. Create or update the contract documents, setting each newly created document's status to `Proposed` and recording its creator and creation date from the current repository's `git config user.name` and `git config user.email`. Use an `Approval History` section for approvals:
   - `my-specs/tooling.md` from [assets/tooling-template.md](assets/tooling-template.md);
   - each document under `my-specs/product-directives/` from [assets/product-directives-template.md](assets/product-directives-template.md);
   - one file per practice under `my-specs/coding-practices/`, from [assets/coding-practice-template.md](assets/coding-practice-template.md);
   - one file per guideline under `my-specs/general-guidelines/`, from [assets/general-guideline-template.md](assets/general-guideline-template.md).
10. Present the complete proposal and ask for explicit approval or revisions. End without marking it approved.
11. On a later invocation, incorporate requested revisions or, after explicit developer approval, set the document status to `Approved`. Unless the developer specifies a different identity, read the current repository's `git config user.name` and `git config user.email`. Append an approval entry; never replace earlier entries or change `Created by` or `Created on` after creation. Each entry must include `Approved by`, `Approved on`, and a concise `Approval context` that identifies what revision or decision was approved.

Do not treat silence, a pre-existing tool, or a successful command as approval. Do not install dependencies or alter project configuration unless the developer separately authorizes that work.

## Contract Rules

- Treat `my-specs` as relative to the repository root.
- Keep commands directly executable from a documented working directory.
- Pin versions or document the repository-controlled version source.
- Record generated-code and file-pattern exclusions explicitly.
- Define how changed implementation files are isolated from whole-project metrics.
- Include both line and branch coverage when the chosen collector supports them.
- Keep quality tooling in `my-specs/tooling.md`. Store product directives under `my-specs/product-directives/` using the repository's chosen document names and grouping. Store every repository coding practice and general Myspec guideline in a separate Markdown file under its respective folder; do not embed their rule text in `tooling.md`.
- Use a concise kebab-case filename that identifies the rule.
- Give every product-directive, practice, and guideline file its own status and append-only approval history.
- Give every contract document immutable `Created by` and `Created on` metadata. Format the creator as `<git user.name> <git user.email>` and ask the developer for an identity only when either Git value is unavailable.
- Format the default approval identity as `<git user.name> <git user.email>`; ask the developer for an identity only when either Git value is unavailable.
- Keep approval contexts concise and specific enough to identify the approved revision without duplicating the document.
- Keep coding practices actionable and repository-specific; avoid restating conventions already enforced elsewhere.
- Keep product-directive documents brief and product-specific. Define the relevant concepts and ubiquitous language, state observable policies or invariants, and identify the affected product behavior. Do not use them for implementation technique, architecture, or Myspec workflow.
- Treat approved product directives as constraints on later specifications and implementation. If a requested change or spec conflicts with one, require the directive to be revised and approved before implementing the conflicting behavior.
- Keep general guidelines applicable to all other Myspec skills and identify their expected behavior or output.
- Never let this contract override higher-priority instructions. Surface conflicts instead of silently choosing.
- Record a decision for every placeholder before approval.
