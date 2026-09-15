import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSessionToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isDemoAccount = normalizedEmail === 'demo@agentbridge.io';
    const isAcceptedDemoPassword =
      password === 'password123' ||
      password === 'demo1234' ||
      password === 'demo' ||
      password === 'admin123';

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr) {
      console.warn('Database query during login failed (evaluating demo fallback):', dbErr);
    }

    // Auto-provision demo account if missing from database
    if (!user && isDemoAccount) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      try {
        user = await prisma.user.create({
          data: {
            email: 'demo@agentbridge.io',
            name: 'Alex Rivera',
            passwordHash,
            role: 'CUSTOMER',
            addresses: {
              create: [
                {
                  fullName: 'Alex Rivera',
                  street: '742 Evergreen Terrace',
                  city: 'Springfield',
                  state: 'OR',
                  zipCode: '97477',
                  country: 'United States',
                  phone: '+1 (555) 234-5678',
                  isDefault: true,
                },
              ],
            },
            cart: { create: {} },
            wishlist: { create: {} },
          },
        });
      } catch {
        // If DB write is unavailable, provide simulated in-memory demo user
        user = {
          id: 'demo-user-atelier-001',
          email: 'demo@agentbridge.io',
          name: 'Alex Rivera',
          role: 'CUSTOMER',
          passwordHash,
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check credentials: allow demo passwords for demo@agentbridge.io
    let isMatch = false;
    if (isDemoAccount && isAcceptedDemoPassword) {
      isMatch = true;
    } else if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login route unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
