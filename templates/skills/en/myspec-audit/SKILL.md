---
name: myspec-audit
description: Review the whole project's compliance with developer-approved coding practices and general guidelines, recording evidence, violations, review gaps, and prioritized follow-up in a compliance report. Use for a project-wide rules audit or a general sweep of adherence to repository guidance; use myspec-quantify for metric analysis and myspec-inspect for one spec's acceptance review.
---

# Myspec Audit

Review the project against its approved guidance and identify concrete compliance gaps. Save the result in repository-root `my-specs/compliance-report.md`. No spec or metric definition is required to run this review.

## Mandatory Guidance Gate

Before moving beyond initial repository discovery or executing a verification command, read repository instructions and every Markdown file under `my-specs/coding-practices/` and `my-specs/general-guidelines/`, including nested folders. Treat each applicable document with `Status: Approved` as mandatory, and comply with it before taking the action it governs. Missing folders, unapproved documents, and sections explicitly marked `None` create no mandatory constraint; disclose material limitations. Surface conflicts with higher-priority instructions and continue with unaffected checks.

## Review

1. Complete the guidance gate. Read an existing compliance report before replacing it. Record the current commit or available baseline, local changes, and review date so evidence can be interpreted against the reviewed state.
2. Inventory every discovered guidance document with its approval state. For each approved document, identify its distinct verifiable rules using the source path and heading, plus a short rule label when a heading contains several requirements. Determine each rule's applicability from its scope, conditions, exclusions, and verification instructions. Do not turn a proposed rule, common practice, or personal preference into a requirement.
3. Review the whole project, including source, tests, configuration, documentation, and workflow artifacts where the rules apply. Build a rule-to-evidence map; inspect relevant files and use available repository checks to cover the applicable scope. Metric exclusions do not automatically exclude code from this audit. If the scope is too large for complete review, identify the inspected areas and the remaining scope for each affected rule; never silently restrict the sweep to recent changes or one spec.
4. Follow each rule's documented verification method when available. Run existing, approved local verification commands only where they help establish that rule, respecting command-execution guidelines. Record exact commands, results, and evidence paths; reuse one run for rules sharing a command. A passing build, linter, test suite, or metric alone proves only the rules and scope it actually checks. An unavailable or failed check leaves dependent conclusions unverified unless other evidence establishes the rule; preserve unaffected results. Do not install tools, alter configuration, generate implementation artifacts, or perform external mutations as part of the audit.
5. Assess every approved rule using the outcomes below. Evaluate implementation rules against current code within their declared scope. Evaluate process rules against records of the activities they govern: code shape alone does not establish who generated an artifact, how a command ran, or whether approval preceded an action. A skill-specific rule applies to those activities, not automatically to all historical work. Respect explicit grandfathering and exceptions; do not invent either. If applicability or meaning is ambiguous, report the missing clarification rather than declare a violation.
6. Re-examine each previously open finding against current evidence. Preserve its ID and mark it `Resolved`, `Open`, `Superseded`, or `Not verified`, with a reason. A rule change or withdrawal can supersede a finding; an unreviewed area cannot resolve one. Allocate new finding IDs after the highest previous ID, starting at `F-001`. Mark a newly failing previously satisfied rule as a regression only when comparable evidence establishes it.
7. Create or update the report from [assets/compliance-report-template.md](assets/compliance-report-template.md). Include every approved rule, including those not applicable or unassessable; list unapproved documents separately. If no approved rules exist, still save an `Incomplete` report and recommend `{{skill:myspec-setup}}` without inventing a baseline. Missing metrics or specs do not block the audit.
8. Return the report path, overall result, most consequential findings, and material review gaps. Do not fix findings or create specs during the audit.

## Rule Outcomes and Overall Result

- `Met`: evidence verifies every required aspect throughout the rule's applicable scope. A clean sample cannot establish project-wide compliance.
- `Not met`: concrete evidence contradicts an applicable approved rule. Cite the exact source rule, affected path and line or artifact, expected requirement, and observed deviation. If other areas remain unreviewed, record those gaps too.
- `Insufficient evidence`: the rule may apply, but evidence is missing, partial, stale, or ambiguous. State the precise missing evidence or clarification, including unchecked areas and failed checks. This is not a confirmed violation.
- `Not applicable`: the rule's conditions do not occur in the reviewed scope, or an explicit exception covers it. Give the scope or exception evidence; missing evidence is not an exception.
- `Baseline conflict`: applicable requirements contradict one another and precedence does not resolve them. Cite both sources; do not silently choose a rule or recommend implementing the conflict.

The overall result is `Deviations found` when any rule is `Not met`; otherwise `Incomplete` when there is a baseline conflict, insufficient evidence, a material coverage limitation, or no approved rules. Use `No deviations found` only when every approved rule is `Met` or demonstrably `Not applicable` and no material review gap remains. Always disclose gaps even when confirmed deviations determine the result. Do not invent compliance percentages, metric thresholds, or a readiness/completion verdict for a spec.

## Follow-up and Boundaries

Prioritize confirmed violations by their documented enforcement when present and concrete impact and scope, then identify conflicts and missing evidence that need a decision. For each finding, suggest a bounded next action and cite its source. Do not add engineering requirements beyond the approved baseline.

- Recommend `{{skill:myspec-setup}}` to clarify or revise guidance or establish missing approvals; never approve or rewrite guidance during an audit.
- Recommend `{{skill:myspec-prescribe}}` for implementation changes requiring a new spec, including any impact on a finished spec.
- Suggest `{{skill:myspec-patch}}` only when its scope and lifecycle gates can be established, including the applicable file limit and no impact on finished specs. Otherwise suggest prescription, without assuming patch eligibility from a finding's apparent size.
- Recommend `{{skill:myspec-inspect}}` for an acceptance review of an active spec, or `{{skill:myspec-quantify}}` for project-wide metric measurement when requested. Do not run a metric sweep or change `my-specs/quality-report.md` during this audit. Read metric definitions only if an approved rule requires their evidence; do not add metric-only gates to the audit baseline.

Read specs and their manifest only when necessary to understand evidence or route a follow-up. A missing manifest limits lifecycle-specific conclusions, not unrelated rules. Historical inspections and finished specs remain unchanged; current findings do not reopen them. Preserve the previous report's finding IDs and follow-up outcomes in the replacement report. The compliance report is the only authored audit artifact; do not edit code, contract documents, spec artifacts, or either manifest.
