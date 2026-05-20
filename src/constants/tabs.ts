import { Brain, BookMarked, GitBranch, BarChart3, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabId = 'home' | 'notebooks' | 'graph' | 'stats' | 'settings';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabConfig[] = [
  { id: 'home', label: '首页', icon: Brain },
  { id: 'notebooks', label: '学习本', icon: BookMarked },
  { id: 'graph', label: '图谱', icon: GitBranch },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'settings', label: '设置', icon: Settings },
];

export const TAB_ORDER: TabId[] = TABS.map(t => t.id);