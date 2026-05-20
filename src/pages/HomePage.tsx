import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Play, Plus, Flame, BookOpen, Target, GraduationCap, ArrowRight, ChevronRight, RotateCcw } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import ReviewCard from '../components/cards/ReviewCard';
import ReviewCompletion from '../components/ui/ReviewCompletion';
import EmptyState from '../components/ui/EmptyState';
import { useStore } from '../stores/useStore';
import { useToastStore } from '../stores/useToastStore';
import { getRankByLevel, getNextRank, getExpProgress } from '../types';
import type { Rating } from '../types';

interface HomePageProps {
  onReviewChange?: (active: boolean) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onReviewChange }) => {
  const { notebooks, folders, cards, getDueCards, getDueStats, getTodayStats, getStreak, reviewCard, addNotebook, settings } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [newNbName, setNewNbName] = useState('');
  const [newNbDesc, setNewNbDesc] = useState('');

  // 错题重练
  const [isRetrySession, setIsRetrySession] = useState(false);
  const [retryCardIds, setRetryCardIds] = useState<string[]>([]);

  // 收集本次复习的评级用于完成页
  const ratingsRef = useRef<Rating[]>([]);
  const [reviewRatings, setReviewRatings] = useState<Rating[]>([]);

  const dueCards = getDueCards();
  const dueStats = getDueStats();
  const todayStats = getTodayStats();
  const streak = getStreak();
  const rank = getRankByLevel(settings.level);
  const nextRank = getNextRank(settings.level);
  const expProgress = getExpProgress(settings.exp, settings.level);

  const retryCards = useMemo(
    () => cards.filter(c => retryCardIds.includes(c.id)),
    [cards, retryCardIds]
  );

  const totalToday = dueStats.totalDue + todayStats.reviewedToday;
  const progress = totalToday > 0 ? (todayStats.reviewedToday / totalToday) * 100 : 0;

  const endReview = useCallback((ratings: Rating[]) => {
    setReviewRatings(ratings);
    ratingsRef.current = [];
    setIsReviewing(false);
    setCurrentCardIndex(0);
    setShowCompletion(true);
  }, []);

  const handleRate = useCallback((rating: Rating) => {
    if (isRetrySession) {
      const currentCard = retryCards[currentCardIndex];
      if (!currentCard) return;
      reviewCard(currentCard.id, rating);
      ratingsRef.current = [...ratingsRef.current, rating];
      if (rating === 'good' || rating === 'hard') {
        const newRetry = retryCardIds.filter(id => id !== currentCard.id);
        if (newRetry.length === 0) {
          endReview(ratingsRef.current);
          setIsRetrySession(false);
          setRetryCardIds([]);
        } else {
          setRetryCardIds(newRetry);
          setCurrentCardIndex(0);
        }
      } else {
        if (currentCardIndex < retryCards.length - 1) {
          setCurrentCardIndex(p => p + 1);
        } else {
          setCurrentCardIndex(0);
        }
      }
    } else {
      const currentCard = dueCards[currentCardIndex];
      if (!currentCard) return;
      reviewCard(currentCard.id, rating);
      ratingsRef.current = [...ratingsRef.current, rating];
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(p => p + 1);
      } else {
        const forgottenIds = dueCards
          .filter((_, i) => ratingsRef.current[i] === 'forgot')
          .map(c => c.id);
        if (forgottenIds.length > 0) {
          setReviewRatings([]);
          ratingsRef.current = [];
          setRetryCardIds(forgottenIds);
          setIsRetrySession(true);
          setCurrentCardIndex(0);
        } else {
          endReview(ratingsRef.current);
        }
      }
    }
  }, [dueCards, retryCards, currentCardIndex, reviewCard, isRetrySession, retryCardIds, endReview]);

  const exitReview = useCallback(() => {
    if (ratingsRef.current.length > 0) {
      addToast(`已复习 ${ratingsRef.current.length} 张，进度已保存`, 'info');
      ratingsRef.current = [];
    }
    setIsReviewing(false);
    setIsRetrySession(false);
    setRetryCardIds([]);
    setCurrentCardIndex(0);
    onReviewChange?.(false);
  }, [addToast, onReviewChange]);

  const handleCreateNotebook = () => {
    if (newNbName.trim()) {
      addNotebook(newNbName.trim(), newNbDesc.trim() || undefined);
      addToast('学习本已创建', 'success');
      setNewNbName('');
      setNewNbDesc('');
      setShowNewNotebookModal(false);
    }
  };

  // 完成页 → 首页
  if (showCompletion) {
    return (
      <ReviewCompletion
        reviewedCount={reviewRatings.length}
        ratings={reviewRatings}
        onFinish={() => { setShowCompletion(false); onReviewChange?.(false); }}
      />
    );
  }

  // 复习模式
  if (isReviewing) {
    const cardsToReview = isRetrySession ? retryCards : dueCards;
    if (cardsToReview.length > 0) {
      return (
        <>
          {isRetrySession && (
            <div className="bg-danger/10 border-b border-danger/20 px-5 py-2 flex items-center justify-center gap-2">
              <RotateCcw size={13} className="text-danger" />
              <span className="text-xs font-medium text-danger">
                错题重练 · 还有 {retryCards.length} 张待巩固
              </span>
            </div>
          )}
          <ReviewCard
            card={cardsToReview[currentCardIndex]}
            onRate={handleRate}
            onExit={exitReview}
            currentIndex={currentCardIndex}
            total={cardsToReview.length}
          />
        </>
      );
    }
    // 理论上不会到这里，但如果 cardsToReview 为空则回到首页
    exitReview();
  }

  const dueNotebooks = notebooks.map(n => ({
    ...n, dueCount: cards.filter(c => c.notebookId === n.id && c.nextReview <= Date.now()).length
  })).filter(n => n.dueCount > 0).slice(0, 3);

  // 没有学习本 → 只展示空状态引导
  if (notebooks.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState icon="book" title="开始你的学习之旅"
            description="创建一个学习本，然后添加卡片开始记忆"
            action={{ label: '新建学习本', onClick: () => { setNewNbName(''); setNewNbDesc(''); setShowNewNotebookModal(true); } }} />
        </div>
        <Modal isOpen={showNewNotebookModal} onClose={() => setShowNewNotebookModal(false)} title="新建学习本"
          footer={<><Button variant="ghost" onClick={() => setShowNewNotebookModal(false)}>取消</Button><Button onClick={handleCreateNotebook}>创建</Button></>}>
          <div className="space-y-3.5">
            <Input label="名称" placeholder="例如：英语单词" value={newNbName} onChange={e => setNewNbName(e.target.value)} />
            <Textarea label="描述（可选）" placeholder="简短描述..." rows={2} value={newNbDesc} onChange={e => setNewNbDesc(e.target.value)} />
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <section className="mb-12">
        <div className="bg-surface-card rounded-xl p-7 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ProgressRing progress={dueStats.totalDue === 0 ? 100 : progress} size={120} strokeWidth={7}>
              <div className="text-center">
                <div className="text-3xl font-medium heading-serif text-ink">{dueStats.totalDue}</div>
                <div className="text-xs text-muted mt-0.5">待复习</div>
                <div className="text-[10px] text-muted-soft mt-0.5 leading-tight">
                  {dueStats.reviewCount > 0 && `${dueStats.reviewCount}张复习`}
                  {dueStats.reviewCount > 0 && dueStats.newCount > 0 && ' · '}
                  {dueStats.newCount > 0 && `${dueStats.newCount}张新卡`}
                </div>
              </div>
            </ProgressRing>
            <div className="flex-1 text-center md:text-left">
              <h2 className="heading-serif text-xl md:text-2xl text-ink mb-1.5">
                {dueStats.totalDue > 0
                  ? `今日有待复习 ${dueStats.reviewCount} 张 · 新卡 ${dueStats.newCount} 张`
                  : '今日任务已完成'}
              </h2>
              <p className="text-sm text-muted mb-5">
                {dueStats.totalDue > 0 ? '坚持每日复习，让知识成为习惯' : '休息一下吧，明天继续'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {dueStats.totalDue > 0 && (
                  <Button size="lg" onClick={() => { setIsReviewing(true); onReviewChange?.(true); }}>
                    <Play size={17} className="mr-1.5" /> 开始复习
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={() => { setNewNbName(''); setNewNbDesc(''); setShowNewNotebookModal(true); }}>
                  <Plus size={17} className="mr-1.5" /> 新建学习本
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { icon: Flame, value: streak, label: '连续打卡' },
          { icon: BookOpen, value: cards.length, label: '卡片总数' },
          { icon: Target, value: todayStats.reviewedToday, label: '今日已学' },
          { icon: GraduationCap, value: rank.title, label: '当前品阶', isRank: true },
        ].map((s, i) => (
          <div key={s.label} className={`bg-surface-card rounded-lg p-4 text-center ${i > 0 ? `enter enter-d${i}` : ''}`}>
            {s.isRank ? (
              <>
                <div className="w-9 h-9 rounded-lg bg-canvas flex items-center justify-center mx-auto mb-2">
                  <GraduationCap size={17} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="text-lg font-medium heading-serif text-ink">{s.value}</div>
                <div className="text-xs text-muted mb-1.5">{s.label}</div>
                {nextRank && (
                  <div className="h-1 bg-hairline rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${expProgress.progressPercent}%` }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-canvas flex items-center justify-center mx-auto mb-2">
                  <s.icon size={17} strokeWidth={1.5} className="text-muted" />
                </div>
                <div className="text-lg font-medium heading-serif text-ink">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </>
            )}
          </div>
        ))}
      </section>

      {dueNotebooks.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-ink mb-3">待复习学习本</h3>
          <div className="space-y-3">
            {dueNotebooks.map(nb => {
              const nbFolders = folders.filter(f => f.notebookId === nb.id);
              return (
                <div key={nb.id} className="bg-surface-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg" style={{ background: nb.color }} />
                      <div>
                        <div className="text-sm font-medium text-ink">{nb.name}</div>
                        <div className="text-xs text-muted">{nb.dueCount} 待复习</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted-soft" />
                  </div>
                  {nbFolders.length > 0 && (
                    <div className="ml-11 space-y-1 mt-1">
                      {nbFolders.map(f => {
                        const dueCount = cards.filter(c => c.folderId === f.id && c.nextReview <= Date.now()).length;
                        if (dueCount === 0) return null;
                        return (
                          <div key={f.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-canvas transition-colors cursor-pointer">
                            <div className="flex items-center gap-2">
                              <ChevronRight size={12} className="text-muted-soft" />
                              <span className="text-xs text-muted">{f.name}</span>
                            </div>
                            <span className="text-xs text-muted">{dueCount} 待复习</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal isOpen={showNewNotebookModal} onClose={() => setShowNewNotebookModal(false)} title="新建学习本"
        footer={<><Button variant="ghost" onClick={() => setShowNewNotebookModal(false)}>取消</Button><Button onClick={handleCreateNotebook}>创建</Button></>}>
        <div className="space-y-3.5">
          <Input label="名称" placeholder="例如：英语单词" value={newNbName} onChange={e => setNewNbName(e.target.value)} />
          <Textarea label="描述（可选）" placeholder="简短描述..." rows={2} value={newNbDesc} onChange={e => setNewNbDesc(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
