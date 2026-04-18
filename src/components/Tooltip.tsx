'use client';

import { ReactNode } from 'react';

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative inline-flex">
      <div className="group inline-flex">{children}</div>
      <div className="pointer-events-none absolute left-1/2 bottom-full z-10 hidden w-56 -translate-x-1/2 rounded-3xl bg-slate-950/95 px-3 py-2 text-xs text-white shadow-lg opacity-0 transition duration-200 group-hover:block group-hover:opacity-100 group-focus:block group-focus:opacity-100">
        {content}
      </div>
    </div>
  );
}
