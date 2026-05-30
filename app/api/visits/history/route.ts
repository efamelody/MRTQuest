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
        siteId: true,
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

    // Deduplicate by siteId (the attraction's unique id) — one entry per attraction, photo verification wins
    const seen = new Map<string, { name: string; stationName: string; line: string; visitedAt: string; isPhotoVerified: boolean }>();

    for (const visit of visits) {
      const key = visit.siteId;

      if (!key) continue;
      if (!visit.attraction) continue;

      const isPhoto = visit.verificationType === 'photo';
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, {
          name: visit.attraction.name,
          stationName: visit.attraction.station?.name ?? 'Unknown station',
          line: visit.attraction.station?.line ?? '',
          visitedAt: new Date(visit.visitedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          isPhotoVerified: isPhoto,
        });
      } else if (isPhoto && !existing.isPhotoVerified) {
        // Upgrade verification level if we find a photo visit for same site
        seen.set(key, { ...existing, isPhotoVerified: true });
      }
    }

    const visitHistory = Array.from(seen.entries()).map(([attractionId, v]) => ({
      siteId: attractionId,
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
