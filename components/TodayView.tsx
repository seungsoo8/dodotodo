'use client';

import { useState, useRef, useEffect } from 'react';
import { Todo } from '@/types/todo';
import TodoItem from './TodoItem';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGreeting } from '@/lib/greeting';

interface FocusGroup { emoji: string; title: string; desc: string; todos: Todo[]; }

interface Props {
  allTodos: Todo[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  pomodoro: ReturnType<typeof usePomodoro>;
  onOpenAdd?: () => void;
  compact?: boolean;
  streak?: number;
  totalCompleted?: number;
}

export default function TodayView({
  allTodos, onToggle, onUpdate, onDelete,
  onAddSubtask, onToggleSubtask, onDeleteSubtask, pomodoro, onOpenAdd, compact = false,
  streak = 0, totalCompleted = 0,
}: Props) {
  const { t, lang } = useLanguage();
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

  const [focusGroup, setFocusGroup] = useState<FocusGroup | null>(null);

  function handleFocus() {
    const active = allTodos.filter(t => !t.deletedAt && !t.completed);
    if (!active.length) {
      setFocusGroup({ emoji: '🎉', title: '할 일이 없어요!', desc: '오늘은 여유롭게 쉬어도 좋아요.', todos: [] });
      return;
    }

    const tomorrow = (() => {
      const d = new Date(); d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    const overdue = active.filter(t => t.dueDate && t.dueDate < today);
    if (overdue.length) {
      setFocusGroup({ emoji: '⚠️', title: `마감 지난 일이 ${overdue.length}개 있어요`, desc: '지금 바로 처리하거나 마감일을 조정하세요.', todos: overdue });
      return;
    }

    const dueToday = active.filter(t => t.dueDate === today);
    if (dueToday.length) {
      setFocusGroup({ emoji: '📅', title: `오늘 마감이 ${dueToday.length}개예요`, desc: '오늘 안에 끝내야 해요.', todos: dueToday });
      return;
    }

    const dueTomorrow = active.filter(t => t.dueDate === tomorrow);
    if (dueTomorrow.length) {
      setFocusGroup({ emoji: '🌅', title: `내일 마감이 ${dueTomorrow.length}개예요`, desc: '오늘 시작하면 여유 있게 끝낼 수 있어요.', todos: dueTomorrow });
      return;
    }

    const highPriority = active.filter(t => t.priority === 'high');
    if (highPriority.length) {
      setFocusGroup({ emoji: '🔴', title: `우선순위 높은 일이 ${highPriority.length}개예요`, desc: '중요한 일부터 처리해요.', todos: highPriority });
      return;
    }

    // 그 외: 가장 최근에 만든 것 순으로 상위 3개
    const top = [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
    setFocusGroup({ emoji: '📋', title: '이 일들부터 시작해봐요', desc: '최근에 추가한 일들이에요.', todos: top });
  }

  const active = allTodos.filter(t =>
    !t.deletedAt && !t.completed && t.dueDate === today
  );
  const done = allTodos.filter(t =>
    !t.deletedAt && t.completed && t.dueDate === today
  );

  const recurringActive = active.filter(t => t.recurring && t.recurring !== 'none');
  const nonRecurringActive = active.filter(t => !t.recurring || t.recurring === 'none');

  const TIME_SLOTS = [
    { key: 'morning', label: t.today.timeSlots.morning, emoji: '☀️', hint: t.today.timeHints.morning, priorities: ['high'] as const },
    { key: 'afternoon', label: t.today.timeSlots.afternoon, emoji: '🌤', hint: t.today.timeHints.afternoon, priorities: ['medium'] as const },
    { key: 'evening', label: t.today.timeSlots.evening, emoji: '🌙', hint: t.today.timeHints.evening, priorities: ['low'] as const },
  ];

  const slotTodos = TIME_SLOTS.map(slot => ({
    ...slot,
    todos: nonRecurringActive.filter(t => (slot.priorities as readonly string[]).includes(t.priority)),
  }));

  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newTodoIds, setNewTodoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const allActive = [...active, ...done];
    const currentIds = new Set(allActive.map(t => t.id));
    if (prevIdsRef.current.size > 0) {
      const added = new Set<string>();
      currentIds.forEach(id => {
        if (!prevIdsRef.current.has(id)) added.add(id);
      });
      if (added.size > 0) {
        setNewTodoIds(added);
        setTimeout(() => setNewTodoIds(new Set()), 400);
      }
    }
    prevIdsRef.current = currentIds;
  }, [active, done]);

  const locale = lang === 'ko' ? 'ko-KR' : 'en-US';

  function getTimeGreeting(): { emoji: string; title: string; sub: string } {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return {
      emoji: '🌤',
      title: '좋은 아침이에요!',
      sub: '오늘 하루, 어떻게 채울까요?',
    };
    if (h >= 12 && h < 18) return {
      emoji: '☀️',
      title: '오후도 화이팅!',
      sub: '지금 뭘 해야 할지 정해볼까요?',
    };
    if (h >= 18 && h < 22) return {
      emoji: '🌇',
      title: '오늘 하루 어땠나요?',
      sub: '내일 할 일을 미리 담아봐요.',
    };
    return {
      emoji: '🌙',
      title: '이 시간엔 내일을 준비해요',
      sub: '조금 쉬면서 내일을 계획해봐요.',
    };
  }

  const timeGreeting = getTimeGreeting();

  const total = active.length + done.length;
  const pct = total > 0 ? Math.round(done.length / total * 100) : 0;

  // 시간대별 배너/버튼 색상 (focusCard에서도 사용)
  const [br, bg2, bb] = (() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return [245, 158, 11];
    if (h >= 12 && h < 18) return [99,  102, 241];
    if (h >= 18 && h < 22) return [139, 92,  246];
    return [79, 70, 229];
  })();

  const timeQuote = (() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return '좋은 일은 일찍 시작돼요 ✨';
    if (h >= 12 && h < 18) return '집중하면 뭐든 가능해요 ⚡';
    if (h >= 18 && h < 22) return '오늘 하루도 정말 수고했어요 🌇';
    return '고요한 밤, 내일을 미리 그려봐요 🌌';
  })();

