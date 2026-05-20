import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Sparkles, BarChart3, FolderOpen, GitBranch } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: 'book' | 'card' | 'review' | 'stats' | 'folder' | 'graph';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const icons = { book: BookOpen, card: Plus, review: Sparkles, stats: BarChart3, folder: FolderOpen, graph: GitBranch };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'book', title, description, action }) => {
  const Icon = icons[icon];

  return (
    <motion.div
      className="flex flex-col items-center py-24 px-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="w-20 h-20 rounded-xl bg-surface-soft flex items-center justify-center mb-5"
        variants={itemVariants}
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: 0.6,
          },
        }}
      >
        <Icon size={34} strokeWidth={1.5} className="text-muted" />
      </motion.div>
      <motion.h3 className="heading-serif text-xl text-ink mb-1.5" variants={itemVariants}>
        {title}
      </motion.h3>
      <motion.p className="text-sm text-muted max-w-xs mb-6" variants={itemVariants}>
        {description}
      </motion.p>
      {action && (
        <motion.div variants={itemVariants}>
          <Button onClick={action.onClick}>
            {icon === 'review' ? <Sparkles size={16} className="mr-1.5" /> :
             icon === 'card' ? <Plus size={16} className="mr-1.5" /> :
             icon === 'graph' ? <GitBranch size={16} className="mr-1.5" /> :
             icon === 'folder' ? <FolderOpen size={16} className="mr-1.5" /> :
             icon === 'stats' ? <BarChart3 size={16} className="mr-1.5" /> :
             <BookOpen size={16} className="mr-1.5" />}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;