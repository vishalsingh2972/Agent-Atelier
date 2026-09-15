import { expect, test } from '@playwright/test';

const searchQuery = process.env.WEBMCP_E2E_SEARCH_QUERY || 'laptop';

test.describe('Bridge to Agentia browser commerce journey', () => {
  test('searches, inspects, adds, inspects cart, and removes a runtime-resolved product', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: /1-Click Demo Login/ }).click();
    await expect(page.getByRole('button', { name: /1-Click Demo Login/ })).toBeHidden();
    await page.waitForFunction(async () => {
      const response = await fetch('/api/auth/me');
      return (await response.json()).authenticated === true;
    });

    await page.evaluate(async () => {
      await fetch('/api/cart?clear=true', { method: 'DELETE' });
    });

    const search = page.locator('header').getByPlaceholder(/Search/);
    await search.fill(searchQuery);
    await search.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/products\\?q=${encodeURIComponent(searchQuery)}`));
    await expect(page.getByText(`Search: "${searchQuery}"`)).toBeVisible();

    const productLinks = page.locator('a[href^="/products/"]');
    const productHref = await productLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).find((href) => href && href !== '/products/')
    );
    expect(productHref).toBeTruthy();
    await page.goto(productHref!);
    await expect(page.getByRole('button', { name: /Add to Cart/ })).toBeVisible();

    const cartMutation = page.waitForResponse((response) => response.url().includes('/api/cart') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /Add to Cart/ }).click();
    const cartMutationResponse = await cartMutation;
    expect(cartMutationResponse.ok()).toBeTruthy();
    expect((await cartMutationResponse.json()).success).toBeTruthy();
    await expect(page.getByText('Item successfully added to your shopping cart!')).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Shopping Cart \(1 item\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove item' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove item' }).click();
    await expect(page.getByText('Your shopping cart is currently empty')).toBeVisible();
  });
});
