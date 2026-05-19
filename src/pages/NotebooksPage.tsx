import React, { useState } from 'react';
import { Plus, Search, ArrowLeft, HelpCircle, PenLine } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import NotebookCard from '../components/cards/NotebookCard';
import CardPreview from '../components/cards/CardPreview';
import EmptyState from '../components/ui/EmptyState';
import { useStore } from '../stores/useStore';
import type { Notebook, Card } from '../types';
import { MASTERED_INTERVAL_MS } from '../types';

type SortOption = 'created' | 'reviews' | 'name';

const NotebooksPage: React.FC = () => {
  const { notebooks, cards, addNotebook, updateNotebook, deleteNotebook, addCard, updateCard, deleteCard } = useStore();
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showEditNotebookModal, setShowEditNotebookModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'notebook' | 'card'; id: string } | null>(null);
  const [cardType, setCardType] = useState<'question' | 'cloze'>('question');

  // Form state (React 受控模式)
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');
  const [notebookName, setNotebookName] = useState('');
  const [notebookDesc, setNotebookDesc] = useState('');
  const [editNotebookName, setEditNotebookName] = useState('');
  const [editNotebookDesc, setEditNotebookDesc] = useState('');

  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [searchQuery, setSearchQuery] = useState('');

  const openCardModal = (card?: Card) => {
    setEditingCard(card ?? null);
    setCardType(card?.type ?? 'question');
    setFormFront(card?.front ?? '');
    setFormBack(card?.back ?? '');
    setShowCardModal(true);
  };

  const notebookCards = selectedNotebook
    ? cards.filter(c => c.notebookId === selectedNotebook.id)
        .filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => sortBy === 'reviews' ? b.reviewCount - a.reviewCount : sortBy === 'name' ? a.front.localeCompare(b.front) : b.createdAt - a.createdAt)
    : [];

  const handleCreateNotebook = () => {
    if (notebookName.trim()) {
      addNotebook(notebookName.trim(), notebookDesc.trim() || undefined);
      setNotebookName('');
      setNotebookDesc('');
      setShowNotebookModal(false);
    }
  };

  const handleEditNotebook = () => {
    if (selectedNotebook && editNotebookName.trim()) {
      updateNotebook(selectedNotebook.id, { name: editNotebookName.trim(), description: editNotebookDesc.trim() || undefined });
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
        // 填空卡：从 {{答案}} 中自动提取 back
        const answers = Array.from(formFront.matchAll(/\{\{([^}]+)\}\}/g), m => m[1]);
        const back = answers.join(' | ');
        if (editingCard) updateCard(editingCard.id, { front: formFront.trim(), back });
        else addCard(selectedNotebook.id, cardType, formFront.trim(), back);
      } else {
        if (editingCard) updateCard(editingCard.id, { front: formFront.trim(), back: formBack.trim() });
        else addCard(selectedNotebook.id, cardType, formFront.trim(), formBack.trim());
      }
      setFormFront('');
      setFormBack('');
      setShowCardModal(false);
      setEditingCard(null);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteConfirm.type === 'notebook' ? deleteNotebook(deleteConfirm.id) : deleteCard(deleteConfirm.id);
      if (deleteConfirm.type === 'notebook') setSelectedNotebook(null);
      setDeleteConfirm(null);
    }
  };

  if (!selectedNotebook) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-10">
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
                <div key={nb.id}>
                  <NotebookCard notebook={nb} cardCount={nbCards.length}
                    masteredCount={nbCards.filter(c => c.interval >= MASTERED_INTERVAL_MS).length}
                    onClick={() => setSelectedNotebook(nb)}
                    onEdit={() => { setSelectedNotebook(nb); }}
                    onDelete={() => setDeleteConfirm({ type: 'notebook', id: nb.id })} />
                </div>
              );
            })}
          </div>
        )}

        {/* 新建学习本 Modal */}
        <Modal isOpen={showNotebookModal} onClose={() => setShowNotebookModal(false)} title="新建学习本"
          footer={<><Button variant="ghost" onClick={() => setShowNotebookModal(false)}>取消</Button><Button onClick={handleCreateNotebook}>创建</Button></>}>
          <div className="space-y-3.5">
            <Input label="名称" placeholder="例如：英语单词" value={notebookName}
              onChange={e => setNotebookName(e.target.value)} />
            <Textarea label="描述（可选）" placeholder="简短描述..." rows={2} value={notebookDesc}
              onChange={e => setNotebookDesc(e.target.value)} />
          </div>
        </Modal>

        <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
          title="确认删除" message={`确定删除这个${deleteConfirm?.type === 'notebook' ? '学习本' : '卡片'}？此操作不可撤销。`} confirmText="删除" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => setSelectedNotebook(null)}
          className="p-1.5 rounded-lg hover:bg-surface-soft transition-colors">
          <ArrowLeft size={18} className="text-muted" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md" style={{ background: selectedNotebook.color }} />
            <h2 className="heading-serif text-lg text-ink">{selectedNotebook.name}</h2>
            <button onClick={openEditNotebookModal}
              className="text-xs text-muted hover:text-ink ml-1 transition-colors">编辑</button>
          </div>
          {selectedNotebook.description && <p className="text-xs text-muted mt-0.5">{selectedNotebook.description}</p>}
        </div>
        <Button onClick={() => { setEditingCard(null); setCardType('question'); setFormFront(''); setFormBack(''); setShowCardModal(true); }}>
          <Plus size={16} className="mr-1.5" />新建卡片
        </Button>
      </div>

      {/* 编辑学习本 Modal */}
      <Modal isOpen={showEditNotebookModal} onClose={() => setShowEditNotebookModal(false)} title="编辑学习本"
        footer={<><Button variant="ghost" onClick={() => setShowEditNotebookModal(false)}>取消</Button><Button onClick={handleEditNotebook}>保存</Button></>}>
        <div className="space-y-3.5">
          <Input label="名称" placeholder="例如：英语单词" value={editNotebookName}
            onChange={e => setEditNotebookName(e.target.value)} />
          <Textarea label="描述" placeholder="简短描述..." rows={2} value={editNotebookDesc}
            onChange={e => setEditNotebookDesc(e.target.value)} />
        </div>
      </Modal>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft" />
          <input type="text" placeholder="搜索卡片..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-canvas text-ink text-sm border hairline placeholder:text-muted-soft
              focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15" />
        </div>
        <div className="flex gap-1.5">
          {[{ k: 'created', l: '创建时间' }, { k: 'reviews', l: '复习次数' }, { k: 'name', l: '名称' }].map(o => (
            <button key={o.k} type="button" onClick={() => setSortBy(o.k as SortOption)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === o.k ? 'bg-surface-card text-ink' : 'text-muted hover:text-ink hover:bg-surface-soft'}`}>{o.l}</button>
          ))}
        </div>
      </div>

      {notebookCards.length === 0 ? (
        <EmptyState icon="card" title="还没有卡片" description="添加第一张记忆卡片"
          action={{ label: '添加卡片', onClick: () => { setEditingCard(null); setCardType('question'); setFormFront(''); setFormBack(''); setShowCardModal(true); } }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notebookCards.map(card => (
            <div key={card.id}>
              <CardPreview card={card} onClick={() => openCardModal(card)}
                onEdit={() => openCardModal(card)} onDelete={() => setDeleteConfirm({ type: 'card', id: card.id })} />
            </div>
          ))}
        </div>
      )}

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
            <Textarea label="内容" placeholder="使用 {{答案}} 标记填空，如：地球的卫星是{{月球}}" rows={3} value={formFront} onChange={e => setFormFront(e.target.value)} />
          )}
          <div className="text-xs text-muted bg-surface-soft p-2.5 rounded-lg">
            {cardType === 'question' ? '问答卡适合记忆概念和定义。' : '用 {{答案}} 标记填空位置，答案会自动提取。'}
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="确认删除" message="确定删除这张卡片吗？此操作不可撤销。" confirmText="删除" />
    </div>
  );
};

export default NotebooksPage;
