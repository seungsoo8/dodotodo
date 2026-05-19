'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { Todo, WeeklyData } from '@/types/todo';

interface StatsPanelProps {
  stats: { total: number; active: number; completed: number };
  streak: number;
  weeklyData: WeeklyData[];
  allTodos: Todo[];
}

export default function StatsPanel({ stats, streak, weeklyData, allTodos }: StatsPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeTodos = allTodos.filter(t => !t.completed);
  const pCounts = {
    high: activeTodos.filter(t => t.priority === 'high').length,
    medium: activeTodos.filter(t => t.priority === 'medium').length,
    low: activeTodos.filter(t => t.priority === 'low').length,
  };
  const pTotal = pCounts.high + pCounts.medium + pCounts.low;

  return (
    <div className="nm-card p-5 mb-5 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '전체', value: stats.total, color: 'var(--nm-accent)' },
          { label: '진행 중', value: stats.active, color: '#f59e0b' },
          { label: '완료', value: stats.completed, color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} className="nm-inset p-3 text-center rounded-xl">
            <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--nm-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Streak + Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div className="nm-inset p-3 text-center rounded-xl">
          <div className="text-3xl">🔥</div>
          <div className="text-xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--nm-text)' }}>
            {streak}일
          </div>
          <div className="text-xs" style={{ color: 'var(--nm-muted)' }}>연속 달성</div>
        </div>
        <div className="nm-inset p-3 text-center rounded-xl">
          <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--nm-accent)' }}>
            {completionRate}%
          </div>
          <div className="text-xs" style={{ color: 'var(--nm-muted)' }}>완료율</div>
          <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(0,0,0,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%`, background: 'var(--nm-accent)' }}
            />
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div>
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--nm-muted)' }}>
          이번 주 완료
        </h3>
        <div style={{ height: 72 }}>
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={20} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: 'var(--nm-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.completed > 0 ? 'var(--nm-accent)' : 'rgba(99,102,241,0.15)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Priority distribution */}
      {pTotal > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2.5 uppercase tracking-wider" style={{ color: 'var(--nm-muted)' }}>
            우선순위 분포 (진행 중)
          </h3>
          <div className="space-y-2">
            {[
              { label: '높음', color: '#f43f5e', count: pCounts.high },
              { label: '보통', color: '#f59e0b', count: pCounts.medium },
              { label: '낮음', color: '#10b981', count: pCounts.low },
            ].map(({ label, color, count }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs w-8 flex-shrink-0" style={{ color: 'var(--nm-muted)' }}>{label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pTotal > 0 ? (count / pTotal) * 100 : 0}%`, background: color }}
                  />
                </div>
                <span className="text-xs w-4 text-right tabular-nums" style={{ color: 'var(--nm-muted)' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
