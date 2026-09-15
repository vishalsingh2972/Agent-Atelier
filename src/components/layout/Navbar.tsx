'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAskAI } from '@/context/AskAIContext';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  LogOut,
  Package,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, openAuthModal, logout } = useAuth();
  const { cart, openDrawer } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { togglePanel: toggleAskAI } = useAskAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close suggestions and user menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setSuggestions(data.products);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 800,
        backgroundColor: 'rgba(251, 250, 248, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
          gap: '24px',
        }}
      >
        {/* Left: Mobile Hamburger & Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mobile Hamburger Toggle (Visible on < 900px) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="navbar-mobile-toggle"
            aria-label="Toggle Navigation Menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'none',
              padding: '6px',
            }}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Architectural Brand Wordmark */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              Bridge to Agentia
            </span>
            <span
              style={{
                fontSize: '0.5625rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Atelier
            </span>
          </Link>
        </div>

        {/* Center: Desktop Department Links */}
        <nav
          className="navbar-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}
        >
          <Link
            href="/products?category=womens-tops"
            className="nav-editorial-link"
          >
            Women
          </Link>
          <Link
            href="/products?category=mens-tshirts"
            className="nav-editorial-link"
          >
            Men
          </Link>
          <Link
            href="/products?q=jeans"
            className="nav-editorial-link"
          >
            Denim
          </Link>
          <Link
            href="/compare"
            className="nav-editorial-link"
          >
            Compare
          </Link>
          <Link
            href="/products"
            className="nav-editorial-link"
          >
            Catalog
          </Link>
        </nav>

        {/* Right Actions: Search + Ask AI + Wishlist + Cart + Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Desktop Search Bar */}
          <div ref={searchRef} className="navbar-search-desktop" style={{ width: '220px', position: 'relative' }}>
            <form onSubmit={handleSearchSubmit}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="#8c8883"
                  style={{ position: 'absolute', left: '10px', top: '10px' }}
                />
                <input
                  type="text"
                  placeholder="Search atelier..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.04em',
                    outline: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && (suggestions.length > 0 || isSearching) && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                  zIndex: 850,
                }}
              >
                {isSearching && (
                  <div style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Searching collection...
                  </div>
                )}
                {suggestions.map((p) => {
                  const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                  const price = p.discountPercent > 0 ? p.price * (1 - p.discountPercent / 100) : p.price;
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                      }}
                    >
                      {img && (
                        <img
                          src={img}
                          alt={p.name}
                          style={{ width: '28px', height: '36px', objectFit: 'cover', borderRadius: '1px' }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          ${price.toFixed(2)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Understated Rectangular Ask AI Button */}
          <button
            onClick={toggleAskAI}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--text-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 0.15s ease',
            }}
            title="Open Conversational WebMCP Shopping Assistant"
          >
            <Sparkles size={12} />
            <span>Ask AI</span>
          </button>

          {/* Wishlist Link */}
          <Link
            href={user ? '/account?tab=wishlist' : '#'}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openAuthModal('login');
              }
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              color: 'var(--text-primary)',
            }}
            title="Wishlist"
          >
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: 'var(--text-primary)',
                  color: '#ffffff',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                openDrawer();
              }
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            title="Shopping Bag"
          >
            <ShoppingBag size={18} />
            {cart.itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: 'var(--text-primary)',
                  color: '#ffffff',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cart.itemCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth Action */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                <UserIcon size={18} />
                <ChevronDown size={12} />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                }}
                title="Sign In"
              >
                <UserIcon size={18} />
              </button>
            )}

            {/* User Dropdown Menu */}
            {isUserMenuOpen && user && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '200px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 850,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {user.email}
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <Link
                    href="/account?tab=profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    <UserIcon size={14} /> Profile &amp; Addresses
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    <Package size={14} /> Orders Archive
                  </Link>
                  <Link
                    href="/account?tab=wishlist"
                    onClick={() => setIsUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    <Heart size={14} /> Saved Items
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 0' }}>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer (Visible when hamburger is open) */}
      {isMobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color="#8c8883"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
            </div>
          </form>

          {/* Mobile Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
            <Link
              href="/products?category=womens-tops"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Women&apos;s Tops
            </Link>
            <Link
              href="/products?category=mens-tshirts"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Men&apos;s Luxury Tees
            </Link>
            <Link
              href="/products?q=jeans"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Tailored Denim
            </Link>
            <Link
              href="/compare"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Compare Cuts
            </Link>
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Full Catalog
            </Link>
          </div>
        </div>
      )}

      {/* Embedded CSS for responsive breakpoint handling */}
      <style jsx>{`
        .nav-editorial-link {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-secondary);
          position: relative;
          padding: 4px 0;
        }
        .nav-editorial-link:hover {
          color: var(--text-primary);
        }
        .nav-editorial-link:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background-color: var(--text-primary);
          transition: width 0.2s ease;
        }
        .nav-editorial-link:hover:after {
          width: 100%;
        }

        @media (max-width: 900px) {
          .navbar-desktop-nav {
            display: none !important;
          }
          .navbar-search-desktop {
            display: none !important;
          }
          :global(.navbar-mobile-toggle) {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
