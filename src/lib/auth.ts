import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './db';

const jwtSecretValue = process.env.JWT_SECRET;
if (!jwtSecretValue) {
  throw new Error(
    'JWT_SECRET environment variable is required. Set it to a random 32+ character string.',
  );
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretValue);

const TOKEN_COOKIE_NAME = 'agentbridge_token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthUser | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    } catch {
      // Not in a server action/route handler context
    }
  }

  if (!token) return null;

  const verified = await verifySessionToken(token);
  if (!verified) return null;

  // Confirm user exists in DB
  const dbUser = await prisma.user.findUnique({
    where: { id: verified.id },
    select: { id: true, email: true, name: true, role: true },
  });

  return dbUser;
}

export { TOKEN_COOKIE_NAME };
