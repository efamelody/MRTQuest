import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware runs on the Edge runtime and cannot validate sessions via Prisma.
  // Auth-gated redirects (e.g. /login → /passport) are handled client-side
  // by each page using the useSession() hook.
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
