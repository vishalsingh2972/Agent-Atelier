/**
 * Response Redactor — strips PII from tool results before they reach the LLM.
 *
 * This is the privacy boundary between WebMCP tool execution (which operates
 * on real user data) and the Gemini API (which should only see anonymized
 * summaries). All tool results pass through redactForLLM() before being
 * included in a functionResponse sent to the LLM.
 */

/** Fields that should always be redacted from any tool result, at any depth. */
const GLOBAL_PII_FIELDS = new Set([
  'passwordHash',
  'password',
  'token',
  'sessionToken',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
]);

/**
 * Address and contact PII fields redacted globally across all tool results.
 * These are stripped recursively at every depth to prevent any tool from
 * leaking physical location or contact information to the LLM.
 */
const ADDRESS_PII_FIELDS = new Set([
  'phone',
  'street',
  'zipCode',
  'fullName',
  'city',
  'state',
  'country',
]);

/**
 * Tools whose results contain address data that needs special handling.
 * For these tools, we apply structured redaction (e.g., "Saved Address #1")
 * instead of generic "[redacted]" to preserve useful context for the LLM.
 */
const ADDRESS_AWARE_TOOLS = new Set([
  'get_saved_addresses',
  'get_order_details',
  'get_order_history',
  'create_order',
  'update_shipping_address',
]);

/**
 * Tools whose results should NOT have address fields stripped by the global
 * default rule (because they don't contain user addresses — e.g., product
 * catalog tools that have "country" in shipping estimate results).
 *
 * For these tools, only GLOBAL_PII_FIELDS are stripped.
 */
const CATALOG_SAFE_TOOLS = new Set([
  'search_products',
  'get_product_details',
  'filter_products',
  'sort_products',
  'get_product_recommendations',
  'compare_products',
  'check_product_stock',
  'get_current_promotions',
  'get_available_product_variants',
  'filter_apparel',
  'get_apparel_size_guide',
  'get_shipping_estimate',
  'navigate_to_page',
  'view_product_page',
  'view_comparison_page',
  'apply_coupon',
]);

/**
 * Redact sensitive fields from a tool result before it is sent to the LLM.
 *
 * @param toolName - The name of the tool that produced the result
 * @param result   - The raw tool result (will be deep-cloned, not mutated)
 * @returns A redacted copy safe for LLM consumption
 */
export function redactForLLM(toolName: string, result: unknown): unknown {
  if (result === null || result === undefined) return result;
  if (typeof result !== 'object') return result;

  // Deep clone to avoid mutating the original
  const redacted = JSON.parse(JSON.stringify(result));

  // Always strip global PII fields (passwords, tokens, etc.) at every depth
  redactFieldsRecursive(redacted, GLOBAL_PII_FIELDS, '[redacted]');

  // Apply tool-specific structured redaction for address-aware tools
  if (ADDRESS_AWARE_TOOLS.has(toolName)) {
    applyAddressToolRedactions(toolName, redacted);
  } else if (!CATALOG_SAFE_TOOLS.has(toolName)) {
    // For unknown/unclassified tools, apply address PII redaction as safety net
    redactFieldsRecursive(redacted, ADDRESS_PII_FIELDS, '[redacted]');
  }

  // Redact emails everywhere (mask, don't remove)
  redactEmailsRecursive(redacted);

  return redacted;
}

/**
 * Recursively walk an object and replace matching field values.
 */
function redactFieldsRecursive(
  obj: Record<string, unknown>,
  fields: Set<string>,
  replacement: string,
): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object') {
        redactFieldsRecursive(item as Record<string, unknown>, fields, replacement);
      }
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    if (fields.has(key) && obj[key] !== undefined && obj[key] !== null) {
      obj[key] = replacement;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      redactFieldsRecursive(obj[key] as Record<string, unknown>, fields, replacement);
    }
  }
}

/**
 * Recursively find and mask all email-like values in an object.
 */
function redactEmailsRecursive(obj: any): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object') redactEmailsRecursive(item);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && value.includes('@') && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      obj[key] = maskEmail(value);
    } else if (typeof value === 'object' && value !== null) {
      redactEmailsRecursive(value);
    }
  }
}

/**
 * Mask an email address: "john.doe@example.com" → "j***@example.com"
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '[redacted]';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[redacted]';
  return `${local[0]}***@${domain}`;
}

/**
 * Structured redaction for tools that return address/shipping data.
 * Preserves semantic context (e.g., "Saved Address #1") while hiding real PII.
 */
function applyAddressToolRedactions(toolName: string, data: any): void {
  switch (toolName) {
    case 'get_saved_addresses':
      if (Array.isArray(data?.addresses)) {
        data.addresses.forEach((addr: any, i: number) => {
          redactAddressObject(addr, `Saved Address #${i + 1}`);
        });
      }
      break;

    case 'get_order_details':
      redactNestedAddress(data?.order?.shippingAddress || data?.shippingAddress, 'Order shipping address');
      break;

    case 'get_order_history':
      if (Array.isArray(data?.orders)) {
        data.orders.forEach((order: any) => {
          if (order.shippingAddress) {
            redactNestedAddress(order.shippingAddress, 'Order shipping address');
          }
        });
      }
      break;

    case 'create_order':
      redactNestedAddress(data?.order?.shippingAddress, 'Order shipping address');
      break;

    case 'update_shipping_address':
      if (data?.address) {
        redactAddressObject(data.address, 'Updated address');
      }
      break;
  }
}

/**
 * Redact a single address object in-place.
 */
function redactAddressObject(addr: any, label: string): void {
  if (!addr || typeof addr !== 'object') return;
  if (addr.fullName) addr.fullName = `[${label}]`;
  if (addr.street) addr.street = '[redacted]';
  if (addr.city) addr.city = '[redacted]';
  if (addr.state) addr.state = '[redacted]';
  if (addr.zipCode) addr.zipCode = '[redacted]';
  if (addr.country) addr.country = '[redacted]';
  if (addr.phone) addr.phone = '[redacted]';
}

/**
 * Redact an address that might be a nested object or JSON string.
 */
function redactNestedAddress(addr: any, label: string): void {
  if (!addr) return;
  if (typeof addr === 'object') {
    redactAddressObject(addr, label);
  }
}
