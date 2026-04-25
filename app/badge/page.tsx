'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { BadgeCard } from '@/components/BadgeCard';

const supabase = createClient();

type BadgeRecord = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria_type?: string | null;
  criteria_value?: number | null;
  criter_target?: string | null;
  station_id?: string | null;
  stations?: Array<{ active: boolean }> | null;
  user_badges?: Array<{ earned_at: string; user_id?: string }>;
};

const badgeCategories = [
  { id: 'all', label: 'All' },
  { id: 'station-visit', label: 'Station Stamps' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'line-master', label: 'Line Master' },
  { id: 'quiz-master', label: 'Quiz Master' },
  { id: 'category-expert', label: 'Category Expert' },
] as const;

type BadgeCategory = (typeof badgeCategories)[number]['id'];

export default function BadgePage() {
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = '';
  const hasUser = Boolean(currentUserId);

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('badges')
        .select('id,name,description,icon,criteria_type,criteria_value,criter_target,station_id,stations(active),user_badges(earned_at,user_id)');

      if (hasUser) {
        query = query.eq('user_badges.user_id', currentUserId);
      }

      const { data, error: fetchError } = await query.order('name', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setBadges([]);
      } else {
        const activeBadges = (data ?? []).filter((badge) => badge.stations?.[0]?.active);
        setBadges(activeBadges);
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

  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') {
      return badges;
    }

    return badges.filter((badge) => {
      const description = badge.description?.toLowerCase() ?? '';
      const type = badge.criteria_type?.toLowerCase() ?? '';

      if (activeCategory === 'station-visit') {
        return type === 'station_visit' || description.includes('station');
      }
      if (activeCategory === 'milestones') {
        return type === 'visit_count' || description.includes('visit') || description.includes('sites');
      }
      if (activeCategory === 'line-master') {
        return type === 'line_master' || description.includes('line');
      }
      if (activeCategory === 'quiz-master') {
        return type === 'quiz_master' || description.includes('quiz') || description.includes('correct');
      }
      if (activeCategory === 'category-expert') {
        return type === 'category_expert' || description.includes('category');
      }

      return true;
    });
  }, [activeCategory, badges]);

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

        <section className="px-6 mb-6">
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

        <section className="px-6 mb-6">
          <div className="inline-flex rounded-3xl bg-white/80 p-1 shadow-sm border border-white">
            {badgeCategories.map((category) => {
              const isActive = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-3 text-sm font-semibold transition-all rounded-3xl ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Your Trophies</h2>
              <p className="text-sm text-slate-500">Tap a badge to learn how to unlock it.</p>
            </div>
          </div>

          {isLoading && <p className="text-sm text-slate-500">Loading badges…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}

          {!isLoading && !error && !badges.length && (
            <div className="rounded-3xl bg-white/80 p-6 text-center border border-slate-200">
              <p className="text-slate-600">No badges are available yet. Add badges to your Supabase schema or check your connection.</p>
            </div>
          )}
        </section>

        {!hasUser && (
          <section className="px-6 mb-10">
            <div className="rounded-3xl bg-white/80 p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">Connect a user session to see earned badges and progress tracking.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
