import React from 'react';
import { HelpCircle, PenLine, RotateCcw, Clock, Link, Tag } from 'lucide-react';
import type { Card, CardLink } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CardPreviewProps {
  card: Card;
  backlinks: CardLink[];
  forwardLinks: CardLink[];
  onClick?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const stripWikilinks = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, '$1');

const CardPreview: React.FC<CardPreviewProps> = ({ card, backlinks, forwardLinks, onClick, onEdit, onDelete }) => {
  const isDue = card.nextReview <= Date.now();
  const linkCount = forwardLinks.length;
  const backlinkCount = backlinks.length;

  return (
    <div onClick={onClick} className={`relative bg-surface-card rounded-xl group border border-transparent hover:border-hairline transition-all${onClick ? ' cursor-pointer' : ''}`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-soft text-muted-soft">
              {card.type === 'cloze' ? <PenLine size={11} /> : <HelpCircle size={11} />}
              {card.type === 'cloze' ? '填空' : '问答'}
            </span>
            {isDue && <span className="text-[11px] font-medium text-primary">待复习</span>}
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="text-xs text-muted-soft hover:text-ink transition-colors">编辑</button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="text-xs text-muted-soft hover:text-danger transition-colors">删除</button>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-body leading-relaxed line-clamp-2 mb-2">
          {card.type === 'cloze' ? stripWikilinks(card.front.replace(/\{\{([^}]+)\}\}/g, '____')) : stripWikilinks(card.front)}
        </p>
        <p className="text-xs text-muted-soft line-clamp-1 mb-3">
          {card.type === 'cloze'
            ? `${card.front.match(/\{\{([^}]+)\}\}/g)?.length || 0} 处填空`
            : stripWikilinks(card.back.length > 50 ? card.back.slice(0, 50) + '...' : card.back)
          }
        </p>

        {/* Tags & Links row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {card.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-soft text-muted">
              <Tag size={9} />{tag}
            </span>
          ))}
          {linkCount > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-soft text-primary">
              <Link size={9} />{linkCount}
            </span>
          )}
          {backlinkCount > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-soft text-primary">
              被引用 {backlinkCount}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-3 border-t border-hairline/60">
          <span className="flex items-center gap-1 text-[11px] text-muted-soft"><RotateCcw size={11} />{card.reviewCount} 次</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-soft"><Clock size={11} />
            {isDue ? '现在' : formatDistanceToNow(card.nextReview, { addSuffix: true, locale: zhCN })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
