import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from './lib/middleware/edge-security';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en'
});

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/analyze(.*)',
  '/improve(.*)',
  '/preview(.*)',
  '/improved-resume(.*)',
  '/:locale/dashboard(.*)',
  '/:locale/analyze(.*)',
  '/:locale/improve(.*)',
  '/:locale/preview(.*)',
  '/:locale/improved-resume(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/analyze-resume',
  '/:locale/',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
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

  // Handle internationalization for non-API routes
  if (!url.pathname.startsWith('/api')) {
    const intlResponse = intlMiddleware(req);
    if (intlResponse) {
      return intlResponse;
    }
  }

  // Redirect authenticated users away from auth pages
  if (userId && (url.pathname.includes('/sign-in') || url.pathname.includes('/sign-up'))) {
    // Extract locale from pathname
    const pathSegments = url.pathname.split('/');
    const locale = locales.includes(pathSegments[1] as any) ? pathSegments[1] : 'en';
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!userId && isProtectedRoute(req)) {
    // Extract locale from pathname
    const pathSegments = url.pathname.split('/');
    const locale = locales.includes(pathSegments[1] as any) ? pathSegments[1] : 'en';
    const signInUrl = new URL(`/${locale}/sign-in`, req.url);
    // Preserve the original URL for redirect after sign-in
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from root to dashboard
  if (userId && (url.pathname === '/' || url.pathname.match(/^\/[a-z]{2}$/))) {
    // Extract locale from pathname
    const pathSegments = url.pathname.split('/');
    const locale = locales.includes(pathSegments[1] as any) ? pathSegments[1] : 'en';
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};