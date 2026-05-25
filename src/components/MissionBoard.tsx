'use client';

import { motion } from 'framer-motion';
import { Target, CheckCircle2, Loader2 } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  max: number;
  xpReward: number;
}

interface MissionBoardProps {
  missions: Mission[];
  isLoading?: boolean;
}

export function MissionBoard({ missions, isLoading }: MissionBoardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (missions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-heading">Active Missions</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {missions.map((mission, i) => {
          const pct = Math.min((mission.progress / mission.max) * 100, 100);
          const isComplete = mission.progress >= mission.max;

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`shrink-0 w-64 rounded-2xl border p-4 ${
                isComplete
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    <p className={`font-bold text-sm truncate ${isComplete ? 'text-emerald-800' : 'text-heading'}`}>
                      {mission.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mission.description}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                  isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                }`}>
                  +{mission.xpReward} XP
                </span>
              </div>

              <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {mission.progress}/{mission.max}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
