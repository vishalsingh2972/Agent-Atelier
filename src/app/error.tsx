'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Sparkles, Home, ShoppingBag } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Atelier Server Component Error Caught by Boundary:', error);
  }, [error]);

  return (
    <div
      className="container"
      style={{
        padding: '96px 20px',
        maxWidth: '680px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          margin: '0 auto 24px',
        }}
      >
        <Sparkles size={24} />
      </div>

      <div
        style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          marginBottom: '12px',
        }}
      >
        Atelier Notice • Edition 01
      </div>

      <h1
        className="h1"
        style={{
          fontSize: '2.4rem',
          fontWeight: 400,
          marginBottom: '16px',
          color: 'var(--text-primary)',
        }}
      >
        Temporary Collection Interruption
      </h1>

      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '32px',
          maxWidth: '520px',
          marginInline: 'auto',
        }}
      >
        The atelier experienced a momentary rendering delay while connecting to the archival database. Our automated fallbacks are active.
      </p>

      {error.digest && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-block',
            marginBottom: '36px',
          }}
        >
          Diagnostic Digest: {error.digest}
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => reset()}
          className="btn btn-primary btn-lg"
          style={{ gap: '8px' }}
        >
          <RotateCw size={14} /> Refresh Atelier
        </button>
        <Link href="/" className="btn btn-secondary btn-lg" style={{ gap: '8px' }}>
          <Home size={14} /> Return Home
        </Link>
        <Link href="/products" className="btn btn-secondary btn-lg" style={{ gap: '8px' }}>
          <ShoppingBag size={14} /> Browse Archive
        </Link>
      </div>
    </div>
  );
}
