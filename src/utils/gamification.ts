const MAX_LEVEL = 50;

// XP thresholds grow quadratically: cumulative XP for level N = 50 * N * (N - 1)
// This gives gaps of 100, 200, 300, 400, ... per level
// At level 50, cumulative XP = 50 * 50 * 49 = 122,500
export function calculateLevel(totalXp: number): number {
  const n = (1 + Math.sqrt(1 + (4 * totalXp) / 50)) / 2;
  return Math.min(Math.max(Math.floor(n), 1), MAX_LEVEL);
}

export type LevelInfo = {
  level: number;
  xpInLevel: number;
  xpRange: number;
  xpToNext: number;
  isMaxLevel: boolean;
};

export function getLevelInfo(totalXp: number): LevelInfo {
  const level = calculateLevel(totalXp);

  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, xpInLevel: 0, xpRange: 0, xpToNext: 0, isMaxLevel: true };
  }

  const cumulativeCurrent = 50 * level * (level - 1);
  const cumulativeNext = 50 * (level + 1) * level;
  const xpRange = cumulativeNext - cumulativeCurrent;
  const xpInLevel = totalXp - cumulativeCurrent;

  return {
    level,
    xpInLevel,
    xpRange,
    xpToNext: cumulativeNext - totalXp,
    isMaxLevel: false,
  };
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'City Explorer',
  5: 'Merdeka Wanderer',
  10: 'Klang Valley Master',
  15: 'MRT Enthusiast',
  20: 'Railway Connoisseur',
  25: 'Transit Sage',
  30: 'KL Navigator',
  35: 'Urban Cartographer',
  40: 'Rail Legend',
  50: 'Grandmaster Navigator',
};

export function getLevelTitle(level: number): string {
  const entries = Object.entries(LEVEL_TITLES)
    .map(([lvl, title]) => ({ level: Number(lvl), title }))
    .filter((entry) => entry.level <= level)
    .sort((a, b) => b.level - a.level);

  return entries.length > 0 ? entries[0].title : 'City Explorer';
}

const LEVEL_ICONS: Record<number, string> = {
  1: 'sparkles',
  5: 'trending-up',
  10: 'rocket',
  15: 'award',
  20: 'crown',
  25: 'zap',
  30: 'compass',
  35: 'map',
  40: 'star',
  50: 'trophy',
};

export function getLevelIcon(level: number): string {
  const entries = Object.entries(LEVEL_ICONS)
    .map(([lvl, icon]) => ({ level: Number(lvl), icon }))
    .filter((entry) => entry.level <= level)
    .sort((a, b) => b.level - a.level);

  return entries.length > 0 ? entries[0].icon : 'sparkles';
}
