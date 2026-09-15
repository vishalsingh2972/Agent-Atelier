import React from 'react';
import Link from 'next/link';
import {
  getPromotions,
  getCategories,
  DEFAULT_CATEGORIES,
  FALLBACK_FEATURED_PRODUCTS,
} from '@/lib/services/productService';
import ProductCard from '@/components/products/ProductCard';
import {
  ArrowRight,
  Shield,
  Truck,
  RotateCw,
  Sparkles,
  Columns,
} from 'lucide-react';

export const revalidate = 0; // Dynamic rendering

const COLOR_CURATION = [
  { name: 'Crimson & Ruby', color: 'Red', hex: '#b91c1c', dept: "Women's Tops", count: '10 Models' },
  { name: 'Navy & Cobalt', color: 'Blue', hex: '#1e3a8a', dept: 'Tops & T-Shirts', count: '22 Models' },
  { name: 'Emerald & Forest', color: 'Green', hex: '#047857', dept: "Women's Tops", count: '9 Models' },
  { name: 'Obsidian Black', color: 'Black', hex: '#171717', dept: 'Tees & Denim', count: '9 Models' },
  { name: 'Pure Chalk White', color: 'White', hex: '#ffffff', dept: "Men's Luxury Tees", count: '8 Models' },
];

export default async function HomePage() {
  let categories: any[] = DEFAULT_CATEGORIES;
  let featured: any[] = FALLBACK_FEATURED_PRODUCTS;
  let discounted: any[] = [];

  try {
    const [promotions, categoriesData] = await Promise.all([
      getPromotions().catch(() => ({
        success: false,
        featuredProducts: FALLBACK_FEATURED_PRODUCTS,
        discountedProducts: [],
      })),
      getCategories().catch(() => ({
        success: false,
        categories: DEFAULT_CATEGORIES,
      })),
    ]);

    if (categoriesData && categoriesData.categories && categoriesData.categories.length > 0) {
      categories = categoriesData.categories;
    }
    if (promotions && promotions.featuredProducts && promotions.featuredProducts.length > 0) {
      featured = promotions.featuredProducts;
    }
    if (promotions && promotions.discountedProducts) {
      discounted = promotions.discountedProducts;
    }
  } catch (err) {
    console.warn('HomePage server data fetch fallback activated:', err);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '96px' }}>
      {/* =========================================================================
          1. CINEMATIC EDITORIAL HERO SECTION
          ========================================================================= */}
      <section
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#ffffff',
          paddingTop: '64px',
          paddingBottom: '64px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '56px',
              alignItems: 'center',
            }}
          >
            {/* Left: Editorial Narrative */}
            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}
              >
                Edition 01 • Autumn / Winter Atelier
              </div>

              <h1
                className="h1"
                style={{
                  marginBottom: '24px',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.08,
                }}
              >
                The Architecture of <br />
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Pure Tailoring</span>
              </h1>

              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  maxWidth: '520px',
                  marginBottom: '36px',
                }}
              >
                A study in fabric discipline: 100% Mulberry silk charmeuse, long-staple Peruvian pima cotton, and unwashed Japanese shuttle-loom denim. Crafted for human elegance and natively driven by autonomous AI agents via WebMCP.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/products?category=womens-tops" className="btn btn-primary btn-lg">
                  Women&apos;s Collection
                </Link>
                <Link href="/products?category=mens-tshirts" className="btn btn-secondary btn-lg">
                  Men&apos;s Luxury Tees
                </Link>
                <Link href="/compare" className="btn btn-secondary btn-lg" style={{ gap: '8px' }}>
                  <Columns size={15} /> Compare Cuts
                </Link>
              </div>

              {/* Quiet Assurance Row */}
              <div
                style={{
                  display: 'flex',
                  gap: '32px',
                  marginTop: '48px',
                  paddingTop: '28px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={14} color="var(--text-primary)" /> Express Worldwide Delivery
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} color="var(--text-primary)" /> Certified Origin
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCw size={14} color="var(--text-primary)" /> Complimentary 30-Day Returns
                </div>
              </div>
            </div>

            {/* Right: Architectural Hero Spotlight Image */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '125%', // 4:5 editorial portrait ratio
                  backgroundColor: 'var(--bg-secondary)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=1200&q=85"
                  alt="Crimson Silk Charmeuse Blouse"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingTop: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Aura Atelier • Mulberry Silk
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Crimson Silk Charmeuse Blouse
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    $185.00
                  </div>
                  <Link
                    href="/products/crimson-silk-charmeuse-blouse"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--text-primary)',
                      marginTop: '4px',
                      display: 'inline-block',
                    }}
                  >
                    View Piece
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. COLOR CURATION (EDITORIAL PALETTES)
          ========================================================================= */}
      <section className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '18px',
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Curated Palette</div>
            <h2 className="h2">Signature Dye Archives</h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '360px', textAlign: 'right' }}>
            Pure color saturation engineered across Italian silks, Supima jerseys, and raw denim.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {COLOR_CURATION.map((c) => (
            <Link
              key={c.color}
              href={`/products?color=${c.color}`}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  border: c.color === 'White' ? '1px solid var(--border-medium)' : 'none',
                }}
              />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {c.dept} • {c.count}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. ATELIER DEPARTMENTS (SPACIOUS 4-COLUMN CARDS)
          ========================================================================= */}
      <section className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '36px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '18px',
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Catalog Architecture</div>
            <h2 className="h2">Atelier Departments</h2>
          </div>
          <Link
            href="/products"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--text-primary)',
              paddingBottom: '2px',
            }}
          >
            All Apparel ({categories.reduce((acc, c) => acc + (c._count?.products || 0), 0)} pieces)
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '130%', // Tall fashion portrait ratio
                  backgroundColor: 'var(--bg-secondary)',
                  overflow: 'hidden',
                  marginBottom: '16px',
                }}
              >
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {cat._count?.products || 0} Curated Pieces
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {cat.name}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. EDITORIAL SPLIT FEATURE: FABRIC INTEGRITY
          ========================================================================= */}
      <section
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#ffffff',
        }}
      >
        <div className="container" style={{ padding: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              alignItems: 'stretch',
            }}
          >
            {/* Split Image */}
            <div style={{ minHeight: '460px', position: 'relative', backgroundColor: 'var(--bg-secondary)' }}>
              <img
                src="https://images.unsplash.com/photo-1542272604-780c96856592?w=1200&q=85"
                alt="Selvedge Denim Craftsmanship"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>

            {/* Split Editorial Text */}
            <div
              style={{
                padding: '64px 48px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <div className="eyebrow" style={{ marginBottom: '14px' }}>Fabric &amp; Provenance</div>
              <h2
                className="h2"
                style={{
                  marginBottom: '20px',
                  fontWeight: 400,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2,
                }}
              >
                Woven on Traditional Looms. <br />
                <span style={{ fontStyle: 'italic' }}>Tailored Without Compromise.</span>
              </h2>

              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
                Every textile in our archive is selected for tactile longevity. From 14.5 oz unwashed Japanese shuttle-loom selvedge denim to grade-6A Mulberry silk and 280 GSM Peruvian pima cotton. No synthetic fillers, no fleeting silhouettes.
              </p>

              <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>100%</div>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Natural Fibers</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>0.5&quot;</div>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Tailored Tolerance</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>34</div>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>WebMCP Tools</div>
                </div>
              </div>

              <div>
                <Link href="/products?q=selvedge" className="btn btn-primary btn-sm">
                  Discover Selvedge Denim
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FEATURED COLLECTION GRID
          ========================================================================= */}
      {featured.length > 0 && (
        <section className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '36px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '18px',
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: '6px' }}>Curated Selections</div>
              <h2 className="h2">Featured Pieces</h2>
            </div>
            <Link
              href="/products?featured=true"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--text-primary)',
                paddingBottom: '2px',
              }}
            >
              View All Featured
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '32px',
            }}
          >
            {featured.slice(0, 8).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          6. ARCHITECTURAL WEBMCP AGENT SHOWCASE
          ========================================================================= */}
      <section className="container">
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            padding: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'var(--text-muted)',
                marginBottom: '16px',
              }}
            >
              Agentic Protocol • WebMCP 1.0
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.85rem',
                fontWeight: 400,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                lineHeight: 1.25,
              }}
            >
              Designed for Human Taste. <br />
              <span style={{ fontStyle: 'italic' }}>Navigable by Autonomous Agents.</span>
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
              Bridge to Agentia Atelier exposes 34 server-authoritative WebMCP tools directly on <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>document.modelContext</code>. AI agents and shoppers interact with the same database, inventory checks, sizing charts, and cart rules without scrapers.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/compare" className="btn btn-primary btn-sm">
                Open Compare Suite
              </Link>
              <Link href="/products" className="btn btn-secondary btn-sm">
                Explore Catalog
              </Link>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              padding: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
              // WebMCP Agent Interaction Trace:
            </div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              &gt; &quot;Find red Mulberry silk tops for women&quot;
            </div>
            <div style={{ color: 'var(--success)' }}>
              → filter_apparel({`{ gender: "Women", color: "Red" }`})
            </div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '8px' }}>
              &gt; &quot;What size fits a 36-inch bust?&quot;
            </div>
            <div style={{ color: 'var(--info)' }}>
              → get_apparel_size_guide({`{ category: "WomensTops" }`}) → Size M
            </div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '8px' }}>
              &gt; &quot;Compare the first two blouses on screen&quot;
            </div>
            <div style={{ color: '#111111' }}>
              → view_comparison_page({`{ productIds: [...], view: "parallel" }`})
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
