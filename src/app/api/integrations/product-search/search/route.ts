import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

interface UserJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

function getUserFromToken(request: NextRequest): { userId: string; email: string; isDemo: boolean } | null {
  try {
    // Check for auth header first
    const authHeader = request.headers.get('authorization');
    
    // Check for demo mode in headers or allow if no auth header for demo users
    const isDemoMode = request.headers.get('x-demo-mode') === 'true' || 
                       request.cookies.get('demo-mode')?.value === 'true';
    
    if (isDemoMode) {
      return {
        userId: 'demo-user-id',
        email: 'demo@profolio.com',
        isDemo: true
      };
    }
    
    if (!authHeader?.startsWith('Bearer ')) {
      // Try cookie fallback
      const cookieToken = request.cookies.get('auth-token')?.value;
      if (!cookieToken) {
        return {
          userId: 'demo-user-id',
          email: 'demo@profolio.com',
          isDemo: true
        };
      }
    }

    const token = authHeader?.slice(7) || request.cookies.get('auth-token')?.value;
    
    // Handle demo token specifically
    if (token === 'demo-token-secure-123') {
      return {
        userId: 'demo-user-id',
        email: 'demo@profolio.com',
        isDemo: true
      };
    }

    if (!token) {
      return {
        userId: 'demo-user-id', 
        email: 'demo@profolio.com',
        isDemo: true
      };
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as UserJwtPayload;
    
    return {
      userId: decoded.userId || decoded.id || '',
      email: decoded.email,
      isDemo: false
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    // Fallback to demo mode on auth errors
    return {
      userId: 'demo-user-id',
      email: 'demo@profolio.com', 
      isDemo: true
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ 
        status: 'ERROR',
        message: 'Query parameter "q" is required',
        data: []
      }, { status: 400 });
    }

    // Determine API base URL
    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Forward request to backend market-data service
    const backendUrl = `${apiBaseUrl}/market-data/search?q=${encodeURIComponent(query)}`;
    
    // Create auth token for backend - use demo token for demo users
    const authToken = user.isDemo ? 'demo-token-secure-123' : 
                     request.headers.get('authorization')?.slice(7) || 
                     request.cookies.get('auth-token')?.value || 
                     'demo-token-secure-123';
    
    console.log(`Proxying request to: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
      
      // Return fallback response instead of failing
      return NextResponse.json({
        status: 'ERROR',
        message: `Price service temporarily unavailable (${response.status})`,
        data: [],
        fallback: true
      });
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Product search proxy error:', error);
    
    // Return fallback response for any errors
    return NextResponse.json({
      status: 'ERROR',
      message: 'Price service temporarily unavailable',
      data: [],
      fallback: true
    }, { status: 200 }); // Return 200 so frontend doesn't fail
  }
} 