'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Columns,
  List,
  Check,
  X,
  ShoppingBag,
  Star,
  Zap,
  Award,
  Plus,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import '@/styles/compare.css';

interface ProductSpec {
  [key: string]: string;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  images?: string[] | string;
  description?: string;
  category?: {
    name: string;
    slug: string;
  };
  specifications?: ProductSpec | string;
}

interface CompareViewProps {
  initialProducts: ProductItem[];
  initialView?: 'auto' | 'parallel' | 'serial';
}

// Safely extract first image URL without throwing JSON syntax errors
function getFirstImage(product: ProductItem): string {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  if (typeof product.images === 'string') {
    const trimmed = product.images.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {
        // Fall through
      }
    }
    if (trimmed.startsWith('http')) return trimmed;
  }
  return 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80';
}

// Safely parse specifications object
function getSpecs(product: ProductItem): Record<string, string> {
  if (product.specifications && typeof product.specifications === 'object') {
    return product.specifications as Record<string, string>;
  }
  if (typeof product.specifications === 'string') {
    try {
      const parsed = JSON.parse(product.specifications);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

export default function CompareView({ initialProducts, initialView = 'auto' }: CompareViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);

  // Automatic view selection: <= 3 products default to parallel, > 3 default to serial
  const defaultMode = useMemo(() => {
    if (initialView === 'parallel' || initialView === 'serial') {
      return initialView;
    }
    return products.length <= 3 ? 'parallel' : 'serial';
  }, [initialView, products.length]);

  const [viewMode, setViewMode] = useState<'parallel' | 'serial'>(defaultMode);
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Live product search to add to comparison
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Identify Best Value (lowest price) & Top Rated
  const bestPriceId = useMemo(() => {
    if (products.length < 2) return null;
    return [...products].sort((a, b) => Number(a.price) - Number(b.price))[0]?.id;
  }, [products]);

  const topRatedId = useMemo(() => {
    if (products.length < 2) return null;
    return [...products].sort((a, b) => Number(b.rating) - Number(a.rating))[0]?.id;
  }, [products]);

  // Aggregate all unique specification keys across all compared products (excluding HexColor, which is rendered with Color)
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    products.forEach((p) => {
      const specs = getSpecs(p);
      Object.keys(specs).forEach((k) => {
        if (k.toLowerCase() !== 'hexcolor') {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  }, [products]);

  const handleAddToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = (productId: string) => {
    const next = products.filter((p) => p.id !== productId);
    setProducts(next);
    const newIds = next.map((p) => p.id).join(',');
    router.replace(`/compare?ids=${newIds}&view=${viewMode}`, { scroll: false });
  };

  const handleSearchAdd = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=6`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        const existingIds = new Set(products.map((p) => p.id));
        setSearchResults(data.products.filter((p: ProductItem) => !existingIds.has(p.id)));
      }
    } catch {
      // Ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProductToAdd = (product: ProductItem) => {
    const next = [...products, product];
    setProducts(next);
    setSearchQuery('');
    setSearchResults([]);
    const newIds = next.map((p) => p.id).join(',');
    router.replace(`/compare?ids=${newIds}&view=${viewMode}`, { scroll: false });
  };

  // Helper to check if an attribute differs across products
  const isDifferent = (getter: (p: ProductItem) => any) => {
    if (products.length < 2) return false;
    const firstVal = String(getter(products[0]) ?? '').trim().toLowerCase();
    return products.some((p) => String(getter(p) ?? '').trim().toLowerCase() !== firstVal);
  };

  return (
    <div className="compare-page">
      {/* Editorial Header */}
      <div className="compare-header">
        <Link href="/products" className="compare-breadcrumb">
          <ArrowLeft size={13} /> Atelier Archive
        </Link>
        <div className="compare-title-row">
          <div>
            <h1 className="compare-title">
              Garment &amp; Atelier Comparison
              <span className="compare-badge-count">{products.length} models</span>
            </h1>
            <p className="compare-subtitle">
              Inspect tailoring cuts, certified fabrics, color palettes, and sizing across our collection.
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: View Toggle, Filters, Search */}
      <div className="compare-controls-bar">
        <div className="compare-view-toggle">
          <button
            className={`compare-toggle-btn ${viewMode === 'parallel' ? 'active' : ''}`}
            onClick={() => setViewMode('parallel')}
            title="Side-by-side parallel columns (ideal for 2-3 products)"
          >
            <Columns size={14} /> Parallel View
          </button>
          <button
            className={`compare-toggle-btn ${viewMode === 'serial' ? 'active' : ''}`}
            onClick={() => setViewMode('serial')}
            title="Stacked serial cards (ideal for 4+ products or mobile)"
          >
            <List size={14} /> Serial View
          </button>
        </div>

        <div className="compare-filter-toggles">
          <label className="compare-checkbox-label">
            <input
              type="checkbox"
              checked={highlightDiffs}
              onChange={(e) => setHighlightDiffs(e.target.checked)}
            />
            Highlight Differences
          </label>
        </div>
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <div className="compare-empty-box">
          <div className="compare-empty-title">No Garments Selected</div>
          <p className="compare-empty-desc">
            Explore our curated collections below or ask our AI stylist to compare pieces side-by-side.
          </p>
          <div className="compare-suggestions-row">
            <Link href="/products?category=womens-tops" className="compare-suggest-btn">
              Women&apos;s Tops
            </Link>
            <Link href="/products?category=mens-tshirts" className="compare-suggest-btn">
              Men&apos;s Luxury Tees
            </Link>
            <Link href="/products?category=womens-denim" className="compare-suggest-btn">
              Tailored Denim
            </Link>
          </div>
        </div>
      ) : viewMode === 'parallel' ? (
        /* ==========================================================================
           PARALLEL VIEW (Side-by-side Synchronized Columns)
           ========================================================================== */
        <div className="compare-parallel-container">
          <table className="compare-table">
            <thead className="compare-table-head">
              <tr>
                <th className="compare-attribute-col-header">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Garment Attributes
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'none' }}>
                    Comparing {products.length} pieces
                  </div>
                </th>

                {products.map((p) => {
                  const imageSrc = getFirstImage(p);
                  const isBestPrice = p.id === bestPriceId;
                  const isTopRated = p.id === topRatedId;
                  const price = Number(p.price || 0);

                  return (
                    <th key={p.id} className="compare-product-col-header">
                      <div className="compare-card-top">
                        <button
                          className="compare-remove-btn"
                          onClick={() => handleRemove(p.id)}
                          title="Remove from comparison"
                          aria-label={`Remove ${p.name}`}
                        >
                          <X size={14} />
                        </button>

                        <div className="compare-img-box">
                          <img src={imageSrc} alt={p.name} />
                        </div>

                        {/* Winner Badges */}
                        <div>
                          {isBestPrice && (
                            <span className="badge-winner badge-best-price">
                              <Zap size={10} /> Best Value
                            </span>
                          )}
                          {isTopRated && (
                            <span className="badge-winner badge-top-rated">
                              <Award size={10} /> Top Rated
                            </span>
                          )}
                        </div>

                        <div className="compare-prod-brand">{p.brand}</div>
                        <Link href={`/products/${p.slug || p.id}`} className="compare-prod-name">
                          {p.name}
                        </Link>

                        <div className="compare-price-row">
                          <span className="compare-price-final">${price.toFixed(2)}</span>
                          {Boolean(p.discountPercent && p.discountPercent > 0) && (
                            <span className="compare-discount-badge">{p.discountPercent}% OFF</span>
                          )}
                        </div>

                        <button
                          className="compare-btn-add"
                          onClick={() => handleAddToCart(p.id)}
                          disabled={p.stock <= 0 || addingId === p.id}
                        >
                          <ShoppingBag size={14} />
                          {addingId === p.id ? 'Adding...' : p.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* --- Editorial Overview --- */}
              <tr className="compare-section-header">
                <td colSpan={products.length + 1}>Overview &amp; Reviews</td>
              </tr>

              <tr className={`compare-row ${highlightDiffs && isDifferent((p) => p.rating) ? 'diff-highlight' : ''}`}>
                <td className="compare-attr-label">Rating &amp; Reviews</td>
                {products.map((p) => (
                  <td key={p.id}>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {Number(p.rating || 0).toFixed(1)}</span>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      ({p.reviewCount || 0} reviews)
                    </span>
                  </td>
                ))}
              </tr>

              <tr className={`compare-row ${highlightDiffs && isDifferent((p) => p.category?.name) ? 'diff-highlight' : ''}`}>
                <td className="compare-attr-label">Department</td>
                {products.map((p) => (
                  <td key={p.id}>{p.category?.name || 'Luxury Apparel'}</td>
                ))}
              </tr>

              <tr className={`compare-row ${highlightDiffs && isDifferent((p) => p.stock > 0) ? 'diff-highlight' : ''}`}>
                <td className="compare-attr-label">Inventory Status</td>
                {products.map((p) => (
                  <td key={p.id}>
                    {p.stock > 0 ? (
                      <span style={{ color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> In Stock ({p.stock} units)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <X size={14} /> Sold Out
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* --- Garment Specifications Section --- */}
              {allSpecKeys.length > 0 && (
                <>
                  <tr className="compare-section-header">
                    <td colSpan={products.length + 1}>Garment Specifications &amp; Sizing</td>
                  </tr>

                  {allSpecKeys.map((key) => {
                    const diff = isDifferent((p) => getSpecs(p)[key]);
                    return (
                      <tr key={key} className={`compare-row ${highlightDiffs && diff ? 'diff-highlight' : ''}`}>
                        <td className="compare-attr-label">{key}</td>
                        {products.map((p) => {
                          const specs = getSpecs(p);
                          const val = specs[key];

                          // Custom rendering for Color with swatch circle
                          if (key.toLowerCase() === 'color' && val) {
                            const hexColor = specs['HexColor'] || specs['hexColor'] || '#111111';
                            return (
                              <td key={p.id}>
                                <span className="compare-color-val">
                                  <span className="compare-color-dot" style={{ backgroundColor: hexColor }} />
                                  <span>{val}</span>
                                </span>
                              </td>
                            );
                          }

                          // Custom rendering for Available Sizes as chips
                          if (key.toLowerCase() === 'available sizes' && val) {
                            const sizeList = val.split(',').map((s) => s.trim()).filter(Boolean);
                            return (
                              <td key={p.id}>
                                <div className="compare-size-chips">
                                  {sizeList.map((size) => (
                                    <span key={size} className="compare-size-chip">
                                      {size}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={p.id} style={{ color: val ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {val || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ==========================================================================
           SERIAL VIEW (Stacked Cards with Balanced Proportions)
           ========================================================================== */
        <div className="compare-serial-container">
          {products.map((p, idx) => {
            const imageSrc = getFirstImage(p);
            const isBestPrice = p.id === bestPriceId;
            const isTopRated = p.id === topRatedId;
            const specs = getSpecs(p);
            const price = Number(p.price || 0);

            return (
              <div key={p.id} className="compare-serial-card">
                {/* Media Column */}
                <div className="compare-serial-media">
                  <div className="compare-serial-img-wrap">
                    <img src={imageSrc} alt={p.name} />
                  </div>
                  <div>
                    {isBestPrice && (
                      <span className="badge-winner badge-best-price">
                        <Zap size={10} /> Best Value
                      </span>
                    )}
                    {isTopRated && (
                      <span className="badge-winner badge-top-rated">
                        <Award size={10} /> Top Rated
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    ★ <strong style={{ color: '#fbbf24' }}>{Number(p.rating || 0).toFixed(1)}</strong> ({p.reviewCount || 0} reviews)
                  </div>
                  <div>
                    {p.stock > 0 ? (
                      <span style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        ✓ In Stock ({p.stock} units)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        ✗ Sold Out
                      </span>
                    )}
                  </div>
                </div>

                {/* Details & Specifications Column */}
                <div className="compare-serial-details">
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Edition #{idx + 1} • {p.brand}
                    </span>
                    <Link href={`/products/${p.slug || p.id}`} className="compare-serial-title" style={{ display: 'block', marginTop: '4px' }}>
                      {p.name}
                    </Link>
                  </div>

                  {p.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {p.description}
                    </p>
                  )}

                  {/* Specifications Grid */}
                  {Object.keys(specs).length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Garment Specifications
                      </div>
                      <div className="compare-specs-grid">
                        {Object.entries(specs)
                          .filter(([k]) => k.toLowerCase() !== 'hexcolor')
                          .map(([k, v]) => (
                            <div key={k} className="compare-spec-item">
                              <div className="compare-spec-label">{k}</div>
                              <div className="compare-spec-val">
                                {k.toLowerCase() === 'color' ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <span
                                      style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: specs['HexColor'] || specs['hexColor'] || '#111',
                                      }}
                                    />
                                    {v}
                                  </span>
                                ) : (
                                  v
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing & Actions Column */}
                <div className="compare-serial-actions">
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      Price
                    </div>
                    <div className="compare-price-final" style={{ fontSize: '1.5rem' }}>
                      ${price.toFixed(2)}
                    </div>
                    {Boolean(p.discountPercent && p.discountPercent > 0) && (
                      <div style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
                        Save {p.discountPercent}%
                      </div>
                    )}
                  </div>

                  <button
                    className="compare-btn-add"
                    onClick={() => handleAddToCart(p.id)}
                    disabled={p.stock <= 0 || addingId === p.id}
                  >
                    <ShoppingBag size={14} />
                    {addingId === p.id ? 'Adding...' : p.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                  </button>

                  <Link
                    href={`/products/${p.slug || p.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      border: '1px solid var(--border-medium)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <ExternalLink size={12} /> View Full Piece
                  </Link>

                  <button
                    onClick={() => handleRemove(p.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      marginTop: 'auto',
                    }}
                  >
                    Remove from comparison
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Selector Section */}
      <div className="compare-add-section">
        <div className="compare-add-header">
          <div className="compare-add-title">Add Another Piece to Comparison</div>
          <div className="compare-add-desc">
            Search our collection by color, garment type, or brand to compare side-by-side.
          </div>
        </div>

        <div className="compare-add-bar">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="compare-add-input"
            placeholder="Search e.g. 'Silk Blouse', 'Pima Crewneck', 'Raw Indigo Jeans'..."
            value={searchQuery}
            onChange={(e) => handleSearchAdd(e.target.value)}
          />
          {isSearching && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Searching...</span>}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="compare-search-dropdown">
            {searchResults.map((item) => {
              const img = getFirstImage(item);
              const price = Number(item.price || 0);

              return (
                <div
                  key={item.id}
                  className="compare-search-item"
                  onClick={() => handleSelectProductToAdd(item)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={img}
                      alt={item.name}
                      style={{
                        width: '36px',
                        height: '48px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {item.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {item.brand} • {item.category?.name || 'Apparel'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      ${price.toFixed(2)}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        border: '1px solid var(--border-medium)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Plus size={12} /> Add
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
