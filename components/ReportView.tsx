'use client';

import { useMemo } from 'react';
import { Todo, DailyCompletion } from '@/types/todo';
import { useGamification } from '@/hooks/useGamification';

interface Props {
  allTodos: Todo[];
  history: DailyCompletion[];
}

function getMonthlyData(history: DailyCompletion[]): { week: string; count: number }[] {
  const weeks: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - (i + 1) * 7 + 1);
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const count = history.reduce((sum, e) => {
      const d = new Date(e.date);
      return d >= start && d <= end ? sum + e.count : sum;
    }, 0);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    weeks.push({ week: label, count });
  }
  return weeks;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-4 flex-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? 'var(--text)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

const MAX_BAR_HEIGHT = 48;

export default function ReportView({ allTodos, history }: Props) {
  const gamification = useGamification(allTodos);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const date = d.toISOString().split('T')[0];
      const entry = history.find(e => e.date === date);
      return {
        day: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
        count: entry?.count ?? 0,
        date,
        isToday: date === new Date().toISOString().split('T')[0],
      };
    });
  }, [history]);

  const monthlyData = useMemo(() => getMonthlyData(history), [history]);

  const weekMax = Math.max(...weeklyData.map(d => d.count), 1);
  const monthMax = Math.max(...monthlyData.map(d => d.count), 1);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    allTodos.filter(t => !t.deletedAt).forEach(t => {
      const cat = t.category ?? '미분류';
      if (!map[cat]) map[cat] = { total: 0, done: 0 };
      map[cat].total++;
      if (t.completed) map[cat].done++;
    });
    return Object.entries(map)
      .map(([cat, { total, done }]) => ({ cat, total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [allTodos]);

  const priorityBreakdown = useMemo(() => {
    const labels = { high: '높음', medium: '보통', low: '낮음' } as const;
    const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' } as const;
    return (['high', 'medium', 'low'] as const).map(p => {
      const todos = allTodos.filter(t => !t.deletedAt && t.priority === p);
      const done = todos.filter(t => t.completed).length;
      return { priority: p, label: labels[p], color: colors[p], total: todos.length, done };
    });
  }, [allTodos]);

  const thisWeekCount = weeklyData.reduce((s, d) => s + d.count, 0);
  const lastWeekData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().split('T')[0];
    return history.find(e => e.date === date)?.count ?? 0;
  }), [history]);
  const lastWeekCount = lastWeekData.reduce((s, c) => s + c, 0);
  const weekGrowth = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>생산성 리포트</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>나의 할 일 완료 현황</p>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3">
        <StatCard label="이번 주 완료" value={thisWeekCount} sub={weekGrowth !== null ? `지난주 대비 ${weekGrowth > 0 ? '+' : ''}${weekGrowth}%` : undefined} color="var(--accent)" />
        <StatCard label="총 완료" value={gamification.completedCount} sub="누적" />
        <StatCard label="레벨" value={`Lv.${gamification.level}`} sub={gamification.rank} color="#f59e0b" />
      </div>

      {/* XP / Level bar */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏅</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Lv.{gamification.level} {gamification.rank}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{gamification.totalXP} XP 누적</p>
            </div>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {gamification.xpInCurrentLevel} / {gamification.xpToNextLevel} XP
          </p>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${gamification.progressPercent}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Weekly chart */}
      <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>이번 주 완료</p>
        <div className="flex items-end justify-between gap-1" style={{ height: MAX_BAR_HEIGHT + 24 }}>
          {weeklyData.map(d => (
            <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted)', minHeight: 16 }}>
                {d.count > 0 ? d.count : ''}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: d.count > 0 ? Math.max(4, Math.round((d.count / weekMax) * MAX_BAR_HEIGHT)) : 4,
                  background: d.isToday ? 'var(--accent)' : d.count > 0 ? 'var(--accent)' : 'var(--border)',
                  opacity: d.count > 0 ? 1 : 0.3,
                }}
              />
              <span className="text-xs" style={{ color: d.isToday ? 'var(--accent)' : 'var(--muted)', fontWeight: d.isToday ? 700 : 400 }}>
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly chart */}
      <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>최근 4주</p>
        <div className="flex items-end justify-between gap-2" style={{ height: MAX_BAR_HEIGHT + 24 }}>
          {monthlyData.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted)', minHeight: 16 }}>
                {d.count > 0 ? d.count : ''}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: d.count > 0 ? Math.max(4, Math.round((d.count / monthMax) * MAX_BAR_HEIGHT)) : 4,
                  background: 'var(--accent)',
                  opacity: d.count > 0 ? 1 : 0.2,
                }}
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{d.week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>우선순위별 완료율</p>
        {priorityBreakdown.map(({ priority, label, color, total, done }) => (
          <div key={priority} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color }}>{label}</span>
              <span style={{ color: 'var(--muted)' }}>{done}/{total}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%', background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>카테고리별 현황</p>
          {categoryBreakdown.map(({ cat, total, done, rate }) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs w-14 truncate flex-shrink-0" style={{ color: 'var(--muted)' }}>{cat}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: 'var(--accent)' }} />
              </div>
              <span className="text-xs tabular-nums w-10 text-right flex-shrink-0" style={{ color: 'var(--muted)' }}>
                {done}/{total}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>업적</p>
        <div className="grid grid-cols-3 gap-2">
          {gamification.achievements.map(a => (
            <div
              key={a.id}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                background: a.unlocked ? 'var(--accent-muted)' : 'transparent',
                border: '1px solid var(--border)',
                opacity: a.unlocked ? 1 : 0.4,
              }}
            >
              <div className="text-2xl mb-1">{a.icon}</div>
              <p className="text-xs font-semibold truncate" style={{ color: a.unlocked ? 'var(--text)' : 'var(--muted)' }}>{a.title}</p>
              <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--muted)', fontSize: 10 }}>{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
