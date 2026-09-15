# Agent-Atelier — WebMCP-Powered Agent-Native Commerce

> **What happens when a website can expose its own capabilities directly to an AI agent?**

**Agent-Atelier** is a full-stack luxury fashion e-commerce experiment built to explore that question.

Instead of asking an AI agent to visually interpret a website and click through its UI, Agent-Atelier exposes **34 structured, schema-validated WebMCP tools** through the browser.

An agent can discover what the website can do, understand the available capabilities, and execute actions such as searching products, comparing garments, checking stock, managing a cart, navigating pages, and completing multi-step shopping flows.

The same underlying commerce logic powers both the human UI and the agent interface.

This project is intentionally experimental. The goal is not to present a finished solution to agent-native web interaction, but to explore what becomes possible when **the website itself becomes an interface for AI agents.**

---

## Architecture at a Glance

```mermaid
flowchart TB
    USER["Human Shopper"]
    AGENT["AI Agent"]

    subgraph BROWSER["Browser Context"]
        UI["React / Next.js UI"]
        VOICE["AI Stylist<br/>Chat + Voice"]
        MCP["WebMCP Registry<br/>34 Tools"]

        DISCOVER["Tool Discovery<br/>getTools()"]
        EXECUTE["Tool Execution<br/>executeTool()"]

        UI --> VOICE
        VOICE --> MCP
        AGENT --> DISCOVER
        DISCOVER --> MCP
        AGENT --> EXECUTE
        EXECUTE --> MCP
    end

    subgraph VALIDATION["WebMCP Control Layer"]
        SCHEMA["Schema Validation"]
        STATE["State-Aware Gating"]
        AUTH["Auth / Permission Checks"]
        ERRORS["Structured Errors"]
        CONFIRM["Human Confirmation Gates"]
    end

    subgraph APPLICATION["Application Layer"]
        API["Same-Origin Next.js API Routes"]
        SERVICES["Commerce Services"]
        AUTH_SERVICE["Authentication"]
    end

    DB[("PostgreSQL<br/>Neon + Prisma")]

    USER --> UI

    MCP --> SCHEMA
    SCHEMA --> STATE
    STATE --> AUTH
    AUTH --> CONFIRM
    CONFIRM --> ERRORS
    ERRORS --> API

    API --> SERVICES
    API --> AUTH_SERVICE

    SERVICES --> DB
    AUTH_SERVICE --> DB

    style BROWSER fill:#f8f7f4,stroke:#111,stroke-width:1px
    style VALIDATION fill:#f3f3f3,stroke:#111,stroke-width:1px
    style APPLICATION fill:#fafafa,stroke:#111,stroke-width:1px
    style DB fill:#f8f7f4,stroke:#111,stroke-width:1px
```

### The important architectural idea

There are **two entry points**, but only one business logic path:

```mermaid
flowchart LR
    HUMAN["Human"] --> UI["React UI"]
    AGENT["AI Agent"] --> MCP["WebMCP Tools"]

    UI --> API["Same-Origin API"]
    MCP --> API

    API --> SERVICES["Commerce Services"]
    SERVICES --> DB[("PostgreSQL")]

    style HUMAN fill:#fafafa,stroke:#111
    style AGENT fill:#fafafa,stroke:#111
    style UI fill:#fafafa,stroke:#111
    style MCP fill:#fafafa,stroke:#111
    style API fill:#fafafa,stroke:#111
    style SERVICES fill:#fafafa,stroke:#111
    style DB fill:#fafafa,stroke:#111
```

This means WebMCP is **not a parallel commerce implementation**.

The agent-facing tools ultimately use the same:

* API routes
* Authentication
* Authorization
* Commerce services
* Database
* Business rules

as the normal React application.

---

## 1. Project Overview

Agent-Atelier is a **Next.js 14 luxury fashion storefront** backed by PostgreSQL and Prisma, with browser-native WebMCP capabilities exposed directly through:

```ts
document.modelContext
```

The application currently exposes **34 WebMCP tools** covering:

* Product discovery
* Apparel filtering
* Product comparison
* Size guidance
* Stock inspection
* Cart management
* Wishlist management
* Authentication
* Orders
* Shipping
* Navigation

The tools are:

* Structured
* Schema validated
* State aware
* Permission aware
* Server-authoritative
* Designed for multi-step agent workflows

The important architectural decision is that **WebMCP is not a second application layer**.

The agent and the React UI ultimately use the same commerce APIs and service logic.

```text
Human ──────► React UI ──────┐
                             ├──► API ──► Services ──► Database
AI Agent ───► WebMCP ────────┘
```

---

## 2. Why This Experiment

Traditional web agents generally have to infer what a website can do from:

* DOM structure
* Visible text
* Buttons
* Forms
* Page layout
* Screenshots

That works reasonably well for simple navigation, but becomes fragile when the agent needs to perform operations involving:

* Authentication
* User-owned resources
* Product identifiers
* Stock validation
* Cart state
* Order state
* Multi-step workflows
* Sensitive mutations

For example, visually finding an **"Add to Cart"** button is different from having a structured operation such as:

```text
add_to_cart({
  productId,
  quantity,
  variant
})
```

The second approach gives the agent a defined contract instead of forcing it to infer the application's internal behavior from presentation.

Agent-Atelier explores what happens when those capabilities are explicitly exposed by the website.

---

## 3. What Is WebMCP?

**WebMCP (Web Model Context Protocol)** is an emerging browser API that allows websites to expose structured tools to AI agents operating within the browser.

In Agent-Atelier, tools are registered through:

```ts
document.modelContext
```

An agent can discover tools and their schemas:

```ts
document.modelContext.getTools()
```

and execute them:

```ts
document.modelContext.executeTool(
  "search_products",
  {
    query: "blue silk blouse"
  }
)
```

Conceptually:

```text
Website
   │
   ├── describes its capabilities
   ├── exposes schemas
   ├── controls availability
   └── executes validated operations
             ▲
             │
          AI Agent
```

This is different from a traditional remote MCP server.

The tools are exposed by the **active website inside the browser context**, allowing the application to apply its own session, state, permissions, and security boundaries.

> WebMCP support is currently experimental and browser-dependent. See [Limitations](#25-limitations).