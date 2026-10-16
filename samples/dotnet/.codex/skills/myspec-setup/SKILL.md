---
name: myspec-setup
description: Set up or revise the repository-wide Myspec contract by asking the developer to define the quality metrics with their tooling and gates, repository coding practices, and cross-skill guidelines. Use before Myspec quality measurement, when my-specs/metrics is missing or still a single tooling.md, or when metrics, metric tools, gates, coding practices, or shared Myspec guidance need to change.
---

# Myspec Setup

Establish a reproducible, developer-approved contract for the Myspec skills.

## Mandatory Guidance Gate

Before moving beyond initial repository discovery, read every Markdown file that exists under `my-specs/coding-practices/` and `my-specs/general-guidelines/`. Treat each applicable document with `Status: Approved` as mandatory for this skill, comply with its rule before taking the action it governs, and surface any conflict with higher-priority instructions before proceeding. A missing folder, missing file, unapproved document, or section explicitly marked `None` creates no mandatory constraint; state the limitation when material.

## Workflow

1. Inspect repository manifests, test projects, local tool files, build scripts, and CI configuration. Do not install or modify tooling.
2. After completing the Mandatory Guidance Gate, read every Markdown file under `my-specs/metrics/`. When the legacy single-file `my-specs/tooling.md` exists, read it too and propose splitting it as described under [Legacy Tooling Contract](#legacy-tooling-contract).
3. Ask the developer for the exact build and test commands that verify the repository, and record them in the general guideline `my-specs/general-guidelines/build-and-test-commands.md`, which `$myspec-inspect` and `$myspec-quantify` run before any metric. Then ask which quality metrics Myspec must measure. The metric set is exactly what the developer defines: never assume, infer, or default to any metric, including complexity or coverage, from the stack, existing tools, or common practice. Offer metric candidates only when the developer asks for them. Defining no metric is valid; leave `my-specs/metrics/` absent or empty and state that no metric was established.
4. For each metric the developer chooses, ask the developer to define:
   - what it measures, its unit, and its granularity, such as per method, per file, or project total;
   - working directory, restore or bootstrap command, and the prerequisite commands, such as a build, that must succeed before measuring;
   - tool and pinned version;
   - installation or restore mechanism;
   - exact measurement command;
   - output format and result path;
   - measured scope and exclusions;
   - how the code changed by a spec is isolated from whole-project values;
   - the values every inspection and quality report must record for it;
   - its gates: for each reported value the developer wants judged, the threshold, whether it applies to the changed code, the whole project, or both, and its enforcement. A `Blocking` gate makes an inspection whose changed code misses it `Blocked`; an `Attention` gate reports the miss as an improvement signal. Record only gates the developer states; a metric without gates is valid and is reported without judgment.
5. Ask whether to define optional repository coding practices. If yes, record each concrete, verifiable practice for `$myspec-implement` and implementation-focused review as its own file under `my-specs/coding-practices/`; if no, leave that folder absent or empty.
6. Ask whether to define optional general Myspec guidelines. If yes, record each behavioral or output rule that every other Myspec skill must follow as its own file under `my-specs/general-guidelines/`; if no, leave that folder absent or empty.
7. When useful, offer repository-compatible candidates with concrete tradeoffs, except metrics, which follow step 3. Never select a candidate merely because it is already familiar or implemented.
8. Create or update the contract documents, setting each newly created document's status to `Proposed` and recording its creator and creation date from the current repository's `git config user.name` and `git config user.email`. Use an `Approval History` section for approvals:
   - one file per metric under `my-specs/metrics/`, from [assets/metric-template.md](assets/metric-template.md);
   - the build and test commands as `my-specs/general-guidelines/build-and-test-commands.md`, from [assets/general-guideline-template.md](assets/general-guideline-template.md);
   - one file per practice under `my-specs/coding-practices/`, from [assets/coding-practice-template.md](assets/coding-practice-template.md);
   - one file per guideline under `my-specs/general-guidelines/`, from [assets/general-guideline-template.md](assets/general-guideline-template.md).
9. Present the complete proposal and ask for explicit approval or revisions. End without marking it approved.
10. On a later invocation, incorporate requested revisions or, after explicit developer approval, set the document status to `Approved`. Unless the developer specifies a different identity, read the current repository's `git config user.name` and `git config user.email`. Append an approval entry; never replace earlier entries or change `Created by` or `Created on` after creation. Each entry must include `Approved by`, `Approved on`, and a concise `Approval context` that identifies what revision or decision was approved.

Do not treat silence, a pre-existing tool, or a successful command as approval. Do not install dependencies or alter project configuration unless the developer separately authorizes that work.

## Contract Rules

- Treat `my-specs` as relative to the repository root.
- Keep commands directly executable from a documented working directory.
- Pin versions or document the repository-controlled version source.
- Record generated-code and file-pattern exclusions explicitly.
- Define how changed implementation files are isolated from whole-project metrics.
- Record only the metrics the developer defined, one Markdown file per metric under `my-specs/metrics/`. Other Myspec skills measure exactly those metrics and nothing else.
- Keep everything needed to measure a metric, including its gates, in that metric's file so each one can be approved and revised on its own. Never define a threshold outside the `## Gates` section of the metric it judges.
- Store every repository coding practice and general Myspec guideline in a separate Markdown file under its respective folder; do not embed their rule text in metric files.
- Use a concise kebab-case filename that identifies the rule.
- Give every metric, practice, and guideline file its own status and append-only approval history.
- Give every contract document immutable `Created by` and `Created on` metadata. Format the creator as `<git user.name> <git user.email>` and ask the developer for an identity only when either Git value is unavailable.
- Format the default approval identity as `<git user.name> <git user.email>`; ask the developer for an identity only when either Git value is unavailable.
- Keep approval contexts concise and specific enough to identify the approved revision without duplicating the document.
- Keep coding practices actionable and repository-specific; avoid restating conventions already enforced elsewhere.
- Keep general guidelines applicable to all other Myspec skills and identify their expected behavior or output.
- Never let this contract override higher-priority instructions. Surface conflicts instead of silently choosing.
- Record a decision for every placeholder before approval.

## Legacy Tooling Contract

Earlier Myspec versions kept every metric in a single `my-specs/tooling.md`. When it exists:

1. Propose one file per metric under `my-specs/metrics/`, carrying over its definition, execution context, prerequisite build commands, and measurement fields unchanged.
2. Propose the build and test commands of its verification section as `my-specs/general-guidelines/build-and-test-commands.md`.
3. Turn every target a referenced guideline defines for a metric into gates of that metric only after the developer confirms the threshold, scope, and enforcement; leave the guideline untouched unless the developer asks to retire it.
4. Create the new files as `Proposed`, with an approval context that names `tooling.md` as their origin. Delete `my-specs/tooling.md` only after the developer approves every metric file that replaces it.
