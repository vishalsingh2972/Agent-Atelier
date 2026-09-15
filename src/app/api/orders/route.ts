import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserOrders, createOrder } from '@/lib/services/orderService';
import { validateDemoCheckoutSubmission } from '@/lib/checkoutPolicy';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to view your orders.',
        },
        { status: 401 }
      );
    }

    const result = await getUserOrders(user.id);
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
          message: 'Please log in to place an order.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, street, city, state, zipCode, country, phone, couponCode, paymentMethod, demoOrderConfirmed } = body;

    if (!fullName || !street || !city || !state || !zipCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_SHIPPING_FIELDS',
          message: 'Shipping name, street address, city, state, and ZIP code are required.',
        },
        { status: 400 }
      );
    }

    const checkoutPolicy = validateDemoCheckoutSubmission({ paymentMethod, demoOrderConfirmed });
    if (!checkoutPolicy.valid) {
      return NextResponse.json(
        { success: false, error: checkoutPolicy.error, message: checkoutPolicy.message },
        { status: 400 }
      );
    }

    const result = await createOrder(user.id, {
      fullName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      couponCode,
      paymentMethod: checkoutPolicy.paymentMethod,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
