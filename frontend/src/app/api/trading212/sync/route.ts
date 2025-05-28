import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { Trading212Service } from '@/lib/trading212Service';

interface UserJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

// Demo mode support - matches the BYPASS_AUTH pattern used in the app
const DEMO_USER = {
  userId: 'demo-user-id',
  email: 'demo@example.com'
};

function getUserFromToken(request: NextRequest): { userId: string; email: string } {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Support demo mode - if no auth header, use demo user
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No auth header found, using demo user for development');
      return DEMO_USER;
    }

    const token = authHeader.slice(7);
    
    // Support demo mode - if token is demo token, use demo user
    if (token === 'dev-token-123' || token === 'demo-token') {
      console.log('Demo token detected, using demo user');
      return DEMO_USER;
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as UserJwtPayload;
    
    return {
      userId: decoded.userId || decoded.id || '',
      email: decoded.email
    };
  } catch (error) {
    console.error('Token verification failed, falling back to demo user:', error);
    // Fallback to demo user for development
    return DEMO_USER;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    // Note: user is never null now due to demo mode fallback

    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Initialize Trading 212 service
    const trading212 = new Trading212Service(apiKey);

    // Test connection first
    try {
      await trading212.testConnection();
    } catch (connectionError) {
      console.error('Trading 212 connection failed:', connectionError);
      return NextResponse.json({ error: 'Invalid API key or connection failed' }, { status: 401 });
    }

    // Get enhanced assets with dividends
    const assets = await trading212.getEnhancedAssets();
    
    // Get portfolio summary for additional insights
    const summary = await trading212.getPortfolioSummary();

    // Save assets to the mock API with proper user ID
    const { apiCall } = await import('@/lib/mockApi');
    
    let savedCount = 0;
    const savedAssets = [];
    
    for (const asset of assets) {
      try {
        const response = await apiCall('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'CREATE',
            userId: user.userId, // Use actual user ID (demo-user-id in demo mode)
            ...asset,
          }),
        });
        
        const result = await response.json();
        if (!result.error) {
          savedCount++;
          savedAssets.push({
            name: asset.name,
            symbol: asset.symbol,
            value: asset.current_value / 100,
            quantity: asset.quantity,
            dividends: asset.dividends?.length || 0,
          });
        }
      } catch (saveError) {
        console.error('Failed to save asset:', asset.name, saveError);
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.userId,
      assetsCount: savedCount,
      totalValue: summary.totalValue,
      totalInvested: summary.totalInvested,
      totalPnL: summary.totalPnL,
      totalPnLPercentage: summary.totalPnLPercentage,
      cashBalance: summary.cashBalance,
      positionsCount: summary.positionsCount,
      topHoldings: summary.topHoldings,
      assets: savedAssets,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trading 212 sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync portfolio data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 