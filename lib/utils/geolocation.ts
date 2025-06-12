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
 * Detect country from IP address using a free geolocation service
 */
export async function detectCountryFromIP(ip: string): Promise<CountryInfo> {
  // Default fallback
  const defaultCountry: CountryInfo = {
    country: 'Unknown',
    countryCode: 'XX',
    isMozambique: false,
  };

  // Skip detection for localhost/private IPs
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return defaultCountry;
  }

  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    // Use ipapi.co for free IP geolocation (1000 requests/month free)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Aplycat Resume Service',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[GEOLOCATION] API request failed: ${response.status}`);
      return defaultCountry;
    }

    const data = await response.json();
    
    if (data.error) {
      console.warn(`[GEOLOCATION] API error: ${data.reason}`);
      return defaultCountry;
    }

    const countryCode = data.country_code?.toLowerCase();
    const country = data.country_name || 'Unknown';
    
    return {
      country,
      countryCode: countryCode?.toUpperCase() || 'XX',
      isMozambique: countryCode === 'mz',
    };
  } catch (error) {
    console.warn('[GEOLOCATION] Detection failed:', error);
    return defaultCountry;
  }
}

/**
 * Get pricing info based on country
 */
export function getPricingForCountry(country: CountryInfo) {
  const exchangeRate = 63; // 1 USD = 63 MZN

  if (country.isMozambique) {
    return {
      currency: 'MZN',
      symbol: 'MZN',
      trialPrice: 100, // 100 MZN
      proPrice: 200,   // 200 MZN
      exchangeRate,
    };
  } else {
    return {
      currency: 'USD',
      symbol: '$',
      trialPrice: 1.00, // $1 USD
      proPrice: 4.99,   // $4.99 USD
      exchangeRate: 1,
    };
  }
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