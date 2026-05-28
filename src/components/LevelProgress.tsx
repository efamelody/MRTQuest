'use client';

import { motion } from 'framer-motion';
import { useCountUp } from '@/utils/useCountUp';
import { Sparkles, TrendingUp, Crown, Star, Rocket } from 'lucide-react';

const LEVELS = [
  { level: 1, label: 'City Explorer', minXp: 0, icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-100', bar: 'bg-slate-400' },
  { level: 2, label: 'Merdeka Wanderer', minXp: 80, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
  { level: 3, label: 'Rail Master', minXp: 200, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
  { level: 4, label: 'Transit Legend', minXp: 400, icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' },
  { level: 5, label: 'MRT Mythic', minXp: 700, icon: Rocket, color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' },
];

function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
  }
  return current;
}

function getNextLevel(xp: number) {
  const idx = LEVELS.findIndex((l) => l.level === getLevel(xp).level);
  return LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
}

interface LevelProgressProps {
  xp: number;
}

export function LevelProgress({ xp }: LevelProgressProps) {
  const currentLevel = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const animatedXp = useCountUp(xp);

  const xpInLevel = xp - currentLevel.minXp;
  const xpRange = nextLevel.minXp - currentLevel.minXp;
  const progressPct = currentLevel.level === LEVELS.length ? 100 : Math.min((xpInLevel / xpRange) * 100, 100);
  const xpToNext = currentLevel.level === LEVELS.length ? 0 : nextLevel.minXp - xp;
  const LevelIcon = currentLevel.icon;

  return (
    <div className="rounded-2xl bg-white border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-6 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${currentLevel.bg}`}>
          <LevelIcon className={`h-8 w-8 ${currentLevel.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${currentLevel.bg} ${currentLevel.color}`}>
              Lv.{currentLevel.level}
            </span>
            <p className={`text-sm font-bold ${currentLevel.color}`}>{currentLevel.label}</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#2D3250]">{animatedXp} <span className="text-sm font-normal text-slate-500">XP</span></p>
        </div>
      </div>

      {currentLevel.level < LEVELS.length && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress to {nextLevel.label}</span>
            <span>{xpToNext} XP remaining</span>
          </div>
          <div className="h-4 rounded-[2px] bg-slate-200 overflow-hidden flex gap-[2px] p-[1px]">
            {Array.from({ length: 20 }).map((_, i) => {
              const segPct = (i + 1) * 5;
              const filled = segPct <= progressPct;
              return (
                <div
                  key={i}
                  className={`flex-1 ${filled ? currentLevel.bar : 'bg-slate-100'}`}
                  style={filled && i === Math.ceil(progressPct / 5) - 1 ? { boxShadow: '0 0 6px rgba(13,148,136,0.4)' } : {}}
                />
              );
            })}
          </div>
        </div>
      )}

      {currentLevel.level === LEVELS.length && (
        <p className="mt-3 text-xs text-rose-500 font-semibold">Max level reached — you are an MRT legend!</p>
      )}
    </div>
  );
}
