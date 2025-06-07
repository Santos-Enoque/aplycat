import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from './lib/middleware/edge-security';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/analyze(.*)',
  '/improve(.*)',
  '/preview(.*)',
  '/improved-resume(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/analyze-resume',
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

  // Redirect authenticated users away from auth pages
  if (userId && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    // Preserve the original URL for redirect after sign-in
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from root to dashboard
  if (userId && url.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
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