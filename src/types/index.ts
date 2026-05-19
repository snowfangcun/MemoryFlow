export interface Notebook {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export type CardType = 'question' | 'cloze';

export interface Card {
  id: string;
  notebookId: string;
  type: CardType;
  front: string;
  back: string;
  interval: number;   // 毫秒 (ms)
  nextReview: number; // 下次复习时间戳
  reviewCount: number;
  easeFactor: number;
  createdAt: number;
  updatedAt: number;
}

export type Rating = 'forgot' | 'hard' | 'good';

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: Rating;
  reviewedAt: number;
  previousInterval: number;
  newInterval: number;
}

export interface Settings {
  dailyGoal: number;
  theme: 'dark';
  lastStudyDate: string;
  streakDays: number;
  totalStudyDays: number;
}

// 351-351 复习法最长间隔（15天，毫秒）
export const MASTERED_INTERVAL_MS = 15 * 24 * 60 * 60 * 1000;

export const NOTEBOOK_COLORS = [
  'linear-gradient(135deg, #cc785c, #d9947a)',
  'linear-gradient(135deg, #5db8a6, #7dc9ba)',
  'linear-gradient(135deg, #5db872, #7ecb89)',
  'linear-gradient(135deg, #8e8b82, #a8a59e)',
  'linear-gradient(135deg, #e8a55a, #efbe7f)',
];
