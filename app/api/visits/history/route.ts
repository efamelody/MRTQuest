import { auth } from '@/utils/auth';
import { createServiceClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type VisitRow = {
  id: string;
  visited_at: string;
  verification_type: string | null;
  site_id: string | null;
  attractions: {
    name: string;
    stations: {
      name: string;
      line: string;
    } | null;
  } | null;
};

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('visits')
    .select('id,visited_at,verification_type,site_id,attractions(name,stations(name,line))')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by site_id — one entry per attraction, photo verification wins
  const seen = new Map<string, { name: string; stationName: string; line: string; visitedAt: string; isPhotoVerified: boolean }>();

  for (const row of (data ?? []) as VisitRow[]) {
    const siteId = row.site_id;
    if (!siteId) continue;

    const isPhoto = row.verification_type === 'photo';
    const existing = seen.get(siteId);

    if (!existing) {
      seen.set(siteId, {
        name: row.attractions?.name ?? 'Unknown attraction',
        stationName: row.attractions?.stations?.name ?? 'Unknown station',
        line: row.attractions?.stations?.line ?? '',
        visitedAt: new Date(row.visited_at).toLocaleDateString('en-GB', {
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

  const visits = Array.from(seen.entries()).map(([siteId, v]) => ({
    siteId,
    ...v,
  }));

  return NextResponse.json({ visits, total: visits.length });
}
