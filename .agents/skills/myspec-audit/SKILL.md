---
name: myspec-audit
description: Review the whole project's compliance with developer-approved coding practices and general guidelines, recording evidence, violations, review gaps, and prioritized follow-up in a compliance report. Use for a project-wide rules audit or a general sweep of adherence to repository guidance; use myspec-quantify for metric analysis and myspec-inspect for one spec's acceptance review.
---

# Myspec Audit

Sweep the whole project for adherence to approved coding practices and general guidelines and save `my-specs/reports/compliance-report.md`. No spec or metric definition is required.

## Guidance Gate

Read repository instructions and every Markdown file under `my-specs/coding-practices/` and `my-specs/general-guidelines/` (including nested folders — run `myspec rule -f`, or `myspec rule` to list and `myspec rule <name>` for one). Treat applicable `Status: Approved` documents as mandatory and surface conflicts with higher-priority instructions.

## Workflow

1. Read any existing `my-specs/reports/compliance-report.md` before replacing it. Record the current git commit/baseline, local changes, and review date.
2. Inventory every guidance document and its approval state. Extract distinct verifiable rules from each approved document (source path, heading, scope, exclusions, verification method). Ignore unapproved drafts and personal preferences.
3. Review the full applicable scope across code, tests, config, docs, and workflow records—never silently restrict the sweep to recent commits or one spec. Disclose unreviewed areas explicitly if scope prevents complete coverage.
4. Run existing approved local verification commands only where needed to verify a rule, reusing shared runs. Never install tools, modify config, or edit source/specs/manifests.
5. Classify every approved rule:
   - `Met`: verified across the full applicable scope (a sample is not enough).
   - `Not met`: concrete violation with source rule, `path:line` or artifact, expected requirement, and observed deviation.
   - `Insufficient evidence`: missing, partial, stale, or ambiguous evidence (not a confirmed violation).
   - `Not applicable`: rule conditions do not occur or an explicit exception applies.
   - `Baseline conflict`: approved rules contradict one another without precedence resolution.
6. Re-examine previously open findings, keeping their IDs (`Resolved`, `Open`, `Superseded`, or `Not verified` with reason). Number new findings after the highest earlier ID starting at `F-001`.
7. Set overall result: `Deviations found` (any `Not met`), `Incomplete` (conflict, insufficient evidence, material review gap, or no approved rules), or `No deviations found` (all rules `Met` or `Not applicable` with no material gap).
8. Save `my-specs/reports/compliance-report.md` from [assets/compliance-report-template.md](assets/compliance-report-template.md) and return the path, overall result, key findings, review gaps, and bounded next-skill recommendations (`/myspec-setup`, `/myspec-prescribe`, `/myspec-patch` only when eligible, `/myspec-inspect`, or `/myspec-quantify`).
