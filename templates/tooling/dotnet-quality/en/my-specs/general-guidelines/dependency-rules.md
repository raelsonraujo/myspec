# Dependency Rules

Status: Proposed

Created by: `{{author}}`

Created on: `{{date}}`

Applies to: All Myspec skills that prescribe, implement, patch, inspect, or quantify production code

## Rule

The rules below are the only dependency constraints between layers, modules, and namespaces of this repository. Each one is checked by an ArchUnitNET architecture test, as defined in `my-specs/metrics/dependency-conformance.md`, and a violation is judged by that metric's gates.

| ID | Rule | Source | Target | Test | Rationale |
| --- | --- | --- | --- | --- | --- |
| `DEP-01` | <e.g. the domain does not depend on infrastructure> | `<Product>.Domain` | does not depend on `<Product>.Infrastructure` | `<Namespace.DependencyRules.DEP_01_Domain_does_not_depend_on_infrastructure>` | <why the rule exists> |
| `DEP-02` | <e.g. product namespaces are free of cycles> | `<Product>.(*)` | no cycles between slices | `<Namespace.DependencyRules.DEP_02_Namespaces_are_free_of_cycles>` | <why the rule exists> |

Replace the example rows with the rules the team decides before approving this guideline. Architecture is a human decision: the tests only check the rules approved here, and no skill creates, removes, or relaxes a rule on its own. Adding, removing, or changing a rule requires a new approval of this guideline.

Prefer a few rules that express real boundaries:

- direction between layers, such as domain, application, infrastructure, and presentation;
- isolation between modules or bounded contexts, allowing only their agreed public contracts;
- no cycles between namespaces of the same product, since .NET already prevents cycles between projects;
- external dependencies confined to one layer, such as the ORM or HTTP client only in infrastructure.

Specs:

- When a spec's scope creates a module, a layer, or a new dependency between them, the spec names the affected rules and, if it needs a new or changed rule, states it as a prerequisite to approve in this guideline before implementation.
- The spec's file tree lists the architecture test to add or modify.

Architecture tests:

- Live in a test project whose name ends in `.ArchitectureTests` and load the production assemblies with ArchUnitNET's `ArchLoader`.
- Each rule is a single test with `[Trait("Category", "Architecture")]` and `[Trait("Rule", "<ID>")]`, whose name starts with the ID, such as `DEP_01_...`, because the TRX report records the test name but not its traits.
- A one-off exception to a rule exists only when this guideline lists it, with the exact excluded type and its rationale.

Reports:

- Inspections run only the rules whose source namespaces the spec changes, with `-Rules <ID>` or `--rule <ID>`, and report each violation with its rule and the types involved.
- Project quality reports run every rule.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before this guideline.
- If this guideline conflicts with a higher-priority instruction or the approved spec, stop and surface the conflict.

## Approval History

- None yet.
