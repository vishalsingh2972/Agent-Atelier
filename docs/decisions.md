# Architectural Decisions

This document records key architectural decisions made during the Bridge to Agentia WebMCP implementation, their rationale, and their consequences.

---

## ADR-001: Native WebMCP Implementation (Category 1)

**Date:** 2026-09-03
**Status:** Accepted

**Context:** WebMCP integration can be implemented as Category 1 (Native), where tools are registered directly on `document.modelContext`, or as Category 2 (Adapter), where an external bridge mediates between the website API and a WebMCP proxy.

**Decision:** Bridge to Agentia implements exclusively Category 1 — Native WebMCP. All 34 tools are registered directly in the browser via the `WebMCPRegistry` class. No external adapter, proxy, or MCP server is introduced.

**Rationale:** The application already exposes same-origin API routes. Tools invoke these APIs via `fetch()` within the browser context, sharing the user's session cookies and security boundaries. An adapter would introduce unnecessary latency, complexity, and an additional failure surface without providing material benefit.

**Consequences:** All tool definitions reside in client-side code. Server-side business logic remains exclusively in API routes and service modules.

---

## ADR-002: Custom WebMCPRegistry

**Date:** 2026-09-03
**Status:** Accepted

**Context:** The `use-webmcp-tool` npm package provides a React hook abstraction for WebMCP tool registration. The existing `WebMCPRegistry` class implements:

- Singleton lifecycle management
- Native `document.modelContext` bridge with `AbortController`-based registration
- Three-tier state-aware tool availability (public, authenticated, transactional)
- Input validation covering types, enums, required fields, integer checks, and min/max constraints
- Structured error codes with retryability and user-action metadata
- Execution listeners, subscriber notifications, and tracing
- Test-environment polyfill for Node.js

**Decision:** The project uses the custom `WebMCPRegistry` class. The `use-webmcp-tool` package is not adopted.

**Rationale:** The custom registry exceeds the package's capabilities across every dimension. Adopting the package would require abandoning state-aware gating, structured error responses, and the deterministic test harness — capabilities that are central to the project's testing and evaluation framework.

**Consequences:** Maintenance responsibility for the registry remains with the project. The registry is validated through 76 deterministic tests.

---

## ADR-003: Framework-Agnostic Tool Definitions

**Date:** 2026-09-03
**Status:** Accepted

**Context:** The specification references Angular-specific patterns (`provideExperimentalWebMcpTools`, `declareExperimentalWebMcpTool`, Signal Forms). Bridge to Agentia uses Next.js and React.

**Decision:** Angular-specific APIs and patterns are not adopted. Tool definitions are framework-agnostic TypeScript objects.

**Rationale:** The architectural principles embodied by the Angular patterns — route-scoped tool exposure, state-aware availability, schema validation — are already implemented through the `WebMCPRegistry` and React context providers using idiomatic Next.js/React patterns.

**Consequences:** Tool definitions are plain TypeScript objects with no framework coupling, making them testable in both browser and Node.js environments.

---

## ADR-004: Authentication Tools

**Date:** 2026-09-03
**Status:** Accepted

**Context:** When protected tools returned `AUTHENTICATION_REQUIRED`, agents had no mechanism to authenticate through WebMCP. They were dependent on a human user clicking the login button in the React UI.

**Decision:** Four authentication tools were added: `login`, `register`, `logout`, and `get_account_info`. These tools invoke the existing `/api/auth/*` endpoints and dispatch a `webmcp-auth-change` `CustomEvent` to synchronize the React `AuthContext`.

**Rationale:** Agent autonomy requires the ability to complete full journeys — including authentication — without relying on human UI interaction. This is particularly important for Journey C (auth barrier detection and recovery).

**Consequences:** The `AuthContext` includes an event listener for WebMCP-initiated auth state changes. The `logout` tool requires authentication to prevent unauthorized session termination.

---

## ADR-005: Integer Validation with Range Constraints

**Date:** 2026-09-03
**Status:** Accepted

