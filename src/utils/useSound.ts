'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'checkin' | 'badge' | 'quiz-correct' | 'quiz-wrong' | 'tap';

const SOUND_CONFIG: Record<SoundType, { freq: number; duration: number; type: OscillatorType }> = {
  'checkin': { freq: 523, duration: 0.15, type: 'sine' },
  'badge': { freq: 880, duration: 0.3, type: 'sine' },
  'quiz-correct': { freq: 660, duration: 0.2, type: 'sine' },
  'quiz-wrong': { freq: 220, duration: 0.25, type: 'sawtooth' },
  'tap': { freq: 440, duration: 0.05, type: 'sine' },
};

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback(
    (type: SoundType) => {
      if (!enabledRef.current) return;
      try {
        const ctx = getCtx();
        const cfg = SOUND_CONFIG[type];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = cfg.type;
        osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + cfg.duration);
      } catch {
        // Audio not supported or blocked
      }
    },
    [getCtx],
  );

  const setEnabled = useCallback((val: boolean) => {
    enabledRef.current = val;
  }, []);

  return { play, setEnabled };
}
