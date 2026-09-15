'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export default function CartPage() {
  const { user, openAuthModal } = useAuth();
  const { cart, updateQuantity, removeFromCart, applyCoupon, loading } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [applying, setApplying] = useState(false);

  if (!user) {
    return (
      <div className="container" style={{ padding: '96px 20px', textAlign: 'center' }}>
        <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 20px' }} />
        <h1 className="h1" style={{ fontSize: '2rem', marginBottom: '12px' }}>
          Please Sign In to View Your Bag
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 28px', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Sign in or create an account to view and manage your selected garments across all devices.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponMsg(null);
    const res = await applyCoupon(couponInput.trim());
    setCouponMsg({ text: res.message || '', success: res.success });
    setApplying(false);
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '96px' }}>
      {/* Title */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px' }}>
        <h1 className="h1" style={{ fontSize: '2.4rem' }}>
          Shopping Bag ({cart.itemCount} {cart.itemCount === 1 ? 'garment' : 'garments'})
        </h1>
      </div>

      {cart.items.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '64px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <ShoppingBag size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Your Shopping Bag is Empty
          </div>
          <p style={{ fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 24px', color: 'var(--text-muted)' }}>
            Discover Mulberry silk blouses, Supima cotton tees, and Japanese selvedge denim in our archive.
          </p>
          <Link href="/products" className="btn btn-primary btn-sm">
            Explore Atelier Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'flex-start' }}>
          {/* Left: Items Table */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              {cart.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    borderBottom: idx < cart.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    gap: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Thumbnail & Product Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '220px', flex: 1 }}>
                    {item.product.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        style={{
                          width: '72px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
                        {item.product.brand}
                      </div>
                      <Link
                        href={`/products/${item.product.slug}`}
                        style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', margin: '2px 0 4px' }}
                      >
                        {item.product.name}
                      </Link>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${item.product.discountedPrice.toFixed(2)}
                        {item.product.discountPercent > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>
                            ${item.product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Adjuster */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '3px 8px',
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Total & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '80px', textAlign: 'right' }}>
                      ${item.itemTotal.toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove piece"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
              <Link href="/products" className="btn btn-outline btn-sm">
                &larr; Continue Perusing Archive
              </Link>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div
            style={{
              width: '380px',
              maxWidth: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Order Summary
            </h2>

            {/* Coupon Application */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Promo / Coupon Code
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={13} color="#8c8883" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  <input
                    type="text"
                    placeholder="e.g. SAVE10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '32px', fontSize: '0.75rem', textTransform: 'uppercase' }}
                  />
                </div>
                <button type="submit" disabled={applying || !couponInput} className="btn btn-secondary btn-sm">
                  Apply
                </button>
              </div>
              {couponMsg && (
                <div style={{ fontSize: '0.75rem', color: couponMsg.success ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
                  {couponMsg.text}
                </div>
              )}
            </form>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Coupon Discount</span>
                  <span>-${cart.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {cart.productSavings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Seasonal Savings</span>
                  <span>-${cart.productSavings.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>{cart.shippingFee === 0 ? 'COMPLIMENTARY' : `$${cart.shippingFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated Tax (8%)</span>
                <span>${cart.estimatedTax.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: 'var(--text-primary)',
                }}
              >
                <span>Estimated Total</span>
                <span>${cart.estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link href="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', gap: '8px' }}>
              Proceed to Secure Checkout <ArrowRight size={14} />
            </Link>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
              }}
            >
              <ShieldCheck size={13} color="var(--text-primary)" /> Safe WebMCP-Powered Checkout Mode
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
