import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { Trading212Service, Trading212ApiError } from '@/lib/trading212Service';

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

    // Fail closed when JWT_SECRET is absent. This previously fell back to the
    // literal 'fallback-secret', and JWT_SECRET is not set in the Next runtime
    // on Vercel - so any token signed with that publicly-known string was
    // accepted, with an attacker-chosen userId.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured; refusing to verify token');
      return null;
    }

    const decoded = verify(token, jwtSecret) as UserJwtPayload;
    
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
  let currentStep = 'initialization';
  
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

    console.log(`🚀 Starting Trading 212 sync for user: ${user.userId}`);

    // Test connection and get account info
    let accountInfo;
    try {
      currentStep = 'testing connection';
      console.log('📡 Testing Trading 212 connection...');
      accountInfo = await trading212.testConnection();
      console.log('✅ Connection successful');
    } catch (connectionError) {
      console.error(`❌ Connection failed at step: ${currentStep}`, connectionError);
      
      // Enhanced error handling for specific Trading 212 errors
      const errorMessage = connectionError instanceof Error ? connectionError.message : 'Unknown error';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return NextResponse.json({ 
          error: 'Invalid Trading 212 API key', 
          details: 'Please check that your API key is correct and has the required permissions.',
          step: currentStep
        }, { status: 401 });
      } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        return NextResponse.json({ 
          error: 'Trading 212 rate limit exceeded', 
          details: 'Please wait a few minutes before trying again. Trading 212 has strict rate limits.',
          step: currentStep
        }, { status: 429 });
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        return NextResponse.json({ 
          error: 'Trading 212 API access denied', 
          details: 'Your API key does not have the required permissions for portfolio access.',
          step: currentStep
        }, { status: 403 });
      } else {
        return NextResponse.json({ 
          error: 'Trading 212 connection failed', 
          details: errorMessage,
          step: currentStep
        }, { status: 500 });
      }
    }

    // Get comprehensive account overview
    try {
      currentStep = 'fetching account overview';
      console.log('📊 Fetching account overview...');
      const accountOverview = await trading212.getAccountOverview();
      console.log('✅ Account overview fetched');
      
      // Get enhanced assets with dividends and pie information
      currentStep = 'fetching enhanced assets';
      console.log('🎯 Fetching enhanced assets (this may take a while due to rate limiting)...');
      const assets = await trading212.getEnhancedAssets();
      console.log(`✅ Enhanced assets fetched: ${assets.length} assets`);
      
      // Get comprehensive portfolio summary with pie information
      currentStep = 'generating portfolio summary';
      console.log('📈 Generating portfolio summary...');
      const summary = await trading212.getPortfolioSummary();
      console.log('✅ Portfolio summary generated');

      // Save assets to the mock API with proper user ID
      currentStep = 'saving assets to database';
      console.log('💾 Saving assets to database...');
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

      console.log(`✅ Sync completed successfully: ${savedCount} assets saved`);

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
    } catch (syncError) {
      console.error(`❌ Sync failed at step: ${currentStep}`, syncError);
      throw syncError; // Re-throw to be handled by the outer catch block
    }
  } catch (error) {
    console.error('Trading 212 sync error:', error);
    
    // Enhanced error handling with detailed logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const apiError = error as Trading212ApiError;
    const errorStatus = apiError.status;
    const errorEndpoint = apiError.endpoint;
    const errorDetails = apiError.details;
    
    console.error('Detailed error information:', {
      message: errorMessage,
      status: errorStatus,
      endpoint: errorEndpoint,
      details: errorDetails,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorStatus === 429) {
      return NextResponse.json({ 
        error: 'Trading 212 rate limit exceeded', 
        details: `Rate limit hit on endpoint: ${errorEndpoint || 'unknown'}. ${errorDetails || errorMessage}`,
        suggestions: [
          'Wait 5-10 minutes before trying to sync again',
          'Trading 212 has strict rate limits - this is normal for large portfolios',
          'The sync will automatically space requests, but may still hit limits with many pies',
          'Consider syncing during off-peak hours'
        ],
        endpoint: errorEndpoint,
        retryAfter: '5-10 minutes',
        failedAt: currentStep || 'unknown step'
      }, { status: 429 });
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorStatus === 401) {
      return NextResponse.json({ 
        error: 'Trading 212 authentication failed', 
        details: `Authentication error on endpoint: ${errorEndpoint || 'unknown'}. ${errorDetails || 'Your API key may have expired or been revoked.'}`,
        suggestions: [
          'Check your Trading 212 API settings',
          'Verify your API key is still valid',
          'Ensure your API key has the required permissions'
        ],
        endpoint: errorEndpoint,
        failedAt: currentStep || 'unknown step'
      }, { status: 401 });
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout') || errorStatus === 408) {
      return NextResponse.json({ 
        error: 'Trading 212 request timeout', 
        details: `Request timed out on endpoint: ${errorEndpoint || 'unknown'}. ${errorDetails || errorMessage}`,
        suggestions: [
          'Try again in a few minutes',
          'Check your internet connection',
          'Trading 212 servers may be experiencing high load',
          'Consider syncing during off-peak hours'
        ],
        endpoint: errorEndpoint,
        retryAfter: '2-5 minutes',
        failedAt: currentStep || 'unknown step'
      }, { status: 408 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to sync portfolio data', 
        details: `Error on endpoint: ${errorEndpoint || 'unknown'}. ${errorDetails || errorMessage}`,
        endpoint: errorEndpoint,
        status: errorStatus,
        failedAt: currentStep || 'unknown step',
        troubleshooting: {
          message: errorMessage,
          endpoint: errorEndpoint,
          status: errorStatus,
          step: currentStep,
          timestamp: new Date().toISOString()
        }
      }, { status: errorStatus || 500 });
    }
  }
} 