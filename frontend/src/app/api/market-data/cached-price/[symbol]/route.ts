import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    // Resolve the params
    const resolvedParams = await params;
    const symbol = resolvedParams.symbol;
    
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with authentication
    const backendResponse = await fetch(`${BACKEND_URL}/api/market-data/cached-price/${encodeURIComponent(symbol)}`, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is JSON
    const contentType = backendResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If backend returns HTML (error page) or non-JSON, return a proper error
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend service unavailable',
          symbol,
          price: 0, // Fallback price
          change: 0,
          changePercent: 0
        },
        { status: 503 }
      );
    }
    
    // Get the response data
    const data = await backendResponse.json();
    
    // Forward the response with the same status
    return NextResponse.json(data, { 
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('❌ [Proxy] Market data proxy error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Proxy error - unable to reach backend service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
} 