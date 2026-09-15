import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/lib/services/cartService';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to view your cart.',
        },
        { status: 401 }
      );
    }

    const result = await getUserCart(user.id);
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
          message: 'Please log in to add items to your cart.',
        },
        { status: 401 }
      );
    }

    const { productId, quantity = 1 } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PRODUCT_ID', message: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const result = await addToCart(user.id, productId, Number(quantity) || 1);
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

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to update your cart.',
        },
        { status: 401 }
      );
    }

    const { productId, quantity } = await req.json();
    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Product ID and quantity are required.' },
        { status: 400 }
      );
    }

    const result = await updateCartItemQuantity(user.id, productId, Number(quantity));
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
          message: 'Please log in to modify your cart.',
        },
        { status: 401 }
      );
    }

    const productId = req.nextUrl.searchParams.get('productId');
    const clearAll = req.nextUrl.searchParams.get('clear') === 'true';

    if (clearAll) {
      const result = await clearCart(user.id);
      return NextResponse.json(result);
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PRODUCT_ID', message: 'Product ID is required to remove an item.' },
        { status: 400 }
      );
    }

    const result = await removeFromCart(user.id, productId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
