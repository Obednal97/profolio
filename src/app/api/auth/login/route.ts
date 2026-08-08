import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/authCookie';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward the login request to the backend signin endpoint
    const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Invalid credentials' },
        { status: response.status }
      );
    }

    // Check if 2FA is required
    if (data.requiresTwoFactor) {
      // Return the 2FA requirement and verification token
      return NextResponse.json({
        requiresTwoFactor: true,
        verificationToken: data.verificationToken,
      });
    }

    // Normal sign-in: set token in cookie if provided.
    // Cookie name and flags come from the shared helper - this route used to
    // set 'token', which none of the proxy routes read.
    if (data.token) {
      const res = NextResponse.json(data);
      res.cookies.set(AUTH_COOKIE_NAME, data.token, authCookieOptions(req));
      return res;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}