'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Crown, MapPin, Ticket, Zap } from 'lucide-react';
import { BadgeCard } from '@/components/BadgeCard';
import { useSession } from '@/utils/auth-client';

type BadgeRecord = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria_type?: string | null;
  criteria_value?: number | null;
  criteria_target?: string | null;
  station_id?: string | null;
  stations?: Array<{ active: boolean }> | null;
  user_badges?: Array<{ earned_at: string }>;
};

type CategorizedBadges = {
  featured: BadgeRecord[];
  stamps: BadgeRecord[];
  quests: BadgeRecord[];
};

type TabType = 'all' | 'visits' | 'earned' | 'featured' | 'stamps' | 'quests';

type VisitSummary = {
  siteId: string;
  name: string;
  stationName: string;
  line: string;
  visitedAt: string;
  isPhotoVerified: boolean;
};

type Station = {
  id: string;
  name: string;
  line: string;
  active: boolean;
  sequenceOrder: number | null;
};

type StationWithVisit = Station & { visit: VisitSummary | null };

export default function BadgePage() {
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [visits, setVisits] = useState<VisitSummary[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [errorVisits, setErrorVisits] = useState<string | null>(null);
  const visitsFetched = useRef(false);
  const { data: session } = useSession();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  const currentUserId = session?.user?.id ?? '';
  const hasUser = Boolean(currentUserId);

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/badges');
        if (!res.ok) throw new Error('Failed to load badges');
        const json = await res.json() as { badges: BadgeRecord[] };
        setBadges(json.badges);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [hasUser]);

  useEffect(() => {
    if (!hasUser || visitsFetched.current) return;

    const fetchVisits = async () => {
      setIsLoadingVisits(true);
      setErrorVisits(null);
      try {
        const res = await fetch('/api/visits/history');
        if (!res.ok) throw new Error('Failed to load visits');
        const json = await res.json() as { visits: VisitSummary[] };
        setVisits(json.visits);
        visitsFetched.current = true;
      } catch (err) {
        setErrorVisits(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoadingVisits(false);
      }
    };

    fetchVisits();
  }, [hasUser]);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoadingStations(true);
      try {
        const res = await fetch('/api/stations');
        if (!res.ok) throw new Error('Failed to load stations');
        const json = await res.json() as { stations: Station[] };
        setStations((json.stations ?? []).filter((s) => s.active));
      } catch {
        setStations([]);
      } finally {
        setIsLoadingStations(false);
      }
    };
    fetchStations();
  }, []);

  const badgeStats = useMemo(() => {
    const earnedBadges = badges.filter((badge) => badge.user_badges?.length);
    return {
      total: badges.length,
      earned: earnedBadges.length,
      earnedBadges,
    };
  }, [badges]);

  const categorizedBadges = useMemo(() => {
    return {
      featured: badges.filter((b) => ['line_master', 'milestone', 'visit_count'].includes(b.criteria_type ?? '')),
      stamps: badges.filter((b) => b.criteria_type === 'station_stamp'),
      quests: badges.filter((b) => ['time_check', 'multi_line', 'photo_review', 'quiz_master'].includes(b.criteria_type ?? '')),
    };
  }, [badges]);

  const stationCabinet = useMemo(() => {
    const visitMap = new Map<string, VisitSummary>();
    visits.forEach((v) => visitMap.set(v.stationName, v));
    return stations.map((s) => ({ ...s, visit: visitMap.get(s.name) ?? null }));
  }, [stations, visits]);

  const filteredBadgesForTab = useMemo(() => {
    switch (activeTab) {
      case 'earned': {
        const earned = badges.filter((b) => b.user_badges?.length);
        return {
          featured: earned.filter((b) => ['line_master', 'milestone', 'visit_count'].includes(b.criteria_type ?? '')),
          stamps: earned.filter((b) => b.criteria_type === 'station_stamp'),
          quests: earned.filter((b) => ['time_check', 'multi_line', 'photo_review', 'quiz_master'].includes(b.criteria_type ?? '')),
        };
      }
      case 'featured':
        return { featured: categorizedBadges.featured, stamps: [], quests: [] };
      case 'stamps':
        return { featured: [], stamps: categorizedBadges.stamps, quests: [] };
      case 'quests':
        return { featured: [], stamps: [], quests: categorizedBadges.quests };
      default:
        return categorizedBadges;
    }
  }, [activeTab, badges, categorizedBadges]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Badge Cabinet</p>
              <h1 className="text-3xl font-gamified text-[#2D3250] leading-tight">Stamp Rally Journal</h1>
            </div>
          </div>
          <p className="mt-3 text-slate-600">See what you&apos;ve earned and what&apos;s still waiting in your collector cabinet.</p>
        </div>

        <section className="px-6">
          <div className="bg-white rounded-2xl border-2 border-[#0F172A] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] transition-all">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Stamps Collected</p>
                <p className="text-3xl font-bold text-slate-900">{badgeStats.earned} / {badgeStats.total}</p>
              </div>
              <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center">
                <Award className="w-10 h-10 text-emerald-500" />
              </div>
            </div>

            <div className="mt-5 h-4 rounded-[2px] bg-slate-200 overflow-hidden flex gap-[2px] p-[1px]">
              {(() => {
                const ratio = badgeStats.total > 0 ? badgeStats.earned / badgeStats.total : 0;
                const segs = Math.round(ratio * 20);
                return Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${i < segs ? 'bg-emerald-500' : 'bg-slate-100'}`}
                    style={i < segs && i === segs - 1 ? { boxShadow: '0 0 6px rgba(16,185,129,0.5)' } : {}}
                  />
                ));
              })()}
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Progress toward your next milestone</p>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">{badgeStats.earned} badge{badgeStats.earned !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#00A959]" />
                <span className="text-sm font-semibold text-slate-700">
                  {isLoadingVisits ? '…' : visits.length} place{!isLoadingVisits && visits.length !== 1 ? 's' : ''} visited
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* TAB SELECTOR */}
        <div className="sticky top-0 z-40 bg-[#FFF9F0] px-6 py-3 border-b border-[#0F172A]/10">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'visits', 'earned', 'featured', 'stamps', 'quests'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                  activeTab === tab
                    ? 'translate-x-[2px] translate-y-[2px] shadow-none bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* STATION CABINET */}
        {activeTab === 'visits' && (
          <section className="px-6 mt-6 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-[#00A959]" />
              <h2 className="text-lg font-bold text-slate-900">Station Cabinet</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {!isLoadingStations && !isLoadingVisits ? `${stations.length} active station${stations.length !== 1 ? 's' : ''}` : ''}
            </p>

            {!hasUser && (
              <div className="rounded-3xl bg-white/80 p-5 border border-slate-200">
                <p className="text-sm text-slate-600">Connect a user session to see your visit history.</p>
              </div>
            )}

            {hasUser && (isLoadingStations || isLoadingVisits) && (
              <p className="text-sm text-slate-500">Loading stations…</p>
            )}

            {hasUser && !isLoadingStations && !isLoadingVisits && errorVisits && (
              <p className="text-sm text-red-600">{errorVisits}</p>
            )}

            {hasUser && !isLoadingStations && !isLoadingVisits && !errorVisits && stations.length === 0 && (
              <div className="rounded-3xl bg-white/80 p-6 text-center border border-slate-200">
                <p className="text-slate-600">No active stations available yet.</p>
              </div>
            )}

            {hasUser && !isLoadingStations && !isLoadingVisits && !errorVisits && stations.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {stationCabinet.map((item) => (
                  <StationStampCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* BADGE SECTIONS */}
        {activeTab !== 'visits' && (
          <>
        {/* 2. BADGE SECTIONS */}
        {isLoading && <p className="px-6 text-sm text-slate-500">Loading badges…</p>}
        {error && <p className="px-6 text-sm text-red-600">{error}</p>}

        {!isLoading && !error && badges.length > 0 && (
          <>
            {/* FEATURED SECTION */}
            {filteredBadgesForTab.featured.length > 0 && (
              <section className="px-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-slate-900">Featured Achievements</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Line mastery and major milestones</p>
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {filteredBadgesForTab.featured.map((badge) => (
                    <motion.div
                      key={badge.id}
                      className="aspect-square"
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <BadgeCard badge={badge} compact />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* STAMPS SECTION */}
            {filteredBadgesForTab.stamps.length > 0 && (
              <section className="px-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-bold text-slate-900">Station Stamps</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Collect one from every iconic station</p>
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {filteredBadgesForTab.stamps.map((badge) => (
                    <motion.div
                      key={badge.id}
                      className="aspect-square"
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <BadgeCard badge={badge} compact />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* QUESTS SECTION */}
            {filteredBadgesForTab.quests.length > 0 && (
              <section className="px-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-bold text-slate-900">Special Quests</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Challenge badges and special conditions</p>
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {filteredBadgesForTab.quests.map((badge) => (
                    <motion.div
                      key={badge.id}
                      className="aspect-square"
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <BadgeCard badge={badge} compact />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}
          </>
        )}

        {!isLoading && !error && badges.length > 0 && filteredBadgesForTab.featured.length === 0 && filteredBadgesForTab.stamps.length === 0 && filteredBadgesForTab.quests.length === 0 && (
          <div className="px-6 mt-8">
            <div className="rounded-3xl bg-white/80 p-6 text-center border border-slate-200">
              <p className="text-slate-600">
                {activeTab === 'earned' ? 'You haven\'t earned any badges yet. Keep exploring to collect your first achievement!' : 'No badges in this category.'}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && badges.length === 0 && (
          <div className="px-6">
            <div className="rounded-3xl bg-white/80 p-6 text-center border border-slate-200">
              <p className="text-slate-600">No badges are available yet. Add badges to your Supabase schema or check your connection.</p>
            </div>
          </div>
        )}

      {!hasUser && (
        <section className="px-6 mb-10 mt-6">
          <div className="rounded-3xl bg-white/80 p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Connect a user session to see earned badges and progress tracking.</p>
          </div>
        </section>
      )}
          </>
        )}
      </div>
    </div>
  );
}

function StationStampCard({ item }: { item: StationWithVisit }) {
  const isKajang = item.line.toLowerCase().includes('kajang');
  const lineLabel = isKajang ? 'KJ' : 'PY';
  const lineStyles = isKajang
    ? { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' }
    : { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };

  return (
    <div
      className={`aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
        item.visit
          ? 'bg-[#FDF8EE] border-double border-amber-700/30'
          : 'bg-[#FDF8EE]/50 border-dashed border-slate-300'
      }`}
    >
      {/* Decorative passport corners */}
      <div className={`absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl ${item.visit ? 'border-amber-700/30' : 'border-slate-300'}`} />
      <div className={`absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr ${item.visit ? 'border-amber-700/30' : 'border-slate-300'}`} />
      <div className={`absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl ${item.visit ? 'border-amber-700/30' : 'border-slate-300'}`} />
      <div className={`absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 rounded-br ${item.visit ? 'border-amber-700/30' : 'border-slate-300'}`} />

      <p className={`text-[10px] font-bold text-center leading-tight ${item.visit ? 'text-[#2D3250]' : 'text-slate-400'}`}>
        {item.name}
      </p>
      <span className={`mt-1 text-[7px] font-bold px-1.5 py-0.5 rounded-full border ${
        item.visit
          ? `${lineStyles.bg} ${lineStyles.text} ${lineStyles.border}`
          : 'bg-slate-50 text-slate-300 border-slate-200'
      }`}>
        {lineLabel}
      </span>

      {item.visit ? (
        <span
          className="absolute text-[10px] font-extrabold text-red-500/60 uppercase tracking-widest whitespace-nowrap bg-red-50/40 px-2 py-0.5 rounded-sm border border-red-300/40 pointer-events-none"
          style={{ transform: 'rotate(-15deg)' }}
        >
          {item.visit.visitedAt}
        </span>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-0.5">
          <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
            <span className="text-slate-300 text-[8px]">?</span>
          </div>
          <span className="text-[7px] text-slate-300 font-medium">Not yet visited</span>
        </div>
      )}
    </div>
  );
}
