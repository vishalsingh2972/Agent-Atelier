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
  webmcpTools.forEach((tool) => registry.registerTool(tool));
  return registry;
}

describe('WebMCP multi-step journey: search → inspect → add to cart → view cart', () => {
  it('completes Journey A: find → inspect → add → view cart', async () => {
    const registry = createAuthenticatedRegistry();

    // Step 1: Search products
    mockFetch({ success: true, products: [{ id: 'prod-1', name: 'Test Laptop', price: 999 }] });
    const searchResult = await registry.executeTool('search_products', { query: 'laptop' });
    expect(searchResult.success).toBe(true);

    // Step 2: Get product details
    mockFetch({ success: true, product: { id: 'prod-1', name: 'Test Laptop', price: 999, stock: 5, specifications: {} } });
    const detailResult = await registry.executeTool('get_product_details', { productId: 'prod-1' });
    expect(detailResult.success).toBe(true);

    // Step 3: Add to cart (updates cart state)
    mockFetch({ success: true, cart: { itemCount: 1, items: [{ productId: 'prod-1', quantity: 1 }] }, cartItemCount: 1 });
    const addResult = await registry.executeTool('add_to_cart', { productId: 'prod-1', quantity: 1 });
    expect(addResult.success).toBe(true);

    // Step 4: View cart
    mockFetch({ success: true, itemCount: 1, items: [{ productId: 'prod-1', quantity: 1 }], subtotal: 999 });
    const cartResult = await registry.executeTool('get_cart', {});
    expect(cartResult.success).toBe(true);
  });
});

describe('WebMCP multi-step journey: search → compare → select → add → update → view', () => {
  it('completes Journey B: compare products and manage cart quantities', async () => {
    const registry = createAuthenticatedRegistry();

    // Step 1: Search
    mockFetch({ success: true, products: [{ id: 'p1', name: 'Product A' }, { id: 'p2', name: 'Product B' }] });
    const searchResult = await registry.executeTool('search_products', { query: 'monitor' });
    expect(searchResult.success).toBe(true);

    // Step 2: Compare
    mockFetch({ success: true, products: [{ id: 'p1' }, { id: 'p2' }] });
    const compareResult = await registry.executeTool('compare_products', { productIds: ['p1', 'p2'] });
    expect(compareResult.success).toBe(true);

    // Step 3: Add chosen product
    mockFetch({ success: true, cartItemCount: 1, cart: { itemCount: 1 } });
    const addResult = await registry.executeTool('add_to_cart', { productId: 'p1', quantity: 1 });
    expect(addResult.success).toBe(true);

    // Step 4: Update quantity
    mockFetch({ success: true, cartItemCount: 3, cart: { itemCount: 3 } });
    const updateResult = await registry.executeTool('update_cart_quantity', { productId: 'p1', quantity: 3 });
    expect(updateResult.success).toBe(true);

    // Step 5: View cart
    mockFetch({ success: true, itemCount: 3 });
    const cartResult = await registry.executeTool('get_cart', {});
    expect(cartResult.success).toBe(true);
  });
});

describe('WebMCP multi-step journey: auth barrier → login → protected operation', () => {
  it('completes Journey C: detect auth requirement → login → retry', async () => {
    const registry = new WebMCPRegistry();
    webmcpTools.forEach((tool) => registry.registerTool(tool));

    // Step 1: Attempt protected operation while logged out
    const blockedResult = await registry.executeTool('get_cart', {});
    expect(blockedResult.success).toBe(false);
    expect(blockedResult.error).toBe('AUTHENTICATION_REQUIRED');
    expect(blockedResult.requiresAuthentication).toBe(true);

    // Step 2: Agent detects auth is required and logs in
    // In a real browser, loginTool.execute updates the global singleton.
    // In this unit test, we simulate the auth state change on the local registry.
    mockFetch({ success: true, user: { id: 'u1', name: 'Demo User' } });
    const loginResult = await registry.executeTool('login', { email: 'demo@agentbridge.io', password: 'pass' });
    expect(loginResult.success).toBe(true);
    // Simulate the auth state update that loginTool applies to the global registry
    registry.setAuthState(true, loginResult.user);

    // Step 3: Retry protected operation (now authenticated)
    mockFetch({ success: true, itemCount: 0, items: [] });
    const cartResult = await registry.executeTool('get_cart', {});
    expect(cartResult.success).toBe(true);
  });
});

