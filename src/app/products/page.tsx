import React from 'react';
import {
  getProducts,
  getCategories,
  DEFAULT_CATEGORIES,
  FALLBACK_FEATURED_PRODUCTS,
} from '@/lib/services/productService';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar from '@/components/products/FilterSidebar';
import Link from 'next/link';
import { Search, ArrowUpDown } from 'lucide-react';

export const revalidate = 0;

interface ProductsPageProps {
  searchParams: {
    q?: string;
    category?: string;
    brand?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    featured?: string;
    promoted?: string;
    sort?: string;
    page?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = searchParams.q;
  const category = searchParams.category;
  const brand = searchParams.brand;
  const color = searchParams.color;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const minRating = searchParams.minRating ? Number(searchParams.minRating) : undefined;
  const inStockOnly = searchParams.inStock === 'true';
  const isFeatured = searchParams.featured === 'true' ? true : undefined;
  const isPromoted = searchParams.promoted === 'true' ? true : undefined;
  const sort = searchParams.sort || 'popularity';
  const page = searchParams.page ? Number(searchParams.page) : 1;

  let products: any[] = [];
  let total = 0;
  let totalPages = 1;
  let categories: any[] = DEFAULT_CATEGORIES;

  try {
    const [productsData, categoriesData] = await Promise.all([
      getProducts({
        query,
        category,
        brand,
        color,
        minPrice,
        maxPrice,
        minRating,
        inStockOnly,
        isFeatured,
        isPromoted,
        sort,
        page,
        limit: 12,
      }).catch(() => ({
        success: false,
        products: FALLBACK_FEATURED_PRODUCTS,
        total: FALLBACK_FEATURED_PRODUCTS.length,
        totalPages: 1,
      })),
      getCategories().catch(() => ({
        success: false,
        categories: DEFAULT_CATEGORIES,
      })),
    ]);

    products = productsData?.products || FALLBACK_FEATURED_PRODUCTS;
    total = productsData?.total ?? products.length;
    totalPages = productsData?.totalPages ?? 1;
    categories = categoriesData?.categories || DEFAULT_CATEGORIES;
  } catch (err) {
    console.warn('ProductsPage fallback activated:', err);
    products = FALLBACK_FEATURED_PRODUCTS;
    total = FALLBACK_FEATURED_PRODUCTS.length;
  }

  const getSortUrl = (newSort: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (color) params.set('color', color);
    if (minPrice) params.set('minPrice', String(minPrice));
    if (maxPrice) params.set('maxPrice', String(maxPrice));
    if (minRating) params.set('minRating', String(minRating));
    if (inStockOnly) params.set('inStock', 'true');
    params.set('sort', newSort);
    return `/products?${params.toString()}`;
  };

  const getPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (color) params.set('color', color);
    if (minPrice) params.set('minPrice', String(minPrice));
    if (maxPrice) params.set('maxPrice', String(maxPrice));
    if (minRating) params.set('minRating', String(minRating));
    if (inStockOnly) params.set('inStock', 'true');
    if (sort) params.set('sort', sort);
    params.set('page', String(newPage));
    return `/products?${params.toString()}`;
  };

  const getTitle = () => {
    if (query) return `Search: "${query}"`;
    if (color) return `${color} Colorway Archive`;
    if (category) {
      const match = categories.find((c) => c.slug === category);
      return match ? match.name : category.replace(/-/g, ' ');
    }
    return 'The Atelier Archive';
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Breadcrumb & Title Masthead */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
        <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)' }}>Atelier</Link> / <span>Catalog</span>
          {category && <span> / {category.replace(/-/g, ' ')}</span>}
          {color && <span> / {color}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 className="h1" style={{ fontSize: '2.4rem', fontWeight: 400, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
              {getTitle()}
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Showing {products.length} of {total} curated garments
            </div>
          </div>

          {/* Minimalist Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={12} /> Sort:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Popularity', value: 'popularity' },
                { label: 'Price: Low-High', value: 'price_asc' },
                { label: 'Price: High-Low', value: 'price_desc' },
                { label: 'Rating', value: 'rating' },
              ].map((s) => {
                const isActive = sort === s.value;
                return (
                  <Link
                    key={s.value}
                    href={getSortUrl(s.value)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: isActive ? '1px solid var(--text-primary)' : '1px solid var(--border-medium)',
                      backgroundColor: isActive ? 'var(--text-primary)' : '#ffffff',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textDecoration: 'none',
                    }}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Wide Grid */}
      <div className="products-layout" style={{ display: 'flex', gap: '36px', alignItems: 'flex-start' }}>
        <FilterSidebar categories={categories} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {products.length === 0 ? (
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
              <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Matching Pieces Found
              </div>
              <p style={{ fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 24px', color: 'var(--text-muted)' }}>
                Try relaxing your filter parameters, searching for a different colorway, or exploring all collections.
              </p>
              <Link href="/products" className="btn btn-primary btn-sm">
                Reset All Filters
              </Link>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '24px',
                  marginBottom: '48px',
                }}
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Minimal Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                    const isCurrent = pNum === page;
                    return (
                      <Link
                        key={pNum}
                        href={getPageUrl(pNum)}
                        style={{
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          border: isCurrent ? '1px solid var(--text-primary)' : '1px solid var(--border-medium)',
                          backgroundColor: isCurrent ? 'var(--text-primary)' : '#ffffff',
                          color: isCurrent ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                        }}
                      >
                        {pNum}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
