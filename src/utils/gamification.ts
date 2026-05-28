export function calculateLevel(totalXp: number): number {
  if (totalXp <= 100) return 1;
  if (totalXp <= 300) return 2;
  return 3;
}

export type LevelInfo = {
  level: number;
  xpInLevel: number;
  xpRange: number;
  xpToNext: number;
  isMaxLevel: boolean;
};

export function getLevelInfo(totalXp: number): LevelInfo {
  if (totalXp <= 100) {
    return { level: 1, xpInLevel: totalXp, xpRange: 100, xpToNext: 100 - totalXp, isMaxLevel: false };
  }
  if (totalXp <= 300) {
    return { level: 2, xpInLevel: totalXp - 100, xpRange: 200, xpToNext: 300 - totalXp, isMaxLevel: false };
  }
  return { level: 3, xpInLevel: totalXp - 300, xpRange: Infinity, xpToNext: 0, isMaxLevel: true };
}
