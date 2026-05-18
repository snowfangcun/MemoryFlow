import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Notebook, Card, ReviewLog, Settings, Rating } from '../types';

const STORAGE_KEY = 'memoryflow_store';

interface AppStore {
  // Data
  notebooks: Notebook[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  settings: Settings;

  // Notebook Actions
  addNotebook: (name: string, description?: string, color?: string) => Notebook;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;

  // Card Actions
  addCard: (notebookId: string, type: 'question' | 'cloze', front: string, back: string) => Card;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;

  // Review Actions
  reviewCard: (cardId: string, rating: Rating) => void;
  getDueCards: () => Card[];

  // Stats Actions
  getTodayStats: () => { dueCount: number; reviewedToday: number };
  getStreak: () => number;
  getHeatmapData: () => Map<string, number>;

  // Settings Actions
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

// Helper functions
const calculateNextReview = (card: Card, rating: Rating): { interval: number; nextReview: number } => {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let newInterval: number;

  switch (rating) {
    case 'forgot':
      newInterval = 1;
      break;
    case 'hard':
      newInterval = Math.max(1, Math.round(card.interval * 1.5));
      break;
    case 'good':
      newInterval = Math.min(365, Math.round(card.interval * 2.2));
      break;
  }

  return {
    interval: newInterval,
    nextReview: now + newInterval * DAY,
  };
};

const getDateString = (timestamp: number): string => {
  return new Date(timestamp).toISOString().split('T')[0];
};

const today = (): string => getDateString(Date.now());
const yesterday = (refDate?: string): string => {
  const date = refDate ? new Date(refDate) : new Date();
  date.setDate(date.getDate() - 1);
  return getDateString(date.getTime());
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
          id: nanoid(),
          name,
          description,
          color: color || 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          createdAt: Date.now(),
          updatedAt: Date.now(),
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
          id: nanoid(),
          notebookId,
          type,
          front,
          back,
          interval: 1,
          nextReview: Date.now(), // Due immediately for new cards
          reviewCount: 0,
          easeFactor: 2.5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
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

        const { interval, nextReview } = calculateNextReview(card, rating);
        const reviewLog: ReviewLog = {
          id: nanoid(),
          cardId,
          rating,
          reviewedAt: Date.now(),
          previousInterval: card.interval,
          newInterval: interval,
        };

        // Update streak and total days
        let newSettings = { ...settings };
        const todayStr = today();
        const yesterdayStr = yesterday();

        if (settings.lastStudyDate === todayStr) {
          // Already studied today, no streak change
        } else if (settings.lastStudyDate === yesterdayStr) {
          // Consecutive day
          newSettings.streakDays = settings.streakDays + 1;
          newSettings.totalStudyDays = settings.totalStudyDays + 1;
        } else if (!settings.lastStudyDate) {
          // First study
          newSettings.streakDays = 1;
          newSettings.totalStudyDays = 1;
        } else {
          // Streak broken
          newSettings.streakDays = 1;
          newSettings.totalStudyDays = settings.totalStudyDays + 1;
        }
        newSettings.lastStudyDate = todayStr;

        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? { ...c, interval, nextReview, reviewCount: c.reviewCount + 1, updatedAt: Date.now() }
              : c
          ),
          reviewLogs: [...state.reviewLogs, reviewLog],
          settings: newSettings,
        }));
      },

      getDueCards: () => {
        const { cards } = get();
        const now = Date.now();
        return cards.filter((c) => c.nextReview <= now);
      },

      // Stats Actions
      getTodayStats: () => {
        const { cards, reviewLogs } = get();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const dueCards = cards.filter((c) => c.nextReview <= Date.now());
        const reviewedToday = reviewLogs.filter(
          (r) => r.reviewedAt >= todayStart.getTime() && r.reviewedAt <= todayEnd.getTime()
        ).length;

        return {
          dueCount: dueCards.length,
          reviewedToday,
        };
      },

      getStreak: () => {
        const { settings } = get();
        const todayStr = today();
        const yesterdayStr = yesterday();

        if (settings.lastStudyDate === todayStr || settings.lastStudyDate === yesterdayStr) {
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
    {
      name: STORAGE_KEY,
    }
  )
);
