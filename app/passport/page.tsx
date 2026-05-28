'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Clock3, LogOut, MapPin, UserCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/utils/auth-client';
import { useCountUp } from '@/utils/useCountUp';
import { LevelProgress } from '@/components/LevelProgress';

type EarnedBadge = {
  id: string;
  name: string;
  icon: string | null;
};

type RecentVisit = {
  id: string;
  name: string;
  visitedAt: string;
  line: string | null;
};

export default function PassportPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const userId = session?.user?.id;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);
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
      setTotalXp(data.totalXp ?? 0);
      setCurrentLevel(data.currentLevel ?? 1);
      setCurrentStreak(data.currentStreak ?? 0);
      setVisitCount(data.visitCount);
      setReviewCount(data.reviewCount);
      setBadgeCount(data.badgeCount);
      setRecentVisits(data.recentVisits);
      setEarnedBadges(data.earnedBadges);
      setIsLoading(false);
    };

    fetchPassportData();
  }, [userId]);

  const rankLabel = useMemo(() => {
    switch (currentLevel) {
      case 3: return 'Klang Valley Master';
      case 2: return 'Merdeka Wanderer';
      default: return 'City Explorer';
    }
  }, [currentLevel]);

  const animatedVisitCount = useCountUp(visitCount);
  const animatedTotalXp = useCountUp(totalXp);
  const animatedStreakDays = useCountUp(currentStreak);
  const animatedBadgeCount = useCountUp(badgeCount);

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            setTotalXp(0);
            setCurrentLevel(1);
            setCurrentStreak(0);
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
      <div className="min-h-screen bg-[#FFF9F0] max-w-lg mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0] max-w-lg mx-auto">
      <div className="flex min-h-screen flex-col gap-6 px-6 pb-20 pt-6">
        <section className="rounded-2xl bg-white border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-6 text-center hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-[2px] border-[1.5px] border-[#0F172A] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] bg-white text-[#0D9488]">
            <UserCircle2 className="h-16 w-16" />
          </div>
          <h1 className="font-gamified text-4xl tracking-tight text-[#2D3250]">Passport</h1>
          {isAuthenticated && (
            <>
              <p className="mt-2 text-lg font-bold text-[#2D3250]">{session?.user?.name || 'Explorer'}</p>
              <p className="mt-1 text-sm uppercase tracking-[0.25em] text-slate-500">{rankLabel}</p>
            </>
          )}
          <p className="mt-4 text-sm text-slate-600">A travel journal for your MRTQuest adventures. Save stamps, earn badges, and keep your mission moving.</p>
        </section>

        {isAuthenticated ? (
          <>
            <LevelProgress xp={totalXp} />

            <section className="flex gap-3">
              <StatCard label="Stops Visited" value={String(animatedVisitCount)} icon={MapPin} />
              <StatCard label="Badges Earned" value={String(animatedBadgeCount)} icon={Award} />
              <StatCard label="Day Streak" value={`${animatedStreakDays}d`} icon={Clock3} />
            </section>

            <section className="rounded-2xl bg-white border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-6 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-gamified text-[#2D3250]">Recent Stamps</h2>
                  <p className="text-sm text-slate-500">Your latest city check-ins</p>
                </div>
                {isLoading && <span className="text-sm text-slate-500">Refreshing…</span>}
              </div>

              {recentVisits.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-center border border-slate-200">
                  <p className="text-sm text-slate-600">Your passport is ready. Tap a station to start collecting stamps.</p>
                </div>
              ) : (
                <div className="relative ml-4 pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[1.5px] before:bg-[#0F172A]/20">
                  <div className="space-y-4">
                    {recentVisits.map((visit) => (
                      <StampItem key={visit.id} visit={visit} />
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white border-[1.5px] border-dashed border-[#0F172A] p-6 text-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
              <p className="text-sm text-slate-600 mb-4">Ready to close your passport for the day?</p>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#0F172A] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout of Quest
              </button>
            </section>
          </>
        ) : (
          <section className="rounded-2xl bg-white border-[1.5px] border-dashed border-[#0F172A] p-6 text-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <h3 className="text-lg font-semibold text-[#2D3250] mb-2">Join the Quest</h3>
            <p className="text-sm text-slate-600 mb-4">Sign in to save your stamps, unlock badges, and earn heritage points.</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full rounded-2xl bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all border-[1.5px] border-[#0F172A]"
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
    <div className="rounded-2xl bg-white border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-4 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D9488]/10 text-[#0D9488] mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-[#2D3250]">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-slate-500">{label}</p>
    </div>
  );
}

function StampItem({ visit }: { visit: RecentVisit }) {
  const isKajang = visit.line?.toLowerCase().includes('kajang') ?? false;
  const lineColor = isKajang ? '#0D9488' : '#FFB300';
  const lineLabel = isKajang ? 'KJ' : 'PY';
  const rotation = visit.id.charCodeAt(0) % 2 === 0 ? 'rotate-1' : '-rotate-1';

  return (
    <div className={`relative rounded-2xl border-[1.5px] border-[#0F172A] bg-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-4 transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${rotation}`}>
      <div
        className="absolute -left-3 top-4 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: lineColor }}
      >
        {lineLabel}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#2D3250]">{visit.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Stamp collected</p>
        </div>
        <div className="rounded-full border border-[#0F172A] bg-white px-3 py-1 text-[11px] font-semibold uppercase text-slate-600 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
          {visit.visitedAt}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
          style={{
            color: lineColor,
            background: `${lineColor}15`,
            border: `1px solid ${lineColor}30`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: lineColor }}
          />
          {isKajang ? 'Kajang Line' : 'Putrajaya Line'}
        </span>
      </div>
    </div>
  );
}
