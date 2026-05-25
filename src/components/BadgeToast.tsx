'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { EarnedBadge } from '@/utils/badges';
import { ConfettiEffect } from '@/components/ConfettiEffect';

type BadgeToastProps = {
  badges: EarnedBadge[];
  onDismiss: () => void;
};

export function BadgeToast({ badges, onDismiss }: BadgeToastProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (badges.length > 0) {
      setShowConfetti(true);
    }
  }, [badges]);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (badges.length === 0) return null;

  return (
    <>
      <ConfettiEffect
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
        variant="badge"
      />
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-sm">
        <div className="bg-emerald-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">
                🏅 Badge{badges.length > 1 ? 's' : ''} Earned!
              </p>
              <div className="space-y-2">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">{badge.icon ?? '🏆'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight">{badge.name}</p>
                      {badge.description && (
                        <p className="text-xs text-emerald-300 line-clamp-1 mt-0.5">
                          {badge.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="text-emerald-400 hover:text-white shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
