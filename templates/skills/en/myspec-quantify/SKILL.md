---
name: myspec-quantify
description: Measure cyclomatic complexity and automated test coverage for code implemented from a repository spec using developer-approved tooling, then recommend improvements without enforcing thresholds. Use when a developer asks for quality control, complexity analysis, coverage analysis, or a post-implementation review of a spec.
---

# Myspec Quantify

Produce evidence-based quality metrics for the code implemented by a spec and explain where improvement effort would pay off.

## Mandatory Guidance Gate

Before moving beyond initial repository discovery or executing a measurement command, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Workflow

1. Complete the Mandatory Guidance Gate, then read repository-root `my-specs/tooling.md`. Require status `Approved` and complete cyclomatic-complexity and test-coverage definitions. Use it to identify quality tooling and defined contract sections; do not treat it as a substitute for reading the guidance files at `my-specs/coding-practices/` and `my-specs/general-guidelines/`.
2. If the tooling contract is absent, incomplete, or not approved, stop and ask the developer to run `{{skill:myspec-setup}}`. Do not select substitute tooling.
3. Resolve the spec folder under repository-root `my-specs/specs` and read `spec.md` plus `file-tree.md` when present.
4. Identify implemented production and test files from the approved tree, version-control diff, and repository evidence. State the baseline used.
5. Obtain the results of the exact approved build, coverage, and complexity commands, applying their documented scope, exclusions, and every applicable defined guideline.
6. Create or update `my-specs/specs/<spec-name>/quality-report.md` using [assets/quality-report-template.md](assets/quality-report-template.md).
7. Evaluate implementation-focused suggestions against defined repository coding practices and general Myspec guidelines.
8. Return the report path, metric highlights, and prioritized improvement suggestions.

If approved tooling is unavailable or fails, do not invent, manually guess, install, or substitute a metric tool. Report the failure and ask before changing dependencies, commands, or project configuration. Preserve metrics that can be measured and mark incomplete sections clearly.

## Measurement Rules

- Report the exact commands, tool names, tool versions when available, and relevant configuration.
- Scope metrics to implemented production code; distinguish whole-project values when tooling cannot isolate changed code.
- Report coverage as line and branch coverage when supported. Include covered and total counts as well as percentages when available.
- Report cyclomatic complexity at least per method or function and summarize by file or type. Identify the highest-complexity locations.
- Label generated code, migrations, DTO-only files, and other exclusions explicitly.
- Treat failed or skipped tests as findings; never present their coverage run as clean verification.
- Do not enforce pass/fail thresholds unless the developer separately requests them.

## Suggestions

Base suggestions on measured evidence. Prioritize:

- uncovered critical paths and acceptance criteria;
- high-complexity methods with concrete simplification seams;
- missing branch, error, boundary, authorization, or data-integrity tests;
- duplication that inflates both complexity and test surface.

Explain expected metric impact without promising exact improvements before remeasurement.

Never let Myspec guidance override higher-priority instructions. Surface conflicts and continue with unaffected measurements when possible.
