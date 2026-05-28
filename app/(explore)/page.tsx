'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MRTMap } from '@/components/MRTMap';
import { SuggestionForm } from '@/components/SuggestionForm';
import { MissionBoard } from '@/components/MissionBoard';
import { useCountUp } from '@/utils/useCountUp';
import { getLevelInfo } from '@/utils/gamification';
import { MapPin, Award, Flame, PlusCircle, Compass } from 'lucide-react';

const lineTabs = [
  { id: 'kajang', label: 'Kajang', emoji: '💚' },
  { id: 'putrajaya', label: 'Putrajaya', emoji: '💛' },
] as const;

type LineId = (typeof lineTabs)[number]['id'];

type Station = {
  id: string;
  name: string;
  active: boolean;
  line: string;
  sequenceOrder: number | null;
};

const lineMeta: Record<LineId, { label: string; colorClass: string; accentClass: string }> = {
  kajang: {
    label: 'Kajang Line',
    colorClass: 'from-emerald-400 to-emerald-600',
    accentClass: 'bg-emerald-500',
  },
  putrajaya: {
    label: 'Putrajaya Line',
    colorClass: 'from-amber-400 to-yellow-500',
    accentClass: 'bg-yellow-500',
  },
};

export default function ExplorePage() {
  const [activeLine, setActiveLine] = useState<LineId>('kajang');
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestionFormOpen, setIsSuggestionFormOpen] = useState(false);
  const [isActiveOnly, setIsActiveOnly] = useState(true);
  const [profileStats, setProfileStats] = useState({ totalXp: 0, currentStreak: 0, badgeCount: 0 });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/passport');
      if (!res.ok) return;
      const data = await res.json();
      setProfileStats({
        totalXp: data.totalXp ?? 0,
        currentStreak: data.currentStreak ?? 0,
        badgeCount: data.badgeCount ?? 0,
      });
    } catch {
      // Silently fail — page works without profile data
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/stations');
        if (!response.ok) throw new Error('Failed to fetch stations');
        const data = await response.json();

        const lineLabel = lineMeta[activeLine].label;
        const filtered = (data.stations ?? [])
          .filter((s: Station) => s.line === lineLabel)
          .sort((a: Station, b: Station) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

        setStations(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStations([]);
      }

      setIsLoading(false);
    };

    fetchStations();
  }, [activeLine]);

  const activeLineMeta = lineMeta[activeLine];
  const filteredStations = isActiveOnly
    ? stations.filter((s) => s.active)
    : stations;

  const missions = useMemo(() => {
    const activeCount = stations.filter((s) => s.active).length;
    const totalCount = stations.length;

    return [
      {
        id: 'explore-stations',
        title: 'Station Explorer',
        description: `Check in at stations on the ${activeLineMeta.label}`,
        progress: activeCount,
        max: Math.max(totalCount, 1),
        xpReward: 50,
        code: activeLine === 'kajang' ? 'KG' : 'PY',
        line: activeLine,
      },
      {
        id: 'photo-hunter',
        title: 'Photo Hunter',
        description: 'Verify a landmark with photo check-in',
        progress: 0,
        max: 1,
        xpReward: 30,
        line: activeLine,
      },
      {
        id: 'quiz-champion',
        title: 'Quiz Champion',
        description: 'Complete a quiz challenge with perfect score',
        progress: 0,
        max: 1,
        xpReward: 40,
        line: activeLine,
      },
    ];
  }, [stations, activeLineMeta.label, activeLine]);

  const activeCount = stations.filter((s) => s.active).length;
  const animatedActiveCount = useCountUp(activeCount);
  const animatedTotalCount = useCountUp(stations.length);

  const levelInfo = useMemo(() => getLevelInfo(profileStats.totalXp), [profileStats.totalXp]);
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto pb-20">
      <div className="flex-1 overflow-y-auto">
        {/* ── Hero Section ── */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-[#0D9488]" />
                <h1 className="font-gamified text-2xl text-[#2D3250] leading-none">
                  Explore Kuala Lumpur
                </h1>
              </div>
              <p className="text-sm text-[#8B7E74] mt-1">
                Discover hidden attractions along the MRT lines
              </p>
            </div>
            <div className="bg-white rounded-xl border-[1.5px] border-[#0F172A] px-3 py-2 text-center min-w-[72px] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="font-fredoka text-lg leading-none text-[#0D9488]">Lv.{levelInfo.level}</div>
              <div className="text-[9px] text-[#8B7E74] uppercase tracking-wider mt-0.5">Level</div>
            </div>
          </div>

          {/* ── Player Progress Card ── */}
          <div className="bg-white rounded-2xl border-[1.5px] border-[#0F172A] p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-fredoka text-xs text-[#8B7E74]">EXP Progress</span>
              <span className="font-fredoka text-xs text-[#0D9488]">{profileStats.totalXp} XP</span>
            </div>
            <div className="arcade-exp-bar mb-2">
              <div
                className="arcade-exp-bar-fill"
                style={{ width: `${levelInfo.isMaxLevel ? 100 : (levelInfo.xpInLevel / levelInfo.xpRange) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-fredoka text-[10px] text-[#8B7E74]">Lv.{levelInfo.level}</span>
              <span className="font-fredoka text-[10px] text-[#8B7E74]">
                {levelInfo.isMaxLevel
                  ? <span className="text-[#0D9488]">Max Level</span>
                  : <>Lv.{levelInfo.level + 1} ▸ {levelInfo.xpToNext} XP to go</>
                }
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-[#0D9488]" />
              <div className="stat-card-value text-[#0D9488]">{animatedTotalCount}</div>
              <div className="stat-card-label">Stations</div>
            </div>
            <div className="stat-card">
              <Award className="w-5 h-5 mx-auto mb-1 text-[#FFB300]" />
              <div className="stat-card-value text-[#FFB300]">{profileStats.badgeCount}</div>
              <div className="stat-card-label">Badges</div>
            </div>
            <div className="stat-card">
              <Flame className="w-5 h-5 mx-auto mb-1 text-[#FF6B6B]" />
              <div className="stat-card-value text-[#FF6B6B]">{profileStats.currentStreak}</div>
              <div className="stat-card-label">Streak</div>
            </div>
          </div>
        </div>

        {/* ── Line Selector ── */}
        <div className="px-5 pb-4">
          <div className="section-divider mb-3">
            <span>Select Line</span>
          </div>
          <div className="flex gap-2">
            {lineTabs.map((tab) => {
              const isActive = activeLine === tab.id;
              const lineColor = tab.id === 'kajang' ? '#0D9488' : '#FFB300';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLine(tab.id)}
                  className="flex-1 font-fredoka text-sm py-2.5 rounded-xl transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                  style={{
                    background: isActive ? lineColor : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#8B7E74',
                    border: '1.5px solid #0F172A',
                    boxShadow: '3px 3px 0px 0px rgba(15,23,42,1)',
                  }}
                >
                  {tab.emoji} {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MRT Map ── */}
        <div className="px-5 pb-4">
          <MRTMap
            selectedLine={activeLine}
            stations={filteredStations}
            lineLabel={activeLineMeta.label}
            colorClass={activeLineMeta.colorClass}
            accentClass={activeLineMeta.accentClass}
            isActiveOnly={isActiveOnly}
            onToggle={setIsActiveOnly}
          />
          {isLoading && (
            <p className="mt-3 text-sm text-[#8B7E74] text-center font-fredoka">Loading stations...</p>
          )}
          {error && (
            <p className="mt-3 text-sm text-[#DC2626] text-center">{error}</p>
          )}
        </div>

        {/* ── Active Missions ── */}
        <div className="px-5 pb-4">
          <div className="section-divider mb-3">
            <span>Active Missions</span>
          </div>
          <MissionBoard missions={missions} isLoading={isLoading} />
        </div>

        {/* ── Suggestion Button ── */}
        <div className="px-5 pb-6">
          <button
            onClick={() => setIsSuggestionFormOpen(true)}
            className="w-full rounded-2xl border-[1.5px] border-dashed border-[#0F172A] bg-white/60 p-4 flex items-center justify-center gap-2 text-[#8B7E74] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:border-[#0D9488] hover:text-[#0D9488] transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-fredoka text-sm">Suggest a hidden gem</span>
          </button>
        </div>
      </div>

      {/* Suggestion Form Modal */}
      <SuggestionForm
        isOpen={isSuggestionFormOpen}
        onClose={() => setIsSuggestionFormOpen(false)}
        onSuccess={() => {
          setActiveLine(activeLine);
        }}
      />
    </div>
  );
}
