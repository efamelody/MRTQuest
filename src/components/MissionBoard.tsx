'use client';

import { motion } from 'framer-motion';
import { Target, CheckCircle2, Loader2, MapPin } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  max: number;
  xpReward: number;
  code?: string;
  line?: 'kajang' | 'putrajaya';
}

interface MissionBoardProps {
  missions: Mission[];
  isLoading?: boolean;
}

export function MissionBoard({ missions, isLoading }: MissionBoardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-[#8B7E74]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (missions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-[#0D9488]" />
        <h2 className="font-fredoka text-lg text-[#2D3250]">Active Missions</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {missions.map((mission, i) => {
          const pct = Math.min((mission.progress / mission.max) * 100, 100);
          const isComplete = mission.progress >= mission.max;
          const lineColor = mission.line === 'putrajaya' ? '#FFB300' : '#0D9488';

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="shrink-0 w-64 rounded-2xl border-2 bg-white p-4"
              style={{
                borderColor: isComplete ? '#10B981' : '#E8E0D6',
                borderLeftColor: isComplete ? '#10B981' : lineColor,
                borderLeftWidth: 4,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />}
                    <div className="flex items-center gap-1.5">
                      {mission.code && (
                        <span
                          className="font-fredoka text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{
                            color: lineColor,
                            background: `${lineColor}15`,
                            border: `1px solid ${lineColor}30`,
                          }}
                        >
                          {mission.code}
                        </span>
                      )}
                      <p className={`font-fredoka text-sm truncate ${isComplete ? 'text-[#10B981]' : 'text-[#2D3250]'}`}>
                        {mission.title}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#8B7E74] mt-1 line-clamp-2 leading-relaxed">{mission.description}</p>
                </div>
                <span
                  className="shrink-0 font-fredoka text-[10px] px-2 py-1 rounded-lg"
                  style={{
                    color: isComplete ? '#10B981' : '#0D9488',
                    background: isComplete ? 'rgba(16,185,129,0.1)' : 'rgba(13,148,136,0.1)',
                    border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(13,148,136,0.3)'}`,
                  }}
                >
                  +{mission.xpReward} XP
                </span>
              </div>

              <div className="mt-3">
                <div className="flex gap-1">
                  {Array.from({ length: mission.max }).map((_, j) => (
                    <div
                      key={j}
                      className="flex-1 h-2 rounded-sm transition-all duration-500"
                      style={{
                        background: j < mission.progress
                          ? `linear-gradient(180deg, ${isComplete ? '#10B981' : lineColor}, ${isComplete ? '#059669' : '#0F766E'})`
                          : '#E8E0D6',
                        boxShadow: j < mission.progress
                          ? `0 0 4px ${isComplete ? 'rgba(16,185,129,0.4)' : 'rgba(13,148,136,0.4)'}`
                          : 'none',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#8B7E74]">
                    {mission.progress}/{mission.max}
                  </span>
                  <span className="text-[10px] font-fredoka" style={{ color: lineColor }}>
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
