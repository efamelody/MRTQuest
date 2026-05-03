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
    const [visits, reviews, badges, recentVisits] = await Promise.all([
      // Count user's visits (filtered by userId)
      prisma.visit.count({ where: { userId } }),
      // Count user's reviews (filtered by userId)
      prisma.review.count({ where: { userId } }),
      // Count user's earned badges (filtered by userId)
      prisma.userBadge.count({ where: { userId } }),
      // Get 3 most recent visits with attraction details (filtered by userId)
      prisma.visit.findMany({
        where: { userId },  // ← userId filter
        select: {
          id: true,
          visitedAt: true,
          attraction: {
            select: { name: true },
          },
        },
        orderBy: { visitedAt: 'desc' },
        take: 3,
      }),
    ]);

    // Fetch recently earned badges
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },  // ← userId filter
      select: {
        badgeId: true,
        badge: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      take: 3,
    });

    return NextResponse.json({
      visitCount: visits,
      reviewCount: reviews,
      badgeCount: badges,
      recentVisits: recentVisits.map((visit) => ({
        id: visit.id,
        name: visit.attraction?.name ?? 'Unknown location',
        visitedAt: new Date(visit.visitedAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      })),
      earnedBadges: earnedBadges.map((ub) => ({
        id: ub.badgeId,
        name: ub.badge?.name ?? 'Badge',
        icon: ub.badge?.icon ?? null,
      })),
    });
  } catch (error) {
    console.error('[/api/passport] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
