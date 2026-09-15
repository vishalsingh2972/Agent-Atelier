# Testing Strategy

## Overview

Bridge to Agentia testing validates that all 34 WebMCP tools correctly enforce schemas, respect authentication and state boundaries, execute against the correct API endpoints, produce structured error responses, and complete multi-step agent journeys. The test infrastructure is organized in four tiers, progressing from fast deterministic validation to provider-backed evaluation.

## Tier 1: Deterministic Tool Tests

**Location:** `tests/webmcp/tools/`
**Runner:** `npm test` (Vitest)
**Count:** **90 tests across 10 files**

### Test Files

| File | Tests | Scope |
|------|-------|-------|
| `registry.test.ts` | 7 | Unknown tool errors, required parameter validation, type checking, auth barriers, direct execution tracing, 34-tool registration, state gating, checkout policy |
| `requestContracts.test.ts` | 8 | Every tool's API endpoint, HTTP method, query parameter encoding, and request body validation |
| `authTools.test.ts` | 12 | Auth tool request contracts (4), response format validation (4), registry integration and validation (4) |
| `navigationTools.test.ts` | 10 | Navigation contracts (3), destination boundaries, auth/cart barriers, product detail navigation, compare URL formatting, CustomEvent dispatching |
| `apparelTools.test.ts` | 9 | Apparel category and department validation, color availability (`COLOR_NOT_AVAILABLE_FOR_DEPARTMENT`), sizing guide queries, schema constraints |
| `securityDefenses.test.ts` | 14 | Recursive email masking, PII address scrubbing, prompt injection blocking (instruction overrides, role/mode switching, system prompt extraction, delimiter escaping), indirect injection sanitization, audit logging, and `/api/audit` async flush |
| `stateJourneys.test.ts` | 5 | Journey A (search→inspect→add→view), Journey B (search→compare→add→update→view), Journey C (auth barrier→login→retry), Journey D (search→add→verify→checkout), full state transition cycle |
| `failureModes.test.ts` | 18 | Wrong execution order (2), wrong arguments including negative/zero/non-integer quantities (6), missing required data (4), unknown tool (1), network failures (2), mid-chain failures (3) |
| `checkoutPolicy.test.ts` | 3 | Demo payment method validation, order confirmation requirement |
| `testDatabase.test.ts` | 4 | Database configuration safety gate validation |

### What These Tests Validate

- All 34 tools call the correct API endpoint with the correct HTTP method
- Query parameters are properly URL-encoded
- POST/PUT/DELETE request bodies contain the expected fields
- Required parameter validation rejects missing fields with descriptive error messages
- Type validation enforces `string`, `number`, `integer`, `boolean`, and `array` types
- Integer validation uses `Number.isInteger()` and enforces `minimum`/`maximum` constraints
- Enum validation rejects undeclared values
- Protected tools are blocked without authentication
- `create_order` is blocked when the cart is empty
- Department and color availability constraints are strictly enforced
- In-browser navigation events are dispatched accurately without full-page reloads
- Sensitive contact and shipping fields (phone, full address, credentials) are redacted before LLM context ingestion
- Email addresses are recursively masked across arbitrary nested payloads
- Prompt injection patterns are actively blocked and quarantined
- Indirect prompt injection embedded within product data is neutralized
- Dual-layer audit logger tracks tool execution and injection events with server-side flush
- API failure responses are forwarded to the caller without transformation
- Network failures produce structured `EXECUTION_ERROR` responses with `retryable: true`

## Tier 2: Integration Tests

**Location:** `tests/webmcp/`
**Runner:** `npm run test:webmcp:integration`
**Count:** 23 tests

Integration tests exercise tools against a real (or isolated test) database, validating end-to-end behavior including stock availability checks, coupon validation, cart price calculations, order creation, and ownership-based authorization.

See [webmcp-testing-environment.md](webmcp-testing-environment.md) for database configuration and safety gate setup.

## Tier 3: Browser E2E Tests

**Location:** `tests/browser/`
**Runner:** `npm run test:webmcp:e2e` (Playwright)
**Count:** 7 specs across 2 files

### Commerce Journey (`webmcp-commerce.e2e.spec.ts`)
- Resolves a product from live search results at runtime
- Opens product detail page, adds to cart via UI, verifies cart state
- Removes from cart via UI, verifies empty cart state

### WebMCP Tool Verification (`webmcp-tools.e2e.spec.ts`)
- Validates `document.modelContext` availability and API surface
- Tests tool discovery via `getTools()`
- Tests direct tool execution via `executeTool()`
- Verifies authentication barrier enforcement in browser context
- Verifies input schema validation in browser context
- Verifies structured error for unknown tool names
- Tests state-aware tool availability changes on login/logout

## Tier 4: LLM Evaluation

**Location:** `evals/`
**Runner:** `npm run eval:webmcp:llm`
**Count:** 16 evaluation cases

Measures AI agent planning accuracy across tool selection, argument generation, execution ordering, and failure recovery — without executing tools or modifying application state. See [evaluation.md](evaluation.md) for methodology.

## Execution Summary

```bash
npm test                              # Tier 1: 90 deterministic tests (Vitest)
npm run test:webmcp:integration       # Tier 2: 23 integration tests
npm run test:webmcp:e2e              # Tier 3: 7 browser E2E specs (Playwright)
npm run eval:webmcp                   # Schema validation (16 cases)
npm run eval:webmcp:llm              # Tier 4: LLM planning evaluation
```
