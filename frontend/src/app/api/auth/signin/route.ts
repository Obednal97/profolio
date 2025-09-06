import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward the sign-in request to the backend
    const response = await fetch(`${BACKEND_URL}/auth/signin`, {
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

    // Normal sign-in: set token in cookie if provided
    if (data.token) {
      const res = NextResponse.json(data);
      res.cookies.set('token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return res;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}