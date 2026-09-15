/**
 * LLM provider abstraction for WebMCP evaluation.
 * Supports OpenAI, mock (deterministic), and extensible custom providers.
 */

export interface PlannedCall {
  functionName?: string;
  arguments?: Record<string, unknown>;
}

export interface PlanResult {
  calls: PlannedCall[];
  latencyMs: number;
}

export interface EvalCase {
  id: string;
  userPrompt: string;
  initialState: string;
  availableTools: string[];
  expectedCalls: Array<{
    functionName?: string;
    arguments?: Record<string, unknown>;
    unordered?: { ordered?: Array<{ functionName?: string; arguments?: Record<string, unknown> }> }[];
  }>;
  expectNoToolCall?: boolean;
}

export interface LLMProvider {
  name: string;
  planCase(evaluation: EvalCase): Promise<PlanResult>;
}

// --- OpenAI Provider ---

export class OpenAIProvider implements LLMProvider {
  name: string;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-5.6-luna') {
    this.apiKey = apiKey;
    this.model = model;
    this.name = `openai/${model}`;
  }

  async planCase(evaluation: EvalCase): Promise<PlanResult> {
    const started = performance.now();
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        store: false,
        input:
          'You are evaluating tool-planning only. Do not invent IDs, product facts, or unavailable tools. ' +
          'Return JSON only: {"calls":[{"functionName":"...","arguments":{}}],"recovery":"..."}.\n' +
          `Initial state: ${evaluation.initialState}\n` +
          `Available tools: ${JSON.stringify(evaluation.availableTools)}\n` +
          `Customer request: ${evaluation.userPrompt}`,
        text: { format: { type: 'json_object' } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI Responses API returned ${response.status}.`);
    const payload = (await response.json()) as { output_text?: string };
    const planned = JSON.parse(payload.output_text || '{}') as { calls?: PlannedCall[] };
    return {
      calls: Array.isArray(planned.calls) ? planned.calls : [],
      latencyMs: Number((performance.now() - started).toFixed(2)),
    };
  }
}

// --- Mock Provider (deterministic, for testing the evaluator itself) ---

export class MockProvider implements LLMProvider {
  name = 'mock/deterministic';
  private responses: Map<string, PlannedCall[]>;

  constructor(responses?: Record<string, PlannedCall[]>) {
    this.responses = new Map(Object.entries(responses || {}));
  }

  /** Register a canned response for a specific eval case ID. */
  setResponse(caseId: string, calls: PlannedCall[]) {
    this.responses.set(caseId, calls);
  }

  async planCase(evaluation: EvalCase): Promise<PlanResult> {
    const started = performance.now();
    const calls = this.responses.get(evaluation.id) || [];
    // Simulate a small latency
    await new Promise((resolve) => setTimeout(resolve, 5));
    return {
      calls,
      latencyMs: Number((performance.now() - started).toFixed(2)),
    };
  }
}

// --- Provider Factory ---

export function createProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.WEBMCP_EVAL_MODEL || 'gpt-5.6-luna';
  const providerType = process.env.WEBMCP_EVAL_PROVIDER || (apiKey ? 'openai' : 'mock');

  switch (providerType) {
    case 'openai':
      if (!apiKey) throw new Error('OPENAI_API_KEY is required for the OpenAI provider.');
      return new OpenAIProvider(apiKey, model);
    case 'mock':
      return new MockProvider();
    default:
      throw new Error(`Unknown provider type: ${providerType}. Supported: openai, mock.`);
  }
}
