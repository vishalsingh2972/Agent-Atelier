import { NextRequest, NextResponse } from 'next/server';
import { getProductByIdOrSlug } from '@/lib/services/productService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getProductByIdOrSlug(params.id);
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
