import React, { useEffect, useState } from 'react';
import { Header, BottomNav } from './components/layout';
import { HomePage, NotebooksPage, StatsPage, SettingsPage, KnowledgeGraphPage } from './pages';
import ToastContainer from './components/ui/ToastContainer';
import { useStore } from './stores/useStore';
import './styles/globals.css';

type Tab = 'home' | 'notebooks' | 'graph' | 'stats' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
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
    <div className="min-h-screen bg-canvas">
      {!isReviewActive && (
        <Header activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} dueCount={dueCount} />
      )}
      <main className={isReviewActive ? '' : 'pb-16 md:pb-8'}>
        <div key={activeTab} className="page-enter">{renderPage()}</div>
      </main>
      {!isReviewActive && (
        <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} dueCount={dueCount} />
      )}
      <ToastContainer />
    </div>
  );
};

export default App;
