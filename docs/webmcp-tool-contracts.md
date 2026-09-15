# WebMCP Tool Contracts

This document defines the behavioral contracts that govern all 34 WebMCP tools registered by Bridge to Agentia. These contracts are enforced by the `WebMCPRegistry` and validated through 90 deterministic tests.

## Contract Rules

1. Tool inputs are JSON objects validated for required fields, primitive types (`string`, `number`, `integer`, `boolean`, `array`), declared enums, and numeric constraints (`minimum`, `maximum`) by the registry prior to execution.
2. Product, order, and address identifiers must originate from a prior catalog, account, or order result. Callers must not fabricate identifiers.
3. Successful operations return the upstream API's structured payload. Failures preserve `success: false`, a stable `error` code, and a descriptive `message`.
4. Registry-level failures (validation, authentication, state) include an `errorDetails` object with `code`, `message`, `retryable`, and, where applicable, `userActionRequired`.

## Tool Inventory

| Tool | Permission | State Requirement | Required Input | Primary Outcome |
|------|-----------|-------------------|----------------|-----------------|
| `login` | Public | — | `email`, `password` | Authenticated user profile; protected tools become available |
| `register` | Public | — | `name`, `email`, `password` | New user profile; automatic authentication |
| `logout` | Authenticated | — | — | Session terminated; protected tools revoked |
| `get_account_info` | Public | — | — | Current authentication status and user profile |
| `navigate_to_page` | Public | Destination-dependent | `page` | Browser navigated to safe internal route (`/`, `/products`, `/compare`, `/cart`, `/checkout`, `/account`) |
| `view_product_page` | Public | — | `productId` | Browser opened directly to `/products/{productId}` |
| `view_comparison_page` | Public | — | `productIds` | Browser opened directly to `/compare` in parallel or serial mode |
| `filter_apparel` | Public | — | — | Filtered catalog by gender, clothing category, color, size, and price |
| `get_apparel_size_guide` | Public | — | — | Authoritative sizing charts, body measurements, and fit guidelines |
| `search_products` | Public | — | `query` | Matching catalog products with identifiers |
| `get_product_details` | Public | — | `productId` | Full product specifications, pricing, stock, and reviews |
| `filter_products` | Public | — | — | Filtered catalog products by criteria |
| `sort_products` | Public | — | `sortBy` | Sorted catalog products by chosen criterion |
| `get_product_recommendations` | Public | — | — | Related or category-based product recommendations |
| `compare_products` | Public | — | `productIds` | Side-by-side product comparison |
| `check_product_stock` | Public | — | `productId` | Real-time stock count and availability status |
| `get_current_promotions` | Public | — | — | Active promotions, featured products, and coupon codes |
| `get_available_product_variants` | Public | — | `productId` | Available sizes, colors, and fit options |
| `get_shipping_estimate` | Public | — | `zipCode` | Shipping options with rates and delivery estimates |
| `add_to_cart` | Authenticated | — | `productId` | Updated cart with totals |
| `get_cart` | Authenticated | — | — | Complete cart contents with line items and calculations |
| `update_cart_quantity` | Authenticated | — | `productId`, `quantity` | Updated cart with recalculated totals |
| `remove_from_cart` | Authenticated | — | `productId` | Updated cart with item removed |
| `clear_cart` | Authenticated | — | — | Empty cart |
| `apply_coupon` | Authenticated | — | `code` | Recalculated cart with coupon discount applied |
| `add_to_wishlist` | Authenticated | — | `productId` | Updated wishlist |
| `remove_from_wishlist` | Authenticated | — | `productId` | Updated wishlist |
| `get_wishlist` | Authenticated | — | — | Complete wishlist contents |
| `get_order_history` | Authenticated | — | — | Caller-owned order history |
| `get_order_details` | Authenticated | — | `orderId` | Caller-owned order details with item breakdown |
| `cancel_order` | Authenticated | — | `orderId` | Order cancellation result (PENDING/PROCESSING only) |
| `create_order` | Transactional | Cart populated | Address fields, `confirmDemoOrder: true` | Demo order placed; `DEMO_CARD` payment only |
| `get_saved_addresses` | Authenticated | — | — | Caller-owned shipping addresses |
| `update_shipping_address` | Authenticated | — | Address fields | Created or updated shipping address |

## Error Semantics

| Code | Condition | Retryable | User Action Required |
|------|-----------|-----------|---------------------|
| `TOOL_NOT_FOUND` | Requested tool is not registered on the current page | No | No |
| `INVALID_INPUT` | Input violates the declared schema (missing field, wrong type, out of range) | No | Yes |
| `AUTHENTICATION_REQUIRED` | A protected tool was invoked without an active session | No | Yes |
| `CART_EMPTY` | A cart-dependent tool was invoked with no items in the cart | No | Yes |
| `COLOR_NOT_AVAILABLE_FOR_DEPARTMENT` | Requested color is not stocked in that department (e.g. Red for Men) | No | Yes |
| `EXECUTION_ERROR` | Network or runtime failure during tool execution | Yes | No |

API-level business errors — including stock availability, coupon validation, ownership verification, and order-state restrictions — are returned in the API response payload. Callers should treat `success: false` as authoritative and avoid automatic retries unless `errorDetails.retryable` is explicitly `true`.

## Security & Privacy Contracts for LLM Integration

When WebMCP tools are declared to conversational AI agents (such as Google Gemini in Ask AI):

1. **Authentication Tool Isolation**: `login` and `register` tools are omitted from LLM function declarations. The model cannot solicit, view, or submit credentials. Authentication operations are conducted exclusively by the user via the browser UI.
2. **PII Response Redaction**: Tool execution outputs undergo recursive redaction before LLM context insertion. Recipient contact details (`phone`, `street`, `city`, `state`, `zipCode`, `country`) are replaced with semantic labels (e.g. `[Saved Address #1]`), and email addresses are masked (`u***@domain.com`).
3. **Prompt Injection Boundary Sanitization**: Tool results are wrapped in `[TOOL_RESULT]` boundary delimiters, and indirect prompt injection attempts embedded in catalog descriptions or user-generated reviews are neutralized.
4. **Audit Logging**: All tool executions, durations, sanitized parameters, and security events are logged in memory and asynchronously persisted to append-only JSONL files (`/api/audit`).

