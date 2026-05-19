import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Notebook, Folder, Card, CardLink, ReviewLog, Settings, Rating } from '../types';
import { getExpGainedForReview, getRankByExp } from '../types';

const STORAGE_KEY = 'memoryflow_store';

interface AppStore {
  notebooks: Notebook[];
  folders: Folder[];
  cards: Card[];
  cardLinks: CardLink[];
  reviewLogs: ReviewLog[];
  settings: Settings;

  addNotebook: (name: string, description?: string, color?: string) => Notebook;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;

  // Folder CRUD
  addFolder: (notebookId: string, name: string, parentFolderId?: string | null) => Folder;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  getFolderTree: (notebookId: string) => Folder[];
  getChildFolders: (folderId: string) => Folder[];
  getCardsByFolder: (folderId: string) => Card[];

  addCard: (notebookId: string, type: 'question' | 'cloze', front: string, back: string, tags?: string[], folderId?: string) => Card;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;

  refreshCardLinks: (cardId: string) => void;

  reviewCard: (cardId: string, rating: Rating) => void;
  getDueCards: () => Card[];

  getBacklinks: (cardId: string) => CardLink[];
  getForwardLinks: (cardId: string) => CardLink[];
  getAllTags: () => string[];

  getTodayStats: () => { dueCount: number; reviewedToday: number };
  getStreak: () => number;
  getHeatmapData: () => Map<string, number>;

  updateSettings: (updates: Partial<Settings>) => void;
  initializeSettings: () => void;

  exportData: () => string;
  importData: (json: string) => string | null;
  resetAllData: () => void;
}

const defaultSettings: Settings = {
  dailyGoal: 20, theme: 'dark', lastStudyDate: '', streakDays: 0, totalStudyDays: 0, exp: 0, level: 1,
};

// ── 工具函数 ──
const getDateString = (t: number): string => new Date(t).toISOString().split('T')[0];
const today = (): string => getDateString(Date.now());

const MS = { MIN: 60_000, HOUR: 3_600_000, DAY: 86_400_000 };
const REVIEW_INTERVALS_MS = [5 * MS.MIN, 30 * MS.MIN, 12 * MS.HOUR, 1 * MS.DAY, 2 * MS.DAY, 4 * MS.DAY, 7 * MS.DAY, 15 * MS.DAY];
const ratingMap: Record<Rating, number> = { forgot: 1, hard: 3, good: 5 };

