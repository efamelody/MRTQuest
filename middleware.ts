import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie set by Better Auth
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie?.value;

  // Redirect to passport if trying to access login while already authenticated
  if ((pathname === "/login") && isAuthenticated) {
    return NextResponse.redirect(new URL("/passport", request.url));
  }

  // All other routes (including /passport) are publicly accessible
  // The pages handle showing appropriate UI based on auth state
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
