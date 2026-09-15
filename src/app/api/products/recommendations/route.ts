import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/services/productService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get('productId') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : 4;

    const result = await getRecommendations(productId, category, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
