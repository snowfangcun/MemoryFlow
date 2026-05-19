import React from 'react';
import { BookMarked, BarChart3, Brain, Sparkles, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dueCount: number;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, dueCount }) => {
  const tabs = [
    { id: 'home', label: '首页', icon: Brain },
    { id: 'notebooks', label: '学习本', icon: BookMarked },
    { id: 'stats', label: '统计', icon: BarChart3 },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles size={16} className="text-on-primary" />
            </div>
            <span className="heading-serif text-xl font-medium text-ink">MemoryFlow</span>
          </div>

          <nav className="flex items-center gap-1 bg-surface-soft rounded-xl p-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'}
                    ${tab.id === 'settings' ? 'px-2' : ''}`}>
                  <Icon size={16} />
                  <span className={tab.id === 'settings' ? 'hidden sm:inline' : 'hidden sm:inline'}>{tab.label}</span>
                  {tab.id === 'home' && dueCount > 0 && (
                    <span className="w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center absolute -top-0.5 -right-0.5">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
