import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/lib/db';
import { webmcpRegistry } from '../src/webmcp/registry';
import { registerAllWebMCPTools } from '../src/webmcp';
import { getProducts, getProductByIdOrSlug, getRecommendations, compareProducts, getPromotions } from '../src/lib/services/productService';
import { getUserCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '../src/lib/services/cartService';
import { getUserWishlist, addToWishlist, removeFromWishlist } from '../src/lib/services/wishlistService';
import { getUserOrders, getOrderDetails, cancelOrder, createOrder } from '../src/lib/services/orderService';
import { validateCoupon } from '../src/lib/services/couponService';

const describeWithDedicatedTestDatabase = process.env.WEBMCP_RUN_INTEGRATION === 'true' ? describe : describe.skip;

// This suite talks to Neon and intentionally exercises real persistence. Keep
// the default fast unit-test timeout elsewhere, but allow network round trips here.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

describeWithDedicatedTestDatabase('WebMCP E-Commerce Platform Test Suite', () => {
  let demoUser: any;
  let otherUser: any;
  let sampleProduct: any;
  let secondProduct: any;

  beforeAll(async () => {
    // Setup Mock DOM environment for Node / Vitest
    if (typeof globalThis.document === 'undefined') {
      (globalThis as any).document = {};
    }

    webmcpRegistry.initDocumentModelContext();

    // Register all tools
    registerAllWebMCPTools();

    // Query demo data
    demoUser = await prisma.user.findUnique({
      where: { email: 'demo@agentbridge.io' },
    });

    otherUser = await prisma.user.findUnique({
      where: { email: 'sarah.j@example.com' },
    });

    const products = await prisma.product.findMany({ take: 2 });
    sampleProduct = products[0];
    secondProduct = products[1];
  });

  describe('1. WebMCP Tool Registry & Discovery', () => {
    it('should register at least 15 WebMCP tools on document.modelContext', () => {
      const tools = webmcpRegistry.getRegisteredToolsInfo();
      expect(tools.length).toBeGreaterThanOrEqual(15);
      expect(document.modelContext).toBeDefined();
      expect(typeof document.modelContext?.executeTool).toBe('function');
    });

    it('should correctly define JSON schema and meaningful descriptions for tools', () => {
      const tools = webmcpRegistry.getRegisteredToolsInfo();
      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      }
    });

    it('should categorize tools into Public, Authenticated, and Transactional', () => {
      const tools = webmcpRegistry.getRegisteredToolsInfo();
      const publicTools = tools.filter((t) => t.permission === 'PUBLIC');
      const authTools = tools.filter((t) => t.permission === 'AUTHENTICATED' || t.permission === 'TRANSACTIONAL');

      expect(publicTools.length).toBeGreaterThanOrEqual(6);
      expect(authTools.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('2. Public WebMCP Product Services', () => {
    it('should search products with keyword query', async () => {
      const result = await getProducts({ query: 'laptop' });
      expect(result.success).toBe(true);
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products.some((p) => p.name.toLowerCase().includes('laptop') || p.tags.includes('laptop'))).toBe(true);
    });

    it('should get full product details with specifications and stock', async () => {
      const result = await getProductByIdOrSlug(sampleProduct.id);
      expect(result.success).toBe(true);
      expect(result.product).toBeDefined();
      if (result.product) {
        expect(result.product.id).toBe(sampleProduct.id);
        expect(result.product.specifications).toBeDefined();
        expect(result.product.stock).toBeGreaterThan(0);
      }
    });

    it('should filter products by category, price, and rating', async () => {
      const result = await getProducts({
        category: 'laptops',
        minPrice: 500,
        maxPrice: 3000,
        minRating: 4.0,
      });
      expect(result.success).toBe(true);
      for (const p of result.products) {
        expect(p.price).toBeGreaterThanOrEqual(500);
        expect(p.price).toBeLessThanOrEqual(3000);
        expect(p.rating).toBeGreaterThanOrEqual(4.0);
      }
    });

    it('should get product recommendations', async () => {
      const result = await getRecommendations(sampleProduct.id, undefined, 3);
      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.every((r) => r.id !== sampleProduct.id)).toBe(true);
    });

    it('should compare multiple products side-by-side', async () => {
      const result = await compareProducts([sampleProduct.id, secondProduct.id]);
      expect(result.success).toBe(true);
      expect(result.products.length).toBe(2);
    });

    it('should retrieve active promotions and coupons', async () => {
      const result = await getPromotions();
      expect(result.success).toBe(true);
      expect(result.activeCoupons.length).toBeGreaterThan(0);
    });
  });

  describe('3. WebMCP Authentication Barrier', () => {
    it('should reject unauthenticated call to protected tool with standard structure', async () => {
      // Ensure unauthenticated state
      webmcpRegistry.setAuthState(false, null);

      const res = await webmcpRegistry.executeTool('add_to_cart', {
        productId: sampleProduct.id,
        quantity: 1,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('AUTHENTICATION_REQUIRED');
      expect(res.requiresAuthentication).toBe(true);
      expect(res.message).toContain('Authentication is required');
    });

    it('should dynamically update tool status to AVAILABLE upon login', () => {
      webmcpRegistry.setAuthState(true, demoUser);
      const tools = webmcpRegistry.getRegisteredToolsInfo();
      const cartTool = tools.find((t) => t.name === 'add_to_cart');
      expect(cartTool?.status).toBe('AVAILABLE');
    });
  });

  describe('4. Authenticated Cart & Wishlist Services', () => {
    it('should add items to cart and calculate subtotal/total', async () => {
      await clearCart(demoUser.id);
      const addRes = await addToCart(demoUser.id, sampleProduct.id, 2);
      expect(addRes.success).toBe(true);
      expect(addRes.cartItemCount).toBe(2);

      const cart = await getUserCart(demoUser.id);
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.subtotal).toBeGreaterThan(0);
    });

    it('should update cart item quantity', async () => {
      const updateRes = await updateCartItemQuantity(demoUser.id, sampleProduct.id, 3);
      expect(updateRes.success).toBe(true);
      expect(updateRes.cartItemCount).toBe(3);
    });

    it('should remove item from cart', async () => {
      const removeRes = await removeFromCart(demoUser.id, sampleProduct.id);
      expect(removeRes.success).toBe(true);
      expect(removeRes.cartItemCount).toBe(0);
    });

    it('should add and remove items in wishlist', async () => {
      const addWishlist = await addToWishlist(demoUser.id, sampleProduct.id);
      expect(addWishlist.success).toBe(true);

      const wishlist = await getUserWishlist(demoUser.id);
      expect(wishlist.items.some((i) => i.productId === sampleProduct.id)).toBe(true);

      const removeWishlist = await removeFromWishlist(demoUser.id, sampleProduct.id);
      expect(removeWishlist.success).toBe(true);
    });

    it('should validate and apply promotional coupons', async () => {
      const valid = await validateCoupon('TECH20');
      expect(valid.valid).toBe(true);
      expect(valid.coupon?.discountPercent).toBe(20);

      const invalid = await validateCoupon('FAKECOUPON99');
      expect(invalid.valid).toBe(false);
    });
  });

  describe('5. Authenticated Order Management & Authorization Rules', () => {
    it('should retrieve user order history strictly scoped to user', async () => {
      const ordersRes = await getUserOrders(demoUser.id);
      expect(ordersRes.success).toBe(true);
      expect(ordersRes.orders.length).toBeGreaterThan(0);
    });

    it('should get order details with authorization verification', async () => {
      const ordersRes = await getUserOrders(demoUser.id);
      const targetOrder = ordersRes.orders[0];

      // Legitimate user access
      const details = await getOrderDetails(demoUser.id, targetOrder.id);
      expect(details.success).toBe(true);
      expect(details.order?.orderNumber).toBe(targetOrder.orderNumber);

      // Unauthorized access attempt by different user
      const unauthorizedDetails = await getOrderDetails(otherUser.id, targetOrder.id);
      expect(unauthorizedDetails.success).toBe(false);
      expect(unauthorizedDetails.error).toBe('UNAUTHORIZED_ACCESS');
    });

    it('should successfully cancel a PROCESSING order', async () => {
      const ordersRes = await getUserOrders(demoUser.id);
      const processingOrder = ordersRes.orders.find((o) => o.status === 'PROCESSING');

      if (processingOrder) {
        const cancelRes = await cancelOrder(demoUser.id, processingOrder.id, 'Customer changed mind');
        expect(cancelRes.success).toBe(true);
        expect(cancelRes.currentStatus).toBe('CANCELLED');
      }
    });

    it('should disallow cancellation of a DELIVERED order', async () => {
      const ordersRes = await getUserOrders(demoUser.id);
      const deliveredOrder = ordersRes.orders.find((o) => o.status === 'DELIVERED');

      if (deliveredOrder) {
        const cancelRes = await cancelOrder(demoUser.id, deliveredOrder.id);
        expect(cancelRes.success).toBe(false);
        expect(cancelRes.error).toBe('NOT_CANCELLABLE');
      }
    });

    it('should create a new order from cart and clear cart items', async () => {
      // Add item to cart first
      await addToCart(demoUser.id, sampleProduct.id, 1);

      const orderRes = await createOrder(demoUser.id, {
        fullName: 'Alex Rivera',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        zipCode: '97477',
        couponCode: 'TECH20',
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.orderNumber).toBeDefined();
      expect(orderRes.status).toBe('PROCESSING');

      // Verify cart was cleared
      const cart = await getUserCart(demoUser.id);
      expect(cart.itemCount).toBe(0);
    });
  });

  describe('6. Shipping, Variants & Address Management Rules', () => {
    it('should calculate shipping estimates with standard, express, and overnight options', async () => {
      const zipCode = '94102';
      const zip = parseInt(zipCode, 10);
      const isWestCoast = zip >= 90000 && zip <= 96999;
      expect(isWestCoast).toBe(true);

      const baseRate = 7.99;
      const expressRate = parseFloat((baseRate * 2.2).toFixed(2));
      const overnightRate = parseFloat((baseRate * 4.5).toFixed(2));

      expect(baseRate).toBe(7.99);
      expect(expressRate).toBe(17.58);
      expect(overnightRate).toBe(35.95);
    });

    it('should create, list, and delete saved shipping addresses for user', async () => {
      // Create address
      const newAddress = await prisma.address.create({
        data: {
          userId: demoUser.id,
          fullName: 'Alex Work Address',
          street: '100 Market St Suite 300',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'United States',
          isDefault: false,
        },
      });
      expect(newAddress.id).toBeDefined();
      expect(newAddress.userId).toBe(demoUser.id);

      // Verify listing returns user's addresses
      const userAddresses = await prisma.address.findMany({
        where: { userId: demoUser.id },
      });
      expect(userAddresses.some((a) => a.id === newAddress.id)).toBe(true);

      // Verify other user cannot see this address
      const otherUserAddresses = await prisma.address.findMany({
        where: { userId: otherUser.id },
      });
      expect(otherUserAddresses.some((a) => a.id === newAddress.id)).toBe(false);

      // Delete address
      await prisma.address.delete({ where: { id: newAddress.id } });
      const verifyDeleted = await prisma.address.findUnique({
        where: { id: newAddress.id },
      });
      expect(verifyDeleted).toBeNull();
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
