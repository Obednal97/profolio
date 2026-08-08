import { NextRequest, NextResponse } from 'next/server';

// This endpoint is called directly by Stripe, so we forward it to our backend
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = await request.text();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'stripe-signature': signature,
      },
      body: body,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Webhook processing failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}