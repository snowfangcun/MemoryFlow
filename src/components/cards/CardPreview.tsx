import React from 'react';
import { HelpCircle, PenLine, RotateCcw, Clock, ChevronRight } from 'lucide-react';
import type { Card } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CardPreviewProps {
  card: Card;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CardPreview: React.FC<CardPreviewProps> = ({ card, onClick, onEdit, onDelete }) => {
  const isDue = card.nextReview <= Date.now();

  return (
    <div
      className="relative bg-white rounded-xl cursor-pointer group border border-[#e8e0d2] hover:border-[#d4c9b8] transition-all"
      onClick={onClick}
    >
      {/* 左侧色条 */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${isDue ? 'bg-[#cc785c]' : 'bg-[#e8e0d2]'}`} />

      <div className="pl-4 pr-4 py-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
              card.type === 'cloze'
                ? 'bg-[#f5f0e8] text-[#8e8b82]'
                : 'bg-[#f5f0e8] text-[#8e8b82]'
            }`}>
              {card.type === 'cloze' ? <PenLine size={11} /> : <HelpCircle size={11} />}
              {card.type === 'cloze' ? '填空' : '问答'}
            </span>
            {isDue && (
              <span className="text-[11px] font-medium text-[#cc785c]">待复习</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="px-2 py-1 rounded-md text-xs text-[#8e8b82] hover:text-[#1c1a18] hover:bg-[#f5f0e8] transition-colors">编辑</button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="px-2 py-1 rounded-md text-xs text-[#8e8b82] hover:text-red-500 hover:bg-[#f5f0e8] transition-colors">删除</button>
          </div>
        </div>

        {/* Question / Content */}
        <p className="text-sm text-[#1c1a18] leading-relaxed line-clamp-2 mb-2">
          {card.type === 'cloze' ? card.front.replace(/\{\{([^}]+)\}\}/g, '____') : card.front}
        </p>

        {/* Answer preview */}
        <p className="text-xs text-[#8e8b82] line-clamp-1 mb-4">
          {card.type === 'cloze'
            ? `共 ${card.front.match(/\{\{([^}]+)\}\}/g)?.length || 0} 处填空`
            : card.back.length > 50 ? card.back.slice(0, 50) + '...' : card.back
          }
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#f0ebe3]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-[#a8a59e]">
              <RotateCcw size={11} />
              {card.reviewCount} 次
            </span>
            <span className="flex items-center gap-1 text-xs text-[#a8a59e]">
              <Clock size={11} />
              {isDue ? '待复习' : formatDistanceToNow(card.nextReview, { addSuffix: true, locale: zhCN })}
            </span>
          </div>
          <ChevronRight size={14} className="text-[#d4c9b8] group-hover:text-[#8e8b82] transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
