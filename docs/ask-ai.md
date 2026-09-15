# Ask AI — Architecture and Implementation

## Overview

Ask AI is an in-app AI stylist and commerce assistant that demonstrates Bridge to Agentia's core thesis: AI agents interact with the storefront exclusively through native WebMCP tools — not through direct API or database access. The assistant uses Google's Gemini API with native function calling to dynamically discover and invoke WebMCP tools, supplemented by browser-native Web Speech API capabilities for hands-free voice input and speech synthesis audio replies.

## Architecture

```
              ┌─────────────────────────┐
              │     User (Browser)      │
              └──────────┬──────────────┘
                         │ types message or speaks via mic
                         ▼
              ┌─────────────────────────┐
              │    Ask AI Panel (UI)    │
              │                         │
              │  • Chat history         │
              │  • Web Speech voice mic │
              │  • TTS audio playback   │
              │  • Mute / Stop controls │
              │  • Tool action badges   │
              │  • Confirmation prompts │
              │  • API key settings     │
              └──────────┬──────────────┘
                         │
                         ▼
              ┌─────────────────────────┐
              │   Agent Controller      │
              │                         │
              │  1. PromptGuard sanitize│ ← [USER_MESSAGE] delimiters & pattern defense
              │  2. Discover tools      │ ← webmcpRegistry.getRegisteredToolsInfo()
              │  3. Format for Gemini   │ ← toolFormatter.ts (auth tools filtered out)
              │  4. Call AI Backend     │ ──► /api/ai/chat (Server Proxy) or Gemini Direct
              │  5. Parse response      │
              │  6. Tool call?          │
              │     ├─ Yes: Confirm?    │ ← 6 destructive tools gated for confirmation
              │     │  Execute tool     │ ← webmcpRegistry.executeTool()
              │     │  Redact PII       │ ← responseRedactor.ts (mask email, redact address)
              │     │  Sanitize result  │ ← promptGuard.ts (neutralize indirect injection)
              │     │  Audit log        │ ← auditLog.ts (in-memory + /api/audit JSONL)
              │     │  Feed result back │
              │     │  Loop (≤10 iter)  │
              │     └─ No: Return text  │
              └──────────┬──────────────┘
                         │
              ┌──────────▼──────────────┐
              │    WebMCP Registry      │
              │    (34 Native Tools)    │
              │                         │
              │  • Schema validation    │
              │  • Auth enforcement     │
              │  • State gating         │
              │  • Same API calls       │
              └──────────┬──────────────┘
                         │ fetch()
              ┌──────────▼──────────────┐
              │   Same-Origin APIs      │
              │   Same Database         │
              │   Same Services         │
              └─────────────────────────┘
```

## Key Design Decisions

### WebMCP-Only Execution

The agent controller **never** calls backend APIs directly. Every action goes through `webmcpRegistry.executeTool()`, which enforces:
- Schema validation (required fields, types, constraints)
- Authentication requirements
- State-aware availability (e.g., `create_order` requires a populated cart)
- Structured error responses

This proves that the AI assistant uses the exact same tool interface as an external AI agent operating through `document.modelContext`.

### Dynamic Tool Discovery & Auth Isolation

Tools are discovered dynamically at each agent turn:

```typescript
const registeredTools = webmcpRegistry.getRegisteredToolsInfo();
const geminiTools = formatToolsForGemini(registeredTools);
```

- **Authentication Tool Isolation**: `login` and `register` are intentionally excluded from `formatToolsForGemini()`. The LLM has no capability to prompt for or process user credentials. If a guest asks to log in, the assistant instructs them to use the top-right "Sign In" button in the browser UI.
- **State-Aware Discovery**: Only tools with `status: 'AVAILABLE'` are presented to Gemini:
  - **Guest (Logged Out)**: 16 public tools (apparel discovery, sizing guides, catalog search, comparison, shipping estimates; auth hidden).
  - **Logged in, empty cart**: 33 tools (cart reads, mutations, wishlist, addresses, order history).
  - **Logged in, cart populated**: All 34 tools active (including `create_order`).

The AI does not hardcode tool availability — it discovers it reactively as user and session state changes.

### Voice & Speech Synthesis Engine

Ask AI features a full-duplex conversational voice system:
1. **Voice Input (Speech Recognition)**:
   - Uses native browser `SpeechRecognition` / `webkitSpeechRecognition`.
   - Real-time interim transcript display in the input box.
   - Optional `autoSendVoice` toggle: automatically submits the prompt upon speech completion.
