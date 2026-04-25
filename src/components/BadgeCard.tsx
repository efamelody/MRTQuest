import { useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { BadgeModal } from '@/components/BadgeModal';

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  user_badges?: Array<{ earned_at: string; user_id?: string }>;
};

type BadgeCardProps = {
  badge: Badge;
  compact?: boolean;
};

export function BadgeCard({ badge, compact = false }: BadgeCardProps) {
  const [open, setOpen] = useState(false);
  const isEarned = Boolean(badge.user_badges?.length);

  return (
    <>
      <article
        tabIndex={0}
        onClick={() => setOpen(true)}
        className={`
          group relative cursor-pointer aspect-square rounded-[2rem] border transition-all duration-300 active:scale-95
          flex flex-col items-center justify-center text-center p-2
          ${isEarned 
            ? 'bg-white shadow-[0_8px_20px_-6px_rgba(0,169,89,0.2)] border-emerald-100' 
            : 'bg-white/40 border-dashed border-slate-200 grayscale opacity-60'
          }
        `}
      >
        {/* Lock Overlay for unearned badges */}
        {!isEarned && (
          <div className="absolute top-2 right-2 bg-slate-200 p-1 rounded-full">
            <Lock className="w-3 h-3 text-slate-400" />
          </div>
        )}

        {/* Icon Container */}
        <div
          className={`
            mb-1 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110
            ${compact ? 'h-14 w-14' : 'h-18 w-18'}
            ${isEarned ? 'bg-emerald-50' : 'bg-transparent'}
          `}
        >
          {badge.icon && badge.icon.startsWith('http') ? (
            <img
              src={badge.icon}
              alt={badge.name}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-3xl">
              {badge.icon ?? <Trophy className="w-8 h-8 text-slate-300" />}
            </span>
          )}
        </div>

        {/* Text Section */}
        <div className="px-1">
          <h3 className="font-bold leading-tight text-slate-800 text-[11px] line-clamp-2 font-sans">
            {badge.name}
          </h3>
          {isEarned && (
            <div className="mt-0.5 flex justify-center">
              <div className="h-1 w-4 rounded-full bg-emerald-400" />
            </div>
          )}
        </div>
      </article>

      {open && <BadgeModal badge={badge} onClose={() => setOpen(false)} />}
    </>
  );
}