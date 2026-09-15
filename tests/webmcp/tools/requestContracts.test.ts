import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkProductStockTool, compareProductsTool, filterProductsTool, getAvailableProductVariantsTool,
  getCurrentPromotionsTool, getProductDetailsTool, getProductRecommendationsTool, searchProductsTool, sortProductsTool,
} from '../../../src/webmcp/tools/productTools';
import { addToCartTool, applyCouponTool, clearCartTool, getCartTool, removeFromCartTool, updateCartQuantityTool } from '../../../src/webmcp/tools/cartTools';
import { addToWishlistTool, getWishlistTool, removeFromWishlistTool } from '../../../src/webmcp/tools/wishlistTools';
import { cancelOrderTool, createOrderTool, getOrderDetailsTool, getOrderHistoryTool } from '../../../src/webmcp/tools/orderTools';
import { getSavedAddressesTool, getShippingEstimateTool, updateShippingAddressTool } from '../../../src/webmcp/tools/shippingTools';
import { WebMCPRegistry } from '../../../src/webmcp/registry';

const success = { success: true, data: { resolvedAtRuntime: true } };
const failed = { success: false, error: 'SERVICE_UNAVAILABLE', message: 'Temporary failure.' };

function mockFetch(payload: unknown = success) {
  const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(payload) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function expectRequest(fetchMock: ReturnType<typeof mockFetch>, url: string, method = 'GET', body?: unknown) {
  expect(fetchMock).toHaveBeenCalledOnce();
  const [actualUrl, options] = fetchMock.mock.calls[0];
  expect(actualUrl).toBe(url);
  expect(options?.method || 'GET').toBe(method);
  if (body !== undefined) expect(JSON.parse(options.body)).toEqual(body);
}

afterEach(() => vi.unstubAllGlobals());

const toolInputs = [
  [searchProductsTool, { query: 'criteria' }],
  [getProductDetailsTool, { productId: 'runtime-id' }],
  [filterProductsTool, {}],
  [sortProductsTool, { sortBy: 'price_asc' }],
  [getProductRecommendationsTool, {}],
  [compareProductsTool, { productIds: ['first-id', 'second-id'] }],
  [checkProductStockTool, { productId: 'runtime-id' }],
  [getCurrentPromotionsTool, {}],
  [getAvailableProductVariantsTool, { productId: 'runtime-id' }],
  [addToCartTool, { productId: 'runtime-id', quantity: 1 }],
  [getCartTool, {}],
  [updateCartQuantityTool, { productId: 'runtime-id', quantity: 1 }],
  [removeFromCartTool, { productId: 'runtime-id' }],
  [clearCartTool, {}],
  [applyCouponTool, { code: 'USER_SUPPLIED_CODE' }],
  [addToWishlistTool, { productId: 'runtime-id' }],
  [removeFromWishlistTool, { productId: 'runtime-id' }],
  [getWishlistTool, {}],
  [getOrderHistoryTool, {}],
  [getOrderDetailsTool, { orderId: 'runtime-order' }],
  [cancelOrderTool, { orderId: 'runtime-order' }],
  [createOrderTool, { fullName: 'recipient', street: 'street', city: 'city', state: 'state', zipCode: 'postal-code', confirmDemoOrder: true }],
  [getShippingEstimateTool, { zipCode: 'postal-code' }],
  [getSavedAddressesTool, {}],
  [updateShippingAddressTool, { fullName: 'recipient', street: 'street', city: 'city', state: 'state', zipCode: 'postal-code' }],
] as const;

describe('WebMCP public tool request contracts', () => {
  it('searches and filters with encoded query parameters', async () => {
    let fetchMock = mockFetch();
    await expect(searchProductsTool.execute({ query: 'portable device', limit: 3 })).resolves.toEqual(success);
    expectRequest(fetchMock, '/api/products?q=portable%20device&limit=3');

    fetchMock = mockFetch();
    await filterProductsTool.execute({ category: 'category', brand: 'brand', minPrice: 1, maxPrice: 2, minRating: 4, inStockOnly: true, limit: 5 });
    expectRequest(fetchMock, '/api/products?category=category&brand=brand&minPrice=1&maxPrice=2&minRating=4&inStock=true&limit=5');
  });

  it('uses resolved identifiers for product detail, comparison, stock, and variants', async () => {
    const id = 'resolved/product id';
    let fetchMock = mockFetch();
    await getProductDetailsTool.execute({ productId: id });
    expectRequest(fetchMock, '/api/products/resolved%2Fproduct%20id');

    fetchMock = mockFetch();
    await compareProductsTool.execute({ productIds: ['id-a', 'id-b'] });
    expectRequest(fetchMock, '/api/products/compare?ids=id-a%2Cid-b');

    fetchMock = mockFetch({ success: true, product: { id: 'resolved-id', name: 'Resolved product', stock: 1 } });
    await expect(checkProductStockTool.execute({ productId: 'resolved-id' })).resolves.toMatchObject({ status: 'LOW_STOCK', inStock: true });
    expectRequest(fetchMock, '/api/products/resolved-id');

    fetchMock = mockFetch(failed);
    await expect(getAvailableProductVariantsTool.execute({ productId: 'unresolved-id' })).resolves.toEqual(failed);
    expectRequest(fetchMock, '/api/products/unresolved-id');
  });

  it('uses catalog endpoints for sort, recommendations, and promotions', async () => {
    let fetchMock = mockFetch();
    await sortProductsTool.execute({ sortBy: 'price_asc', category: 'category', query: 'criteria', limit: 2 });
    expectRequest(fetchMock, '/api/products?sort=price_asc&limit=2&category=category&q=criteria');

    fetchMock = mockFetch();
    await getProductRecommendationsTool.execute({ productId: 'resolved-id', category: 'category', limit: 2 });
    expectRequest(fetchMock, '/api/products/recommendations?limit=2&productId=resolved-id&category=category');

    fetchMock = mockFetch();
    await getCurrentPromotionsTool.execute({});
    expectRequest(fetchMock, '/api/products/promotions');
  });
});

describe('WebMCP state-changing tool request contracts', () => {
  it('maps all cart operations to explicit API methods and bodies', async () => {
    let fetchMock = mockFetch();
    await addToCartTool.execute({ productId: 'resolved-id', quantity: 2 });
    expectRequest(fetchMock, '/api/cart', 'POST', { productId: 'resolved-id', quantity: 2 });

    fetchMock = mockFetch();
    await updateCartQuantityTool.execute({ productId: 'resolved-id', quantity: 3 });
    expectRequest(fetchMock, '/api/cart', 'PUT', { productId: 'resolved-id', quantity: 3 });

    fetchMock = mockFetch();
    await removeFromCartTool.execute({ productId: 'resolved/id' });
    expectRequest(fetchMock, '/api/cart?productId=resolved%2Fid', 'DELETE');

    fetchMock = mockFetch();
    await clearCartTool.execute({});
    expectRequest(fetchMock, '/api/cart?clear=true', 'DELETE');

    fetchMock = mockFetch();
    await getCartTool.execute({});
    expectRequest(fetchMock, '/api/cart');

    fetchMock = mockFetch();
    await applyCouponTool.execute({ code: 'USER_PROVIDED_CODE' });
    expectRequest(fetchMock, '/api/coupons/apply', 'POST', { code: 'USER_PROVIDED_CODE' });
  });

  it('maps wishlist and order operations without leaking application state into arguments', async () => {
    let fetchMock = mockFetch();
    await addToWishlistTool.execute({ productId: 'resolved-id' });
    expectRequest(fetchMock, '/api/wishlist', 'POST', { productId: 'resolved-id' });

    fetchMock = mockFetch();
    await removeFromWishlistTool.execute({ productId: 'resolved/id' });
    expectRequest(fetchMock, '/api/wishlist?productId=resolved%2Fid', 'DELETE');

    fetchMock = mockFetch();
    await getWishlistTool.execute({});
    expectRequest(fetchMock, '/api/wishlist');

    fetchMock = mockFetch();
    await getOrderHistoryTool.execute({});
    expectRequest(fetchMock, '/api/orders');

    fetchMock = mockFetch();
    await getOrderDetailsTool.execute({ orderId: 'resolved/order' });
    expectRequest(fetchMock, '/api/orders/resolved%2Forder');

    fetchMock = mockFetch();
    await cancelOrderTool.execute({ orderId: 'resolved-order', reason: 'user request' });
    expectRequest(fetchMock, '/api/orders/resolved-order/cancel', 'POST', { reason: 'user request' });
  });

  it('maps shipping, address, and demo order submission correctly', async () => {
    let fetchMock = mockFetch();
    await getShippingEstimateTool.execute({ zipCode: 'postal-code', weight: 1, items: 2 });
    expectRequest(fetchMock, '/api/shipping/estimate', 'POST', { zipCode: 'postal-code', weight: 1, items: 2 });

    fetchMock = mockFetch();
    await getSavedAddressesTool.execute({});
    expectRequest(fetchMock, '/api/addresses');

    const address = { fullName: 'recipient', street: 'street', city: 'city', state: 'state', zipCode: 'postal-code' };
    fetchMock = mockFetch();
    await updateShippingAddressTool.execute(address);
    expectRequest(fetchMock, '/api/addresses', 'POST', address);

    fetchMock = mockFetch();
    await updateShippingAddressTool.execute({ ...address, addressId: 'resolved-address' });
    expectRequest(fetchMock, '/api/addresses', 'PUT', { ...address, addressId: 'resolved-address' });

    fetchMock = mockFetch(failed);
    await expect(createOrderTool.execute({ ...address, confirmDemoOrder: true })).resolves.toEqual(failed);
    expectRequest(fetchMock, '/api/orders', 'POST', { ...address, confirmDemoOrder: true, demoOrderConfirmed: true });
  });
});

describe('WebMCP API failure contracts', () => {
  it('forwards a structured API failure from every real tool', async () => {
    for (const [tool, input] of toolInputs) {
      mockFetch(failed);
      await expect(tool.execute(input)).resolves.toEqual(failed);
    }
  });

  it('returns the registry structured execution error when any tool API is unreachable', async () => {
    const registry = new WebMCPRegistry();
    registry.setAuthState(true, { id: 'test-user' });
    registry.setCartItemCount(1);
    toolInputs.forEach(([tool]) => registry.registerTool(tool));

    for (const [tool, input] of toolInputs) {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
      const result = await registry.executeTool(tool.name, input);
      expect(result.errorDetails).toMatchObject({
        code: 'EXECUTION_ERROR',
        retryable: true,
        message: 'Network unavailable',
      });
    }
  });
});
