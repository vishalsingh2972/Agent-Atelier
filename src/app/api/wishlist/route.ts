import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserWishlist, addToWishlist, removeFromWishlist } from '@/lib/services/wishlistService';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to view your wishlist.',
        },
        { status: 401 }
      );
    }

    const result = await getUserWishlist(user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to add items to your wishlist.',
        },
        { status: 401 }
      );
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PRODUCT_ID', message: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const result = await addToWishlist(user.id, productId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to modify your wishlist.',
        },
        { status: 401 }
      );
    }

    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PRODUCT_ID', message: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const result = await removeFromWishlist(user.id, productId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
