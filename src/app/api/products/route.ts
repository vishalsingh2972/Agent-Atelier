import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/services/productService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const color = searchParams.get('color') || undefined;
    const gender = searchParams.get('gender') || undefined;
    const size = searchParams.get('size') || undefined;
    const apparelCategory = searchParams.get('apparelCategory') || undefined;
    const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minRating = searchParams.has('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const inStockOnly = searchParams.get('inStock') === 'true' || searchParams.get('inStockOnly') === 'true';
    const isFeatured = searchParams.has('featured') ? searchParams.get('featured') === 'true' : undefined;
    const isPromoted = searchParams.has('promoted') ? searchParams.get('promoted') === 'true' : undefined;
    const sort = searchParams.get('sort') || undefined;
    const page = searchParams.has('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : 12;

    const result = await getProducts({
      query,
      category,
      brand,
      color,
      gender,
      size,
      apparelCategory,
      minPrice,
      maxPrice,
      minRating,
      inStockOnly,
      isFeatured,
      isPromoted,
      sort,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
