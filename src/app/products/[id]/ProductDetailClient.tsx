'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  Star,
  Heart,
  Shield,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  CheckCircle,
  Scissors,
} from 'lucide-react';

interface ProductDetailClientProps {
  product: any;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

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

  const [selectedImage, setSelectedImage] = useState<string>(images[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const inWishlist = isInWishlist(product.id);
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

  const discountedPrice = product.discountPercent > 0
    ? product.price * (1 - product.discountPercent / 100)
    : product.price;

  const handleAddToCart = async () => {
    setIsAdding(true);
    const res = await addToCart(product.id, quantity);
    setIsAdding(false);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
      {/* Upper Grid: Editorial Gallery + Purchasing Options */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '48px',
        }}
      >
        {/* Left: Editorial Portrait Images Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '125%', // 4:5 fashion portrait aspect ratio
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <img
              src={selectedImage || images[0]}
              alt={product.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {images.map((img: string, idx: number) => {
                const isSelected = selectedImage === img || (!selectedImage && idx === 0);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    style={{
                      width: '64px',
                      height: '80px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <img src={img} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                {product.brand}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {product.category?.name}
              </span>
            </div>

            <h1 className="h1" style={{ fontSize: '2.2rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
              {product.name}
            </h1>

            {/* Rating and Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309' }}>
                <Star size={14} fill="#b45309" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginLeft: '2px' }}>
                  {product.rating.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({product.reviewCount} client evaluations)
                </span>
              </div>

              <span
                className={
                  product.stock > 10
                    ? 'badge badge-stock'
                    : product.stock > 0
                    ? 'badge badge-low-stock'
                    : 'badge badge-out-stock'
                }
              >
                {product.stock > 10 ? `In Stock (${product.stock} pieces)` : product.stock > 0 ? `Low Inventory (${product.stock} pieces)` : 'Archived'}
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div
            style={{
              padding: '20px 24px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                ${discountedPrice.toFixed(2)}
              </span>
              {product.discountPercent > 0 && (
                <>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="badge badge-discount">
                    -{product.discountPercent}% Seasonal Saving
                  </span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Eligible for complimentary shipping &amp; archival packaging with coupon code <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>SAVE10</code>
            </div>
          </div>

          {/* Editorial Narrative / Description */}
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            {product.description}
          </p>

          {/* Action Row: Quantity + Add to Bag + Wishlist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Quantity Selector */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdding}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, gap: '8px' }}
              >
                {addedSuccess ? <Check size={16} /> : null}
                {isAdding ? 'Securing...' : addedSuccess ? 'Added to Bag' : `Add to Bag • $${(discountedPrice * quantity).toFixed(2)}`}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="btn btn-secondary btn-lg"
                style={{
                  padding: '14px',
                  color: inWishlist ? '#b91c1c' : 'var(--text-primary)',
                  borderColor: inWishlist ? 'rgba(185, 28, 28, 0.4)' : undefined,
                }}
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart size={18} fill={inWishlist ? '#b91c1c' : 'none'} />
              </button>
            </div>

            {addedSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--success)',
                  fontWeight: 600,
                }}
              >
                <CheckCircle size={14} /> Garment successfully reserved in your shopping bag.
              </div>
            )}
          </div>

          {/* Quiet Luxury Service Standards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={14} color="var(--text-primary)" /> Express Worldwide Delivery
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color="var(--text-primary)" /> Authenticity Certified
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={14} color="var(--text-primary)" /> Complimentary 30-Day Returns
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={14} color="var(--text-primary)" /> Master Tailored Finish
            </div>
          </div>
        </div>
      </div>

      {/* Garment Specifications Grid */}
      {Object.keys(specs).length > 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '36px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div className="eyebrow" style={{ marginBottom: '4px' }}>Technical Architecture</div>
            <h3 className="h3">Garment &amp; Fabric Specifications</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {Object.entries(specs).map(([key, val]) => (
              <div
                key={key}
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {key}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Reviews Section */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: '4px' }}>Client Feedback</div>
            <h3 className="h3">Verified Client Evaluations</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Average Evaluation: {product.rating.toFixed(1)} / 5.0 ({product.reviews?.length || 0} reviews)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((r: any) => (
              <div
                key={r.id}
                style={{
                  padding: '18px 20px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {r.userName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.userName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={10} /> Verified Atelier Client
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', color: '#b45309' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < Math.round(r.rating) ? '#b45309' : 'none'}
                        color="#b45309"
                      />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {r.comment}
                </p>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              No written reviews yet for this archival piece.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
