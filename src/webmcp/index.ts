import { webmcpRegistry } from './registry';
import {
  searchProductsTool,
  getProductDetailsTool,
  filterProductsTool,
  sortProductsTool,
  getProductRecommendationsTool,
  compareProductsTool,
  checkProductStockTool,
  getCurrentPromotionsTool,
  getAvailableProductVariantsTool,
} from './tools/productTools';
import {
  addToCartTool,
  getCartTool,
  updateCartQuantityTool,
  removeFromCartTool,
  clearCartTool,
  applyCouponTool,
} from './tools/cartTools';
import {
  addToWishlistTool,
  removeFromWishlistTool,
  getWishlistTool,
} from './tools/wishlistTools';
import {
  getOrderHistoryTool,
  getOrderDetailsTool,
  cancelOrderTool,
  createOrderTool,
} from './tools/orderTools';
import {
  getShippingEstimateTool,
  getSavedAddressesTool,
  updateShippingAddressTool,
} from './tools/shippingTools';
import {
  loginTool,
  registerTool,
  logoutTool,
  getAccountInfoTool,
} from './tools/authTools';
import {
  navigateToPageTool,
  viewProductPageTool,
  viewComparisonPageTool,
} from './tools/navigationTools';
import {
  filterApparelTool,
  getApparelSizeGuideTool,
} from './tools/apparelTools';

export const webmcpTools = [
  // Auth
  loginTool, registerTool, logoutTool, getAccountInfoTool,
  // Navigation
  navigateToPageTool, viewProductPageTool, viewComparisonPageTool,
  // Apparel & Fashion
  filterApparelTool, getApparelSizeGuideTool,
  // Products
  searchProductsTool, getProductDetailsTool, filterProductsTool, sortProductsTool,
  getProductRecommendationsTool, compareProductsTool, checkProductStockTool,
  getCurrentPromotionsTool, getAvailableProductVariantsTool,
  // Cart
  addToCartTool, getCartTool, updateCartQuantityTool, removeFromCartTool,
  clearCartTool, applyCouponTool,
  // Wishlist
  addToWishlistTool, removeFromWishlistTool, getWishlistTool,
  // Orders
  getOrderHistoryTool, getOrderDetailsTool, cancelOrderTool, createOrderTool,
  // Shipping & Account
  getShippingEstimateTool, getSavedAddressesTool, updateShippingAddressTool,
];

export function registerAllWebMCPTools() {
  webmcpTools.forEach((tool) => webmcpRegistry.registerTool(tool));
}

export * from './types';
export * from './registry';
