# Bridge to Agent-Atelier — WebMCP-Powered Luxury Fashion E-Commerce Platform

Bridge to Agent-Atelier is a full-stack e-commerce application that implements browser-native WebMCP (Web Model Context Protocol) to expose structured commerce operations as discoverable, schema-validated tools for AI agents — while delivering a modern luxury fashion shopping experience for human users.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [What is WebMCP?](#4-what-is-webmcp)
5. [System Architecture](#5-system-architecture)
6. [Agent–Browser–WebMCP Flow](#6-agentbrowserwebmcp-flow)
7. [Luxury Apparel Catalog](#7-luxury-apparel-catalog)
8. [Dedicated Product Comparison System](#8-dedicated-product-comparison-system)
9. [Ask AI Stylist & Voice Engine](#9-ask-ai-stylist--voice-engine)
10. [Tool Inventory](#10-tool-inventory)
11. [Tool Discovery and State-Aware Exposure](#11-tool-discovery-and-state-aware-exposure)
12. [Schema Validation and Contracts](#12-schema-validation-and-contracts)
13. [Error Handling and Safety](#13-error-handling-and-safety)
14. [Agent Journeys](#14-agent-journeys)
15. [Testing Strategy](#15-testing-strategy)
16. [Evaluation Framework](#16-evaluation-framework)
17. [Browser Verification](#17-browser-verification)
18. [Metrics Summary](#18-metrics-summary)
19. [Technology Stack](#19-technology-stack)
20. [Project Structure](#20-project-structure)
21. [Setup and Installation](#21-setup-and-installation)
22. [Running the Application](#22-running-the-application)
23. [Running Tests](#23-running-tests)
24. [Running Evaluations](#24-running-evaluations)
25. [Environment Variables](#25-environment-variables)
26. [Security Model](#26-security-model)
27. [Architectural Decisions](#27-architectural-decisions)
28. [Limitations](#28-limitations)
29. [References](#29-references)
30. [License](#30-license)

---

## 1. Overview

Bridge to Agent-Atelier is a Next.js 14 luxury storefront backed by Prisma 5 and PostgreSQL (Neon). It registers **34 WebMCP tools** directly on `document.modelContext`, enabling AI agents operating within the browser to discover apparel by color, gender, and sizing, consult verified sizing charts, compare products side-by-side or serially, manage carts, handle wishlists, navigate pages, place demo orders, and authenticate — all through the same server-authoritative API routes used by the React UI.

Human shoppers and AI agents share identical business logic, database, authentication, and authorization. No separate API surface or external adapter exists.

## 2. Problem Statement

Visual inference is unreliable for authenticated commerce operations that require validated identifiers, ownership verification, stock checks, and safe state mutations. Agents that parse page layout cannot reliably execute multi-step workflows such as cart management, coupon application, sizing reconciliation, or order placement.

## 3. Solution

Bridge to Agent-Atelier exposes typed, schema-validated browser tools that invoke the same same-origin API routes as the UI. The server enforces all business rules — authentication, authorization, stock availability, coupon validity, and order-state transitions — regardless of whether the caller is a human or an agent.

## 4. What is WebMCP?

WebMCP (Web Model Context Protocol) is an emerging browser API that allows web pages to register structured tools for AI agents operating within the active browser context. Unlike remote MCP servers, WebMCP tools execute within the browser's same-origin security boundary, inheriting the user's session, cookies, and permissions.

For detailed specification alignment, see [docs/webmcp.md](docs/webmcp.md).

## 5. System Architecture

```
                    ┌─────────────────────┐
                    │      AI Agent       │
                    │  (Browser Context)  │
                    └──────────┬──────────┘
                               │ document.modelContext
                               │ getTools() / executeTool()
                    ┌──────────▼──────────┐
                    │   WebMCP Registry   │
                    │  ┌───────────────┐  │
                    │  │ 34 Tools      │  │
                    │  │ Schema Valid. │  │
                    │  │ State Gating  │  │
                    │  │ Error Struct. │  │
                    │  └───────┬───────┘  │
                    └──────────┼──────────┘
            ┌──────────────────┼──────────────────┐
            │                  │                  │
   ┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
   │   React UI      │ │  API Routes │ │  Context Layer  │
   │   (Next.js)     │ │ (18 routes) │ │ (Auth/Cart/WL)  │
   └────────┬────────┘ └──────┬──────┘ └─────────────────┘
            │                 │
            └────────┬────────┘
            ┌────────▼────────┐
            │ Commerce Services│
            │ (Product, Cart, │
            │  Order, Coupon) │
            └────────┬────────┘
            ┌────────▼────────┐
            │  PostgreSQL     │
            │  (Neon / Prisma)│
            └─────────────────┘
```

Both entry points — the React UI and the WebMCP tool layer — converge on the same API routes and service layer. For detailed diagrams, see [docs/architecture.md](docs/architecture.md).

## 6. Agent–Browser–WebMCP Flow

1. The browser loads the application. Next.js responds with `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)`.
2. The `WebMCPRegistry` registers public tools on `document.modelContext`. Protected tools are registered with `status: 'LOGIN_REQUIRED'`.
3. The agent discovers available tools via `document.modelContext.getTools()`, receiving each tool's name, description, schema, permission, and current availability status.
4. The agent invokes a tool via `document.modelContext.executeTool(name, input)`. The registry validates the input, checks auth and state requirements, then executes the tool.
5. The tool calls the same-origin API via `fetch()` or performs validated in-browser navigation. The server validates the request, executes the business logic, and returns a structured response.
6. Cart and authentication state changes propagate reactively to both the WebMCP registry (updating the dynamic tool indicator from `18/34` to `34/34`) and the React UI.

## 7. Luxury Apparel Catalog

The storefront is styled with a minimalist European luxury fashion aesthetic:
- **Color Palette**: Warm ivory canvas (`#fbfaf8`), pure white surfaces (`#ffffff`), deep black typography (`#111111`), hairline dividers (`#eae7e1`), zero gradients, and sharp borders.
- **Typography**: Editorial serif headings (`Cormorant Garamond`) paired with neutral sans-serif body text (`Inter`).
- **Database Inventory (62 Pieces)**:
  - **Women's Tops (31 items)**: 10 Red, 12 Blue, 9 Green (Silk blouses, tailored linen shirts, cashmere vests).
  - **Men's T-Shirts (23 items)**: 5 Black, 8 White, 10 Blue (Heavyweight organic cotton tees, mercerized crewnecks).
  - **Denim & Trousers (8 items)**: 3 Women's (Raw indigo straight-leg, wide-leg ecru), 5 Men's (Selvedge denim, tapered dark wash).
  - All electronic items have been purged and replaced with luxury garments.

## 8. Dedicated Product Comparison System

Bridge to Agent-Atelier features a dedicated comparison route (`/compare` and `/products/compare`):
- **Parallel Mode (2–3 Products)**: Renders products in a side-by-side column grid with synchronized attribute rows (Price, Fabric, Fit, Collar, Sleeve, Care, Origin, and Rating).
- **Serial Mode (4+ Products)**: Automatically switches to a stacked vertical card layout with expansive technical specifications.
- **Agent Navigation**: AI agents can directly navigate users to comparisons via `view_comparison_page({ productIds: [...], view: "parallel" | "serial" })` or query comparison matrices via `compare_products`.

## 9. Ask AI Stylist & Voice Engine

An integrated AI Stylist drawer powered by Google Gemini and native browser Web APIs:
- **Native Function Calling**: Gemini dynamically discovers active WebMCP tools and calls them to search the catalog, filter by size/bust measurements, inspect garments, and manage carts.
- **Voice Command Recognition**: Hands-free voice commands via native `webkitSpeechRecognition` / `SpeechRecognition` with optional auto-send.
- **Text-to-Speech Audio Replies**: Natural speech responses generated via `window.speechSynthesis`.
- **Real-Time Voice Controls**:
  - Immediate Mute/Unmute toggle in the drawer header and settings.
  - Synchronous `voiceReplyRef` tracking to eliminate stale closure execution.
  - Active audio sound wave indicator banner with a 1-click `[■ Stop Audio]` button.
  - Automatic speech cancellation upon drawer close or Escape key.
- **Confirmation Gates**: Sensitive mutations (`create_order`, `cancel_order`, `clear_cart`, `logout`, `update_shipping_address`, `remove_from_cart`) pause for explicit user confirmation in the chat before execution.
- **Security Boundaries**: Real-time prompt injection defense, PII response redactor, auth tool isolation, and persistent audit logging protect user privacy and prevent unauthorized actions.

## 10. Tool Inventory

Bridge to Agent-Atelier registers **34 tools** across eight functional categories:

| Category | Tools | Permission |
|----------|-------|-----------|
| **Navigation** | `navigate_to_page`, `view_product_page`, `view_comparison_page` | Public |
| **Apparel & Fashion** | `filter_apparel`, `get_apparel_size_guide` | Public |
| **Authentication** | `login`, `register`, `logout`, `get_account_info` | Public / Authenticated |
| **Product Catalog** | `search_products`, `get_product_details`, `filter_products`, `sort_products`, `get_product_recommendations`, `compare_products`, `check_product_stock`, `get_current_promotions`, `get_available_product_variants` | Public |
| **Cart Management** | `add_to_cart`, `get_cart`, `update_cart_quantity`, `remove_from_cart`, `clear_cart`, `apply_coupon` | Authenticated |
| **Wishlist** | `add_to_wishlist`, `remove_from_wishlist`, `get_wishlist` | Authenticated |
| **Order Management** | `get_order_history`, `get_order_details`, `cancel_order`, `create_order` | Authenticated / Transactional |
| **Shipping & Address** | `get_shipping_estimate`, `get_saved_addresses`, `update_shipping_address` | Public / Authenticated |

For complete schemas, parameters, and API mappings, see the [tool inventory](tools/tool-inventory.md) and [tool contracts](docs/webmcp-tool-contracts.md).

## 11. Tool Discovery and State-Aware Exposure

Tool availability is governed by a three-tier reactive state model:

| Application State | Available Tools | Restrictions | Indicator Badge |
|-------------------|----------------|--------------|-----------------|
| Guest (logged out) | 18 Public tools | Protected tools return `AUTHENTICATION_REQUIRED` | `18/34` |
| Authenticated, cart empty | 33 tools (all authenticated except order placement) | `create_order` returns `CART_EMPTY` | `33/34` |
| Authenticated, cart populated | All 34 tools active | `create_order` requires `confirmDemoOrder: true` | `34/34` |

State transitions are reactive. Login exposes protected tools immediately. Cart mutations update `create_order` availability. Logout revokes all protected tool registrations. See [docs/webmcp-state-model.md](docs/webmcp-state-model.md).

## 12. Schema Validation and Contracts

The registry validates every tool invocation before execution:
- **Required fields** — missing parameters produce `INVALID_INPUT` with the specific field name
- **Type checking** — `string`, `number`, `integer`, `boolean`, `array` with strict enforcement
- **Integer validation** — `Number.isInteger()` check for quantity and count fields
- **Enum constraints** — `sortBy`, `view`, and department values restricted to documented options
- **Range constraints** — `minimum` / `maximum` bounds on numeric parameters
- **Identifier provenance** — tool descriptions specify that IDs must come from prior catalog results

## 13. Error Handling and Safety

### Registry-Level Errors

| Code | Condition | Retryable |
|------|-----------|-----------|
| `TOOL_NOT_FOUND` | Tool name not registered | No |
| `INVALID_INPUT` | Schema validation failure | No |
| `AUTHENTICATION_REQUIRED` | Protected tool called while unauthenticated | No |
| `CART_EMPTY` | Cart-dependent tool called with empty cart | No |
| `COLOR_NOT_AVAILABLE_FOR_DEPARTMENT` | Requested color is not stocked for that department | No |
| `EXECUTION_ERROR` | Network or runtime failure | Yes |

### API-Level Business Errors

API responses retain structured error payloads (`PRODUCT_NOT_FOUND`, `INSUFFICIENT_STOCK`, `UNAUTHORIZED_ACCESS`, `NOT_CANCELLABLE`, etc.). The registry does not mask or transform these. For the complete error catalog, see [docs/failure-modes.md](docs/failure-modes.md).

## 14. Security & Privacy Architecture

The platform enforces end-to-end security and data isolation across LLM and agent boundaries:

1. **Authentication Tool Isolation**:
   - `login` and `register` tools are filtered from Gemini function declarations.
   - LLMs never see, handle, or prompt for raw user passwords. Authentication is handled exclusively through browser UI.
2. **PII Redaction Layer (`responseRedactor.ts`)**:
   - Recursively masks email addresses (`u***@domain.com`) across all tool output objects and arrays.
   - Replaces street addresses, phone numbers, and zip codes with semantic placeholders (e.g., `[Saved Address #1]`, `[Order shipping address]`) before sending tool results to Gemini.
   - Preserves public catalog and non-PII product attributes intact.
3. **Prompt Injection Defenses (`promptGuard.ts`)**:
   - Wraps inputs in `[USER_MESSAGE]` and tool results in `[TOOL_RESULT]` boundary delimiters.
   - Detects and blocks instruction override attempts, role/persona manipulation, system prompt extraction, data exfiltration, and delimiter escape attacks.
   - Sanitizes tool results against indirect prompt injection via untrusted user-generated content.
4. **Persistent Audit Logging (`/api/audit`)**:
   - Dual-layer logging with an in-memory buffer for real-time inspection and async batched flush to persistent append-only JSONL files (`data/audit.log`).
   - Tracks tool execution times, sanitized inputs, results, and prompt injection detection events.
5. **Server-Side AI Proxy (`/api/ai/chat`)**:
   - Secures the Gemini API key on the server while supporting direct client keys when configured.

## 15. Agent Journeys

The following multi-step journeys are validated through deterministic tests and evaluation cases:

| Journey | Steps |
|---------|-------|
| **A — Apparel Discovery** | `filter_apparel` → `get_apparel_size_guide` → `get_product_details` → `add_to_cart` → `get_cart` |
| **B — Comparison Shopping** | `filter_apparel` → `compare_products` → `view_comparison_page` → `add_to_cart` |
| **C — Authentication Recovery** | Detect `AUTHENTICATION_REQUIRED` → `login` → retry protected operation |
| **D — Demo Checkout** | `search_products` → `add_to_cart` → `get_cart` → `create_order` |

## 16. Testing Strategy

Testing is organized in four tiers:

| Tier | Scope | Runner | Count |
|------|-------|--------|-------|
| **Deterministic** | Registry, schemas, contracts, navigation, apparel filters, sizing, security defenses, state journeys, failure modes | `npm test` (Vitest) | **90 tests** |
| **Integration** | End-to-end service execution against database | `npm run test:webmcp:integration` | 23 tests |
| **Browser E2E** | UI flows + `document.modelContext` verification | `npm run test:webmcp:e2e` (Playwright) | 7 specs |
| **LLM Evaluation** | Model planning accuracy (tool selection, arguments, chains) | `npm run eval:webmcp:llm` | 16 cases |

For detailed coverage breakdown, see [docs/testing.md](docs/testing.md).

## 17. Evaluation Framework

The LLM evaluation framework measures AI agent planning accuracy without executing tools or mutating application state:
- **Tool Selection Accuracy** — correct tool set identified (order-independent)
- **Argument Accuracy** — correct parameters provided for each call
- **Chain Accuracy** — correct execution sequence (order-dependent)
- **Recovery Accuracy** — graceful handling of edge cases and unavailable tools
- **Latency** — mean response time per case

The framework supports pluggable providers via the `LLMProvider` interface, with built-in support for OpenAI and a mock provider for CI environments. For methodology details, see [docs/evaluation.md](docs/evaluation.md).

## 18. Browser Verification

WebMCP compliance is verified through:
- **Response headers**: `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` confirmed via Chrome DevTools
- **Native tool registration**: Verified via Chrome Model Context Tool Inspector
- **Automated E2E**: Playwright specs validate `document.modelContext` availability, tool discovery, execution, and state transitions

See [docs/webmcp-browser-verification.md](docs/webmcp-browser-verification.md) for the verification protocol.

## 19. Metrics Summary

| Metric | Result |
|--------|--------|
| Registered WebMCP tools | **34** (18 Public, 16 Authenticated/Transactional) |
| Deterministic tests | **90 passed** (10 test suites) |
| Integration tests | 23 passed |
| Evaluation dataset | 16/16 schema valid |
| Browser E2E specs | 7 specs |
| Production build | Compiled successfully (28 routes) |
| Response headers | Verified (`tools=(self)`, `Origin-Agent-Cluster: ?1`) |
| Inspector verification | Manually verified |
| Apparel catalog | 62 pieces (Tops, Tees, Denim) |

## 20. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon), Prisma 5 ORM |
| Authentication | JWT (jose), HTTP-only cookies |
| WebMCP | Chrome Imperative API (`document.modelContext`) |
| AI Engine | Google Gemini (`gemini-2.0-flash`) Function Calling |
| Voice Engine | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) |
| Styling | Vanilla CSS with luxury design tokens |
| Testing | Vitest 2, Playwright |
| Deployment | Netlify (Node.js 20, `@netlify/plugin-nextjs`) |

## 21. Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages & API routes (20 endpoints)
│   │   ├── compare/            # Dedicated Side-by-Side & Serial Comparison Page
│   │   ├── products/           # Luxury Catalog and Product Detail Pages
│   │   ├── error.tsx           # Atelier Server Component Error Boundary
│   │   └── api/                # Same-origin REST endpoints (incl. /api/ai/chat, /api/audit)
│   ├── webmcp/
│   │   ├── registry.ts         # WebMCPRegistry — singleton orchestrator
│   │   ├── types.ts            # Tool, schema, and response interfaces
│   │   ├── index.ts            # Tool registration entry point (34 tools)
│   │   ├── tools/
│   │   │   ├── authTools.ts    # login, register, logout, get_account_info
│   │   │   ├── navigationTools.ts # navigate_to_page, view_product_page, view_comparison_page
│   │   │   ├── apparelTools.ts # filter_apparel, get_apparel_size_guide
│   │   │   ├── productTools.ts # 9 catalog tools (search, details, compare, etc.)
│   │   │   ├── cartTools.ts    # 6 cart management tools
│   │   │   ├── orderTools.ts   # 4 order management tools
│   │   │   ├── wishlistTools.ts# 3 wishlist tools
│   │   │   └── shippingTools.ts# 3 shipping/address tools
│   │   └── testing/            # Direct execution trace harness
│   ├── lib/
│   │   ├── askai/              # Agent controller, prompt guard, PII redactor, audit logger
│   │   └── services/           # Commerce service layer (product, cart, order, wishlist)
│   ├── components/
│   │   ├── askai/              # Ask AI Assistant, Voice Controls, Audio Indicator
│   │   ├── webmcp/             # WebMCP Status Indicator & Interactive Tool Inspector
│   │   ├── products/           # ProductCard, FilterSidebar, Comparison Matrix
│   │   └── layout/             # Luxury Navbar, Mobile Navigation Drawer, Footer
│   ├── context/                # React context providers (Auth, Cart, Wishlist, AskAI)
│   └── styles/                 # Design system tokens and component styles
├── tests/
│   ├── webmcp/tools/           # 10 deterministic test suites (90 tests)
│   └── browser/                # Playwright E2E specs
├── evals/                      # 16 LLM evaluation cases (JSON)
├── scripts/                    # Eval runners and provider abstraction
├── docs/                       # Architecture, testing, evaluation, decisions
├── tools/                      # Machine-readable tool inventory
└── prisma/                     # Schema and seed script (62 apparel items)
```

## 22. Setup and Installation

**Prerequisites**: Node.js 20+, PostgreSQL instance (Neon recommended).

```bash
git clone https://github.com/misbah7172/AgentBridge--WebMCP-Powered-E-Commerce-Platform.git
cd AgentBridge--WebMCP-Powered-E-Commerce-Platform
npm install
cp .env.example .env        # Configure DATABASE_URL and JWT_SECRET
npm run db:push
npm run db:seed
```

### Demo Credentials
* **Email**: `demo@agentbridge.io`
* **Password**: `password123` (or `demo1234`)
* **1-Click**: Available directly in the sign-in modal via "1-Click Demo Login".

## 23. Running the Application

```bash
npm run dev
```

Open `http://localhost:3000`. For native WebMCP tool inspection, enable `chrome://flags/#enable-webmcp-testing` in Chrome and use the Model Context Tool Inspector extension.

## 23. Running Tests

```bash
# Deterministic tests (76 tests, no database required)
npm test

# Database integration tests (requires TEST_DATABASE_URL)
npm run test:webmcp:integration

# Browser E2E tests (requires running application)
npm run test:webmcp:e2e
```

Refer to [docs/webmcp-testing-environment.md](docs/webmcp-testing-environment.md) for database configuration.

## 24. Running Evaluations

```bash
# Schema validation (database-free)
npm run eval:webmcp

# LLM planning evaluation (requires OPENAI_API_KEY)
npm run eval:webmcp:llm
```

## 25. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Session token signing key |
| `TEST_DATABASE_URL` | For integration tests | Isolated test database URL |
| `WEBMCP_TEST_DATABASE` | For integration tests | Acknowledgement flag (`true`) |
| `WEBMCP_ALLOW_SHARED_DATABASE` | Optional | Permit integration tests on application database |
| `OPENAI_API_KEY` | For LLM evals | OpenAI API key |
| `WEBMCP_EVAL_MODEL` | Optional | Model identifier (default: `gpt-5.6-luna`) |
| `WEBMCP_EVAL_PROVIDER` | Optional | Provider override: `openai` or `mock` |

Configuration templates: [`.env.example`](.env.example), [`.env.test.example`](.env.test.example).

## 26. Security Model

| Control | Implementation |
|---------|---------------|
| Session authentication | JWT signed with HS256, HTTP-only cookies, 7-day expiry |
| API authorization | Server-side ownership verification on orders, addresses |
| WebMCP origin restriction | `Permissions-Policy: tools=(self)` |
| Agent isolation | `Origin-Agent-Cluster: ?1` |
| Input validation | Registry-level schema validation before API execution |
| Demo checkout gating | Requires populated cart, `confirmDemoOrder: true`, `DEMO_CARD` only |
| Tool scope | Administrative functions are not exposed through WebMCP |
| Voice audio safety | Speech synthesis instantly silenced on mute, close, or Escape |

## 27. Architectural Decisions

Key design decisions are documented in [docs/decisions.md](docs/decisions.md):
- **ADR-001**: Native WebMCP Implementation (`document.modelContext`)
- **ADR-002**: Custom `WebMCPRegistry` with Reactive State Gating
- **ADR-003**: Framework-Agnostic Tool Definitions
- **ADR-004**: Authentication Tools for Agent Autonomy
- **ADR-005**: Integer Validation with Range Constraints
- **ADR-006**: Pluggable LLM Provider Abstraction
- **ADR-007**: Custom Events for Cross-Boundary State Synchronization
- **ADR-008**: Dedicated Product Comparison System (Parallel & Serial Views)
- **ADR-009**: In-Browser Voice Interaction & Text-to-Speech Engine
- **ADR-010**: Luxury Atelier Domain Migration & Resilient Fallback Data Layer

## 28. Limitations

- WebMCP requires Chrome with experimental flag `chrome://flags/#enable-webmcp-testing` enabled.
- Product variants are derived from stored specifications, not SKU-level warehouse inventory.
- Voice recognition relies on Web Speech API support in Chromium, Edge, or Safari.
- This is a demonstration platform with a simulated checkout flow. It does not integrate with production payment processors.

## 29. References

- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP Security Guidance](https://developer.chrome.google.cn/docs/ai/webmcp/secure-tools)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 30. License

Distributed under the [MIT License](LICENSE).
