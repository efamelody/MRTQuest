import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📋 [signin-with-username] Request received');
    const { username } = await request.json();
    console.log('📋 [signin-with-username] Username:', username);

    if (!username) {
      console.log('❌ [signin-with-username] Username is empty');
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [signin-with-username] Querying User table for username:', username);
    // Query User (ba_user) table by name field
    const user = await prisma.user.findFirst({
      where: {
        name: {
          mode: 'insensitive',  // Case-insensitive search
          equals: username,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log('🔍 [signin-with-username] Query result:', user);

    if (!user) {
      console.log('❌ [signin-with-username] No user found with username:', username);
      return NextResponse.json(
        { error: 'Username not found' },
        { status: 404 }
      );
    }

    console.log('✅ [signin-with-username] Found user:', { id: user.id, email: user.email, name: user.name });
    return NextResponse.json({ email: user.email });
  } catch (err) {
    console.error('❌ [signin-with-username] Unexpected error:', err);
    return NextResponse.json(
      { error: `Internal error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

