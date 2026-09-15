import { WebMCPTool } from '../types';
import { webmcpRegistry } from '../registry';

/**
 * Valid internal navigation destinations.
 * External URLs or unlisted routes are strictly prohibited to prevent open redirects.
 */
export const ALLOWED_NAV_PAGES = [
  'home',
  'products',
  'product_detail',
  'compare',
  'cart',
  'checkout',
  'account',
  'orders',
  'wishlist',
] as const;

export type AllowedNavPage = (typeof ALLOWED_NAV_PAGES)[number];

export const navigateToPageTool: WebMCPTool = {
  name: 'navigate_to_page',
  description:
    'Navigate the user\'s browser to a specific page or section in the store with proper security boundaries and flow validation. ' +
    'Allowed targets: "home" (/), "products" (/products), "product_detail" (/products/{productId}), "compare" (/compare), "cart" (/cart), "checkout" (/checkout), "account" (/account), "orders" (/account?tab=orders), "wishlist" (/account?tab=wishlist). ' +
    'Protected pages (checkout, account, orders, wishlist) enforce session and cart requirements before navigating. ' +
    'Use this tool when the user asks to go to, open, or visit a major store section.',
  category: 'Navigation',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      page: {
        type: 'string',
        enum: [...ALLOWED_NAV_PAGES],
        description: 'Target page within the application.',
      },
      productId: {
        type: 'string',
        description: 'Product ID or slug (required when page is "product_detail").',
      },
      productIds: {
        type: 'array',
        items: {
          type: 'string',
          description: 'Product ID or slug.',
        },
        description: 'List of product IDs when navigating to "compare".',
      },
      category: {
        type: 'string',
        description: 'Category slug to filter when navigating to "products" (e.g. "laptops", "smartphones").',
      },
      searchQuery: {
        type: 'string',
        description: 'Search keyword to filter when navigating to "products".',
      },
      view: {
        type: 'string',
        enum: ['auto', 'parallel', 'serial'],
        description: 'Comparison layout mode: "parallel" (side-by-side) or "serial" (stacked detailed cards).',
      },
    },
    required: ['page'],
  },
  execute: async ({ page, productId, productIds, category, searchQuery, view }) => {
    // 1. Validate page is allowed
    if (!ALLOWED_NAV_PAGES.includes(page as AllowedNavPage)) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: `Invalid page destination: "${page}". Allowed pages are: ${ALLOWED_NAV_PAGES.join(', ')}.`,
        errorDetails: {
          code: 'INVALID_INPUT',
          message: `Invalid page destination: "${page}". Allowed pages are: ${ALLOWED_NAV_PAGES.join(', ')}.`,
          retryable: false,
          userActionRequired: true,
        },
      };
    }

    // 2. Validate product_detail requirements
    if (page === 'product_detail') {
      if (!productId || typeof productId !== 'string' || !productId.trim()) {
        return {
          success: false,
          error: 'INVALID_INPUT',
          message: 'productId is required when navigating to "product_detail".',
          errorDetails: {
            code: 'INVALID_INPUT',
            message: 'productId is required when navigating to "product_detail".',
            retryable: false,
            userActionRequired: true,
          },
        };
      }
    }

    const authState = webmcpRegistry.getAuthState();

    // 3. Enforce authentication limitations on protected pages
    if (page === 'account' || page === 'orders' || page === 'wishlist') {
      if (!authState.isAuthenticated) {
        return {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: `Authentication is required to view ${page}. Please log in to your account first.`,
          errorDetails: {
            code: 'AUTHENTICATION_REQUIRED',
            message: `Authentication is required to view ${page}. Please log in to your account first.`,
            retryable: false,
            userActionRequired: true,
          },
        };
      }
    }

    // 4. Enforce checkout limitations (requires auth + non-empty cart)
    if (page === 'checkout') {
      if (!authState.isAuthenticated) {
        return {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Authentication is required before proceeding to checkout. Please log in first.',
          errorDetails: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required before proceeding to checkout. Please log in first.',
            retryable: false,
            userActionRequired: true,
          },
        };
      }

      if (webmcpRegistry.getCartItemCount() <= 0) {
        return {
          success: false,
          error: 'CART_EMPTY',
          message: 'Cannot proceed to checkout with an empty cart. Please add items to your cart first.',
          errorDetails: {
            code: 'CART_EMPTY',
            message: 'Cannot proceed to checkout with an empty cart. Please add items to your cart first.',
            retryable: false,
            userActionRequired: true,
          },
        };
      }
    }

    // 5. Construct safe URL
    let url = '/';
    switch (page) {
      case 'home':
        url = '/';
        break;
      case 'products': {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (searchQuery) params.set('q', searchQuery);
        url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
        break;
      }
      case 'product_detail':
        url = `/products/${encodeURIComponent(productId!.trim())}`;
        break;
      case 'compare': {
        const params = new URLSearchParams();
        if (Array.isArray(productIds) && productIds.length > 0) {
          params.set('ids', productIds.join(','));
        }
        if (view && ['auto', 'parallel', 'serial'].includes(view)) {
          params.set('view', view);
        }
        url = `/compare${params.toString() ? `?${params.toString()}` : ''}`;
        break;
      }
      case 'cart':
        url = '/cart';
        break;
      case 'checkout':
        url = '/checkout';
        break;
      case 'account':
        url = '/account';
        break;
      case 'orders':
        url = '/account?tab=orders';
        break;
      case 'wishlist':
        url = '/account?tab=wishlist';
        break;
    }

    // 6. Dispatch navigation event if running in browser
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('webmcp-navigation', {
          detail: { url, page },
        })
      );
    }

    return {
      success: true,
      navigatedTo: url,
      page,
      message: `Navigated to ${page} (${url}).`,
    };
  },
};

