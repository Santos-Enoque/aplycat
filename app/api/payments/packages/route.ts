// app/api/payments/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment-service';
import { getCountryPricing } from '@/lib/utils/geolocation';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

export async function GET(request: NextRequest) {
  try {
    // Get country-based pricing
    const { country, pricing } = await getCountryPricing(request);
    
    console.log(`[PACKAGES] Country detected: ${country.country} (${country.countryCode}), Currency: ${pricing.currency}`);
    
    // Get user to check if they've purchased Trial Pack before
    let user = null;
    try {
      user = await getCurrentUserFromDB();
    } catch (error) {
      // User not authenticated - this is fine for package browsing
    }

    // Get base packages from payment service
    const basePackages = paymentService.getCreditPackages();
    
    // Convert packages to include country-based pricing
    const packages = [];
    
    // Add Trial Pack if user hasn't purchased it before (only for new users)
    const hasTrialPurchase = user ? await checkTrialPurchaseHistory(user.id) : false;
    
    if (!user || !hasTrialPurchase) {
      packages.push({
        id: 'trial',
        name: '🎁 Trial Pack',
        credits: 22,
        price: pricing.trialPrice,
        currency: pricing.currency,
        description: 'Perfect way to try all features - one-time only',
        pricePerCredit: (pricing.trialPrice / 22).toFixed(2),
        isTrialPackage: true,
        availableForUser: !user || !hasTrialPurchase,
      });
    }
    
    // Add Pro Pack (always available)
    packages.push({
      id: 'pro',
      name: '🥇 Pro Pack',
      credits: 44,
      price: pricing.proPrice,
      currency: pricing.currency,
      description: 'Best value for serious job seekers',
      pricePerCredit: (pricing.proPrice / 44).toFixed(2),
      isTrialPackage: false,
      availableForUser: true,
    });
    
    return NextResponse.json({
      success: true,
      packages,
      country: {
        name: country.country,
        code: country.countryCode,
        isMozambique: country.isMozambique,
      },
      pricing: {
        currency: pricing.currency,
        symbol: pricing.symbol,
        exchangeRate: pricing.exchangeRate,
      },
    });
  } catch (error) {
    console.error('[GET_PACKAGES] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get credit packages' },
      { status: 500 }
    );
  }
}

// Helper function to check if user has purchased Trial Pack before
async function checkTrialPurchaseHistory(userId: string): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db');
    
    const trialPurchase = await db.creditTransaction.findFirst({
      where: {
        userId,
        type: 'PURCHASE',
        description: {
          contains: 'Trial Pack',
        },
      },
    });
    
    return !!trialPurchase;
  } catch (error) {
    console.error('[CHECK_TRIAL_HISTORY] Error:', error);
    return false; // If we can't check, assume they haven't purchased
  }
}