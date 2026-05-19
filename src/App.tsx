import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header, BottomNav } from './components/layout';
import { HomePage, NotebooksPage, StatsPage, SettingsPage, KnowledgeGraphPage } from './pages';
import ToastContainer from './components/ui/ToastContainer';
import { useStore } from './stores/useStore';
import './styles/globals.css';

type Tab = 'home' | 'notebooks' | 'graph' | 'stats' | 'settings';

const tabOrder: Tab[] = ['home', 'notebooks', 'graph', 'stats', 'settings'];

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  }),
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [direction, setDirection] = useState(0);
  const [isReviewActive, setIsReviewActive] = useState(false);
  const { getDueCards, initializeSettings, settings } = useStore();
  useEffect(() => { initializeSettings(); }, [initializeSettings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const dueCount = getDueCards().length;

  const handleTabChange = useCallback((tab: Tab) => {
    const dir = tabOrder.indexOf(tab) - tabOrder.indexOf(activeTab);
    setDirection(dir);
    setActiveTab(tab);
  }, [activeTab]);

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage onReviewChange={setIsReviewActive} />;
      case 'notebooks': return <NotebooksPage />;
      case 'graph': return <KnowledgeGraphPage />;
      case 'stats': return <StatsPage />;
      case 'settings': return <SettingsPage />;
      default: return <HomePage onReviewChange={setIsReviewActive} />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden">
      {!isReviewActive && (
        <Header activeTab={activeTab} onTabChange={(tab) => handleTabChange(tab as Tab)} dueCount={dueCount} />
      )}
      <main className={isReviewActive ? '' : 'pb-16 md:pb-8'}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isReviewActive && (
        <BottomNav activeTab={activeTab} onTabChange={(tab) => handleTabChange(tab as Tab)} dueCount={dueCount} />
      )}
      <ToastContainer />
    </div>
  );
};

export default App;
