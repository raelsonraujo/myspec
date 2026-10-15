---
name: myspec-quantify
description: Measure the quality metrics defined by the developer-approved tooling contract across the whole project, judge the results against approved targets, and turn the weakest areas into prioritized improvement opportunities that can start new specs. Use when a developer asks for project-wide quality control, metric analysis, or where to invest improvement effort next.
---

# Myspec Quantify

Produce evidence-based quality metrics for the project as a whole and point to where improvement effort would pay off. `{{skill:myspec-inspect}}` judges metrics for the code of one spec; this skill judges the whole project, so its findings can become the entry point for new specs.

## Mandatory Guidance Gate

Before moving beyond initial repository discovery or executing a measurement command, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Workflow

1. Complete the Mandatory Guidance Gate, then read repository-root `my-specs/tooling.md`. Require status `Approved` and at least one complete metric definition under `## Metrics`; the contract alone decides which metrics exist, so never measure or ask for one it does not define. Use it to identify quality tooling and defined contract sections; do not treat it as a substitute for reading the guidance files at `my-specs/coding-practices/` and `my-specs/general-guidelines/`.
2. If the tooling contract is absent, incomplete, or not approved, stop and ask the developer to run `{{skill:myspec-setup}}`. Do not select substitute tooling.
3. Obtain the results of the exact approved build, test, and metric commands for the whole project, applying their documented scope, exclusions, and every applicable defined guideline.
4. Judge the results against the targets defined by the approved guidelines each metric's `Interpretation` names, and identify the locations that miss them or rank worst.
5. List the specs under `my-specs/specs` and, for each hotspot, name the spec whose approved file tree covers that code, when one exists.
6. Create or update `my-specs/quality-report.md` using [assets/quality-report-template.md](assets/quality-report-template.md). When a previous report exists, compare the project totals with its values before replacing it.
7. Evaluate implementation-focused suggestions against defined repository coding practices and general Myspec guidelines.
8. Return the report path, metric highlights, and the prioritized improvement opportunities with their suggested next skill.

If approved tooling is unavailable or fails, do not invent, manually guess, install, or substitute a metric tool. Report the failure and ask before changing dependencies, commands, or project configuration. Preserve metrics that can be measured and mark incomplete sections clearly.

## Measurement Rules

- Report the exact commands, tool names, tool versions when available, and relevant configuration.
- Measure the whole project's production code. Report project totals and break them down by project, module, or file, whichever the tooling supports.
- Report every metric the tooling contract defines, with the values and granularity it lists, and nothing else. Include counts as well as ratios when the tool provides them, and identify the worst-ranked locations.
- Label generated code, migrations, DTO-only files, and other exclusions explicitly.
- Treat failed or skipped tests as findings; never present measurements from that run as clean verification.
- Judge a metric as missing a target only when an approved guideline or the tooling contract defines that target. Never invent thresholds; without a defined target, rank by relative risk instead.

## Improvement Opportunities

Base opportunities on measured evidence. Prioritize:

- code that misses an approved target;
- the worst-ranked locations of each defined metric, especially in code that implements an existing spec's acceptance criteria;
- concrete seams in that code whose change would improve the measured value.

For each opportunity, name the affected code, the related spec when one exists, the expected metric effect without promising exact values before remeasurement, and the suggested next skill:

- `{{skill:myspec-prescribe}}` to open a new improvement spec, the default for any opportunity that needs more than three files or has no implemented spec covering it;
- `{{skill:myspec-patch}}` for a change of at most three files within the scope of an implemented spec or outside any spec.

Do not create specs or edit code; the developer decides which opportunities to pursue.

Never let Myspec guidance override higher-priority instructions. Surface conflicts and continue with unaffected measurements when possible.
