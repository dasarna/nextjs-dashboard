// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

export async function middleware(request: NextRequest) {
  try {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const { pathname } = request.nextUrl;

    console.log('Middleware - session:', JSON.stringify(session, null, 2));
    console.log('Middleware - pathname:', pathname);

    // Define protected routes
    const isOnDashboard = pathname.startsWith('/dashboard');
    const isOnAdmin = pathname.startsWith('/admin');

    // If user is not logged in, redirect to login for protected routes
    if (!isLoggedIn && (isOnDashboard || isOnAdmin)) {
      console.log('Middleware - Unauthenticated, redirecting to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is logged in, check role-based access
    if (isLoggedIn && session?.user) {
      const userRole = session.user.role || 'web_user';
      console.log('Middleware - userRole:', userRole);

      // Redirect logged-in users from /login to appropriate page
      if (pathname === '/login') {
        if (userRole === 'admin') {
          console.log('Middleware - Admin user, redirecting to /admin');
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        console.log('Middleware - Non-admin user, redirecting to /dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Restrict access based on role
      if (isOnAdmin && userRole !== 'admin') {
        console.log('Middleware - Non-admin tried to access /admin, redirecting to /dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (isOnDashboard && userRole !== 'admin' && userRole !== 'web_user') {
        console.log('Middleware - Invalid role for /dashboard, redirecting to /login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    console.log('Middleware - Allowing request to proceed');
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  runtime: 'nodejs',
};
