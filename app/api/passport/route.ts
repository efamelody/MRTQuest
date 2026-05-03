import { auth } from '@/utils/auth';
import { createServiceClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const supabase = createServiceClient();

  const [visitRes, reviewRes, badgeRes, recentRes] = await Promise.all([
    supabase.from('visits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('visits')
      .select('id,visited_at,site_id(name)')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false })
      .limit(3),
  ]);

  const queryError =
    visitRes.error?.message ??
    reviewRes.error?.message ??
    badgeRes.error?.message ??
    recentRes.error?.message;

  if (queryError) {
    return NextResponse.json({ error: queryError }, { status: 500 });
  }

  const badgeCount = badgeRes.count ?? 0;
  let earnedBadges: Array<{ id: string; name: string; icon: string | null }> = [];

  if (badgeCount > 0) {
    const { data: badgeData } = await supabase
      .from('user_badges')
      .select('badge_id, badges(id,name,icon)')
      .eq('user_id', userId)
      .limit(3);

    earnedBadges = (badgeData ?? []).map((entry: any) => ({
      id: entry.badge_id as string,
      name: (entry.badges?.name as string | undefined) ?? 'Badge',
      icon: (entry.badges?.icon as string | undefined) ?? null,
    }));
  }

  return NextResponse.json({
    visitCount: visitRes.count ?? 0,
    reviewCount: reviewRes.count ?? 0,
    badgeCount,
    recentVisits: (recentRes.data ?? []).map((visit: any) => ({
      id: visit.id as string,
      name: (visit.site_id?.name as string | undefined) ?? 'Unknown location',
      visitedAt: new Date(visit.visited_at as string).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    })),
    earnedBadges,
  });
}
