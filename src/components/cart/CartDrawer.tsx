'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeFromCart, applyCoupon, loading } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg(null);
    const res = await applyCoupon(couponCode.trim());
    setCouponMsg({ text: res.message || '', success: res.success });
    setApplyingCoupon(false);
  };

  return (
    <div className="modal-overlay" onClick={closeDrawer} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '440px',
          maxWidth: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.08)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        <style jsx>{`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={18} color="var(--text-primary)" />
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Shopping Bag
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {cart.itemCount} {cart.itemCount === 1 ? 'garment' : 'garments'}
              </div>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Your bag is empty
              </div>
              <p style={{ fontSize: '0.8125rem', maxWidth: '280px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                Explore the latest silk blouses, luxury tees, and tailored denim.
              </p>
              <Link href="/products" onClick={closeDrawer} className="btn btn-primary btn-sm">
                Explore Atelier
              </Link>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{
                      width: '70px',
                      height: '85px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                    {item.product.brand}
                  </div>
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={closeDrawer}
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px',
                    }}
                  >
                    {item.product.name}
                  </Link>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    ${item.product.discountedPrice.toFixed(2)}
                    {item.product.discountPercent > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          textDecoration: 'line-through',
                          marginLeft: '6px',
                        }}
                      >
                        ${item.product.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Quantity and Remove */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
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
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '16px', textAlign: 'center', color: 'var(--text-primary)' }}>
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
                        <Plus size={11} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove piece from bag"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.items.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Tag size={13} color="#8c8883" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Coupon (e.g. SAVE10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '30px', paddingBlock: '6px', fontSize: '0.75rem', textTransform: 'uppercase' }}
                />
              </div>
              <button
                type="submit"
                disabled={applyingCoupon || !couponCode}
                className="btn btn-secondary btn-sm"
              >
                Apply
              </button>
            </form>

            {couponMsg && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: couponMsg.success ? 'var(--success)' : 'var(--danger)',
                  fontWeight: 500,
                }}
              >
                {couponMsg.text}
              </div>
            )}

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Seasonal Saving</span>
                  <span>-${cart.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>{cart.shippingFee === 0 ? 'COMPLIMENTARY' : `$${cart.shippingFee.toFixed(2)}`}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span>Estimated Total</span>
                <span>${cart.estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                View Bag
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                Checkout <ArrowRight size={13} />
              </Link>
            </div>

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
              <ShieldCheck size={12} color="var(--text-primary)" /> Secure WebMCP-Validated Checkout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
