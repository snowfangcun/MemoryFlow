import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, Zap, Trophy, Flame, Clock, ArrowRight } from 'lucide-react';
import Button from './Button';
import { ProgressRing } from './index';
import type { Rating } from '../../types';
import { useStore } from '../../stores/useStore';

interface ReviewCompletionProps {
  reviewedCount: number;
  ratings: Rating[];
  onFinish: () => void;
}

const ReviewCompletion: React.FC<ReviewCompletionProps> = ({ reviewedCount, ratings, onFinish }) => {
  const { settings, getStreak } = useStore();
  const streak = getStreak();

  const correctCount = ratings.filter(r => r !== 'forgot').length;
  const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-5">
      <div className="max-w-sm w-full text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-surface-card flex items-center justify-center mx-auto mb-6"
        >
          <Trophy size={40} className="text-primary" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="heading-serif text-2xl text-ink mb-2"
        >
          复习完成！
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted mb-8"
        >
          坚持就是胜利，继续保持
        </motion.p>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <div className="bg-surface-card rounded-xl p-4">
            <Flame size={20} className="mx-auto mb-1 text-primary" />
            <div className="text-lg font-semibold font-mono text-ink">{streak}</div>
            <div className="text-xs text-muted">连续打卡</div>
          </div>
          <div className="bg-surface-card rounded-xl p-4">
            <div className="w-14 h-14 mx-auto mb-1 flex items-center justify-center">
              <ProgressRing progress={accuracy} size={56} strokeWidth={5}>
                <span className="text-sm font-bold font-mono text-ink">{accuracy}%</span>
              </ProgressRing>
            </div>
            <div className="text-xs text-muted mt-1">正确率</div>
          </div>
          <div className="bg-surface-card rounded-xl p-4">
            <Clock size={20} className="mx-auto mb-1 text-primary" />
            <div className="text-lg font-semibold font-mono text-ink">{settings.totalStudyDays}</div>
            <div className="text-xs text-muted">累计学习</div>
          </div>
          <div className="bg-surface-card rounded-xl p-4">
            <Sparkles size={20} className="mx-auto mb-1 text-primary" />
            <div className="text-lg font-semibold font-mono text-ink">{reviewedCount}</div>
            <div className="text-xs text-muted">本次复习</div>
          </div>
        </motion.div>

        {/* Rating Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-surface-card rounded-xl p-4 mb-8"
        >
          <h3 className="text-sm font-medium text-ink mb-3">记忆评级</h3>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-danger mb-1">
                <RotateCcw size={12} /> 生疏
              </div>
              <span className="text-lg font-semibold font-mono text-ink">{ratings.filter(r => r === 'forgot').length}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs" style={{ color: '#d4a017' }}>
                <Zap size={12} /> 一般
              </div>
              <span className="text-lg font-semibold font-mono text-ink">{ratings.filter(r => r === 'hard').length}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-success mb-1">
                <Zap size={12} /> 简单
              </div>
              <span className="text-lg font-semibold font-mono text-ink">{ratings.filter(r => r === 'good').length}</span>
            </div>
          </div>
        </motion.div>

        {/* Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <Button size="lg" onClick={onFinish}>
            返回首页 <ArrowRight size={17} className="ml-1.5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ReviewCompletion;
