import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

function getUserFromToken(request: NextRequest) {
  // Check for demo mode first
  const isDemoMode = request.headers.get('x-demo-mode') === 'true';
  
  if (isDemoMode) {
    return {
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@profolio.com',
      isDemo: true
    };
  }

  // In a real implementation, you'd validate the JWT token here
  // For now, return a demo user for development
  return {
    id: 'demo-user-id',
    name: 'Demo User', 
    email: 'demo@profolio.com',
    isDemo: true
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const symbol = params.symbol;

    if (!symbol) {
      return NextResponse.json({ 
        error: 'Symbol parameter is required',
        price: null
      }, { status: 400 });
    }

    // Determine API base URL
    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Forward request to backend cached-price endpoint (no live API calls)
    const backendUrl = `${apiBaseUrl}/market-data/cached-price/${encodeURIComponent(symbol)}`;
    
    // Create auth token for backend - use demo token for demo users
    const authToken = user.isDemo ? 'demo-token-secure-123' : 
                     request.headers.get('authorization')?.slice(7) || 
                     request.cookies.get('auth-token')?.value || 
                     'demo-token-secure-123';
    
    console.log(`Getting cached price for: ${symbol}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Backend error: ${response.status} ${response.statusText}`);
      
      // Return empty response for cached endpoint failures
      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        price: null,
        message: 'Cached price not available'
      });
    }

    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching cached price:', error);
    
    return NextResponse.json({
      symbol: params.symbol?.toUpperCase() || 'UNKNOWN',
      price: null,
      error: 'Failed to fetch cached price'
    });
  }
} 