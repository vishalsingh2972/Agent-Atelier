# WebMCP Specification Alignment

## What is WebMCP?

WebMCP (Web Model Context Protocol) is an emerging browser API that enables web pages to register structured, schema-validated tools for AI agents operating within the active browser context. Unlike remote MCP servers, WebMCP tools execute within the browser's same-origin security boundary, inheriting the user's session, cookies, and permission policies.

## Implementation Category

Bridge to Agentia implements **Category 1 — Native WebMCP**. Tools are registered directly on `document.modelContext` using the Chrome Imperative API. No external adapter, proxy, or remote MCP server is involved. See [ADR-001](decisions.md#adr-001-native-webmcp-implementation-category-1) for the rationale.

## Native Architecture

```
                 AI Agent
                    │
                    │ document.modelContext
                    ▼
          ┌──────────────────┐
          │   WebMCPRegistry │
          │                  │
          │  Discovery       │ ← getTools()
          │  Schemas         │ ← JSON Schema validation
          │  Execution       │ ← executeTool()
          │  State Gating    │ ← Auth + cart state
          │  Error Handling  │ ← Structured responses
          │  Native Bridge   │ ← AbortController lifecycle
          └────────┬─────────┘
                   │ fetch()
                   ▼
          ┌──────────────────┐
          │  Same-Origin API │
          │  (18 routes)     │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  Commerce Layer  │
          │  (Services + DB) │
          └──────────────────┘
```

## Tool Registration

Tools are registered imperatively during the React application's initial client-side mount via the `AuthContext` provider. Each tool is defined as a TypeScript object with:

| Property | Purpose |
|----------|---------|
| `name` | Stable, semantic identifier (e.g., `search_products`, `add_to_cart`) |
| `description` | Agent-facing natural language guidance: when to use, what it returns, identifier provenance |
| `inputSchema` | JSON Schema with types, required fields, constraints, and parameter descriptions |
| `permission` | Access tier: `PUBLIC`, `AUTHENTICATED`, or `TRANSACTIONAL` |
| `availability` | Optional state constraint (e.g., `CART_POPULATED`) |
| `category` | Domain grouping: Auth, Products, Cart, Wishlist, Orders, Shipping, Account, Promotions |
| `execute` | Async function that invokes the same-origin API via `fetch()` |

## Tool Discovery

Agents discover tools via `document.modelContext.getTools()`, which returns each tool's name, description, schema, permission, category, and current status:

| Status | Meaning |
|--------|---------|
| `AVAILABLE` | Tool is ready for execution |
| `LOGIN_REQUIRED` | Tool requires authentication; use `login` or `register` first |
| `STATE_UNAVAILABLE` | Tool requires a specific state (e.g., populated cart) |

When authentication or cart state changes, the registry re-syncs with the native API by aborting stale registrations via `AbortController` signals and creating new ones.

## Tool Execution

Execution flow through `document.modelContext.executeTool(name, input)`:

1. **Tool lookup** — verify the tool is registered; return `TOOL_NOT_FOUND` if absent
2. **Authentication check** — verify the session meets the tool's permission tier
3. **State check** — verify application state meets the tool's availability constraint
4. **Schema validation** — validate input against the declared JSON Schema
5. **Execution** — invoke the tool's async `execute` function
6. **State update** — propagate cart count changes and notify listeners
7. **Result** — return the structured response to the caller

## Structured Error Responses

All errors include an `errorDetails` object:

```typescript
{
  success: false,
  error: 'ERROR_CODE',
  message: 'Human-readable description',
  errorDetails: {
    code: 'ERROR_CODE',
    message: 'Detailed explanation',
    retryable: boolean,
    userActionRequired: boolean
  }
}
```

## Browser Requirements

| Requirement | Configuration |
|------------|--------------|
| Browser | Chrome with WebMCP support |
| Feature flag | `chrome://flags/#enable-webmcp-testing` enabled |
| Response header | `Origin-Agent-Cluster: ?1` |
| Permission policy | `Permissions-Policy: tools=(self)` |

## Security Model

| Control | Implementation |
|---------|---------------|
| Session authentication | JWT (HS256) in HTTP-only cookies with 7-day expiry |
| API authorization | Server-side ownership verification on all protected resources |
| Origin restriction | `Permissions-Policy: tools=(self)` confines tools to same origin |
| Agent isolation | `Origin-Agent-Cluster: ?1` signals agent-aware origin isolation |
| Input validation | Registry-level schema validation before any API execution |
| Checkout gating | Populated cart + `confirmDemoOrder: true` + `DEMO_CARD` payment method |
| Scope limitation | Administrative functions are not exposed through WebMCP |
| LLM credential isolation | `login` and `register` tools filtered from LLM function declarations |
| PII response redaction | Sensitive contact/address fields stripped; emails masked recursively (`responseRedactor.ts`) |
| Prompt injection defense | Boundary delimiters (`[USER_MESSAGE]`), pattern blocking, indirect injection sanitization (`promptGuard.ts`) |
| Persistent audit trail | Dual-layer logger with async append-only JSONL storage (`/api/audit`) |

## Current Limitations

- WebMCP requires Chrome with the experimental feature flag enabled.
- Product variants are derived from stored specifications, not SKU-level inventory.
- LLM evaluation metrics require a configured API provider; no results are fabricated when absent.
- This is a demonstration platform with a simulated checkout flow. It does not integrate with production payment processors.
