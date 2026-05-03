import { auth } from '@/utils/auth';
import { createServiceClient } from '@/utils/supabase/server';
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

  const supabase = createServiceClient();

  const { data: allBadges, error: badgesError } = await supabase
    .from('badges')
    .select('id,name,description,icon,criteria_type,criteria_value,criteria_target,station_id,stations(active)')
    .order('name', { ascending: true });

  if (badgesError) {
    return NextResponse.json({ error: badgesError.message }, { status: 500 });
  }

  const earnedMap = new Map<string, { earned_at: string }[]>();

  if (userId) {
    const { data: userBadges, error: ubError } = await supabase
      .from('user_badges')
      .select('badge_id,earned_at')
      .eq('user_id', userId);

    if (ubError) {
      return NextResponse.json({ error: ubError.message }, { status: 500 });
    }

    for (const ub of userBadges ?? []) {
      const existing = earnedMap.get(ub.badge_id) ?? [];
      existing.push({ earned_at: ub.earned_at });
      earnedMap.set(ub.badge_id, existing);
    }
  }

  const badges: BadgeRow[] = (allBadges ?? []).map((badge) => ({
    ...badge,
    stations: badge.stations as Array<{ active: boolean }> | null,
    user_badges: earnedMap.get(badge.id) ?? [],
  }));

  return NextResponse.json({ badges });
}