2. **Audio Replies (Text-to-Speech)**:
   - Converts Gemini markdown responses into natural speech via `window.speechSynthesis`.
   - Markdown syntax, URLs, bullet points, and brackets are stripped prior to synthesis.
3. **Mute, Silence, and Safety Controls**:
   - **Instant Cancellation**: Toggling the Mute button immediately calls `window.speechSynthesis.cancel()` to silence playing audio on the spot.
   - **Synchronous `voiceReplyRef`**: A React ref guarantees async agent turns read the real-time mute state when responses arrive, preventing stale closure speech.
   - **Active Sound Wave Indicator**: When audio is playing, an animated sound wave banner displays above the input with a 1-click `[■ Stop Audio]` button.
   - **Auto-Silence on Close**: Closing the drawer (via click, button, or Escape key) immediately stops all audio.

### Confirmation Gates

Destructive, modifying, or transactional actions require explicit user confirmation before execution:
- `create_order` — demo order placement
- `cancel_order` — order cancellation
- `clear_cart` — cart emptying
- `logout` — session termination
- `update_shipping_address` — updating recipient/shipping details
- `remove_from_cart` — deleting items from cart

When Gemini attempts to call a gated tool, the controller pauses execution and yields a `requiresConfirmation` prompt. The UI renders a dedicated confirmation card with "✓ Confirm" and "✗ Cancel" buttons. Only after the user confirms does the tool execute.

### Dual-Layer AI Backend (Server Proxy & Client Fallback)

1. **Server-Side Proxy (`/api/ai/chat`)**: By default, requests route through the internal API endpoint where `GEMINI_API_KEY` is securely maintained in server environment variables.
2. **Client-Side Key Option**: Users can optionally supply their personal Gemini API key in the Ask AI settings drawer, which is stored in browser `localStorage` and sent directly to Google.

## File Structure

```
src/
├── app/api/
│   ├── ai/chat/route.ts      # Server-side Gemini API proxy (protects server API key)
│   └── audit/route.ts        # Server-side append-only JSONL audit log endpoint
├── lib/askai/
│   ├── types.ts              # TypeScript interfaces (ChatMessages, ToolAction, AgentConfig)
│   ├── toolFormatter.ts      # WebMCP → Gemini converter & auth tool isolation
│   ├── promptGuard.ts        # Prompt injection defense & boundary delimiter sanitization
│   ├── responseRedactor.ts   # PII redaction layer (email masking, address/phone stripping)
│   ├── auditLog.ts           # Dual-layer execution & injection audit logger
│   └── agentController.ts    # Multi-turn agentic loop orchestrator
├── components/askai/
│   ├── AskAIPanel.tsx        # Main drawer UI (chat, voice controls, audio banner, settings)
│   ├── ChatMessage.tsx       # Message bubble and confirmation card renderer
│   └── ToolActionBadge.tsx   # Visual status badge for WebMCP tool execution
└── styles/
    └── askai.css             # Luxury styling, sound wave animations, voice badges
```

## Tool Execution Flows

### 1. Apparel Discovery Flow (e.g., "Show red tops for women")
```
User: "Show red tops for women"
  → Agent discovers available public tools
  → Gemini selects filter_apparel({ gender: "female", color: "red", category: "tops" })
  → webmcpRegistry.executeTool("filter_apparel", { gender: "female", color: "red", category: "tops" })
  → Registry validates input → Calls /api/products?category=womens-tops&color=red
  → 10 matching luxury red tops returned to Gemini
  → Gemini summarizes: "I found 10 exquisite red tops in our women's collection, including the Crimson Silk Charmeuse Blouse..."
  → If voice replies are enabled: Text-to-Speech plays the summary aloud.
```

### 2. Sizing Reconciliation Flow (e.g., "What size fits a 36-inch bust?")
```
User: "What size fits a 36-inch bust in women's tops?"
  → Gemini selects get_apparel_size_guide({ department: "women", category: "tops" })
  → WebMCP registry returns the verified atelier sizing chart
  → Gemini determines: "For a 36-inch bust, size Medium (36-37 in) provides an elegant tailored fit..."
```

