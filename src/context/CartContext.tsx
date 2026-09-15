'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { webmcpRegistry } from '@/webmcp/registry';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  image: string | null;
  stock: number;
  category: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
  itemTotal: number;
}

export interface CartState {
  cartId: string | null;
  itemCount: number;
  items: CartItem[];
  subtotal: number;
  couponDiscount: number;
  productSavings: number;
  shippingFee: number;
  estimatedTax: number;
  estimatedTotal: number;
}

interface CartContextType {
  cart: CartState;
  loading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (productId: string) => Promise<{ success: boolean; message?: string }>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
}

const emptyCart: CartState = {
  cartId: null,
  itemCount: 0,
  items: [],
  subtotal: 0,
  couponDiscount: 0,
  productSavings: 0,
  shippingFee: 0,
  estimatedTax: 0,
  estimatedTotal: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCart({
          cartId: data.cartId,
          itemCount: data.itemCount,
          items: data.items,
          subtotal: data.subtotal,
          couponDiscount: data.couponDiscount,
          productSavings: data.productSavings,
          shippingFee: data.shippingFee,
          estimatedTax: data.estimatedTax,
          estimatedTotal: data.estimatedTotal,
        });
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  useEffect(() => {
    webmcpRegistry.setCartItemCount(user ? cart.itemCount : 0);
  }, [user, cart.itemCount]);

  useEffect(() => webmcpRegistry.onExecution(({ result }) => {
    if (result?.success && result.cart) setCart(result.cart);
  }), []);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
        setIsDrawerOpen(true);
        return { success: true, message: data.message };
      }
      if (data.requiresAuthentication) openAuthModal('login');
      return { success: false, message: data.message || 'Could not add to cart' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Cart error' };
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
        return { success: true, message: data.message };
      }
      if (data.requiresAuthentication) openAuthModal('login');
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err?.message };
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
        return { success: true, message: data.message };
      }
      if (data.requiresAuthentication) openAuthModal('login');
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err?.message };
    }
  };

  const applyCoupon = async (code: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Please log in to apply coupons.' };
    }

    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Coupon error' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        applyCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
