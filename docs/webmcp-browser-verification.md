# Chrome WebMCP Browser Verification

This document describes the protocol for verifying WebMCP tool registration and execution in a compatible Chrome browser.

## Recorded Evidence

Validation was performed against the local application at `http://localhost:3000/` using Chrome DevTools and the Model Context Tool Inspector extension.

| Verification | Result |
|-------------|--------|
| Response headers | `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` confirmed |
| Tool registration | 34 tools registered on `document.modelContext` (18 Public, 16 Authenticated/Transactional) |
| Public tool execution | Verified via Inspector |
| Protected tool gating | Verified: tools require authentication before execution |
| Network captures | [Network overview](evidence/webmcp-network-overview.png), [Response headers](evidence/webmcp-response-headers.png) |

The screenshots are evidence of browser configuration and header compliance, not a substitute for the automated test suites described below.

## Local Setup

1. Start the application: `npm run dev`.
2. In Chrome, enable `chrome://flags/#enable-webmcp-testing` and relaunch the browser.
3. Navigate to `http://localhost:3000` directly. Do not use a traditional MCP client as a substitute.
4. Open Chrome DevTools → Network tab. Confirm the document response includes both required headers.
5. Open the Chrome Model Context Tool Inspector extension.

## Manual Acceptance Checklist

- [ ] Confirm `document.modelContext` is browser-provided (no console error reporting an attempted overwrite).
- [ ] Verify public tools appear before authentication.
- [ ] Authenticate (via UI or WebMCP `login` tool) and verify protected tools appear.
- [ ] Log out and verify protected tools are removed from the Inspector.
- [ ] Invoke `search_products` with valid input. Confirm structured success output.
- [ ] Invoke `search_products` with missing `query`. Confirm structured `INVALID_INPUT` error.
- [ ] Invoke `get_cart` as a guest. Confirm `AUTHENTICATION_REQUIRED` error.
- [ ] Invoke `get_cart` after authentication. Confirm structured cart response.
- [ ] Add a product to the cart and verify `create_order` becomes available in the Inspector.
- [ ] Remove the product and verify `create_order` is no longer available.

## Automated Browser E2E

`npm run test:webmcp:e2e` executes Playwright specs against the running application. The suite validates:

- `document.modelContext` availability and API surface
- Tool discovery via `getTools()`
- Direct tool execution via `executeTool()`
- Authentication barrier enforcement
- Input schema validation
- Unknown tool error handling
- State-aware tool availability transitions on login/logout
- Full commerce journey (search → add → verify → remove → verify empty)

## Limitations of Automated Verification

Native WebMCP requires a compatible Chrome runtime and is designed for local, human-in-the-loop browsing contexts. The deterministic test harness and browser E2E suite exercise the application logic comprehensively, but neither substitutes for direct native inspection through Chrome's Model Context Tool Inspector. The Inspector remains the authoritative verification surface for native tool registration behavior.