### 3. Visual Comparison Navigation Flow (e.g., "Compare these two shirts")
```
User: "Compare the Classic White Tee and the Midnight Blue Tee"
  → Gemini calls search_products({ query: "White Tee" }) → ID: "prod-tee-white"
  → Gemini calls search_products({ query: "Blue Tee" }) → ID: "prod-tee-blue"
  → Gemini calls view_comparison_page({ productIds: ["prod-tee-white", "prod-tee-blue"], view: "parallel" })
  → Tool dispatches "webmcp-navigation" event
  → Navigation listener executes router.push("/compare?ids=prod-tee-white,prod-tee-blue&view=parallel")
  → Storefront navigates to the side-by-side comparison matrix while Ask AI remains open
  → Gemini: "I've opened the parallel comparison matrix on your screen."
```

### 4. Authenticated Cart Addition Flow
```
User: "Add the Crimson Silk Blouse to my cart" (authenticated)
  → Gemini calls search_products({ query: "Crimson Silk Blouse" })
  → Resolves productId: "prod-top-red-1"
  → Gemini calls add_to_cart({ productId: "prod-top-red-1", quantity: 1 })
  → Registry validates session → Calls POST /api/cart
  → CartContext updates, cart drawer count updates, and create_order becomes available
  → Gemini: "Added the Crimson Silk Charmeuse Blouse to your bag."
```

### 5. Transactional Confirmation Flow (e.g., "Place my order")
```
User: "Place my demo order to 742 Evergreen Terrace"
  → Gemini calls create_order({ shippingAddress: { ... }, paymentMethod: "DEMO_CARD", confirmDemoOrder: true })
  → Controller pauses execution: triggers requiresConfirmation
  → UI displays: "I'm about to place a demo order for 1 item ($280.00)... Confirm?"
  → User clicks "✓ Confirm"
  → webmcpRegistry.executeTool("create_order", { ... })
  → Order placed in DB → Cart cleared → Gemini confirms order number ORD-XXXXXX
```

## State Awareness

The Ask AI assistant dynamically adapts its tool set based on the user's session:

| Session State | Available Tool Count | Capabilities |
|---------------|---------------------|--------------|
| Guest (Logged Out) | 16 tools (LLM) / 18 (Native) | Browse apparel, filter by color/gender, consult size charts, compare items, view shipping rates (auth tools isolated from LLM) |
| Authenticated, empty cart | 33 tools | All public tools + view cart, update wishlist, edit shipping addresses, inspect order history |
| Authenticated, cart populated | 34 tools | All tools active, including checkout order placement (`create_order`) |
| After order completion | 33 tools | Cart empties, `create_order` automatically gates until a new item is added |

## Security & Privacy Architecture

- **Auth Tool Isolation**: `login` and `register` tools are never declared to Gemini. The model cannot solicit, view, or submit credentials. Authentication is conducted solely by the user via the browser UI.
- **PII Response Redaction (`responseRedactor.ts`)**:
  - Automatically intercepts all tool results before they enter the model context.
  - Strips `phone`, `street`, `city`, `state`, `zipCode`, and `country` from address structures, replacing them with semantic labels (e.g. `[Saved Address #1]`).
  - Recursively masks email addresses (`u***@domain.com`) across arbitrary object and array depths.
  - Leaves catalog product information intact.
- **Prompt Injection Defense (`promptGuard.ts`)**:
  - Delimiter Encapsulation: Wraps user input in `[USER_MESSAGE]` and tool outputs in `[TOOL_RESULT]` boundary markers.
  - Pattern Detection: Blocks instruction overrides (`ignore previous rules`), role spoofing (`you are now a...`), system prompt extraction, data exfiltration, and delimiter forgery.
  - Indirect Injection Neutralization: Cleans untrusted product descriptions and user content returned from database queries.
- **Persistent Server-Side Audit Logging (`/api/audit`)**:
  - Dual-layer audit logger records execution duration, sanitized inputs, and status codes.
  - Asynchronously flushes records to persistent append-only JSONL files at `data/audit.log`.
  - Audits prompt injection attempts and blocked attacks with threat signatures.
- **API Key Protection**:
  - Primary mode uses server-side proxy (`/api/ai/chat`) with `GEMINI_API_KEY` stored securely in server environment variables.
  - Optional client-provided API key stored only in user's browser `localStorage`.
- **Strict WebMCP Validation**: Tool inputs are validated against strict JSON schemas before dispatch.
- **Server-Authoritative Enforcement**: API routes enforce authentication and database constraints regardless of whether invoked via UI or agent.
- **Controlled Audio Playback**: Audio speech synthesis can be cancelled instantly via mute or drawer dismiss with zero latency.
