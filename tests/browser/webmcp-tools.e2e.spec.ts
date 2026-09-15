import { expect, test } from '@playwright/test';

test.describe('Bridge to Agentia WebMCP tool discovery and direct execution', () => {
  test('exposes document.modelContext with getTools and executeTool', async ({ page }) => {
    await page.goto('/');

    // Wait for WebMCP tools to be registered
    const hasModelContext = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.getTools === 'function' && typeof ctx.executeTool === 'function';
    }, { timeout: 15000 }).catch(() => null);

    // If native modelContext is not available (non-WebMCP Chrome), the registry
    // still works internally — skip native-specific assertions gracefully
    if (!hasModelContext) {
      test.skip();
      return;
    }

    const tools = await page.evaluate(() => (document as any).modelContext.getTools());
    expect(tools.length).toBeGreaterThanOrEqual(10);

    // Verify tool structure
    const searchTool = tools.find((t: any) => t.name === 'search_products');
    expect(searchTool).toBeTruthy();
    expect(searchTool.description.length).toBeGreaterThan(20);
    expect(searchTool.inputSchema.type).toBe('object');
    expect(searchTool.status).toBe('AVAILABLE');
  });

  test('executes search_products via document.modelContext.executeTool', async ({ page }) => {
    await page.goto('/');

    const hasModelContext = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.executeTool === 'function';
    }, { timeout: 15000 }).catch(() => null);

    if (!hasModelContext) {
      test.skip();
      return;
    }

    const result = await page.evaluate(async () => {
      return await (document as any).modelContext.executeTool('search_products', { query: 'laptop' });
    });

    expect(result.success).toBe(true);
    expect(result.products).toBeDefined();
    expect(result.products.length).toBeGreaterThan(0);
  });

  test('rejects protected tools when not authenticated', async ({ page }) => {
    await page.goto('/');

    const hasModelContext = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.executeTool === 'function';
    }, { timeout: 15000 }).catch(() => null);

    if (!hasModelContext) {
      test.skip();
      return;
    }

    const result = await page.evaluate(async () => {
      return await (document as any).modelContext.executeTool('add_to_cart', {
        productId: 'any-product-id',
        quantity: 1,
      });
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('AUTHENTICATION_REQUIRED');
    expect(result.requiresAuthentication).toBe(true);
  });

  test('validates input schema via direct tool execution', async ({ page }) => {
    await page.goto('/');

    const hasModelContext = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.executeTool === 'function';
    }, { timeout: 15000 }).catch(() => null);

    if (!hasModelContext) {
      test.skip();
      return;
    }

    // Missing required parameter
    const result = await page.evaluate(async () => {
      return await (document as any).modelContext.executeTool('search_products', {});
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_INPUT');
  });

  test('returns structured error for unknown tool', async ({ page }) => {
    await page.goto('/');

    const hasModelContext = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.executeTool === 'function';
    }, { timeout: 15000 }).catch(() => null);

    if (!hasModelContext) {
      test.skip();
      return;
    }

    const result = await page.evaluate(async () => {
      return await (document as any).modelContext.executeTool('nonexistent_tool', {});
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('TOOL_NOT_FOUND');
  });

  test('tools update availability after login and logout', async ({ page }) => {
    await page.goto('/');

    // Login via UI
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: /1-Click Demo Login/ }).click();
    await expect(page.getByRole('button', { name: /1-Click Demo Login/ })).toBeHidden();
    await page.waitForFunction(async () => {
      const response = await fetch('/api/auth/me');
      return (await response.json()).authenticated === true;
    });

    const hasModelContext = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.getTools === 'function';
    }, { timeout: 15000 }).catch(() => null);

    if (!hasModelContext) {
      test.skip();
      return;
    }

    // After login, cart tools should be available
    const toolsAfterLogin = await page.evaluate(() => (document as any).modelContext.getTools());
    const cartTool = toolsAfterLogin.find((t: any) => t.name === 'add_to_cart');
    expect(cartTool?.status).toBe('AVAILABLE');

    // Logout
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    });
    // Wait briefly for the auth state to propagate
    await page.waitForTimeout(500);
    await page.reload();

    const hasModelContextAfterLogout = await page.waitForFunction(() => {
      const ctx = (document as any).modelContext;
      return ctx && typeof ctx.getTools === 'function';
    }, { timeout: 15000 }).catch(() => null);

    if (hasModelContextAfterLogout) {
      const toolsAfterLogout = await page.evaluate(() => (document as any).modelContext.getTools());
      const cartToolAfterLogout = toolsAfterLogout.find((t: any) => t.name === 'add_to_cart');
      expect(cartToolAfterLogout?.status).toBe('LOGIN_REQUIRED');
    }
  });
});
