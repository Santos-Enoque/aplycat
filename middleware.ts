import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from './lib/middleware/edge-security';
import { locales, defaultLocale } from './i18n';

const isProtectedRoute = createRouteMatcher([
  '/(en|pt)?/dashboard(.*)',
  '/(en|pt)?/analyze(.*)',
  '/(en|pt)?/improve(.*)',
  '/(en|pt)?/preview(.*)',
  '/(en|pt)?/improved-resume(.*)',
  '/dashboard(.*)',
  '/analyze(.*)',
  '/improve(.*)',
  '/preview(.*)',
  '/improved-resume(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/(en|pt)',
  '/(en|pt)?/sign-in(.*)',
  '/(en|pt)?/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/analyze-resume',
]);

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;

  // Skip intl middleware for API routes and static files
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('.')) {
    
    // Apply rate limiting to payment endpoints
    if (url.pathname.startsWith('/api/payments/')) {
      const ip = getClientIP(req);
      
      if (!checkRateLimit(ip)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }

    return NextResponse.next();
  }

  // Apply internationalization for non-API routes
  const intlResponse = intlMiddleware(req);
  
  // If intl middleware returns a redirect, follow it
  if (intlResponse.status === 307 || intlResponse.status === 302) {
    return intlResponse;
  }

  // Get the locale from the URL
  const locale = req.nextUrl.pathname.split('/')[1];
  const isValidLocale = locales.includes(locale as any);
  
  // Determine the pathname without locale for route matching
  const pathnameWithoutLocale = isValidLocale 
    ? req.nextUrl.pathname.slice(`/${locale}`.length) || '/'
    : req.nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (userId && (pathnameWithoutLocale.startsWith('/sign-in') || pathnameWithoutLocale.startsWith('/sign-up'))) {
    const redirectUrl = isValidLocale ? `/${locale}/dashboard` : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = isValidLocale ? `/${locale}/sign-in` : '/sign-in';
    const fullSignInUrl = new URL(signInUrl, req.url);
    // Preserve the original URL for redirect after sign-in
    fullSignInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(fullSignInUrl);
  }

  // Redirect authenticated users from root to dashboard
  if (userId && pathnameWithoutLocale === '/') {
    const redirectUrl = isValidLocale ? `/${locale}/dashboard` : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return intlResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};