import React, { useMemo } from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HeatmapCalendarProps {
  data: Map<string, number>;
  daysToShow?: number;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data, daysToShow = 84 }) => {
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    const endDate = new Date();
    const startDate = subDays(endDate, daysToShow);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    let currentWeek: Date[] = [];
    let currentDate = weekStart;
    while (currentDate < startDate) { currentWeek.push(currentDate); currentDate = addDays(currentDate, 1); }
    while (currentDate <= endDate) {
      currentWeek.push(currentDate);
      if (currentWeek.length === 7) { result.push(currentWeek); currentWeek = []; }
      currentDate = addDays(currentDate, 1);
    }
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [daysToShow]);

  const maxValue = useMemo(() => Math.max(1, ...Array.from(data.values())), [data]);

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-[#f5f0e8]';
    const intensity = Math.min(count / maxValue, 1);
    if (intensity < 0.25) return 'bg-[#e8e0d2]';
    if (intensity < 0.5) return 'bg-[#d9cfbf]';
    if (intensity < 0.75) return 'bg-[#cc785c]';
    return 'bg-[#a9583e]';
  };

  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = '';
    weeks.forEach((week, wi) => {
      if (week[0] && format(week[0], 'yyyy-MM') !== lastMonth) {
        lastMonth = format(week[0], 'yyyy-MM');
        labels.push({ month: format(week[0], 'M月', { locale: zhCN }), index: wi });
      }
    });
    return labels;
  }, [weeks]);

  const weekDays = ['一', '三', '五'];

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex mb-2 pl-8">
          {monthLabels.map((label, i) => (
            <div key={i} className="text-xs text-muted"
              style={{ marginLeft: i === 0 ? 0 : `${(label.index - (monthLabels[i - 1]?.index || 0) - 1) * 14}px` }}>
              {label.month}
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="flex flex-col gap-[3px] mr-2 pt-5">
            {weekDays.map(d => <div key={d} className="h-3 text-[10px] text-muted leading-3">{d}</div>)}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((date, di) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const count = data.get(dateStr) || 0;
                  const today = isSameDay(date, new Date());
                  return (
                    <div key={di}
                      className={`w-3 h-3 rounded-sm cursor-pointer ${getColor(count)} ${today ? 'ring-1 ring-ink' : ''} transition-colors duration-150 hover:ring-1 hover:ring-muted-soft`}
                      title={`${format(date, 'yyyy年M月d日', { locale: zhCN })}: ${count} 张卡片`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-hairline">
          <span className="text-xs text-muted">学习强度</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-[#f5f0e8]" />
            <div className="w-3 h-3 rounded-sm bg-[#e8e0d2]" />
            <div className="w-3 h-3 rounded-sm bg-[#d9cfbf]" />
            <div className="w-3 h-3 rounded-sm bg-[#cc785c]" />
            <div className="w-3 h-3 rounded-sm bg-[#a9583e]" />
          </div>
          <span className="text-xs text-muted">少 → 多</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapCalendar;
