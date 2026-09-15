# Evaluation Methodology

## Overview

The Bridge to Agentia evaluation framework measures how effectively AI agents can discover, select, and invoke WebMCP tools to complete e-commerce tasks. Evaluations are organized into two categories: deterministic validation (schema compliance and contract verification) and probabilistic assessment (LLM planning accuracy).

## Deterministic Evaluations

### Schema Validation

**Command:** `npm run eval:webmcp`

Validates that all 16 evaluation case JSON files conform to the required structure:

- Each case declares `id`, `userPrompt`, `initialState`, `availableTools`, and `expectedCalls`
- Tool names referenced in `availableTools` and `expectedCalls` correspond to registered tools
- Expected call arguments use runtime placeholders (`${...}`) rather than hardcoded catalog values

**Pass criterion:** All 16 cases must validate successfully.

### Tool Contract Tests

**Command:** `npm test`

Validates that every tool adheres to its declared contract:

- Calls the correct API endpoint with the correct HTTP method
- Encodes query parameters and request bodies correctly
- Returns structured responses preserving the API's payload
- Handles failures with appropriate error codes and retry semantics

**Pass criterion:** All 90 deterministic tests must pass.

## Probabilistic Evaluations

### LLM Tool Planning

**Command:** `npm run eval:webmcp:llm`

Each evaluation case is sent to an LLM provider. The model receives the user prompt, the list of available tools, and the initial application state, and returns a planned sequence of tool calls. The framework scores the plan against the expected calls without executing any tools.

### Metrics

| Metric | Definition |
|--------|-----------|
| **Tool Selection Accuracy** | Proportion of cases where the model selected the correct set of tools (order-independent) |
| **Argument Accuracy** | Proportion of expected arguments correctly provided across all calls |
| **Chain Accuracy** | Proportion of cases where the model produced the correct sequence of calls (order-dependent) |
| **Recovery Accuracy** | Proportion of cases where the model correctly avoided invoking unavailable tools |
| **Average Latency** | Mean response time per evaluation case |

### Provider Abstraction

The framework supports multiple LLM providers through the `LLMProvider` interface defined in `scripts/llmProviders.ts`:

```typescript
interface LLMProvider {
  name: string;
  planCase(evaluation: EvalCase): Promise<PlanResult>;
}
```

| Provider | Activation | Purpose |
|----------|-----------|---------|
| `OpenAIProvider` | `OPENAI_API_KEY` present or `WEBMCP_EVAL_PROVIDER=openai` | Production evaluation via OpenAI Responses API |
| `MockProvider` | No API key or `WEBMCP_EVAL_PROVIDER=mock` | Deterministic responses for CI and evaluator testing |

### Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `OPENAI_API_KEY` | API key for the OpenAI provider | — |
| `WEBMCP_EVAL_MODEL` | Model identifier for evaluation | `gpt-5.6-luna` |
| `WEBMCP_EVAL_RUNS` | Repetitions per case for variance reduction | `3` |
| `WEBMCP_EVAL_PROVIDER` | Explicit provider selection override | Auto-detect |

## Evaluation Cases

### Category Distribution

| Category | Cases | Purpose |
|----------|-------|---------|
| `direct/` | 1 | Single-tool invocation |
| `tool_selection/` | 1 | Correct tool identification for a given intent |
| `arguments/` | 2 | Correct parameter generation and identifier handling |
| `e2e/` | 5 | Multi-step journey completion (Journeys A–D) |
| `ordered_chains/` | 1 | Correct execution ordering within a chain |
| `unordered_chains/` | 1 | Parallel-safe tool selection |
| `mid_chain/` | 1 | Mid-journey failure handling and recovery |
| `failure_modes/` | 3 | Edge case handling and constraint enforcement |
| `ambiguous/` | 1 | Ambiguous user intent resolution |

### Case Structure

```json
{
  "id": "unique-case-identifier",
  "userPrompt": "Natural language customer request",
  "initialState": "Description of starting conditions",
  "availableTools": ["tool_name_1", "tool_name_2"],
  "expectedCalls": [
    {
      "functionName": "tool_name",
      "arguments": { "key": "${placeholder}" }
    }
  ],
  "expectNoToolCall": false
}
```

### Runtime Placeholders

Evaluation cases use `${...}` placeholders for values that depend on runtime data:

| Placeholder | Represents |
|------------|-----------|
| `${criteria}` | Search terms derived from user intent |
| `${resolvedProductId}` | Product ID obtained from a prior search result |
| `${cartItemProductId}` | Product ID currently in the cart |
| `${userEmail}`, `${userPassword}` | User credentials |
| `${fullName}`, `${street}`, `${city}`, `${state}`, `${zipCode}` | Shipping address fields |

Cases must never contain production SKUs, prices, brand names, or category identifiers.

## Output

Evaluation results are written to `eval-results/` (git-ignored):

| File | Contents |
|------|----------|
| `summary.json` | Schema validation results |
| `llm-results.json` | LLM planning metrics and per-case scores |
| `detailed-results.json` | Combined deterministic and evaluation report |
| `report.md` | Human-readable summary |
