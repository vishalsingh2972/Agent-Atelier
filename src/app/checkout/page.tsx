'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  CreditCard,
  Truck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CheckoutPage() {
  const { user, openAuthModal } = useAuth();
  const { cart, fetchCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    paymentMethod: 'DEMO_CARD',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Auto-fill user information if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
      }));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '96px 20px', textAlign: 'center' }}>
        <h1 className="h1" style={{ fontSize: '2rem', marginBottom: '12px' }}>
          Please Sign In to Checkout
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 24px', fontSize: '0.875rem' }}>
          Sign in or create an account to process your atelier order.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">
          Sign In / Register
        </button>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="container" style={{ padding: '80px 20px', maxWidth: '640px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '48px 36px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircle size={28} />
          </div>

          <h1 className="h1" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Garments Reserved
          </h1>
          <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Dispatch Ref: {completedOrder.orderNumber}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
            Thank you, <strong>{completedOrder.shippingAddress?.fullName || user.name}</strong>. Your atelier order has been officially recorded in our dispatch log.
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '32px',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className="badge badge-stock">{completedOrder.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Billed:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${completedOrder.total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Destination:</span>
              <span>{completedOrder.shippingAddress?.city}, {completedOrder.shippingAddress?.state}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/account" className="btn btn-primary btn-sm">
              View Order Archive
            </Link>
            <Link href="/products" className="btn btn-secondary btn-sm">
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '96px 20px', textAlign: 'center' }}>
        <h1 className="h1" style={{ fontSize: '2rem', marginBottom: '12px' }}>
          Your Shopping Bag is Empty
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.875rem' }}>
          Please add garments to your bag before proceeding to checkout.
        </p>
        <Link href="/products" className="btn btn-primary btn-sm">
          Browse Archive
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, demoOrderConfirmed: true }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data);
        fetchCart();
      } else {
        setError(data.message || 'Could not place order');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected checkout error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '96px' }}>
      <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px' }}>
        <h1 className="h1" style={{ fontSize: '2.4rem' }}>
          Archival Checkout
        </h1>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Confirm dispatch address and demo payment settlement.
        </div>
      </div>

      {/* Safe Demo Mode Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
        }}
      >
        <AlertTriangle size={16} color="var(--text-primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Safe WebMCP Mode:</strong> Simulated checkout environment. No credit cards or real banking transactions will be executed.
        </span>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '0.8125rem',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'flex-start' }}>
          {/* Left Column: Shipping & Payment Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Shipping Address Section */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Truck size={18} color="var(--text-primary)" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Dispatch Destination
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    State / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <CreditCard size={18} color="var(--text-primary)" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Settlement Method
                </h2>
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="DEMO_CARD"
                    checked={formData.paymentMethod === 'DEMO_CARD'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'DEMO_CARD' })}
                    style={{ accentColor: 'var(--text-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Pre-Authorized Sandbox Card (Ending in 4242)
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Simulated instant settlement for agentic testing
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review */}
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Garments in Order ({cart.itemCount})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto' }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {item.product.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{ width: '42px', height: '52px', objectFit: 'cover', borderRadius: '1px' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Qty {item.quantity} × ${item.product.discountedPrice.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    ${item.itemTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated Tax (8%)</span>
                <span>${cart.estimatedTax.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: 'var(--text-primary)',
                }}
              >
                <span>Total</span>
                <span>${cart.estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '8px' }}
            >
              {isSubmitting ? 'Recording Dispatch...' : 'Confirm Archival Order'} <ArrowRight size={14} />
            </button>

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
              <ShieldCheck size={12} color="var(--text-primary)" /> Server-Authoritative WebMCP Protocol
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
