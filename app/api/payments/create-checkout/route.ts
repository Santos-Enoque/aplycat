// app/api/payments/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { paymentService } from '@/lib/services/payment-service';
import { z } from 'zod';
import type { CreditPackageType } from '@/lib/stripe/config';

const createCheckoutSchema = z.object({
  packageType: z.enum(['starter', 'professional', 'premium']),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { packageType, returnUrl } = createCheckoutSchema.parse(body);

    console.log('[CREATE_CHECKOUT] Creating checkout:', {
      userId: user.id,
      packageType,
      email: user.emailAddresses[0]?.emailAddress,
      returnUrl,
    });

    // Create checkout session
    const result = await paymentService.createCheckout({
      userId: user.id,
      packageType: packageType as CreditPackageType,
      userEmail: user.emailAddresses[0]?.emailAddress || '',
      returnUrl,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      package: result.packageDetails,
    });
  } catch (error) {
    console.error('[CREATE_CHECKOUT] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
