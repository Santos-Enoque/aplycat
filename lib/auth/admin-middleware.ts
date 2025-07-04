// lib/auth/admin-middleware.ts
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if the current user has admin role
 */
export async function requireAdminAuth(): Promise<{ user: any; error?: never } | { user?: never; error: NextResponse }> {
  try {
    const user = await currentUser();
    
    if (!user) {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    // Check if user has admin role
    const hasAdminRole = user.publicMetadata?.role === 'admin' || 
                        user.privateMetadata?.role === 'admin';

    if (!hasAdminRole) {
      return {
        error: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      };
    }

    console.log(`[ADMIN_AUTH] Admin access granted for user ${user.id}`);
    return { user };
  } catch (error) {
    console.error('[ADMIN_AUTH] Error checking admin auth:', error);
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Middleware for admin-only API routes
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAdminAuth();
    
    if (authResult.error) {
      return authResult.error;
    }
    
    return handler(request, authResult.user);
  };
}