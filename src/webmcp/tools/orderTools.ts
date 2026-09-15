import { WebMCPTool } from '../types';

export const getOrderHistoryTool: WebMCPTool = {
  name: 'get_order_history',
  description:
    'Retrieve the complete order history for the authenticated user. ' +
    'Use this when the user asks about their past orders, recent purchases, or order status. ' +
    'Returns orders with order numbers, statuses (PENDING/PROCESSING/SHIPPED/DELIVERED/CANCELLED), item counts, totals, and dates. ' +
    'Requires authentication. Orders are scoped to the authenticated user only.',
  category: 'Orders',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/orders');
    return await res.json();
  },
};

export const getOrderDetailsTool: WebMCPTool = {
  name: 'get_order_details',
  description:
    'Retrieve complete details for a specific order including item breakdown, shipping address, tracking status, and payment info. ' +
    'Use this when the user asks about a particular order\'s details or tracking. ' +
    'Returns full order details including individual items, prices, quantities, and shipping address. ' +
    'Requires authentication. The order ID must come from get_order_history results. Only the order owner can view it.',
  category: 'Orders',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID or Order Number (e.g. "ORD-882194") obtained from get_order_history.',
      },
    },
    required: ['orderId'],
  },
  execute: async ({ orderId }) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    return await res.json();
  },
};

export const cancelOrderTool: WebMCPTool = {
  name: 'cancel_order',
  description:
    'Cancel an active, eligible order. Only orders with PENDING or PROCESSING status can be cancelled. ' +
    'Use this when the user explicitly requests to cancel a specific order. ' +
    'Orders that are SHIPPED or DELIVERED cannot be cancelled and must follow the return process. ' +
    'Returns the cancellation result with previous and current status. ' +
    'Requires authentication. Only the order owner can cancel it.',
  category: 'Orders',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID or Order Number to cancel (obtained from get_order_history).',
      },
      reason: {
        type: 'string',
        description: 'Optional cancellation reason provided by the user.',
      },
    },
    required: ['orderId'],
  },
  execute: async ({ orderId, reason }) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  },
};

export const createOrderTool: WebMCPTool = {
  name: 'create_order',
  description:
    'Place a demo order using the items currently in the cart with a specified shipping address. ' +
    'Use this when the user has items in the cart and wants to proceed to checkout. ' +
    'This is a demo checkout using DEMO_CARD payment only — no real payment is processed. ' +
    'The user must explicitly confirm the order (confirmDemoOrder: true). ' +
    'Returns the created order with order number, status, total, and items. The cart is cleared after order creation. ' +
    'Requires authentication and a populated cart.',
  category: 'Orders',
  permission: 'TRANSACTIONAL',
  availability: 'CART_POPULATED',
  inputSchema: {
    type: 'object',
    properties: {
      fullName: { type: 'string', description: 'Recipient full name.' },
      street: { type: 'string', description: 'Street address.' },
      city: { type: 'string', description: 'City name.' },
      state: { type: 'string', description: 'State or province.' },
      zipCode: { type: 'string', description: 'ZIP or postal code.' },
      country: { type: 'string', description: 'Country (default: "United States").' },
      phone: { type: 'string', description: 'Contact phone number.' },
      couponCode: { type: 'string', description: 'Optional coupon code (e.g. "TECH20") to apply to the order.' },
      paymentMethod: {
        type: 'string',
        enum: ['DEMO_CARD'],
        description: 'Demo payment method. Only "DEMO_CARD" is accepted.',
      },
      confirmDemoOrder: {
        type: 'boolean',
        description: 'Must be true. Only set after the user explicitly confirms they want to place this demo order.',
      },
    },
    required: ['fullName', 'street', 'city', 'state', 'zipCode', 'confirmDemoOrder'],
  },
  execute: async (orderInput) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderInput, demoOrderConfirmed: orderInput.confirmDemoOrder }),
    });
    return await res.json();
  },
};
