import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { attractionId } = await request.json();

    if (!attractionId || typeof attractionId !== 'string') {
      return NextResponse.json({ error: 'attractionId is required' }, { status: 400 });
    }

    // Ensure a profile row exists (profiles FK-references ba_user)
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // Prevent duplicate geofence check-ins for the same attraction
    const existing = await prisma.visit.findFirst({
      where: { userId, siteId: attractionId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ visitId: existing.id, alreadyCheckedIn: true });
    }

    const visit = await prisma.visit.create({
      data: {
        userId,
        siteId: attractionId,
        verificationType: 'geofence',
        verifiedAt: new Date(),
      },
      select: { id: true },
    });

    return NextResponse.json({ visitId: visit.id, alreadyCheckedIn: false });
  } catch (error) {
    console.error('[checkin] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
