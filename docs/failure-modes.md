# Failure Modes

This document catalogs the failure modes that agents may encounter when interacting with Bridge to Agentia WebMCP tools, along with the expected error responses and recommended recovery strategies.

## Registry-Level Failures

These errors are produced by the `WebMCPRegistry` before any API call is made.

| Failure Condition | Error Code | Retryable | Recommended Agent Action |
|-------------------|-----------|-----------|-------------------------|
| Requested tool does not exist | `TOOL_NOT_FOUND` | No | Verify tool name against `getTools()`. Do not guess tool names. |
| Required parameter missing | `INVALID_INPUT` | No | Provide the missing parameter. The error message identifies the field. |
| Parameter type mismatch | `INVALID_INPUT` | No | Correct the type (e.g., string instead of number) and retry. |
| Non-integer value for integer field | `INVALID_INPUT` | No | Provide a whole number (e.g., `2` instead of `2.5`). |
| Value below minimum constraint | `INVALID_INPUT` | No | Adjust the value to meet the minimum (e.g., `quantity >= 1`). |
| Value above maximum constraint | `INVALID_INPUT` | No | Adjust the value to meet the maximum. |
| Invalid enum value | `INVALID_INPUT` | No | Use one of the documented enum values. |
| Protected tool called while unauthenticated | `AUTHENTICATION_REQUIRED` | No | Use the `login` or `register` tool first, then retry. |
| Cart-dependent tool called with empty cart | `CART_EMPTY` | No | Add items to the cart before attempting checkout. |
| Requested color not stocked in department | `COLOR_NOT_AVAILABLE_FOR_DEPARTMENT` | No | Consult available color options for that department and inform user. |
| Network or runtime failure during execution | `EXECUTION_ERROR` | Yes | Retry after a brief delay (maximum 2 attempts). |

## Security-Level Defenses & Failures

These conditions are intercepted by the LLM security boundary (`promptGuard.ts` and `responseRedactor.ts`).

| Failure Condition | Error / Event Code | Retryable | Recommended Action |
|-------------------|-------------------|-----------|-------------------|
| Prompt injection instruction override | `PROMPT_INJECTION_DETECTED` | No | Message quarantined and blocked. Inform user to rephrase query using natural shopping terms. |
| Role/persona spoofing or mode switch | `PROMPT_INJECTION_DETECTED` | No | Request blocked; agent maintains standard luxury stylist persona. |
| System prompt extraction attempt | `PROMPT_INJECTION_DETECTED` | No | Request blocked; agent declines politely and focuses on shopping tasks. |
| Delimiter escape attack | `PROMPT_INJECTION_DETECTED` | No | Malicious boundary markers quarantined and logged to persistent audit log. |
| LLM invoked non-existent auth tool | `TOOL_NOT_FOUND` | No | `login`/`register` are hidden from Gemini. Instruct user to click the top-right "Sign In" button. |

## API-Level Business Failures

These errors originate from the server-side API and are passed through by the registry without transformation.

| Failure Condition | Error Code | Retryable | Recommended Agent Action |
|-------------------|-----------|-----------|-------------------------|
| Product identifier not found | `PRODUCT_NOT_FOUND` | No | The identifier is invalid. Use `search_products` to obtain a valid ID. |
| Insufficient stock for requested quantity | `INSUFFICIENT_STOCK` | No | Inform the user. Suggest a smaller quantity or use `get_product_recommendations` for alternatives. |
| Quantity exceeds available stock | `EXCEEDS_STOCK` | No | Reduce the quantity to within available stock limits. |
| Product not present in cart | `ITEM_NOT_IN_CART` | No | Verify cart contents with `get_cart` before updating or removing. |
| Invalid coupon code | `INVALID_COUPON` | No | Request a different code from the user. Use `get_current_promotions` to discover valid codes. |
| Expired coupon code | `COUPON_EXPIRED` | No | Inform the user and suggest currently active promotions. |
| Order identifier not found | `ORDER_NOT_FOUND` | No | Use `get_order_history` to obtain a valid order ID. |
| Unauthorized access to resource | `UNAUTHORIZED_ACCESS` | No | The user does not own this resource. Do not retry. |
| Order cannot be cancelled (shipped/delivered) | `NOT_CANCELLABLE` | No | Inform the user that shipped or delivered orders require the return process. |
| Order already cancelled | `ALREADY_CANCELLED` | No | No action needed. Confirm to the user that the order was previously cancelled. |
| Non-demo payment method provided | `DEMO_PAYMENT_ONLY` | No | Use `DEMO_CARD` as the payment method. |
| Missing demo order confirmation | `DEMO_ORDER_CONFIRMATION_REQUIRED` | No | Set `confirmDemoOrder: true` only after the user explicitly confirms. |
| Invalid login credentials | `(success: false)` | No | Verify the email and password. Do not retry with the same credentials. |
| Duplicate email on registration | `(success: false)` | No | The email is already registered. Suggest using `login` instead. |

## Execution Order Failures

These failures occur when agents attempt operations in an invalid sequence.

| Scenario | Expected Agent Behavior |
|----------|------------------------|
| Checkout before adding items to cart | Recognize that `create_order` is unavailable. Inform the user and suggest adding items first. |
| Protected operation before authentication | Detect `AUTHENTICATION_REQUIRED` and invoke the `login` tool before retrying. |
| Order detail lookup without prior history retrieval | Call `get_order_history` first to obtain valid order identifiers. |
| Product comparison without prior search | Execute `search_products` first to obtain valid product identifiers. |
| Cart addition without product identification | Search for or identify a product before invoking `add_to_cart`. |

## Mid-Chain Failure Scenarios

These failures occur partway through a multi-step operation sequence.

| Scenario | Expected Agent Behavior |
|----------|------------------------|
| Search succeeds, add-to-cart fails (out of stock) | Report the stock issue. Suggest alternatives via `get_product_recommendations`. |
| Add-to-cart succeeds, checkout fails (invalid coupon) | Report the coupon error. Proceed without the coupon or discover valid codes via `get_current_promotions`. |
| Authentication succeeds, subsequent operation fails (network) | Retry the operation. `EXECUTION_ERROR` is retryable. |
| Multiple operations, one fails mid-sequence | Complete any independent successful operations, report the specific failure, and suggest a recovery path. |

## Recovery Patterns

| Trigger | Recovery Sequence |
|---------|------------------|
| `AUTHENTICATION_REQUIRED` | `login` → retry the original operation |
| `PRODUCT_NOT_FOUND` | `search_products` → use a valid product ID |
| `INSUFFICIENT_STOCK` | `get_product_recommendations` → suggest alternatives |
| `INVALID_COUPON` | `get_current_promotions` → suggest valid codes |
| `ORDER_NOT_FOUND` | `get_order_history` → use a valid order ID |
| `EXECUTION_ERROR` | Wait briefly → retry (maximum 2 retries) |
| `CART_EMPTY` | `search_products` → `add_to_cart` → retry checkout |
