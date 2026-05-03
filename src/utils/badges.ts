import { prisma } from '@/utils/prisma';

export type EarnedBadge = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
};

export async function evaluateBadges(userId: string): Promise<EarnedBadge[]> {
  const [allBadges, earnedUserBadges, geofenceVisits, correctQuizCount, reviewCount] =
    await Promise.all([
      prisma.badge.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          criteriaType: true,
          criteriaValue: true,
          criteriaTarget: true,
          stationId: true,
        },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
      prisma.visit.findMany({
        where: { userId, verificationType: 'geofence' },
        select: {
          siteId: true,
          visitedAt: true,
          attraction: {
            select: {
              stationId: true,
              category: true,
              station: {
                select: { line: true, active: true },
              },
            },
          },
        },
      }),
      prisma.userQuizAttempt.count({ where: { userId, isCorrect: true } }),
      prisma.review.count({ where: { userId } }),
    ]);

  const earnedBadgeIds = new Set(earnedUserBadges.map((ub) => ub.badgeId));
  const unearnedBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  if (unearnedBadges.length === 0) return [];

  // Deduplicate visits by siteId for count/presence checks
  // (checkin route prevents duplicates, but defensive dedup keeps logic pure)
  const seenSiteIds = new Set<string>();
  const uniqueVisits = geofenceVisits.filter((v) => {
    if (seenSiteIds.has(v.siteId)) return false;
    seenSiteIds.add(v.siteId);
    return true;
  });

  const visitCount = uniqueVisits.length;
  const visitedStationIds = new Set(
    uniqueVisits
      .map((v) => v.attraction?.stationId)
      .filter((id): id is string => id !== null && id !== undefined),
  );
  const visitedLines = new Set(
    uniqueVisits
      .map((v) => v.attraction?.station?.line)
      .filter((l): l is string => l !== null && l !== undefined),
  );

  const newlyEarned: EarnedBadge[] = [];

  for (const badge of unearnedBadges) {
    const type = badge.criteriaType;
    const value = badge.criteriaValue ?? 0;
    const target = badge.criteriaTarget;
    let met = false;

    if (type === 'visit_count') {
      if (!target) {
        met = visitCount >= value;
      } else {
        // Category-scoped visit count (e.g. "Mosque", "Deep Stations")
        const scopedCount = uniqueVisits.filter(
          (v) => v.attraction?.category?.toLowerCase() === target.toLowerCase(),
        ).length;
        met = scopedCount >= value;
      }
    } else if (type === 'station_stamp') {
      met =
        badge.stationId !== null &&
        badge.stationId !== undefined &&
        visitedStationIds.has(badge.stationId);
    } else if (type === 'time_check') {
      // criteria_value = hour (0-23 MST/UTC+8), criteria_target = 'before' | 'after'
      // Use all visits (not deduplicated) so any qualifying check-in time counts
      met = geofenceVisits.some((v) => {
        const localHour = (new Date(v.visitedAt).getUTCHours() + 8) % 24;
        return target === 'after' ? localHour >= value : localHour < value;
      });
    } else if (type === 'multi_line') {
      // criteria_target = "Kajang, Putrajaya" — all listed lines must be present in visited lines
      const requiredLines = (target ?? '')
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);
      met =
        requiredLines.length > 0 &&
        requiredLines.every((required) =>
          [...visitedLines].some((visited) =>
            visited.toLowerCase().includes(required.toLowerCase()),
          ),
        );
    } else if (type === 'line_master') {
      // criteria_target = "Kajang Line" | "Putrajaya Line"
      // criteria_value = total active stations on that line the user must have visited
      const visitedOnLine = uniqueVisits.filter(
        (v) =>
          v.attraction?.station?.active &&
          v.attraction?.station?.line?.toLowerCase() === (target ?? '').toLowerCase(),
      );
      const distinctStations = new Set(
        visitedOnLine
          .map((v) => v.attraction?.stationId)
          .filter((id): id is string => id !== null && id !== undefined),
      );
      met = distinctStations.size >= value;
    } else if (type === 'quiz_master') {
      met = correctQuizCount >= value;
    } else if (type === 'first_review') {
      met = reviewCount >= value;
    }
    // photo_review: skipped — Review model has no image_url field yet

    if (met) {
      newlyEarned.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
      });
    }
  }

  if (newlyEarned.length === 0) return [];

  await prisma.userBadge.createMany({
    data: newlyEarned.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });

  return newlyEarned;
}
