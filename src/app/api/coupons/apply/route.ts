import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateCoupon } from '@/lib/services/couponService';
import { getUserCart } from '@/lib/services/cartService';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to apply coupons.',
        },
        { status: 401 }
      );
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'MISSING_CODE', message: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const validation = await validateCoupon(code);
    if (!validation.valid || !validation.coupon) {
      return NextResponse.json(
        { success: false, error: validation.error || 'INVALID_COUPON', message: validation.message },
        { status: 400 }
      );
    }

    const updatedCart = await getUserCart(user.id, validation.coupon.discountPercent);

    return NextResponse.json({
      success: true,
      message: validation.message,
      coupon: validation.coupon,
      cart: updatedCart,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
