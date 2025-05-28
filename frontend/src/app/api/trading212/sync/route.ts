import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { Trading212Service } from '@/lib/trading212Service';

interface UserJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

function getUserFromToken(request: NextRequest): { userId: string; email: string; isDemo: boolean } | null {
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
            userId: user.userId,
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
      isDemo: user.isDemo,
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