export interface Notebook { id: string; name: string; description?: string; color: string; createdAt: number; updatedAt: number; }
export type CardType = 'question' | 'cloze';

export interface Folder {
  id: string;
  notebookId: string;
  name: string;
  parentFolderId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Card {
  id: string; notebookId: string; folderId?: string; type: CardType; front: string; back: string;
  interval: number; nextReview: number; reviewCount: number; easeFactor: number;
  tags: string[];
  createdAt: number; updatedAt: number;
}

export type Rating = 'forgot' | 'hard' | 'good';
export interface CardLink { id: string; sourceId: string; targetId: string; targetName: string; }
export interface ReviewLog { id: string; cardId: string; rating: Rating; reviewedAt: number; previousInterval: number; newInterval: number; }
export interface Settings { dailyGoal: number; theme: 'light' | 'dark'; lastStudyDate: string; streakDays: number; totalStudyDays: number; exp: number; level: number; todayNewCount: number; }

export const MASTERED_INTERVAL_MS = 15 * 24 * 60 * 60 * 1000;

export const EXP_PER_REVIEW = 10;
export const EXP_RATING_BONUS: Record<Rating, number> = { forgot: 2, hard: 5, good: 10 };

export interface RankTier { level: number; title: string; expRequired: number; }
export const RANK_TIERS: RankTier[] = [
  { level: 1,  title: '蒙童', expRequired: 0 },
  { level: 2,  title: '识文', expRequired: 30 },
  { level: 3,  title: '童生', expRequired: 80 },
  { level: 4,  title: '廪生', expRequired: 150 },
  { level: 5,  title: '生员', expRequired: 250 },
  { level: 6,  title: '增生', expRequired: 380 },
  { level: 7,  title: '禀生', expRequired: 540 },
  { level: 8,  title: '举人', expRequired: 750 },
  { level: 9,  title: '贡士', expRequired: 1000 },
  { level: 10, title: '进士', expRequired: 1300 },
  { level: 11, title: '庶吉士', expRequired: 1700 },
  { level: 12, title: '翰林', expRequired: 2200 },
  { level: 13, title: '侍读', expRequired: 2800 },
  { level: 14, title: '学士', expRequired: 3500 },
  { level: 15, title: '大儒', expRequired: 4500 },
];

export const getRankByLevel = (level: number): RankTier =>
  RANK_TIERS.find(r => r.level === level) || RANK_TIERS[RANK_TIERS.length - 1];

export const getRankByExp = (exp: number): RankTier => {
  let rank = RANK_TIERS[0];
  for (const r of RANK_TIERS) { if (exp >= r.expRequired) rank = r; else break; }
  return rank;
};

export const getNextRank = (level: number): RankTier | null =>
  RANK_TIERS.find(r => r.level === level + 1) || null;

export const getExpProgress = (exp: number, level: number): { currentExp: number; requiredExp: number; progressPercent: number } => {
  const next = getNextRank(level);
  if (!next) return { currentExp: 0, requiredExp: 0, progressPercent: 100 };
  const current = exp - (getRankByLevel(level).expRequired);
  const required = next.expRequired - (getRankByLevel(level).expRequired);
  return { currentExp: current, requiredExp: required, progressPercent: Math.min(100, Math.round((current / required) * 100)) };
};

export const getExpGainedForReview = (rating: Rating): number =>
  EXP_PER_REVIEW + (EXP_RATING_BONUS[rating] || 0);

export const getTotalExpForRatings = (ratings: Rating[]): number =>
  ratings.reduce((sum, r) => sum + getExpGainedForReview(r), 0);
export const NOTEBOOK_COLORS = [
  'linear-gradient(135deg, #cc785c, #d9947a)',
  'linear-gradient(135deg, #5db8a6, #7dc9ba)',
  'linear-gradient(135deg, #5db872, #7ecb89)',
  'linear-gradient(135deg, #8e8b82, #a8a59e)',
  'linear-gradient(135deg, #e8a55a, #efbe7f)',
];
