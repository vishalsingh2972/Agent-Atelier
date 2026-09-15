'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Link from 'next/link';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Trash2,
  ChevronRight,
  Shield,
  RotateCcw,
} from 'lucide-react';

export default function AccountPage() {
  const { user, openAuthModal, logout } = useAuth();
  const { addToCart } = useCart();
  const { items: wishlistItems, toggleWishlist, fetchWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'profile'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ fullName: '', street: '', city: '', state: '', zipCode: '', country: 'United States', phone: '', isDefault: false });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch('/api/addresses');
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddressForm(false);
        setAddressForm({ fullName: '', street: '', city: '', state: '', zipCode: '', country: 'United States', phone: '', isDefault: false });
        fetchAddresses();
      }
    } catch {
      // Ignore
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await fetch(`/api/addresses?addressId=${addressId}`, { method: 'DELETE' });
      fetchAddresses();
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchWishlist();
      fetchAddresses();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '96px 20px', textAlign: 'center' }}>
        <UserIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 20px' }} />
        <h1 className="h1" style={{ fontSize: '2rem', marginBottom: '12px' }}>
          Please Sign In to Access Your Atelier Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 28px', fontSize: '0.875rem', lineHeight: 1.6 }}>
          View order history, track active shipments, manage your saved garments, and configure your address book.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">
          Sign In to Account
        </button>
      </div>
    );
  }

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;

    setCancellingOrderId(orderId);
    setCancelMessage(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setCancelMessage({ text: `Order ${orderNumber} successfully cancelled.`, success: true });
        fetchOrders();
      } else {
        setCancelMessage({ text: data.message || 'Cancellation failed.', success: false });
      }
    } catch {
      setCancelMessage({ text: 'An unexpected cancellation error occurred.', success: false });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '96px' }}>
      {/* Profile Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.email} • Atelier ID: <code style={{ color: 'var(--text-primary)' }}>{user.id.slice(0, 8)}...</code>
            </div>
          </div>
        </div>

        <button onClick={logout} className="btn btn-outline btn-sm">
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === 'orders' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Package size={16} /> Order History ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          style={{
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'wishlist' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: activeTab === 'wishlist' ? '#f8fafc' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Heart size={16} /> Wishlist ({wishlistItems.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'addresses' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: activeTab === 'addresses' ? '#f8fafc' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MapPin size={16} /> Addresses ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: activeTab === 'profile' ? '#f8fafc' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UserIcon size={16} /> Profile Details
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div>
          {cancelMessage && (
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: cancelMessage.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: cancelMessage.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: cancelMessage.success ? '#34d399' : '#f87171',
                fontSize: '0.875rem',
                marginBottom: '20px',
              }}
            >
              {cancelMessage.text}
            </div>
          )}

          {orders.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '60px 24px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <Package size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                No orders placed yet
              </div>
              <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 20px' }}>
                Items ordered will appear here with live tracking status and cancellation options.
              </p>
              <Link href="/products" className="btn btn-primary btn-sm">
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map((order) => {
                const isProcessing = order.status === 'PROCESSING' || order.status === 'PENDING';
                const isDelivered = order.status === 'DELIVERED';
                const isCancelled = order.status === 'CANCELLED';

                return (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Order Header */}
                    <div
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--bg-surface)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order Number</div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            {order.orderNumber}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Placed</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            ${order.total.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          className={
                            isProcessing
                              ? 'badge badge-featured'
                              : isDelivered
                              ? 'badge badge-stock'
                              : isCancelled
                              ? 'badge badge-out-stock'
                              : 'badge badge-low-stock'
                          }
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          {order.status}
                        </span>

                        {/* Cancel Button if eligible */}
                        {isProcessing && (
                          <button
                            onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                            disabled={cancellingOrderId === order.id}
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            <RotateCcw size={12} />
                            {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {order.items.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.productName}
                              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.productName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Quantity: {item.quantity} • Unit Price: ${item.price.toFixed(2)}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      {/* Shipping info footer */}
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div>
                          Destination: <strong>{order.shippingAddress?.fullName}</strong>, {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                        </div>
                        <div>
                          Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistItems.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '60px 24px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <Heart size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                Your wishlist is empty
              </div>
              <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 20px' }}>
                Save items from the catalog to easily track prices or add them to your cart later.
              </p>
              <Link href="/products" className="btn btn-primary btn-sm">
                Browse Products
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
              }}
            >
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {item.product.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                      }}
                    />
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                    {item.product.brand}
                  </div>
                  <Link
                    href={`/products/${item.product.slug}`}
                    style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}
                  >
                    {item.product.name}
                  </Link>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${item.product.price.toFixed(2)}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      onClick={() => addToCart(item.productId, 1)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, gap: '6px' }}
                    >
                      <ShoppingBag size={14} /> Move to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(item.productId)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '8px' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Addresses */}
      {activeTab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="h3" style={{ color: '#f8fafc', margin: 0 }}>Saved Shipping Addresses</h3>
            <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn btn-primary btn-sm">
              {showAddressForm ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {showAddressForm && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="input"
                    placeholder="John Doe"
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Street Address</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="123 Main Street"
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="San Francisco"
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="CA"
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>ZIP Code</label>
                  <input
                    type="text"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    placeholder="94102"
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    id="defaultAddr"
                  />
                  <label htmlFor="defaultAddr" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Set as default shipping address</label>
                </div>
              </div>
              <button
                onClick={handleSaveAddress}
                disabled={savingAddress || !addressForm.fullName || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '16px' }}
              >
                {savingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          )}

          {addresses.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '60px 24px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <MapPin size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                No saved addresses
              </div>
              <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
                Add a shipping address to speed up checkout and for AI agents to use during order placement.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {addresses.map((addr: any) => (
                <div
                  key={addr.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: addr.isDefault ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    position: 'relative',
                  }}
                >
                  {addr.isDefault && (
                    <span className="badge badge-stock" style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.6875rem', padding: '2px 8px' }}>
                      Default
                    </span>
                  )}
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{addr.fullName}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {addr.street}<br />
                    {addr.city}, {addr.state} {addr.zipCode}<br />
                    {addr.country}
                    {addr.phone && <><br />{addr.phone}</>}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '14px', fontSize: '0.75rem', padding: '4px 10px', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            maxWidth: '600px',
          }}
        >
          <h3 className="h3" style={{ color: '#f8fafc', marginBottom: '20px' }}>
            Account & Security
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name
              </label>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}>
                {user.name}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Email Address
              </label>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}>
                {user.email}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Account Role
              </label>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#34d399', fontWeight: 600 }}>
                {user.role} (WebMCP Authorized)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
