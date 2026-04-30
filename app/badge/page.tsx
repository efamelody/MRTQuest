'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Sparkles, Crown, Ticket, Zap } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { BadgeCard } from '@/components/BadgeCard';
import { useSession } from '@/utils/auth-client';

const supabase = createClient();

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
  user_badges?: Array<{ earned_at: string; user_id?: string }>;
};

type CategorizedBadges = {
  featured: BadgeRecord[];
  stamps: BadgeRecord[];
  quests: BadgeRecord[];
};

type TabType = 'all' | 'earned' | 'featured' | 'stamps' | 'quests';

export default function BadgePage() {
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { data: session } = useSession();

  const currentUserId = session?.user?.id ?? '';
  const hasUser = Boolean(currentUserId);

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('badges')
        .select('id,name,description,icon,criteria_type,criteria_value,criteria_target,station_id,stations(active),user_badges(earned_at,user_id)');

      if (hasUser) {
        query = query.eq('user_badges.user_id', currentUserId);
      }

      const { data, error: fetchError } = await query.order('name', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setBadges([]);
      } else {
        setBadges(data ?? []);
      }

      setIsLoading(false);
    };

    fetchBadges();
  }, [hasUser, currentUserId]);

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
      featured: badges.filter((b) => ['line_master', 'milestone'].includes(b.criteria_type ?? '')),
      stamps: badges.filter((b) => b.criteria_type === 'station_stamp'),
      quests: badges.filter((b) => ['time_check', 'multi_line', 'photo_review', 'quiz_master'].includes(b.criteria_type ?? '')),
    };
  }, [badges]);

  const filteredBadgesForTab = useMemo(() => {
    switch (activeTab) {
      case 'earned': {
        const earned = badges.filter((b) => b.user_badges?.length);
        return {
          featured: earned.filter((b) => ['line_master', 'milestone'].includes(b.criteria_type ?? '')),
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
    <div className="min-h-screen flex flex-col bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Badge Cabinet</p>
              <h1 className="text-3xl text-heading font-bold tracking-tight">Achievements Hub</h1>
            </div>
          </div>
          <p className="mt-3 text-slate-600">See what you&apos;ve earned and what&apos;s still waiting in your collector cabinet.</p>
        </div>

        <section className="px-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-sm border-2 border-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Collected</p>
                <p className="text-3xl font-bold text-slate-900">{badgeStats.earned} / {badgeStats.total}</p>
              </div>
              <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center">
                <Award className="w-10 h-10 text-emerald-500" />
              </div>
            </div>

            <div className="mt-5 h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600"
                style={{ width: badgeStats.total ? `${Math.round((badgeStats.earned / badgeStats.total) * 100)}%` : '0%' }}
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Progress toward your next milestone</p>
          </div>
        </section>

        {/* TAB SELECTOR */}
        <div className="sticky top-0 z-40 bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 px-6 py-3 border-b border-slate-200/50">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'earned', 'featured', 'stamps', 'quests'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

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
                <div className="grid grid-cols-3 gap-3">
                  {filteredBadgesForTab.featured.map((badge) => (
                    <div key={badge.id} className="aspect-square">
                      <BadgeCard badge={badge} compact />
                    </div>
                  ))}
                </div>
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
                <div className="grid grid-cols-3 gap-3">
                  {filteredBadgesForTab.stamps.map((badge) => (
                    <div key={badge.id} className="aspect-square">
                      <BadgeCard badge={badge} compact />
                    </div>
                  ))}
                </div>
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
                <div className="grid grid-cols-3 gap-3">
                  {filteredBadgesForTab.quests.map((badge) => (
                    <div key={badge.id} className="aspect-square">
                      <BadgeCard badge={badge} compact />
                    </div>
                  ))}
                </div>
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
      </div>
    </div>
  );
}
