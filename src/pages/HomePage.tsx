import React, { useState, useCallback } from 'react';
import { Play, Plus, Flame, BookOpen, Target, Clock, ArrowRight } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { ReviewCard } from '../components/cards';
import { useStore } from '../stores/useStore';
import type { Rating } from '../types';

const HomePage: React.FC = () => {
  const { notebooks, cards, getDueCards, getTodayStats, getStreak, reviewCard, addNotebook, settings } = useStore();
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);

  const dueCards = getDueCards();
  const todayStats = getTodayStats();
  const streak = getStreak();

  const handleRate = useCallback((rating: Rating) => {
    if (dueCards[currentCardIndex]) {
      reviewCard(dueCards[currentCardIndex].id, rating);
      if (currentCardIndex < dueCards.length - 1) setCurrentCardIndex(p => p + 1);
      else { setIsReviewing(false); setCurrentCardIndex(0); }
    }
  }, [dueCards, currentCardIndex, reviewCard]);

  const handleCreateNotebook = () => {
    const name = (document.getElementById('nb-name') as HTMLInputElement)?.value;
    const desc = (document.getElementById('nb-desc') as HTMLTextAreaElement)?.value;
    if (name) { addNotebook(name, desc); setShowNewNotebookModal(false); }
  };

  if (isReviewing && dueCards.length > 0) {
    return <ReviewCard card={dueCards[currentCardIndex]} onRate={handleRate}
      onExit={() => { setIsReviewing(false); setCurrentCardIndex(0); }}
      currentIndex={currentCardIndex} total={dueCards.length} />;
  }

  const dueNotebooks = notebooks.map(n => ({
    ...n, dueCount: cards.filter(c => c.notebookId === n.id && c.nextReview <= Date.now()).length
  })).filter(n => n.dueCount > 0).slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      {/* Hero — 节律：奶油底色卡片套卡片 */}
      <section className="mb-12">
        <div className="bg-surface-card rounded-xl p-7 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ProgressRing
              progress={dueCards.length === 0 ? 100 : (todayStats.reviewedToday / (todayStats.reviewedToday + dueCards.length)) * 100}
              size={120} strokeWidth={7}>
              <div className="text-center">
                <div className="text-3xl font-medium heading-serif text-ink">{dueCards.length}</div>
                <div className="text-xs text-muted mt-0.5">待复习</div>
              </div>
            </ProgressRing>
            <div className="flex-1 text-center md:text-left">
              <h2 className="heading-serif text-xl md:text-2xl text-ink mb-1.5">
                {dueCards.length > 0 ? `今日有 ${dueCards.length} 张卡片待复习` : '今日任务已完成'}
              </h2>
              <p className="text-sm text-muted mb-5">
                {dueCards.length > 0 ? '坚持每日复习，让知识成为习惯' : '休息一下吧，明天继续'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {dueCards.length > 0 && (
                  <Button size="lg" onClick={() => setIsReviewing(true)}>
                    <Play size={17} className="mr-1.5" /> 开始复习
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={() => setShowNewNotebookModal(true)}>
                  <Plus size={17} className="mr-1.5" /> 新建学习本
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row — 奶油浅底 4 列 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { icon: Flame, value: streak, label: '连续打卡', bg: '#f5f0e8' },
          { icon: BookOpen, value: cards.length, label: '卡片总数', bg: '#f5f0e8' },
          { icon: Target, value: todayStats.reviewedToday, label: '今日已学', bg: '#f5f0e8' },
          { icon: Clock, value: settings.totalStudyDays, label: '累计天数', bg: '#f5f0e8' },
        ].map((s, i) => (
          <div key={s.label} className={`bg-surface-card rounded-lg p-4 text-center ${i > 0 ? `enter enter-d${i}` : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-canvas flex items-center justify-center mx-auto mb-2">
              <s.icon size={17} strokeWidth={1.5} className="text-muted" />
            </div>
            <div className="text-lg font-medium heading-serif text-ink">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Due notebooks */}
      {dueNotebooks.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-ink mb-3">待复习学习本</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dueNotebooks.map(nb => (
              <div key={nb.id} className="bg-surface-card rounded-lg px-4 py-3.5 flex items-center justify-between hover-lift">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{ background: nb.color }} />
                  <div>
                    <div className="text-sm font-medium text-ink">{nb.name}</div>
                    <div className="text-xs text-muted">{nb.dueCount} 待复习</div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-soft" />
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal isOpen={showNewNotebookModal} onClose={() => setShowNewNotebookModal(false)} title="新建学习本"
        footer={<><Button variant="ghost" onClick={() => setShowNewNotebookModal(false)}>取消</Button><Button onClick={handleCreateNotebook}>创建</Button></>}>
        <div className="space-y-3.5">
          <Input id="nb-name" label="名称" placeholder="例如：英语单词" />
          <Textarea id="nb-desc" label="描述（可选）" placeholder="简短描述..." rows={2} />
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