describe('WebMCP multi-step journey: cart → add → verify → checkout', () => {
  it('completes Journey D: add product → verify cart → create demo order', async () => {
    const registry = createAuthenticatedRegistry();

    // Step 1: Search for product
    mockFetch({ success: true, products: [{ id: 'prod-x', name: 'Demo Product' }] });
    const searchResult = await registry.executeTool('search_products', { query: 'demo' });
    expect(searchResult.success).toBe(true);

    // Step 2: Add to cart (triggers cart populated state)
    mockFetch({ success: true, cartItemCount: 1, cart: { itemCount: 1 } });
    const addResult = await registry.executeTool('add_to_cart', { productId: 'prod-x', quantity: 1 });
    expect(addResult.success).toBe(true);

    // Step 3: Verify create_order is now available
    const tools = registry.getRegisteredToolsInfo();
    const orderTool = tools.find((t) => t.name === 'create_order');
    expect(orderTool?.status).toBe('AVAILABLE');

    // Step 4: Create order
    mockFetch({ success: true, orderNumber: 'ORD-123456', status: 'PROCESSING', cart: { itemCount: 0 } });
    const orderResult = await registry.executeTool('create_order', {
      fullName: 'Test User', street: '123 Test St', city: 'TestCity',
      state: 'TS', zipCode: '12345', confirmDemoOrder: true,
    });
    expect(orderResult.success).toBe(true);
  });
});

describe('WebMCP state-aware tool availability transitions', () => {
  it('tracks all state transitions: guest → login → add items → checkout → logout', async () => {
    const registry = new WebMCPRegistry();
    webmcpTools.forEach((tool) => registry.registerTool(tool));

    // Guest: protected tools are LOGIN_REQUIRED
    let tools = registry.getRegisteredToolsInfo();
    expect(tools.find((t) => t.name === 'add_to_cart')?.status).toBe('LOGIN_REQUIRED');
    expect(tools.find((t) => t.name === 'create_order')?.status).toBe('LOGIN_REQUIRED');
    expect(tools.find((t) => t.name === 'search_products')?.status).toBe('AVAILABLE');

    // Login: protected tools become AVAILABLE (except cart-populated ones)
    registry.setAuthState(true, { id: 'test-user' });
    tools = registry.getRegisteredToolsInfo();
    expect(tools.find((t) => t.name === 'add_to_cart')?.status).toBe('AVAILABLE');
    expect(tools.find((t) => t.name === 'create_order')?.status).toBe('STATE_UNAVAILABLE');

    // Add to cart: create_order becomes AVAILABLE
    registry.setCartItemCount(2);
    tools = registry.getRegisteredToolsInfo();
    expect(tools.find((t) => t.name === 'create_order')?.status).toBe('AVAILABLE');

    // Clear cart: create_order becomes STATE_UNAVAILABLE
    registry.setCartItemCount(0);
    tools = registry.getRegisteredToolsInfo();
    expect(tools.find((t) => t.name === 'create_order')?.status).toBe('STATE_UNAVAILABLE');

    // Logout: protected tools return to LOGIN_REQUIRED
    registry.setAuthState(false, null);
    tools = registry.getRegisteredToolsInfo();
    expect(tools.find((t) => t.name === 'add_to_cart')?.status).toBe('LOGIN_REQUIRED');
    expect(tools.find((t) => t.name === 'login')?.status).toBe('AVAILABLE');
  });
});
