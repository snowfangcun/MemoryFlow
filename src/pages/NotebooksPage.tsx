import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, ArrowLeft, HelpCircle, PenLine, Tag, X, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import NotebookCard from '../components/cards/NotebookCard';
import CardPreview from '../components/cards/CardPreview';
import EmptyState from '../components/ui/EmptyState';
import { useStore } from '../stores/useStore';
import { useToastStore } from '../stores/useToastStore';
import type { Notebook, Card } from '../types';
import { MASTERED_INTERVAL_MS } from '../types';

type SortOption = 'created' | 'reviews' | 'name';

const NotebooksPage: React.FC = () => {
  const { notebooks, cards, cardLinks, addNotebook, updateNotebook, deleteNotebook, addCard, updateCard, deleteCard, getBacklinks, getForwardLinks, getAllTags, refreshCardLinks } = useStore();
  const addToast = useToastStore(s => s.addToast);

  // ── 所有 useState / useMemo 必须无条件声明 ──
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showEditNotebookModal, setShowEditNotebookModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'notebook' | 'card'; id: string } | null>(null);
  const [cardType, setCardType] = useState<'question' | 'cloze'>('question');
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [notebookName, setNotebookName] = useState('');
  const [notebookDesc, setNotebookDesc] = useState('');
  const [editNotebookName, setEditNotebookName] = useState('');
  const [editNotebookDesc, setEditNotebookDesc] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [searchQuery, setSearchQuery] = useState('');

  const allTags = useMemo(() => getAllTags(), [cards, getAllTags]);

  const openCardModal = (card?: Card) => {
    setEditingCard(card ?? null);
    setCardType(card?.type ?? 'question');
    setFormFront(card?.front ?? '');
    setFormBack(card?.back ?? '');
    setFormTags(card?.tags ?? []);
    setShowCardModal(true);
  };

  const notebookCards = selectedNotebook
    ? cards.filter(c => c.notebookId === selectedNotebook.id)
        .filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(c => !filterTag || c.tags?.includes(filterTag))
        .sort((a, b) => sortBy === 'reviews' ? b.reviewCount - a.reviewCount : sortBy === 'name' ? a.front.localeCompare(b.front) : b.createdAt - a.createdAt)
    : [];

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !formTags.includes(t)) setFormTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setFormTags(prev => prev.filter(t => t !== tag));

  const handleCreateNotebook = () => {
    if (notebookName.trim()) {
      addNotebook(notebookName.trim(), notebookDesc.trim() || undefined);
      addToast('学习本已创建', 'success');
      setNotebookName(''); setNotebookDesc('');
      setShowNotebookModal(false);
    }
  };

  const handleEditNotebook = () => {
    if (selectedNotebook && editNotebookName.trim()) {
      updateNotebook(selectedNotebook.id, { name: editNotebookName.trim(), description: editNotebookDesc.trim() || undefined });
      addToast('学习本已更新', 'success');
      setShowEditNotebookModal(false);
    }
  };

  const openEditNotebookModal = () => {
    if (selectedNotebook) {
      setEditNotebookName(selectedNotebook.name);
      setEditNotebookDesc(selectedNotebook.description || '');
      setShowEditNotebookModal(true);
    }
  };

  const handleCreateCard = () => {
    if (formFront.trim() && selectedNotebook) {
      if (cardType === 'cloze') {
        const answers = Array.from(formFront.matchAll(/\{\{([^}]+)\}\}/g), m => m[1]);
        const back = answers.join(' | ');
        if (editingCard) {
          updateCard(editingCard.id, { front: formFront.trim(), back, tags: formTags });
          addToast('卡片已更新', 'success');
        } else {
          addCard(selectedNotebook.id, cardType, formFront.trim(), back, formTags);
          addToast('卡片已创建', 'success');
        }
      } else {
        if (editingCard) {
          updateCard(editingCard.id, { front: formFront.trim(), back: formBack.trim(), tags: formTags });
          addToast('卡片已更新', 'success');
        } else {
          addCard(selectedNotebook.id, cardType, formFront.trim(), formBack.trim(), formTags);
          addToast('卡片已创建', 'success');
        }
      }
      setFormFront(''); setFormBack(''); setFormTags([]);
      setShowCardModal(false); setEditingCard(null);
    }
  };

  const navigateToCard = useCallback((targetCard: Card) => {
    setShowCardModal(false);
    setEditingCard(null);
    if (targetCard.notebookId !== selectedNotebook?.id) {
      const nb = notebooks.find(n => n.id === targetCard.notebookId);
      if (nb) setSelectedNotebook(nb);
    }
    setSearchQuery(targetCard.front.slice(0, 12));
  }, [selectedNotebook, notebooks]);

  const handleDelete = () => {
    if (deleteConfirm) {
      const isNotebook = deleteConfirm.type === 'notebook';
      isNotebook ? deleteNotebook(deleteConfirm.id) : deleteCard(deleteConfirm.id);
      addToast(isNotebook ? '学习本已删除' : '卡片已删除', 'info');
      if (isNotebook) setSelectedNotebook(null);
      setDeleteConfirm(null);
    }
  };

  // ── 条件渲染（不再使用早期 return） ──
  const isNotebookListView = !selectedNotebook;

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      {isNotebookListView ? (
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
                    onClick={() => setSelectedNotebook(nb)}
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
            title="确认删除" message={`确定删除这个${deleteConfirm?.type === 'notebook' ? '学习本' : '卡片'}？此操作不可撤销。`} confirmText="删除" />
        </>
      ) : (
        <>
          {/* 头部 */}
          <div className="flex items-center gap-3 mb-7">
            <button onClick={() => setSelectedNotebook(null)} className="p-1.5 rounded-lg hover:bg-surface-soft transition-colors">
              <ArrowLeft size={18} className="text-muted" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md" style={{ background: selectedNotebook.color }} />
                <h2 className="heading-serif text-lg text-ink">{selectedNotebook.name}</h2>
                <button onClick={openEditNotebookModal} className="text-xs text-muted hover:text-ink ml-1 transition-colors">编辑</button>
              </div>
              {selectedNotebook.description && <p className="text-xs text-muted mt-0.5">{selectedNotebook.description}</p>}
            </div>
            <Button onClick={() => { setEditingCard(null); setCardType('question'); setFormFront(''); setFormBack(''); setFormTags([]); setShowCardModal(true); }}>
              <Plus size={16} className="mr-1.5" />新建卡片
            </Button>
          </div>

          {/* 编辑学习本 Modal */}
          <Modal isOpen={showEditNotebookModal} onClose={() => setShowEditNotebookModal(false)} title="编辑学习本"
            footer={<><Button variant="ghost" onClick={() => setShowEditNotebookModal(false)}>取消</Button><Button onClick={handleEditNotebook}>保存</Button></>}>
            <div className="space-y-3.5">
              <Input label="名称" placeholder="例如：英语单词" value={editNotebookName} onChange={e => setEditNotebookName(e.target.value)} />
              <Textarea label="描述" placeholder="简短描述..." rows={2} value={editNotebookDesc} onChange={e => setEditNotebookDesc(e.target.value)} />
            </div>
          </Modal>

          {/* 搜索 + 排序 + 标签筛选 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft" />
              <input type="text" placeholder="搜索卡片..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-canvas text-ink text-sm border hairline placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[{ k: 'created', l: '创建时间' }, { k: 'reviews', l: '复习次数' }, { k: 'name', l: '名称' }].map(o => (
                <button key={o.k} type="button" onClick={() => setSortBy(o.k as SortOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === o.k ? 'bg-surface-card text-ink' : 'text-muted hover:text-ink hover:bg-surface-soft'}`}>{o.l}</button>
              ))}
              {allTags.length > 0 && allTags.map(tag => (
                <button key={tag} type="button" onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTag === tag ? 'bg-primary text-white' : 'text-muted hover:text-ink bg-surface-soft'}`}>
                  <Tag size={11} />{tag}
                </button>
              ))}
              {filterTag && <button type="button" onClick={() => setFilterTag('')} className="text-xs text-muted hover:text-ink">清除</button>}
            </div>
          </div>

          {/* 卡片列表 */}
          {notebookCards.length === 0 ? (
            <EmptyState icon="card" title="还没有卡片" description="添加第一张记忆卡片"
              action={{ label: '添加卡片', onClick: () => { setEditingCard(null); setCardType('question'); setFormFront(''); setFormBack(''); setFormTags([]); setShowCardModal(true); } }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notebookCards.map(card => (
                <div key={card.id}>
                  <CardPreview card={card}
                    backlinks={getBacklinks(card.id)}
                    forwardLinks={getForwardLinks(card.id)}
                    onClick={() => openCardModal(card)}
                    onEdit={() => openCardModal(card)}
                    onDelete={() => setDeleteConfirm({ type: 'card', id: card.id })} />
                </div>
              ))}
            </div>
          )}

          {/* 卡片编辑 Modal */}
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
                <><Textarea label="问题" placeholder="输入问题..." rows={2} value={formFront} onChange={e => setFormFront(e.target.value)} />
                  <Textarea label="答案" placeholder="输入答案..." rows={2} value={formBack} onChange={e => setFormBack(e.target.value)} /></>
              ) : (
                <Textarea label="内容" placeholder="使用 {{答案}} 标记填空，也支持 [[链接]] 关联其他卡片" rows={3} value={formFront} onChange={e => setFormFront(e.target.value)} />
              )}
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-body mb-1.5 flex items-center gap-1.5"><Tag size={13} /> 标签</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {formTags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-surface-soft text-muted">
                      {tag}<button type="button" onClick={() => removeTag(tag)} className="hover:text-ink transition-colors"><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="输入标签按回车" value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="flex-1 h-8 px-2.5 rounded-md bg-canvas text-ink text-xs border hairline placeholder:text-muted-soft focus:outline-none focus:border-primary" />
                  <button type="button" onClick={addTag} className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-soft text-muted hover:text-ink transition-colors">添加</button>
                </div>
              </div>
              {/* 关联卡片 */}
              {editingCard && (() => {
                const fwd = getForwardLinks(editingCard.id);
                const bwd = getBacklinks(editingCard.id);
                const noLinks = fwd.length === 0 && bwd.length === 0;
                return noLinks ? null : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-body">关联卡片</label>
                    {fwd.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted mb-1">链出 →</p>
                        <div className="flex flex-wrap gap-1.5">
                          {fwd.map(link => {
                            const target = cards.find(c => c.id === link.targetId);
                            return (
                              <button key={link.id} type="button"
                                onClick={() => target && navigateToCard(target)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-surface-soft text-muted hover:text-ink hover:bg-canvas transition-colors">
                                <ExternalLink size={10} />
                                {target ? target.front.slice(0, 20) : link.targetName}
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
                              <button key={link.id} type="button"
                                onClick={() => source && navigateToCard(source)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-surface-soft text-primary hover:text-ink hover:bg-canvas transition-colors">
                                {source ? source.front.slice(0, 20) : '未知卡片'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
                    <div className="text-xs text-muted bg-surface-soft p-2.5 rounded-lg">
                <strong>[[链接]]</strong> 在内容中使用双中括号引用其他卡片，如：{'{{月球}}'}绕{'[[地球]]'}旋转。点击关联卡片可跳转。
              </div>
            </div>
          </Modal>

          <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
            title="确认删除" message="确定删除这张卡片吗？此操作不可撤销。" confirmText="删除" />
        </>
      )}
    </div>
  );
};

export default NotebooksPage;
