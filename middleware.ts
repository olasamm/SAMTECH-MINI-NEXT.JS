import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If accessing a public route, allow it
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If accessing API auth routes, allow them
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If no auth token and trying to access protected route, redirect to login
  if (!authToken && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow access to other routes (like API routes that handle their own auth)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};

