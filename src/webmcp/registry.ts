import { JSONSchema, WebMCPTool, RegisteredToolInfo, ModelContextInterface, ToolExecutionResponse } from './types';

type NativeRegisterTool = (
  tool: Pick<WebMCPTool, 'name' | 'description' | 'inputSchema'> & { execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<unknown> },
  options?: { signal?: AbortSignal },
) => Promise<void> | void;

export class WebMCPRegistry {
  private tools: Map<string, WebMCPTool> = new Map();
  private isAuthenticated: boolean = false;
  private currentUser: any = null;
  private cartItemCount: number = 0;
  private listeners: Set<(tools: RegisteredToolInfo[]) => void> = new Set();
  private executionListeners: Set<(event: { toolName: string; input: any; result: any; timestamp: number }) => void> = new Set();
  private nativeRegisterToolFn: NativeRegisterTool | null = null;
  private nativeToolControllers: Map<string, AbortController> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.safeInit();
  }

  public safeInit() {
    if (this.isInitialized || typeof document === 'undefined') return;

    try {
      const self = this;

      // Check if native document.modelContext exists
      const existingContext = (document as any).modelContext;
      if (existingContext && typeof existingContext.registerTool === 'function' && !(existingContext as any).__isAgentBridgeWebMCP) {
        // Browser-provided WebMCP context. Never replace or redefine this object.
        this.nativeRegisterToolFn = existingContext.registerTool.bind(existingContext);
      }

      const modelContextImpl: ModelContextInterface & {
        __isAgentBridgeWebMCP?: boolean
      } = {
        __isAgentBridgeWebMCP: true,
        registerTool: (tool: WebMCPTool) => {
          self.registerTool(tool);
        },
        unregisterTool: (toolName: string) => {
          self.unregisterTool(toolName);
        },
        getTools: () => {
          return self.getRegisteredToolsInfo();
        },
        executeTool: (name: string, input: any) => {
          return self.executeTool(name, input);
        },
      };

      // A compatibility context is only useful in deterministic Node tests. Installing
      // one in a browser masks WebMCP availability and can collide with Chrome's
      // read-only native `document.modelContext` property.
      if (process.env.NODE_ENV === 'test' && !existingContext) {
        try {
          Object.defineProperty(document, 'modelContext', {
            value: modelContextImpl,
            writable: true,
            configurable: true,
          });
        } catch {
          // Test environments may provide a sealed document; registry tests can use
          // the registry directly in that case.
        }
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('[WebMCP] Safe initialization warning:', err);
    }
  }

  public initDocumentModelContext() {
    this.safeInit();
  }

  public registerTool(tool: WebMCPTool) {
    if (!tool || !tool.name) return;

    try {
      this.safeInit();
      this.tools.set(tool.name, tool);
      this.syncNativeTool(tool);

      this.notifyListeners();
    } catch (err) {
      console.warn(`[WebMCP] Failed to register tool "${tool?.name}":`, err);
    }
  }

  public unregisterTool(toolName: string) {
    this.nativeToolControllers.get(toolName)?.abort();
    this.nativeToolControllers.delete(toolName);
    this.tools.delete(toolName);
    this.notifyListeners();
  }

  public setAuthState(isAuthenticated: boolean, user: any = null) {
    this.isAuthenticated = isAuthenticated;
    this.currentUser = user;
    if (!isAuthenticated) this.cartItemCount = 0;
    this.tools.forEach((tool) => this.syncNativeTool(tool));
    this.notifyListeners();
  }

  public setCartItemCount(itemCount: number) {
    this.cartItemCount = Number.isFinite(itemCount) && itemCount > 0 ? Math.floor(itemCount) : 0;
    this.tools.forEach((tool) => this.syncNativeTool(tool));
    this.notifyListeners();
  }

  public getCartItemCount(): number {
    return this.cartItemCount;
  }

  public getAuthState(): { isAuthenticated: boolean; user: any } {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
    };
  }

  public getRegisteredToolsInfo(): RegisteredToolInfo[] {
    const list: RegisteredToolInfo[] = [];
    const toolsArray = Array.from(this.tools.values());
    for (const tool of toolsArray) {
      const isPublic = tool.permission === 'PUBLIC';
      const status = !isPublic && !this.isAuthenticated
        ? 'LOGIN_REQUIRED'
        : this.isToolStateAvailable(tool)
          ? 'AVAILABLE'
          : 'STATE_UNAVAILABLE';
      list.push({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        permission: tool.permission,
        availability: tool.availability,
        category: tool.category,
        status,
      });
    }
    return list;
  }

  public async executeTool(name: string, input: any): Promise<ToolExecutionResponse> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: 'TOOL_NOT_FOUND',
        message: `WebMCP tool "${name}" is not registered on this page.`,
        errorDetails: { code: 'TOOL_NOT_FOUND', message: `WebMCP tool "${name}" is not registered on this page.`, retryable: false },
      };
    }

    // Check Authentication
    if (tool.permission !== 'PUBLIC' && !this.isAuthenticated) {
      const authErrorResponse: ToolExecutionResponse = {
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        requiresAuthentication: true,
        message: `Authentication is required to execute "${name}". Please log in to your account.`,
        errorDetails: { code: 'AUTHENTICATION_REQUIRED', message: `Authentication is required to execute "${name}". Please log in to your account.`, retryable: false, userActionRequired: true },
      };
      this.notifyExecution(name, input, authErrorResponse);
      return authErrorResponse;
    }

    if (!this.isToolStateAvailable(tool)) {
      const stateErrorResponse: ToolExecutionResponse = {
        success: false,
        error: 'CART_EMPTY',
        message: `WebMCP tool "${name}" becomes available after the cart contains an item.`,
        errorDetails: { code: 'CART_EMPTY', message: `WebMCP tool "${name}" becomes available after the cart contains an item.`, retryable: false, userActionRequired: true },
      };
      this.notifyExecution(name, input, stateErrorResponse);
      return stateErrorResponse;
    }

    const inputError = validateInput(tool.inputSchema, input);
    if (inputError) {
      const invalidInput: ToolExecutionResponse = {
        success: false,
        error: 'INVALID_INPUT',
        message: inputError,
        errorDetails: { code: 'INVALID_INPUT', message: inputError, retryable: false, userActionRequired: true },
      };
      this.notifyExecution(name, input, invalidInput);
      return invalidInput;
    }

    try {
      const result = await tool.execute(input);
      this.updateCartStateFromResult(tool, result);
      this.notifyExecution(name, input, result);
      return result;
    } catch (err: any) {
      const errorResult: ToolExecutionResponse = {
        success: false,
        error: 'EXECUTION_ERROR',
        message: err?.message || 'An unexpected error occurred during tool execution.',
        errorDetails: { code: 'EXECUTION_ERROR', message: err?.message || 'An unexpected error occurred during tool execution.', retryable: true },
      };
      this.notifyExecution(name, input, errorResult);
      return errorResult;
    }
  }

  public subscribe(listener: (tools: RegisteredToolInfo[]) => void): () => void {
    this.listeners.add(listener);
    try {
      listener(this.getRegisteredToolsInfo());
    } catch (err) {
      console.error('Error executing initial WebMCP listener:', err);
    }
    return () => this.listeners.delete(listener);
  }

  public onExecution(listener: (event: { toolName: string; input: any; result: any; timestamp: number }) => void): () => void {
    this.executionListeners.add(listener);
    return () => this.executionListeners.delete(listener);
  }

  private notifyListeners() {
    const tools = this.getRegisteredToolsInfo();
    this.listeners.forEach((listener) => {
      try {
        listener(tools);
      } catch (err) {
        console.error('Error in WebMCP tool listener:', err);
      }
    });
  }

  private notifyExecution(toolName: string, input: any, result: any) {
    const event = { toolName, input, result, timestamp: Date.now() };
    this.executionListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in WebMCP execution listener:', err);
      }
    });
  }

  private syncNativeTool(tool: WebMCPTool) {
    if (!this.nativeRegisterToolFn) return;

    const isAvailable = (tool.permission === 'PUBLIC' || this.isAuthenticated) && this.isToolStateAvailable(tool);
    const existingController = this.nativeToolControllers.get(tool.name);
    if (!isAvailable) {
      existingController?.abort();
      this.nativeToolControllers.delete(tool.name);
      return;
    }

    if (existingController) return;

    const controller = new AbortController();
    this.nativeToolControllers.set(tool.name, controller);
    const nativeTool = {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: async (input: unknown, options?: { signal?: AbortSignal }) => {
        if (options?.signal?.aborted) {
          return {
            success: false,
            error: 'EXECUTION_CANCELLED',
            message: `WebMCP tool "${tool.name}" execution was cancelled.`,
          };
        }
        return this.executeTool(tool.name, input);
      },
    };

    Promise.resolve(this.nativeRegisterToolFn(nativeTool, { signal: controller.signal })).catch((nativeErr) => {
      this.nativeToolControllers.delete(tool.name);
      console.warn(`[WebMCP] Native tool registration for ${tool.name}:`, nativeErr);
    });
  }

  private isToolStateAvailable(tool: WebMCPTool): boolean {
    return tool.availability !== 'CART_POPULATED' || this.cartItemCount > 0;
  }

  private updateCartStateFromResult(tool: WebMCPTool, result: any) {
    if (!result?.success) return;
    if (typeof result.cart?.itemCount === 'number') {
      this.setCartItemCount(result.cart.itemCount);
      return;
    }
    if (typeof result.cartItemCount === 'number') {
      this.setCartItemCount(result.cartItemCount);
      return;
    }
    if (tool.name === 'create_order' || tool.name === 'clear_cart') {
      this.setCartItemCount(0);
    }
  }
}

function validateInput(schema: JSONSchema, input: unknown): string | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Tool input must be a JSON object.';
  const values = input as Record<string, unknown>;
  for (const required of schema.required || []) {
    if (values[required] === undefined || values[required] === null || values[required] === '') return `Missing required parameter: ${required}.`;
  }
  for (const [key, value] of Object.entries(values)) {
    const property = schema.properties[key];
    if (!property || value === undefined) continue;
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    // Accept 'number' for 'integer' type (JavaScript has no integer primitive)
    if (property.type === 'integer') {
      if (actualType !== 'number' || !Number.isInteger(value)) return `Invalid parameter ${key}: expected integer.`;
    } else if (actualType !== property.type) {
      return `Invalid parameter ${key}: expected ${property.type}.`;
    }
    if (property.enum && !property.enum.includes(value as string)) return `Invalid parameter ${key}: unsupported value.`;
    if (typeof value === 'number') {
      if (property.minimum !== undefined && value < property.minimum) return `Invalid parameter ${key}: must be at least ${property.minimum}.`;
      if (property.maximum !== undefined && value > property.maximum) return `Invalid parameter ${key}: must be at most ${property.maximum}.`;
    }
  }
  return null;
}

export const webmcpRegistry = new WebMCPRegistry();
