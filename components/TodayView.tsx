'use client';

import { Todo } from '@/types/todo';
import TodoItem from './TodoItem';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGreeting } from '@/lib/greeting';

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
}

export default function TodayView({
  allTodos, onToggle, onUpdate, onDelete,
  onAddSubtask, onToggleSubtask, onDeleteSubtask, pomodoro, onOpenAdd, compact = false,
}: Props) {
  const { t, lang } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);

  const active = allTodos.filter(t =>
    !t.deletedAt && !t.completed && (t.dueDate === today || t.myDay)
  );
  const done = allTodos.filter(t =>
    !t.deletedAt && t.completed && (t.dueDate === today || t.myDay)
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

  const greeting = () => getGreeting(lang);
  const locale = lang === 'ko' ? 'ko-KR' : 'en-US';

  const total = active.length + done.length;
  const pct = total > 0 ? Math.round(done.length / total * 100) : 0;

  const todoList = (
    <>
      {active.length === 0 && done.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          {/* 일러스트 아이콘 */}
          <div className="relative mb-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, var(--accent-muted), var(--border))',
                boxShadow: '0 8px 24px rgba(99,102,241,0.12)',
              }}
            >
              <svg className="w-10 h-10" style={{ color: 'var(--accent)', opacity: 0.8 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {/* 작은 별 장식 */}
            <span className="absolute -top-1 -right-1 text-base">✨</span>
          </div>

          <p className="font-bold text-xl tracking-tight mb-2" style={{ color: 'var(--text)' }}>
            {t.today.empty}
          </p>
          <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--muted)', maxWidth: 220 }}>
            {greeting()}
          </p>
          <p className="text-xs mb-8" style={{ color: 'var(--muted)', opacity: 0.6 }}>
            {t.today.emptyDesc}
          </p>

          {/* 추가 버튼 */}
          {onOpenAdd && (
            <button
              onClick={onOpenAdd}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
              style={{ background: 'var(--accent)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t.todo.addTodayTodo}
            </button>
          )}

          {/* 빠른 팁 */}
          <p className="text-xs mt-6" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            {t.today.pinHint}
          </p>
        </div>
      ) : (
        <>
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
                  />
                  {todo.myDay && !todo.dueDate && (
                    <button
                      onClick={() => onUpdate(todo.id, { myDay: false })}
                      className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {t.today.pinRelease}
                    </button>
                  )}
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
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{greeting()}</p>
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

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-6">
        {header}
        {todoList}
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
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{greeting()}</span>

          {total > 0 && (
            <>
              <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--accent)' }} />
              </div>
              <span className="text-xs font-semibold tabular-nums flex-shrink-0"
                style={{ color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}>{pct}%</span>
            </>
          )}

          <div className="flex-1" />

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
                  <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
