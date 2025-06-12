// app/api/test-pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCountryPricing } from '@/lib/utils/geolocation';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    // Get current pricing
    const { country, pricing } = await getCountryPricing(request);
    
    // Also show what each country would see
    const mozambiquePricing = {
      currency: 'MZN',
      symbol: 'MZN',
      trialPrice: 100,
      proPrice: 200,
      exchangeRate: 63,
    };
    
    const internationalPricing = {
      currency: 'USD',
      symbol: '$',
      trialPrice: 1.00,
      proPrice: 4.99,
      exchangeRate: 1,
    };

    return NextResponse.json({
      detectedCountry: country,
      currentPricing: pricing,
      allPricingOptions: {
        mozambique: mozambiquePricing,
        international: internationalPricing,
      },
      testUrls: {
        forceMozambique: `${request.nextUrl.origin}/api/test-pricing?country=mz`,
        forceInternational: `${request.nextUrl.origin}/api/test-pricing?country=us`,
        packages: `${request.nextUrl.origin}/api/payments/packages?country=mz`,
      },
      testInstructions: {
        '1': 'Add ?country=mz to any URL to test Mozambique pricing',
        '2': 'Add ?country=us to test international pricing',
        '3': 'Check /api/payments/packages?country=mz for package pricing',
        '4': 'Use browser dev tools to add header: x-force-country: mz',
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get pricing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 