'use client';

import Modal from './Modal';
import Button from './Button';

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
  isOpen?: boolean;
};

export function BadgeModal({ badge, onClose, isOpen = true }: BadgeModalProps) {
  const isEarned = Boolean(badge.user_badges?.length);
  const earnedAt = isEarned
    ? new Date(badge.user_badges![0].earned_at).toLocaleDateString()
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={badge.name}
      footer={
        <Button
          variant="primary"
          fullWidth
          onClick={onClose}
        >
          Close
        </Button>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        {isEarned ? 'This badge is already unlocked.' : 'This badge is locked. Read the hint to unlock it.'}
      </p>

      <div className="flex gap-4 rounded-3xl bg-slate-50 p-4 mb-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl bg-white shadow-sm">
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
    </Modal>
  );
}
