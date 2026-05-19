import React from 'react';
import { Trash2, Edit2, RotateCcw, Book } from 'lucide-react';
import type { Notebook } from '../../types';

interface NotebookCardProps {
  notebook: Notebook;
  cardCount: number;
  masteredCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const NotebookCard: React.FC<NotebookCardProps> = ({
  notebook, cardCount, masteredCount, onClick, onEdit, onDelete,
}) => {
  const progress = cardCount > 0 ? Math.round((masteredCount / cardCount) * 100) : 0;
  const accentColor = notebook.color.match(/#([0-9a-fA-F]{3}){1,2}\b/)?.[0] || '#cc785c';

  return (
    <div
      className="relative bg-white rounded-xl cursor-pointer group border border-[#e8e0d2] hover:border-[#d4c9b8] transition-colors"
      onClick={onClick}
    >
      <div className="p-5">
        {/* 顶部：图标 + 名称 + 操作 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accentColor + '15' }}
            >
              <Book size={18} style={{ color: accentColor }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-[#1c1a18] truncate">{notebook.name}</h3>
              {notebook.description && (
                <p className="text-[13px] text-[#8e8b82] truncate mt-0.5">{notebook.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg hover:bg-[#f5f0e8] transition-colors">
              <Edit2 size={14} className="text-[#8e8b82]" />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg hover:bg-[#f5f0e8] transition-colors">
              <Trash2 size={14} className="text-[#8e8b82]" />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[15px] text-[#1c1a18]">{cardCount}</span>
            <span className="text-[13px] text-[#8e8b82]">张卡片</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[15px] text-[#1c1a18]">{masteredCount}</span>
            <span className="text-[13px] text-[#8e8b82]">已掌握</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#f5f0e8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundColor: accentColor }}
            />
          </div>
          <span className="text-xs font-medium text-[#8e8b82] tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default NotebookCard;
