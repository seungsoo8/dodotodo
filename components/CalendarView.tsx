'use client';

import { useState, useRef, useCallback } from 'react';
import { Todo } from '@/types/todo';

interface CalendarViewProps {
  allTodos: Todo[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
}

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** UTC 변환 없이 로컬 날짜를 YYYY-MM-DD 문자열로 변환 */
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarView({ allTodos, onToggle, onUpdate }: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const dragTodoIdRef = useRef('');
  const touchGhostRef = useRef<HTMLDivElement | null>(null);

  function handleDragStart(todoId: string) {
    dragTodoIdRef.current = todoId;
  }

  function handleDrop(targetDate: string) {
    if (dragTodoIdRef.current) {
      onUpdate(dragTodoIdRef.current, { dueDate: targetDate });
      dragTodoIdRef.current = '';
    }
    setDragOverDate(null);
  }

  const handleTouchDragStart = useCallback((e: React.TouchEvent, todoId: string, title: string) => {
    e.stopPropagation();
    dragTodoIdRef.current = todoId;

    const ghost = document.createElement('div');
    ghost.textContent = title;
    ghost.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;padding:4px 10px;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;opacity:0.9;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;';
    document.body.appendChild(ghost);
    touchGhostRef.current = ghost;

    const touch = e.touches[0];
    ghost.style.left = `${touch.clientX + 12}px`;
    ghost.style.top = `${touch.clientY - 24}px`;
  }, []);

  const handleTouchDragMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];

    if (touchGhostRef.current) {
      touchGhostRef.current.style.left = `${touch.clientX + 12}px`;
      touchGhostRef.current.style.top = `${touch.clientY - 24}px`;
      touchGhostRef.current.style.display = 'none';
    }
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (touchGhostRef.current) touchGhostRef.current.style.display = '';

