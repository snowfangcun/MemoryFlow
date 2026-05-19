import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { GitBranch, HelpCircle, PenLine, ExternalLink, Link as LinkIcon, RotateCcw, Clock, X, Search, Filter } from 'lucide-react';
import ForceGraph from '../components/ui/ForceGraph';
import { useStore } from '../stores/useStore';
import type { Card } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const KnowledgeGraphPage: React.FC = () => {
  const { cards, cardLinks, notebooks, getBacklinks, getForwardLinks } = useStore();
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerReady, setDrawerReady] = useState(false);

  const filteredCards = useMemo(() => {
    let result = selectedNotebookId ? cards.filter(c => c.notebookId === selectedNotebookId) : cards;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q));
    }
    return result;
  }, [cards, selectedNotebookId, searchQuery]);

  const handleCardClick = useCallback((card: Card | null) => {
    setDrawerReady(false);
    setSelectedCard(card);
  }, []);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCard(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (selectedCard) {
      document.body.style.overflow = 'hidden';
      drawerRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCard]);

  const stripWikilinks = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  const renderCardDetail = (card: Card) => {
    const fwd = getForwardLinks(card.id);
    const bwd = getBacklinks(card.id);
    const isDue = card.nextReview <= Date.now();
    const notebook = notebooks.find(n => n.id === card.notebookId);

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-surface-soft flex items-center justify-center">
              {card.type === 'cloze' ? <PenLine size={15} className="text-muted" /> : <HelpCircle size={15} className="text-muted" />}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink truncate">{stripWikilinks(card.type === 'cloze' ? card.front.replace(/\{\{([^}]+)\}\}/g, '____') : card.front)}</h3>
              {notebook && <p className="text-[11px] text-muted">{notebook.name}</p>}
            </div>
          </div>
          <button onClick={() => setSelectedCard(null)} className="shrink-0 p-1 rounded-lg hover:bg-surface-soft transition-colors">
            <X size={16} className="text-muted" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-soft text-muted-soft">
            {card.type === 'cloze' ? <PenLine size={11} /> : <HelpCircle size={11} />}
            {card.type === 'cloze' ? '填空卡' : '问答卡'}
          </span>
          {isDue && <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/15 text-primary">待复习</span>}
        </div>

        <div className="bg-canvas rounded-lg p-3">
          <p className="text-xs text-muted mb-1">{card.type === 'cloze' ? '内容' : '问题'}</p>
          <p className="text-sm text-body whitespace-pre-wrap break-words">
            {card.type === 'cloze'
              ? card.front.replace(/\{\{([^}]+)\}\}/g, '____')
              : stripWikilinks(card.front)
            }
          </p>
        </div>

        <div className="bg-canvas rounded-lg p-3">
          <p className="text-xs text-muted mb-1">{card.type === 'cloze' ? '填空答案' : '答案'}</p>
          <p className="text-sm text-body whitespace-pre-wrap break-words">
            {card.type === 'cloze'
              ? Array.from(card.front.matchAll(/\{\{([^}]+)\}\}/g), m => m[1]).join(' | ')
              : stripWikilinks(card.back)
            }
          </p>
        </div>

        {(fwd.length > 0 || bwd.length > 0) && (
          <div>
            <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1">
              <LinkIcon size={12} /> 关联卡片 ({fwd.length + bwd.length})
            </p>
            {fwd.length > 0 && (
              <div className="mb-2">
                <p className="text-[11px] text-muted mb-1">链出 →</p>
                <div className="flex flex-wrap gap-1.5">
                  {fwd.map(link => {
                    const target = cards.find(c => c.id === link.targetId);
                    return (
                      <button key={link.id} type="button" onClick={() => target && handleCardClick(target)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-surface-soft text-muted hover:text-ink hover:bg-surface-card transition-colors">
                        <ExternalLink size={10} />{target ? stripWikilinks(target.front.slice(0, 18)) : link.targetName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {bwd.length > 0 && (
              <div>
                <p className="text-[11px] text-muted mb-1">被引用 ←</p>
                <div className="flex flex-wrap gap-1.5">
                  {bwd.map(link => {
                    const source = cards.find(c => c.id === link.sourceId);
                    return (
                      <button key={link.id} type="button" onClick={() => source && handleCardClick(source)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-surface-soft text-primary hover:text-ink transition-colors">
                        {source ? stripWikilinks(source.front.slice(0, 18)) : '未知'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-hairline">
          <span className="flex items-center gap-1 text-xs text-muted-soft">
            <RotateCcw size={12} /> {card.reviewCount} 次复习
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-soft">
            <Clock size={12} /> {isDue ? '现在' : formatDistanceToNow(card.nextReview, { addSuffix: true, locale: zhCN })}
          </span>
        </div>
      </div>
    );
  };

  const connectedCount = new Set(cardLinks.flatMap(l => [l.sourceId, l.targetId])).size;
  const isolatedCount = cards.length - connectedCount;

  return (
    <div className="h-[calc(100vh-3.5rem-3.5rem)] md:h-[calc(100vh-3.5rem)] flex flex-col">
      {/* 顶栏 */}
      <div className="shrink-0 px-5 py-4 border-b border-hairline">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <GitBranch size={20} className="text-primary" />
              <h2 className="heading-serif text-lg text-ink">知识图谱</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>{cards.length} 张卡片</span>
              <span>{cardLinks.length} 条关联</span>
              <span className="hidden sm:inline">{isolatedCount} 个孤立节点</span>
            </div>
          </div>

          {/* 过滤栏 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-soft" />
              <input type="text" placeholder="搜索卡片..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-soft text-ink text-xs border border-hairline placeholder:text-muted-soft focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              <button onClick={() => setSelectedNotebookId(null)}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedNotebookId ? 'bg-primary text-white' : 'bg-surface-soft text-muted hover:text-ink'}`}>
                <Filter size={12} className="inline mr-1" />全部
              </button>
              {notebooks.map(nb => (
                <button key={nb.id} onClick={() => setSelectedNotebookId(nb.id === selectedNotebookId ? null : nb.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedNotebookId === nb.id ? 'bg-primary text-white' : 'bg-surface-soft text-muted hover:text-ink'}`}>
                  {nb.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 min-h-0 px-5 py-4">
        <div className="max-w-5xl mx-auto h-full flex gap-4">
          {/* 图谱 */}
          <div className={`flex-1 min-w-0 ${selectedCard ? 'hidden md:block' : ''}`}>
            <div className="h-full rounded-xl border border-hairline overflow-hidden bg-surface-soft/30">
              <ForceGraph
                cards={filteredCards}
                cardLinks={cardLinks}
                notebooks={notebooks}
                selectedNotebookId={selectedNotebookId}
                onCardClick={handleCardClick}
                highlightCardId={selectedCard?.id || null}
              />
            </div>
          </div>

          {/* 详情面板（桌面） */}
          {selectedCard && (
            <motion.div
              className="hidden md:block w-80 shrink-0 overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-surface-card rounded-xl p-4 border border-hairline relative">
                <button onClick={() => setSelectedCard(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-surface-soft transition-colors z-10">
                  <X size={16} className="text-muted" />
                </button>
                {renderCardDetail(selectedCard)}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 详情面板（移动端 - Portal） */}
      {selectedCard && createPortal(
        <>
          <motion.div
            className="md:hidden fixed inset-0 z-[70] bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedCard(null)}
          />
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            className="md:hidden fixed inset-x-0 bottom-0 z-[70] bg-surface-card rounded-t-2xl border-t border-hairline shadow-xl max-h-[70vh] overflow-y-auto outline-none"
            style={{ minHeight: 200, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            drag={drawerReady ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) setSelectedCard(null);
            }}
            onAnimationComplete={() => setDrawerReady(true)}
          >
            <div className="p-4">
              <div className="w-8 h-1 rounded-full bg-hairline mx-auto mb-3" />
              {renderCardDetail(selectedCard)}
            </div>
          </motion.div>
        </>,
        document.body
      )}
    </div>
  );
};

export default KnowledgeGraphPage;