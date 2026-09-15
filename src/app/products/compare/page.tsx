import React from 'react';
import { compareProducts, getProducts } from '@/lib/services/productService';
import CompareView from '@/components/products/CompareView';

export const revalidate = 0;

interface ComparePageProps {
  searchParams: {
    ids?: string;
    view?: 'auto' | 'parallel' | 'serial';
  };
}

export default async function ProductsComparePage({ searchParams }: ComparePageProps) {
  let ids = searchParams.ids ? searchParams.ids.split(',').map((s) => s.trim()).filter(Boolean) : [];

  if (ids.length === 0) {
    const defaultProds = await getProducts({ limit: 3 });
    ids = defaultProds.products.map((p) => p.id);
  }

  const result = await compareProducts(ids);
  const products = (result.products || []) as any[];

  return <CompareView initialProducts={products} initialView={searchParams.view} />;
}
