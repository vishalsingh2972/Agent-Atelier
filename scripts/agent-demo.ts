/**
 * Bridge to Agentia: Autonomous AI Agent Simulation Script
 * 
 * Demonstrates an AI Agent discovering and invoking WebMCP tools
 * on the Bridge to Agentia E-Commerce Platform.
 * 
 * Usage:
 *   npx tsx scripts/agent-demo.ts
 */

import { webmcpRegistry, registerAllWebMCPTools } from '../src/webmcp';
import prisma from '../src/lib/db';

// Ensure global document mock for WebMCP registration in Node environment
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {};
}

async function runAgentDemo() {
  console.log('================================================================');
  console.log('  Bridge to Agentia WebMCP Autonomous Agent Demonstration');
  console.log('================================================================\n');

  // Step 1: Register tools
  registerAllWebMCPTools();
  const tools = webmcpRegistry.getRegisteredToolsInfo();
  console.log(`[Agent] Discovered ${tools.length} WebMCP tools registered on document.modelContext:`);
  tools.forEach((t) => {
    const statusTag = t.status === 'AVAILABLE' ? '[AVAILABLE]' : '[LOGIN_REQUIRED]';
    console.log(`  - ${t.name.padEnd(30)} ${t.permission.padEnd(14)} ${statusTag}`);
  });
  console.log('\n----------------------------------------------------------------');

  // Step 2: User Prompt Simulation
  console.log('[User Prompt]: "Find me a high performance gaming laptop with RTX graphics."\n');

  // Step 3: Tool Execution - search_products
  console.log('[Agent]: Invoking WebMCP tool: search_products({ query: "gaming laptop" })');
  const laptop = await prisma.product.findFirst({
    where: { category: { slug: 'laptops' }, name: { contains: 'Gaming' } },
  });

  if (!laptop) {
    console.log('[Agent Error]: No laptop found in database.');
    return;
  }

  console.log(`[WebMCP Result]: Found "${laptop.name}" ($${laptop.price}) - Stock: ${laptop.stock}, Rating: ${laptop.rating}★\n`);

  // Step 4: Tool Execution - get_product_details
  console.log(`[Agent]: Invoking WebMCP tool: get_product_details({ productId: "${laptop.id}" })`);
  const specs = JSON.parse(laptop.specifications || '{}');
  console.log('[WebMCP Result]: Technical Specifications:', specs);
  console.log('\n----------------------------------------------------------------');

  // Step 5: Unauthenticated Cart Action
  console.log('[User Prompt]: "Great! Please add this laptop to my cart."\n');
  console.log('[Agent]: Attempting WebMCP tool: add_to_cart({ productId, quantity: 1 }) while UNLOGGED');

  const unauthAttempt = await webmcpRegistry.executeTool('add_to_cart', {
    productId: laptop.id,
    quantity: 1,
  });
  console.log('[WebMCP Tool Response (Machine-Readable Auth Barrier)]:');
  console.log(JSON.stringify(unauthAttempt, null, 2));

  console.log('\n[Agent to User]: "I cannot add this to your cart because authentication is required. Please sign in to your account."');
  console.log('\n----------------------------------------------------------------');

  // Step 6: User Logs In
  console.log('[Website Event]: User logs in as Alex Rivera (demo@agentbridge.io)');
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@agentbridge.io' },
  });

  if (!demoUser) {
    console.log('[Error]: Demo user not found.');
    return;
  }

  // Update registry auth state dynamically
  webmcpRegistry.setAuthState(true, {
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role,
  });

  console.log('[WebMCP Registry]: Auth state updated -> Protected tools are now dynamically ENABLED.\n');

  // Step 7: Retry add_to_cart
  console.log('[Agent]: Retrying WebMCP tool: add_to_cart({ productId, quantity: 1 })');

  // Directly simulate database cart mutation
  let cart = await prisma.cart.findUnique({ where: { userId: demoUser.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: demoUser.id } });
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: laptop.id } },
    update: { quantity: { increment: 1 } },
    create: { cartId: cart.id, productId: laptop.id, quantity: 1 },
  });

  console.log(`[WebMCP Result]: Success! Added "${laptop.name}" to cart. Total items: 1\n`);

  // Step 8: Apply Coupon
  console.log('[User Prompt]: "Do we have any active coupons for tech hardware?"\n');
  console.log('[Agent]: Checking promotions & applying coupon TECH20');
  const coupon = await prisma.coupon.findUnique({ where: { code: 'TECH20' } });
  const discountAmount = laptop.price * ((coupon?.discountPercent || 20) / 100);
  const finalTotal = laptop.price - discountAmount;
  console.log(`[WebMCP Result]: Coupon "TECH20" applied! 20% discount saved: $${discountAmount.toFixed(2)}. New total: $${finalTotal.toFixed(2)}\n`);

  // Step 9: Shipping Estimate
  console.log('[Agent]: Invoking WebMCP tool: get_shipping_estimate({ zipCode: "94102" })');
  console.log('[WebMCP Result]: Standard Shipping (3-5 days): $7.99 | Express (1-2 days): $17.58 | Free shipping applied on orders over $75!\n');

  // Step 10: Create Order
  console.log('[User Prompt]: "Looks perfect, go ahead and place the order with my default address."\n');
  console.log('[Agent]: Invoking WebMCP tool: create_order(...)');

  const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: demoUser.id,
      status: 'PROCESSING',
      subtotal: laptop.price,
      discount: discountAmount,
      shippingFee: 0,
      total: finalTotal,
      couponCode: 'TECH20',
      shippingAddress: JSON.stringify({
        fullName: 'Alex Rivera',
        street: '742 Evergreen Terrace',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'United States',
      }),
      items: {
        create: [
          {
            productId: laptop.id,
            productName: laptop.name,
            price: laptop.price,
            quantity: 1,
            image: JSON.parse(laptop.images || '[]')[0] || null,
          },
        ],
      },
    },
  });

  console.log(`[WebMCP Result]: Order created successfully! Order #: ${order.orderNumber}, Status: ${order.status}`);
  console.log(`[Agent to User]: "Your order ${order.orderNumber} for ${laptop.name} has been placed for $${finalTotal.toFixed(2)}. You can track or cancel it under your Account dashboard."\n`);

  console.log('================================================================');
  console.log('  Demonstration Completed Successfully!');
  console.log('================================================================');
}

runAgentDemo()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
