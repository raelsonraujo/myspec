# Implementation File Tree

Status: Proposed

Created by: `<git user.name> <git user.email>`

Created on: `<date>`

## Tree

```text
<project>/
├── <file-to-add>                    # add via <brief context>
├── <file-to-modify>                 # modify for <brief context>
├── <file-to-delete>                 # delete because <brief context>
└── <test-project>/
    ├── <test-file-to-add>           # add
    └── <test-file-to-modify>        # modify for changed behavior
```

End every file entry with a comment beginning with exactly one operation marker: `# add`, `# modify`, or `# delete`. The marker may be followed by a short context explaining how or why the operation applies, such as `# add via dotnet ef`. Do not leave a file entry unmarked. Omit operation examples that do not apply to the proposal.

## File Responsibilities

- `<path>`: <why this file changes and what it owns>.

## Acceptance Criteria Coverage

- `AC-01`: <production location>; <test location>.

## Structural Decisions

- <Important boundary, dependency, or pattern reflected by this tree.>

## Open Decisions

- <Decision requiring developer input before approval, or `None`.>

## Approval History

- Approved by: `<git user.name> <git user.email>`
- Approved on: `<date>`
- Approval context: `<concise description of the approved tree revision>`
