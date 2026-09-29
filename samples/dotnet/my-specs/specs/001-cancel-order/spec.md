# Cancel Order

## Summary

Let a customer cancel their own order through the App API while the order has not yet been shipped, so mistaken or unwanted purchases can be reversed without administrator intervention. Cancellation must preserve the order and its lines as history and must never be possible once a shipment exists.

## Scope

- Add an App API operation that cancels a single order identified by its id.
- Allow only the customer who owns the order to cancel it.
- Record the cancelled state and the cancellation time on the order, keeping its lines and total unchanged.
- Reject cancellation of an order that already has a shipment or is already cancelled.
- Add focused automated tests for the domain rule, the application use case, and the API contract.

## Out of Scope

- Refunds, payment reversal, or stock replenishment triggered by a cancellation.
- Administrator-initiated cancellation on behalf of a customer.
- Notification emails or events sent to other systems.
- Reactivating a cancelled order.
- Changes to the order placement, shipment, or catalog behavior.

## Acceptance Criteria

### AC-01: Owner cancels an unshipped order

- Given an authenticated customer who owns an order that has no shipment
- When the customer requests cancellation of that order
- Then the API responds with success and the order is stored as cancelled with the cancellation time.
- And the order's lines and total are unchanged.

### AC-02: Other customers cannot cancel the order

- Given an authenticated customer who does not own the order
- When the customer requests cancellation of that order
- Then the API responds with a not-found result that does not reveal the order's existence.
- And the order remains unchanged.

### AC-03: Shipped orders cannot be cancelled

- Given an order that has a shipment
- When its owner requests cancellation
- Then the API responds with a conflict result identifying that the order was already shipped.
- And the order remains unchanged.

### AC-04: Cancelling is not repeatable

- Given an order that is already cancelled
- When its owner requests cancellation again
- Then the API responds with a conflict result identifying that the order is already cancelled.
- And the original cancellation time is preserved.

### AC-05: Unknown orders and unauthenticated callers are rejected

- Given an order id that does not exist, or a caller who is not authenticated
- When cancellation is requested
- Then the API responds with a not-found result for the unknown id and an unauthorized result for the unauthenticated caller.
- And no order is modified.

## Assumptions

- The order already exposes whether it has a shipment; no new shipment concept is needed.
- Authentication and the current customer identity are already available to API endpoints from the authenticated context.
- A cancelled order remains visible in the customer's order history.

## Open Questions

- None.
