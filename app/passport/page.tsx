'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Clock3, LogOut, MapPin, Sparkles, Star, UserCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/utils/auth-client';

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
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const userId = session?.user?.id;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);

  const isAuthenticated = !!userId;

  // Fetch passport data when userId is available
  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchPassportData = async () => {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/passport');

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Unable to load passport data.');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setVisitCount(data.visitCount);
      setReviewCount(data.reviewCount);
      setBadgeCount(data.badgeCount);
      setRecentVisits(data.recentVisits);
      setEarnedBadges(data.earnedBadges);
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
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            setVisitCount(0);
            setReviewCount(0);
            setBadgeCount(0);
            setEarnedBadges([]);
            setRecentVisits([]);
            router.push('/login');
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex min-h-screen flex-col gap-6 px-6 pb-20 pt-6">
        <section className="rounded-3xl bg-white/75 backdrop-blur-sm border border-white/70 p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary bg-slate-100 text-primary">
            <UserCircle2 className="h-16 w-16" />
          </div>
          <h1 className="font-gamified text-4xl tracking-tight text-heading">Passport</h1>
          {isAuthenticated && (
            <>
              <p className="mt-2 text-lg font-bold text-heading">{session?.user?.name || 'Explorer'}</p>
              <p className="mt-1 text-sm uppercase tracking-[0.25em] text-slate-500">{rankLabel}</p>
            </>
          )}
          <p className="mt-4 text-sm text-slate-600">A travel journal for your MRTQuest adventures. Save stamps, earn badges, and keep your mission moving.</p>
        </section>

        {isAuthenticated ? (
          <>
            <section className="flex gap-3">
              <StatCard label="Stops Visited" value={String(visitCount)} icon={MapPin} />
              <StatCard label="Quest Points" value={String(questPoints)} icon={Sparkles} />
              <StatCard label="Day Streak" value={`${streakDays}d`} icon={Clock3} />
            </section>

            <section className="rounded-3xl bg-white/75 backdrop-blur-sm border border-white/70 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-gamified text-heading">Recent Stamps</h2>
                  <p className="text-sm text-slate-500">Your latest city check-ins</p>
                </div>
                {isLoading && <span className="text-sm text-slate-500">Refreshing…</span>}
              </div>

              {recentVisits.length === 0 ? (
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
              <p className="text-sm text-slate-600 mb-4">Ready to close your passport for the day?</p>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Logout of Quest
              </button>
            </section>
          </>
        ) : (
          <section className="rounded-3xl bg-white/80 backdrop-blur-sm border border-dashed border-slate-300 p-6 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-heading mb-2">Join the Quest</h3>
            <p className="text-sm text-slate-600 mb-4">Sign in to save your stamps, unlock badges, and earn heritage points.</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Create your boarding pass
            </button>
          </section>
        )}

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
