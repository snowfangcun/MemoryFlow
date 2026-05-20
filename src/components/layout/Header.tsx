import React from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';
import { useStore } from '../../stores/useStore';
import { getRankByLevel } from '../../types';
import { TABS } from '../../constants/tabs';
import type { TabId } from '../../constants/tabs';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  dueCount: number;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, dueCount }) => {
  const { settings } = useStore();
  const rank = getRankByLevel(settings.level);

  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-lg border-b border-hairline">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles size={16} className="text-on-primary" />
            </div>
            <span className="brand-text text-xl text-ink">温故</span>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-soft border border-hairline">
              <GraduationCap size={13} className="text-primary" />
              <span className="text-xs font-medium text-muted">{rank.title}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-surface-soft rounded-xl p-0.5">
            {TABS.map((tab) => {
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