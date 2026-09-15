import { WebMCPTool } from '../types';

export const addToWishlistTool: WebMCPTool = {
  name: 'add_to_wishlist',
  description:
    'Save a product to the authenticated user\'s wishlist for later consideration. ' +
    'Use this when the user wants to save, bookmark, or "heart" a product without adding it to the cart. ' +
    'Returns the updated wishlist. ' +
    'Requires authentication. The product ID must come from a previous catalog result.',
  category: 'Wishlist',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID to add to wishlist (obtained from a prior catalog result).',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    return await res.json();
  },
};

export const removeFromWishlistTool: WebMCPTool = {
  name: 'remove_from_wishlist',
  description:
    'Remove a product from the authenticated user\'s saved wishlist. ' +
    'Use this when the user no longer wants to save a specific product. ' +
    'Returns the updated wishlist. ' +
    'Requires authentication.',
  category: 'Wishlist',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID to remove from wishlist.',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
    return await res.json();
  },
};

export const getWishlistTool: WebMCPTool = {
  name: 'get_wishlist',
  description:
    'Retrieve all products saved in the authenticated user\'s wishlist. ' +
    'Use this when the user asks to view their saved or bookmarked products. ' +
    'Returns the list of saved products with their details. ' +
    'Requires authentication.',
  category: 'Wishlist',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/wishlist');
    return await res.json();
  },
};
