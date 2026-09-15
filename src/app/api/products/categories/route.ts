import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/services/productService';

export async function GET() {
  try {
    const result = await getCategories();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
