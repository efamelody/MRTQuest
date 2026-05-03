import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from 'next/server';

type BadgeRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria_type: string | null;
  criteria_value: number | null;
  criteria_target: string | null;
  station_id: string | null;
  stations: Array<{ active: boolean }> | null;
  user_badges: Array<{ earned_at: string }>;
};

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id ?? null;

  try {
    // Fetch all badges (reference data — no userId filter needed)
    const allBadges = await prisma.badge.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        criteriaType: true,
        criteriaValue: true,
        criteriaTarget: true,
        stationId: true,
        station: {
          select: { active: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // If user is authenticated, fetch their earned badges (filtered by userId — "New RLS")
    const userBadgeMap = new Map<string, { earned_at: string }[]>();

    if (userId) {
      const userBadges = await prisma.userBadge.findMany({
        where: { userId },  // ← userId filter (Better Auth session)
        select: {
          badgeId: true,
          earnedAt: true,
        },
      });

      for (const ub of userBadges) {
        const existing = userBadgeMap.get(ub.badgeId) ?? [];
        existing.push({ earned_at: ub.earnedAt.toISOString() });
        userBadgeMap.set(ub.badgeId, existing);
      }
    }

    // Transform to match expected response format
    const badges: BadgeRow[] = allBadges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteria_type: badge.criteriaType,
      criteria_value: badge.criteriaValue,
      criteria_target: badge.criteriaTarget,
      station_id: badge.stationId,
      stations: badge.station ? [{ active: badge.station.active }] : null,
      user_badges: userBadgeMap.get(badge.id) ?? [],
    }));

    return NextResponse.json({ badges });
  } catch (error) {
    console.error('[/api/badges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
