import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { cancelOrder } from '@/lib/services/orderService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuthentication: true,
          message: 'Please log in to cancel an order.',
        },
        { status: 401 }
      );
    }

    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body?.reason;
    } catch {
      // Empty body is okay
    }

    const result = await cancelOrder(user.id, params.id, reason);
    if (!result.success) {
      const statusCode = result.error === 'UNAUTHORIZED_ACCESS' ? 403 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
