# WebMCP State Model

This document defines the state-aware tool exposure model implemented by the `WebMCPRegistry`. Tool availability is determined by the intersection of authentication state and cart contents.

## State Transition Table

| Application State | Exposed Tool Categories | Behavioral Constraints |
|-------------------|------------------------|----------------------|
| **Guest** | Public catalog tools, shipping estimate, `login`, `register`, `get_account_info` | Protected tools return `AUTHENTICATION_REQUIRED`. No cart, wishlist, or order operations. |
| **Authenticated, cart empty** | All public and authenticated tools (cart, wishlist, orders, addresses); `create_order` unavailable | Cart reads return an empty structured response. Mutation tools validate product identifiers and stock. `create_order` returns `CART_EMPTY`. |
| **Authenticated, cart populated** | All tools including `create_order` | Checkout tool is registered only while the cart contains at least one item. |
| **Demo checkout confirmation** | `create_order` active | The caller must provide `confirmDemoOrder: true`. The API accepts only `DEMO_CARD` and records the order exclusively in the demo database. |
| **Checkout completed** | All public and authenticated tools; `create_order` unavailable | The cart is cleared upon order creation. No duplicate checkout tool remains active. |
| **Logged out** | Public tools only | All protected tool registrations are aborted. The UI may present login affordances independently. |

## State Transitions

- **Login** registers protected tools on `document.modelContext` and dispatches a `webmcp-auth-change` event to synchronize the React UI.
- **Logout** aborts all protected tool native registrations, resets cart state, and dispatches the corresponding event.
- **Cart mutations** return an updated cart summary. The `CartContext` updates the registry's cart item count, which determines `create_order` availability. The registry aborts or registers the native `create_order` tool accordingly.
- **Order creation** clears the cart, which in turn removes `create_order` availability.

## Evaluation Case Conventions

Evaluation cases are inventory-agnostic. They express user intent using runtime placeholders such as `${criteria}`, `${resolvedProductId}`, and `${cartItemProductId}`. Fixture providers resolve these values at execution time. Cases must never contain production or demo SKUs, prices, brands, or categories.
