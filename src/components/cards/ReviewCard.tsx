import React, { useEffect, useState, useRef } from 'react';
import { Eye, RotateCcw, Zap } from 'lucide-react';
import Button from '../ui/Button';
import type { Card, Rating } from '../../types';

interface ReviewCardProps {
  card: Card;
  onRate: (rating: Rating) => void;
  onExit: () => void;
  currentIndex: number;
  total: number;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ card, onRate, onExit, currentIndex, total }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  // 使用 ref 存储最新的 onRate，避免 useEffect 反复绑定/解绑事件
  const onRateRef = useRef(onRate);
  onRateRef.current = onRate;

  useEffect(() => { setShowAnswer(false); }, [card.id]);

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
  }, [showAnswer, card.id]); // 不再依赖 onRate

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
      <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
        <button onClick={onExit} className="text-sm text-muted hover:text-ink transition-colors">退出复习</button>
        <span className="text-xs text-muted font-mono tabular-nums">{currentIndex + 1}/{total}</span>
      </div>

      <div className="h-[2px] bg-hairline">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        {!showAnswer ? (
          <div key="q" className="w-full max-w-xl enter">
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
        ) : (
          <div key="a" className="w-full max-w-xl enter">
            <div className="bg-surface-soft rounded-lg p-3 mb-3 text-center">
              <p className="text-sm text-muted">{renderContent(card.front)}</p>
            </div>
            <div className="bg-surface-card rounded-xl p-8 md:p-10 min-h-[160px] flex items-center justify-center border-2 border-primary/30">
              <p className="text-xl md:text-2xl text-ink leading-relaxed text-center font-[450]">
                {card.type === 'cloze' ? renderContent(card.front, true) : card.back}
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-6 enter enter-d1">
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
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
