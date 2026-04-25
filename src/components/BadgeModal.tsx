'use client';

import { X } from 'lucide-react';

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  user_badges?: Array<{ earned_at: string; user_id?: string }>;
};

type BadgeModalProps = {
  badge: Badge;
  onClose: () => void;
};

export function BadgeModal({ badge, onClose }: BadgeModalProps) {
  const isEarned = Boolean(badge.user_badges?.length);
  const earnedAt = isEarned
    ? new Date(badge.user_badges![0].earned_at).toLocaleDateString()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{badge.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEarned ? 'This badge is already unlocked.' : 'This badge is locked. Read the hint to unlock it.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close badge details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 rounded-3xl bg-slate-50 p-4 mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
            {badge.icon && badge.icon.startsWith('http') ? (
              <img src={badge.icon} alt={badge.name} className="h-16 w-16 rounded-2xl object-contain" />
            ) : (
              <span className="text-4xl">{badge.icon ?? '🏅'}</span>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600">{badge.description ?? 'Unlock this badge by exploring more attractions.'}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-700">
          <p className="font-semibold">Details</p>
          <p className="mt-2">{badge.description ?? 'No further details available.'}</p>
          {isEarned && <p className="mt-3 text-sm text-slate-500">Earned on {earnedAt}</p>}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-[#00A959] px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
