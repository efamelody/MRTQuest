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
    <div className="rounded-3xl bg-white/75 backdrop-blur-sm border border-white/70 p-6 shadow-sm">
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
          <p className="mt-1 text-2xl font-bold text-heading">{animatedXp} <span className="text-sm font-normal text-slate-500">XP</span></p>
        </div>
      </div>

      {currentLevel.level < LEVELS.length && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress to {nextLevel.label}</span>
            <span>{xpToNext} XP remaining</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${currentLevel.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>
      )}

      {currentLevel.level === LEVELS.length && (
        <p className="mt-3 text-xs text-rose-500 font-semibold">Max level reached — you are an MRT legend!</p>
      )}
    </div>
  );
}