export const viewProductPageTool: WebMCPTool = {
  name: 'view_product_page',
  description:
    'Navigate the user\'s browser directly to a specific product detail page to display photos, full hardware specifications, stock status, and customer reviews. ' +
    'Use this when the user asks to "show", "open", "view", or "inspect" a specific product. ' +
    'The productId must be a valid ID or slug from a prior search or catalog result.',
  category: 'Navigation',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID or slug to open in the browser.',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: 'productId is required to open product page.',
        errorDetails: {
          code: 'INVALID_INPUT',
          message: 'productId is required to open product page.',
          retryable: false,
          userActionRequired: true,
        },
      };
    }

    const cleanId = productId.trim();
    const url = `/products/${encodeURIComponent(cleanId)}`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('webmcp-navigation', {
          detail: { url, page: 'product_detail', productId: cleanId },
        })
      );
    }

    return {
      success: true,
      navigatedTo: url,
      productId: cleanId,
      message: `Opened product detail page for "${cleanId}".`,
    };
  },
};

export const viewComparisonPageTool: WebMCPTool = {
  name: 'view_comparison_page',
  description:
    'Open the product comparison page in the user\'s browser to compare 2 to 4 products side-by-side or serially. ' +
    'Use this when the user asks to compare multiple products visually on the screen. ' +
    'The page adapts its presentation to "parallel" (side-by-side columns, ideal for 2-3 products) or "serial" (stacked detailed cards, ideal for 4+ products or mobile). ' +
    'Product IDs must come from previous search or catalog results.',
  category: 'Navigation',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productIds: {
        type: 'array',
        items: {
          type: 'string',
          description: 'Product ID or slug.',
        },
        description: 'List of 2 to 4 product IDs to compare on screen.',
      },
      view: {
        type: 'string',
        enum: ['auto', 'parallel', 'serial'],
        description: 'Comparison layout mode: "parallel" for side-by-side columns, "serial" for stacked detailed cards, or "auto" to adapt to product count.',
      },
    },
    required: ['productIds'],
  },
  execute: async ({ productIds, view = 'auto' }) => {
    if (!Array.isArray(productIds) || productIds.length < 2) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: 'At least 2 product IDs are required to view product comparison.',
        errorDetails: {
          code: 'INVALID_INPUT',
          message: 'At least 2 product IDs are required to view product comparison.',
          retryable: false,
          userActionRequired: true,
        },
      };
    }

    const cleanedIds = productIds.map((id) => String(id).trim()).filter(Boolean);
    if (cleanedIds.length < 2) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: 'At least 2 valid product IDs are required for comparison.',
        errorDetails: {
          code: 'INVALID_INPUT',
          message: 'At least 2 valid product IDs are required for comparison.',
          retryable: false,
          userActionRequired: true,
        },
      };
    }

    const params = new URLSearchParams({ ids: cleanedIds.join(',') });
    if (view && ['auto', 'parallel', 'serial'].includes(view)) {
      params.set('view', view);
    }
    const url = `/compare?${params.toString()}`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('webmcp-navigation', {
          detail: { url, page: 'compare', productIds: cleanedIds, view },
        })
      );
    }

    return {
      success: true,
      navigatedTo: url,
      productCount: cleanedIds.length,
      view,
      message: `Opened comparison page comparing ${cleanedIds.length} products in ${view} mode.`,
    };
  },
};
