import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, RotateCcw, Zap, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { ConfirmModal } from '../ui/Modal';
import { useStore } from '../../stores/useStore';
import type { Card, Rating } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReviewCardProps {
  card: Card;
  onRate: (rating: Rating) => void;
  onExit: () => void;
  currentIndex: number;
  total: number;
}

const ratingLabel: Record<Rating, string> = { forgot: '生疏', hard: '一般', good: '简单' };
const ratingColor: Record<Rating, string> = { forgot: 'bg-danger', hard: 'bg-[#d4a017]', good: 'bg-success' };
const ratingBg: Record<Rating, string> = { forgot: 'bg-danger/15 text-danger', hard: 'bg-amber-50 text-[#d4a017] dark:bg-amber-900/20', good: 'bg-success/15 text-success' };

const ReviewCard: React.FC<ReviewCardProps> = ({ card, onRate, onExit, currentIndex, total }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const onRateRef = useRef(onRate);
  onRateRef.current = onRate;

  const { reviewLogs } = useStore();

  const cardHistory = useMemo(() => {
    return reviewLogs
      .filter(l => l.cardId === card.id)
      .sort((a, b) => b.reviewedAt - a.reviewedAt)
      .slice(0, 8);
  }, [reviewLogs, card.id]);

  const masteryTrend = useMemo(() => {
    if (cardHistory.length < 2) return null;
    const recent = cardHistory.slice(0, Math.min(3, cardHistory.length));
    const goodCount = recent.filter(r => r.rating === 'good').length;
    if (goodCount >= 2) return { text: '趋势向好', color: 'text-success' };
    const forgotCount = recent.filter(r => r.rating === 'forgot').length;
    if (forgotCount >= 2) return { text: '需要巩固', color: 'text-danger' };
    return { text: '趋于稳定', color: 'text-muted' };
  }, [cardHistory]);

  useEffect(() => { setShowAnswer(false); setShowHistory(false); }, [card.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (!showAnswer) setShowAnswer(true); }
      else if (showAnswer) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') onRateRef.current('forgot');
        else if (e.code === 'Digit2' || e.code === 'Numpad2') onRateRef.current('hard');
        else if (e.code === 'Digit3' || e.code === 'Numpad3') onRateRef.current('good');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, card.id]);

  const renderContent = (content: string, showAns = false) => {
    if (card.type === 'cloze') {
      return content.split(/(\{\{[^}]+\}\})/).map((part, i) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          const ans = part.slice(2, -2);
          return (
            <span key={i} className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-md text-base md:text-lg font-medium ${
              showAns
                ? 'bg-[#f5f0e8] text-ink border-b-2 border-primary animate-fade-in'
                : 'bg-transparent text-transparent border-b-2 border-dashed border-hairline min-w-[3em]'
            }`}>{showAns ? ans : '\u00A0'.repeat(Math.max(ans.length, 3))}</span>
          );
        }
        return <span key={i}>{part}</span>;
      });
    }
    return content;
  };

  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => { setShowExitConfirm(false); onExit(); }}
        title="退出复习"
        message={`已复习 ${currentIndex} 张卡片，进度将保留。确定退出吗？`}
        confirmText="退出"
        cancelText="继续复习"
      />

      <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
        <button onClick={() => setShowExitConfirm(true)} className="text-sm text-muted hover:text-ink transition-colors">退出复习</button>
        <span className="text-xs text-muted font-mono tabular-nums">{currentIndex + 1}/{total}</span>
      </div>

      <div className="h-[2px] bg-hairline">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* 3D 翻转区域 */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-xl" style={{ perspective: '1000px' }}>
          <motion.div
            animate={{ rotateY: showAnswer ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="grid grid-cols-[1fr]"
          >
            {/* 正面：问题 */}
            <div
              className="col-start-1 row-start-1"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="bg-surface-card rounded-xl p-8 md:p-10 min-h-[240px] flex items-center justify-center">
                <p className="text-xl md:text-2xl text-ink leading-relaxed text-center font-[450]">
                  {renderContent(card.front)}
                </p>
              </div>
              <div className="flex justify-center mt-6">
                <Button size="lg" onClick={() => setShowAnswer(true)}>
                  <Eye size={18} className="mr-2" /> 显示答案 <span className="ml-3 text-xs opacity-60">空格键</span>
                </Button>
              </div>
            </div>

            {/* 背面：答案 */}
            <div
              className="col-start-1 row-start-1"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="bg-surface-soft rounded-lg p-3 mb-3 text-center">
                <p className="text-sm text-muted">{renderContent(card.front)}</p>
              </div>
              <div className="bg-surface-card rounded-xl p-8 md:p-10 min-h-[160px] flex items-center justify-center border-2 border-primary/30">
                <p className="text-xl md:text-2xl text-ink leading-relaxed text-center font-[450]">
                  {card.type === 'cloze' ? renderContent(card.front, true) : card.back}
                </p>
              </div>

              {cardHistory.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowHistory(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                  >
                    <Clock size={12} />
                    复习历史（{cardHistory.length}次）
                    {masteryTrend && (
                      <span className={`ml-1 font-medium ${masteryTrend.color}`}>{masteryTrend.text}</span>
                    )}
                  </button>
                  {showHistory && (
                    <div className="mt-2 p-3 rounded-lg bg-surface-soft border border-hairline">
                      <div className="flex flex-wrap gap-1.5">
                        {[...cardHistory].reverse().map((log) => (
                          <span
                            key={log.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${ratingBg[log.rating]}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${ratingColor[log.rating]}`} />
                            {ratingLabel[log.rating]}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-soft mt-1.5">
                        最近一次：{formatDistanceToNow(cardHistory[0].reviewedAt, { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 卡片元信息 */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-soft">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-soft border border-hairline">
                  EF {card.easeFactor.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-soft border border-hairline">
                  已复习 {card.reviewCount} 次
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-soft border border-hairline">
                  间隔 {card.interval >= 86400000
                    ? `${Math.round(card.interval / 86400000)} 天`
                    : card.interval >= 3600000
                      ? `${Math.round(card.interval / 3600000)} 小时`
                      : `${Math.round(card.interval / 60000)} 分钟`}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-soft border border-hairline">
                  下次 {formatDistanceToNow(card.nextReview, { addSuffix: true, locale: zhCN })}
                </span>
              </div>

              <div className="flex justify-center gap-3 mt-5">
                <Button variant="danger" onClick={() => onRate('forgot')}>
                  <RotateCcw size={16} className="mr-1.5" /> 生疏 <span className="ml-2 text-xs opacity-60">1</span>
                </Button>
                <button onClick={() => onRate('hard')}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium transition-all bg-[#d4a017] text-white hover:bg-[#b8890f] btn-press">
                  <Zap size={16} className="mr-1.5" /> 一般 <span className="ml-2 text-xs opacity-60">2</span>
                </button>
                <button onClick={() => onRate('good')}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium transition-all bg-[#5db872] text-white hover:bg-[#4da362] btn-press">
                  <Zap size={16} className="mr-1.5" /> 简单 <span className="ml-2 text-xs opacity-60">3</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
