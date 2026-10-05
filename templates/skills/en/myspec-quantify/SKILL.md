---
name: myspec-quantify
description: Measure cyclomatic complexity and automated test coverage across the whole project using developer-approved tooling, judge the results against approved targets, and turn the weakest areas into prioritized improvement opportunities that can start new specs. Use when a developer asks for project-wide quality control, complexity analysis, coverage analysis, or where to invest improvement effort next.
---

# Myspec Quantify

Produce evidence-based quality metrics for the project as a whole and point to where improvement effort would pay off. `{{skill:myspec-inspect}}` judges metrics for the code of one spec; this skill judges the whole project, so its findings can become the entry point for new specs.

## Mandatory Guidance Gate

Before moving beyond initial repository discovery or executing a measurement command, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Workflow

1. Complete the Mandatory Guidance Gate, then read repository-root `my-specs/tooling.md`. Require status `Approved` and complete cyclomatic-complexity and test-coverage definitions. Use it to identify quality tooling and defined contract sections; do not treat it as a substitute for reading the guidance files at `my-specs/coding-practices/` and `my-specs/general-guidelines/`.
2. If the tooling contract is absent, incomplete, or not approved, stop and ask the developer to run `{{skill:myspec-setup}}`. Do not select substitute tooling.
3. Obtain the results of the exact approved build, coverage, and complexity commands for the whole project, applying their documented scope, exclusions, and every applicable defined guideline.
4. Judge the results against the targets defined by approved guidelines, such as complexity or coverage limits, and identify the files, types, and methods that miss them or concentrate the most risk.
5. List the specs under `my-specs/specs` and, for each hotspot, name the spec whose approved file tree covers that code, when one exists.
6. Create or update `my-specs/quality-report.md` using [assets/quality-report-template.md](assets/quality-report-template.md). When a previous report exists, compare the project totals with its values before replacing it.
7. Evaluate implementation-focused suggestions against defined repository coding practices and general Myspec guidelines.
8. Return the report path, metric highlights, and the prioritized improvement opportunities with their suggested next skill.

If approved tooling is unavailable or fails, do not invent, manually guess, install, or substitute a metric tool. Report the failure and ask before changing dependencies, commands, or project configuration. Preserve metrics that can be measured and mark incomplete sections clearly.

## Measurement Rules

- Report the exact commands, tool names, tool versions when available, and relevant configuration.
- Measure the whole project's production code. Report project totals and break them down by project, module, or file, whichever the tooling supports.
- Report coverage as line and branch coverage when supported. Include covered and total counts as well as percentages when available.
- Report cyclomatic complexity at least per method or function and summarize by file or type. Identify the highest-complexity locations.
- Label generated code, migrations, DTO-only files, and other exclusions explicitly.
- Treat failed or skipped tests as findings; never present their coverage run as clean verification.
- Judge a metric as missing a target only when an approved guideline or the tooling contract defines that target. Never invent thresholds; without a defined target, rank by relative risk instead.

## Improvement Opportunities

Base opportunities on measured evidence. Prioritize:

- code that misses an approved target;
- uncovered critical paths, especially in code that implements an existing spec's acceptance criteria;
- high-complexity methods with concrete simplification seams;
- missing branch, error, boundary, authorization, or data-integrity tests;
- duplication that inflates both complexity and test surface.

For each opportunity, name the affected code, the related spec when one exists, the expected metric effect without promising exact values before remeasurement, and the suggested next skill:

- `{{skill:myspec-prescribe}}` to open a new improvement spec, the default for any opportunity that needs more than three files or has no implemented spec covering it;
- `{{skill:myspec-patch}}` for a change of at most three files within the scope of an implemented spec or outside any spec.

Do not create specs or edit code; the developer decides which opportunities to pursue.

Never let Myspec guidance override higher-priority instructions. Surface conflicts and continue with unaffected measurements when possible.
