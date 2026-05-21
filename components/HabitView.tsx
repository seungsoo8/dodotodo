'use client';

import { useMemo } from 'react';
import { CheckCircle2, Flame, RefreshCw } from 'lucide-react';
import { Todo, DailyCompletion, WeeklyData } from '@/types/todo';

interface HabitViewProps {
  allTodos: Todo[];
  weeklyData: WeeklyData[];
  history: DailyCompletion[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function getColor(count: number): string {
  if (count === 0) return 'var(--border)';
  if (count <= 1) return '#c6b6fb';
  if (count <= 3) return '#818cf8';
  if (count <= 6) return '#6366f1';
  return '#4f46e5';
}

function getColorDark(count: number): string {
  if (count === 0) return '#21262d';
  if (count <= 1) return '#1e1b4b';
  if (count <= 3) return '#3730a3';
  if (count <= 6) return '#4f46e5';
  return '#6366f1';
}

export default function HabitView({ allTodos, weeklyData, history }: HabitViewProps) {
  const recurringTodos = allTodos.filter(t => t.recurring !== 'none');

  // Build 52-week grid (364 days back from today)
  const grid = useMemo(() => {
    const today = new Date();
    const weeks: { date: string; count: number }[][] = [];
    // Start from Sunday 52 weeks ago
    const start = new Date(today);
    start.setDate(today.getDate() - 363);
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    for (let w = 0; w < 53; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const ds = date.toISOString().split('T')[0];
        const entry = history.find(e => e.date === ds);
        week.push({ date: ds, count: entry?.count ?? 0 });
      }
      weeks.push(week);
    }
    return weeks;
  }, [history]);

  // Month labels for grid
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, col) => {
      const date = new Date(week[0].date + 'T00:00:00');
      const m = date.getMonth();
      if (m !== lastMonth) {
        labels.push({ label: MONTHS[m], col });
        lastMonth = m;
      }
    });
    return labels;
  }, [grid]);

  const totalCompleted = history.reduce((sum, e) => sum + e.count, 0);
  const todayStr = new Date().toISOString().split('T')[0];

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    const base = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (history.find(e => e.date === key && e.count > 0)) count++;
      else break;
    }
    return count;
  }, [history]);

  const maxWeekly = Math.max(...weeklyData.map(w => w.completed), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '총 완료', value: totalCompleted, icon: <CheckCircle2 className="w-6 h-6" />, color: '#10b981' },
          { label: '연속 달성', value: `${streak}일`, icon: <Flame className="w-6 h-6" />, color: '#f59e0b' },
          { label: '반복 할 일', value: recurringTodos.length, icon: <RefreshCw className="w-6 h-6" />, color: 'var(--accent)' },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span style={{ color }}>{icon}</span>
            <div>
              <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contribution grid */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>완료 기록 (최근 1년)</h2>

        <div className="overflow-x-auto">
          <div style={{ minWidth: 'max-content' }}>
            {/* Month labels */}
            <div className="flex gap-1 mb-1 pl-7">
              {grid.map((_, col) => {
                const label = monthLabels.find(m => m.col === col);
                return (
                  <div key={col} className="w-3 text-xs" style={{ color: 'var(--muted)', fontSize: '9px' }}>
                    {label ? label.label : ''}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1">
              {/* Weekday labels */}
              <div className="flex flex-col gap-1 mr-1">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className="w-3 h-3 flex items-center justify-end"
                    style={{ color: 'var(--muted)', fontSize: '9px' }}
                  >
                    {i % 2 === 0 ? d : ''}
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map(cell => {
                    const isFuture = cell.date > todayStr;
                    return (
                      <div
                        key={cell.date}
                        className="w-3 h-3 rounded-sm"
                        title={`${cell.date}: ${cell.count}개 완료`}
                        style={{
                          background: isFuture ? 'transparent' : getColor(cell.count),
                          border: isFuture ? '1px solid var(--border)' : 'none',
                          opacity: isFuture ? 0.3 : 1,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>적음</span>
          {[0, 1, 3, 5, 7].map(count => (
            <div key={count} className="w-3 h-3 rounded-sm" style={{ background: getColor(count) }} />
          ))}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>많음</span>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-2xl p-5 mt-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>이번 주 완료 현황</h2>
        <div className="flex items-end gap-2 h-24">
          {weeklyData.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs tabular-nums" style={{ color: day.completed > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                {day.completed > 0 ? day.completed : ''}
              </span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${(day.completed / maxWeekly) * 64}px`,
                  minHeight: day.completed > 0 ? '4px' : '0',
                  background: day.date === todayStr ? 'var(--accent)' : day.completed > 0 ? 'var(--accent-muted)' : 'var(--border)',
                }}
              />
              <span className="text-xs" style={{ color: day.date === todayStr ? 'var(--accent)' : 'var(--muted)' }}>
                {day.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring todos list */}
      {recurringTodos.length > 0 && (
        <div className="rounded-2xl p-5 mt-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>반복 할 일 ({recurringTodos.length})</h2>
          <div className="space-y-2">
            {recurringTodos.map(todo => {
              const RECURRING_LABELS: Record<string, string> = { daily: '매일', weekly: '매주', monthly: '매월' };
              return (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: todo.completed ? 'var(--muted)' : 'var(--accent)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)' }}
                    >
                      {todo.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-muted)' }}>
                      {RECURRING_LABELS[todo.recurring]}
                    </span>
                    {todo.pomodoroCount > 0 && (
                      <span className="text-xs" style={{ color: '#f59e0b' }}>🍅 ×{todo.pomodoroCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
