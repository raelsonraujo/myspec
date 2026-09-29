# xUnit Parameterized Test Data

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-07-09

Applies to: `$myspec-implement` and implementation-focused findings from `$myspec-quantify`

## Rule

When a test verifies the same behavior across two or more argument sets, write it as an xUnit `[Theory]` and declare the varying arguments outside the test body. Use `[InlineData]` for a small set of compile-time constants, `[MemberData]` for named or computed data owned by the test class, and `[ClassData]` for reusable or more substantial data sets.

Do not create collections, tuples, or local variables containing multiple argument sets inside a test body and iterate over them to perform the same assertions. Keep setup and assertions in the theory body; keep only the varying arguments in the data source.

When two or more tests need the same argument types and equivalent data sets, define a single named `TheoryData<T...>` or `ClassData` test-data source and reuse it through `[MemberData]` or `[ClassData]`. A test may use its own data source only when its arguments or cases are materially different from the reusable source.

## Verification

- A repeated test case has one theory invocation per argument set, with its arguments declared by `InlineData`, `MemberData`, or `ClassData`.
- Reused argument types and cases are represented by one shared, named test-data source rather than duplicated declarations or in-body iteration.
- Data-source names describe the scenario being exercised, as in `AdminRouteComponents` or `StaticAdminRoutes`.

## Approval

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-07-09
