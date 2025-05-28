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

    // Test connection and get account info
    let accountInfo;
    try {
      accountInfo = await trading212.testConnection();
    } catch (connectionError) {
      console.error('Trading 212 connection failed:', connectionError);
      
      // Enhanced error handling for specific Trading 212 errors
      const errorMessage = connectionError instanceof Error ? connectionError.message : 'Unknown error';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return NextResponse.json({ 
          error: 'Invalid Trading 212 API key', 
          details: 'Please check that your API key is correct and has the required permissions.'
        }, { status: 401 });
      } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        return NextResponse.json({ 
          error: 'Trading 212 rate limit exceeded', 
          details: 'Please wait a few minutes before trying again. Trading 212 has strict rate limits.'
        }, { status: 429 });
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        return NextResponse.json({ 
          error: 'Trading 212 API access denied', 
          details: 'Your API key does not have the required permissions for portfolio access.'
        }, { status: 403 });
      } else {
        return NextResponse.json({ 
          error: 'Trading 212 connection failed', 
          details: errorMessage
        }, { status: 500 });
      }
    }

    // Get comprehensive account overview
    const accountOverview = await trading212.getAccountOverview();
    
    // Get enhanced assets with dividends and pie information
    const assets = await trading212.getEnhancedAssets();
    
    // Get comprehensive portfolio summary with pie information
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
            pieInfo: asset.pie_info ? {
              pieName: asset.pie_info.pieName,
              pieShare: asset.pie_info.pieShare
            } : undefined,
          });
        }
      } catch (saveError) {
        console.error('Failed to save asset:', asset.name, saveError);
      }
    }

    // Enhanced response with comprehensive Trading 212 data
    return NextResponse.json({
      success: true,
      userId: user.userId,
      isDemo: user.isDemo,
      
      // Account Information
      accountInfo: {
        id: accountInfo.id,
        currency: accountInfo.currencyCode,
      },
      
      // Portfolio Summary
      assetsCount: savedCount,
      totalValue: summary.totalValue,
      totalInvested: summary.totalInvested,
      totalPnL: summary.totalPnL,
      totalPnLPercentage: summary.totalPnLPercentage,
      cashBalance: summary.cashBalance,
      positionsCount: summary.positionsCount,
      
      // Pie Information
      piesCount: summary.piesCount,
      piesSummary: summary.piesSummary,
      
      // Top Holdings
      topHoldings: summary.topHoldings,
      
      // Account Overview
      currentOrdersCount: accountOverview.currentOrdersCount,
      
      // Saved Assets Details
      assets: savedAssets,
      
      // Metadata
      syncedAt: new Date().toISOString(),
      
      // Additional insights
      insights: {
        hasActivePies: summary.piesCount > 0,
        hasPendingOrders: accountOverview.currentOrdersCount > 0,
        portfolioPerformance: summary.totalPnLPercentage >= 0 ? 'positive' : 'negative',
        diversification: {
          assetsCount: savedCount,
          piesCount: summary.piesCount,
          topHoldingPercentage: summary.topHoldings[0]?.percentage || 0,
        }
      }
    });
  } catch (error) {
    console.error('Trading 212 sync error:', error);
    
    // Enhanced error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      return NextResponse.json({ 
        error: 'Trading 212 rate limit exceeded', 
        details: 'You have made too many API requests recently. Please wait 5-10 minutes before trying again.'
      }, { status: 429 });
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ 
        error: 'Trading 212 authentication failed', 
        details: 'Your API key may have expired or been revoked. Please check your Trading 212 API settings.'
      }, { status: 401 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to sync portfolio data', 
        details: errorMessage
      }, { status: 500 });
    }
  }
} 