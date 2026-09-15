import React from 'react';
import { notFound } from 'next/navigation';
import { getProductByIdOrSlug, getRecommendations } from '@/lib/services/productService';
import ProductDetailClient from './ProductDetailClient';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';

export const revalidate = 0;

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const result = await getProductByIdOrSlug(params.id);

  if (!result.success || !result.product) {
    notFound();
  }

  const product = result.product;
  const recommendationsResult = await getRecommendations(product.id, product.category?.slug, 4);
  const recommendations = recommendationsResult.recommendations || [];

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
      {/* Editorial Breadcrumb */}
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '28px' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Atelier</Link> /{' '}
        <Link href="/products" style={{ color: 'var(--text-secondary)' }}>Catalog</Link> /{' '}
        <Link href={`/products?category=${product.category?.slug}`} style={{ color: 'var(--text-secondary)' }}>
          {product.category?.name}
        </Link>{' '}
        / <span>{product.name}</span>
      </div>

      {/* Interactive Detail Section */}
      <ProductDetailClient product={product} />

      {/* Curated Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '80px', paddingTop: '48px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ marginBottom: '32px' }}>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Curated Pairings</div>
            <h2 className="h2">Complementary Pieces</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '24px',
            }}
          >
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
