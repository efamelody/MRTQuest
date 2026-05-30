import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import { calculateLevel } from '@/utils/gamification';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Session-based filtering: "New RLS" ← userId from Better Auth session
  const userId = session.user.id;

  try {
    const [profile, visits, reviews, badges, recentVisits] = await Promise.all([
      // Fetch live profile state
      prisma.profile.findUnique({
        where: { id: userId },
        select: { total_xp: true, current_level: true, current_streak: true, last_visit_date: true },
      }),
      // Count distinct attractions with geofence check-in (deduplicates geofence+photo pairs)
      prisma.visit.groupBy({
        by: ['siteId'],
        where: { userId, verificationType: 'geofence' },
        _count: { siteId: true },
      }).then((groups) => groups.length),
      // Count user's reviews (filtered by userId)
      prisma.review.count({ where: { userId } }),
      // Count user's earned badges (filtered by userId)
      prisma.userBadge.count({ where: { userId } }),
      // Get recent visits (all types), deduplicated by siteId (filtered by userId)
      prisma.visit.findMany({
        where: { userId },
        select: {
          id: true,
          siteId: true,
          visitedAt: true,
          attraction: {
            select: {
              name: true,
              station: {
                select: { line: true },
              },
            },
          },
        },
        orderBy: { visitedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Validate and sync level if DB is stale
    let currentLevel = profile?.current_level ?? 1;
    const totalXp = profile?.total_xp ?? 0;
    const expectedLevel = calculateLevel(totalXp);

    if (expectedLevel !== currentLevel) {
      await prisma.profile.update({
        where: { id: userId },
        data: { current_level: { set: expectedLevel } },
      });
      currentLevel = expectedLevel;
    }

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
      totalXp,
      currentLevel,
      currentStreak: profile?.current_streak ?? 0,
      lastVisitDate: profile?.last_visit_date ?? null,
      visitCount: visits,
      reviewCount: reviews,
      badgeCount: badges,
      recentVisits: (() => {
        const seen = new Set<string>();
        return recentVisits
          .filter((v: { siteId: string }) => {
            if (seen.has(v.siteId)) return false;
            seen.add(v.siteId);
            return true;
          })
          .slice(0, 3)
          .map((visit: { id: string; visitedAt: Date; attraction: { name: string; station: { line: string } | null } | null }) => ({
            id: visit.id,
            name: visit.attraction?.name ?? 'Unknown location',
            line: visit.attraction?.station?.line ?? null,
            visitedAt: new Date(visit.visitedAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
          }));
      })(),
      earnedBadges: earnedBadges.map((ub: { badgeId: string; badge: { id: string; name: string; icon: string | null } | null }) => ({
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
