import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // optional auth redirect logic here
  return NextResponse.next();
}