    const cell = el?.closest('[data-date]') as HTMLElement | null;
    setDragOverDate(cell?.dataset.date ?? null);
  }, []);

  const handleTouchDragEnd = useCallback(() => {
    if (touchGhostRef.current) {
      document.body.removeChild(touchGhostRef.current);
      touchGhostRef.current = null;
    }
    if (dragOverDate && dragTodoIdRef.current) {
      onUpdate(dragTodoIdRef.current, { dueDate: dragOverDate });
    }
    dragTodoIdRef.current = '';
    setDragOverDate(null);
  }, [dragOverDate, onUpdate]);

  const todayStr = localDateStr(now);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - startPad + 1;
    if (day < 1 || day > lastDay.getDate()) return null;
    return new Date(year, month, day);
  });

  function todosForDate(ds: string) {
    return allTodos.filter(t => t.dueDate === ds);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const selectedTodos = selectedDate ? todosForDate(selectedDate) : [];

  const calendarGrid = (compact?: boolean) => (
    <div className={`rounded-2xl overflow-hidden border`} style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold"
            style={{ color: i === 0 ? '#ef4444' : i === 6 ? 'var(--accent)' : 'var(--muted)' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className={`border-b border-r ${compact ? 'min-h-[72px]' : 'min-h-[88px]'}`}
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', opacity: 0.4 }} />;
          }
          const ds = localDateStr(date);
          const dayTodos = todosForDate(ds);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const isPast = ds < todayStr;
          const isSun = date.getDay() === 0;
          const isSat = date.getDay() === 6;
          return (
            <div key={ds}
              data-date={ds}
              className={`${compact ? 'min-h-[72px]' : 'min-h-[88px]'} p-2 text-left border-b border-r flex flex-col cursor-pointer transition-colors`}
              style={{
                borderColor: 'var(--border)',
                background: dragOverDate === ds ? 'var(--accent-muted)' : isSelected ? 'var(--accent-muted)' : 'transparent',
                outline: dragOverDate === ds ? '2px solid var(--accent)' : 'none',
                outlineOffset: '-2px',
              }}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              onMouseEnter={e => { if (!isSelected && dragOverDate !== ds) e.currentTarget.style.background = 'var(--card-hover)'; }}
              onMouseLeave={e => { if (!isSelected && dragOverDate !== ds) e.currentTarget.style.background = 'transparent'; }}
              onDragOver={e => { e.preventDefault(); setDragOverDate(ds); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={e => { e.preventDefault(); handleDrop(ds); }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1.5"
                style={{ background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? '#fff' : isSun ? '#ef4444' : isSat ? 'var(--accent)' : isPast ? 'var(--muted)' : 'var(--text)' }}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5 flex-1">
                {dayTodos.slice(0, compact ? 2 : 3).map(todo => (
                  <div key={todo.id}
                    draggable
                    onDragStart={e => { e.stopPropagation(); handleDragStart(todo.id); }}
                    onTouchStart={e => handleTouchDragStart(e, todo.id, todo.title)}
                    onTouchMove={handleTouchDragMove}
                    onTouchEnd={handleTouchDragEnd}
                    className="text-xs px-1.5 py-0.5 rounded truncate leading-tight cursor-grab active:cursor-grabbing"
                    style={{ background: `${PRIORITY_COLORS[todo.priority]}20`, color: todo.completed ? 'var(--muted)' : PRIORITY_COLORS[todo.priority], textDecoration: todo.completed ? 'line-through' : 'none', borderLeft: `2px solid ${PRIORITY_COLORS[todo.priority]}`, touchAction: 'none' }}>
                    {todo.title}
                  </div>
                ))}
                {dayTodos.length > (compact ? 2 : 3) && (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>+{dayTodos.length - (compact ? 2 : 3)}개</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const selectedPanel = (
    <div className="h-full flex flex-col">
      {selectedDate ? (
        <>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          {selectedTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--accent-muted)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>이 날짜에 할 일이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {selectedTodos.map(todo => (
                <div key={todo.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg)', borderLeft: `3px solid ${PRIORITY_COLORS[todo.priority]}` }}>
                  <button onClick={() => onToggle(todo.id)}
                    className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                    style={{ background: todo.completed ? 'var(--accent)' : 'transparent', borderColor: todo.completed ? 'var(--accent)' : 'var(--border)' }}>
                    {todo.completed && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug"
                      style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)', textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.title}
                    </p>
                    {todo.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{todo.description}</p>}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ color: PRIORITY_COLORS[todo.priority], background: `${PRIORITY_COLORS[todo.priority]}18` }}>
                    {todo.priority === 'high' ? '높음' : todo.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--accent-muted)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>날짜를 선택하세요</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>해당 날짜의 할 일을 확인합니다</p>
        </div>
      )}
    </div>
  );

  const navControls = (
    <div className="flex items-center gap-2">
      <button onClick={prevMonth} className="p-2 rounded-lg transition-colors hover:opacity-70"
        style={{ color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-base font-semibold w-32 text-center" style={{ color: 'var(--text)' }}>
        {year}년 {month + 1}월
      </span>
      <button onClick={nextMonth} className="p-2 rounded-lg transition-colors hover:opacity-70"
        style={{ color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden w-full px-4 py-6 mx-auto" style={{ maxWidth: 640 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>캘린더</h1>
          {navControls}
        </div>
        {calendarGrid()}
        {selectedDate && (
          <div className="mt-4 rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {selectedPanel}
          </div>
        )}
      </div>

      {/* PC 웹 레이아웃: 좌(캘린더) + 우(선택 날짜 패널) */}
      <div className="hidden md:flex h-full overflow-hidden">
        {/* 좌측: 캘린더 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>캘린더</h1>
            {navControls}
          </div>
          {calendarGrid(true)}
        </div>

        {/* 우측: 선택 날짜 패널 */}
        <div className="w-72 flex-shrink-0 overflow-y-auto px-5 py-6"
          style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
            {selectedDate
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
              : '날짜 상세'}
          </p>
          {selectedPanel}
        </div>
      </div>
    </>
  );
}
