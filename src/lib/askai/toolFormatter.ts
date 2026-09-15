/**
 * Converts WebMCP RegisteredToolInfo[] into Gemini function declarations.
 * Only includes tools with AVAILABLE status — state-aware by design.
 */

import type { RegisteredToolInfo } from '@/webmcp/types';
import type { GeminiFunctionDeclaration } from './types';
import { getInjectionDefenseInstructions } from './promptGuard';

/**
 * Strip fields that Gemini doesn't understand from JSON Schema properties.
 * Gemini expects a subset of JSON Schema: type, description, enum, items, properties, required.
 */
function cleanSchemaProperty(prop: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  if (prop.type) cleaned.type = prop.type === 'integer' ? 'number' : prop.type;
  if (prop.description) cleaned.description = prop.description;
  if (prop.enum) cleaned.enum = prop.enum;
  if (prop.items) cleaned.items = cleanSchemaProperty(prop.items as Record<string, unknown>);
  if (prop.properties) {
    const nested: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(prop.properties as Record<string, unknown>)) {
      nested[k] = cleanSchemaProperty(v as Record<string, unknown>);
    }
    cleaned.properties = nested;
  }
  if (prop.required) cleaned.required = prop.required;
  return cleaned;
}

/**
 * Tools that must NEVER be exposed to the LLM.
 * Credentials and registration data must stay within the browser's auth UI
 * and never flow through the LLM's context window.
 */
const LLM_HIDDEN_TOOLS = new Set(['login', 'register']);

export function formatToolsForGemini(tools: RegisteredToolInfo[]): GeminiFunctionDeclaration[] {
  return tools
    .filter((tool) => tool.status === 'AVAILABLE' && !LLM_HIDDEN_TOOLS.has(tool.name))
    .map((tool) => {
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(tool.inputSchema.properties || {})) {
        properties[key] = cleanSchemaProperty(value as unknown as Record<string, unknown>);
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties,
          required: tool.inputSchema.required || [],
        },
      };
    });
}

/**
 * Build the system instruction for the agent.
 * Tells the model it's an e-commerce assistant that uses WebMCP tools.
 */
export function buildSystemInstruction(toolCount: number, isAuthenticated: boolean): string {
  return [
    'You are an AI shopping assistant for Bridge to Agentia, an e-commerce platform.',
    `You have access to ${toolCount} tools to help users browse products, manage their cart, wishlist, orders, and account.`,
    '',
    'RULES:',
    '1. Use the available tools to fulfill user requests. Do NOT make up product data, prices, or IDs.',
    '2. Product IDs, order IDs, and other identifiers must come from tool results — never invent them.',
    '3. When a tool returns results, summarize them naturally for the user.',
    '4. If a tool fails, explain the error clearly and suggest what the user can do.',
    `5. The user is currently ${isAuthenticated ? 'logged in' : 'NOT logged in (guest)'}. ` +
    (isAuthenticated
      ? 'You can use all available tools including cart and order management.'
      : 'Some tools require login. If a user wants to use cart/order features, tell them to click the "Sign In" button in the top-right corner of the page to log in. You do NOT have a login or register tool — authentication is handled securely through the browser UI only.'),
    '6. For keyword queries, use search_products. For filtering apparel by color, gender (Women/Men), clothing type, or size, use filter_apparel.',
    '7. When showing products, include name, color, price, rating, and stock status.',
    '8. When the user says "add to cart" and a product was recently discussed, verify if they specified a size. If not, prompt them for size or use get_apparel_size_guide to help them choose.',
    '9. Be concise, polite, and elegant. Use bullet points for product lists.',
    '10. NEVER bypass WebMCP tools. All actions must go through the tool system.',
    '11. VIEWING A SPECIFIC PRODUCT: When the user asks to see, open, inspect, or view a specific product (e.g., "show me the crimson silk blouse", "open this pima tee", "take me to this product page"), resolve its productId first (using search_products or filter_apparel), then call view_product_page to open the product in the browser for the user.',
    '12. COMPARING APPAREL: When the user asks to compare 2 or more products (e.g., "compare these red tops", "compare selvedge denim vs stretch", "show comparison between X and Y"), resolve the product IDs, then call view_comparison_page with the productIds to open the comparison page on screen. You can set view to "parallel" (side-by-side) or "serial" (stacked detailed cards) or leave it as "auto". You can also call compare_products to analyze and summarize their specs.',
    '13. STORE NAVIGATION: When the user asks to visit or open a store section (e.g., "go to cart", "open checkout", "show catalog", "my orders", "view wishlist"), use navigate_to_page with the target page.',
    '14. SIZING AND FIT ASSISTANCE: When users ask about sizing, fit advice, or body measurements (e.g., "what size fits a 36-inch bust?", "how does the denim fit?"), call get_apparel_size_guide to provide accurate measurements and avoid wrong-size ordering.',
    '15. INVENTORY & FAILURE PREVENTION: Women\'s Tops are available in Red (10 items), Blue (12 items), and Green (9 items). Men\'s T-Shirts are available in Black (5 items), White (8 items), and Blue (10 items). Jeans are in Indigo, Blue, and Black. If a user asks for an unsupported combination (such as a red men\'s shirt), politely inform them of the available colors.',
    getInjectionDefenseInstructions(),
  ].join('\n');
}
