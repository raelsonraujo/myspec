---
name: myspec-quantify
description: Measure the quality metrics defined by the developer-approved metric files under my-specs/metrics across the whole project, judge the results against their gates, and turn the weakest areas into prioritized improvement opportunities that can start new specs. Use for project-wide quality measurement, metric analysis, or metric-based improvement priorities; use myspec-audit for compliance with coding practices and general guidelines.
---

# Myspec Quantify

Measure approved quality metrics across the whole project and turn the weakest areas into prioritized improvement opportunities. (`{{skill:myspec-inspect}}` evaluates one spec; `{{skill:myspec-audit}}` reviews compliance with coding practices and guidelines.)

## Guidance Gate

Read every Markdown file under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat applicable `Status: Approved` documents as mandatory; surface conflicts with higher-priority instructions.

## Workflow

1. Read every file under `my-specs/metrics/`. Only `Status: Approved`, complete metric files are measured; never invent or default to undefined metrics. If none are approved (or only legacy `my-specs/tooling.md` exists), stop and recommend `{{skill:myspec-setup}}`.
2. Run **`myspec gate --project`** to deterministically execute approved build/test commands and project-wide metrics, evaluate `## Gates` applicable to the project, and parse structured reports (Cobertura XML, SARIF, TRX, Stryker JSON, generic JSON). For any approved metric requiring a custom/non-parsed report (such as benchmarks), run its documented command once and read its result path directly.
3. Treat failed or skipped tests as findings; never present failing runs as clean verification. Never install, guess, or substitute unavailable tools—report incomplete sections clearly.
4. Map hotspots to specs under `my-specs/specs/` whose `file-tree.md` covers that code (when any exist) and compare totals against the previous `my-specs/quality-report.md` (if present).
5. Save `my-specs/quality-report.md` from [assets/quality-report-template.md](assets/quality-report-template.md), recording exact commands, tool versions, exclusions, project/module breakdowns, gate outcomes, and prioritized opportunities:
   - Priority order: `Blocking` gate misses → `Attention` gate misses → worst-ranked hotspots (especially code implementing spec ACs).
   - For each opportunity, name the affected code, related spec (if any), concrete seam to improve, expected metric effect (without promising exact future numbers), and recommended next skill (`{{skill:myspec-prescribe}}` by default, or `{{skill:myspec-patch}}` only when eligible under patch scope and finished-spec gates).
6. Return the report path, metric highlights, and prioritized opportunities. Do not edit code or create specs.
