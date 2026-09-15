import { ToolExecutionTrace } from '../types';

export interface DirectExecutionTarget {
  getAuthState(): { isAuthenticated: boolean };
  executeTool(name: string, input: unknown): Promise<any>;
}

/** Deterministic harness for a registry or native WebMCP adapter. */
export async function executeWithTrace(
  target: DirectExecutionTarget,
  toolName: string,
  input: unknown,
  stateName: (authenticated: boolean) => string = (authenticated) => authenticated ? 'authenticated' : 'guest',
): Promise<ToolExecutionTrace> {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const stateBefore = stateName(target.getAuthState().isAuthenticated);
  const output = await target.executeTool(toolName, input);
  const stateAfter = stateName(target.getAuthState().isAuthenticated);
  return { toolName, input, output, durationMs: Number((performance.now() - started).toFixed(2)), startedAt, stateBefore, stateAfter };
}
