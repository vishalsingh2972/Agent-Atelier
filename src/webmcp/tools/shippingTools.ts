import { WebMCPTool } from '../types';

export const getShippingEstimateTool: WebMCPTool = {
  name: 'get_shipping_estimate',
  description:
    'Estimate shipping costs and delivery timelines for a destination ZIP code. ' +
    'Use this when the user asks about shipping costs, delivery times, or shipping options. ' +
    'Returns standard, express, and overnight shipping options with rates and estimated delivery windows. ' +
    'Does not require authentication.',
  category: 'Shipping',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      zipCode: {
        type: 'string',
        description: 'Destination ZIP or postal code (e.g. "10001", "90210", "60601").',
      },
      weight: {
        type: 'number',
        minimum: 0,
        description: 'Optional estimated package weight in pounds.',
      },
      items: {
        type: 'integer',
        minimum: 1,
        description: 'Optional number of items (used to auto-estimate weight if weight is not provided).',
      },
    },
    required: ['zipCode'],
  },
  execute: async ({ zipCode, weight, items }) => {
    const res = await fetch('/api/shipping/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipCode, weight, items }),
    });
    return await res.json();
  },
};

export const getSavedAddressesTool: WebMCPTool = {
  name: 'get_saved_addresses',
  description:
    'Retrieve all saved shipping addresses for the authenticated user. ' +
    'Use this when the user asks about their saved addresses or when preparing to place an order. ' +
    'Returns addresses with full details and indicates which is the default address. ' +
    'Requires authentication.',
  category: 'Account',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/addresses');
    return await res.json();
  },
};

export const updateShippingAddressTool: WebMCPTool = {
  name: 'update_shipping_address',
  description:
    'Add a new shipping address or update an existing one for the authenticated user. ' +
    'Use this when the user wants to save a new address or modify an existing saved address. ' +
    'Omit addressId to create a new address; include it to update an existing one. ' +
    'Returns the created or updated address. ' +
    'Requires authentication.',
  category: 'Account',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {
      addressId: {
        type: 'string',
        description: 'Existing address ID to update. Omit to create a new address.',
      },
      fullName: { type: 'string', description: 'Recipient full name.' },
      street: { type: 'string', description: 'Street address line.' },
      city: { type: 'string', description: 'City name.' },
      state: { type: 'string', description: 'State or province.' },
      zipCode: { type: 'string', description: 'ZIP or postal code.' },
      country: { type: 'string', description: 'Country (default: "United States").' },
      phone: { type: 'string', description: 'Contact phone number.' },
      isDefault: { type: 'boolean', description: 'Set this address as the default shipping address.' },
    },
    required: ['fullName', 'street', 'city', 'state', 'zipCode'],
  },
  execute: async (input) => {
    if (input.addressId) {
      // Update existing
      const res = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    } else {
      // Create new
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    }
  },
};
