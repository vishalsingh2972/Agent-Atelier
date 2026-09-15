'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, Plus } from 'lucide-react';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    brand: string;
    price: number;
    discountPercent: number;
    rating: number;
    reviewCount: number;
    stock: number;
    images: string[] | string;
    specifications?: string | Record<string, any>;
    category?: { name: string; slug: string } | string;
    isFeatured?: boolean;
    isPromoted?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = isInWishlist(product.id);

  let images: string[] = [];
  if (Array.isArray(product.images)) {
    images = product.images;
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      images = Array.isArray(parsed) ? parsed : [product.images];
    } catch {
      images = product.images.trim() ? [product.images] : [];
    }
  }

  let specs: Record<string, any> = {};
  if (typeof product.specifications === 'string') {
    try {
      specs = JSON.parse(product.specifications) || {};
    } catch {
      specs = {};
    }
  } else if (product.specifications && typeof product.specifications === 'object') {
    specs = product.specifications;
  }

  const color = specs['Color'] || '';
  const hexColor = specs['HexColor'] || '#111111';
  const fabric = specs['Fabric'] || specs['Material'] || '';

  const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&q=80';
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

  const discountedPrice = product.discountPercent > 0
    ? product.price * (1 - product.discountPercent / 100)
    : product.price;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        transition: 'border-color 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* 3:4 Tall Fashion Portrait Image Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '130%', // 3:4 fashion portrait aspect ratio
          backgroundColor: 'var(--bg-secondary)',
          overflow: 'hidden',
        }}
      >
        <Link href={`/products/${product.slug}`} style={{ position: 'absolute', inset: 0 }}>
          <img
            src={mainImage}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Link>

        {/* Minimal Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
          {product.discountPercent > 0 && (
            <span className="badge badge-discount">
              -{product.discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="badge badge-featured">
              Atelier
            </span>
          )}
        </div>

        {/* Minimal Monochrome Wishlist Icon */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '32px',
            height: '32px',
            borderRadius: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: inWishlist ? '#b91c1c' : 'var(--text-primary)',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.15s ease',
          }}
          title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={15} fill={inWishlist ? '#b91c1c' : 'none'} />
        </button>
      </div>

      {/* Editorial Product Details */}
      <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Brand & Fabric */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {product.brand}
          </span>
          {fabric && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {fabric}
            </span>
          )}
        </div>

        {/* Product Title */}
        <Link
          href={`/products/${product.slug}`}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Link>

        {/* Color Swatch Dot */}
        {color && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: hexColor,
                border: color === 'White' ? '1px solid var(--border-medium)' : 'none',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              {color}
            </span>
          </div>
        )}

        {/* Price and Add to Bag Action */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              ${discountedPrice.toFixed(2)}
            </span>
            {product.discountPercent > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product.id, 1)}
            disabled={product.stock === 0}
            style={{
              padding: '6px 12px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (product.stock > 0) {
                e.currentTarget.style.backgroundColor = 'var(--text-primary)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (product.stock > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }
            }}
          >
            <Plus size={12} />
            <span>{product.stock > 0 ? 'Add' : 'Sold'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
