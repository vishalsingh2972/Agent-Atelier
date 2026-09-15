import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  navigateToPageTool,
  viewProductPageTool,
  viewComparisonPageTool,
} from '../../../src/webmcp/tools/navigationTools';
import { webmcpRegistry } from '../../../src/webmcp/registry';

describe('WebMCP navigation tools deterministic contracts', () => {
  beforeEach(() => {
    webmcpRegistry.setAuthState(false, null);
    webmcpRegistry.setCartItemCount(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('navigateToPageTool', () => {
    it('rejects unlisted or malicious pages with INVALID_INPUT', async () => {
      const result = await navigateToPageTool.execute({ page: 'external_site' } as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
      expect(result.errorDetails?.retryable).toBe(false);
    });

    it('rejects product_detail when productId is missing or empty', async () => {
      const result1 = await navigateToPageTool.execute({ page: 'product_detail' });
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('INVALID_INPUT');

      const result2 = await navigateToPageTool.execute({ page: 'product_detail', productId: '   ' });
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('INVALID_INPUT');
    });

    it('enforces authentication barrier for account, orders, and wishlist pages', async () => {
      // Unauthenticated
      const accResult = await navigateToPageTool.execute({ page: 'account' });
      expect(accResult.errorDetails).toMatchObject({
        code: 'AUTHENTICATION_REQUIRED',
        userActionRequired: true,
      });

      const ordResult = await navigateToPageTool.execute({ page: 'orders' });
      expect(ordResult.errorDetails).toMatchObject({
        code: 'AUTHENTICATION_REQUIRED',
      });

      const wlResult = await navigateToPageTool.execute({ page: 'wishlist' });
      expect(wlResult.errorDetails).toMatchObject({
        code: 'AUTHENTICATION_REQUIRED',
      });

      // Authenticated
      webmcpRegistry.setAuthState(true, { id: 'test-user', email: 'user@test.com' });
      const authAccResult = await navigateToPageTool.execute({ page: 'account' });
      expect(authAccResult.success).toBe(true);
      expect(authAccResult.navigatedTo).toBe('/account');

      const authOrdResult = await navigateToPageTool.execute({ page: 'orders' });
      expect(authOrdResult.success).toBe(true);
      expect(authOrdResult.navigatedTo).toBe('/account?tab=orders');
    });

    it('enforces authentication and cart requirements for checkout page', async () => {
      // 1. Unauthenticated -> fails auth
      const unauthResult = await navigateToPageTool.execute({ page: 'checkout' });
      expect(unauthResult.errorDetails).toMatchObject({
        code: 'AUTHENTICATION_REQUIRED',
      });

      // 2. Authenticated but empty cart -> fails cart
      webmcpRegistry.setAuthState(true, { id: 'test-user' });
      webmcpRegistry.setCartItemCount(0);
      const emptyCartResult = await navigateToPageTool.execute({ page: 'checkout' });
      expect(emptyCartResult.errorDetails).toMatchObject({
        code: 'CART_EMPTY',
      });

      // 3. Authenticated + populated cart -> succeeds
      webmcpRegistry.setCartItemCount(2);
      const okResult = await navigateToPageTool.execute({ page: 'checkout' });
      expect(okResult.success).toBe(true);
      expect(okResult.navigatedTo).toBe('/checkout');
    });

    it('successfully navigates to home, products, and compare pages', async () => {
      const home = await navigateToPageTool.execute({ page: 'home' });
      expect(home).toMatchObject({ success: true, navigatedTo: '/', page: 'home' });

      const products = await navigateToPageTool.execute({
        page: 'products',
        category: 'laptops',
        searchQuery: 'pro',
      });
      expect(products.success).toBe(true);
      expect(products.navigatedTo).toContain('/products?');
      expect(products.navigatedTo).toContain('category=laptops');
      expect(products.navigatedTo).toContain('q=pro');

      const compare = await navigateToPageTool.execute({
        page: 'compare',
        productIds: ['prod-1', 'prod-2'],
        view: 'parallel',
      });
      expect(compare.success).toBe(true);
      expect(compare.navigatedTo).toBe('/compare?ids=prod-1%2Cprod-2&view=parallel');
    });

    it('dispatches webmcp-navigation custom event in browser environment', async () => {
      const dispatchMock = vi.fn();
      vi.stubGlobal('window', { dispatchEvent: dispatchMock });

      await navigateToPageTool.execute({ page: 'cart' });
      expect(dispatchMock).toHaveBeenCalledOnce();
      const event = dispatchMock.mock.calls[0][0];
      expect(event.detail).toEqual({ url: '/cart', page: 'cart' });
    });
  });

  describe('viewProductPageTool', () => {
    it('rejects invalid or missing productId', async () => {
      const res1 = await viewProductPageTool.execute({} as any);
      expect(res1.error).toBe('INVALID_INPUT');

      const res2 = await viewProductPageTool.execute({ productId: '' });
      expect(res2.error).toBe('INVALID_INPUT');
    });

    it('constructs correct product URL and dispatches event', async () => {
      const dispatchMock = vi.fn();
      vi.stubGlobal('window', { dispatchEvent: dispatchMock });

      const result = await viewProductPageTool.execute({ productId: 'techpro-laptop-15' });
      expect(result.success).toBe(true);
      expect(result.navigatedTo).toBe('/products/techpro-laptop-15');
      expect(dispatchMock).toHaveBeenCalledOnce();
      expect(dispatchMock.mock.calls[0][0].detail).toEqual({
        url: '/products/techpro-laptop-15',
        page: 'product_detail',
        productId: 'techpro-laptop-15',
      });
    });
  });

  describe('viewComparisonPageTool', () => {
    it('rejects fewer than 2 product IDs', async () => {
      const res1 = await viewComparisonPageTool.execute({ productIds: [] });
      expect(res1.error).toBe('INVALID_INPUT');

      const res2 = await viewComparisonPageTool.execute({ productIds: ['prod-1'] });
      expect(res2.error).toBe('INVALID_INPUT');
    });

    it('constructs correct compare URL with ids and view mode', async () => {
      const dispatchMock = vi.fn();
      vi.stubGlobal('window', { dispatchEvent: dispatchMock });

      const result = await viewComparisonPageTool.execute({
        productIds: ['prod-a', 'prod-b', 'prod-c'],
        view: 'serial',
      });
      expect(result.success).toBe(true);
      expect(result.navigatedTo).toBe('/compare?ids=prod-a%2Cprod-b%2Cprod-c&view=serial');
      expect(result.productCount).toBe(3);
      expect(result.view).toBe('serial');
      expect(dispatchMock).toHaveBeenCalledOnce();
    });
  });
});
