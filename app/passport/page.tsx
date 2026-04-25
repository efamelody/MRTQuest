'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Clock3, LogOut, MapPin, Sparkles, Star, UserCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
const supabase = createClient();

type EarnedBadge = {
  id: string;
  name: string;
  icon: string | null;
};

type RecentVisit = {
  id: string;
  name: string;
  visitedAt: string;
  rating: number;
};

export default function PassportPage() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const router = useRouter();
  const isAuthenticated = Boolean(userId);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchPassportData = async () => {
      setIsLoading(true);
      setError(null);

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

      if (visitRes.error || reviewRes.error || badgeRes.error || recentRes.error) {
        setError(
          visitRes.error?.message ??
            reviewRes.error?.message ??
            badgeRes.error?.message ??
            recentRes.error?.message ??
            'Unable to load passport data.',
        );
        setIsLoading(false);
        return;
      }

      setVisitCount(visitRes.count ?? 0);
      setReviewCount(reviewRes.count ?? 0);
      setBadgeCount(badgeRes.count ?? 0);

      const recent = (recentRes.data ?? []).map((visit: any) => ({
        id: visit.id,
        name: visit.site_id?.name ?? 'Unknown location',
        visitedAt: new Date(visit.visited_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        rating: 4,
      }));
      setRecentVisits(recent);

      if ((badgeRes.count ?? 0) > 0) {
        const { data: badgeData, error: badgeDetailError } = await supabase
          .from('user_badges')
          .select('badge_id, badges(id,name,icon)')
          .eq('user_id', userId)
          .limit(3);

        if (!badgeDetailError) {
          setEarnedBadges(
            (badgeData ?? []).map((entry: any) => ({
              id: entry.badge_id,
              name: entry.badges?.name ?? 'Badge',
              icon: entry.badges?.icon ?? null,
            })),
          );
        }
      }

      setIsLoading(false);
    };

    fetchPassportData();
  }, [userId]);

  const questPoints = useMemo(() => visitCount * 8 + badgeCount * 25 + reviewCount * 4, [visitCount, reviewCount, badgeCount]);
  const streakDays = Math.min(7, recentVisits.length);
  const rankLabel = useMemo(() => {
    if (questPoints >= 200) return 'Transit Legend';
    if (questPoints >= 120) return 'Merdeka Wanderer';
    return 'City Explorer';
  }, [questPoints]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId('');
    setVisitCount(0);
    setReviewCount(0);
    setBadgeCount(0);
    setEarnedBadges([]);
    setRecentVisits([]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex min-h-screen flex-col gap-6 px-6 pb-20 pt-6">
        <section className="rounded-3xl bg-white/75 backdrop-blur-sm border border-white/70 p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary bg-slate-100 text-primary">
            <UserCircle2 className="h-16 w-16" />
          </div>
          <h1 className="font-gamified text-4xl tracking-tight text-heading">Passport</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-500">{rankLabel}</p>
          <p className="mt-4 text-sm text-slate-600">A travel journal for your MRTQuest adventures. Save stamps, earn badges, and keep your mission moving.</p>
        </section>

        <section className="flex gap-3">
          <StatCard label="Stops Visited" value={String(isAuthenticated ? visitCount : 0)} icon={MapPin} />
          <StatCard label="Quest Points" value={String(isAuthenticated ? questPoints : 0)} icon={Sparkles} />
          <StatCard label="Day Streak" value={`${isAuthenticated ? streakDays : 0}d`} icon={Clock3} />
        </section>

        <section className="rounded-3xl bg-white/75 backdrop-blur-sm border border-white/70 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-gamified text-heading">Recent Stamps</h2>
              <p className="text-sm text-slate-500">Your latest city check-ins</p>
            </div>
            {isLoading && <span className="text-sm text-slate-500">Refreshing…</span>}
          </div>

          {!isAuthenticated ? (
            <div className="rounded-3xl bg-slate-50 p-6 text-center border border-slate-200">
              <p className="text-sm text-slate-600">Join the quest to collect passport stamps and see your trip history.</p>
            </div>
          ) : recentVisits.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-6 text-center border border-slate-200">
              <p className="text-sm text-slate-600">Your passport is ready. Tap a station to start collecting stamps.</p>
            </div>
          ) : (
            <div className="relative ml-4 pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-primary/30">
              <div className="space-y-4">
                {recentVisits.map((visit) => (
                  <StampItem key={visit.id} visit={visit} />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white/80 backdrop-blur-sm border border-dashed border-slate-300 p-6 text-center shadow-sm">
          {isAuthenticated ? (
            <>
              <p className="text-sm text-slate-600 mb-4">Ready to close your passport for the day?</p>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Logout of Quest
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-heading mb-2">Join the Quest</h3>
              <p className="text-sm text-slate-600 mb-4">Sign in to save your stamps, unlock badges, and earn heritage points.</p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                Create your boarding pass
              </button>
            </>
          )}
        </section>

        {error && (
          <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof MapPin;
}) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white/70 p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-heading">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-slate-500">{label}</p>
    </div>
  );
}

function StampItem({ visit }: { visit: RecentVisit }) {
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <div className="absolute -left-3 top-4 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
        ST
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-heading">{visit.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Stamp collected</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase text-slate-600">
          {visit.visitedAt}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-amber-500">
        {[...Array(5)].map((_, index) => (
          <Star key={index} className="h-4 w-4" />
        ))}
      </div>
    </div>
  );
}
