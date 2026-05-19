import React from 'react';
import { BookMarked, BarChart3, Brain, Settings, GitBranch } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dueCount: number;
}

const tabs = [
  { id: 'home', label: '首页', icon: Brain },
  { id: 'notebooks', label: '学习本', icon: BookMarked },
  { id: 'graph', label: '图谱', icon: GitBranch },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'settings', label: '设置', icon: Settings },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, dueCount }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-canvas/90 backdrop-blur-lg border-t border-hairline safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full rounded-lg transition-colors
                ${isActive ? 'text-primary' : 'text-muted hover:text-ink'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.id === 'home' && dueCount > 0 && (
                <span className="absolute -top-0.5 right-1/2 translate-x-[14px] w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {dueCount > 9 ? '9+' : dueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;