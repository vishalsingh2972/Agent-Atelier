# System Architecture

## Overview

Bridge to Agentia is a Next.js 14 full-stack e-commerce application that serves both human shoppers and AI agents through a unified, server-authoritative architecture. The same API routes, service layer, and database serve both the React UI and WebMCP tool invocations, ensuring consistent behavior, security enforcement, and state management regardless of the caller.

## Architecture Diagram

```
                         ┌──────────────────────┐
                         │       AI Agent       │
                         │   (Ask AI UI / User) │
                         └──────────┬───────────┘
                                    │
                                    │ User Prompt
                                    ▼
                         ┌──────────────────────┐        Generate /        ┌──────────────────────┐
                         │   Agent Controller   │ ◄──────────────────────► │ Gemini API (external)│
                         │  (Orchestration)     │       Function Call      │ (Tool Declarations)  │
                         └──────────┬───────────┘                          └──────────────────────┘
                                    │
                          document.modelContext
                        getTools() / executeTool()
                                    │
                         ┌──────────▼───────────┐
                         │   WebMCP Registry    │
                         │                      │
                         │  • 34 Native Tools   │
                         │  • Schema Validation │
                         │  • State Gating      │
                         │  • Error Structuring │
                         │  • Native Bridge     │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                   │
      ┌──────────▼──────────┐ ┌────▼────────┐ ┌───────▼──────────┐
      │     React UI        │ │ API Routes  │ │  Context Layer   │
      │   (Next.js 14)      │ │ (18 routes) │ │ (Auth/Cart/WL/AI)│
      └──────────┬──────────┘ └─────┬───────┘ └──────────────────┘
                 │                  │
                 └────────┬─────────┘
                 ┌────────▼─────────┐
                 │ Commerce Services│
                 │                  │
                 │  productService  │
                 │  cartService     │
                 │  orderService    │
                 │  wishlistService │
                 │  couponService   │
                 └────────┬─────────┘
                 ┌────────▼─────────┐
                 │   PostgreSQL     │
                 │  (Neon / Prisma) │
                 └──────────────────┘
```

## Layer Responsibilities

### Agent Orchestration Layer (`src/lib/askai/`)

The agent orchestration layer connects the conversational interface to LLMs and WebMCP tools.

| Component | Responsibility |
|-----------|---------------|
| `agentController.ts` | Multi-turn loop orchestrator between Ask AI UI, Gemini API, and WebMCP tools; handles tool execution, destructive tool confirmation, PII redaction, and error recovery |
| `promptGuard.ts` | Sanitizes user messages and tool results; enforces `[USER_MESSAGE]` and `[TOOL_RESULT]` boundaries; detects and blocks prompt injection patterns |
| `responseRedactor.ts` | PII privacy boundary stripping sensitive contact/shipping fields (phone, address, credentials) and masking emails before tool results reach Gemini |
| `auditLog.ts` | Dual-layer audit logger tracking tool executions and injection events with async flush to `/api/audit` |
| `toolFormatter.ts` | Translates WebMCP tool schemas to Gemini `FunctionDeclaration` definitions; isolates auth tools (`login`/`register`) from LLM visibility |

### WebMCP Layer (`src/webmcp/`)

The WebMCP layer is responsible for tool lifecycle management and agent-facing interfaces.

| Component | Responsibility |
|-----------|---------------|
| `registry.ts` | Singleton orchestrator managing tool registration, native `document.modelContext` bridge, `AbortController`-based lifecycle, state tracking, input validation, error structuring, and execution listeners |
| `tools/*.ts` | 34 tool definitions organized by 8 domains (auth, navigation, apparel, product, cart, wishlist, order, shipping), each with semantic descriptions, JSON schemas, and async execute functions |
| `types.ts` | TypeScript interfaces for `WebMCPTool`, `JSONSchema`, `RegisteredToolInfo`, and response contracts |
| `testing/` | Direct execution trace harness for deterministic testing without browser context |

