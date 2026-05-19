import React from 'react';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: 'book' | 'card' | 'review';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const icons = { book: BookOpen, card: Plus, review: Sparkles };

const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'book', title, description, action }) => {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center py-24 px-8 text-center">
      <div className="w-20 h-20 rounded-xl bg-surface-soft flex items-center justify-center mb-5">
        <Icon size={34} strokeWidth={1.5} className="text-muted" />
      </div>
      <h3 className="heading-serif text-xl text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {icon === 'review' ? <Sparkles size={16} className="mr-1.5" /> :
           icon === 'card' ? <Plus size={16} className="mr-1.5" /> :
           <BookOpen size={16} className="mr-1.5" />}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
