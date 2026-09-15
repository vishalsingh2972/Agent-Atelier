import { NextRequest, NextResponse } from 'next/server';
import { compareProducts } from '@/lib/services/productService';

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get('ids') || '';
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'NO_IDS', message: 'Please provide product IDs to compare.' },
        { status: 400 }
      );
    }

    const result = await compareProducts(ids);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
