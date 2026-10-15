# Implementation Quality Report

## Scope and Baseline

- Spec: `my-specs/specs/001-cancel-order/spec.md`
- Baseline: approved `file-tree.md` and the working-tree diff against `main`
- Production files measured:
  - `Sample.App.Domain/Orders/Order.cs`
  - `Sample.App.Domain/Orders/OrderAlreadyCancelledException.cs`
  - `Sample.App.Domain/Orders/OrderAlreadyShippedException.cs`
  - `Sample.App.Application/Orders/CancelOrderHandler.cs`
  - `Sample.App.Infrastructure/Orders/OrderRepository.cs`
  - `Sample.App.Api/Orders/CancelOrderEndpoint.cs`
- Exclusions:
  - `Sample.App.Infrastructure/Orders/Migrations/`: generated code excluded by `my-specs/metrics/test-coverage.md`.

## Verification

| Command | Result |
| --- | --- |
| `dotnet build Sample.slnx --configuration Release --no-restore` | passed |
| `dotnet test Sample.slnx --configuration Release --no-build --settings my-specs/measurement/coverlet.runsettings --collect:"XPlat Code Coverage" --results-directory my-specs/measurement/coverage/raw` | passed |
| `dotnet reportgenerator -reports:"my-specs/measurement/coverage/raw/**/coverage.cobertura.xml" -targetdir:"my-specs/measurement/coverage/report" -reporttypes:"Html;JsonSummary;Cobertura"` | passed |

## Test Coverage

- Tool and version: `coverlet.collector` `6.0.4`, aggregated with ReportGenerator `5.5.10`
- Line coverage: `41/42 (97.6%)`
- Branch coverage: `13/14 (92.9%)`

| File or type | Line coverage | Branch coverage | Notable gaps |
| --- | ---: | ---: | --- |
| `Order` | `14/14` | `6/6` | None |
| `CancelOrderHandler` | `10/10` | `2/2` | None |
| `OrderRepository` | `6/7` | `1/2` | Owner-scoped lookup for a missing order id is exercised only through the API test |
| `CancelOrderEndpoint` | `11/11` | `4/4` | None |

## Cyclomatic Complexity

- Tool and version: Coverlet Cobertura complexity values, visualized with ReportGenerator `5.5.10`

| File or type | Method or function | Complexity | CRAP score | Observation |
| --- | --- | ---: | ---: | --- |
| `Order` | `Cancel` | 3 | 3 | Within the normal targets |
| `CancelOrderHandler` | `HandleAsync` | 2 | 2 | Within the normal targets |
| `OrderRepository` | `FindForCustomerAsync` | 2 | 2.3 | Within the normal targets |
| `CancelOrderEndpoint` | `HandleAsync` | 5 | 5 | Within the normal targets |

## Acceptance Criteria Evidence

| Criterion | Test or verification evidence | Coverage gap |
| --- | --- | --- |
| `AC-01` | `Cancel_WhenOrderIsUnshipped_ShouldMarkOrderCancelled`, `HandleAsync_WhenOwnerCancels_ShouldPersistCancelledOrder` | None |
| `AC-02` | `HandleAsync_WhenCallerIsNotOwner_ShouldReturnNotFound` | None |
| `AC-03` | `Cancel_WhenOrderHasShipment_ShouldThrowOrderAlreadyShipped` | None |
| `AC-04` | `Cancel_WhenOrderIsAlreadyCancelled_ShouldPreserveOriginalCancellationTime` | None |
| `AC-05` | `HandleAsync_WhenOrderDoesNotExist_ShouldReturnNotFound`, `HandleAsync_WhenCallerIsUnauthenticated_ShouldReturnUnauthorized` | None |

## Improvement Suggestions

1. Add a repository-level test for `FindForCustomerAsync` with a missing order id to close the remaining branch gap; this would raise `OrderRepository` branch coverage from 1/2 to 2/2.

## Limitations

- The figures in this report are illustrative sample values, not the output of a real measurement run.
