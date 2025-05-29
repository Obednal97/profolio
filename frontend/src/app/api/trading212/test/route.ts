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
    
    // Use the simple test method to avoid rate limiting
    const testResult = await trading212.testConnectionSimple();
    
    return NextResponse.json({ 
      success: true,
      message: 'Trading 212 API connection successful!',
      accountInfo: {
        id: testResult.accountInfo.id,
        currencyCode: testResult.accountInfo.currencyCode,
        userId: user.userId,
        isDemo: user.isDemo,
      },
      apiCapabilities: {
        canReadPortfolio: testResult.hasPortfolio,
        canReadPies: testResult.hasPies,
        canReadCash: testResult.hasCash,
        hasPositions: testResult.hasPortfolio,
        hasPies: testResult.hasPies,
      },
      testedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trading 212 API test error:', error);
    
    // Enhanced error handling for specific Trading 212 errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ 
        error: 'Invalid Trading 212 API key', 
        details: 'Please check that your API key is correct and has the required permissions.',
        suggestions: [
          'Verify your API key is copied correctly',
          'Ensure your Trading 212 account has API access enabled',
          'Check that you\'re using the live Trading 212 API key (not demo/paper trading)',
          'Confirm your API key has not expired'
        ]
      }, { status: 401 });
    } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      return NextResponse.json({ 
        error: 'Trading 212 rate limit exceeded', 
        details: 'You have made too many API requests recently. Please wait 5-10 minutes before testing again.',
        suggestions: [
          'Wait 5-10 minutes before testing again',
          'Avoid testing the same API key repeatedly',
          'Check if other applications are using the same API key'
        ]
      }, { status: 429 });
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return NextResponse.json({ 
        error: 'Trading 212 API access denied', 
        details: 'Your API key does not have the required permissions for portfolio access.',
        suggestions: [
          'Check your Trading 212 API settings',
          'Ensure your API key has portfolio read permissions',
          'Verify your account type supports API access'
        ]
      }, { status: 403 });
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
      return NextResponse.json({ 
        error: 'Trading 212 connection timeout', 
        details: 'The connection to Trading 212 timed out. This may be a temporary issue.',
        suggestions: [
          'Try again in a few minutes',
          'Check your internet connection',
          'Verify Trading 212 services are operational'
        ]
      }, { status: 408 });
    } else {
      return NextResponse.json({ 
        error: 'Trading 212 connection failed',
        details: errorMessage,
        suggestions: [
          'Check your internet connection',
          'Verify your API key is correct',
          'Try again in a few minutes',
          'Contact Trading 212 support if the issue persists'
        ]
      }, { status: 500 });
    }
  }
} 