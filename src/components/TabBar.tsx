'use client';

import { usePathname, useRouter } from 'next/navigation';
import { TrainFront, Album, Stamp } from 'lucide-react';

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/explore', label: 'Explore', icon: TrainFront },
    { href: '/badge', label: 'Badge', icon: Stamp },
    { href: '/passport', label: 'Passport', icon: Album },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-white/70 backdrop-blur-sm border-t-2 border-white shadow-2xl safe-area-pb"
    >
      <div className="flex items-center justify-around h-20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center justify-center h-20 transition-all ${
                isActive
                  ? 'text-primary scale-110'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium font-gamified">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
