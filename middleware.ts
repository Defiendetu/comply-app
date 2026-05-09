import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    const hasAuthCookies = request.cookies.getAll().some(
      c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    if (!hasAuthCookies) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/login') {
    const hasAuthCookies = request.cookies.getAll().some(
      c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );
    if (hasAuthCookies) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
