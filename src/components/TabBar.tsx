'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrainFront, Album, Stamp } from 'lucide-react';

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/', label: 'Explore', icon: TrainFront },
    { href: '/badge', label: 'Badge', icon: Stamp },
    { href: '/passport', label: 'Passport', icon: Album },
  ];

  const activeIndex = tabs.findIndex((t) => pathname === t.href);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-white/70 backdrop-blur-sm border-t-2 border-white shadow-2xl safe-area-pb">
      <div className="relative flex items-center justify-around h-20">
        {/* Animated floating pill */}
        {activeIndex >= 0 && (
          <motion.div
            layoutId="tab-indicator"
            className="absolute bottom-12 h-1 w-12 bg-primary rounded-full"
            initial={false}
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ left: `calc(${activeIndex * (100 / tabs.length)}% + ${50 / tabs.length}% - 1.5rem)` }}
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
              className={`flex flex-col items-center justify-center h-20 transition-all ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="flex flex-col items-center"
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium font-gamified">{tab.label}</span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
