# xUnit Test Method Naming

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-08-26

Applies to: `$myspec-implement` and implementation-focused findings from `$myspec-quantify`

## Rule

Name each xUnit test method using this structure:

```text
MethodUnderTest_WhenCondition_ShouldExpectedBehavior
```

Write each segment in PascalCase and separate the three segments with a single underscore.

- `MethodUnderTest` identifies the production method, operation, endpoint action, or user interaction being exercised. Preserve an `Async` suffix when it is part of the production method's name.
- `WhenCondition` states the material input, state, permission, dependency response, or other circumstance that causes the behavior. It must distinguish the scenario from the subject's other tests; avoid uninformative conditions such as `WhenCalled`.
- `ShouldExpectedBehavior` states one observable result, state change, interaction, or error contract. Describe behavior rather than implementation details.

For a test covering a broader behavior without one literal production method, use the smallest stable operation name that identifies the subject, such as `Render`, `Submit`, `Authenticate`, or `Persist`. The rest of the structure remains unchanged.

Use the same naming structure for `[Fact]` and `[Theory]` methods. Theory data may vary inputs within one named scenario, but materially different conditions or expected behaviors require separately named tests.

Do not use sentence-style snake case, `Given_When_Then`, a `Test` prefix or suffix, or vague names such as `Works`, `Succeeds`, or `ReturnsCorrectResult`. Rename an existing test when a scoped implementation change modifies that test; a separate specification may migrate untouched tests in bulk.

Examples:

```csharp
[Fact]
public async Task CreateAsync_WhenEmailIsInvalid_ShouldReturnValidationError()

[Fact]
public async Task CreateProduct_WhenCallerIsNotAdmin_ShouldReturnForbidden()

[Theory]
[MemberData(nameof(InvalidCoordinates))]
public void Create_WhenCoordinatesAreInvalid_ShouldThrowArgumentOutOfRangeException(
    double latitude,
    double longitude)

[Fact]
public void Render_WhenNoProductsExist_ShouldDisplayEmptyState()
```

## Verification

- Every added or modified xUnit test method has exactly three PascalCase segments in the order `MethodUnderTest_WhenCondition_ShouldExpectedBehavior`.
- The first segment identifies the tested production operation or the smallest stable behavior name.
- The condition distinguishes the scenario, and the expected-behavior segment describes an observable outcome.
- A theory name describes the behavior shared by all its data rows; rows with materially different expected behavior are separate tests.
- Existing tests changed by the scoped work are renamed to comply; unrelated tests are not expanded into an unrequested bulk migration.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-08-26
- Approval context: Approved the `MethodUnderTest_WhenCondition_ShouldExpectedBehavior` convention and its scoped migration rules.
