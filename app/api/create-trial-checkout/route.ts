// app/api/create-trial-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripeClient } from '@/lib/stripe/client';
import { checkRateLimit, getClientIP } from '@/lib/middleware/edge-security';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check if user is already signed in
    const user = await currentUser();
    
    // Create checkout session for $1 trial
    const session = await stripeClient.createCheckout(
      'starter', // Using starter package for trial
      user?.emailAddresses?.[0]?.emailAddress || '',
      {
        userId: user?.id || '',
        packageType: 'starter',
        credits: 10,
        userName: user?.firstName || 'Trial User',
      },
      `${process.env.NEXT_PUBLIC_APP_URL}/trial-success`
    );

    console.log('[TRIAL_CHECKOUT] Created trial checkout:', {
      sessionId: session.id,
      existingUser: !!user,
      userEmail: user?.emailAddresses?.[0]?.emailAddress || 'none',
    });

    // Redirect to Stripe checkout
    return NextResponse.redirect(session.url);

  } catch (error) {
    console.error('[TRIAL_CHECKOUT] Error creating checkout:', error);
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}