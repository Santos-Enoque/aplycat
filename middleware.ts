import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from './lib/middleware/edge-security';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/analyze(.*)',
  '/improve(.*)',
  '/preview(.*)',
  '/improved-resume(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;

  // Apply rate limiting to payment endpoints
  if (url.pathname.startsWith('/api/payments/')) {
    const ip = getClientIP(req);
    
    if (!checkRateLimit(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  // Skip intl middleware for API routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Handle internationalization first
  const intlResponse = intlMiddleware(req);
  
  // If intl middleware wants to redirect (for locale detection), let it
  if (intlResponse && intlResponse.status === 302) {
    return intlResponse;
  }

  // Extract locale from pathname
  const pathname = req.nextUrl.pathname;
  const locale = pathname.split('/')[1];
  const isValidLocale = routing.locales.includes(locale as any);
  const currentLocale = isValidLocale ? locale : routing.defaultLocale;

  // Redirect authenticated users away from auth pages
  if (userId && (url.pathname.includes('/sign-in') || url.pathname.includes('/sign-up'))) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL(`/${currentLocale}/sign-in`, req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from root to dashboard
  if (userId && (url.pathname === '/' || routing.locales.some(loc => url.pathname === `/${loc}`))) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
  }

  return intlResponse || NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
  ],
};