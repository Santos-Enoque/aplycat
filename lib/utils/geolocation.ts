import { NextRequest } from 'next/server';

export interface CountryInfo {
  country: string;
  countryCode: string;
  isMozambique: boolean;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers to get the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to localhost
  return '127.0.0.1';
}

/**
 * Detect country from IP address - simplified for Mozambique focus
 */
export async function detectCountryFromIP(ip: string): Promise<CountryInfo> {
  // Since we're focused on Mozambique, always return Mozambique as default
  // This avoids external API calls and rate limiting issues
  return {
    country: 'Mozambique',
    countryCode: 'MZ',
    isMozambique: true,
  };
}

/**
 * Get pricing info based on country
 */
export function getPricingForCountry(country: CountryInfo) {
  // Always return MZN pricing (Mozambique-focused platform)
  return {
    currency: 'MZN',
    symbol: 'MZN',
    trialPrice: 100, // 100 MZN
    proPrice: 200,   // 200 MZN
    exchangeRate: 63,
  };
}

/**
 * Format price according to country
 */
export function formatPrice(amount: number, country: CountryInfo): string {
  const pricing = getPricingForCountry(country);
  
  if (pricing.currency === 'MZN') {
    return `${amount} MZN`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Utility to detect country from request and return formatted pricing
 */
export async function getCountryPricing(request: NextRequest) {
  const ip = getClientIP(request);
  
  // Check for development override via query parameter or header
  const forceCountry = request.nextUrl.searchParams.get('country') || 
                      request.headers.get('x-force-country');
  
  let country: CountryInfo;
  
  if (forceCountry && process.env.NODE_ENV === 'development') {
    // Development override for testing
    country = {
      country: forceCountry === 'mz' ? 'Mozambique' : 'United States',
      countryCode: forceCountry.toUpperCase(),
      isMozambique: forceCountry.toLowerCase() === 'mz',
    };
    console.log(`[GEOLOCATION] Development override: forcing country to ${country.country}`);
  } else {
    country = await detectCountryFromIP(ip);
  }
  
  const pricing = getPricingForCountry(country);
  
  return {
    country,
    pricing,
    formatPrice: (amount: number) => formatPrice(amount, country),
  };
} 