import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    // Check if user is in demo mode
    const isDemoMode = request.headers.get('x-demo-mode') === 'true' ||
                      searchParams.get('demo') === 'true';

    if (isDemoMode) {
      // For demo mode, return empty array since we don't have real historical data
      return NextResponse.json({
        status: 'OK',
        data: [],
        message: 'Demo mode: No historical data available'
      });
    }

    // Get the backend URL from environment or default
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Forward request to backend
    const backendResponse = await fetch(
      `${backendUrl}/api/market-data/portfolio-history/${userId}?days=${days}`,
      {
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Portfolio history API error:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      error: 'Failed to fetch portfolio history',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: [] // Return empty array as fallback
    }, { status: 500 });
  }
} 