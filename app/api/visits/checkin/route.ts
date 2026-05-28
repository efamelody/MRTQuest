import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import { evaluateBadges } from '@/utils/badges';
import { calculateLevel } from '@/utils/gamification';
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

    // Idempotency: check for existing geofence check-in for this user + site
    const existing = await prisma.visit.findFirst({
      where: { userId, siteId: attractionId, verificationType: 'geofence' },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ visitId: existing.id, alreadyCheckedIn: true });
    }

    // Transaction: profile upsert, visit creation, and profile update atomically
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
        select: { total_xp: true, current_streak: true, last_visit_date: true },
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const XP_EARNED = 5;

      let newStreak: number;
      if (profile.last_visit_date) {
        const lastVisit = new Date(profile.last_visit_date);
        const lastVisitDay = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());
        const diffDays = Math.round((today.getTime() - lastVisitDay.getTime()) / (1000 * 60 * 60 * 24));

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

      const newTotalXp = profile.total_xp + XP_EARNED;
      const newLevel = calculateLevel(newTotalXp);

      const visit = await tx.visit.create({
        data: {
          userId,
          siteId: attractionId,
          verificationType: 'geofence',
          verifiedAt: now,
        },
        select: { id: true },
      });

      await tx.profile.update({
        where: { id: userId },
        data: {
          total_xp: { increment: XP_EARNED },
          current_level: { set: newLevel },
          current_streak: { set: newStreak },
          last_visit_date: { set: now },
        },
      });

      return { visit, newStreak, newTotalXp, newLevel };
    });

    const newBadges = await evaluateBadges(userId);
    return NextResponse.json({ visitId: result.visit.id, alreadyCheckedIn: false, newBadges });
  } catch (error) {
    console.error('[checkin] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
