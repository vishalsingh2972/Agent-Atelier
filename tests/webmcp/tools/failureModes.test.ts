import { describe, expect, it, vi, afterEach } from 'vitest';
import { WebMCPRegistry } from '../../../src/webmcp/registry';
import { webmcpTools } from '../../../src/webmcp';

const success = { success: true, data: { resolvedAtRuntime: true } };

function mockFetch(payload: unknown = success) {
  const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(payload) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

function createAuthenticatedRegistry(): WebMCPRegistry {
  const registry = new WebMCPRegistry();
  registry.setAuthState(true, { id: 'test-user', name: 'Test User' });
  registry.setCartItemCount(1);
  webmcpTools.forEach((tool) => registry.registerTool(tool));
  return registry;
}

describe('WebMCP failure mode: wrong execution order', () => {
  it('rejects create_order when cart is empty', async () => {
    const registry = new WebMCPRegistry();
    registry.setAuthState(true, { id: 'test-user' });
    webmcpTools.forEach((tool) => registry.registerTool(tool));

    const result = await registry.executeTool('create_order', {
      fullName: 'Test', street: '123 St', city: 'City',
      state: 'ST', zipCode: '12345', confirmDemoOrder: true,
    });
    expect(result.success).toBe(false);
    expect(result.errorDetails?.code).toBe('CART_EMPTY');
    expect(result.errorDetails?.userActionRequired).toBe(true);
  });

  it('rejects protected tool before login', async () => {
    const registry = new WebMCPRegistry();
    webmcpTools.forEach((tool) => registry.registerTool(tool));

    const result = await registry.executeTool('add_to_cart', { productId: 'any-id', quantity: 1 });
    expect(result.success).toBe(false);
    expect(result.errorDetails?.code).toBe('AUTHENTICATION_REQUIRED');
  });
});

describe('WebMCP failure mode: wrong arguments', () => {
  it('rejects negative quantity for add_to_cart', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('add_to_cart', { productId: 'prod-1', quantity: -5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('at least 1');
  });

  it('rejects zero quantity for add_to_cart', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('add_to_cart', { productId: 'prod-1', quantity: 0 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('at least 1');
  });

  it('rejects non-integer quantity for add_to_cart', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('add_to_cart', { productId: 'prod-1', quantity: 2.5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('integer');
  });

  it('rejects invalid sortBy enum value', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('sort_products', { sortBy: 'invalid_sort' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('unsupported value');
  });

  it('rejects non-object input', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('search_products', 'not an object' as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
  });

  it('rejects array input', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('search_products', ['array'] as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
  });
});

describe('WebMCP failure mode: missing required data', () => {
  it('rejects search_products without query', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('search_products', {});
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('query');
  });

  it('rejects add_to_cart without productId', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('add_to_cart', { quantity: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('productId');
  });

  it('rejects create_order without required address fields', async () => {
    const registry = createAuthenticatedRegistry();
    const result = await registry.executeTool('create_order', { confirmDemoOrder: true });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('fullName');
  });

  it('rejects login without email', async () => {
    const registry = new WebMCPRegistry();
    webmcpTools.forEach((tool) => registry.registerTool(tool));
    const result = await registry.executeTool('login', { password: 'pass' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
    expect(result.message).toContain('email');
  });
});

describe('WebMCP failure mode: tool not found', () => {
  it('returns structured error for nonexistent tool', async () => {
    const registry = new WebMCPRegistry();
    const result = await registry.executeTool('nonexistent_tool', {});
    expect(result.success).toBe(false);
    expect(result.errorDetails?.code).toBe('TOOL_NOT_FOUND');
    expect(result.errorDetails?.retryable).toBe(false);
  });
});

describe('WebMCP failure mode: runtime/network failure', () => {
  it('returns structured EXECUTION_ERROR when fetch throws', async () => {
    const registry = createAuthenticatedRegistry();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
    const result = await registry.executeTool('search_products', { query: 'test' });
    expect(result.success).toBe(false);
    expect(result.errorDetails?.code).toBe('EXECUTION_ERROR');
    expect(result.errorDetails?.retryable).toBe(true);
    expect(result.errorDetails?.message).toContain('Network unavailable');
  });

  it('returns structured EXECUTION_ERROR for all tool categories on network failure', async () => {
    const registry = createAuthenticatedRegistry();
    const toolsToTest = ['search_products', 'get_cart', 'get_wishlist', 'get_order_history'];
    for (const toolName of toolsToTest) {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
      const result = await registry.executeTool(toolName, toolName === 'search_products' ? { query: 'test' } : {});
      expect(result.errorDetails?.code).toBe('EXECUTION_ERROR');
      expect(result.errorDetails?.retryable).toBe(true);
    }
  });
});

describe('WebMCP failure mode: mid-chain failure', () => {
  it('search succeeds but add_to_cart fails from API business error', async () => {
    const registry = createAuthenticatedRegistry();

    // Step 1: Search succeeds
    mockFetch({ success: true, products: [{ id: 'prod-1', name: 'Test' }] });
    const searchResult = await registry.executeTool('search_products', { query: 'test' });
    expect(searchResult.success).toBe(true);

    // Step 2: Add to cart fails (out of stock)
    mockFetch({ success: false, error: 'INSUFFICIENT_STOCK', message: 'Only 0 items remaining in stock.' });
    const addResult = await registry.executeTool('add_to_cart', { productId: 'prod-1', quantity: 1 });
    expect(addResult.success).toBe(false);
    expect(addResult.error).toBe('INSUFFICIENT_STOCK');
  });

  it('add to cart succeeds but update quantity fails', async () => {
    const registry = createAuthenticatedRegistry();

    // Step 1: Add to cart succeeds
    mockFetch({ success: true, cartItemCount: 1, cart: { itemCount: 1 } });
    const addResult = await registry.executeTool('add_to_cart', { productId: 'prod-1', quantity: 1 });
    expect(addResult.success).toBe(true);

    // Step 2: Update quantity fails (exceeds stock)
    mockFetch({ success: false, error: 'EXCEEDS_STOCK', message: 'Cannot add 100 more.' });
    const updateResult = await registry.executeTool('update_cart_quantity', { productId: 'prod-1', quantity: 100 });
    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toBe('EXCEEDS_STOCK');
  });

  it('cart populated but order fails due to coupon validation', async () => {
    const registry = createAuthenticatedRegistry();

    // Order attempt with invalid coupon — API returns error
    mockFetch({ success: false, error: 'INVALID_COUPON', message: 'Coupon code not found.' });
    const orderResult = await registry.executeTool('create_order', {
      fullName: 'Test', street: '123 St', city: 'City',
      state: 'ST', zipCode: '12345', couponCode: 'INVALID', confirmDemoOrder: true,
    });
    expect(orderResult.success).toBe(false);
  });
});
