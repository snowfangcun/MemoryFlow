import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Notebook, Card, ReviewLog, Settings, Rating } from '../types';

const STORAGE_KEY = 'memoryflow_store';

interface AppStore {
  notebooks: Notebook[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  settings: Settings;

  addNotebook: (name: string, description?: string, color?: string) => Notebook;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;

  addCard: (notebookId: string, type: 'question' | 'cloze', front: string, back: string) => Card;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;

  reviewCard: (cardId: string, rating: Rating) => void;
  getDueCards: () => Card[];

  getTodayStats: () => { dueCount: number; reviewedToday: number };
  getStreak: () => number;
  getHeatmapData: () => Map<string, number>;

  updateSettings: (updates: Partial<Settings>) => void;
  initializeSettings: () => void;
}

const defaultSettings: Settings = {
  dailyGoal: 20,
  theme: 'dark',
  lastStudyDate: '',
  streakDays: 0,
  totalStudyDays: 0,
};

// ── 日期工具 ──
const getDateString = (timestamp: number): string => new Date(timestamp).toISOString().split('T')[0];
const today = (): string => getDateString(Date.now());

// ── "351-351" 复习间隔法 ──
// 各次复习间隔（毫秒）：5分钟 → 30分钟 → 12小时 → 1天 → 2天 → 4天 → 7天 → 15天
const MS = { MIN: 60_000, HOUR: 3_600_000, DAY: 86_400_000 };
const REVIEW_INTERVALS_MS = [
  5 * MS.MIN,           // 第1次：5分钟
  30 * MS.MIN,          // 第2次：30分钟
  12 * MS.HOUR,         // 第3次：12小时
  1 * MS.DAY,           // 第4次：1天
  2 * MS.DAY,           // 第5次：2天
  4 * MS.DAY,           // 第6次：4天
  7 * MS.DAY,           // 第7次：7天
  15 * MS.DAY,          // 第8次：15天
];
const MAX_INTERVAL_MS = 15 * MS.DAY; // 最长间隔

// rating → SM-2 quality
const ratingMap: Record<Rating, number> = { forgot: 1, hard: 3, good: 5 };

const calculateNextReview = (
  card: Card,
  rating: Rating,
  reviewedAt: number
): { interval: number; nextReview: number; newEF: number } => {
  const q = ratingMap[rating];
  const oldEF = card.easeFactor;

  // 1. SM-2 更新简易度因子 EF
  let newEF = oldEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  // 2. 计算间隔（351-351 固定间隔 + EF 自适应微调）
  let intervalMs: number;

  if (rating === 'forgot') {
    // 遗忘 → 重置到第1次间隔（5分钟）
    intervalMs = REVIEW_INTERVALS_MS[0];
  } else {
    // 基准：当前完成的复习次数对应的间隔表位置
    let idx = Math.min(card.reviewCount, REVIEW_INTERVALS_MS.length - 1);

    // EF 自适应微调
    if (rating === 'good' && newEF > 3.0) {
      // 总是简单且 EF 很高 → 跳一级，表明这张卡你已高度掌握
      idx = Math.min(idx + 1, REVIEW_INTERVALS_MS.length - 1);
    } else if (rating === 'hard' && newEF < 1.5) {
      // 觉得模糊且 EF 已较低 → 多退一级，额外加固
      idx = Math.max(0, idx - 2);
    } else if (rating === 'hard') {
      // 一般 → 退一级
      idx = Math.max(0, idx - 1);
    }
    // good 且 EF 正常 → 保持 idx 不变

    intervalMs = REVIEW_INTERVALS_MS[idx];
  }

  // 3. 计算下次复习时间
  // 短间隔（< 1天）精确计算；长间隔（>= 1天）对齐到当日 0 点
  let nextReview: number;
  if (intervalMs < MS.DAY) {
    nextReview = reviewedAt + intervalMs;
  } else {
    const d = new Date(reviewedAt + intervalMs);
    d.setHours(0, 0, 0, 0);
    nextReview = d.getTime();
  }

  return { interval: intervalMs, nextReview, newEF };
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      notebooks: [],
      cards: [],
      reviewLogs: [],
      settings: defaultSettings,

      initializeSettings: () => {
        const { settings } = get();
        if (!settings.lastStudyDate) {
          set({ settings: { ...settings, lastStudyDate: today() } });
        }
      },

      // Notebook Actions
      addNotebook: (name, description, color) => {
        const notebook: Notebook = {
          id: nanoid(), name, description,
          color: color || 'linear-gradient(135deg, #cc785c, #d9947a)',
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        set((state) => ({ notebooks: [...state.notebooks, notebook] }));
        return notebook;
      },

      updateNotebook: (id, updates) => {
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
          ),
        }));
      },

      deleteNotebook: (id) => {
        set((state) => ({
          notebooks: state.notebooks.filter((n) => n.id !== id),
          cards: state.cards.filter((c) => c.notebookId !== id),
        }));
      },

      // Card Actions
      addCard: (notebookId, type, front, back) => {
        const card: Card = {
          id: nanoid(), notebookId, type, front, back,
          interval: 1, nextReview: Date.now(),
          reviewCount: 0, easeFactor: 2.5,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        set((state) => ({ cards: [...state.cards, card] }));
        return card;
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        }));
      },

      deleteCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
          reviewLogs: state.reviewLogs.filter((r) => r.cardId !== id),
        }));
      },

      // Review Actions
      reviewCard: (cardId, rating) => {
        const { cards, reviewLogs, settings } = get();
        const card = cards.find((c) => c.id === cardId);
        if (!card) return;

        const reviewedAt = Date.now();
        const { interval, nextReview, newEF } = calculateNextReview(card, rating, reviewedAt);

        const reviewLog: ReviewLog = {
          id: nanoid(), cardId, rating,
          reviewedAt,
          previousInterval: card.interval,
          newInterval: interval,
        };

        // 连续打卡计算
        let newSettings = { ...settings };
        const todayStr = today();
        const yesterday = (): string => {
          const d = new Date(); d.setDate(d.getDate() - 1);
          return getDateString(d.getTime());
        };

        if (settings.lastStudyDate === todayStr) {
          // 今天已学过
        } else if (settings.lastStudyDate === yesterday()) {
          newSettings.streakDays = settings.streakDays + 1;
          newSettings.totalStudyDays = settings.totalStudyDays + 1;
        } else if (!settings.lastStudyDate) {
          newSettings.streakDays = 1;
          newSettings.totalStudyDays = 1;
        } else {
          newSettings.streakDays = 1;
          newSettings.totalStudyDays = settings.totalStudyDays + 1;
        }
        newSettings.lastStudyDate = todayStr;

        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? { ...c, interval, nextReview, easeFactor: newEF, reviewCount: c.reviewCount + 1, updatedAt: Date.now() }
              : c
          ),
          reviewLogs: [...state.reviewLogs, reviewLog],
          settings: newSettings,
        }));
      },

      getDueCards: () => {
        const { cards } = get();
        return cards.filter((c) => c.nextReview <= Date.now());
      },

      getTodayStats: () => {
        const { cards, reviewLogs } = get();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        const dueCards = cards.filter((c) => c.nextReview <= Date.now());
        const reviewedToday = reviewLogs.filter(
          (r) => r.reviewedAt >= todayStart.getTime() && r.reviewedAt <= todayEnd.getTime()
        ).length;

        return { dueCount: dueCards.length, reviewedToday };
      },

      getStreak: () => {
        const { settings } = get();
        const todayStr = today();
        const yesterday = (): string => {
          const d = new Date(); d.setDate(d.getDate() - 1);
          return getDateString(d.getTime());
        };

        if (settings.lastStudyDate === todayStr || settings.lastStudyDate === yesterday()) {
          return settings.streakDays;
        }
        return 0;
      },

      getHeatmapData: () => {
        const { reviewLogs } = get();
        const heatmap = new Map<string, number>();
        reviewLogs.forEach((log) => {
          const date = getDateString(log.reviewedAt);
          heatmap.set(date, (heatmap.get(date) || 0) + 1);
        });
        return heatmap;
      },
    }),
    { name: STORAGE_KEY }
  )
);
