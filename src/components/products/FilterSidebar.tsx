'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  categories: Array<{ id: string; name: string; slug: string; _count?: { products: number } }>;
}

const FASHION_BRANDS = [
  'Aura Atelier',
  'Maison Luxe',
  'Vogue Minimal',
  'Atelier Sartorial',
  'Iron & Thread',
  'Denim Atelier',
];

const COLORS = [
  { name: 'Red', hex: '#b91c1c' },
  { name: 'Blue', hex: '#1e3a8a' },
  { name: 'Green', hex: '#047857' },
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Indigo', hex: '#312e81' },
];

export default function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentColor = searchParams.get('color') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') === 'true';

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const applyParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    router.push('/products');
  };

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        padding: '24px 20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
          Filter Atelier
        </span>
        <button
          onClick={handleReset}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.6875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* Categories */}
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Department
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => applyParam('category', null)}
            style={{
              padding: '6px 8px',
              border: 'none',
              background: !currentCategory ? 'var(--bg-surface)' : 'transparent',
              color: !currentCategory ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: !currentCategory ? 600 : 400,
              fontSize: '0.8125rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            All Collections
          </button>
          {categories.map((cat) => {
            const isSelected = currentCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => applyParam('category', isSelected ? null : cat.slug)}
                style={{
                  padding: '6px 8px',
                  border: 'none',
                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>{cat.name}</span>
                {cat._count?.products !== undefined && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {cat._count.products}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Signature Color Palette Filter */}
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Color Palette
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {COLORS.map((c) => {
            const isSelected = currentColor.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                onClick={() => applyParam('color', isSelected ? null : c.name)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-medium)',
                  backgroundColor: isSelected ? 'var(--bg-surface)' : '#ffffff',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: c.hex,
                    border: c.name === 'White' ? '1px solid var(--border-medium)' : 'none',
                  }}
                />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Atelier Houses
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {FASHION_BRANDS.map((brand) => {
            const isSelected = currentBrand.toLowerCase() === brand.toLowerCase();
            return (
              <button
                key={brand}
                onClick={() => applyParam('brand', isSelected ? null : brand)}
                style={{
                  padding: '5px 8px',
                  border: 'none',
                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Price Bounds ($)
        </div>
        <form onSubmit={handlePriceApply} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              width: '70px',
              padding: '6px 8px',
              border: '1px solid var(--border-medium)',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{
              width: '70px',
              padding: '6px 8px',
              border: '1px solid var(--border-medium)',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--text-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.6875rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Go
          </button>
        </form>
      </div>

      {/* Stock Filter */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => applyParam('inStock', e.target.checked ? 'true' : null)}
          />
          <span>In Stock Atelier Only</span>
        </label>
      </div>
    </aside>
  );
}