  const focusCard = (
    <div>
      {focusGroup ? (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1.5px solid var(--accent)' }}>
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {focusGroup.emoji} {focusGroup.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{focusGroup.desc}</p>
            </div>
            <button onClick={() => setFocusGroup(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ml-2"
              style={{ background: 'var(--border)', color: 'var(--muted)', fontSize: 12 }}>×</button>
          </div>

          {/* 할일 목록 */}
          {focusGroup.todos.length > 0 && (
            <div className="mt-3 space-y-2">
              {focusGroup.todos.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  {/* 완료 체크 버튼 */}
                  <button
                    onClick={() => { onToggle(t.id); setFocusGroup(prev => prev ? { ...prev, todos: prev.todos.filter(x => x.id !== t.id) } : null); }}
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all active:scale-90"
                    style={{ border: '1.5px solid var(--border)', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-muted)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="var(--muted)" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#6366f1' }} />
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>{t.title}</span>
                  {t.dueDate && (
                    <span className="text-xs flex-shrink-0" style={{ color: t.dueDate < today ? '#ef4444' : 'var(--muted)' }}>
                      {t.dueDate === today ? '오늘' : t.dueDate < today ? `D+${Math.floor((new Date(today).getTime() - new Date(t.dueDate).getTime()) / 86400000)}` : t.dueDate.slice(5).replace('-', '/')}
                    </span>
                  )}
                  <button onClick={() => { pomodoro.selectTodo(t.id); setFocusGroup(null); }}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                    🍅
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative inline-flex">
          <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 pointer-events-none"
            style={{ background: `rgba(${br},${bg2},${bb},1)` }} />
          <button onClick={handleFocus}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: `rgba(${br},${bg2},${bb},0.1)`,
              color: `rgb(${br},${bg2},${bb})`,
              border: `1.5px solid rgba(${br},${bg2},${bb},0.35)`,
              boxShadow: `0 2px 16px rgba(${br},${bg2},${bb},0.2)`,
            }}>
            🎯 지금 뭐 해야 해?
          </button>
        </div>
      )}
    </div>
  );

  const todoList = (
    <>
      {active.length === 0 && done.length === 0 ? (
        <div className="flex flex-col items-center pt-10 pb-14 text-center px-2">

          {/* 시간대 이모지 */}
          <div className="text-5xl mb-4" style={{ lineHeight: 1 }}>{timeGreeting.emoji}</div>

          {/* 감성 타이틀 */}
          <p className="font-bold text-2xl tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            {timeGreeting.title}
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {timeGreeting.sub}
          </p>

          {/* 성취 통계 카드 */}
          {(streak > 0 || totalCompleted > 0) && (
            <div className="flex gap-3 mb-7">
              {totalCompleted > 0 && (
                <div className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{totalCompleted}</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>총 완료</span>
                </div>
              )}
              {streak > 0 && (
                <div className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>{streak}일</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>🔥 연속 중</span>
                </div>
              )}
            </div>
          )}

          {/* 포커스 카드 (expanded 상태일 때만 PC에서 표시) */}
          {focusGroup && (
            <div className="mb-3 w-full max-w-md text-left">
              {focusCard}
            </div>
          )}

          {/* 하루 계획 버튼 */}
          {onOpenAdd && (
            <button
              onClick={onOpenAdd}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
              style={{ background: 'var(--accent)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              ✏️ 오늘 하루 계획하기
            </button>
          )}

        </div>
      ) : (
        <>
          {/* AI 포커스 카드 (expanded 상태일 때만 PC에서 표시) */}
          {focusGroup && focusCard}

          {/* 오늘의 루틴 (반복 할 일) */}
          {recurringActive.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <span>🔄</span> {t.today.routine}
              </p>
              {recurringActive.map(todo => (
                <div key={todo.id} className="relative group">
                  <TodoItem
                    todo={todo}
                    compact={compact}
                    onToggle={onToggle}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onStartPomodoro={pomodoro.selectTodo}
                    isNew={newTodoIds.has(todo.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 시간대별 할 일 */}
          {nonRecurringActive.length > 0 && slotTodos.map(slot => slot.todos.length === 0 ? null : (
            <div key={slot.key} className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <span className="text-sm">{slot.emoji}</span>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {slot.label}
                </p>
                <span className="text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>— {slot.hint}</span>
              </div>
              {slot.todos.map(todo => (
                <div key={todo.id} className="relative group">
                  <TodoItem
                    todo={todo}
                    compact={compact}
                    onToggle={onToggle}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onStartPomodoro={pomodoro.selectTodo}
                    isNew={newTodoIds.has(todo.id)}
                  />
                </div>
              ))}
            </div>
          ))}

          {done.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-6 mb-2.5 px-1">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{t.status.completed} {done.length}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              {done.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  compact={compact}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddSubtask={onAddSubtask}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                />
              ))}
            </>
          )}
        </>
      )}
    </>
  );

  const header = (
    <div className="mb-5">
      <p className="text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        {new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'long' })}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{t.nav.today}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{timeGreeting.sub}</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <span className="text-2xl font-bold tabular-nums" style={{ color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}>
              {pct}%
            </span>
          </div>
        )}
      </div>
      {total > 0 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--accent)' }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const mobileBanner = (
    <div className="px-4 pt-4 max-w-2xl mx-auto w-full">
      <div className="rounded-2xl px-4 py-3 mb-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${br},${bg2},${bb},0.18) 0%, rgba(${br},${bg2},${bb},0.10) 100%)`,
          border: `1px solid rgba(${br},${bg2},${bb},0.22)`,
        }}>
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: `rgba(${br},${bg2},${bb},0.08)` }} />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: `rgba(${br},${bg2},${bb},0.18)` }}>
            {timeGreeting.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {timeGreeting.title}
            </p>
          </div>
          {total > 0 && (
            <span className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{ background: `rgba(${br},${bg2},${bb},0.18)`, color: `rgb(${br},${bg2},${bb})` }}>
              {done.length}<span className="font-normal opacity-60">/{total}</span>
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="mt-2.5">
            <div className="h-1 rounded-full overflow-hidden"
              style={{ background: `rgba(${br},${bg2},${bb},0.15)` }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `rgba(${br},${bg2},${bb},0.65)` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden flex flex-col">
        {mobileBanner}

        {active.length === 0 && done.length === 0 ? (
          /* 빈 상태: glow 배경 + 수직 중앙 정렬 */
          <div
            className="relative flex flex-col items-center justify-center px-6 gap-6 pb-10"
            style={{ minHeight: 'calc(100svh - 230px)' }}
          >
            {/* 배경 Glow Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[10%] left-[-10%] w-72 h-72 rounded-full"
                style={{ background: `radial-gradient(circle, rgba(${br},${bg2},${bb},0.18) 0%, transparent 70%)`, filter: 'blur(48px)' }} />
              <div className="absolute bottom-[10%] right-[-8%] w-60 h-60 rounded-full"
                style={{ background: `radial-gradient(circle, rgba(${br},${bg2},${bb},0.13) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
              <div className="absolute top-[45%] right-[5%] w-40 h-40 rounded-full"
                style={{ background: `radial-gradient(circle, rgba(${br},${bg2},${bb},0.08) 0%, transparent 70%)`, filter: 'blur(30px)' }} />
            </div>

            {/* 성취 통계 카드 */}
            {(streak > 0 || totalCompleted > 0) && (
              <div className="flex gap-3 relative">
                {totalCompleted > 0 && (
                  <div className="flex flex-col items-center px-6 py-4 rounded-2xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: `0 4px 20px rgba(${br},${bg2},${bb},0.08)` }}>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{totalCompleted}</span>
                    <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>총 완료</span>
                  </div>
                )}
                {streak > 0 && (
                  <div className="flex flex-col items-center px-6 py-4 rounded-2xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: `0 4px 20px rgba(${br},${bg2},${bb},0.08)` }}>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>{streak}일</span>
                    <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>🔥 연속 중</span>
                  </div>
                )}
              </div>
            )}

            {/* 시간대별 감성 문구 */}
            <p className="relative text-sm text-center tracking-wide"
              style={{ color: `rgba(${br},${bg2},${bb},0.7)` }}>
              {timeQuote}
            </p>

            <div className="relative">{focusCard}</div>

            {onOpenAdd && (
              <div className="relative w-full max-w-xs">
                <div className="absolute inset-0 rounded-2xl blur-lg animate-pulse pointer-events-none"
                  style={{ background: `linear-gradient(135deg, rgba(${br},${bg2},${bb},0.55), rgba(${br},${bg2},${bb},0.25))` }} />
                <button
                  onClick={onOpenAdd}
                  className="relative flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, rgb(${br},${bg2},${bb}) 0%, rgba(${br},${bg2},${bb},0.75) 100%)`,
                    boxShadow: `0 6px 28px rgba(${br},${bg2},${bb},0.45)`,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  ✏️ 오늘 하루 계획하기
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 할일 있음 */
          <div className="px-4 pb-6 max-w-2xl mx-auto w-full">
            <div className="mb-4">{focusCard}</div>

            {recurringActive.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  <span>🔄</span> {t.today.routine}
                </p>
                {recurringActive.map(todo => (
                  <div key={todo.id} className="relative group">
                    <TodoItem todo={todo} compact={compact} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete}
                      onAddSubtask={onAddSubtask} onToggleSubtask={onToggleSubtask} onDeleteSubtask={onDeleteSubtask}
                      onStartPomodoro={pomodoro.selectTodo} isNew={newTodoIds.has(todo.id)} />
                  </div>
                ))}
              </div>
            )}

            {nonRecurringActive.length > 0 && slotTodos.map(slot => slot.todos.length === 0 ? null : (
              <div key={slot.key} className="mb-4">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="text-sm">{slot.emoji}</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{slot.label}</p>
                  <span className="text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>— {slot.hint}</span>
                </div>
                {slot.todos.map(todo => (
                  <div key={todo.id} className="relative group">
                    <TodoItem todo={todo} compact={compact} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete}
                      onAddSubtask={onAddSubtask} onToggleSubtask={onToggleSubtask} onDeleteSubtask={onDeleteSubtask}
                      onStartPomodoro={pomodoro.selectTodo} isNew={newTodoIds.has(todo.id)} />
                  </div>
                ))}
              </div>
            ))}

            {done.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-6 mb-2.5 px-1">
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{t.status.completed} {done.length}</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>
                {done.map(todo => (
                  <TodoItem key={todo.id} todo={todo} compact={compact} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete}
                    onAddSubtask={onAddSubtask} onToggleSubtask={onToggleSubtask} onDeleteSubtask={onDeleteSubtask} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* PC 웹 레이아웃 */}
      <div className="hidden md:flex flex-col h-full overflow-hidden">

        {/* ① 상단 툴바 */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-5 h-12"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.nav.today}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' })}
          </span>
          {total > 0 ? (
            <>
              <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--accent)' }} />
              </div>
              <span className="text-xs font-semibold tabular-nums flex-shrink-0"
                style={{ color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}>{pct}%</span>
            </>
          ) : (
            <div className="flex-1" />
          )}

          {/* 지금 뭐 해야 해? 버튼 — PC 툴바 우측 */}
          <div className="flex-shrink-0">
            {focusGroup ? (
              <button
                onClick={() => setFocusGroup(null)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium"
                style={{ color: 'var(--muted)', background: 'var(--border)' }}
              >
                🎯 포커스 닫기 ×
              </button>
            ) : (
              <div className="relative inline-flex">
                <span
                  className="absolute inset-0 rounded-xl animate-ping opacity-20 pointer-events-none"
                  style={{ background: `rgba(${br},${bg2},${bb},1)` }}
                />
                <button
                  onClick={handleFocus}
                  className="relative flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: `rgba(${br},${bg2},${bb},0.1)`,
                    color: `rgb(${br},${bg2},${bb})`,
                    border: `1.5px solid rgba(${br},${bg2},${bb},0.3)`,
                    boxShadow: `0 2px 10px rgba(${br},${bg2},${bb},0.15)`,
                  }}
                >
                  🎯 지금 뭐 해야 해?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ② 본문: 좌(목록) + 우(통계) */}
        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽: 컴팩트 목록 */}
          <div className="flex-1 overflow-y-auto">
            {todoList}
          </div>

          {/* 오른쪽: 통계 패널 */}
          <div
            className="w-60 flex-shrink-0 overflow-y-auto p-5"
            style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>{t.today.summary}</p>

            {/* 진행률 링 */}
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-20 h-20" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="33" fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="33" fill="none"
                    stroke={pct === 100 ? 'var(--success)' : 'var(--accent)'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 33}`}
                    strokeDashoffset={`${2 * Math.PI * 33 * (1 - pct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold tabular-nums" style={{ color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}>{pct}%</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center mb-4" style={{ color: 'var(--muted)' }}>
              {total > 0 ? t.today.completedOf(done.length, total) : t.today.emptyDesc}
            </p>

            {/* 통계 3단 */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {[
                { label: t.today.remaining, value: active.length, color: 'var(--accent)' },
                { label: t.status.completed, value: done.length, color: 'var(--success)' },
                { label: t.today.routine, value: recurringActive.length, color: 'var(--warning)' },
              ].map(s => (
                <div key={s.label} className="rounded-xl py-2 px-1 flex flex-col items-center"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <span className="text-base font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="mt-0.5 whitespace-nowrap" style={{ color: 'var(--muted)', fontSize: 10 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
