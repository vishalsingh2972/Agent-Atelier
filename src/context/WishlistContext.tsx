'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    price: number;
    discountPercent: number;
    rating: number;
    stock: number;
    category: string;
    image: string | null;
  };
}

interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<{ success: boolean; message?: string }>;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Please log in to manage your wishlist.' };
    }

    const inList = isInWishlist(productId);

    try {
      if (inList) {
        const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success && data.wishlist) {
          setItems(data.wishlist.items);
          return { success: true, message: 'Removed from wishlist' };
        }
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (data.success && data.wishlist) {
          setItems(data.wishlist.items);
          return { success: true, message: 'Added to wishlist' };
        }
      }
      return { success: false, message: 'Could not update wishlist' };
    } catch (err: any) {
      return { success: false, message: err?.message };
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount: items.length,
        loading,
        isInWishlist,
        toggleWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