const calculateNextReview = (card: Card, rating: Rating, reviewedAt: number) => {
  const q = ratingMap[rating];
  let newEF = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;
  let intervalMs: number;
  if (rating === 'forgot') {
    intervalMs = REVIEW_INTERVALS_MS[0];
  } else {
    let idx = Math.min(card.reviewCount, REVIEW_INTERVALS_MS.length - 1);
    if (rating === 'good' && newEF > 3.0) idx = Math.min(idx + 1, REVIEW_INTERVALS_MS.length - 1);
    else if (rating === 'hard' && newEF < 1.5) idx = Math.max(0, idx - 2);
    else if (rating === 'hard') idx = Math.max(0, idx - 1);
    intervalMs = REVIEW_INTERVALS_MS[idx];
  }
  const nextReview = intervalMs < MS.DAY ? reviewedAt + intervalMs : (() => { const d = new Date(reviewedAt + intervalMs); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  return { interval: intervalMs, nextReview, newEF };
};

/** 从文本中解析 [[链接]] 并生成/更新 CardLink */
const parseAndUpdateLinks = (cardId: string, front: string, back: string, allCards: Card[], oldLinks: CardLink[]): CardLink[] => {
  const linkNames = new Set<string>();
  const text = front + ' ' + back;
  const regex = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = regex.exec(text)) !== null) linkNames.add(m[1]);

  const newLinks: CardLink[] = [];
  linkNames.forEach(name => {
    // 找到被引用的卡片（front 包含该名称）
    const target = allCards.find(c => c.id !== cardId && c.front.includes(name));
    newLinks.push({
      id: nanoid(8),
      sourceId: cardId,
      targetId: target?.id || '',
      targetName: name,
    });
  });
  return newLinks;
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      notebooks: [],
      folders: [],
      cards: [],
      cardLinks: [],
      reviewLogs: [],
      settings: defaultSettings,

      initializeSettings: () => {
        const { settings } = get();
        if (!settings.lastStudyDate) set({ settings: { ...settings, lastStudyDate: today() } });
      },

      // Notebooks
      addNotebook: (name, description, color) => {
        const notebook: Notebook = { id: nanoid(), name, description, color: color || 'linear-gradient(135deg, #cc785c, #d9947a)', createdAt: Date.now(), updatedAt: Date.now() };
        set(s => ({ notebooks: [...s.notebooks, notebook] }));
        return notebook;
      },
      updateNotebook: (id, updates) => set(s => ({ notebooks: s.notebooks.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n) })),
      deleteNotebook: (id) => set(s => ({ notebooks: s.notebooks.filter(n => n.id !== id), folders: s.folders.filter(f => f.notebookId !== id), cards: s.cards.filter(c => c.notebookId !== id), cardLinks: s.cardLinks.filter(l => l.sourceId !== id && l.targetId !== id) })),

      // Folders
      addFolder: (notebookId, name, parentFolderId) => {
        const folder: Folder = { id: nanoid(), notebookId, name, parentFolderId: parentFolderId ?? null, createdAt: Date.now(), updatedAt: Date.now() };
        set(s => ({ folders: [...s.folders, folder] }));
        return folder;
      },
      updateFolder: (id, updates) => set(s => ({ folders: s.folders.map(f => f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f) })),
      deleteFolder: (id) => set(s => {
        // 级联删除子文件夹 + 移出卡片到未分类
        const idsToDelete = new Set<string>([id]);
        const children = (parentId: string) => s.folders.filter(f => f.parentFolderId === parentId);
        const collect = (parentId: string) => { children(parentId).forEach(c => { idsToDelete.add(c.id); collect(c.id); }); };
        collect(id);
        return {
          folders: s.folders.filter(f => !idsToDelete.has(f.id)),
          cards: s.cards.map(c => idsToDelete.has(c.folderId || '') ? { ...c, folderId: undefined } : c),
        };
      }),
      getFolderTree: (notebookId) => get().folders.filter(f => f.notebookId === notebookId),
      getChildFolders: (folderId) => get().folders.filter(f => f.parentFolderId === folderId),
      getCardsByFolder: (folderId) => get().cards.filter(c => c.folderId === folderId),

      // Cards
      addCard: (notebookId, type, front, back, tags, folderId) => {
        const card: Card = { id: nanoid(), notebookId, folderId, type, front, back, interval: 1, nextReview: Date.now(), reviewCount: 0, easeFactor: 2.5, tags: tags || [], createdAt: Date.now(), updatedAt: Date.now() };
        set(s => {
          const newLinks = parseAndUpdateLinks(card.id, front, back, [...s.cards, card], s.cardLinks);
          return { cards: [...s.cards, card], cardLinks: [...s.cardLinks, ...newLinks] };
        });
        return card;
      },
      updateCard: (id, updates) => set(s => {
        const updatedCards = s.cards.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c);
        const card = updatedCards.find(c => c.id === id);
        // 如果 front/back/tags 有变化，重新解析链接
        if (card && (updates.front !== undefined || updates.back !== undefined || updates.tags !== undefined)) {
          const otherLinks = s.cardLinks.filter(l => l.sourceId !== id);
          const newLinks = parseAndUpdateLinks(id, card.front, card.back, updatedCards, s.cardLinks);
          return { cards: updatedCards, cardLinks: [...otherLinks, ...newLinks] };
        }
        return { cards: updatedCards };
      }),
      deleteCard: (id) => set(s => ({ cards: s.cards.filter(c => c.id !== id), cardLinks: s.cardLinks.filter(l => l.sourceId !== id && l.targetId !== id) })),

      refreshCardLinks: (cardId) => set(s => {
        const card = s.cards.find(c => c.id === cardId);
        if (!card) return {};
        const otherLinks = s.cardLinks.filter(l => l.sourceId !== cardId);
        const newLinks = parseAndUpdateLinks(cardId, card.front, card.back, s.cards, s.cardLinks);
        return { cardLinks: [...otherLinks, ...newLinks] };
      }),

      // Links & Tags
      getBacklinks: (cardId) => get().cardLinks.filter(l => l.targetId === cardId),
      getForwardLinks: (cardId) => get().cardLinks.filter(l => l.sourceId === cardId),
      getAllTags: () => {
        const allTags = new Set<string>();
        get().cards.forEach(c => c.tags?.forEach(t => allTags.add(t)));
        return [...allTags].sort();
      },

      // Review
      reviewCard: (cardId, rating) => {
        const { cards, reviewLogs, settings } = get();
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        const reviewedAt = Date.now();
        const { interval, nextReview, newEF } = calculateNextReview(card, rating, reviewedAt);
        const reviewLog: ReviewLog = { id: nanoid(), cardId, rating, reviewedAt, previousInterval: card.interval, newInterval: interval };
        let newSettings = { ...settings };
        const todayStr = today();
        const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getDateString(d.getTime()); })();
        if (settings.lastStudyDate === todayStr) {}
        else if (settings.lastStudyDate === yesterday) { newSettings.streakDays = settings.streakDays + 1; newSettings.totalStudyDays = settings.totalStudyDays + 1; }
        else if (!settings.lastStudyDate) { newSettings.streakDays = 1; newSettings.totalStudyDays = 1; }
        else { newSettings.streakDays = 1; newSettings.totalStudyDays = settings.totalStudyDays + 1; }
        newSettings.lastStudyDate = todayStr;
        const expGained = getExpGainedForReview(rating);
        newSettings.exp = settings.exp + expGained;
        const newLevel = getRankByExp(newSettings.exp).level;
        newSettings.level = newLevel;
        set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, interval, nextReview, easeFactor: newEF, reviewCount: c.reviewCount + 1, updatedAt: Date.now() } : c), reviewLogs: [...s.reviewLogs, reviewLog], settings: newSettings }));
      },
      getDueCards: () => get().cards.filter(c => c.nextReview <= Date.now()),

      getTodayStats: () => {
        const { cards, reviewLogs } = get();
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return { dueCount: cards.filter(c => c.nextReview <= Date.now()).length, reviewedToday: reviewLogs.filter(r => r.reviewedAt >= start.getTime() && r.reviewedAt <= end.getTime()).length };
      },
      getStreak: () => {
        const { settings } = get();
        const t = today();
        const y = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getDateString(d.getTime()); })();
        if (settings.lastStudyDate === t || settings.lastStudyDate === y) return settings.streakDays;
        return 0;
      },
      getHeatmapData: () => {
        const h = new Map<string, number>();
        get().reviewLogs.forEach(l => { const d = getDateString(l.reviewedAt); h.set(d, (h.get(d) || 0) + 1); });
        return h;
      },

      updateSettings: (updates) => set(s => ({ settings: { ...s.settings, ...updates } })),

      exportData: () => {
        const { notebooks, folders, cards, reviewLogs, settings, cardLinks } = get();
        return JSON.stringify({ version: 2, notebooks, folders, cards, cardLinks, reviewLogs, settings }, null, 2);
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (!data.notebooks || !data.cards || !data.reviewLogs || !data.settings) return '数据格式不正确';
          set({ notebooks: data.notebooks, folders: data.folders || [], cards: data.cards, cardLinks: data.cardLinks || [], reviewLogs: data.reviewLogs, settings: data.settings });
          return null;
        } catch { return 'JSON 解析失败'; }
      },

      resetAllData: () => {
        set({
          notebooks: [], folders: [], cards: [], cardLinks: [], reviewLogs: [],
          settings: { ...defaultSettings, lastStudyDate: today(), streakDays: 1, totalStudyDays: 1 },
        });
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      },
    }),
    { name: STORAGE_KEY }
  )
);
