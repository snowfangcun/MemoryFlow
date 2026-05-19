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
export interface Settings { dailyGoal: number; theme: 'light' | 'dark'; lastStudyDate: string; streakDays: number; totalStudyDays: number; }

export const MASTERED_INTERVAL_MS = 15 * 24 * 60 * 60 * 1000;
export const NOTEBOOK_COLORS = [
  'linear-gradient(135deg, #cc785c, #d9947a)',
  'linear-gradient(135deg, #5db8a6, #7dc9ba)',
  'linear-gradient(135deg, #5db872, #7ecb89)',
  'linear-gradient(135deg, #8e8b82, #a8a59e)',
  'linear-gradient(135deg, #e8a55a, #efbe7f)',
];
