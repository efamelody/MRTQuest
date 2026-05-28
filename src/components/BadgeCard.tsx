import { useState } from 'react';
import { motion } from 'framer-motion';
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
  compact?: boolean;
};

const STAMP_ROTATIONS = ['rotate-1', 'rotate-2', '-rotate-1', '-rotate-2'];

export function BadgeCard({ badge, compact = false }: BadgeCardProps) {
  const [open, setOpen] = useState(false);
  const isEarned = Boolean(badge.user_badges?.length);
  const stampRotation = isEarned ? STAMP_ROTATIONS[badge.id.charCodeAt(0) % STAMP_ROTATIONS.length] : '';

  const renderIcon = (variant: 'ink' | 'watermark') => {
    const isInk = variant === 'ink';
    const imgClass = isInk
      ? 'h-full w-full object-contain p-1 brightness-0 invert-1'
      : 'h-full w-full object-contain p-1';
    const iconClass = isInk ? 'text-3xl text-white' : 'text-3xl';

    if (badge.icon && badge.icon.startsWith('http')) {
      return <img src={badge.icon} alt={badge.name} className={imgClass} />;
    }
    return (
      <span className={iconClass}>
        {badge.icon ?? <Trophy className={`w-8 h-8 ${isInk ? 'text-white' : 'text-slate-300'}`} />}
      </span>
    );
  };

  return (
    <>
      <motion.div
        tabIndex={0}
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05, rotate: [-1, 1] }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className={`
          group relative cursor-pointer aspect-square rounded-[2rem] border transition-all duration-300
          flex flex-col items-center justify-center text-center p-2
          ${isEarned 
            ? 'bg-white border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]' 
            : 'bg-slate-50 border-2 border-dashed border-slate-200 opacity-70 grayscale'
          }
          ${stampRotation}
        `}
      >
        {/* Icon Container */}
        <div className={`mb-1 flex items-center justify-center ${compact ? 'h-14 w-14' : 'h-18 w-18'}`}>
          {isEarned ? (
            /* Ink stamp — bold solid accent square */
            <div className="rounded-2xl flex items-center justify-center w-full h-full bg-[#0D9488]">
              {renderIcon('ink')}
            </div>
          ) : (
            /* Passport placeholder — dotted circle with watermark */
            <div className="border-2 border-dotted border-slate-300 rounded-full flex items-center justify-center w-full h-full p-1">
              <div className="opacity-20 grayscale w-full h-full flex items-center justify-center">
                {renderIcon('watermark')}
              </div>
            </div>
          )}
        </div>

        {/* Text Section */}
        <div className="px-1">
          <h3 className={`font-bold leading-tight text-[11px] line-clamp-2 font-sans ${isEarned ? 'text-slate-800' : 'text-slate-400'}`}>
            {badge.name}
          </h3>
          {isEarned && (
            <div className="mt-0.5 flex justify-center">
              <div className="h-1 w-4 rounded-none bg-[#0D9488]" />
            </div>
          )}
        </div>
      </motion.div>

      {open && <BadgeModal badge={badge} onClose={() => setOpen(false)} />}
    </>
  );
}