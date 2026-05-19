import React, { useMemo } from 'react';
import { Flame, Trophy, Target, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import HeatmapCalendar from '../components/ui/HeatmapCalendar';
import { useStore } from '../stores/useStore';
import { MASTERED_INTERVAL_MS } from '../types';

const StatsPage: React.FC = () => {
  const { notebooks, cards, reviewLogs, settings, getStreak, getHeatmapData } = useStore();

  const stats = useMemo(() => ({
    streak: getStreak(),
    masteredCards: cards.filter(c => c.interval >= MASTERED_INTERVAL_MS).length,
    reviewsThisWeek: reviewLogs.filter(r => r.reviewedAt >= Date.now() - 7 * 24 * 60 * 60 * 1000).length,
    ratingDist: {
      forgot: reviewLogs.filter(r => r.rating === 'forgot').length,
      hard: reviewLogs.filter(r => r.rating === 'hard').length,
      good: reviewLogs.filter(r => r.rating === 'good').length,
    },
    notebookStats: notebooks.map(n => {
      const nbCards = cards.filter(c => c.notebookId === n.id);
      return { ...n, total: nbCards.length, mastered: nbCards.filter(c => c.interval >= MASTERED_INTERVAL_MS).length, due: nbCards.filter(c => c.nextReview <= Date.now()).length };
    }),
    heatmap: getHeatmapData(),
  }), [cards, reviewLogs, notebooks, getStreak, getHeatmapData]);

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h2 className="heading-serif text-xl text-ink mb-7">学习统计</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Flame, value: stats.streak, label: '连续打卡', unit: '天', bg: '#f5f0e8' },
          { icon: Trophy, value: settings.totalStudyDays, label: '累计学习', unit: '天', bg: '#f5f0e8' },
          { icon: Target, value: stats.masteredCards, label: '已掌握', unit: '张', bg: '#f5f0e8' },
          { icon: TrendingUp, value: stats.reviewsThisWeek, label: '本周复习', unit: '次', bg: '#f5f0e8' },
        ].map((s, i) => (
          <div key={s.label} className={`bg-surface-card rounded-lg p-5 ${i > 0 ? `enter enter-d${i + 1}` : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center mb-3">
              <s.icon size={19} strokeWidth={1.5} className="text-muted" />
            </div>
            <div className="text-xl font-medium heading-serif text-ink">{s.value}<span className="text-sm text-muted ml-1">{s.unit}</span></div>
            <div className="text-xs text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <section className="bg-surface-card rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink mb-4">学习热力图</h3>
        <HeatmapCalendar data={stats.heatmap} daysToShow={84} />
      </section>

      {/* Rating Distribution */}
      <section className="bg-surface-card rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink mb-4">记忆评级分布</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '生疏', count: stats.ratingDist.forgot, bg: '#f5f0e8', cls: 'text-muted' },
            { label: '一般', count: stats.ratingDist.hard, bg: '#f5f0e8', cls: 'text-muted' },
            { label: '简单', count: stats.ratingDist.good, bg: '#f5f0e8', cls: 'text-muted' },
          ].map(r => (
            <div key={r.label} className="text-center">
              <div className={`w-14 h-14 mx-auto mb-2 rounded-lg`} style={{ backgroundColor: r.bg }}>
                <span className={`text-lg font-medium heading-serif flex items-center justify-center h-full ${r.cls}`}>{r.count}</span>
              </div>
              <p className="text-xs text-muted">{r.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Notebook Progress */}
      <section className="bg-surface-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-ink mb-4">学习本详情</h3>
        {stats.notebookStats.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">还没有学习本</p>
        ) : (
          <div className="space-y-3">
            {stats.notebookStats.map(nb => {
              const progress = nb.total > 0 ? (nb.mastered / nb.total) * 100 : 0;
              return (
                <div key={nb.id} className="bg-canvas rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md" style={{ background: nb.color }} />
                      <span className="text-sm font-medium text-ink">{nb.name}</span>
                    </div>
                    <span className="text-xs text-muted">{nb.total} 张卡片</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mb-2">
                    <span className="flex items-center gap-1"><Clock size={12} />{nb.due} 待复习</span>
                    <span className="flex items-center gap-1"><CheckCircle size={12} />{nb.mastered} 已掌握</span>
                  </div>
                  <div className="h-1.5 bg-hairline rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StatsPage;
