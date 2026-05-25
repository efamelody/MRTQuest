'use client';

import { useEffect, useRef } from 'react';

interface ConfettiEffectProps {
  active: boolean;
  onComplete?: () => void;
  variant?: 'badge' | 'quiz' | 'checkin';
}

export function ConfettiEffect({ active, onComplete, variant = 'badge' }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    import('canvas-confetti').then((mod) => {
      const confetti = mod.default;

      const defaults = {
        spread: 80,
        ticks: 100,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#00A959', '#FFD520', '#FF6B6B', '#4ECDC4', '#A78BFA'],
      };

      switch (variant) {
        case 'badge':
          confetti({ ...defaults, particleCount: 60, spread: 90, origin: { y: 0.6 } });
          break;
        case 'quiz':
          confetti({ ...defaults, particleCount: 80, spread: 100, origin: { y: 0.5 } });
          break;
        case 'checkin':
          confetti({ ...defaults, particleCount: 40, spread: 70, origin: { y: 0.7 } });
          break;
      }

      setTimeout(onComplete, 1500);
    });
  }, [active, variant, onComplete]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
}
