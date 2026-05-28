'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Map, Stamp, Album } from 'lucide-react';

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/', label: 'Explore', icon: Map },
    { href: '/badge', label: 'Badges', icon: Stamp },
    { href: '/passport', label: 'Passport', icon: Album },
  ];

  const activeIndex = tabs.findIndex((t) => pathname === t.href);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-white border-t-2 border-[#0D9488] shadow-[0_-4px_20px_rgba(13,148,136,0.12)] safe-area-pb">
      <div className="relative flex items-center justify-around h-16">
        {activeIndex >= 0 && (
          <motion.div
            layoutId="tab-indicator"
            className="absolute top-0 h-1 w-12 bg-[#0D9488] rounded-b-full"
            initial={false}
            animate={{
              x: `calc(${activeIndex * (100 / tabs.length)}% + ${50 / tabs.length}% - 1.5rem)`,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              suppressHydrationWarning
              className={`flex flex-col items-center justify-center h-16 transition-all flex-1 ${
                isActive ? 'text-[#0D9488]' : 'text-[#B8ADA3] hover:text-[#8B7E74]'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} />
                <span className="font-fredoka text-xs leading-none">{tab.label}</span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
