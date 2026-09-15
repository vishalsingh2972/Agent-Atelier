import { WebMCPTool } from '../types';

export const searchProductsTool: WebMCPTool = {
  name: 'search_products',
  description:
    'Search the store product catalog by keyword, product name, brand, or category. ' +
    'Use this when the user asks to find, discover, or look up products. ' +
    'Returns matching products with their IDs, names, prices, ratings, stock status, and specifications. ' +
    'Product IDs from the results can be used with get_product_details, add_to_cart, compare_products, and other tools.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Product name, keyword, color, brand, or category (e.g., "red silk blouse", "black pima cotton tee", "high-rise indigo jeans").',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Maximum number of items to return (default: 10).',
      },
    },
    required: ['query'],
  },
  execute: async ({ query, limit = 10 }) => {
    const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await res.json();
    return data;
  },
};

export const getProductDetailsTool: WebMCPTool = {
  name: 'get_product_details',
  description:
    'Retrieve full details for a specific product by its ID or slug. ' +
    'Use this when the user asks for more information about a particular product found via search_products or filter_products. ' +
    'Returns technical specifications, real-time stock status, pricing, discount percentage, customer reviews, and category. ' +
    'The product ID must come from a previous search, filter, or recommendation result.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Unique ID or slug of the product (obtained from a prior catalog result).',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`);
    const data = await res.json();
    return data;
  },
};

export const filterProductsTool: WebMCPTool = {
  name: 'filter_products',
  description:
    'Filter the product catalog by category, brand, price range, minimum rating, and stock availability. ' +
    'Use this when the user wants to narrow down products by specific criteria without a search keyword. ' +
    'Returns filtered products with their IDs, names, prices, ratings, and stock. ' +
    'All filter parameters are optional and can be combined.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Category slug or name (e.g. "womens-tops", "mens-tshirts", "womens-jeans", "mens-jeans").',
      },
      brand: {
        type: 'string',
        description: 'Brand name (e.g. "Aura Atelier", "Maison Luxe", "Vogue Minimal", "Iron & Thread", "Atelier Sartorial", "Denim Atelier").',
      },
      minPrice: {
        type: 'number',
        minimum: 0,
        description: 'Minimum price threshold in USD.',
      },
      maxPrice: {
        type: 'number',
        minimum: 0,
        description: 'Maximum price threshold in USD.',
      },
      minRating: {
        type: 'number',
        minimum: 1.0,
        maximum: 5.0,
        description: 'Minimum rating threshold from 1.0 to 5.0 (e.g. 4.0 for 4+ stars).',
      },
      inStockOnly: {
        type: 'boolean',
        description: 'If true, only returns products currently in stock.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Maximum products to return (default: 12).',
      },
    },
  },
  execute: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating));
    if (filters.inStockOnly !== undefined) params.set('inStock', String(filters.inStockOnly));
    if (filters.limit) params.set('limit', String(filters.limit));

    const res = await fetch(`/api/products?${params.toString()}`);
    return await res.json();
  },
};

export const sortProductsTool: WebMCPTool = {
  name: 'sort_products',
  description:
    'Sort catalog products by a chosen criterion: price ascending/descending, customer rating, popularity, newest arrival, or highest discount. ' +
    'Use this when the user asks to sort or order products by a specific attribute. ' +
    'Returns sorted products with their IDs, names, prices, ratings, and stock. ' +
    'Can be combined with an optional category filter or search keyword.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      sortBy: {
        type: 'string',
        enum: ['price_asc', 'price_desc', 'rating', 'popularity', 'newest', 'discount'],
        description: 'Sort ordering criterion.',
      },
      category: {
        type: 'string',
        description: 'Optional category filter to sort within.',
      },
      query: {
        type: 'string',
        description: 'Optional search keyword to sort within.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Maximum products to return.',
      },
    },
    required: ['sortBy'],
  },
  execute: async ({ sortBy, category, query, limit = 12 }) => {
    const params = new URLSearchParams({ sort: sortBy, limit: String(limit) });
    if (category) params.set('category', category);
    if (query) params.set('q', query);

    const res = await fetch(`/api/products?${params.toString()}`);
    return await res.json();
  },
};

export const getProductRecommendationsTool: WebMCPTool = {
  name: 'get_product_recommendations',
  description:
    'Get tailored product recommendations based on a product being viewed, a category, or general top sellers. ' +
    'Use this when the user wants suggestions, related items, or "you might also like" recommendations. ' +
    'Returns recommended products with their IDs, names, prices, and ratings. ' +
    'Pass a productId to get related products, or a category for category-based recommendations.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Current product ID being viewed to get related accessories and alternatives.',
      },
      category: {
        type: 'string',
        description: 'Category to recommend from.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 20,
        description: 'Number of recommendations to retrieve (default: 4).',
      },
    },
  },
  execute: async ({ productId, category, limit = 4 } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (productId) params.set('productId', productId);
    if (category) params.set('category', category);

    const res = await fetch(`/api/products/recommendations?${params.toString()}`);
    return await res.json();
  },
};

export const compareProductsTool: WebMCPTool = {
  name: 'compare_products',
  description:
    'Compare 2 to 4 products side-by-side highlighting specifications, prices, discounts, ratings, and features. ' +
    'Use this when the user wants to compare multiple products before making a purchase decision. ' +
    'Returns a comparison table with each product\'s full details. ' +
    'Product IDs must come from previous search, filter, or recommendation results.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productIds: {
        type: 'array',
        items: {
          type: 'string',
          description: 'Product ID or slug to compare.',
        },
        description: 'List of 2 to 4 product IDs to compare.',
      },
    },
    required: ['productIds'],
  },
  execute: async ({ productIds }) => {
    const ids = Array.isArray(productIds) ? productIds.join(',') : productIds;
    const res = await fetch(`/api/products/compare?ids=${encodeURIComponent(ids)}`);
    return await res.json();
  },
};

export const checkProductStockTool: WebMCPTool = {
  name: 'check_product_stock',
  description:
    'Check real-time inventory quantity and availability status for a specific product. ' +
    'Use this before adding a product to the cart to verify it is in stock. ' +
    'Returns the stock count and a status of IN_STOCK, LOW_STOCK, or OUT_OF_STOCK. ' +
    'The product ID must come from a previous catalog result.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID to check stock for (obtained from a prior catalog result).',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`);
    const data = await res.json();
    if (!data.success) return data;
    return {
      success: true,
      productId: data.product.id,
      name: data.product.name,
      stock: data.product.stock,
      inStock: data.product.stock > 0,
      status: data.product.stock > 10 ? 'IN_STOCK' : data.product.stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
    };
  },
};

