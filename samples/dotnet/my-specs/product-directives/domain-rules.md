# Domain Rules

Status: Approved

Created by: Sample Author <sample.author@example.com>

Created on: 2026-08-04

Applies to: `$myspec-implement` and `$myspec-patch`

## Product Scope

These directives define the major entities in the catalog, ordering, and administration domains of a sample online store. Changes must preserve their terminology, ownership boundaries, relationships, and observable invariants.

> This document is a sample. Replace its entities with the concepts, terminology, policies, and invariants of your own product.

## Domain Entities

### Customer

A Customer is the person who owns a set of orders and shipping addresses. It is identified by a stable identity and a unique email address.

- A customer can only view and cancel their own orders.
- Authorized administrators may manage the customer record and its active lifecycle; deactivating a customer preserves their order history.

### Product

A Product is an item offered for sale in the catalog.

- It requires a stable identity, a non-empty name, and a non-negative Price.
- Retiring a product prevents it from being added to new orders without invalidating existing orders that reference it.

### Category

A Category is a named grouping used to organize products in the catalog.

- A product belongs to exactly one category, and a category requires a unique non-empty name.
- Retiring a category preserves historical references and removes it from active catalog choices.

### Price

A Price is an amount of money in a single currency.

- It requires a non-negative amount and a supported currency code.
- Prices in different currencies must not be added, compared, or combined implicitly.

### Order

An Order represents a request by one customer to purchase one or more products.

- Only the owning customer may place the order; it must contain at least one order line.
- The order keeps the unit price of each product as of the time it was placed; later catalog price changes must not alter existing orders.
- An order can be cancelled only before it is shipped, and a cancelled order cannot be reactivated.

### Order Line

An Order Line is one product entry within an order, with its quantity and unit price.

- It belongs to exactly one order, references an active product at placement time, and requires a positive quantity.
- Its total is the unit price multiplied by its quantity; the order total is the sum of its line totals.

### Shipment

A Shipment records the dispatch of an order to a customer's shipping address.

- A shipment belongs to exactly one order and requires a shipping address and a dispatch time that is not in the future.
- Once a shipment exists for an order, the order can no longer be cancelled.

### Administrator

An Administrator is an authenticated administrative actor identified by subject, display name, optional email, and identity-provider groups.

- Administrative access is granted only when the actor belongs to the configured administrator group.
- Administrator identity and authorization must come from the authenticated context rather than user-supplied mutation data.

### Administrative Change Record

An Administrative Change Record is the audit fact produced for a successful administrative product change.

- It identifies the actor, action, target kind and identity, occurrence time, summary, and relevant before/after values.
- Records preserve administrative accountability and must not be rewritten to disguise or replace earlier changes.

## Guidance Precedence

- Follow system, developer, user, and repository instructions before these domain rules.
- If a request or specification conflicts with an approved domain rule, stop and propose a revision to this document instead of implementing the conflict silently.

## Approval History

- Approved by: Sample Author <sample.author@example.com>
- Approved on: 2026-08-04
- Approval context: Approved the initial domain rules covering the major catalog, ordering, and administration entities.
