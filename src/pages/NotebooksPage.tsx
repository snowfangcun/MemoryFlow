import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, ArrowLeft, HelpCircle, PenLine, Tag, X, ExternalLink, FolderPlus, ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, MoreHorizontal, Pencil, Trash2, Clock, RotateCcw, Link } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import NotebookCard from '../components/cards/NotebookCard';
import EmptyState from '../components/ui/EmptyState';
import { useStore } from '../stores/useStore';
import { useToastStore } from '../stores/useToastStore';
import type { Notebook, Card, Folder } from '../types';
import { MASTERED_INTERVAL_MS } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type SortOption = 'created' | 'reviews' | 'name';

/** 单个文件夹行 */
const FolderRow: React.FC<{
  folder: Folder;
  depth: number;
  expanded: boolean;
  childCount: number;
  cardCount: number;
  dueCount: number;
  onToggle: () => void;
  onAddCard: () => void;
  onAddSub: () => void;
  onDelete: () => void;
}> = ({ folder, depth, expanded, childCount, cardCount, dueCount, onToggle, onAddCard, onAddSub, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-surface-card`}
      style={{ paddingLeft: `${12 + depth * 20}px` }}
    >
      {/* 展开箭头 */}
      {(childCount > 0 || cardCount > 0) ? (
        <button onClick={onToggle} className="shrink-0 p-0.5 rounded hover:bg-surface-soft transition-colors">
          {expanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
        </button>
      ) : (
        <span className="w-5 shrink-0" />
      )}

      {/* 图标 + 名称 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FolderIcon size={16} className="text-muted shrink-0" />
        <span className="text-sm font-medium text-ink truncate">{folder.name}</span>
      </div>

      {/* 数量标签 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {dueCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/15 text-primary">
            {dueCount} 待复习
          </span>
        )}
        <span className="text-[11px] text-muted tabular-nums">{cardCount} 张</span>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* 新建卡片（hover 直接可见） */}
        <button
          onClick={e => { e.stopPropagation(); onAddCard(); }}
          className="p-1 rounded-md text-muted-soft hover:text-ink hover:bg-surface-soft transition-colors opacity-0 group-hover:opacity-100"
          title="新建卡片"
        >
          <Plus size={13} />
        </button>
        {/* 新建子文件夹（hover 直接可见） */}
        <button
          onClick={e => { e.stopPropagation(); onAddSub(); }}
          className="p-1 rounded-md text-muted-soft hover:text-ink hover:bg-surface-soft transition-colors opacity-0 group-hover:opacity-100"
          title="新建子文件夹"
        >
          <FolderPlus size={13} />
        </button>
        {/* 更多操作菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-md text-muted-soft hover:text-muted hover:bg-surface-soft transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={14} />
          </button>
          {showActions && (
            <div className="absolute right-0 top-7 z-20 bg-surface-card rounded-xl border hairline shadow-lg py-1 min-w-[100px]">
              <button onClick={() => { onDelete(); setShowActions(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-surface-soft transition-colors">
                <Trash2 size={13} /> 删除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** 单张卡片行（树叶子节点） */
const CardRow: React.FC<{
  card: Card;
  depth: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ card, depth, onClick, onEdit, onDelete }) => {
  const isDue = card.nextReview <= Date.now();
  const stripWikilinks = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, '$1');
  const frontText = stripWikilinks(
    card.type === 'cloze'
      ? card.front.replace(/\{\{([^}]+)\}\}/g, '____')
      : card.front
  );

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-surface-card"
      style={{ paddingLeft: `${32 + depth * 20}px` }}
    >
      {/* 类型图标 */}
      <span className="shrink-0 w-5 flex justify-center">
        {card.type === 'cloze' ? (
          <PenLine size={13} className="text-muted" />
        ) : (
          <HelpCircle size={13} className="text-muted" />
        )}
      </span>

      {/* 卡片内容预览 */}
      <span className="flex-1 min-w-0 text-sm text-body truncate">
        {frontText}
      </span>

      {/* 待复习标识 */}
      {isDue && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="待复习" />
      )}

      {/* 链接数量 */}
      {card.tags && card.tags.length > 0 && (
        <span className="text-[10px] text-muted-soft shrink-0 hidden sm:inline">
          {card.tags.slice(0, 1).join(', ')}
        </span>
      )}

      {/* 编辑按钮 */}
      <button
        onClick={e => { e.stopPropagation(); onEdit(); }}
        className="shrink-0 p-1 rounded-md text-muted-soft hover:text-ink hover:bg-surface-soft transition-colors opacity-0 group-hover:opacity-100"
        title="编辑"
      >
        <Pencil size={12} />
      </button>

      {/* 删除按钮 */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="shrink-0 p-1 rounded-md text-muted-soft hover:text-danger hover:bg-surface-soft transition-colors opacity-0 group-hover:opacity-100"
        title="删除"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

const NotebooksPage: React.FC = () => {
  const { notebooks, folders, cards, cardLinks, addNotebook, updateNotebook, deleteNotebook,
    addFolder, deleteFolder, addCard, updateCard, deleteCard, getBacklinks, getForwardLinks, getAllTags } = useStore();
  const addToast = useToastStore(s => s.addToast);

  // 基础状态
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showEditNotebookModal, setShowEditNotebookModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'notebook' | 'card' | 'folder'; id: string } | null>(null);
  const [cardType, setCardType] = useState<'question' | 'cloze'>('question');
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formFolderId, setFormFolderId] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [notebookName, setNotebookName] = useState('');
  const [notebookDesc, setNotebookDesc] = useState('');
  const [editNotebookName, setEditNotebookName] = useState('');
  const [editNotebookDesc, setEditNotebookDesc] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [searchQuery, setSearchQuery] = useState('');

  // 文件夹
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedRoot, setExpandedRoot] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderParentId, setFolderParentId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');

  // 预览卡片
  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  const allTags = useMemo(() => getAllTags(), [cards, getAllTags]);
  const notebookFolders = useMemo(() => selectedNotebook ? folders.filter(f => f.notebookId === selectedNotebook.id) : [], [folders, selectedNotebook]);
  const rootFolders = useMemo(() => notebookFolders.filter(f => !f.parentFolderId), [notebookFolders]);

  // 获取子文件夹
  const getChildFolders = (parentId: string) => notebookFolders.filter(f => f.parentFolderId === parentId);

  // 获取文件夹及其子文件夹的所有 ID
  const getDescendantFolderIds = useCallback((folderId: string): Set<string> => {
    const ids = new Set<string>([folderId]);
    getChildFolders(folderId).forEach(c => {
      getDescendantFolderIds(c.id).forEach(id => ids.add(id));
    });
    return ids;
  }, [notebookFolders]);

  // 文件夹下的卡片数
  const getFolderCardCount = useCallback((folderId: string): number => {
    const ids = getDescendantFolderIds(folderId);
    return cards.filter(c => c.folderId && ids.has(c.folderId)).length;
  }, [cards, getDescendantFolderIds]);

  // 文件夹下的待复习数
  const getFolderDueCount = useCallback((folderId: string): number => {
    const ids = getDescendantFolderIds(folderId);
    return cards.filter(c => c.folderId && ids.has(c.folderId) && c.nextReview <= Date.now()).length;
  }, [cards, getDescendantFolderIds]);

  // 文件夹的直接子卡片（不递归）
  const getFolderDirectCards = useCallback((folderId: string) => {
    let result = cards.filter(c => c.notebookId === selectedNotebook?.id && c.folderId === folderId);
    if (searchQuery) result = result.filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterTag) result = result.filter(c => c.tags?.includes(filterTag));
    result.sort((a, b) => sortBy === 'reviews' ? b.reviewCount - a.reviewCount : sortBy === 'name' ? a.front.localeCompare(b.front) : b.createdAt - a.createdAt);
    return result;
  }, [cards, selectedNotebook, searchQuery, filterTag, sortBy]);

  // 未分类卡片
  const uncategorizedCards = useMemo(() => {
    if (!selectedNotebook) return [];
    let result = cards.filter(c => c.notebookId === selectedNotebook.id && !c.folderId);
    if (searchQuery) result = result.filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterTag) result = result.filter(c => c.tags?.includes(filterTag));
    result.sort((a, b) => sortBy === 'reviews' ? b.reviewCount - a.reviewCount : sortBy === 'name' ? a.front.localeCompare(b.front) : b.createdAt - a.createdAt);
    return result;
  }, [cards, selectedNotebook, searchQuery, filterTag, sortBy]);

  // 文件夹展开/收起
  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCardForm = (card?: Card) => {
    setEditingCard(card ?? null);
    setCardType(card?.type ?? 'question');
    setFormFront(card?.front ?? '');
    setFormBack(card?.back ?? '');
    setFormTags(card?.tags ?? []);
    setFormFolderId(card?.folderId || undefined);
    setShowCardModal(true);
  };

  const addTag = () => { const t = tagInput.trim(); if (t && !formTags.includes(t)) setFormTags(p => [...p, t]); setTagInput(''); };
  const removeTag = (tag: string) => setFormTags(p => p.filter(t => t !== tag));

  const handleCreateNotebook = () => {
    if (notebookName.trim()) {
      addNotebook(notebookName.trim(), notebookDesc.trim() || undefined);
      addToast('学习本已创建', 'success');
      setNotebookName(''); setNotebookDesc(''); setShowNotebookModal(false);
    }
  };
  const handleEditNotebook = () => {
    if (selectedNotebook && editNotebookName.trim()) {
      updateNotebook(selectedNotebook.id, { name: editNotebookName.trim(), description: editNotebookDesc.trim() || undefined });
      addToast('学习本已更新', 'success'); setShowEditNotebookModal(false);
    }
  };
  const openEditNotebookModal = () => {
    if (selectedNotebook) { setEditNotebookName(selectedNotebook.name); setEditNotebookDesc(selectedNotebook.description || ''); setShowEditNotebookModal(true); }
  };

  const handleCreateFolder = () => {
    if (folderName.trim() && selectedNotebook) {
      addFolder(selectedNotebook.id, folderName.trim(), folderParentId);
      addToast('文件夹已创建', 'success');
      setFolderName(''); setShowFolderModal(false);
      if (folderParentId) {
        setExpandedFolders(prev => new Set(prev).add(folderParentId));
      }
    }
  };

  const handleCreateCard = () => {
    if (formFront.trim() && selectedNotebook) {
      if (cardType === 'cloze') {
        const answers = Array.from(formFront.matchAll(/\{\{([^}]+)\}\}/g), m => m[1]);
        const back = answers.join(' | ');
        editingCard ? updateCard(editingCard.id, { front: formFront.trim(), back, tags: formTags, folderId: formFolderId }) : addCard(selectedNotebook.id, cardType, formFront.trim(), back, formTags, formFolderId);
      } else {
        editingCard ? updateCard(editingCard.id, { front: formFront.trim(), back: formBack.trim(), tags: formTags, folderId: formFolderId }) : addCard(selectedNotebook.id, cardType, formFront.trim(), formBack.trim(), formTags, formFolderId);
      }
      addToast(editingCard ? '卡片已更新' : '卡片已创建', 'success');
      setFormFront(''); setFormBack(''); setFormTags([]); setFormFolderId(undefined);
      setShowCardModal(false); setEditingCard(null);
    }
  };

  const navigateToCard = useCallback((targetCard: Card) => {
    setShowCardModal(false); setPreviewCard(null);
    if (targetCard.notebookId !== selectedNotebook?.id) {
      const nb = notebooks.find(n => n.id === targetCard.notebookId);
      if (nb) setSelectedNotebook(nb);
    }
    setSearchQuery(targetCard.front.slice(0, 12));
  }, [selectedNotebook, notebooks]);

  const handleDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === 'notebook') {
        deleteNotebook(deleteConfirm.id);
        setSelectedNotebook(null);
      } else if (deleteConfirm.type === 'folder') {
        deleteFolder(deleteConfirm.id);
      } else {
        deleteCard(deleteConfirm.id);
      }
      addToast(deleteConfirm.type === 'notebook' ? '学习本已删除' : deleteConfirm.type === 'folder' ? '文件夹已删除' : '卡片已删除', 'info');
      setDeleteConfirm(null);
    }
  };

  // 渲染嵌套文件夹树（含卡片叶子节点）
  const renderFolderTree = (parentFolders: Folder[], depth: number) => {
    return parentFolders.map(folder => {
      const children = getChildFolders(folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      const cardCount = getFolderCardCount(folder.id);
      const dueCount = getFolderDueCount(folder.id);
      const directCards = getFolderDirectCards(folder.id);

      return (
        <React.Fragment key={folder.id}>
          <FolderRow
            folder={folder}
            depth={depth}
            expanded={isExpanded}
            childCount={children.length}
            cardCount={cardCount}
            dueCount={dueCount}
            onToggle={() => toggleFolder(folder.id)}
            onAddCard={() => { setEditingCard(null); setCardType('question'); setFormFront(''); setFormBack(''); setFormTags([]); setFormFolderId(folder.id); setShowCardModal(true); }}
            onAddSub={() => { setFolderParentId(folder.id); setFolderName(''); setShowFolderModal(true); }}
            onDelete={() => setDeleteConfirm({ type: 'folder', id: folder.id })}
          />
          {isExpanded && (
            <>
              {/* 直接卡片 */}
              {directCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  depth={depth + 1}
                  onClick={() => setPreviewCard(card)}
                  onEdit={() => openCardForm(card)}
                  onDelete={() => setDeleteConfirm({ type: 'card', id: card.id })}
                />
              ))}
              {/* 子文件夹 */}
              {children.length > 0 && renderFolderTree(children, depth + 1)}
            </>
          )}
        </React.Fragment>
      );
    });
  };

  const isNotebookListView = !selectedNotebook;

  // 预览卡片详情
  const renderPreview = (card: Card) => {
    const stripWikilinks = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, '$1');
    const fwd = getForwardLinks(card.id);
    const bwd = getBacklinks(card.id);
    const isDue = card.nextReview <= Date.now();
    const folderName = notebookFolders.find(f => f.id === card.folderId)?.name;
    const answers = card.type === 'cloze'
      ? Array.from(card.front.matchAll(/\{\{([^}]+)\}\}/g), m => m[1])
      : null;

    return (
      <div className="space-y-5">
        {/* 卡片类型 */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-soft text-muted-soft">
            {card.type === 'cloze' ? <PenLine size={12} /> : <HelpCircle size={12} />}
            {card.type === 'cloze' ? '填空卡' : '问答卡'}
          </span>
          {folderName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-soft text-muted-soft">
              <FolderIcon size={11} />{folderName}
            </span>
          )}
          {isDue && <span className="text-[11px] font-medium text-primary">待复习</span>}
        </div>

        {/* 正面 / 问题 */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">{card.type === 'cloze' ? '内容' : '问题'}</label>
          <div className="text-sm text-body bg-canvas rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-words">
            {card.type === 'cloze'
              ? card.front.replace(/\{\{([^}]+)\}\}/g, '____')
              : stripWikilinks(card.front)
            }
          </div>
        </div>

        {/* 反面 / 答案 */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">{card.type === 'cloze' ? '填空答案' : '答案'}</label>
          <div className="text-sm text-body bg-canvas rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-words">
            {card.type === 'cloze' && answers
              ? answers.join(' | ')
              : stripWikilinks(card.back)
            }
          </div>
        </div>

        {/* 标签 */}
        {card.tags && card.tags.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1"><Tag size={11} /> 标签</label>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-medium bg-surface-soft text-muted">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* 关联卡片 */}
        {(fwd.length > 0 || bwd.length > 0) && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5"><Link size={11} className="inline mr-1" />关联卡片</label>
            {fwd.length > 0 && (
              <div className="mb-1">
                <p className="text-[11px] text-muted mb-1">链出 →</p>
                <div className="flex flex-wrap gap-1.5">
                  {fwd.map(link => {
                    const target = cards.find(c => c.id === link.targetId);
                    return (
                      <button key={link.id} type="button" onClick={() => target && navigateToCard(target)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-surface-soft text-muted hover:text-ink transition-colors">
                        <ExternalLink size={10} />{target ? target.front.slice(0, 20) : link.targetName}
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
                      <button key={link.id} type="button" onClick={() => source && navigateToCard(source)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-surface-soft text-primary hover:text-ink transition-colors">
                        {source ? source.front.slice(0, 20) : '未知卡片'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 复习统计 */}
        <div className="flex items-center gap-4 pt-3 border-t border-hairline">
          <span className="flex items-center gap-1 text-xs text-muted-soft">
            <RotateCcw size={12} />{card.reviewCount} 次复习
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-soft">
            <Clock size={12} />{isDue ? '现在' : formatDistanceToNow(card.nextReview, { addSuffix: true, locale: zhCN })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      {isNotebookListView ? (
        /* ════════ 学习本列表视图 ════════ */
        <>
          <div className="flex items-center justify-between mb-7">
            <h2 className="heading-serif text-xl text-ink">学习本</h2>
            <Button onClick={() => setShowNotebookModal(true)}><Plus size={16} className="mr-1.5" />新建学习本</Button>
          </div>
          {notebooks.length === 0 ? (
            <EmptyState icon="book" title="还没有学习本" description="创建一个学习本，开始你的记忆之旅"
              action={{ label: '创建学习本', onClick: () => { setNotebookName(''); setNotebookDesc(''); setShowNotebookModal(true); } }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notebooks.map(nb => {
                const nbCards = cards.filter(c => c.notebookId === nb.id);
                return (
                  <NotebookCard key={nb.id} notebook={nb} cardCount={nbCards.length}
                    masteredCount={nbCards.filter(c => c.interval >= MASTERED_INTERVAL_MS).length}
                    onClick={() => { setSelectedNotebook(nb); setExpandedFolders(new Set()); setExpandedRoot(false); setSearchQuery(''); setFilterTag(''); }}
                    onEdit={() => setSelectedNotebook(nb)}
                    onDelete={() => setDeleteConfirm({ type: 'notebook', id: nb.id })} />
                );
              })}
            </div>
          )}
          <Modal isOpen={showNotebookModal} onClose={() => setShowNotebookModal(false)} title="新建学习本"
            footer={<><Button variant="ghost" onClick={() => setShowNotebookModal(false)}>取消</Button><Button onClick={handleCreateNotebook}>创建</Button></>}>
            <div className="space-y-3.5">
              <Input label="名称" placeholder="例如：英语单词" value={notebookName} onChange={e => setNotebookName(e.target.value)} />
              <Textarea label="描述（可选）" placeholder="简短描述..." rows={2} value={notebookDesc} onChange={e => setNotebookDesc(e.target.value)} />
            </div>
          </Modal>
          <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
            title="确认删除" message={`确定删除这个${deleteConfirm?.type === 'notebook' ? '学习本' : deleteConfirm?.type === 'folder' ? '文件夹' : '卡片'}？此操作不可撤销。`} confirmText="删除" />
        </>
      ) : (
        /* ════════ 卡片树视图 ════════ */
        <>
          {/* 顶部导航 */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setSelectedNotebook(null)} className="p-1.5 rounded-lg hover:bg-surface-soft transition-colors">
              <ArrowLeft size={18} className="text-muted" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md" style={{ background: selectedNotebook.color }} />
                <h2 className="heading-serif text-lg text-ink truncate">{selectedNotebook.name}</h2>
                <button onClick={openEditNotebookModal} className="text-xs text-muted hover:text-ink ml-1 transition-colors">编辑</button>
              </div>
              {selectedNotebook.description && <p className="text-xs text-muted mt-0.5">{selectedNotebook.description}</p>}
            </div>
          </div>

          {/* 编辑学习本 Modal */}
          <Modal isOpen={showEditNotebookModal} onClose={() => setShowEditNotebookModal(false)} title="编辑学习本"
            footer={<><Button variant="ghost" onClick={() => setShowEditNotebookModal(false)}>取消</Button><Button onClick={handleEditNotebook}>保存</Button></>}>
            <div className="space-y-3.5"><Input label="名称" value={editNotebookName} onChange={e => setEditNotebookName(e.target.value)} />
              <Textarea label="描述" rows={2} value={editNotebookDesc} onChange={e => setEditNotebookDesc(e.target.value)} /></div>
          </Modal>

          {/* 新建文件夹 Modal */}
          <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} title={folderParentId ? '新建子文件夹' : '新建文件夹'}
            footer={<><Button variant="ghost" onClick={() => setShowFolderModal(false)}>取消</Button><Button onClick={handleCreateFolder}>创建</Button></>}>
            <Input label="名称" placeholder="例如：语法、时态" value={folderName} onChange={e => setFolderName(e.target.value)} />
            {folderParentId && (
              <p className="text-xs text-muted mt-2">
                将创建在「{notebookFolders.find(f => f.id === folderParentId)?.name}」下
              </p>
            )}
          </Modal>

          {/* 搜索 + 排序 + 标签 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft" />
              <input type="text" placeholder="搜索卡片..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-canvas text-ink text-sm border hairline placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15" />
            </div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {[{ k: 'created', l: '创建时间' }, { k: 'reviews', l: '复习次数' }, { k: 'name', l: '名称' }].map(o => (
                <button key={o.k} type="button" onClick={() => setSortBy(o.k as SortOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === o.k ? 'bg-surface-card text-ink' : 'text-muted hover:text-ink hover:bg-surface-soft'}`}>{o.l}</button>
              ))}
              {allTags.map(tag => (
                <button key={tag} type="button" onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTag === tag ? 'bg-primary text-white' : 'text-muted hover:text-ink bg-surface-soft'}`}>
                  <Tag size={11} />{tag}</button>
              ))}
              {filterTag && <button type="button" onClick={() => setFilterTag('')} className="text-xs text-muted hover:text-ink">清除</button>}
            </div>
          </div>

          {/* ═══ 卡片树：目录 + 卡片 ═══ */}
          <div className="space-y-0.5">
            {/* 根目录：未分类卡片（可展开） */}
            <div className="group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors hover:bg-surface-card">
              {uncategorizedCards.length > 0 ? (
                <button onClick={() => setExpandedRoot(!expandedRoot)} className="shrink-0 p-0.5 rounded hover:bg-surface-soft transition-colors">
                  {expandedRoot ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setExpandedRoot(!expandedRoot)}>
                {expandedRoot ? <FolderOpen size={16} className="text-muted shrink-0" /> : <FolderIcon size={16} className="text-muted shrink-0" />}
                <span className="text-sm font-medium text-ink">未分类卡片</span>
              </div>
              <span className="text-[11px] text-muted tabular-nums shrink-0">{uncategorizedCards.length} 张</span>
              <button
                onClick={() => { setEditingCard(null); setCardType('question'); setFormFront(''); setFormBack(''); setFormTags([]); setFormFolderId(undefined); setShowCardModal(true); }}
                className="shrink-0 p-1 rounded-md text-muted-soft hover:text-ink hover:bg-surface-soft transition-colors opacity-0 group-hover:opacity-100"
                title="新建卡片"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* 未分类卡片列表 */}
            {expandedRoot && uncategorizedCards.length > 0 && (
              <>
                {uncategorizedCards.map(card => (
                  <CardRow
                    key={card.id}
                    card={card}
                    depth={1}
                    onClick={() => setPreviewCard(card)}
                    onEdit={() => openCardForm(card)}
                    onDelete={() => setDeleteConfirm({ type: 'card', id: card.id })}
                  />
                ))}
              </>
            )}

            {/* 文件夹树（嵌套，含卡片） */}
            {renderFolderTree(rootFolders, 0)}

            {/* 新建根文件夹按钮 */}
            <button
              onClick={() => { setFolderParentId(null); setFolderName(''); setShowFolderModal(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              style={{ paddingLeft: '12px' }}
            >
              <Plus size={14} /> 新建文件夹
            </button>
          </div>
        </>
      )}

      {/* ═══ 卡片预览 Modal（只读） ═══ */}
      <Modal
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
        title={previewCard ? previewCard.front.slice(0, 30) : ''}
        footer={
          previewCard ? (
            <>
              <Button variant="ghost" onClick={() => { setPreviewCard(null); setDeleteConfirm({ type: 'card', id: previewCard.id }); }}>
                <Trash2 size={14} className="mr-1" />删除
              </Button>
              <Button onClick={() => { const c = previewCard; setPreviewCard(null); openCardForm(c); }}>
                <Pencil size={14} className="mr-1" />编辑
              </Button>
            </>
          ) : undefined
        }
      >
        {previewCard && renderPreview(previewCard)}
      </Modal>

      {/* ═══ 卡片编辑 Modal ═══ */}
      <Modal isOpen={showCardModal} onClose={() => { setShowCardModal(false); setEditingCard(null); }}
        title={editingCard ? '编辑卡片' : '新建卡片'}
        footer={<><Button variant="ghost" onClick={() => { setShowCardModal(false); setEditingCard(null); }}>取消</Button>
          <Button onClick={handleCreateCard}>{editingCard ? '保存' : '创建'}</Button></>}>
        <div className="space-y-3.5">
          <div>
            <label className="block text-sm font-medium text-body mb-1.5">卡片类型</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCardType('question')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${cardType === 'question' ? 'border-primary bg-surface-soft text-ink' : 'border-hairline text-muted hover:text-ink'}`}>
                <HelpCircle size={15} /> 问答卡
              </button>
              <button type="button" onClick={() => setCardType('cloze')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${cardType === 'cloze' ? 'border-primary bg-surface-soft text-ink' : 'border-hairline text-muted hover:text-ink'}`}>
                <PenLine size={15} /> 填空卡
              </button>
            </div>
          </div>
          {cardType === 'question' ? (
            <><Textarea label="问题" rows={2} value={formFront} onChange={e => setFormFront(e.target.value)} />
              <Textarea label="答案" rows={2} value={formBack} onChange={e => setFormBack(e.target.value)} /></>
          ) : (
            <Textarea label="内容" placeholder="使用 {{答案}} 标记填空，也支持 [[链接]] 关联其他卡片" rows={3} value={formFront} onChange={e => setFormFront(e.target.value)} />
          )}

          {/* 文件夹选择 */}
          <div>
            <label className="block text-sm font-medium text-body mb-1.5">📁 所属文件夹</label>
            <select value={formFolderId || ''} onChange={e => setFormFolderId(e.target.value || undefined)}
              className="w-full h-9 px-3 rounded-lg bg-canvas text-ink text-sm border hairline focus:outline-none focus:border-primary">
              <option value="">未分类</option>
              {notebookFolders.map(f => (
                <option key={f.id} value={f.id}>{f.parentFolderId ? `└ ${f.name}` : f.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-body mb-1.5 flex items-center gap-1.5"><Tag size={13} /> 标签</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-surface-soft text-muted">
                  {tag}<button type="button" onClick={() => removeTag(tag)} className="hover:text-ink"><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="输入标签按回车" value={tagInput}
                onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 h-8 px-2.5 rounded-md bg-canvas text-ink text-xs border hairline placeholder:text-muted-soft focus:outline-none focus:border-primary" />
              <button type="button" onClick={addTag} className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-soft text-muted hover:text-ink">添加</button>
            </div>
          </div>

          {/* 关联卡片 */}
          {editingCard && (() => {
            const fwd = getForwardLinks(editingCard.id); const bwd = getBacklinks(editingCard.id);
            if (fwd.length === 0 && bwd.length === 0) return null;
            return (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-body">关联卡片</label>
                {fwd.length > 0 && <div><p className="text-[11px] text-muted mb-1">链出 →</p>
                  <div className="flex flex-wrap gap-1.5">{fwd.map(link => {
                    const target = cards.find(c => c.id === link.targetId);
                    return <button key={link.id} type="button" onClick={() => target && navigateToCard(target)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-surface-soft text-muted hover:text-ink hover:bg-canvas transition-colors">
                      <ExternalLink size={10} />{target ? target.front.slice(0, 20) : link.targetName}</button>;
                  })}</div></div>}
                {bwd.length > 0 && <div><p className="text-[11px] text-muted mb-1">被引用 ←</p>
                  <div className="flex flex-wrap gap-1.5">{bwd.map(link => {
                    const source = cards.find(c => c.id === link.sourceId);
                    return <button key={link.id} type="button" onClick={() => source && navigateToCard(source)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-surface-soft text-primary hover:text-ink hover:bg-canvas transition-colors">
                      {source ? source.front.slice(0, 20) : '未知卡片'}</button>;
                  })}</div></div>}
              </div>
            );
          })()}
          <div className="text-xs text-muted bg-surface-soft p-2.5 rounded-lg">
            <strong>[[链接]]</strong> 使用双中括号引用其他卡片。点击关联卡片可跳转。
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="确认删除" message={`确定删除这个${deleteConfirm?.type === 'folder' ? '文件夹（子文件夹和卡片将移至未分类）' : '卡片'}？此操作不可撤销。`} confirmText="删除" />
    </div>
  );
};

export default NotebooksPage;