export const getCurrentPromotionsTool: WebMCPTool = {
  name: 'get_current_promotions',
  description:
    'Retrieve current store promotions, featured products, flash deals, and active discount coupon codes. ' +
    'Use this when the user asks about deals, sales, discounts, or available coupons. ' +
    'Returns featured products, discounted products, and active coupon codes with their discount percentages.',
  category: 'Promotions',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/products/promotions');
    return await res.json();
  },
};

export const getAvailableProductVariantsTool: WebMCPTool = {
  name: 'get_available_product_variants',
  description:
    'Retrieve available color, configuration, storage, RAM, or sizing variants for a given product. ' +
    'Use this when the user asks about available options or configurations for a product. ' +
    'Returns the base price, current specifications, and available variant options. ' +
    'Note: Variants are derived from product specifications; not all products have multiple variants.',
  category: 'Products',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID or slug to retrieve variant options for (obtained from a prior catalog result).',
      },
    },
    required: ['productId'],
  },
  execute: async ({ productId }) => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`);
    const data = await res.json();
    if (!data.success || !data.product) return data;

    const product = data.product;
    const specs = product.specifications || {};
    
    // Extract available variant dimensions from apparel specifications
    const variants: Record<string, any[]> = {};
    if (specs['Available Sizes']) {
      variants['sizes'] = typeof specs['Available Sizes'] === 'string'
        ? specs['Available Sizes'].split(',').map((s: string) => s.trim())
        : specs['Available Sizes'];
    }
    if (specs['Color']) {
      variants['colors'] = [specs['Color']];
    }
    if (specs['Fit']) {
      variants['fit'] = [specs['Fit']];
    }
    if (specs['Material']) {
      variants['material'] = [specs['Material']];
    }

    return {
      success: true,
      productId: product.id,
      productName: product.name,
      basePrice: product.price,
      department: specs['Department'] || 'Apparel',
      currentSpecs: specs,
      availableOptions: Object.keys(variants).length > 0 ? variants : {
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [specs['Color'] || 'Standard'],
      },
      inStock: product.stock > 0,
      stockCount: product.stock,
    };
  },
};