**Context:** Quantity fields in cart tools were originally typed as `number` in the JSON schema, permitting fractional values (e.g., `2.5`) and negative values (e.g., `-3`). These values would reach the API and produce inconsistent behavior.

**Decision:** The registry's `validateInput` function was enhanced to support `integer` type validation (via `Number.isInteger()`) and `minimum`/`maximum` range constraints. Cart tool schemas were updated to use `type: 'integer', minimum: 1` for quantity fields.

**Rationale:** Validating at the registry level produces clear, structured error messages before any API call is made. This is more efficient and informative than allowing invalid values to reach the server.

**Consequences:** Tools specifying `type: 'integer'` are validated with `Number.isInteger()`. Numeric fields with `minimum` or `maximum` constraints are bounds-checked prior to execution.

---

## ADR-006: LLM Provider Abstraction

**Date:** 2026-09-03
**Status:** Accepted

**Context:** The LLM evaluation runner was hardcoded to the OpenAI Responses API. This prevented evaluator testing without an API key and precluded future provider comparisons.

**Decision:** An `LLMProvider` interface was introduced with `OpenAIProvider` and `MockProvider` implementations. Provider selection is determined by environment variables, with automatic fallback to the mock provider when no API key is configured.

**Rationale:** The mock provider enables CI/CD testing of the evaluator pipeline without API credentials. The abstraction supports future additions (Anthropic, Google, local models) without modifying the evaluation runner.

**Consequences:** The evaluation runner imports from `scripts/llmProviders.ts`. Setting `WEBMCP_EVAL_PROVIDER=mock` executes the evaluator with deterministic responses.

---

## ADR-007: Custom Events for Cross-Boundary State Synchronization

**Date:** 2026-09-03
**Status:** Accepted

**Context:** When an AI agent authenticates via the `login` WebMCP tool, the React `AuthContext` is unaware of the state change because the operation occurred outside the React component tree.

**Decision:** Authentication and navigation tools dispatch `CustomEvent`s on `window` (`webmcp-auth-change` and `webmcp-navigation`). Context providers and router listeners consume these events to keep the browser UI completely in sync.

**Rationale:** `CustomEvent` is a standard browser API for cross-boundary communication that avoids tight coupling between WebMCP tools and React components. The event-driven approach ensures the UI reflects agent-initiated state changes without requiring direct dependency injection.

**Consequences:** Clean decoupling between WebMCP tool execution and React state lifecycle.

---

## ADR-008: Dedicated Product Comparison System (Parallel & Serial Views)

**Date:** 2026-09-03
**Status:** Accepted

**Context:** Comparing luxury fashion items requires analyzing garment composition, fit, care instructions, sleeve styling, and price deltas. Displaying arbitrary numbers of items in fixed-width tables leads to horizontal overflow and layout breakage on smaller screens.

**Decision:** Implemented a dedicated comparison route (`/compare` and `/products/compare`) with adaptive presentation modes:
- **Parallel Mode (2–3 products)**: Side-by-side synchronized specification grid with aligned attributes.
- **Serial Mode (4+ products)**: Stacked vertical cards with comprehensive specification tables.
- **Agent Navigation**: Added `view_comparison_page` WebMCP tool so agents can directly transition the user's viewport to the comparison matrix.

**Rationale:** Adapting layout mode based on product count guarantees optimal readability and prevents horizontal table clipping across desktop and mobile viewports.

---

## ADR-009: In-Browser Voice Interaction & Text-to-Speech Engine

**Date:** 2026-09-04
**Status:** Accepted

**Context:** Conversational shopping via Ask AI benefits from voice interaction. However, unconstrained speech synthesis in browsers can cause audio overlap, background playback after closing drawers, and stale closures ignoring mute commands during multi-second LLM streaming calls.

**Decision:** Built a complete voice engine using browser-native Web Speech APIs:
- `SpeechRecognition` for voice input with interim transcripts and optional auto-send.
- `SpeechSynthesis` for audio replies with markdown stripping.
- Synchronous `voiceReplyRef` to ensure async agent turns respect real-time mute states.
- Dedicated `stopSpeaking()` handler that immediately silences audio on mute, drawer close, or Escape.
- Active sound wave indicator with a 1-click `[■ Stop Audio]` button.

