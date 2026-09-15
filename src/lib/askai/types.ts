/** Types for the Ask AI agent controller and UI. */

/** Configuration for the Gemini API connection. */
export interface AgentConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export const DEFAULT_AGENT_CONFIG: Omit<AgentConfig, 'apiKey'> = {
  model: 'gemini-2.0-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
};

/** A single message in the conversation. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'tool-result';
  content: string;
  toolActions?: ToolAction[];
  requiresConfirmation?: ConfirmationRequest;
  timestamp: number;
}

/** Represents a single tool call made by the agent. */
export interface ToolAction {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'awaiting-confirmation';
  result?: unknown;
  error?: string;
}

/** A confirmation request for destructive actions. */
export interface ConfirmationRequest {
  toolName: string;
  toolArgs: Record<string, unknown>;
  description: string;
}

/** The result of an agent run (returned to the UI). */
export interface AgentResponse {
  message: string;
  toolActions: ToolAction[];
  requiresConfirmation?: ConfirmationRequest;
}

/** Gemini API content part. */
export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

/** Gemini API content entry. */
export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/** Gemini function declaration (tool schema). */
export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}
