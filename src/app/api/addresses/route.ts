import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/addresses — Get saved addresses for authenticated user
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'AUTHENTICATION_REQUIRED', message: 'Please log in to view saved addresses.' },
      { status: 401 }
    );
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, addresses });
}

// POST /api/addresses — Add a new saved address
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'AUTHENTICATION_REQUIRED', message: 'Please log in to add an address.' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { fullName, street, city, state, zipCode, country, phone, isDefault } = body;

  if (!fullName || !street || !city || !state || !zipCode) {
    return NextResponse.json(
      { success: false, error: 'VALIDATION_ERROR', message: 'Full name, street, city, state, and ZIP code are required.' },
      { status: 400 }
    );
  }

  // If setting as default, unset existing defaults
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      fullName,
      street,
      city,
      state,
      zipCode,
      country: country || 'United States',
      phone: phone || null,
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json({ success: true, message: 'Address saved successfully.', address });
}

// PUT /api/addresses — Update an existing address
export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'AUTHENTICATION_REQUIRED', message: 'Please log in to update an address.' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { addressId, fullName, street, city, state, zipCode, country, phone, isDefault } = body;

  if (!addressId) {
    return NextResponse.json(
      { success: false, error: 'VALIDATION_ERROR', message: 'Address ID is required.' },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'NOT_FOUND', message: 'Address not found or access denied.' },
      { status: 404 }
    );
  }

  // If setting as default, unset existing defaults
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: addressId },
    data: {
      ...(fullName && { fullName }),
      ...(street && { street }),
      ...(city && { city }),
      ...(state && { state }),
      ...(zipCode && { zipCode }),
      ...(country && { country }),
      ...(phone !== undefined && { phone }),
      ...(isDefault !== undefined && { isDefault }),
    },
  });

  return NextResponse.json({ success: true, message: 'Address updated successfully.', address });
}

// DELETE /api/addresses — Delete a saved address
export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'AUTHENTICATION_REQUIRED', message: 'Please log in to delete an address.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const addressId = searchParams.get('addressId');

  if (!addressId) {
    return NextResponse.json(
      { success: false, error: 'VALIDATION_ERROR', message: 'Address ID is required.' },
      { status: 400 }
    );
  }

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'NOT_FOUND', message: 'Address not found or access denied.' },
      { status: 404 }
    );
  }

  await prisma.address.delete({ where: { id: addressId } });

  return NextResponse.json({ success: true, message: 'Address deleted successfully.' });
}
