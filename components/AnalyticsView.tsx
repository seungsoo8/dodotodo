'use client';

import { useMemo } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { Todo, DailyCompletion, WeeklyData } from '@/types/todo';

interface Props {
  allTodos: Todo[];
  weeklyData: WeeklyData[];
  history: DailyCompletion[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const MAX_BAR_HEIGHT = 56;

function getHeatColor(count: number): string {
  if (count === 0) return 'var(--border)';
  if (count <= 1) return '#c6b6fb';
  if (count <= 3) return '#818cf8';
  if (count <= 6) return '#6366f1';
  return '#4f46e5';
}

// 원형 진행률
function CircleProgress({ pct, size = 64, stroke = 6, color = 'var(--accent)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

export default function AnalyticsView({ allTodos, weeklyData, history }: Props) {
  const gami = useGamification(allTodos);
  const today = new Date().toISOString().split('T')[0];
  const activeTodos = allTodos.filter(t => !t.deletedAt);

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

  const totalCompleted = useMemo(() => history.reduce((s, e) => s + e.count, 0), [history]);

  const weeklyChartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().split('T')[0];
    const entry = history.find(e => e.date === date);
    return { day: WEEKDAYS[d.getDay()], count: entry?.count ?? 0, date, isToday: date === today };
  }), [history, today]);

  const thisWeekCount = weeklyChartData.reduce((s, d) => s + d.count, 0);

  // 지난 주 대비
  const lastWeekData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().split('T')[0];
    const entry = history.find(e => e.date === date);
    return entry?.count ?? 0;
  }), [history]);
  const lastWeekCount = lastWeekData.reduce((s, v) => s + v, 0);
  const weekDiff = thisWeekCount - lastWeekCount;

  const weekMax = Math.max(...weeklyChartData.map(d => d.count), 1);
  const weekAvg = thisWeekCount / 7;

  // 오늘 현황
  const todayTodos = activeTodos.filter(t => t.dueDate === today || (t as { isToday?: boolean }).isToday);
  const todayDone = todayTodos.filter(t => t.completed).length;
  const todayPct = todayTodos.length > 0 ? Math.round((todayDone / todayTodos.length) * 100) : 0;

  // 전체 완료율
  const totalActive = activeTodos.length;
  const totalDone = activeTodos.filter(t => t.completed).length;
  const overallPct = totalActive > 0 ? Math.round((totalDone / totalActive) * 100) : 0;

  // 포모도로 총 세션
  const totalPomodoro = useMemo(() => activeTodos.reduce((s, t) => s + (t.pomodoroCount ?? 0), 0), [activeTodos]);

  // 베스트 요일
  const bestDayIdx = useMemo(() => {
    const byDay = Array(7).fill(0);
    history.forEach(e => { const day = new Date(e.date + 'T00:00:00').getDay(); byDay[day] += e.count; });
    return byDay.indexOf(Math.max(...byDay));
  }, [history]);

  // 미완료 현황
  const overdueCount = useMemo(() => activeTodos.filter(t => !t.completed && t.dueDate && t.dueDate < today).length, [activeTodos, today]);
  const soonCount = useMemo(() => {
    const in3days = new Date();
    in3days.setDate(in3days.getDate() + 3);
    const in3str = in3days.toISOString().split('T')[0];
    return activeTodos.filter(t => !t.completed && t.dueDate && t.dueDate >= today && t.dueDate <= in3str).length;
  }, [activeTodos, today]);
  const noDateCount = activeTodos.filter(t => !t.completed && !t.dueDate).length;

  // 우선순위별
  const priorityBreakdown = useMemo(() => {
    const labels = { high: '높음', medium: '보통', low: '낮음' } as const;
    const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' } as const;
    return (['high', 'medium', 'low'] as const).map(p => {
      const todos = activeTodos.filter(t => t.priority === p);
      const done = todos.filter(t => t.completed).length;
      const pct = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0;
      return { priority: p, label: labels[p], color: colors[p], total: todos.length, done, pct };
    });
  }, [activeTodos]);

  // 카테고리별
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    activeTodos.forEach(t => {
      const cat = t.category ?? '미분류';
      if (!map[cat]) map[cat] = { total: 0, done: 0 };
      map[cat].total++;
      if (t.completed) map[cat].done++;
    });
    return Object.entries(map)
      .map(([cat, { total, done }]) => ({ cat, total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [activeTodos]);

  // 52-week heatmap
  const grid = useMemo(() => {
    const todayDate = new Date();
    const start = new Date(todayDate);
    start.setDate(todayDate.getDate() - 363);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 53 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const ds = date.toISOString().split('T')[0];
        const entry = history.find(e => e.date === ds);
        return { date: ds, count: entry?.count ?? 0 };
      })
    );
  }, [history]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, col) => {
      const m = new Date(week[0].date + 'T00:00:00').getMonth();
      if (m !== lastMonth) { labels.push({ label: MONTHS[m], col }); lastMonth = m; }
    });
    return labels;
  }, [grid]);

  // ── 섹션별 UI ──

  const summaryCards = (cols: string) => (
    <div className={`grid ${cols} gap-3`}>
      {[
        { label: '이번 주 완료', value: thisWeekCount, sub: weekDiff === 0 ? '지난 주와 동일' : weekDiff > 0 ? `↑ 지난 주보다 ${weekDiff}개 더` : `↓ 지난 주보다 ${Math.abs(weekDiff)}개 적음`, icon: '📅', color: '#6366f1' },
        { label: '전체 완료율', value: `${overallPct}%`, sub: `${totalDone} / ${totalActive}개`, icon: '✅', color: '#10b981' },
        { label: '연속 달성', value: `${streak}일`, sub: streak > 0 ? '🔥 유지 중' : '오늘 시작해보세요', icon: '🔥', color: '#f59e0b' },
        { label: '포모도로', value: totalPomodoro, sub: '총 집중 세션', icon: '🍅', color: '#ef4444' },
      ].map(({ label, value, sub, icon, color }) => (
        <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-xl">{icon}</span>
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
          </div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: weekDiff !== 0 && label === '이번 주 완료' ? (weekDiff > 0 ? '#10b981' : '#ef4444') : 'var(--muted)' }}>{sub}</p>
        </div>
      ))}
    </div>
  );

  const todayCard = (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>오늘 현황</p>
      {todayTodos.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>오늘 마감 할 일이 없어요</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
            <CircleProgress pct={todayPct} size={64} stroke={6} color="#6366f1" />
            <span className="absolute text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{todayPct}%</span>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>{todayDone}<span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>/{todayTodos.length}</span></p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>오늘 할 일 완료</p>
            {todayPct === 100 && <p className="text-xs mt-1" style={{ color: '#10b981' }}>🎉 오늘 모두 완료!</p>}
          </div>
        </div>
      )}
    </div>
  );

  const overdueCard = (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>미완료 현황</p>
      <div className="space-y-2.5">
        {[
          { label: '마감 지남', count: overdueCount, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: '3일 이내 마감', count: soonCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: '마감 없음', count: noDateCount, color: 'var(--muted)', bg: 'var(--border)' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
            </div>
            <span className="text-sm font-semibold px-2 py-0.5 rounded-lg" style={{ background: bg, color }}>{count}개</span>
          </div>
        ))}
      </div>
    </div>
  );

  const weeklyChart = (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>이번 주 완료</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>베스트 요일</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{WEEKDAYS[bestDayIdx]}요일</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1" style={{ height: MAX_BAR_HEIGHT + 24 }}>
        {weeklyChartData.map(d => (
          <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)', minHeight: 16 }}>{d.count > 0 ? d.count : ''}</span>
            <div className="w-full relative" style={{ height: MAX_BAR_HEIGHT }}>
              {/* 평균선 */}
              {weekAvg > 0 && (
                <div className="absolute left-0 right-0" style={{
                  bottom: Math.max(2, Math.round((weekAvg / weekMax) * MAX_BAR_HEIGHT)),
                  height: 1,
                  background: 'var(--muted)',
                  opacity: 0.3,
                }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500" style={{
                height: d.count > 0 ? Math.max(4, Math.round((d.count / weekMax) * MAX_BAR_HEIGHT)) : 4,
                background: d.isToday ? 'var(--accent)' : d.count > 0 ? `${d.count >= weekAvg ? '#818cf8' : '#c6b6fb'}` : 'var(--border)',
                opacity: d.count > 0 ? 1 : 0.3,
              }} />
            </div>
            <span className="text-xs" style={{ color: d.isToday ? 'var(--accent)' : 'var(--muted)', fontWeight: d.isToday ? 700 : 400 }}>{d.day}</span>
          </div>
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>일 평균 {weekAvg.toFixed(1)}개 완료</p>
    </div>
  );

  const heatmap = (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>완료 기록 (최근 1년)</p>
        <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>🔥 {streak}일 연속</span>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 'max-content' }}>
          <div className="flex gap-1 mb-1 pl-7">
            {grid.map((_, col) => {
              const lbl = monthLabels.find(m => m.col === col);
              return <div key={col} className="w-3 text-xs" style={{ color: 'var(--muted)', fontSize: '9px' }}>{lbl ? lbl.label : ''}</div>;
            })}
          </div>
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 mr-1">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className="w-3 h-3 flex items-center justify-end" style={{ color: 'var(--muted)', fontSize: '9px' }}>{i % 2 === 0 ? d : ''}</div>
              ))}
            </div>
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(cell => {
                  const isFuture = cell.date > today;
                  return (
                    <div key={cell.date} className="w-3 h-3 rounded-sm" title={`${cell.date}: ${cell.count}개 완료`}
                      style={{ background: isFuture ? 'transparent' : getHeatColor(cell.count), border: isFuture ? '1px solid var(--border)' : 'none', opacity: isFuture ? 0.3 : 1 }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>적음</span>
        {[0, 1, 3, 5, 7].map(count => <div key={count} className="w-3 h-3 rounded-sm" style={{ background: getHeatColor(count) }} />)}
        <span className="text-xs" style={{ color: 'var(--muted)' }}>많음</span>
        <span className="ml-auto text-xs tabular-nums font-semibold" style={{ color: 'var(--accent)' }}>총 {totalCompleted}개</span>
      </div>
    </div>
  );

  const priorityCard = (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>우선순위별 완료율</p>
      {priorityBreakdown.map(({ priority, label, color, total, done, pct }) => (
        <div key={priority} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color }}>{label}</span>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--muted)' }}>{done}/{total}</span>
              <span className="font-bold tabular-nums w-8 text-right" style={{ color }}>{pct}%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );

  const categoryCard = categoryBreakdown.length > 0 && (
    <div className="rounded-2xl p-4 space-y-2.5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>카테고리별 현황</p>
      {categoryBreakdown.map(({ cat, total, done, rate }) => (
        <div key={cat} className="flex items-center gap-3">
          <span className="text-xs w-16 truncate flex-shrink-0" style={{ color: 'var(--muted)' }}>{cat}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rate}%`, background: 'var(--accent)' }} />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 w-16 justify-end">
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{done}/{total}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{rate}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  const gamiCard = (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>성장</p>
      {/* 레벨 + XP */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent), #7c7af8)' }}>
          {gami.level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{gami.rank}</span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{gami.xpInCurrentLevel}/{gami.xpToNextLevel} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${gami.progressPercent}%`, background: 'linear-gradient(90deg, var(--accent), #7c7af8)' }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Lv.{gami.level} · 총 {gami.totalXP} XP</p>
        </div>
      </div>
      {/* 배지 */}
      <div className="grid grid-cols-3 gap-2">
        {gami.achievements.map(a => (
          <div key={a.id}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
            style={{
              background: a.unlocked ? 'var(--accent-muted)' : 'var(--bg)',
              opacity: a.unlocked ? 1 : 0.4,
            }}
            title={a.description}
          >
            <span className="text-xl">{a.icon}</span>
            <span className="text-xs font-medium leading-tight" style={{ color: a.unlocked ? 'var(--text)' : 'var(--muted)' }}>{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>분석</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>할 일 완료 현황과 습관</p>
        </div>
        {summaryCards('grid-cols-2')}
        <div className="grid grid-cols-2 gap-3">
          {todayCard}
          {overdueCard}
        </div>
        {weeklyChart}
        {heatmap}
        {priorityCard}
        {categoryCard}
        {gamiCard}
      </div>

      {/* PC 웹 레이아웃 */}
      <div className="hidden md:flex h-full overflow-hidden">
        {/* 좌측 메인 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>분석</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>할 일 완료 현황과 습관</p>
          </div>
          <div className="mb-4">{summaryCards('grid-cols-4')}</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {todayCard}
            {overdueCard}
          </div>
          <div className="mb-4">{weeklyChart}</div>
          {heatmap}
        </div>

        {/* 우측 사이드 패널 */}
        <div className="w-72 flex-shrink-0 overflow-y-auto px-4 py-6 space-y-4"
          style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>상세 분석</p>
          {priorityCard}
          {categoryCard}
          {gamiCard}
        </div>
      </div>
    </>
  );
}
