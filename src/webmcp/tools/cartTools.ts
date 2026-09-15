import { WebMCPTool } from '../types';

export const addToCartTool: WebMCPTool = {
  name: 'add_to_cart',
  description:
    'Add a product to the authenticated user\'s shopping cart with a specified quantity. ' +
    'Use this when the user wants to add a product they found via search_products, filter_products, or get_product_details. ' +
    'Returns the updated cart with item count, line items, subtotal, and estimated total. ' +
    'Requires authentication. The product ID must come from a previous catalog result.',
  category: 'Cart',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'ID of the product to add (obtained from a prior catalog result).',
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        description: 'Number of units to add (default: 1).',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId, quantity = 1 }) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    return await res.json();
  },
};

export const getCartTool: WebMCPTool = {
  name: 'get_cart',
  description:
    'Retrieve all items in the authenticated user\'s shopping cart. ' +
    'Use this when the user asks to view, inspect, or check their cart contents. ' +
    'Returns line items with product details, quantities, per-item totals, subtotal, applied discounts, shipping fee, tax, and estimated order total. ' +
    'Requires authentication.',
  category: 'Cart',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/cart');
    return await res.json();
  },
};

export const updateCartQuantityTool: WebMCPTool = {
  name: 'update_cart_quantity',
  description:
    'Update the quantity of a specific product already in the authenticated user\'s cart. ' +
    'Use this when the user wants to change how many of a product they want. Setting quantity to 0 removes the item. ' +
    'Returns the updated cart with recalculated totals. ' +
    'Requires authentication. The product ID must already be in the cart.',
  category: 'Cart',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID of the item in the cart to update.',
      },
      quantity: {
        type: 'integer',
        minimum: 0,
        description: 'New quantity desired (set to 0 to remove the item).',
      },
    },
    required: ['productId', 'quantity'],
  },
  execute: async ({ productId, quantity }) => {
    const res = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    return await res.json();
  },
};

export const removeFromCartTool: WebMCPTool = {
  name: 'remove_from_cart',
  description:
    'Remove a product item entirely from the authenticated user\'s cart regardless of quantity. ' +
    'Use this when the user explicitly wants to remove a specific item from their cart. ' +
    'Returns the updated cart with recalculated totals. ' +
    'Requires authentication.',
  category: 'Cart',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID to remove from cart.',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
    return await res.json();
  },
};

export const clearCartTool: WebMCPTool = {
  name: 'clear_cart',
  description:
    'Remove every item from the authenticated user\'s cart, emptying it completely. ' +
    'Use this only when the user explicitly asks to empty or clear their entire cart. ' +
    'Returns confirmation with an empty cart. ' +
    'Requires authentication. This action cannot be undone.',
  category: 'Cart',
  permission: 'AUTHENTICATED',
  inputSchema: { type: 'object', properties: {} },
  execute: async () => {
    const res = await fetch('/api/cart?clear=true', { method: 'DELETE' });
    return await res.json();
  },
};

export const applyCouponTool: WebMCPTool = {
  name: 'apply_coupon',
  description:
    'Apply a promotional coupon code to calculate a discount on the current cart items. ' +
    'Use this when the user provides a coupon code or asks about applying a promotion. ' +
    'Available coupon codes can be discovered via get_current_promotions. ' +
    'Returns the recalculated cart with the coupon discount applied. ' +
    'Requires authentication.',
  category: 'Cart',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Coupon code to apply (e.g., "TECH20", "SAVE10", "WELCOME15").',
      },
    },
    required: ['code'],
  },
  execute: async ({ code }) => {
    const res = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return await res.json();
  },
};
