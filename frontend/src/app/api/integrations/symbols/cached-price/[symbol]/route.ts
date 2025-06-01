import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Mock price data for demo mode
const DEMO_PRICES: Record<string, number> = {
  'SPY': 589.75,
  'QQQ': 429.88,
  'VTI': 278.92,
  'VOO': 521.34,
  'VEA': 52.87,
  'AAPL': 245.18,
  'GOOGL': 175.37,
  'MSFT': 415.26,
  'AMZN': 186.51,
  'TSLA': 248.42,
  'META': 558.79,
  'NVDA': 138.07,
  'NFLX': 755.28,
  'JPM': 223.16,
  'V': 311.83,
  'BTC-USD': 95847.23,
  'ETH-USD': 3456.78,
  'BNB-USD': 721.45,
  'XRP-USD': 2.34,
  'ADA-USD': 1.15,
};

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

  // For real users, would validate JWT token here
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In production, validate the real JWT token
    return {
      id: 'real-user-id',
      isDemo: false
    };
  }

  return null; // No valid authentication
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

    const symbol = params.symbol?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ 
        error: 'Symbol parameter is required',
        price: null
      }, { status: 400 });
    }

    // For demo mode, return mock data directly
    if (user.isDemo) {
      const basePrice = DEMO_PRICES[symbol] || (Math.random() * 500 + 50);
      
      return NextResponse.json({
        symbol: symbol,
        price: basePrice,
        last_updated: new Date().toISOString(),
        source: 'demo',
        message: 'Demo mode - mock price data'
      });
    }

    // For real users, forward to backend
    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const backendUrl = `${apiBaseUrl}/market-data/cached-price/${encodeURIComponent(symbol)}`;
    
    // Get real auth token for backend
    const authToken = request.headers.get('authorization')?.slice(7) || 
                     request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({
        symbol: symbol,
        price: null,
        error: 'No authentication token available'
      }, { status: 401 });
    }
    
    console.log(`Getting cached price for: ${symbol}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Backend error: ${response.status} ${response.statusText}`);
      
      return NextResponse.json({
        symbol: symbol,
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