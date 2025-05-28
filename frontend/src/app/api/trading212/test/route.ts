import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { Trading212Service } from '@/lib/trading212Service';

interface UserJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

function getUserFromToken(request: NextRequest): { userId: string; email: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    
    // Handle demo token specifically
    if (token === 'demo-token-secure-123') {
      return {
        userId: 'demo-user-id',
        email: 'demo@profolio.com'
      };
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as UserJwtPayload;
    
    return {
      userId: decoded.userId || decoded.id || '',
      email: decoded.email
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Initialize Trading 212 service and test connection
    const trading212 = new Trading212Service(apiKey);
    const accountInfo = await trading212.testConnection();
    
    return NextResponse.json({ 
      success: true, 
      accountInfo: {
        currencyCode: accountInfo.currencyCode,
        userId: user.userId,
        // Don't return sensitive data in test response
      }
    });
  } catch (error) {
    console.error('Trading 212 API test error:', error);
    return NextResponse.json({ 
      error: 'Invalid API key or connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 });
  }
} 