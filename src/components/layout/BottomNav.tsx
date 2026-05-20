import React, { useRef, useState, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { TABS } from '../../constants/tabs';
import type { TabId } from '../../constants/tabs';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  dueCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, dueCount }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button');
    const btn = buttons[activeIdx];
    if (!btn) return;
    const parentRect = containerRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - parentRect.left + 6,
      width: btnRect.width - 12,
    });
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-canvas/90 backdrop-blur-lg border-t border-hairline safe-area-bottom">
      <div ref={containerRef} className="relative flex items-center justify-around h-14 px-2">
        <motion.div
          className="absolute inset-y-1 -z-0 bg-surface-card rounded-lg"
          animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full rounded-lg
                ${isActive ? 'text-primary' : 'text-muted hover:text-ink'}`}
            >
              <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </div>
              {tab.id === 'home' && dueCount > 0 && (
                <span className="absolute -top-0.5 right-1/2 translate-x-[14px] w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center z-10">
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