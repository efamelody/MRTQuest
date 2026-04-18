import { useState } from 'react';
import { Trophy } from 'lucide-react';
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
};

export function BadgeCard({ badge }: BadgeCardProps) {
  const [open, setOpen] = useState(false);
  const isEarned = Boolean(badge.user_badges?.length);

  return (
    <>
      <article
        tabIndex={0}
        onClick={() => setOpen(true)}
        className={`group cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${isEarned ? 'border-emerald-200 hover:-translate-y-1 hover:shadow-lg' : 'border-slate-200 opacity-80 grayscale hover:opacity-100'} `}
      >
        <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-5xl ${isEarned ? 'bg-emerald-100' : 'bg-slate-200'}`}>
          {badge.icon && badge.icon.startsWith('http') ? (
            <img src={badge.icon} alt={badge.name} className="h-20 w-20 rounded-2xl object-contain" />
          ) : (
            <span>{badge.icon ?? <Trophy className="w-12 h-12" />}</span>
          )}
        </div>

        <h3 className="mt-5 text-center text-base font-semibold tracking-tight text-slate-900">{badge.name}</h3>

        <p className={`mt-3 text-center text-[11px] uppercase tracking-[0.25em] ${isEarned ? 'text-emerald-600' : 'text-slate-400'}`}>
          {isEarned ? 'Earned' : 'Locked'}
        </p>
      </article>

      {open && <BadgeModal badge={badge} onClose={() => setOpen(false)} />}
    </>
  );
}
