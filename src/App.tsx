import React, { useEffect, useState } from 'react';
import { Header, BottomNav } from './components/layout';
import { HomePage, NotebooksPage, StatsPage, SettingsPage } from './pages';
import ToastContainer from './components/ui/ToastContainer';
import { useStore } from './stores/useStore';
import './styles/globals.css';

type Tab = 'home' | 'notebooks' | 'stats' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { getDueCards, initializeSettings } = useStore();
  useEffect(() => { initializeSettings(); }, [initializeSettings]);
  const dueCount = getDueCards().length;

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage />;
      case 'notebooks': return <NotebooksPage />;
      case 'stats': return <StatsPage />;
      case 'settings': return <SettingsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Header activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} dueCount={dueCount} />
      <main className="pb-16 md:pb-8">
        <div key={activeTab} className="page-enter">{renderPage()}</div>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} dueCount={dueCount} />
      <ToastContainer />
    </div>
  );
};

export default App;
