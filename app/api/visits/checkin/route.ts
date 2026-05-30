import { prisma } from '@/utils/prisma';
import { evaluateBadges } from '@/utils/badges';
import { calculateLevel } from '@/utils/gamification';
import { requireAuth } from '@/utils/with-auth';
import { logAuditEvent } from '@/utils/audit';
import { NextRequest, NextResponse } from 'next/server';

function toMalaysiaDay(date: Date): number {
  const ms = date.getTime() + 8 * 60 * 60 * 1000;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (typeof auth !== 'string') return auth;
    const userId = auth;
    const { attractionId } = await request.json();

    if (!attractionId || typeof attractionId !== 'string') {
      return NextResponse.json({ error: 'attractionId is required' }, { status: 400 });
    }

    // Idempotency: check for existing geofence check-in for this user + site
    const existing = await prisma.visit.findFirst({
      where: { userId, siteId: attractionId, verificationType: 'geofence' },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already checked in at this location', visitId: existing.id, alreadyCheckedIn: true },
        { status: 409 }
      );
    }

    // Transaction: profile upsert, visit creation, and profile update atomically
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
        select: { current_streak: true, last_visit_date: true },
      });

      const now = new Date();
      const todayDay = toMalaysiaDay(now);
      const XP_EARNED = 5;

      let newStreak: number;
      if (profile.last_visit_date) {
        const lastVisitDay = toMalaysiaDay(profile.last_visit_date);
        const diffDays = todayDay - lastVisitDay;

        if (diffDays === 0) {
          newStreak = profile.current_streak;
        } else if (diffDays === 1) {
          newStreak = profile.current_streak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const visit = await tx.visit.create({
        data: {
          userId,
          siteId: attractionId,
          verificationType: 'geofence',
          verifiedAt: now,
        },
        select: { id: true },
      });

      // Atomic increment for XP — safe against concurrent requests
      const updatedProfile = await tx.profile.update({
        where: { id: userId },
        data: {
          total_xp: { increment: XP_EARNED },
          current_streak: { set: newStreak },
          last_visit_date: { set: now },
        },
        select: { total_xp: true },
      });

      // Compute level from the actual (post-increment) XP value
      const newLevel = calculateLevel(updatedProfile.total_xp);

      await tx.profile.update({
        where: { id: userId },
        data: { current_level: { set: newLevel } },
      });

      // Evaluate badges inside the transaction — atomic with visit creation
      const newBadges = await evaluateBadges(userId, tx);

      return { visit, newStreak, newBadges };
    });

    logAuditEvent(userId, 'checkin.geofence', { attractionId, visitId: result.visit.id });
    return NextResponse.json({ visitId: result.visit.id, alreadyCheckedIn: false, newBadges: result.newBadges });
  } catch (error) {
    console.error('[checkin] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
