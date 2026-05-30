'use client';

import { useCountUp } from '@/utils/useCountUp';
import { getLevelInfo, getLevelTitle } from '@/utils/gamification';
import { Sparkles, TrendingUp, Rocket, Award, Crown, Zap, Compass, Map, Star, Trophy } from 'lucide-react';

function pickIcon(level: number) {
  if (level >= 40) return Trophy;
  if (level >= 30) return Star;
  if (level >= 25) return Map;
  if (level >= 20) return Compass;
  if (level >= 15) return Zap;
  if (level >= 10) return Award;
  if (level >= 5) return TrendingUp;
  return Sparkles;
}

const LOW = { color: 'text-slate-600', bg: 'bg-slate-100', bar: 'bg-slate-400' };
const MID = { color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
const HIGH = { color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
const ELITE = { color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' };
const LEGENDARY = { color: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-500' };

function pickStyle(level: number) {
  if (level >= 35) return LEGENDARY;
  if (level >= 20) return ELITE;
  if (level >= 10) return HIGH;
  if (level >= 5) return MID;
  return LOW;
}

interface LevelProgressProps {
  xp: number;
}

export function LevelProgress({ xp }: LevelProgressProps) {
  const info = getLevelInfo(xp);
  const level = info.level;
  const animatedXp = useCountUp(xp);
  const LevelIcon = pickIcon(level);
  const style = pickStyle(level);
  const title = getLevelTitle(level);

  const progressPct = info.isMaxLevel ? 100 : Math.min((info.xpInLevel / info.xpRange) * 100, 100);

  return (
    <div className="rounded-2xl bg-white border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-6 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${style.bg}`}>
          <LevelIcon className={`h-8 w-8 ${style.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
              Lv.{level}
            </span>
            <p className={`text-sm font-bold ${style.color}`}>{title}</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#2D3250]">{animatedXp} <span className="text-sm font-normal text-slate-500">XP</span></p>
        </div>
      </div>

      {!info.isMaxLevel && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress to next title</span>
            <span>{info.xpToNext} XP remaining</span>
          </div>
          <div className="h-4 rounded-[2px] bg-slate-200 overflow-hidden flex gap-[2px] p-[1px]">
            {Array.from({ length: 20 }).map((_, i) => {
              const segPct = (i + 1) * 5;
              const filled = segPct <= progressPct;
              return (
                <div
                  key={i}
                  className={`flex-1 ${filled ? style.bar : 'bg-slate-100'}`}
                  style={filled && i === Math.ceil(progressPct / 5) - 1 ? { boxShadow: '0 0 6px rgba(13,148,136,0.4)' } : {}}
                />
              );
            })}
          </div>
        </div>
      )}

      {info.isMaxLevel && (
        <p className="mt-3 text-xs text-rose-500 font-semibold">Max level reached — you are an MRT legend!</p>
      )}
    </div>
  );
}