**Rationale:** Leveraging native browser Web Speech APIs eliminates third-party audio service latency and costs while maintaining strict user control over speech playback.

---

## ADR-010: Luxury Atelier Domain Migration & Resilient Fallback Data Layer

**Date:** 2026-09-04
**Status:** Accepted

**Context:** The catalog transitioned from consumer electronics to a luxury fashion atelier collection (62 bespoke pieces of women's tops, men's t-shirts, and denim). On serverless environments (Netlify Functions), database cold starts or transient connection latency could cause Server Component SSR crashes.

**Decision:**
1. Reseeded database with 62 luxury apparel garments categorized into 4 departments.
2. Implemented `safeParseJson` to handle both string URLs and serialized JSON arrays safely.
3. Added in-memory fallback datasets (`FALLBACK_FEATURED_PRODUCTS`, `DEFAULT_CATEGORIES`) in `productService.ts`.
4. Created an editorial Next.js Error Boundary (`src/app/error.tsx`) with diagnostic digest rendering and 1-click recovery.
5. Auto-provisioned demo user credentials (`demo@agentbridge.io`, Alex Rivera) with support for both `password123` and `demo1234`.

**Rationale:** A production-grade e-commerce application must never render an unhandled 500 error screen during cold starts or transient network blips.

---

## ADR-011: LLM Auth Isolation, PII Redaction Layer & Prompt Injection Defense

**Date:** 2026-09-04
**Status:** Accepted

**Context:** Allowing LLMs unconstrained access to authentication tools or displaying unredacted user personal data (passwords, addresses, phone numbers) creates severe privacy risks, data exfiltration vulnerabilities, and training data contamination concerns. In addition, user messages and tool responses could carry adversarial prompt injection instructions.

**Decision:**
1. **Auth Tool Isolation**: Excluded `login` and `register` tools from Gemini function declarations in `toolFormatter.ts`. Authentication operations remain strictly within the user-facing browser UI.
2. **PII Redaction Layer (`responseRedactor.ts`)**: Implemented recursive PII scrubbing for all tool responses prior to LLM context insertion, masking email addresses (`u***@domain.com`) and replacing street addresses, zip codes, and phone numbers with semantic placeholders.
3. **Prompt Injection Defense (`promptGuard.ts`)**: Wrapped inputs in boundary markers (`[USER_MESSAGE]` and `[TOOL_RESULT]`), blocked direct instruction overrides, role-spoofing, system prompt extraction, and data exfiltration patterns, and neutralized indirect prompt injections embedded in tool responses.
4. **Server-Side AI Proxy (`/api/ai/chat`)**: Added an internal proxy endpoint to securely store the `GEMINI_API_KEY` on the server rather than exposing it in the client bundle.

**Rationale:** Defense-in-depth isolation ensures that sensitive user credentials and PII never leak into external LLM prompts or training logs.

---

## ADR-012: Persistent Server-Side Audit Logging & Security Trail

**Date:** 2026-09-04
**Status:** Accepted

**Context:** Monitoring tool executions, security policy enforcement, and prompt injection attempts requires a reliable, persistent audit trail that survives page reloads and browser crashes, without compromising client responsiveness or logging raw PII.

**Decision:**
1. Built a dual-layer logging architecture: an in-memory buffer (`auditLog.ts`) for real-time frontend debugging and WebMCP status display, paired with a debounced, batched asynchronous background flush.
2. Implemented `POST /api/audit` and `GET /api/audit` in Next.js App Router, writing redacted, append-only JSONL entries to `data/audit.log`.
3. Added threat detection auditing for prompt injection attempts, capturing detected signatures, timestamp, duration, and error codes.
4. Excluded `/data` from git tracking to prevent accidental check-in of operational logs.

**Rationale:** Append-only JSONL logging provides high-performance, tamper-resistant operational visibility while server-side PII scrubbing guarantees compliance with data protection best practices.