### Application Layer (`src/app/`)

| Component | Responsibility |
|-----------|---------------|
| Pages | Next.js App Router handlers for home, catalog, product details, cart, checkout, compare (`/compare`), and account |
| API Routes | 18 REST endpoints handling authentication, products, cart, orders, wishlist, coupons, shipping, and addresses |
| Error Boundary | `error.tsx` client boundary ensuring resilient UI recovery with diagnostic digests |
| Layout | Root layout providing auth, cart, wishlist, and Ask AI context providers plus the WebMCP status indicator |

### Service Layer (`src/lib/services/`)

| Service | Responsibility |
|-----------|---------------|
| `productService` | Catalog search, apparel color/gender filtering, sizing guides, product recommendations, side-by-side comparisons, and resilient fallback data |
| `cartService` | Cart CRUD operations with stock validation, discount calculation, and price aggregation |
| `orderService` | Order creation, history retrieval, detail inspection, and cancellation with ownership verification |
| `wishlistService` | Wishlist item management |
| `couponService` | Coupon code validation and discount resolution |

### Context Layer (`src/context/`)

| Provider | Responsibility |
|----------|---------------|
| `AuthContext` | User authentication state, login/logout handlers, WebMCP auth event synchronization |
| `CartContext` | Cart state management, UI drawer control, WebMCP execution listener for cart count updates |
| `WishlistContext` | Wishlist state management |
| `AskAIContext` | In-app conversational AI drawer visibility and state management |

### Data Layer

| Component | Technology |
|-----------|-----------|
| ORM | Prisma 5 with type-safe client generation |
| Database | PostgreSQL hosted on Neon |
| Models | User, Address, Category, Product, Review, Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, Coupon |
| Resilience | Graceful in-memory fallbacks (`DEFAULT_CATEGORIES`, `FALLBACK_FEATURED_PRODUCTS`) ensuring zero SSR crashes during cold starts |

## Data Flow

### Human User Path

```
Browser → React Component → fetch(/api/...) → API Route Handler
  → Authentication Check → Service Layer → Prisma Client → PostgreSQL
  → Response → React State Update → UI Re-render
```

### AI Agent Path

```
User → Ask AI UI → Agent Controller
  → Gemini API (external): tool declarations + prompt → functionCall
  → document.modelContext.executeTool(name, input)
  → WebMCP Registry: validate schema, check auth, check state
  → Tool.execute() → fetch(/api/...) → API Route Handler
  → Authentication Check → Service Layer → Prisma Client → PostgreSQL
  → Response → Registry: update state, notify listeners
  → Structured Result → Agent Controller (redact PII + sanitize)
  → Gemini API (external): functionResponse → natural-language answer
  → Ask AI UI → User
```

Both paths share identical API routes, service logic, database operations, and security enforcement. The Agent Controller coordinates between the user, the Gemini API for natural-language understanding and tool selection, and the WebMCP registry. The WebMCP registry adds a validation and state-gating layer before the API call, ensuring agents receive structured error responses for invalid inputs, missing authentication, or unavailable state before any server communication occurs.

## Cross-Boundary State Synchronization

When an AI agent modifies application state through WebMCP tools (e.g., logging in, adding to cart), the changes are reflected across both boundaries:

- **Authentication**: Auth tools dispatch a `webmcp-auth-change` `CustomEvent` on `window`. `AuthContext` listens for this event and updates React state, keeping the UI in sync.
- **Cart state**: `CartContext` subscribes to WebMCP execution events. Cart-modifying tool results update the cart item count, which the registry uses to gate `create_order` availability.
- **Tool availability**: The registry re-syncs with the native `document.modelContext` API on every state change, updating the indicator count (`18/34` to `34/34`) dynamically.
- **In-Page Navigation**: Navigation tools dispatch `webmcp-navigation` events that Next.js client routers consume to transition users smoothly to pages (such as `/compare` or `/products/[id]`).

