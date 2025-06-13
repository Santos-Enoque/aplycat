// app/api/payments/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use hardcoded MZN pricing for Mozambique focus
    const pricing = {
      currency: 'MZN',
      symbol: 'MZN',
      trialPrice: 100,
      proPrice: 200,
      exchangeRate: 63,
    };

    const country = {
      country: 'Mozambique',
      countryCode: 'MZ',
      isMozambique: true,
    };
    
    console.log(`[PACKAGES] Using MZN pricing for Mozambique focus`);
    
    // For now, always show all packages to avoid authentication issues
    console.log('[PACKAGES] Showing all packages without authentication checks');
    
    // Convert packages to include MZN pricing
    const packages = [];
    
    // Always add Trial Pack for now
    packages.push({
      id: 'trial',
      name: '🎁 Trial Pack',
      credits: 22,
      price: pricing.trialPrice,
      currency: pricing.currency,
      description: 'Perfect way to try all features - one-time only',
      pricePerCredit: (pricing.trialPrice / 22).toFixed(2),
      isTrialPackage: true,
      availableForUser: true,
    });
    
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
      country,
      pricing,
    });
  } catch (error) {
    console.error('[GET_PACKAGES] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get credit packages' },
      { status: 500 }
    );
  }
}

