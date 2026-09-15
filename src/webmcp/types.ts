export type ToolPermission = 'PUBLIC' | 'AUTHENTICATED' | 'TRANSACTIONAL';
export type ToolAvailability = 'ALWAYS' | 'CART_POPULATED';

export interface JSONSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: {
    type: string;
    description?: string;
  };
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface WebMCPTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  permission: ToolPermission;
  availability?: ToolAvailability;
  category: 'Products' | 'Cart' | 'Wishlist' | 'Orders' | 'Promotions' | 'Shipping' | 'Account' | 'Auth' | 'Navigation' | 'Apparel';
  execute: (input: TInput) => Promise<TOutput>;
}

export interface ToolExecutionResponse<T = any> {
  success: boolean;
  requiresAuthentication?: boolean;
  error?: string;
  errorDetails?: {
    code: string;
    message: string;
    retryable: boolean;
    userActionRequired?: boolean;
  };
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ToolExecutionTrace {
  toolName: string;
  input: unknown;
  output: ToolExecutionResponse;
  durationMs: number;
  startedAt: string;
  stateBefore: string;
  stateAfter: string;
}

export interface RegisteredToolInfo {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  permission: ToolPermission;
  availability?: ToolAvailability;
  category: string;
  status: 'AVAILABLE' | 'LOGIN_REQUIRED' | 'STATE_UNAVAILABLE';
}

export interface ModelContextInterface {
  registerTool: (tool: WebMCPTool) => void;
  unregisterTool: (toolName: string) => void;
  getTools: () => RegisteredToolInfo[];
  executeTool: (name: string, input: any) => Promise<any>;
}

declare global {
  interface Document {
    modelContext?: ModelContextInterface;
  }
}
