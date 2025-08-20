import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logUserLogin, logUserLogout } from '@/lib/activity-tracking';

// Store active sessions in memory (in production, use Redis or similar)
const activeSessions = new Map<string, { userId: string; loginHistoryId: string }>();

export async function middleware(request: NextRequest) {
  // Only track authenticated routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/admin');
  
  if (!isAuthRoute) {
    return NextResponse.next();
  }

  // Get user from session (this would depend on your auth system)
  // For now, we'll check for a user token in headers
  const userId = request.headers.get('x-user-id');
  const authToken = request.cookies.get('auth-token')?.value;

  if (!userId && !authToken) {
    return NextResponse.next();
  }

  const effectiveUserId = userId || 'anonymous';

  // Check if this is a new session
  const sessionId = request.cookies.get('session-id')?.value;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    // New session detected
    try {
      const loginHistoryId = await logUserLogin(effectiveUserId, request);
      
      // Create new session ID and store it
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      activeSessions.set(newSessionId, {
        userId: effectiveUserId,
        loginHistoryId,
      });

      // Set session cookie
      const response = NextResponse.next();
      response.cookies.set('session-id', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } catch (error) {
      console.error('Failed to log login:', error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};