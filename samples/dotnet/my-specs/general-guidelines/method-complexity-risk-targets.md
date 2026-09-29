# Method Complexity and CRAP Targets

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-08-26

Applies to: All Myspec skills that create, update, inspect, or rely on quality reports

## Rule

Use cyclomatic complexity **15 or lower** and CRAP score **30 or lower** per developer-controlled method as the repository's normal quality targets when scoping or interpreting incoming quality reports. These targets match the independent green boundaries of the repository-pinned ReportGenerator 5.5.10 configuration: values greater than 15 for cyclomatic complexity or greater than 30 for CRAP score are presented as elevated.

Treat cyclomatic complexity 15 as the upper boundary of the normal range, not as a value methods should approach. Prefer naturally lower complexity when it follows from a clear, cohesive design, but do not minimize cyclomatic complexity at the expense of readability, cohesion, or useful domain structure. A method with lower complexity is not inherently deficient or in need of additional branching.

Interpret the two metrics together using this repository review policy:

- a method with cyclomatic complexity 15 or lower and CRAP score 30 or lower meets the normal targets;
- a method with cyclomatic complexity from 16 through 25 may be tolerated when its CRAP score is 30 or lower, its relevant decision paths have meaningful automated coverage, and its branching represents one cohesive responsibility;
- a method with cyclomatic complexity greater than 25 remains an improvement candidate regardless of CRAP score because coverage does not remove the comprehension and maintenance cost of excessive branching;
- a method with CRAP score greater than 30 remains an improvement candidate because its combination of complexity and measured coverage presents elevated change risk.

For every quality report that includes cyclomatic complexity:

- report both cyclomatic complexity and CRAP score for each in-scope developer-controlled method when both metrics are available;
- identify every in-scope method above either normal target, state both measured values and the relevant coverage evidence, and classify it using the repository review policy;
- distinguish the repository review classification from ReportGenerator's colors, which evaluate cyclomatic complexity and CRAP score independently and continue to show cyclomatic complexity above 15 as elevated even when the method qualifies for the 16-through-25 tolerance band;
- treat a value outside the normal targets as an improvement signal, not an automatic build failure or implementation nonconformance, unless an approved specification or other higher-priority contract explicitly makes a target mandatory;
- do not describe complexity as improved merely because branches were moved into arbitrary helper methods; extracted methods must have cohesive, behavior-oriented responsibilities, and the containing-type complexity must remain visible when method extraction materially affects interpretation;
- apply the generated-code and changed-code scope exclusions defined in `my-specs/tooling.md`.

These targets do not change the tooling contract's decision to apply no repository-wide pass/fail threshold. They standardize how Myspec reports interpret and communicate cyclomatic-complexity, coverage, and CRAP-score results.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-08-26
- Approval context: Approved the CC 15 and CRAP 30 targets with the cohesive, covered CC 16-through-25 tolerance band.
