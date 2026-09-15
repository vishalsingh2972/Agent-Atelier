import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '80px',
        padding: '64px 0 36px 0',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '48px',
            marginBottom: '56px',
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  display: 'block',
                }}
              >
                Bridge to Agentia
              </span>
              <span
                style={{
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Atelier
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '280px', marginBottom: '20px' }}>
              A contemporary luxury fashion house crafted for human elegance and natively navigable by autonomous browser agents via WebMCP.
            </p>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              WebMCP 1.0 Compliant • 34 Native Tools
            </div>
          </div>

          {/* Collections */}
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Collections
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <li>
                <Link href="/products?category=womens-tops" style={{ color: 'var(--text-secondary)' }}>
                  Women&apos;s Tops &amp; Silk Blouses
                </Link>
              </li>
              <li>
                <Link href="/products?category=mens-tshirts" style={{ color: 'var(--text-secondary)' }}>
                  Men&apos;s Luxury Supima Tees
                </Link>
              </li>
              <li>
                <Link href="/products?category=womens-jeans" style={{ color: 'var(--text-secondary)' }}>
                  Women&apos;s Premium Denim
                </Link>
              </li>
              <li>
                <Link href="/products?category=mens-jeans" style={{ color: 'var(--text-secondary)' }}>
                  Men&apos;s Tailored Selvedge Denim
                </Link>
              </li>
              <li>
                <Link href="/compare" style={{ color: 'var(--text-secondary)' }}>
                  Garment Comparison Suite
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Services */}
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Client Services
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <li>
                <Link href="/products" style={{ color: 'var(--text-secondary)' }}>
                  Archival Sizing Guide
                </Link>
              </li>
              <li>
                <Link href="/account?tab=orders" style={{ color: 'var(--text-secondary)' }}>
                  Order Archive &amp; Dispatch Status
                </Link>
              </li>
              <li>
                <Link href="/cart" style={{ color: 'var(--text-secondary)' }}>
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link href="/account?tab=wishlist" style={{ color: 'var(--text-secondary)' }}>
                  Saved Garments Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* WebMCP Protocol Architecture */}
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Agentic Protocol
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
              Exposing server-authoritative tools on <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>document.modelContext</code>.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              • 34 Registered WebMCP Tools <br />
              • Zero Screen-Scraping Requirement <br />
              • Human &amp; AI Native Parity
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingTop: '28px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} Bridge to Agentia Atelier. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>USD ($)</span>
            <span>English (US)</span>
            <span>Privacy &amp; Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
