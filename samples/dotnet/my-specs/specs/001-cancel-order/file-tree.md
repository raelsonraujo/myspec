# Implementation File Tree

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-09-01

## Tree

```text
Sample.App.Domain/
├── Orders/
│   ├── Order.cs                                  # modify to add Cancel behavior and cancelled state
│   ├── OrderStatus.cs                            # modify to add Cancelled
│   ├── OrderAlreadyCancelledException.cs         # add
│   └── OrderAlreadyShippedException.cs           # add
Sample.App.Application/
├── Orders/
│   ├── CancelOrderCommand.cs                     # add
│   ├── CancelOrderHandler.cs                     # add
│   └── IOrderRepository.cs                       # modify to expose lookup by owner and order id
Sample.App.Infrastructure/
├── Orders/
│   ├── OrderEntity.cs                            # modify to persist cancellation time
│   ├── OrderRepository.cs                        # modify to implement owner-scoped lookup
│   └── Migrations/
│       └── <timestamp>_AddOrderCancellation.cs   # add via dotnet ef
Sample.App.Api/
├── Orders/
│   └── CancelOrderEndpoint.cs                    # add
├── Program.cs                                    # modify to map the endpoint
Sample.App.xUnit.Domain/
└── Orders/
    └── OrderTests.cs                             # modify for cancellation rules
Sample.App.xUnit.Application/
└── Orders/
    └── CancelOrderHandlerTests.cs                # add
Sample.App.xUnit.Api/
└── Orders/
    └── CancelOrderEndpointTests.cs               # add
```

## File Responsibilities

- `Order.cs`: owns the cancellation invariant, allowing cancellation only for an unshipped, uncancelled order.
- `OrderAlreadyCancelledException.cs`, `OrderAlreadyShippedException.cs`: express the two domain failures so the API can map them to distinct results.
- `CancelOrderHandler.cs`: loads the order scoped to the calling customer, invokes the domain behavior, and commits the change.
- `IOrderRepository.cs` / `OrderRepository.cs`: return an order only when it belongs to the requested customer.
- `OrderEntity.cs` and the migration: persist the cancelled state and time.
- `CancelOrderEndpoint.cs`: translates the HTTP request and authenticated customer into the command and maps outcomes to status codes.

## Acceptance Criteria Coverage

- `AC-01`: `Order.cs`, `CancelOrderHandler.cs`, `CancelOrderEndpoint.cs`; `OrderTests.cs`, `CancelOrderHandlerTests.cs`, `CancelOrderEndpointTests.cs`.
- `AC-02`: `OrderRepository.cs`, `CancelOrderEndpoint.cs`; `CancelOrderEndpointTests.cs`.
- `AC-03`: `Order.cs`, `OrderAlreadyShippedException.cs`; `OrderTests.cs`, `CancelOrderEndpointTests.cs`.
- `AC-04`: `Order.cs`, `OrderAlreadyCancelledException.cs`; `OrderTests.cs`, `CancelOrderEndpointTests.cs`.
- `AC-05`: `CancelOrderEndpoint.cs`; `CancelOrderEndpointTests.cs`.
- `AC-06`: `CancelOrderEndpoint.cs`; `CancelOrderEndpointTests.cs`.
- `AC-07`: `OrderRepository.cs`; `CancelOrderEndpointTests.cs` (cancel, then retrieve the owner's history and verify the order is included).

## Structural Decisions

- The cancellation rule lives in the `Order` aggregate rather than in the handler or endpoint, following the approved domain-driven-design practice.
- Ownership is enforced by an owner-scoped repository lookup so a non-owner receives the same result as an unknown order.
- Each new exception is declared in its own file, following the one-declaration-per-file practice.

## Open Decisions

- None.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-09-02
- Approval context: Approved the initial tree covering the domain, application, infrastructure, API, and test changes for order cancellation.
