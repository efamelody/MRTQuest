import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Session-based filtering: "New RLS" ← userId from Better Auth session
  const userId = session.user.id;

  try {
    // Fetch user's visits with attraction and station details (filtered by userId)
    const visits = await prisma.visit.findMany({
      where: { userId },  // ← userId filter
      select: {
        id: true,
        visitedAt: true,
        verificationType: true,
        attraction: {
          select: {
            name: true,
            station: {
              select: {
                name: true,
                line: true,
              },
            },
          },
        },
      },
      orderBy: { visitedAt: 'desc' },
      take: 100,
    });

    // Deduplicate by siteId — one entry per attraction, photo verification wins
    const seen = new Map<string, { name: string; stationName: string; line: string; visitedAt: string; isPhotoVerified: boolean }>();

    for (const visit of visits) {
      const siteId = visit.attraction?.station?.name;
      if (!siteId) continue;

      const isPhoto = visit.verificationType === 'photo';
      const existing = seen.get(siteId);

      if (!existing) {
        seen.set(siteId, {
          name: visit.attraction?.name ?? 'Unknown attraction',
          stationName: visit.attraction?.station?.name ?? 'Unknown station',
          line: visit.attraction?.station?.line ?? '',
          visitedAt: new Date(visit.visitedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          isPhotoVerified: isPhoto,
        });
      } else if (isPhoto && !existing.isPhotoVerified) {
        // Upgrade verification level if we find a photo visit for same site
        seen.set(siteId, { ...existing, isPhotoVerified: true });
      }
    }

    const visitHistory = Array.from(seen.entries()).map(([siteId, v]) => ({
      siteId,
      ...v,
    }));

    return NextResponse.json({ visits: visitHistory });
  } catch (error) {
    console.error('[/api/visits/history] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visit history' },
      { status: 500 }
    );
  }
}
